'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { GripVertical, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { setJobStage } from '@/lib/actions';
import { BOARD_COLUMNS, STAGE_LABEL, vehicleName, vehicleOf, userOf, type Tone } from '@/lib/format';
import type { Db, Job, Stage } from '@/lib/types';
import { Avatar, EmptyState, ProgressBar, VehicleImage } from '@/components/ui';

const COL_STYLE: Record<Tone, { chip: string; ring: string; bar: string; dot: string }> = {
  blue: { chip: 'bg-info-soft text-info-strong', ring: 'border-info', bar: '#2f6bff', dot: 'border-[#7aa0ff]' },
  red: { chip: 'bg-coral-100 text-coral-600', ring: 'border-coral-500', bar: '#f26a2e', dot: 'border-coral-500' },
  violet: { chip: 'bg-info-soft text-info-strong', ring: 'border-violet', bar: '#7c8cff', dot: 'border-[#7aa0ff]' },
  amber: { chip: 'bg-warn-soft text-warn-strong', ring: 'border-warn', bar: '#f5a524', dot: 'border-warn' },
  green: { chip: 'bg-ok-soft text-ok-strong', ring: 'border-ok', bar: '#1d9d65', dot: 'border-[#7bd1a8]' },
  gray: { chip: '', ring: '', bar: '#aaa', dot: '' },
  coral: { chip: '', ring: '', bar: '#f26a2e', dot: '' },
};

function BoardCard({ job, db, tone, onMove, adminHref }: { job: Job; db: Db; tone: Tone; onMove: (s: Stage) => void; adminHref: string }) {
  const v = vehicleOf(db, job.vehicleId);
  const tech = userOf(db, job.techId);
  const [menu, setMenu] = useState(false);
  const st = COL_STYLE[tone];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', job.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="neu-sm group relative cursor-grab overflow-hidden !rounded-[18px] p-3.5 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <span className={clsx('mt-0.5 h-3 w-3 rounded-full border-[3px] bg-white', st.dot)} aria-hidden />
        <div className="flex items-center gap-1 text-ink-300">
          <GripVertical className="h-4 w-4 opacity-0 transition group-hover:opacity-100" aria-hidden />
          <button type="button" aria-label={`Move job ${job.id}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className="rounded-md p-0.5 hover:text-ink">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Link href={adminHref} className="mt-1 block">
        {v && <VehicleImage carKey={v.carKey} className="mx-auto h-[58px] w-full" />}
        <p className="mt-2 truncate text-[13.5px] font-bold">{vehicleName(v)}</p>
        <p className="truncate text-xs text-ink-400">{v?.reg}</p>
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <Avatar src={tech?.avatar} name={tech?.name} size={26} />
        <span className="rounded-lg bg-white/70 px-2 py-0.5 text-[11px] font-medium text-ink-500">#{job.id}</span>
      </div>
      <ProgressBar value={job.progress} tone="gray" className="!absolute inset-x-3.5 bottom-0 !h-[3px] !rounded-none !bg-transparent !shadow-none" />
      <span className="absolute bottom-0 left-0 h-[3px]" style={{ width: `${Math.max(12, job.progress)}%`, background: st.bar }} />
      {menu && (
        <>
          <button className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setMenu(false)} />
          <div role="menu" className="neu-sm slide-up absolute right-2 top-9 z-30 w-44 p-1.5">
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">Move to</p>
            {BOARD_COLUMNS.map((c) => (
              <button
                key={c.stage}
                role="menuitem"
                disabled={c.stage === job.stage}
                onClick={() => {
                  onMove(c.stage);
                  setMenu(false);
                }}
                className="block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-white/70 disabled:text-ink-300"
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function JobBoard({ db, jobs, onToast }: { db: Db; jobs: Job[]; onToast: (m: string) => void }) {
  const [over, setOver] = useState<Stage | null>(null);
  const move = (id: string, stage: Stage) => {
    const j = jobs.find((x) => x.id === id);
    if (!j || j.stage === stage) return;
    setJobStage(id, stage, 'Admin');
    onToast(`#${id} moved to ${STAGE_LABEL[stage]}`);
  };
  return (
    <div className="thin-scroll -mx-1 overflow-x-auto px-1 pb-3">
      <div className="grid min-w-[980px] grid-cols-5 gap-4">
        {BOARD_COLUMNS.map((c) => {
          const list = jobs.filter((j) => j.stage === c.stage);
          const st = COL_STYLE[c.tone];
          return (
            <section
              key={c.stage}
              aria-label={`${c.label} column`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(c.stage);
              }}
              onDragLeave={() => setOver((o) => (o === c.stage ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                move(e.dataTransfer.getData('text/plain'), c.stage);
              }}
              className={clsx('neu-in-sm min-h-[420px] !rounded-[22px] p-3 transition', over === c.stage && 'ring-2 ring-coral-400/70')}
            >
              <h3 className={clsx('mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold', st.chip)}>
                <span className={clsx('h-3 w-3 rounded-full border-[3px] bg-white', st.ring)} />
                {c.label} ({list.length})
              </h3>
              <div className="space-y-3">
                {list.map((j) => (
                  <BoardCard key={j.id} job={j} db={db} tone={c.tone} onMove={(s) => move(j.id, s)} adminHref={`/admin/jobs/${j.id}`} />
                ))}
                {list.length === 0 && <p className="px-2 py-8 text-center text-xs text-ink-400">Drop a job here</p>}
              </div>
            </section>
          );
        })}
      </div>
      {jobs.length === 0 && <EmptyState title="No jobs match your filters" />}
    </div>
  );
}
