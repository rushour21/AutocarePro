'use client';

import { forwardRef, useCallback, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CarTopShapes, CAR_COLOR } from '@/components/features/CarTop';
import { LIMITS, bayRect, bayType, clampRect, equipmentLabel, fixtureRect, r2, snap } from '@/lib/layout';
import type { LayoutIssue, Rect } from '@/lib/layout';
import type { Bay, CarKey, Fixture, WorkshopLayout } from '@/lib/types';

/** what a bay looks like in the read-only live view */
export interface BayOccupant {
  carKey: CarKey;
  title: string;
  sub?: string;
}

export interface FloorPlanHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
}

interface Props {
  layout: WorkshopLayout;
  mode: 'edit' | 'view';
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** edit mode. `commit` is false while a drag is in progress */
  onChange?: (layout: WorkshopLayout, commit: boolean) => void;
  onDelete?: (id: string) => void;
  issues?: LayoutIssue[];
  tool?: 'select' | 'pan';
  snapOn?: boolean;
  occupants?: Record<string, BayOccupant | undefined>;
  className?: string;
  ariaLabel?: string;
}

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type Drag =
  | { kind: 'move'; id: string; start: { x: number; y: number }; orig: Rect; moved: boolean }
  | { kind: 'resize'; id: string; handle: Handle; orig: Rect; moved: boolean }
  | { kind: 'pan'; start: { x: number; y: number }; c: { x: number; y: number } };

const M = { l: 2.4, t: 1.8, r: 0.8, b: 0.8 };
const HANDLES: { h: Handle; fx: number; fy: number; cursor: string }[] = [
  { h: 'nw', fx: 0, fy: 0, cursor: 'nwse-resize' }, { h: 'n', fx: 0.5, fy: 0, cursor: 'ns-resize' }, { h: 'ne', fx: 1, fy: 0, cursor: 'nesw-resize' },
  { h: 'e', fx: 1, fy: 0.5, cursor: 'ew-resize' }, { h: 'se', fx: 1, fy: 1, cursor: 'nwse-resize' }, { h: 's', fx: 0.5, fy: 1, cursor: 'ns-resize' },
  { h: 'sw', fx: 0, fy: 1, cursor: 'nesw-resize' }, { h: 'w', fx: 0, fy: 0.5, cursor: 'ew-resize' },
];

export const FloorPlan = forwardRef<FloorPlanHandle, Props>(function FloorPlan(
  { layout, mode, selectedId, onSelect, onChange, onDelete, issues = [], tool = 'select', snapOn = true, occupants, className, ariaLabel = 'Workshop floor plan' },
  ref,
) {
  const uid = useId().replace(/:/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const live = useRef<WorkshopLayout>(layout);
  live.current = layout;
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ z: 1, cx: 0, cy: 0 });
  const edit = mode === 'edit';
  const { plan } = layout;

  const base = useMemo(() => ({ x: -M.l, y: -M.t, w: plan.w + M.l + M.r, h: plan.h + M.t + M.b }), [plan.w, plan.h]);
  const vw = base.w / view.z, vh = base.h / view.z;
  const cx = view.z === 1 ? base.x + base.w / 2 : view.cx, cy = view.z === 1 ? base.y + base.h / 2 : view.cy;
  const vb = { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };

  const clampView = useCallback(
    (z: number, ncx: number, ncy: number) => {
      const w = base.w / z, h = base.h / z;
      const minX = base.x + w / 2, maxX = base.x + base.w - w / 2, minY = base.y + h / 2, maxY = base.y + base.h - h / 2;
      return { z, cx: Math.min(Math.max(ncx, Math.min(minX, maxX)), Math.max(minX, maxX)), cy: Math.min(Math.max(ncy, Math.min(minY, maxY)), Math.max(minY, maxY)) };
    },
    [base],
  );
  const zoomTo = useCallback((z: number, about?: { x: number; y: number }) => {
    const nz = Math.min(4, Math.max(1, z));
    setView((v) => {
      if (nz === 1) return { z: 1, cx: 0, cy: 0 };
      const ax = about?.x ?? (v.z === 1 ? base.x + base.w / 2 : v.cx), ay = about?.y ?? (v.z === 1 ? base.y + base.h / 2 : v.cy);
      // keep the point under the cursor fixed
      const oldCx = v.z === 1 ? base.x + base.w / 2 : v.cx, oldCy = v.z === 1 ? base.y + base.h / 2 : v.cy;
      const k = v.z / nz;
      return clampView(nz, ax + (oldCx - ax) * k, ay + (oldCy - ay) * k);
    });
  }, [base, clampView]);
  useImperativeHandle(ref, () => ({ zoomIn: () => zoomTo(view.z * 1.4), zoomOut: () => zoomTo(view.z / 1.4), fit: () => setView({ z: 1, cx: 0, cy: 0 }) }), [zoomTo, view.z]);

  const toM = (e: { clientX: number; clientY: number }) => {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };
  const q = (v: number) => (snapOn ? snap(v, plan.grid) : r2(v));

  const errIds = useMemo(() => new Set(issues.filter((i) => i.level === 'error').flatMap((i) => i.ids)), [issues]);
  const warnIds = useMemo(() => new Set(issues.filter((i) => i.level === 'warning').flatMap((i) => i.ids)), [issues]);

  /* ---------------- edits ---------------- */
  const withRect = (l: WorkshopLayout, id: string, r: Rect): WorkshopLayout => {
    const bay = l.bays.find((b) => b.id === id);
    if (bay) {
      const rot = bay.rot;
      const upd: Bay = { ...bay, x: r2(r.x), y: r2(r.y), w: r2(rot === 90 ? r.h : r.w), l: r2(rot === 90 ? r.w : r.h) };
      return { ...l, bays: l.bays.map((b) => (b.id === id ? upd : b)) };
    }
    return { ...l, fixtures: l.fixtures.map((f) => (f.id === id ? { ...f, x: r2(r.x), y: r2(r.y), w: r2(r.w), h: r2(r.h) } : f)) };
  };
  const rectOf = (l: WorkshopLayout, id: string): Rect | undefined => {
    const b = l.bays.find((x) => x.id === id);
    if (b) return bayRect(b);
    const f = l.fixtures.find((x) => x.id === id);
    return f ? fixtureRect(f) : undefined;
  };

  const startMove = (e: React.PointerEvent, id: string) => {
    if (tool === 'pan') return; // let the background handler pan the view, even when the drag starts over a bay
    e.stopPropagation();
    onSelect?.(id);
    if (!edit || tool !== 'select') return;
    const orig = rectOf(live.current, id);
    if (!orig) return;
    svg.current!.setPointerCapture(e.pointerId);
    drag.current = { kind: 'move', id, start: toM(e), orig, moved: false };
  };
  const startResize = (e: React.PointerEvent, id: string, handle: Handle) => {
    e.stopPropagation();
    const orig = rectOf(live.current, id);
    if (!orig) return;
    svg.current!.setPointerCapture(e.pointerId);
    drag.current = { kind: 'resize', id, handle, orig, moved: false };
  };
  const onBgDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (tool === 'pan' || view.z > 1) {
      svg.current!.setPointerCapture(e.pointerId);
      drag.current = { kind: 'pan', start: toM(e), c: { x: cx, y: cy } };
    }
    if (tool === 'select') onSelect?.(null);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toM(e);
    if (d.kind === 'pan') {
      setView((v) => clampView(v.z, d.c.x - (p.x - d.start.x), d.c.y - (p.y - d.start.y)));
      return;
    }
    const l = live.current;
    if (d.kind === 'move') {
      const dx = p.x - d.start.x, dy = p.y - d.start.y;
      if (!d.moved && Math.hypot(dx, dy) < 0.08) return;
      d.moved = true;
      const r = clampRect({ ...d.orig, x: q(d.orig.x + dx), y: q(d.orig.y + dy) }, plan.w, plan.h);
      onChange?.(withRect(l, d.id, r), false);
      return;
    }
    // resize
    const isBay = l.bays.some((b) => b.id === d.id);
    const min = isBay ? LIMITS.minBay : 0.5, max = isBay ? LIMITS.maxBay : plan.w;
    let left = d.orig.x, right = d.orig.x + d.orig.w, top = d.orig.y, bottom = d.orig.y + d.orig.h;
    if (d.handle.includes('w')) left = Math.min(q(p.x), right - min);
    if (d.handle.includes('e')) right = Math.max(q(p.x), left + min);
    if (d.handle.includes('n')) top = Math.min(q(p.y), bottom - min);
    if (d.handle.includes('s')) bottom = Math.max(q(p.y), top + min);
    left = Math.max(0, left); top = Math.max(0, top); right = Math.min(plan.w, right); bottom = Math.min(plan.h, bottom);
    if (right - left > max) { if (d.handle.includes('w')) left = right - max; else right = left + max; }
    if (bottom - top > max) { if (d.handle.includes('n')) top = bottom - max; else bottom = top + max; }
    d.moved = true;
    onChange?.(withRect(l, d.id, { x: left, y: top, w: right - left, h: bottom - top }), false);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.kind !== 'pan' && d.moved) onChange?.(live.current, true);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoomTo(view.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), toM(e));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!edit || !selectedId) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete?.(selectedId);
      return;
    }
    const step = e.shiftKey ? 1 : plan.grid;
    const dir: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const d = dir[e.key];
    const r = rectOf(live.current, selectedId);
    if (!d || !r) return;
    e.preventDefault();
    onChange?.(withRect(live.current, selectedId, clampRect({ ...r, x: r.x + d[0], y: r.y + d[1] }, plan.w, plan.h)), true);
  };

  /* ---------------- drawing helpers ---------------- */
  const wallT = 0.35;
  const ticks = useMemo(() => {
    const t = { x: [] as number[], y: [] as number[] };
    for (let v = 0; v <= plan.w; v += 2) t.x.push(v);
    for (let v = 0; v <= plan.h; v += 2) t.y.push(v);
    return t;
  }, [plan.w, plan.h]);

  const stroke = (id: string, color: string) => (errIds.has(id) ? '#e5482d' : warnIds.has(id) ? '#ee8a12' : color);

  const renderFixture = (f: Fixture) => {
    const sel = selectedId === f.id;
    if (f.kind === 'entrance') {
      return (
        <g key={f.id} data-fixture={f.id} onPointerDown={(e) => startMove(e, f.id)} className={clsx(edit && 'cursor-move')} role="button" aria-label={f.name} aria-pressed={sel}>
          <rect x={f.x - 0.15} y={f.y} width={f.w + 0.3} height={f.h} fill="#f4efe7" />
          <path d={`M ${f.x - 2.1} ${f.y + f.h / 2} h 1.3 m -0.5 -0.5 l 0.5 0.5 l -0.5 0.5`} fill="none" stroke="#1d9d65" strokeWidth={0.18} strokeLinecap="round" strokeLinejoin="round" />
          <text x={f.x + f.w + 0.35} y={f.y + f.h / 2 + 0.15} fontSize={0.42} fontWeight={600} fill="#3b3c40" textAnchor="start" pointerEvents="none">Entrance</text>
          {sel && <rect x={f.x - 0.2} y={f.y - 0.1} width={f.w + 0.4} height={f.h + 0.2} fill="none" stroke="#f26a2e" strokeWidth={0.1} strokeDasharray="0.3 0.2" />}
        </g>
      );
    }
    const fill = f.kind === 'parts' ? '#e9e1d3' : f.kind === 'reception' ? '#ece6dc' : f.kind === 'lounge' ? '#efe9e0' : '#dcd7cf';
    return (
      <g key={f.id} data-fixture={f.id} onPointerDown={(e) => startMove(e, f.id)} className={clsx(edit && 'cursor-move')} role="button" aria-label={f.name} aria-pressed={sel}>
        <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={0.2} fill={fill} stroke={stroke(f.id, sel ? '#f26a2e' : '#9a8f80')} strokeWidth={sel ? 0.14 : 0.08} />
        {f.kind === 'parts' && Array.from({ length: Math.max(1, Math.floor(f.h / 1.1)) }).map((_, i) => <rect key={i} x={f.x + 0.3} y={f.y + 0.3 + i * 1.1} width={Math.max(0.5, f.w - 0.6)} height={0.55} rx={0.08} fill="#b79c6e" opacity={0.7} />)}
        {f.kind === 'reception' && <rect x={f.x + 0.4} y={f.y + 0.4} width={Math.max(0.5, f.w * 0.55)} height={Math.max(0.4, f.h - 0.8)} rx={0.15} fill="#fff" stroke="#c9bfae" strokeWidth={0.06} />}
        {f.kind === 'lounge' && (<><rect x={f.x + 0.4} y={f.y + 0.5} width={Math.max(0.5, f.w * 0.5)} height={0.9} rx={0.2} fill="#a8a29a" /><rect x={f.x + f.w - 1.6} y={f.y + f.h - 1.6} width={1.1} height={1.1} rx={0.15} fill="#c9a77a" /></>)}
        <text x={f.x + f.w / 2} y={f.y + f.h / 2 + 0.16} fontSize={Math.min(0.5, f.w / 5)} fontWeight={600} fill="#3b3c40" textAnchor="middle" pointerEvents="none">{f.name}</text>
      </g>
    );
  };

  const renderBay = (b: Bay) => {
    const r = bayRect(b);
    const t = bayType(b.type);
    const sel = selectedId === b.id;
    const occ = occupants?.[b.id];
    const muted = !b.active;
    const col = muted ? '#9b968e' : t.color;
    const dashed = !b.active || b.state !== 'normal';
    const label = `${b.name}, ${t.label}${occ ? `, ${occ.title}` : ''}${!b.active ? ', inactive' : b.state !== 'normal' ? `, ${b.state}` : ''}`;
    const rotated = b.rot === 90;
    // the vehicle's length runs along the bay length; shapes have the nose at the bottom
    const cxm = r.x + r.w / 2, cym = r.y + r.h / 2;
    const carScale = rotated ? Math.min((r.h * 0.58) / 100, (r.w * 0.84) / 250) : Math.min((r.w * 0.58) / 100, (r.h * 0.84) / 250);
    const lift = b.equipment.includes('two_post_lift');
    return (
      <g key={b.id} data-bay={b.id} role="button" tabIndex={0} aria-label={label} aria-pressed={sel} onPointerDown={(e) => startMove(e, b.id)} onPointerEnter={() => setHover(b.id)} onPointerLeave={() => setHover((h) => (h === b.id ? null : h))} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(b.id); } }} className={clsx('outline-none', edit && tool === 'select' ? 'cursor-move' : 'cursor-pointer')}>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={0.2} fill={col} fillOpacity={hover === b.id || sel ? 0.2 : 0.1} stroke={stroke(b.id, col)} strokeWidth={sel ? 0.2 : 0.14} strokeDasharray={dashed ? '0.5 0.3' : undefined} />
        {lift && (<><rect x={r.x + 0.25} y={r.y + 0.35} width={0.35} height={0.35} rx={0.05} fill="#2f55b8" opacity={muted ? 0.4 : 0.9} /><rect x={r.x + r.w - 0.6} y={r.y + 0.35} width={0.35} height={0.35} rx={0.05} fill="#2f55b8" opacity={muted ? 0.4 : 0.9} /></>)}
        {occ && (
          <g transform={`translate(${cxm} ${cym}) rotate(${rotated ? -90 : 0}) scale(${carScale}) translate(-50 -125)`} opacity={muted ? 0.5 : 1} pointerEvents="none">
            <CarTopShapes color={CAR_COLOR[occ.carKey]} idPrefix={`${uid}${b.id.replace(/[^a-z0-9]/gi, '')}`} />
          </g>
        )}
        {/* label block */}
        <text x={r.x + r.w / 2} y={r.y + 0.95} fontSize={0.62} fontWeight={700} fill="#26272b" textAnchor="middle" pointerEvents="none" stroke="#fffaf4" strokeWidth={0.16} paintOrder="stroke">{b.name}</text>
        <text x={r.x + r.w / 2} y={r.y + 1.55} fontSize={0.4} fill="#55565a" textAnchor="middle" pointerEvents="none" stroke="#fffaf4" strokeWidth={0.14} paintOrder="stroke">{occ ? occ.title : t.label}</text>
        {(edit || !occ) && <text x={r.x + r.w / 2} y={r.y + r.h - 0.35} fontSize={0.36} fill="#77746f" textAnchor="middle" pointerEvents="none" stroke="#fffaf4" strokeWidth={0.12} paintOrder="stroke">{b.w} m × {b.l} m</text>}
        {b.state !== 'normal' && b.active && <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 0.15} fontSize={0.5} fontWeight={700} fill={b.state === 'maintenance' ? '#c43520' : '#6a4fd6'} textAnchor="middle" pointerEvents="none" stroke="#fffaf4" strokeWidth={0.14} paintOrder="stroke">{b.state === 'maintenance' ? 'Maintenance' : 'Reserved'}</text>}
        {!b.active && <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 0.15} fontSize={0.5} fontWeight={700} fill="#77746f" textAnchor="middle" pointerEvents="none" stroke="#fffaf4" strokeWidth={0.14} paintOrder="stroke">Inactive</text>}
        {b.equipment.length > 0 && edit && <title>{b.equipment.map(equipmentLabel).join(', ')}</title>}
      </g>
    );
  };

  const sel = selectedId ? rectOf(layout, selectedId) : undefined;

  return (
    <svg
      ref={svg}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      role="application"
      aria-label={ariaLabel}
      tabIndex={edit ? 0 : -1}
      className={clsx('w-full touch-none select-none rounded-2xl bg-[#f4efe7] outline-none', tool === 'pan' || view.z > 1 ? 'cursor-grab' : '', className)}
      style={{ aspectRatio: `${base.w} / ${base.h}` }}
      onPointerDown={onBgDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
      onKeyDown={onKey}
    >
      <defs>
        <pattern id={`${uid}-g1`} width={plan.grid} height={plan.grid} patternUnits="userSpaceOnUse"><path d={`M ${plan.grid} 0 H 0 V ${plan.grid}`} fill="none" stroke="#d9d1c3" strokeWidth={0.02} /></pattern>
        <pattern id={`${uid}-g5`} width={5} height={5} patternUnits="userSpaceOnUse"><path d="M 5 0 H 0 V 5" fill="none" stroke="#c4baa8" strokeWidth={0.04} /></pattern>
      </defs>
      <rect x={base.x} y={base.y} width={base.w} height={base.h} fill="#f4efe7" />
      {/* floor */}
      <rect x={0} y={0} width={plan.w} height={plan.h} fill="#ebe4d8" />
      <rect x={0} y={0} width={plan.w} height={plan.h} fill={`url(#${uid}-g1)`} />
      <rect x={0} y={0} width={plan.w} height={plan.h} fill={`url(#${uid}-g5)`} />
      {/* rulers */}
      <g fontSize={0.5} fill="#55565a" pointerEvents="none">
        {ticks.x.map((v) => (<g key={`x${v}`}><line x1={v} y1={-0.45} x2={v} y2={-0.1} stroke="#77746f" strokeWidth={0.05} /><text x={v} y={-0.7} textAnchor="middle">{v}</text></g>))}
        {ticks.y.map((v) => (<g key={`y${v}`}><line x1={-0.45} y1={v} x2={-0.1} y2={v} stroke="#77746f" strokeWidth={0.05} /><text x={-0.7} y={v + 0.18} textAnchor="end">{v}</text></g>))}
        <text x={plan.w + 0.2} y={-0.7} fontSize={0.42} fill="#928e87">m</text>
      </g>
      {layout.fixtures.map(renderFixture)}
      {layout.bays.map(renderBay)}
      {/* walls (drawn after the fixtures so the entrance gap can sit on top) */}
      <rect x={-wallT / 2} y={-wallT / 2} width={plan.w + wallT} height={plan.h + wallT} fill="none" stroke="#3a4a6b" strokeWidth={wallT} pointerEvents="none" />
      {layout.fixtures.filter((f) => f.kind === 'entrance').map((f) => <rect key={`gap${f.id}`} x={f.x - 0.25} y={f.y} width={f.w + 0.5} height={f.h} fill="#f4efe7" pointerEvents="none" />)}
      {edit && sel && selectedId && (
        <g>
          <rect x={sel.x} y={sel.y} width={sel.w} height={sel.h} fill="none" stroke="#f26a2e" strokeWidth={0.12} strokeDasharray="0.4 0.25" pointerEvents="none" />
          {tool === 'select' && HANDLES.map(({ h, fx, fy, cursor }) => (
            <g key={h} onPointerDown={(e) => startResize(e, selectedId, h)} style={{ cursor }}>
              <circle cx={sel.x + sel.w * fx} cy={sel.y + sel.h * fy} r={0.6} fill="transparent" />
              <rect x={sel.x + sel.w * fx - 0.17} y={sel.y + sel.h * fy - 0.17} width={0.34} height={0.34} rx={0.06} fill="#fff" stroke="#f26a2e" strokeWidth={0.1} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
});
