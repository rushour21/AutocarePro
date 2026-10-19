'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { TopBar } from '@/components/layout/AppShell';
import { MonthGrid, ScheduleGrid, type EventTone, type ScheduleEvent } from '@/components/features/ScheduleGrid';
import { EmptyState } from '@/components/ui';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Stage } from '@/lib/types';

const TONE: Record<Stage, EventTone> = { in_repair: 'blue', diagnostics: 'green', quality_check: 'amber', pending: 'red', inspection: 'violet', ready: 'green', delivered: 'green' };
const BASE = new Date(2025, 2, 16);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EmployeeCalendarPage() {
  const db = useDb();
  const { user } = useSession();
  const [mode, setMode] = useState<'day' | 'week' | 'month'>('week');
  const [offset, setOffset] = useState(0);
  const jobs = useMemo(() => (user ? visibleJobs(db, user).filter((j) => isActive(j) && j.slot) : []), [db, user]);

  const shown = new Date(BASE);
  if (mode === 'month') shown.setMonth(shown.getMonth() + offset);
  else shown.setDate(shown.getDate() + offset * (mode === 'week' ? 7 : 1));
  const label = `${MONTHS[shown.getMonth()]} ${shown.getFullYear()}`;

  const mk = (j: (typeof jobs)[number], col0: number, col1: number): ScheduleEvent => ({
    id: j.id, title: `#${j.id} - ${vehicleName(vehicleOf(db, j.vehicleId))}`, line2: j.service, line3: userOf(db, j.techId)?.name, tone: TONE[j.stage], col0, col1, start: j.slot!.start, end: j.slot!.end, href: `/employee/jobs/${j.id}`,
  });
  const weekEvents = offset === 0 ? jobs.map((j) => mk(j, j.slot!.x0, j.slot!.x1)) : [];
  const dayEvents = useMemo(() => {
    if (offset !== 0) return [];
    const sorted = [...jobs].sort((a, b) => a.slot!.start - b.slot!.start);
    const lanes: number[] = [];
    const lane = new Map<string, number>();
    sorted.forEach((j) => {
      let l = lanes.findIndex((e) => e <= j.slot!.start);
      if (l === -1) l = lanes.push(0) - 1;
      lanes[l] = j.slot!.end;
      lane.set(j.id, l);
    });
    const n = Math.max(1, lanes.length);
    return sorted.map((j) => mk(j, ((lane.get(j.id) ?? 0) / n) * 1, (((lane.get(j.id) ?? 0) + 1) / n) * 1));
  }, [jobs, offset, db]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = useMemo(() => {
    const m: Record<number, { id: string; label: string; tone: EventTone; href: string }[]> = {};
    if (offset === 0 && user) visibleJobs(db, user).filter(isActive).forEach((j) => ((m[16 + j.dueIn] ??= []).push({ id: j.id, label: `#${j.id} ${vehicleName(vehicleOf(db, j.vehicleId))}`, tone: TONE[j.stage], href: `/employee/jobs/${j.id}` })));
    return m;
  }, [db, user, offset]);
  const daysIn = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const first = (new Date(shown.getFullYear(), shown.getMonth(), 1).getDay() + 6) % 7;

  return (
    <>
      <TopBar />
      <h1 className="mb-4 text-[24px] font-bold lg:hidden">Calendar</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-neu h-11 px-5 text-sm" onClick={() => setOffset(0)}>Today</button>
        <div className="flex items-center gap-1 text-sm font-medium">
          <button aria-label="Previous" onClick={() => setOffset(offset - 1)} className="btn btn-neu h-10 w-10 !rounded-full"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[90px] text-center">{label}</span>
          <button aria-label="Next" onClick={() => setOffset(offset + 1)} className="btn btn-neu h-10 w-10 !rounded-full"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="neu-in-sm ml-auto flex gap-1 !rounded-2xl p-1.5" role="tablist" aria-label="Calendar view">
          {(['day', 'week', 'month'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setOffset(0); }} className={clsx('h-9 min-w-[70px] rounded-xl px-4 text-sm font-semibold capitalize transition', mode === m ? 'tab-dark' : 'text-ink-600')}>{m}</button>
          ))}
        </div>
      </div>
      {mode === 'month' ? (
        <MonthGrid monthLabel={label} firstWeekday={first} days={daysIn} today={offset === 0 ? 16 : -1} chips={chips} />
      ) : (
        <ScheduleGrid
          accentBar
          columns={mode === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => ({ key: d, label: d })) : [{ key: 'today', label: 'Today' }]}
          events={mode === 'week' ? weekEvents : dayEvents}
          startHour={9}
          endHour={18}
          empty={<EmptyState title="Nothing scheduled" text="Use Today to return to the current week." />}
        />
      )}
    </>
  );
}
