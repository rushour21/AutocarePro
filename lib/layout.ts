import type { Bay, BayType, Fixture, FixtureKind, Job, WorkshopLayout } from './types';

/* ------------------------------------------------------------------ catalogues */
export const BAY_TYPES: { key: BayType; label: string; color: string }[] = [
  { key: 'general', label: 'General Service', color: '#d84a27' },
  { key: 'inspection', label: 'Inspection', color: '#5f8fb8' },
  { key: 'diagnostics', label: 'Diagnostics', color: '#7d86b5' },
  { key: 'tyre', label: 'Tyre Service', color: '#248a6c' },
  { key: 'quality', label: 'Quality Check', color: '#c9a24a' },
  { key: 'detailing', label: 'Detailing & PPF', color: '#b5718f' },
  { key: 'wash', label: 'Wash Area', color: '#6fa9b8' },
];
export const bayType = (k: BayType) => BAY_TYPES.find((t) => t.key === k) ?? BAY_TYPES[0];

export const EQUIPMENT: { key: string; label: string }[] = [
  { key: 'two_post_lift', label: 'Two-post lift' },
  { key: 'diagnostic_tools', label: 'Diagnostic tools' },
  { key: 'tool_cabinet', label: 'Tool cabinet' },
  { key: 'wheel_balancer', label: 'Wheel balancer' },
  { key: 'tyre_changer', label: 'Tyre changer' },
  { key: 'air_compressor', label: 'Air compressor' },
];
export const equipmentLabel = (k: string) => EQUIPMENT.find((e) => e.key === k)?.label ?? k;

export const FIXTURE_KINDS: { key: FixtureKind; label: string; w: number; h: number }[] = [
  { key: 'reception', label: 'Reception desk', w: 5, h: 3 },
  { key: 'parts', label: 'Parts storage', w: 5, h: 7 },
  { key: 'lounge', label: 'Customer lounge', w: 5, h: 4 },
  { key: 'cabinet', label: 'Tool cabinet', w: 1.2, h: 0.8 },
  { key: 'entrance', label: 'Entrance', w: 0.6, h: 3 },
];

/* ------------------------------------------------------------------ geometry */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** the rectangle a bay occupies on the plan (its width/length swap when rotated 90°) */
export const bayRect = (b: Pick<Bay, 'x' | 'y' | 'w' | 'l' | 'rot'>): Rect => (b.rot === 90 ? { x: b.x, y: b.y, w: b.l, h: b.w } : { x: b.x, y: b.y, w: b.w, h: b.l });
export const fixtureRect = (f: Fixture): Rect => ({ x: f.x, y: f.y, w: f.w, h: f.h });

export const snap = (v: number, grid: number) => Math.round(v / grid) * grid;
/** avoid 4.5000000001 style artefacts after snapping / arithmetic */
export const r2 = (v: number) => Math.round(v * 100) / 100;

export const overlaps = (a: Rect, b: Rect, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;

export const inside = (r: Rect, w: number, h: number) => r.x >= -1e-6 && r.y >= -1e-6 && r.x + r.w <= w + 1e-6 && r.y + r.h <= h + 1e-6;

/** the largest plan rectangle a bay centre can sit in; used to clamp drags */
export function clampRect(r: Rect, w: number, h: number): Rect {
  return { ...r, x: Math.min(Math.max(0, r.x), Math.max(0, w - r.w)), y: Math.min(Math.max(0, r.y), Math.max(0, h - r.h)) };
}

/* ------------------------------------------------------------------ validation */
export interface LayoutIssue {
  level: 'error' | 'warning';
  /** ids of the bays / fixtures the issue is about */
  ids: string[];
  message: string;
}

export const LIMITS = { minDim: 6, maxDim: 80, minWall: 3, maxWall: 12, minBay: 2, maxBay: 12 };
/** minimum clear distance between two bays (m) */
export const MIN_GAP = 0.3;

export function validateLayout(layout: WorkshopLayout): LayoutIssue[] {
  const out: LayoutIssue[] = [];
  const { plan, bays, fixtures } = layout;
  if (!(plan.w >= LIMITS.minDim && plan.w <= LIMITS.maxDim && plan.h >= LIMITS.minDim && plan.h <= LIMITS.maxDim)) out.push({ level: 'error', ids: [], message: `Workshop width and length must be between ${LIMITS.minDim} m and ${LIMITS.maxDim} m.` });
  if (!(plan.wallH >= LIMITS.minWall && plan.wallH <= LIMITS.maxWall)) out.push({ level: 'error', ids: [], message: `Wall height must be between ${LIMITS.minWall} m and ${LIMITS.maxWall} m.` });
  if (![0.25, 0.5, 1].includes(plan.grid)) out.push({ level: 'error', ids: [], message: 'Grid spacing must be 0.25, 0.5 or 1 m.' });

  const names = new Map<string, string>();
  const ids = new Set<string>();
  bays.forEach((b) => {
    if (ids.has(b.id)) out.push({ level: 'error', ids: [b.id], message: `Duplicate bay id ${b.id}.` });
    ids.add(b.id);
    if (!b.name.trim()) out.push({ level: 'error', ids: [b.id], message: 'Every bay needs a name.' });
    const key = b.name.trim().toLowerCase();
    if (key && names.has(key)) out.push({ level: 'error', ids: [b.id, names.get(key)!], message: `Two bays are called "${b.name.trim()}".` });
    names.set(key, b.id);
    if (!(b.w >= LIMITS.minBay && b.w <= LIMITS.maxBay && b.l >= LIMITS.minBay && b.l <= LIMITS.maxBay)) out.push({ level: 'error', ids: [b.id], message: `${b.name}: width and length must be between ${LIMITS.minBay} m and ${LIMITS.maxBay} m.` });
    if (!inside(bayRect(b), plan.w, plan.h)) out.push({ level: 'error', ids: [b.id], message: `${b.name} is outside the workshop.` });
  });
  fixtures.forEach((f) => {
    if (!inside(fixtureRect(f), plan.w, plan.h)) out.push({ level: 'error', ids: [f.id], message: `${f.name} is outside the workshop.` });
  });
  for (let i = 0; i < bays.length; i++) {
    for (let j = i + 1; j < bays.length; j++) {
      const a = bays[i], b = bays[j];
      if (overlaps(bayRect(a), bayRect(b))) out.push({ level: 'error', ids: [a.id, b.id], message: `${a.name} overlaps ${b.name}.` });
      else if (overlaps(bayRect(a), bayRect(b), MIN_GAP)) out.push({ level: 'warning', ids: [a.id, b.id], message: `${a.name} and ${b.name} are closer than ${MIN_GAP} m.` });
    }
    fixtures.forEach((f) => {
      if (f.kind === 'entrance') return;
      if (overlaps(bayRect(bays[i]), fixtureRect(f))) out.push({ level: 'error', ids: [bays[i].id, f.id], message: `${bays[i].name} overlaps ${f.name}.` });
    });
  }
  return out;
}
export const hasErrors = (issues: LayoutIssue[]) => issues.some((i) => i.level === 'error');

/* ------------------------------------------------------------------ helpers */
/** first free spot (scanning the grid) for a rectangle, or undefined if the workshop is full */
export function findFreeSpot(layout: WorkshopLayout, w: number, h: number): { x: number; y: number } | undefined {
  const { plan } = layout;
  const step = Math.max(plan.grid, 0.5);
  const others = [...layout.bays.map(bayRect), ...layout.fixtures.filter((f) => f.kind !== 'entrance').map(fixtureRect)];
  for (let y = 0; y + h <= plan.h + 1e-6; y = r2(y + step))
    for (let x = 0; x + w <= plan.w + 1e-6; x = r2(x + step)) {
      const r = { x, y, w, h };
      if (!others.some((o) => overlaps(r, o, MIN_GAP))) return { x, y };
    }
  return undefined;
}

let seq = 0;
export const newId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

/** next unused "Bay N" name */
export function nextBayName(bays: Bay[]) {
  const used = new Set(bays.map((b) => b.name.trim().toLowerCase()));
  for (let n = bays.length + 1; ; n++) if (!used.has(`bay ${n}`)) return `Bay ${n}`;
}

export type BayStatus = 'in_use' | 'available' | 'maintenance' | 'reserved' | 'inactive';
export const BAY_STATUS_LABEL: Record<BayStatus, string> = { in_use: 'In Use', available: 'Available', maintenance: 'Maintenance', reserved: 'Reserved', inactive: 'Inactive' };

/** occupancy is derived from the jobs, never stored on the bay */
export const occupantOf = (jobs: Job[], bayId: string) => jobs.find((j) => j.bayId === bayId && j.stage !== 'delivered');
export function bayStatus(bay: Bay, jobs: Job[]): BayStatus {
  if (!bay.active) return 'inactive';
  if (occupantOf(jobs, bay.id)) return 'in_use';
  if (bay.state === 'maintenance') return 'maintenance';
  if (bay.state === 'reserved') return 'reserved';
  return 'available';
}

export const cloneLayout = (l: WorkshopLayout): WorkshopLayout => structuredClone({ plan: l.plan, bays: l.bays, fixtures: l.fixtures });
export const sameLayout = (a: WorkshopLayout, b: WorkshopLayout) => JSON.stringify({ plan: a.plan, bays: a.bays, fixtures: a.fixtures }) === JSON.stringify({ plan: b.plan, bays: b.bays, fixtures: b.fixtures });
