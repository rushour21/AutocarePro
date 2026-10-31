'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, EmptyState, VehicleImage } from '@/components/ui';
import { isActive, STAGE_LABEL, userOf, vehicleName, vehicleOf } from '@/lib/format';
import type { Db, Job, Stage } from '@/lib/types';

const DAY = 86400000;
const SPAN = 14;
const ROW = 50;
// The demo calls 16 Mar a Monday, so weekday names are counted from it rather than from the real calendar.
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STAGE_STYLE: Partial<Record<Stage, { bg: string; dot: string }>> = {
  pending: { bg: '#e8eaed', dot: '#92959c' },
  inspection: { bg: '#e3edf5', dot: '#5f8fb8' },
  diagnostics: { bg: '#e6e8f2', dot: '#7d86b5' },
  in_repair: { bg: '#f8e7e4', dot: '#d84a27' },
  quality_check: { bg: '#f4edd8', dot: '#c9a24a' },
  ready: { bg: '#d8efe8', dot: '#248a6c' },
};
const styleOf = (s: Stage) => STAGE_STYLE[s] ?? { bg: '#e8eaed', dot: '#92959c' };

interface Item {
  job: Job;
  start: number;
  end: number;
  lane: number;
}

/** Days are counted from the demo "today". A pill ends on the due date; more work left makes it longer. */
function span(job: Job) {
  return { start: job.dueIn - (job.progress >= 60 ? 1 : 2), end: job.dueIn };
}

export function JobTimeline({ db, base, offset, techId, jobs, hrefBase = '/admin/jobs' }: { db: Db; base: Date; offset: number; techId: string; jobs?: Job[]; hrefBase?: string }) {
  const from = offset * 7 - 5;
  const days = useMemo(
    () =>
      Array.from({ length: SPAN }, (_, i) => {
        const d = new Date(base.getTime() + (from + i) * DAY);
        return { rel: from + i, date: d.getDate(), month: MONTHS[d.getMonth()], weekday: WEEKDAYS[(((from + i) % 7) + 7) % 7] };
      }),
    [base, from],
  );

  const { items, lanes } = useMemo(() => {
    const rows = (jobs ?? db.jobs)
      .filter((j) => isActive(j) && (techId === 'all' || j.techId === techId))
      .map((job) => ({ job, ...span(job) }))
      .filter((r) => r.end >= from && r.start <= from + SPAN - 1)
      .sort((a, b) => a.start - b.start || a.end - b.end);
    const ends: number[] = [];
    const placed: Item[] = rows.map((r) => {
      let lane = ends.findIndex((e) => e < r.start);
      if (lane === -1) lane = ends.push(0) - 1;
      ends[lane] = r.end;
      return { ...r, lane };
    });
    return { items: placed, lanes: ends.length };
  }, [db, jobs, techId, from]);

  const todayIdx = 0 - from;
  const showToday = todayIdx >= 0 && todayIdx < SPAN;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = scroller.current;
    if (s && showToday) s.scrollLeft = Math.max((todayIdx / SPAN) * s.scrollWidth - s.clientWidth / 3, 0);
  }, [showToday, todayIdx]);

  const [day, setDay] = useState(0);
  const agendaDay = days.some((d) => d.rel === day) ? day : days[0].rel;
  const agenda = items.filter((i) => i.start <= agendaDay && i.end >= agendaDay);
  const count = (rel: number) => items.filter((i) => i.start <= rel && i.end >= rel).length;

  return (
    <>
      {/* tablet and desktop: pills across the days */}
      <div className="neu hidden overflow-hidden md:block">
        <div ref={scroller} className="thin-scroll max-h-[calc(100vh-232px)] min-h-[420px] overflow-auto">
          <div className="min-w-[980px]">
            <div className="sticky top-0 z-40 grid border-b border-ink/[0.06] bg-[#fbfbfc] pb-2.5 pt-3.5" style={{ gridTemplateColumns: `repeat(${SPAN}, 1fr)` }}>
              {days.map((d) => (
                <div key={d.rel} className="text-center leading-tight">
                  <p className={clsx('text-[15px] font-semibold tabular-nums', d.rel === 0 ? 'text-coral-500' : 'text-ink-700')}>{String(d.date).padStart(2, '0')}</p>
                  <p className={clsx('text-[11px]', d.rel === 0 ? 'font-medium text-coral-500' : 'text-ink-400')}>{d.weekday}</p>
                </div>
              ))}
            </div>
            <div className="relative" style={{ height: Math.max(lanes, 6) * ROW + 20 }}>
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${SPAN}, 1fr)` }} aria-hidden>
                {days.map((d) => <span key={d.rel} className="border-r border-ink/[0.04] last:border-r-0" />)}
              </div>
              {showToday && (
                <>
                  <div className="absolute inset-y-0 right-0 bg-coral-50/40" style={{ left: `${((todayIdx + 0.5) / SPAN) * 100}%` }} aria-hidden />
                  <div className="absolute inset-y-0 z-[5] w-px -translate-x-1/2 bg-coral-500" style={{ left: `${((todayIdx + 0.5) / SPAN) * 100}%` }} aria-hidden>
                    <span className="absolute -left-[3.5px] top-0 h-2 w-2 rounded-full bg-coral-500" />
                  </div>
                </>
              )}
              {items.map(({ job, start, end, lane }) => {
                const s0 = Math.max(start, from);
                const s1 = Math.min(end, from + SPAN - 1);
                const v = vehicleOf(db, job.vehicleId);
                const tech = userOf(db, job.techId);
                const st = styleOf(job.stage);
                return (
                  <Link
                    key={job.id}
                    href={`${hrefBase}/${job.id}`}
                    title={`${vehicleName(v)} · ${job.service} · ${STAGE_LABEL[job.stage]} · ${job.dueLabel}`}
                    className="absolute z-10 flex h-[40px] items-center gap-2 rounded-full pl-1.5 pr-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75),0_1px_3px_rgba(134,144,164,0.2)] transition-transform hover:z-30 hover:scale-[1.015] active:scale-[0.99]"
                    style={{ top: 10 + lane * ROW, left: `calc(${((s0 - from) / SPAN) * 100}% + 4px)`, width: `calc(${((s1 - s0 + 1) / SPAN) * 100}% - 8px)`, background: st.bg, borderRadius: start < from ? '0 9999px 9999px 0' : end > from + SPAN - 1 ? '9999px 0 0 9999px' : undefined }}
                  >
                    <Avatar src={tech?.avatar} name={tech?.name} size={30} className="!shadow-none !ring-2 !ring-white/80" />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px] font-semibold text-ink">{vehicleName(v)}</span>
                      <span className="block truncate text-[11px] text-ink-600">{job.service}</span>
                    </span>
                    {job.stage === 'ready' ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>
                    ) : (
                      <span className={clsx('flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-white/75 px-1.5 text-[10.5px] font-semibold tabular-nums', job.dueIn < 0 ? 'text-bad' : 'text-ink-600')}>{job.progress}%</span>
                    )}
                  </Link>
                );
              })}
              {items.length === 0 && <div className="absolute inset-0 flex items-center justify-center"><EmptyState title="No jobs in these two weeks" /></div>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/[0.06] px-4 py-2.5">
          {(['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready', 'pending'] as Stage[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] text-ink-500"><span className="h-2 w-2 rounded-full" style={{ background: styleOf(s).dot }} /> {STAGE_LABEL[s]}</span>
          ))}
          <span className="ml-auto text-[11px] text-ink-400">Each job ends on its due date</span>
        </div>
      </div>

      {/* phone: pick a day, read its jobs */}
      <div className="md:hidden">
        <div className="thin-scroll -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {days.map((d) => (
            <button key={d.rel} onClick={() => setDay(d.rel)} aria-pressed={d.rel === agendaDay} className={clsx('flex w-[52px] shrink-0 flex-col items-center rounded-2xl py-2 leading-tight transition-colors', d.rel === agendaDay ? 'bg-coral-500 text-white' : 'bg-[#fbfbfc] text-ink-700 shadow-neu-xs')}>
              <span className={clsx('text-[11px]', d.rel === agendaDay ? 'text-white/85' : d.rel === 0 ? 'font-medium text-coral-500' : 'text-ink-400')}>{d.weekday}</span>
              <span className="text-[16px] font-semibold tabular-nums">{d.date}</span>
              <span className={clsx('mt-0.5 h-1 w-1 rounded-full', count(d.rel) === 0 ? 'bg-transparent' : d.rel === agendaDay ? 'bg-white' : 'bg-coral-500')} />
            </button>
          ))}
        </div>
        {agenda.length === 0 ? (
          <EmptyState title="Nothing on this day" />
        ) : (
          <ul className="space-y-2">
            {agenda.map(({ job }) => {
              const v = vehicleOf(db, job.vehicleId);
              const tech = userOf(db, job.techId);
              const st = styleOf(job.stage);
              return (
                <li key={job.id}>
                  <Link href={`${hrefBase}/${job.id}`} className="flex items-center gap-3 rounded-[18px] bg-[#fbfbfc] p-3 shadow-neu-xs active:scale-[0.99]">
                    {v && <VehicleImage carKey={v.carKey} className="h-9 w-14 shrink-0" />}
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-semibold">{vehicleName(v)}</span>
                      <span className="block truncate text-xs text-ink-500">{job.service}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-500"><span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} /> {STAGE_LABEL[job.stage]} · {job.progress}%</span>
                    </span>
                    <Avatar src={tech?.avatar} name={tech?.name} size={28} className="!shadow-none" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
