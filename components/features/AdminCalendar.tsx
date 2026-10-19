'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MonthGrid, ScheduleGrid, toneForCategory, type ScheduleEvent } from '@/components/features/ScheduleGrid';
import { EmptyState, FilterTabs } from '@/components/ui';
import { isActive, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const BASE = new Date(2025, 2, 16); // demo "today"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Technician-lane schedule (admin) with week / month views. */
export function AdminCalendarView() {
  const db = useDb();
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [offset, setOffset] = useState(0); // weeks in week mode, months in month mode
  const techs = db.users.filter((u) => u.role === 'technician' && u.title === 'Technician');

  const shown = useMemo(() => {
    const d = new Date(BASE);
    if (mode === 'week') d.setDate(d.getDate() + offset * 7);
    else d.setMonth(d.getMonth() + offset);
    return d;
  }, [mode, offset]);

  const events = useMemo<ScheduleEvent[]>(() => {
    if (offset !== 0 || mode !== 'week') return [];
    const out: ScheduleEvent[] = [];
    techs.forEach((t, idx) => {
      const mine = db.jobs.filter((j) => j.techId === t.id && j.slot && isActive(j)).sort((a, b) => a.slot!.start - b.slot!.start);
      const lanes: number[] = []; // end time per lane
      const laneOf = new Map<string, number>();
      mine.forEach((j) => {
        let lane = lanes.findIndex((end) => end <= j.slot!.start);
        if (lane === -1) lane = lanes.push(0) - 1;
        lanes[lane] = j.slot!.end;
        laneOf.set(j.id, lane);
      });
      const nl = Math.max(1, lanes.length);
      mine.forEach((j) => {
        const lane = laneOf.get(j.id) ?? 0;
        const w = 0.92 / nl;
        const v = vehicleOf(db, j.vehicleId);
        out.push({
          id: j.id, title: vehicleName(v), line2: j.service, line3: j.bayId ? db.garage.bays.find((b) => b.id === j.bayId)?.name : 'Bay not assigned',
          tone: toneForCategory(j.serviceCategory, j.service), col0: idx + 0.04 + lane * w, col1: idx + 0.04 + (lane + 1) * w, start: j.slot!.start, end: j.slot!.end, href: `/admin/jobs/${j.id}`,
        });
      });
    });
    return out;
  }, [db, techs, offset, mode]);

  const chips = useMemo(() => {
    const m: Record<number, { id: string; label: string; tone: ReturnType<typeof toneForCategory>; href: string }[]> = {};
    if (offset !== 0) return m;
    db.jobs.filter(isActive).forEach((j) => {
      const day = 16 + j.dueIn;
      (m[day] ??= []).push({ id: j.id, label: `${vehicleName(vehicleOf(db, j.vehicleId))} · ${j.service}`, tone: toneForCategory(j.serviceCategory, j.service), href: `/admin/jobs/${j.id}` });
    });
    return m;
  }, [db, offset]);

  const label = `${MONTHS[shown.getMonth()]} ${shown.getFullYear()}`;
  const daysIn = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const firstWeekday = (new Date(shown.getFullYear(), shown.getMonth(), 1).getDay() + 6) % 7;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button className="btn btn-neu h-11 px-5 text-sm" onClick={() => setOffset(0)}>
          Today
        </button>
        <FilterTabs
          variant="soft"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setOffset(0);
          }}
          tabs={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
        <div className="ml-auto flex items-center gap-2 text-sm font-medium">
          <button aria-label="Previous" onClick={() => setOffset(offset - 1)} className="btn btn-neu h-10 w-10 !rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[88px] text-center">{label}</span>
          <button aria-label="Next" onClick={() => setOffset(offset + 1)} className="btn btn-neu h-10 w-10 !rounded-full">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {mode === 'week' ? (
        <ScheduleGrid
          columns={techs.map((t) => ({ key: t.id, label: t.name.split(' ')[0], avatar: t.avatar }))}
          events={events}
          empty={<EmptyState title="No jobs scheduled" text="Use Today to return to the current week." />}
        />
      ) : (
        <MonthGrid monthLabel={label} firstWeekday={firstWeekday} days={daysIn} today={offset === 0 ? 16 : -1} chips={chips} />
      )}
    </div>
  );
}
