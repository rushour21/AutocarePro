'use client';

import clsx from 'clsx';
import { Maximize2, Minimize2, Wrench } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { assignBay, setJobStage } from '@/lib/actions';
import { vehicleOf, userOf, STAGE_LABEL, STAGE_TONE, vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Bay, Job, Stage } from '@/lib/types';
import { Button, EmptyState, Modal, Select, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { CAR_COLOR, CarTopShapes, shade } from './CarTop';

/* ------------------------------------------------------------------ isometric projection */
const S = 0.62;
const C = 0.866;
const SN = 0.5;
const OX = 352;
const OY = 98;
const VIEW_W = 920;
const VIEW_H = 628;
const P = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * C * S, OY + (x + y) * SN * S - z * S];
const pts = (...ps: [number, number][]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

function box(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number) {
  return {
    top: pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)),
    left: pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)),
    right: pts(P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)),
    // quads for glass insets: [tl, tr, br, bl]
    leftQ: [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)] as [number, number][],
    rightQ: [P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)] as [number, number][],
  };
}
const lerp2 = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** sub-quad of a face in (u,v) in 0..1 — u along tl→tr, v along tl→bl */
function sub(q: [number, number][], u0: number, u1: number, v0: number, v1: number) {
  const at = (u: number, v: number) => lerp2(lerp2(q[0], q[1], u), lerp2(q[3], q[2], u), v);
  return pts(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1));
}

function Car3D({ cx, cy, color, orient, ghost, ring }: { cx: number; cy: number; color: string; orient: 'x' | 'y'; ghost?: boolean; ring?: boolean }) {
  const L = 150, W = 68;
  const [lx, ly] = orient === 'x' ? [L, W] : [W, L];
  const x0 = cx - lx / 2, x1 = cx + lx / 2, y0 = cy - ly / 2, y1 = cy + ly / 2;
  const body = box(x0, y0, x1, y1, 9, 30);
  // cabin sits slightly behind the middle
  const [cx0, cx1, cy0, cy1] = orient === 'x'
    ? [x0 + lx * 0.2, x0 + lx * 0.62, y0 + ly * 0.1, y1 - ly * 0.1]
    : [x0 + lx * 0.1, x1 - lx * 0.1, y0 + ly * 0.2, y0 + ly * 0.62];
  const cab = box(cx0, cy0, cx1, cy1, 30, 50);
  const top = shade(color, 0.16), left = color, right = shade(color, -0.16);
  const wheels = (orient === 'x'
    ? [[x0 + 24, y0 - 2], [x1 - 40, y0 - 2], [x0 + 24, y1 - 10], [x1 - 40, y1 - 10]]
    : [[x0 - 2, y0 + 24], [x0 - 2, y1 - 40], [x1 - 10, y0 + 24], [x1 - 10, y1 - 40]]
  ).map(([wx, wy]) => (orient === 'x' ? box(wx, wy, wx + 20, wy + 12, 0, 16) : box(wx, wy, wx + 12, wy + 20, 0, 16)));
  const op = ghost ? 0.78 : 1;
  const glass = 'url(#glass3d)';
  const noseQ = orient === 'x' ? body.rightQ : body.leftQ;
  return (
    <g opacity={op}>
      <polygon points={pts(P(x0 - 6, y0 - 6, 0), P(x1 + 6, y0 - 6, 0), P(x1 + 6, y1 + 6, 0), P(x0 - 6, y1 + 6, 0))} fill="#6f5a41" opacity="0.18" />
      {ring && <polygon points={pts(P(x0 - 14, y0 - 14, 1), P(x1 + 14, y0 - 14, 1), P(x1 + 14, y1 + 14, 1), P(x0 - 14, y1 + 14, 1))} fill="rgba(242,106,46,0.16)" stroke="#f26a2e" strokeWidth="3" />}
      {wheels.map((w, i) => (
        <g key={i}>
          <polygon points={w.top} fill="#2a2b2e" />
          <polygon points={w.left} fill="#1b1c1e" />
          <polygon points={w.right} fill="#111214" />
        </g>
      ))}
      <polygon points={body.left} fill={left} />
      <polygon points={body.right} fill={right} />
      <polygon points={body.top} fill={top} stroke={shade(color, -0.1)} strokeWidth="0.4" />
      {/* headlights on the nose */}
      <polygon points={sub(noseQ, 0.08, 0.3, 0.2, 0.5)} fill="#fff6d6" stroke="#d8c9a0" strokeWidth="0.4" />
      <polygon points={sub(noseQ, 0.7, 0.92, 0.2, 0.5)} fill="#fff6d6" stroke="#d8c9a0" strokeWidth="0.4" />
      <polygon points={cab.left} fill={left} />
      <polygon points={cab.right} fill={right} />
      <polygon points={sub(cab.leftQ, 0.06, 0.94, 0.16, 0.86)} fill={glass} />
      <polygon points={sub(cab.rightQ, 0.08, 0.92, 0.16, 0.86)} fill={glass} />
      <polygon points={cab.top} fill={shade(color, 0.22)} stroke={shade(color, -0.1)} strokeWidth="0.4" />
    </g>
  );
}

/* ------------------------------------------------------------------ view */
const GROUPS: Stage[] = ['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'];
const STAGE_COLOR: Record<Stage, string> = { pending: '#e5482d', inspection: '#2f6bff', diagnostics: '#7456f0', in_repair: '#f26a2e', quality_check: '#ee8a12', ready: '#1d9d65', delivered: '#1d9d65' };

export interface WorkshopLiveViewProps {
  mode: 'admin' | 'tech' | 'customer';
  variant?: 'full' | 'compact' | 'cover';
  /** the signed-in technician (tech) or the customer's job to highlight (customer) */
  userId?: string;
  highlightJobId?: string;
  hrefFor?: (job: Job) => string | undefined;
  defaultView?: '2d' | '3d';
  className?: string;
  overlay?: React.ReactNode;
  /** short, wide banner with a Live badge + subtitle (admin dashboard) */
  wide?: boolean;
}

export function WorkshopLiveView({ mode, variant = 'full', userId, highlightJobId, hrefFor, defaultView = '3d', className, overlay, wide }: WorkshopLiveViewProps) {
  const db = useDb();
  const toast = useToast();
  const id = useId().replace(/:/g, '');
  const wrap = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'2d' | '3d'>(defaultView);
  const [hover, setHover] = useState<string | null>(null);
  const [openBay, setOpenBay] = useState<Bay | null>(null);
  const [full, setFull] = useState(false);
  const [pick, setPick] = useState('');
  const bays = db.garage.bays;
  const plan = db.garage.plan;

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const occupant = (b: Bay) => db.jobs.find((j) => j.bayId === b.id && j.stage !== 'delivered');
  const unassigned = db.jobs.filter((j) => !j.bayId && j.stage !== 'delivered' && j.stage !== 'pending');
  const known = (j: Job) => mode === 'admin' || mode === 'tech' || j.id === highlightJobId;

  const groups = useMemo(
    () =>
      GROUPS.map((stage) => {
        const inStage = bays.filter((b) => occupant(b)?.stage === stage);
        return { stage, bays: inStage };
      }).filter((g) => g.bays.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.jobs, bays],
  );

  const interactive = mode !== 'customer';
  const bayCenter = (b: Bay) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const place = (x: number, y: number, z = 0): { l: number; t: number } => {
    if (view === '2d') return { l: (x / plan.w) * 100, t: (y / plan.h) * 100 };
    const [px, py] = P(x, y, z);
    return { l: (px / VIEW_W) * 100, t: (py / VIEW_H) * 100 };
  };

  // bubbles (stage summaries), nudged apart if they would overlap
  const bubbles = useMemo(() => {
    const out = groups.map((g) => {
      const cx = g.bays.reduce((s, b) => s + bayCenter(b).x, 0) / g.bays.length;
      const cy = g.bays.reduce((s, b) => s + bayCenter(b).y, 0) / g.bays.length;
      const { l, t } = place(cx, cy, view === '3d' ? 58 : 0);
      return { stage: g.stage, count: g.bays.length, l, t };
    });
    for (let i = 0; i < out.length; i++)
      for (let j = 0; j < i; j++) if (Math.abs(out[i].l - out[j].l) < 17 && Math.abs(out[i].t - out[j].t) < 14) out[i].t -= 15;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, view, plan.w, plan.h]);

  const orientOf = (b: Bay) => (Number(b.id.replace('bay-', '')) % 2 === 0 ? 'y' : 'x') as 'x' | 'y';
  const colorOf = (j: Job) => {
    const v = vehicleOf(db, j.vehicleId);
    return known(j) && v ? CAR_COLOR[v.carKey] : '#a9a39a';
  };

  const onBay = (b: Bay) => {
    if (!interactive) return;
    setPick('');
    setOpenBay(b);
  };
  const bayLabel = (b: Bay) => {
    const j = occupant(b);
    const v = j && known(j) ? vehicleOf(db, j.vehicleId) : undefined;
    return `${b.name}: ${j ? (v ? `${vehicleName(v)}, ${STAGE_LABEL[j.stage]}` : 'occupied') : 'empty'}`;
  };

  /* ---------------- scenes ---------------- */
  const scene2d = (
    <svg viewBox={`0 0 ${plan.w} ${plan.h}`} className="h-full w-full" role="img" aria-label="Workshop floor plan">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe8dd" />
          <stop offset="1" stopColor="#e1d8ca" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={plan.w} height={plan.h} rx="26" fill={`url(#${id}f)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`v${i}`} x1={(i + 1) * 100} y1="14" x2={(i + 1) * 100} y2={plan.h - 14} stroke="#d4c9b9" strokeWidth="1" opacity="0.6" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`h${i}`} x1="14" y1={(i + 1) * 100} x2={plan.w - 14} y2={(i + 1) * 100} stroke="#d4c9b9" strokeWidth="1" opacity="0.6" />
      ))}
      {/* entrance + reception */}
      <rect x="430" y={plan.h - 14} width="140" height="14" rx="4" fill="#cfc3b0" />
      <text x="500" y={plan.h - 22} textAnchor="middle" fontSize="15" fill="#9a8f7e" fontWeight="600">ENTRANCE</text>
      <rect x="760" y="548" width="210" height="40" rx="12" fill="#d9c9ae" stroke="#c9b693" />
      <text x="865" y="574" textAnchor="middle" fontSize="16" fill="#7a6a4f" fontWeight="600">Reception</text>
      {[[40, 560], [60, 40], [950, 40]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="22" fill="#3f8a55" opacity="0.9" />
          <circle cx={x - 6} cy={y - 6} r="12" fill="#58a56d" />
        </g>
      ))}
      {bays.map((b) => {
        const j = occupant(b);
        const { x: cx, y: cy } = bayCenter(b);
        const isHover = hover === b.id;
        const mine = j && j.id === highlightJobId;
        return (
          <g
            key={b.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={bayLabel(b)}
            onClick={() => onBay(b)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onBay(b))}
            onMouseEnter={() => setHover(b.id)}
            onMouseLeave={() => setHover(null)}
            className={clsx(interactive && 'cursor-pointer outline-none')}
          >
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="14" fill={isHover ? 'rgba(242,106,46,0.16)' : 'rgba(255,255,255,0.45)'} stroke={mine ? '#f26a2e' : '#f0b44a'} strokeWidth={mine ? 5 : 3} strokeDasharray={mine ? undefined : '14 9'} />
            {b.lift && (
              <>
                <rect x={b.x + 12} y={b.y + 18} width="10" height={b.h - 36} rx="4" fill="#2f6bff" opacity="0.8" />
                <rect x={b.x + b.w - 22} y={b.y + 18} width="10" height={b.h - 36} rx="4" fill="#2f6bff" opacity="0.8" />
              </>
            )}
            {j && (
              <g transform={`translate(${cx} ${cy}) rotate(${orientOf(b) === 'x' ? -90 : 0}) scale(0.58) translate(-50 -125)`} opacity={known(j) || mode === 'customer' ? 1 : 0.9}>
                <CarTopShapes color={colorOf(j)} idPrefix={`${id}${b.id}`} />
              </g>
            )}
            <rect x={b.x + 8} y={b.y + 8} width="74" height="26" rx="13" fill="#fffaf4" stroke="#eadfce" />
            <circle cx={b.x + 22} cy={b.y + 21} r="5" fill={j ? STAGE_COLOR[j.stage] : '#cdbfa9'} />
            <text x={b.x + 33} y={b.y + 26} fontSize="14" fontWeight="600" fill="#55565a">{b.name}</text>
            {j && (
              <text x={cx} y={b.y + b.h - 10} textAnchor="middle" fontSize="14" fontWeight="600" fill={STAGE_COLOR[j.stage]}>
                {STAGE_LABEL[j.stage]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );

  const scene3d = (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full" role="img" aria-label="Workshop isometric preview">
      <defs>
        <linearGradient id="glass3d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a525e" />
          <stop offset="1" stopColor="#1e2228" />
        </linearGradient>
        <linearGradient id={`${id}fl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ebe4d8" />
          <stop offset="1" stopColor="#d8cfc0" />
        </linearGradient>
        <linearGradient id={`${id}win`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#f2dfbd" />
        </linearGradient>
      </defs>
      {/* walls */}
      <polygon points={pts(P(0, 0, 0), P(plan.w, 0, 0), P(plan.w, 0, 150), P(0, 0, 150))} fill="#e6dccd" />
      <polygon points={pts(P(0, 0, 0), P(0, plan.h, 0), P(0, plan.h, 150), P(0, 0, 150))} fill="#efe6d9" />
      {[0, 1, 2, 3].map((i) => {
        const t0 = 0.06 + i * 0.235, t1 = t0 + 0.16;
        return (
          <g key={i}>
            <polygon points={pts(P(plan.w * t0, 0, 46), P(plan.w * t1, 0, 46), P(plan.w * t1, 0, 118), P(plan.w * t0, 0, 118))} fill={`url(#${id}win)`} stroke="#cdbfa8" strokeWidth="2" />
            <polygon points={pts(P(0, plan.h * t0, 46), P(0, plan.h * t1, 46), P(0, plan.h * t1, 118), P(0, plan.h * t0, 118))} fill={`url(#${id}win)`} stroke="#cdbfa8" strokeWidth="2" />
          </g>
        );
      })}
      <polygon points={pts(P(0, 0, 0), P(plan.w, 0, 0), P(plan.w, 0, 10), P(0, 0, 10))} fill="#cdbfa8" />
      <polygon points={pts(P(0, 0, 0), P(0, plan.h, 0), P(0, plan.h, 10), P(0, 0, 10))} fill="#d6c9b3" />
      {/* floor slab */}
      <polygon points={pts(P(0, plan.h, 0), P(plan.w, plan.h, 0), P(plan.w, plan.h, -16), P(0, plan.h, -16))} fill="#c3b8a5" />
      <polygon points={pts(P(plan.w, 0, 0), P(plan.w, plan.h, 0), P(plan.w, plan.h, -16), P(plan.w, 0, -16))} fill="#afa28d" />
      <polygon points={pts(P(0, 0, 0), P(plan.w, 0, 0), P(plan.w, plan.h, 0), P(0, plan.h, 0))} fill={`url(#${id}fl)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`a${i}`} x1={P((i + 1) * 100, 0)[0]} y1={P((i + 1) * 100, 0)[1]} x2={P((i + 1) * 100, plan.h)[0]} y2={P((i + 1) * 100, plan.h)[1]} stroke="#cfc4b2" strokeWidth="1" opacity="0.7" />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={`b${i}`} x1={P(0, (i + 1) * 100)[0]} y1={P(0, (i + 1) * 100)[1]} x2={P(plan.w, (i + 1) * 100)[0]} y2={P(plan.w, (i + 1) * 100)[1]} stroke="#cfc4b2" strokeWidth="1" opacity="0.7" />
      ))}
      {/* bay markings + objects, back to front */}
      {[...bays].sort((a, b) => a.x + a.y - (b.x + b.y)).map((b) => {
        const j = occupant(b);
        const { x: cx, y: cy } = bayCenter(b);
        const isHover = hover === b.id;
        const mine = j && j.id === highlightJobId;
        const poly = pts(P(b.x + 6, b.y + 6), P(b.x + b.w - 6, b.y + 6), P(b.x + b.w - 6, b.y + b.h - 6), P(b.x + 6, b.y + b.h - 6));
        const posts = b.lift ? [[b.x + 12, b.y + 12], [b.x + b.w - 26, b.y + 12]] : [];
        return (
          <g
            key={b.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={bayLabel(b)}
            onClick={() => onBay(b)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onBay(b))}
            onMouseEnter={() => setHover(b.id)}
            onMouseLeave={() => setHover(null)}
            className={clsx(interactive && 'cursor-pointer outline-none')}
          >
            <polygon points={poly} fill={isHover ? 'rgba(242,106,46,0.2)' : 'rgba(255,255,255,0.22)'} stroke={mine ? '#f26a2e' : '#f0b44a'} strokeWidth={mine ? 4 : 3} strokeDasharray={mine ? undefined : '12 8'} />
            {posts.map(([px, py], i) => {
              const p = box(px, py, px + 14, py + 14, 0, 92);
              return (
                <g key={i}>
                  <polygon points={p.left} fill="#2759d6" />
                  <polygon points={p.right} fill="#1c43a8" />
                  <polygon points={p.top} fill="#5b8cff" />
                </g>
              );
            })}
            {j && <Car3D cx={cx} cy={cy} color={colorOf(j)} orient={orientOf(b)} ring={!!mine} />}
          </g>
        );
      })}
      {/* decor */}
      {[[40, 560], [960, 60], [60, 40]].map(([x, y]) => {
        const [px, py] = P(x, y, 0);
        const [tx, ty] = P(x, y, 54);
        return (
          <g key={`${x}${y}`} pointerEvents="none">
            <ellipse cx={px} cy={py} rx="18" ry="9" fill="#7a5a3a" opacity="0.8" />
            <circle cx={tx} cy={ty} r="24" fill="#3f8a55" />
            <circle cx={tx - 7} cy={ty - 8} r="14" fill="#5cae73" />
          </g>
        );
      })}
      {(() => {
        const r = box(780, 530, 960, 585, 0, 34);
        const [lx, ly] = P(870, 560, 36);
        return (
          <g pointerEvents="none">
            <polygon points={r.left} fill="#cdb894" />
            <polygon points={r.right} fill="#b8a27c" />
            <polygon points={r.top} fill="#dcc9a6" />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="12" fill="#7a6a4f" fontWeight="600" transform={`rotate(0 ${lx} ${ly})`}>Reception</text>
          </g>
        );
      })()}
    </svg>
  );

  /* ---------------- chrome ---------------- */
  const header = variant === 'full' && (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pb-3 pt-5">
      {wide ? (
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 whitespace-nowrap text-[17px] font-bold">
            Workshop Live View
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live
            </span>
          </h2>
          <p className="mt-0.5 hidden truncate text-xs text-ink-500 sm:block">Real-time view of your workshop and current job status.</p>
        </div>
      ) : (
        <h2 className="text-[19px] font-bold">Workshop Live View</h2>
      )}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5" role="tablist" aria-label="View mode">
          {(['2d', '3d'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={clsx('h-9 min-w-[52px] rounded-xl px-4 text-sm font-semibold transition', view === v ? 'tab-dark' : 'btn-neu')}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
          title={full ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}
          className="btn btn-neu h-9 w-9 !rounded-xl"
        >
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const compactCount = db.jobs.filter((j) => j.stage === 'in_repair' && j.bayId).length;
  // `cover`: a wide banner that zooms in on the highlighted bay (customer live tracking)
  const COVER_AR = 2.45;
  const COVER_ZOOM = 1.5;
  const focusBay = bays.find((b) => occupant(b)?.id === highlightJobId);
  const [fx, fy] = (() => {
    const c = focusBay ? bayCenter(focusBay) : { x: plan.w / 2, y: plan.h / 2 };
    const [px, py] = P(c.x, c.y, 20);
    return [px / VIEW_W, py / VIEW_H];
  })();
  const coverH = COVER_ZOOM * (VIEW_H / VIEW_W) * COVER_AR;
  const coverLeft = Math.min(0, Math.max(100 - COVER_ZOOM * 100, 50 - fx * COVER_ZOOM * 100));
  const coverTop = Math.min(0, Math.max(100 - coverH * 100, 50 - fy * coverH * 100));
  const cover = variant === 'cover' && view === '3d';
  // `wide`: crop the isometric scene to a short banner centred on the floor
  const WIDE_AR = 2.25;
  const WIDE_ZOOM = 1.06;
  const wide3d = !!wide && variant === 'full' && view === '3d';
  const wideH = WIDE_ZOOM * (VIEW_H / VIEW_W) * WIDE_AR; // wrapper height as a fraction of the banner
  const wideBox = (() => {
    const [px, py] = P(plan.w / 2, plan.h / 2, 20);
    return {
      left: Math.min(0, Math.max(100 - WIDE_ZOOM * 100, 50 - (px / VIEW_W) * WIDE_ZOOM * 100)),
      top: Math.min(0, Math.max(100 - wideH * 100, 50 - (py / VIEW_H) * wideH * 100)),
    };
  })();
  // keep stage chips inside the cropped window (a chip sits above its car)
  const chipMinT = wide3d ? (-wideBox.top / wideH) / 1 + (6.4 * WIDE_AR) / wideH + 1 : -Infinity;
  const bubbleEls =
    variant === 'full' && mode !== 'customer' && view === '3d'
      ? bubbles.map((b) => (
          <div key={b.stage} className="pointer-events-none absolute z-10" style={{ left: `${b.l}%`, top: `${Math.max(b.t, chipMinT)}%`, transform: 'translate(-50%, -100%)' }}>
            <div className="relative flex items-center gap-[0.6cqw] rounded-[1.2cqw] bg-[#fffaf4]/95 px-[1.4cqw] py-[0.9cqw] shadow-[0_6px_16px_rgba(120,90,50,0.22)]" style={{ fontSize: 'clamp(9px, 1.55cqw, 15px)' }}>
              <span className="flex h-[2.2em] w-[2.2em] items-center justify-center rounded-full" style={{ background: `${STAGE_COLOR[b.stage]}22`, color: STAGE_COLOR[b.stage] }}>
                <Wrench className="h-[1.1em] w-[1.1em]" />
              </span>
              <span className="leading-tight">
                <span className="block whitespace-nowrap font-bold text-ink">{b.stage === 'ready' ? 'Ready for Delivery' : STAGE_LABEL[b.stage]}</span>
                <span className="block text-[0.82em] text-ink-400">{b.count} {b.count === 1 ? 'vehicle' : 'vehicles'}</span>
              </span>
              <span className="absolute left-1/2 top-full h-[0.9em] w-[0.9em] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#fffaf4]/95" />
            </div>
          </div>
        ))
      : null;
  const canvas = (
    <div className={clsx('relative overflow-hidden [container-type:inline-size]', variant === 'full' ? 'mx-3 mb-3 rounded-[20px] shadow-neu-in' : 'rounded-2xl')} style={{ aspectRatio: cover ? `${COVER_AR} / 1` : wide && variant === 'full' ? `${WIDE_AR} / 1` : view === '2d' ? `${plan.w} / ${plan.h}` : `${VIEW_W} / ${VIEW_H}`, background: view === '2d' ? '#efe8dd' : 'linear-gradient(180deg,#f8f2e9,#ebe2d4)' }}>
      {view === '2d' ? scene2d : cover ? <div className="absolute" style={{ width: `${COVER_ZOOM * 100}%`, left: `${coverLeft}%`, top: `${coverTop}%` }}>{scene3d}</div> : wide3d ? (
        <div className="absolute" style={{ width: `${WIDE_ZOOM * 100}%`, left: `${wideBox.left}%`, top: `${wideBox.top}%` }}>
          {scene3d}
          {bubbleEls}
        </div>
      ) : scene3d}
      {!wide3d && bubbleEls}
      {variant === 'compact' && (
        <span className="absolute bottom-3 left-3 rounded-xl bg-[#fffaf4]/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-neu-xs">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-coral-500" />
          {compactCount} {compactCount === 1 ? 'vehicle' : 'vehicles'} in repair
        </span>
      )}
      {overlay}
    </div>
  );

  /* ---------------- bay dialog ---------------- */
  const job = openBay ? occupant(openBay) : undefined;
  const veh = job ? vehicleOf(db, job.vehicleId) : undefined;
  const ownJob = job && (mode === 'admin' || job.techId === userId);
  const href = job && ownJob ? hrefFor?.(job) : undefined;

  return (
    <div ref={wrap} className={clsx(variant === 'full' && 'neu', full && 'bg-ivory-100 p-4', className)}>
      {header}
      {canvas}
      <Modal open={!!openBay} onClose={() => setOpenBay(null)} title={openBay ? `${openBay.name}` : ''} size="sm">
        {openBay && job && veh ? (
          <div className="space-y-4">
            <div className="neu-sm flex items-center gap-4 p-4">
              <VehicleImage carKey={veh.carKey} className="h-14 w-24" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{vehicleName(veh)}</p>
                <p className="text-xs text-ink-500">{veh.reg} · #{job.id}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={STAGE_TONE[job.stage]} dot size="sm">{STAGE_LABEL[job.stage]}</StatusBadge>
                  <span className="text-xs text-ink-500">{userOf(db, job.techId)?.name}</span>
                </div>
              </div>
            </div>
            {mode === 'admin' && (
              <>
                <label className="block text-xs font-medium text-ink-500">
                  Move to stage
                  <Select value={job.stage} onChange={(e) => { setJobStage(job.id, e.target.value as Stage, 'Admin'); toast.show(`#${job.id} moved to ${STAGE_LABEL[e.target.value as Stage]}`); }} className="mt-1.5">
                    {(['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'] as Stage[]).map((s) => (
                      <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                    ))}
                  </Select>
                </label>
                <div className="flex flex-wrap gap-3">
                  {href && <Button href={href}>Open job</Button>}
                  <Button variant="neu" onClick={() => { assignBay(job.id, undefined); setOpenBay(null); toast.show(`#${job.id} removed from ${openBay.name}`); }}>Remove from bay</Button>
                </div>
              </>
            )}
            {mode === 'tech' && (href ? <Button href={href}>Open my job</Button> : <p className="text-sm text-ink-500">This vehicle is assigned to another technician.</p>)}
          </div>
        ) : (
          openBay && (
            <div className="space-y-4">
              <EmptyState title={`${openBay.name} is free`} text={mode === 'admin' ? 'Assign an active job to bring its vehicle onto the floor.' : 'No vehicle is in this bay right now.'} />
              {mode === 'admin' && (
                unassigned.length ? (
                  <div className="space-y-3">
                    <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Choose a job">
                      <option value="">Choose a job…</option>
                      {unassigned.map((j) => {
                        const v = vehicleOf(db, j.vehicleId);
                        return <option key={j.id} value={j.id}>#{j.id} · {vehicleName(v)} — {STAGE_LABEL[j.stage]}</option>;
                      })}
                    </Select>
                    <Button
                      className="w-full"
                      disabled={!pick}
                      onClick={() => {
                        const r = assignBay(pick, openBay.id);
                        toast.show(r.ok ? `#${pick} assigned to ${openBay.name}` : r.error ?? 'Could not assign');
                        if (r.ok) setOpenBay(null);
                      }}
                    >
                      Assign to {openBay.name}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-ink-500">Every active job already has a bay.</p>
                )
              )}
            </div>
          )
        )}
      </Modal>
      {toast.node}
    </div>
  );
}
