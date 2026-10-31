'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarCheck, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/AppShell';
import { JobTimeline } from '@/components/features/JobTimeline';
import { MonthGrid, type EventTone } from '@/components/features/ScheduleGrid';
import { EmptyState, FilterTabs, PageHeader, StatCard, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, STAGE_LABEL, STAGE_TONE, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Stage } from '@/lib/types';

const TONE: Record<Stage, EventTone> = { in_repair: 'red', diagnostics: 'violet', quality_check: 'amber', pending: 'blue', inspection: 'blue', ready: 'green', delivered: 'green' };
const BASE = new Date(2025, 2, 16);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const clock = (h: number) => {
  const hr = Math.floor(h), m = Math.round((h - hr) * 60);
  return `${hr % 12 === 0 ? 12 : hr % 12}:${String(m).padStart(2, '0')} ${hr >= 12 ? 'PM' : 'AM'}`;
};

export default function EmployeeCalendarPage() {
  const db = useDb();
  const { user } = useSession();
  const [mode, setMode] = useState<'today' | 'timeline' | 'month'>('today');
  const [offset, setOffset] = useState(0);
  const jobs = useMemo(() => (user ? visibleJobs(db, user).filter(isActive) : []), [db, user]);
  const agenda = useMemo(() => jobs.filter((j) => j.slot).sort((a, b) => a.slot!.start - b.slot!.start), [jobs]);

  const shown = new Date(BASE);
  if (mode === 'month') shown.setMonth(shown.getMonth() + offset);
  else shown.setDate(shown.getDate() + offset * 7);
  const label = `${MONTHS[shown.getMonth()]} ${shown.getFullYear()}`;

  const chips = useMemo(() => {
    const m: Record<number, { id: string; label: string; tone: EventTone; href: string }[]> = {};
    if (offset === 0) jobs.forEach((j) => ((m[16 + j.dueIn] ??= []).push({ id: j.id, label: `#${j.id} ${vehicleName(vehicleOf(db, j.vehicleId))}`, tone: TONE[j.stage], href: `/employee/jobs/${j.id}` })));
    return m;
  }, [db, jobs, offset]);
  const daysIn = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const first = (new Date(shown.getFullYear(), shown.getMonth(), 1).getDay() + 6) % 7;

  return (
    <>
      <TopBar />
      <PageHeader title="Calendar" subtitle="Your work, in the order it needs doing" />
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <FilterTabs
          variant="soft"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setOffset(0);
          }}
          tabs={[
            { value: 'today', label: 'Today' },
            { value: 'timeline', label: 'Timeline' },
            { value: 'month', label: 'Month' },
          ]}
        />
        {mode !== 'today' && (
          <div className="flex items-center gap-1 text-sm font-semibold sm:ml-auto">
            <button aria-label="Previous" onClick={() => setOffset(offset - 1)} className="btn h-9 w-9 text-ink-500 hover:bg-ink-500/10"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-[78px] text-center">{label}</span>
            <button aria-label="Next" onClick={() => setOffset(offset + 1)} className="btn h-9 w-9 text-ink-500 hover:bg-ink-500/10"><ChevronRight className="h-4 w-4" /></button>
            <button className="btn btn-neu ml-1 h-9 px-4 text-[13px]" onClick={() => setOffset(0)}>Today</button>
          </div>
        )}
      </div>

      {mode === 'today' && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard className="!p-3 sm:!p-5" icon={<ClipboardList className="h-[18px] w-[18px]" />} tone="blue" label="My jobs" value={jobs.length} />
            <StatCard className="!p-3 sm:!p-5" icon={<CalendarCheck className="h-[18px] w-[18px]" />} tone="amber" label="Due today" value={jobs.filter((j) => j.dueIn === 0).length} />
            <StatCard className="!p-3 sm:!p-5" icon={<AlertTriangle className="h-[18px] w-[18px]" />} tone="red" label="Overdue" value={jobs.filter((j) => j.dueIn < 0).length} />
          </div>
          {agenda.length === 0 ? (
            <EmptyState title="Nothing scheduled" text="New jobs will appear here when they are assigned to you." />
          ) : (
            <ol className="neu p-2 sm:p-3">
              {agenda.map((j, i) => {
                const v = vehicleOf(db, j.vehicleId);
                return (
                  <li key={j.id} className="relative flex gap-3 sm:gap-4">
                    <div className="w-[62px] shrink-0 pt-3.5 text-right leading-tight sm:w-[76px]">
                      <p className="text-[13px] font-semibold tabular-nums">{clock(j.slot!.start)}</p>
                      <p className="text-[11px] tabular-nums text-ink-400">{clock(j.slot!.end)}</p>
                    </div>
                    <div className="relative flex w-3 shrink-0 justify-center" aria-hidden>
                      {i < agenda.length - 1 && <span className="absolute bottom-0 top-5 w-px bg-ink/[0.1]" />}
                      {i > 0 && <span className="absolute top-0 h-5 w-px bg-ink/[0.1]" />}
                      <span className="relative mt-[18px] h-2.5 w-2.5 rounded-full bg-coral-500 ring-[3px] ring-[#fbfbfc]" />
                    </div>
                    <Link href={`/employee/jobs/${j.id}`} className="my-1 flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-ink-500/[0.05] active:scale-[0.995]">
                      {v && <VehicleImage carKey={v.carKey} className="hidden h-10 w-16 shrink-0 sm:block" />}
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-semibold">{vehicleName(v)}</span>
                        <span className="block truncate text-xs text-ink-500">#{j.id} · {j.service}</span>
                        <span className="mt-2 flex items-center gap-2">
                          <span className="h-1 max-w-[180px] flex-1 overflow-hidden rounded-full bg-ink-500/10"><span className="block h-full rounded-full bg-coral-500" style={{ width: `${j.progress}%` }} /></span>
                          <span className="text-[11px] font-medium tabular-nums text-ink-500">{j.progress}%</span>
                        </span>
                      </span>
                      <StatusBadge tone={STAGE_TONE[j.stage]} size="sm" className="hidden sm:inline-flex">{STAGE_LABEL[j.stage]}</StatusBadge>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
      {mode === 'timeline' && <JobTimeline db={db} base={BASE} offset={offset} techId="all" jobs={jobs} hrefBase="/employee/jobs" />}
      {mode === 'month' && <MonthGrid monthLabel={label} firstWeekday={first} days={daysIn} today={offset === 0 ? 16 : -1} chips={chips} />}
    </>
  );
}
