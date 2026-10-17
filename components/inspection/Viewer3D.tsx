'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ChevronDown,
  Expand,
  Hand,
  MoreVertical,
  MousePointer2,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  Contrast,
} from 'lucide-react';
import { ASSET, damagePoints3d, damageTypes, severities, viewAngles, type DamagePoint } from '@/lib/data';
import { severityTone } from './Diagram';

type Tool = 'rotate' | 'pan' | 'zoom';
const ANGLE_YAW: Record<string, number> = {
  'front-left': 0, front: 14, 'front-right': 22, left: -14, right: 18, 'back-right': 24, back: 16, top: 0,
};

/** Pill-shaped select used for severity / damage type in the damage list. */
function MiniSelect({ value, options, onChange, tone, wide }: { value: string; options: string[]; onChange: (v: string) => void; tone?: string; wide?: boolean }) {
  return (
    <div className={clsx('relative', wide ? 'w-full' : 'w-[136px]')}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-md border px-2.5 pr-7 text-xs font-medium outline-none"
        style={tone ? { background: `${tone}12`, color: tone, borderColor: `${tone}33` } : { background: '#fff', borderColor: '#e3e5e8' }}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: tone ?? '#6b7280' }} />
    </div>
  );
}

export function Viewer3D({ toggle }: { toggle?: React.ReactNode }) {
  const [points, setPoints] = useState<DamagePoint[]>(damagePoints3d);
  const [sel, setSel] = useState(1);
  const [tool, setTool] = useState<Tool>('rotate');
  const [mode, setMode] = useState<'auto' | 'free'>('free');
  const [side, setSide] = useState<'Exterior' | 'Interior'>('Exterior');
  const [angle, setAngle] = useState('front-left');
  const [cam, setCam] = useState({ yaw: 0, pitch: 0, zoom: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const current = points.find((p) => p.id === sel) ?? points[0];
  const update = (patch: Partial<DamagePoint>) => setPoints(points.map((p) => (p.id === current.id ? { ...p, ...patch } : p)));
  const reset = () => {
    setCam({ yaw: 0, pitch: 0, zoom: 1, x: 0, y: 0 });
    setAngle('front-left');
  };

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    d.x = e.clientX;
    d.y = e.clientY;
    setMode('free');
    setCam((c) => {
      if (tool === 'rotate') return { ...c, yaw: Math.max(-18, Math.min(18, c.yaw + dx * 0.15)), pitch: Math.max(-8, Math.min(8, c.pitch - dy * 0.08)) };
      if (tool === 'pan') return { ...c, x: c.x + dx, y: c.y + dy };
      return { ...c, zoom: Math.max(1, Math.min(2.2, c.zoom - dy * 0.006)) };
    });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !stage.current) return;
    // A plain click on the car adds a damage point at that spot
    const r = stage.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const id = Math.max(0, ...points.map((p) => p.id)) + 1;
    setPoints([
      ...points,
      { id, panel: `Damage Point ${id}`, description: '', type: 'Scratch', severity: 'Medium', color: '#e5484d', x, y, thumb: ASSET('x3d-p1.png') },
    ]);
    setSel(id);
  };

  const transform = `perspective(1400px) translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom}) rotateY(${cam.yaw + (ANGLE_YAW[angle] ?? 0)}deg) rotateX(${cam.pitch}deg)`;

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_340px] xl:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-[#e8ebf0] bg-white p-4 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>{toggle}</div>
          <div className="flex rounded-lg border border-[#e6e9ee] p-0.5">
            {(['Exterior', 'Interior'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={clsx('h-9 w-[120px] rounded-md text-sm font-medium', side === s ? 'bg-[#13263a] text-white' : 'text-gray-600')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport: overlays are positioned/sized in % so they track the render at any width */}
        <div className="relative overflow-hidden rounded-lg bg-[#e9ebee] [container-type:inline-size]" style={{ aspectRatio: '963 / 628' }}>
          <div
            ref={stage}
            className={clsx('absolute inset-0 touch-none', tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair', mode === 'auto' && 'auto-rotate')}
            style={mode === 'auto' ? undefined : { transform, transition: drag.current ? 'none' : 'transform 0.5s ease' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onWheel={(e) => setCam((c) => ({ ...c, zoom: Math.max(1, Math.min(2.2, c.zoom - e.deltaY * 0.0012)) }))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET('viewport-3d.jpg')} alt="Honda City 2021 3D model" className="h-full w-full object-cover" draggable={false} />
            {side === 'Exterior' &&
              points.map((p) => (
                <button
                  key={p.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={() => setSel(p.id)}
                  className={clsx(
                    'marker-pop absolute flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-md',
                    sel === p.id && 'ring-4 ring-white/60',
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: '2.9cqw', height: '2.9cqw', fontSize: '1.45cqw', background: p.color }}
                  aria-label={`Damage point ${p.id}: ${p.panel}`}
                >
                  {p.id}
                </button>
              ))}
          </div>

          {/* vehicle badge */}
          <div
            className="pointer-events-none absolute flex items-center gap-[1.4cqw] rounded-[0.8cqw] bg-[#eef0f2] px-[1.2cqw]"
            style={{ left: '1.2%', top: '1.4%', width: '29.4%', height: '9.8%' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET('car-hero.png')} alt="" className="h-[80%] w-[26%] object-contain" />
            <div>
              <p className="font-semibold text-gray-900" style={{ fontSize: '1.65cqw' }}>Honda City 2021</p>
              <p className="text-gray-600" style={{ fontSize: '1.2cqw' }}>MH12 AB 1234 · 28,450 km</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="absolute flex items-center justify-center gap-[0.8cqw] rounded-[0.7cqw] bg-white text-gray-800 shadow"
            style={{ left: '80%', top: '1.4%', width: '12.3%', height: '7%', fontSize: '1.35cqw' }}
          >
            <RefreshCcw style={{ width: '1.5cqw', height: '1.5cqw' }} /> Reset View
          </button>
          <button
            onClick={() => stage.current?.parentElement?.requestFullscreen?.()}
            className="absolute flex items-center justify-center rounded-[0.7cqw] bg-white text-gray-800 shadow"
            style={{ left: '93.6%', top: '1.4%', width: '4.9%', height: '7%' }}
            aria-label="Fullscreen"
          >
            <Expand style={{ width: '1.6cqw', height: '1.6cqw' }} />
          </button>

          {/* tool rail */}
          <div className="absolute flex flex-col justify-around rounded-[0.8cqw] bg-white py-[0.6cqw] shadow" style={{ left: '1.2%', top: '15.8%', width: '6.9%', height: '42.5%' }}>
            {[
              { k: 'rotate' as const, label: 'Rotate', Icon: RotateCw },
              { k: 'pan' as const, label: 'Pan', Icon: Hand },
              { k: 'zoom' as const, label: 'Zoom', Icon: ZoomIn },
            ].map(({ k, label, Icon }) => (
              <button
                key={k}
                onClick={() => setTool(k)}
                className={clsx('mx-[0.5cqw] flex flex-col items-center gap-[0.3cqw] rounded-[0.5cqw] py-[0.6cqw]', tool === k ? 'bg-[#eaf1ff] text-[#1d63ed]' : 'text-gray-700')}
                style={{ fontSize: '1.15cqw' }}
              >
                <Icon style={{ width: '2cqw', height: '2cqw' }} />
                {label}
              </button>
            ))}
            <button onClick={reset} className="mx-[0.5cqw] flex flex-col items-center gap-[0.3cqw] py-[0.6cqw] text-gray-700" style={{ fontSize: '1.15cqw' }}>
              <RotateCcw style={{ width: '2cqw', height: '2cqw' }} /> Reset
            </button>
          </div>

          {/* hint */}
          <div
            className="pointer-events-none absolute flex items-center gap-[1.4cqw] rounded-[0.8cqw] bg-[#1f2a35] px-[1.4cqw] text-white whitespace-nowrap"
            style={{ left: '1.4%', top: '87.6%', width: '30.6%', height: '10.4%' }}
          >
            <MousePointer2 style={{ width: '2.2cqw', height: '2.2cqw' }} />
            <div>
              <p className="font-medium" style={{ fontSize: "1.22cqw" }}>Click on a panel to add or view damage</p>
              <p className="text-white/70" style={{ fontSize: '1.1cqw' }}>Rotate, zoom and inspect from all angles</p>
            </div>
          </div>

          {/* view mode */}
          <div className="absolute rounded-[0.8cqw] bg-[#1f2a35] px-[1.2cqw] text-white" style={{ left: '73%', top: '87.2%', width: '25.6%', height: '11%' }}>
            <p className="mt-[0.5cqw] text-white/80" style={{ fontSize: '1.05cqw' }}>View Mode</p>
            <div className="mt-[0.3cqw] flex items-center gap-[0.8cqw]" style={{ fontSize: '1.15cqw' }}>
              <button onClick={() => setMode('auto')} className={clsx('flex items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.8cqw] py-[0.4cqw]', mode === 'auto' && 'bg-white text-gray-900')}>
                <Play className="fill-current" style={{ width: '1.1cqw', height: '1.1cqw' }} /> Auto Rotate
              </button>
              <button onClick={() => setMode('free')} className={clsx('flex items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.8cqw] py-[0.4cqw]', mode === 'free' && 'bg-white text-gray-900')}>
                <Contrast style={{ width: '1.2cqw', height: '1.2cqw' }} /> Free View
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-8 gap-2">
          {viewAngles.map((a) => (
            <button key={a.key} onClick={() => setAngle(a.key)} className="group text-center">
              <span
                className={clsx(
                  'block overflow-hidden rounded-lg border-2 bg-white p-1',
                  angle === a.key ? 'border-[#1d63ed]' : 'border-transparent group-hover:border-gray-200',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASSET(`angle-${a.key}.png`)} alt="" className="aspect-[3/2] w-full object-contain" />
              </span>
              <span className={clsx('mt-1.5 block text-xs', angle === a.key ? 'font-medium text-[#1d63ed]' : 'text-gray-600')}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-[#e8ebf0] bg-white p-4 shadow-card">
          <h4 className="text-[15px] font-semibold">Damage Points</h4>
          <ul className="mt-3 divide-y divide-[#eef0f3]">
            {points.map((p) => (
              <li key={p.id} className={clsx('flex gap-3 py-2.5', sel === p.id && 'bg-[#f7f9ff]')} onClick={() => setSel(p.id)}>
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: p.color }}>
                  {p.id}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" className="h-[68px] w-[68px] shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{p.panel}</p>
                    <MoreVertical className="h-4 w-4 shrink-0 text-gray-500" />
                  </div>
                  <p className="truncate text-xs text-gray-500">{p.description || 'Add a description'}</p>
                  <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <MiniSelect
                      value={p.severity}
                      options={severities}
                      tone={severityTone(p.severity)}
                      onChange={(v) => setPoints(points.map((q) => (q.id === p.id ? { ...q, severity: v } : q)))}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              const id = Math.max(0, ...points.map((p) => p.id)) + 1;
              setPoints([...points, { id, panel: `Damage Point ${id}`, description: '', type: 'Scratch', severity: 'Medium', color: '#e5484d', x: 50, y: 50, thumb: ASSET('x3d-p1.png') }]);
              setSel(id);
            }}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9cdf5] bg-[#f6f9ff] text-sm font-medium text-[#1d63ed]"
          >
            <Plus className="h-4 w-4" /> Add Damage Point
          </button>
        </div>

        {current && (
          <div className="rounded-xl border border-[#e8ebf0] bg-white p-4 shadow-card">
            <h4 className="text-[15px] font-semibold">Selected Damage Details</h4>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: current.color }}>
                {current.id}
              </span>
              <input
                value={current.panel}
                onChange={(e) => update({ panel: e.target.value })}
                className="w-full bg-transparent text-[15px] font-semibold outline-none"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-gray-500">Damage Type</p>
                <MiniSelect wide value={current.type} options={damageTypes} onChange={(v) => update({ type: v })} />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-500">Severity</p>
                <MiniSelect wide value={current.severity} options={severities} tone={severityTone(current.severity)} onChange={(v) => update({ severity: v })} />
              </div>
            </div>
            <p className="mb-1 mt-3 text-xs text-gray-500">Description</p>
            <textarea
              value={current.description}
              maxLength={200}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-lg border border-[#e3e5e8] px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#9db7f5]"
            />
            <p className="text-right text-xs text-gray-400">{current.description.length}/200</p>
            <p className="mb-1.5 text-xs text-gray-500">Photos (3)</p>
            <div className="grid grid-cols-4 gap-2">
              {['x3d-s1', 'x3d-s2', 'x3d-s3'].map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s} src={ASSET(`${s}.png`)} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
              <button className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#b9cdf5] bg-[#f6f9ff] text-[11px] text-[#1d63ed]">
                <Plus className="h-4 w-4" /> Add Photo
              </button>
            </div>
            <button
              onClick={() => {
                const rest = points.filter((p) => p.id !== current.id);
                setPoints(rest);
                setSel(rest[0]?.id ?? 0);
              }}
              className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-[#e5484d]"
            >
              <Trash2 className="h-4 w-4" /> Delete This Point
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
