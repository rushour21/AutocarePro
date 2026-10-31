'use client';

import clsx from 'clsx';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { assignBay, setJobStage } from '@/lib/actions';
import { STAGE_LABEL, STAGE_TONE, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { occupantOf } from '@/lib/layout';
import { useDb } from '@/lib/store';
import type { Job, Stage, WorkshopLayout } from '@/lib/types';
import { Button, EmptyState, Modal, Select, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { AssignJob } from './AssignJob';
import { FloorPlan } from './layout/FloorPlan';
import type { BayOccupant } from './layout/FloorPlan';
import { Workshop3D } from './three/Workshop3D';
import type { BayLive, SceneApi } from './three/WorkshopScene3D';
import { useBayLive } from './three/useLive';
import { useUpdated } from './three/useUpdated';

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
}

/**
 * The workshop as a live 2D plan / 3D scene, drawn from the published layout and the current jobs.
 * Used on the technician dashboard (compact), the customer job page (cover) and anywhere a framed view is needed.
 * The admin dashboard uses the full-screen LiveHero instead.
 */
export function WorkshopLiveView({ mode, variant = 'full', userId, highlightJobId, hrefFor, defaultView = '3d', className, overlay }: WorkshopLiveViewProps) {
  const db = useDb();
  const toast = useToast();
  const wrap = useRef<HTMLDivElement>(null);
  const api = useRef<SceneApi | null>(null);
  const [view, setView] = useState<'2d' | '3d'>(defaultView);
  const [openId, setOpenId] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const layout = useMemo<WorkshopLayout>(() => ({ plan: db.garage.plan, bays: db.garage.bays, fixtures: db.garage.fixtures }), [db.garage.plan, db.garage.bays, db.garage.fixtures]);
  const live = useBayLive(layout);
  const updated = useUpdated(db.jobs, db.garage.layoutVersion);

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  // customers only ever see their own vehicle identified; every other car is an anonymous shape
  const occupants = useMemo(() => {
    if (mode !== 'customer') return live.occupants;
    const o: Record<string, BayLive | undefined> = {};
    db.jobs.forEach((j) => {
      if (!j.bayId || j.stage === 'delivered') return;
      o[j.bayId] = j.id === highlightJobId && live.occupants[j.bayId] ? live.occupants[j.bayId] : { carKey: 'glc', title: 'Vehicle', chip: 'In service', color: '#a6a9b0' };
    });
    return o;
  }, [mode, live.occupants, db.jobs, highlightJobId]);

  const interactive = mode !== 'customer';
  const focusBay = highlightJobId ? db.jobs.find((j) => j.id === highlightJobId)?.bayId : undefined;
  const open = layout.bays.find((b) => b.id === openId);
  const job = open ? occupantOf(db.jobs, open.id) : undefined;
  const veh = job ? vehicleOf(db, job.vehicleId) : undefined;
  const href = job && (mode === 'admin' || job.techId === userId) ? hrefFor?.(job) : undefined;
  const inRepair = db.jobs.filter((j) => j.stage === 'in_repair' && j.bayId).length;

  const header = variant === 'full' && (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold">
          Workshop Live View
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live</span>
        </h2>
        <p className="mt-0.5 text-xs text-ink-500">{updated}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5" role="tablist" aria-label="View mode">
          {(['2d', '3d'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={clsx('h-9 min-w-[52px] rounded-xl px-4 text-sm font-semibold transition', view === v ? 'tab-dark' : 'btn-neu')}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} title={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())} className="btn btn-neu h-9 w-9 !rounded-xl">
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  const ratio = variant === 'cover' ? 'aspect-[2.45/1]' : variant === 'compact' ? 'aspect-[4/3]' : 'aspect-[16/10]';
  const canvas = (
    <div className={clsx('relative overflow-hidden bg-gradient-to-b from-[#eef0f3] to-[#dfe2e7]', ratio, variant === 'full' ? 'mx-3 mb-3 rounded-[20px] shadow-neu-in' : 'rounded-2xl')}>
      {view === '3d' ? (
        <Workshop3D layout={layout} occupants={occupants} idle={live.idle} selectedId={variant === 'cover' ? focusBay ?? null : openId} onSelect={(id) => interactive && setOpenId(id)} interactive={variant === 'full' && interactive} showLabels={mode !== 'customer' && variant !== 'cover'} focusBayId={variant === 'cover' ? focusBay : undefined} apiRef={api} />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2">
          <FloorPlan layout={layout} mode="view" selectedId={openId} onSelect={(id) => interactive && setOpenId(id)} occupants={Object.fromEntries(Object.entries(occupants).map(([k, v]) => [k, v && ({ carKey: v.carKey, title: v.title } as BayOccupant)]))} className="max-h-full" />
        </div>
      )}
      {variant === 'compact' && (
        <span className="absolute bottom-3 left-3 z-20 rounded-xl bg-[#fcfcfd]/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-neu-xs">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-coral-500" />
          {inRepair} {inRepair === 1 ? 'vehicle' : 'vehicles'} in repair
        </span>
      )}
      {overlay}
    </div>
  );

  return (
    <div ref={wrap} className={clsx(variant === 'full' && 'neu', full && 'bg-ivory-100 p-4', className)}>
      {header}
      {canvas}
      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? open.name : ''} size="sm">
        {open && job && veh ? (
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
                    {(['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'] as Stage[]).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </Select>
                </label>
                <div className="flex flex-wrap gap-3">
                  {href && <Button href={href}>Open job</Button>}
                  <Button variant="neu" onClick={() => { assignBay(job.id, undefined); setOpenId(null); toast.show(`#${job.id} removed from ${open.name}`); }}>Remove from bay</Button>
                </div>
              </>
            )}
            {mode === 'tech' && (href ? <Button href={href}>Open my job</Button> : <p className="text-sm text-ink-500">This vehicle is assigned to another technician.</p>)}
          </div>
        ) : (
          open && (
            <div className="space-y-4">
              <EmptyState title={`${open.name} is free`} text={mode === 'admin' ? 'Assign an active job to bring its vehicle onto the floor.' : 'No vehicle is in this bay right now.'} />
              {mode === 'admin' && <AssignJob bay={open} notify={toast.show} onDone={() => setOpenId(null)} />}
            </div>
          )
        )}
      </Modal>
      {toast.node}
    </div>
  );
}
