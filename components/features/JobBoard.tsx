'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setJobStage } from '@/lib/actions';
import { BOARD_COLUMNS, STAGE_LABEL, vehicleName, vehicleOf, userOf, type Tone } from '@/lib/format';
import type { Db, Job, Stage } from '@/lib/types';
import { Avatar, EmptyState, VehicleImage } from '@/components/ui';

const COL_DOT: Partial<Record<Tone, string>> = { blue: '#5f8fb8', red: '#d84a27', violet: '#7d86b5', amber: '#c9a24a', green: '#248a6c' };

function CardBody({ job, db, color }: { job: Job; db: Db; color: string }) {
  const v = vehicleOf(db, job.vehicleId);
  const tech = userOf(db, job.techId);
  return (
    <>
      <div className="flex items-center gap-1.5 pr-6 text-[11px] font-medium text-ink-400">
        <span>#{job.id}</span>
        {job.priority === 'High' && <span className="rounded-full bg-coral-100 px-1.5 py-px text-[10px] text-coral-600">High</span>}
      </div>
      {v && <VehicleImage carKey={v.carKey} className="mx-auto mt-1 h-[52px] w-full" />}
      <p className="mt-1.5 truncate text-[14px] font-semibold tracking-tight">{vehicleName(v)}</p>
      <p className="truncate text-xs text-ink-500">{job.service}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <Avatar src={tech?.avatar} name={tech?.name} size={22} className="!ring-0 !shadow-none" />
        <span className={clsx('min-w-0 flex-1 truncate text-[11px]', job.dueIn < 0 ? 'font-medium text-bad' : 'text-ink-500')}>{job.dueLabel}</span>
        <span className="text-[11px] font-medium tabular-nums text-ink-500">{job.progress}%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-500/10">
        <div className="h-full rounded-full" style={{ width: `${job.progress}%`, background: color }} />
      </div>
    </>
  );
}

export function JobBoard({ db, jobs, onToast }: { db: Db; jobs: Job[]; onToast: (m: string) => void }) {
  const [over, setOver] = useState<Stage | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ job: Job; color: string; x: number; y: number; w: number; dx: number; dy: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const pressing = useRef(false);

  const move = (id: string, stage: Stage) => {
    const j = jobs.find((x) => x.id === id);
    if (!j || j.stage === stage) return;
    setJobStage(id, stage, 'Admin');
    onToast(`#${id} moved to ${STAGE_LABEL[stage]}`);
  };

  const stageAt = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest('[data-stage]') as HTMLElement | null)?.dataset.stage as Stage | undefined;

  // Pointer events rather than HTML drag: works from any point on the card, and on touch (press and hold).
  const startDrag = (e: React.PointerEvent<HTMLElement>, job: Job, color: string) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-nodrag]')) return;
    const box = e.currentTarget.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    const touch = e.pointerType !== 'mouse';
    let last = start;
    let active = false;
    dragged.current = false;
    pressing.current = touch;

    const begin = () => {
      active = true;
      dragged.current = true;
      document.body.style.userSelect = 'none';
      setMenu(null);
      setDrag({ job, color, x: last.x, y: last.y, w: box.width, dx: start.x - box.left, dy: start.y - box.top });
      if (touch) navigator.vibrate?.(10);
    };
    const timer = touch ? setTimeout(begin, 220) : undefined;

    const cleanup = () => {
      clearTimeout(timer);
      pressing.current = false;
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('touchmove', block);
    };
    const finish = (drop: boolean) => {
      if (active && drop) {
        const stage = stageAt(last.x, last.y);
        if (stage) move(job.id, stage);
      }
      setDrag(null);
      setOver(null);
      cleanup();
    };
    const onMove = (ev: PointerEvent) => {
      last = { x: ev.clientX, y: ev.clientY };
      if (!active) {
        if (Math.hypot(last.x - start.x, last.y - start.y) > 6) {
          if (touch) cleanup();
          else begin();
        }
        return;
      }
      setDrag((d) => d && { ...d, x: last.x, y: last.y });
      setOver(stageAt(last.x, last.y) ?? null);
      const s = scroller.current;
      if (s) {
        const r = s.getBoundingClientRect();
        if (last.x < r.left + 44) s.scrollLeft -= 14;
        else if (last.x > r.right - 44) s.scrollLeft += 14;
      }
      if (last.y < 90) window.scrollBy(0, -12);
      else if (last.y > window.innerHeight - 50) window.scrollBy(0, 12);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && finish(false);
    const block = (ev: TouchEvent) => { if (active) ev.preventDefault(); };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);
    document.addEventListener('touchmove', block, { passive: false });
  };

  if (jobs.length === 0) return <EmptyState title="No jobs match your filters" />;

  return (
    <div ref={scroller} className="thin-scroll -mx-4 snap-x snap-mandatory overflow-x-auto scroll-px-4 px-4 pb-3 lg:mx-0 lg:snap-none lg:overflow-visible lg:px-0">
      <div className="flex w-max items-start gap-3 lg:grid lg:w-auto lg:grid-cols-6">
        {BOARD_COLUMNS.map((c) => {
          const list = jobs.filter((j) => j.stage === c.stage);
          const color = COL_DOT[c.tone] ?? '#92959c';
          return (
            <section
              key={c.stage}
              data-stage={c.stage}
              aria-label={`${c.label} column`}
              className={clsx('min-h-[420px] w-[78vw] max-w-[280px] shrink-0 snap-start rounded-[22px] p-2 transition-colors sm:w-[260px] lg:w-auto lg:min-w-0 lg:max-w-none', over === c.stage ? 'bg-coral-100/70 shadow-[inset_0_0_0_1.5px_rgba(216,74,39,0.35)]' : 'bg-ink-500/[0.06]')}
            >
              <h3 className="flex items-center gap-2 px-2 pb-2.5 pt-1.5 text-[13px] font-semibold">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                <span className="text-xs font-medium tabular-nums text-ink-400">{list.length}</span>
              </h3>
              <div className="space-y-2">
                {list.map((j) => (
                  <article
                    key={j.id}
                    onPointerDown={(e) => startDrag(e, j, color)}
                    onContextMenu={(e) => pressing.current && e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    className={clsx('relative cursor-grab touch-pan-x touch-pan-y select-none rounded-[18px] bg-[#fbfbfc] shadow-neu-xs transition-[box-shadow,opacity] duration-200 [-webkit-touch-callout:none] hover:shadow-neu-sm active:cursor-grabbing', drag?.job.id === j.id && 'opacity-30', menu === j.id && 'z-30')}
                  >
                    <Link
                      href={`/admin/jobs/${j.id}`}
                      draggable={false}
                      onClickCapture={(e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); } }}
                      className="block rounded-[18px] p-3"
                    >
                      <CardBody job={j} db={db} color={color} />
                    </Link>
                    <button data-nodrag type="button" aria-label={`Move job ${j.id}`} aria-haspopup="menu" aria-expanded={menu === j.id} onClick={() => setMenu(menu === j.id ? null : j.id)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-500/10 hover:text-ink">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menu === j.id && (
                      <>
                        <button data-nodrag className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setMenu(null)} />
                        <div data-nodrag role="menu" className="glass menu-in absolute right-1.5 top-9 z-30 w-44 origin-top-right rounded-2xl p-1.5">
                          <p className="px-2.5 pb-1 pt-1 text-[11px] font-medium text-ink-400">Move to</p>
                          {BOARD_COLUMNS.map((t) => (
                            <button
                              key={t.stage}
                              role="menuitem"
                              disabled={t.stage === j.stage}
                              onClick={() => { move(j.id, t.stage); setMenu(null); }}
                              className="block w-full rounded-[10px] px-2.5 py-1.5 text-left text-sm enabled:hover:bg-coral-500 enabled:hover:text-white disabled:text-ink-300"
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </article>
                ))}
                {list.length === 0 && <p className="px-2 py-8 text-center text-xs text-ink-400">Drop a job here</p>}
              </div>
            </section>
          );
        })}
      </div>
      {drag &&
        createPortal(
          <div className="pointer-events-none fixed left-0 top-0 z-[80] rounded-[18px] bg-[#fbfbfc] p-3 shadow-[0_18px_44px_rgba(60,68,84,0.3)]" style={{ width: drag.w, transform: `translate(${drag.x - drag.dx}px, ${drag.y - drag.dy}px) rotate(1.5deg) scale(1.03)` }}>
            <CardBody job={drag.job} db={db} color={drag.color} />
          </div>,
          document.body,
        )}
    </div>
  );
}
