'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { JobTimeline } from '@/components/features/JobTimeline';
import { MonthGrid, toneForCategory } from '@/components/features/ScheduleGrid';
import { FilterTabs, Select } from '@/components/ui';
import { isActive, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const BASE = new Date(2025, 2, 16); // demo "today"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Workshop calendar (admin): a day timeline of every active job, and a month of due dates. */
export function AdminCalendarView() {
  const db = useDb();
  const [mode, setMode] = useState<'timeline' | 'month'>('timeline');
  const [offset, setOffset] = useState(0); // weeks in timeline mode, months in month mode
  const [techId, setTechId] = useState('all');
  const techs = db.users.filter((u) => u.role === 'technician' && u.title === 'Technician');

  const shown = useMemo(() => {
    const d = new Date(BASE);
    if (mode === 'timeline') d.setDate(d.getDate() + offset * 7);
    else d.setMonth(d.getMonth() + offset);
    return d;
  }, [mode, offset]);

  const chips = useMemo(() => {
    const m: Record<number, { id: string; label: string; tone: ReturnType<typeof toneForCategory>; href: string }[]> = {};
    if (offset !== 0) return m;
    db.jobs.filter((j) => isActive(j) && (techId === 'all' || j.techId === techId)).forEach((j) => {
      const day = 16 + j.dueIn;
      (m[day] ??= []).push({ id: j.id, label: `${vehicleName(vehicleOf(db, j.vehicleId))} · ${j.service}`, tone: toneForCategory(j.serviceCategory, j.service), href: `/admin/jobs/${j.id}` });
    });
    return m;
  }, [db, offset, techId]);

  const label = `${MONTHS[shown.getMonth()]} ${shown.getFullYear()}`;
  const daysIn = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const firstWeekday = (new Date(shown.getFullYear(), shown.getMonth(), 1).getDay() + 6) % 7;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <button aria-label="Previous" onClick={() => setOffset(offset - 1)} className="btn h-9 w-9 text-ink-500 hover:bg-ink-500/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[78px] text-center">{label}</span>
          <button aria-label="Next" onClick={() => setOffset(offset + 1)} className="btn h-9 w-9 text-ink-500 hover:bg-ink-500/10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button className="btn btn-neu h-9 px-4 text-[13px]" onClick={() => setOffset(0)}>
          Today
        </button>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:gap-3">
          <Select aria-label="Technician" value={techId} onChange={(e) => setTechId(e.target.value)} className="min-w-0 flex-1 sm:w-[180px] sm:flex-none">
            <option value="all">All technicians</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <FilterTabs
            variant="soft"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setOffset(0);
            }}
            tabs={[
              { value: 'timeline', label: 'Timeline' },
              { value: 'month', label: 'Month' },
            ]}
          />
        </div>
      </div>
      {mode === 'timeline' ? (
        <JobTimeline db={db} base={BASE} offset={offset} techId={techId} />
      ) : (
        <MonthGrid monthLabel={label} firstWeekday={firstWeekday} days={daysIn} today={offset === 0 ? 16 : -1} chips={chips} />
      )}
    </div>
  );
}
