'use client';

import clsx from 'clsx';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BAY_STATUS_LABEL, bayType } from '@/lib/layout';
import type { WorkshopLayout } from '@/lib/types';
import { STATUS_COLOR, useBayLive } from '@/components/features/three/useLive';
import { Workshop3D } from '@/components/features/three/Workshop3D';
import type { SceneApi } from '@/components/features/three/WorkshopScene3D';

/** "3D Workshop Preview" shown in the layout editor: the draft layout with a bay list, like the reference. */
export function Workshop3DPreview({ layout, selectedId, onSelect }: { layout: WorkshopLayout; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const live = useBayLive(layout);
  const api = useRef<SceneApi | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'all' | 'in_use' | 'available'>('all');
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const rows = layout.bays.filter((b) => (tab === 'all' ? true : live.status[b.id] === tab));
  const tabBtn = (k: typeof tab, label: string, n: number, color: string) => (
    <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition', tab === k ? 'bg-white shadow-neu-xs' : 'text-ink-500 hover:text-ink')} style={tab === k ? { color } : undefined}>
      {label} <span className="rounded-full px-1.5 text-[10px] text-white" style={{ background: color }}>{n}</span>
    </button>
  );
  return (
    <div ref={wrap} className={clsx('flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef3fa] to-[#dde5f0] md:flex-row', full ? 'h-screen' : 'h-[620px]')}>
      <div className="shrink-0 p-3 md:w-[248px]">
        <div className="neu-sm h-full !rounded-2xl p-3">
          <h3 className="mb-2 text-[13px] font-bold">3D Workshop Preview</h3>
          <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Bay filter">
            {tabBtn('all', 'All Bays', live.counts.total, '#2f6bff')}
            {tabBtn('in_use', 'In Use', live.counts.in_use, '#f26a2e')}
            {tabBtn('available', 'Available', live.counts.available, '#1d9d65')}
          </div>
          <ul className="thin-scroll max-h-[180px] space-y-1.5 overflow-y-auto pr-0.5 md:max-h-[480px]">
            {rows.map((b) => {
              const st = live.status[b.id];
              return (
                <li key={b.id}>
                  <button onClick={() => onSelect(b.id)} className={clsx('flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/70', selectedId === b.id && 'bg-white shadow-neu-xs')}>
                    <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: bayType(b.type).color }} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-xs font-semibold">{b.name}</span>
                      <span className="block truncate text-[10.5px] text-ink-500">{bayType(b.type).label}</span>
                    </span>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: STATUS_COLOR[st], background: `${STATUS_COLOR[st]}1f` }}>{BAY_STATUS_LABEL[st]}</span>
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && <li className="py-3 text-center text-xs text-ink-400">No bays here.</li>}
          </ul>
        </div>
      </div>
      <div className="relative min-h-[360px] flex-1">
        <Workshop3D layout={layout} occupants={live.occupants} idle={live.idle} selectedId={selectedId} onSelect={onSelect} apiRef={api} />
        <div className="absolute bottom-3 right-3 z-30 flex gap-2">
          <button className="btn btn-neu h-9 px-3 text-xs" onClick={() => api.current?.reset()}><RotateCcw className="h-3.5 w-3.5" /> Reset View</button>
          <select aria-label="Camera view" className="field h-9 !w-auto px-3 text-xs" defaultValue="iso" onChange={(e) => api.current?.preset(e.target.value as 'iso' | 'top' | 'front')}>
            <option value="iso">Isometric View</option>
            <option value="top">Top View</option>
            <option value="front">Front View</option>
          </select>
          <button aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} className="btn btn-neu h-9 w-9" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}>
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-3 z-30 hidden rounded-lg bg-white/80 px-2.5 py-1 text-[11px] text-ink-500 sm:block">Drag to rotate · right-drag to pan · scroll to zoom</p>
      </div>
    </div>
  );
}
