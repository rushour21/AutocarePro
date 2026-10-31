'use client';

import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DAY = 86400000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FMT = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const QUICK: [number, string][] = [[0, 'Today'], [1, 'Tomorrow'], [2, 'In 2 days'], [7, 'In a week']];

const relative = (n: number) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`);

/** Picks a future day. The value is days from `todayIso`, which is how jobs store their due date. */
export function DayPicker({ label, value, onChange, todayIso }: { label: string; value: number; onChange: (days: number) => void; todayIso: string }) {
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  const picked = new Date(today + value * DAY);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: picked.getUTCFullYear(), m: picked.getUTCMonth() });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const first = Date.UTC(view.y, view.m, 1);
  const lead = (new Date(first).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => first + i * DAY)];
  const onFirstMonth = first <= today;
  const shift = (by: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + by) / 12), m: (m + by + 12) % 12 }));
  const choose = (days: number) => {
    const d = new Date(today + days * DAY);
    onChange(days);
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <span className="mb-1.5 block text-xs font-medium text-ink-500">{label}</span>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className="field flex items-center gap-2.5 text-left">
        <CalendarDays className="h-4 w-4 shrink-0 text-coral-500" />
        <span className="min-w-0 flex-1 truncate font-medium">{FMT.format(picked)}</span>
        <span className="shrink-0 text-xs text-ink-400">{relative(value)}</span>
      </button>
      {open && (
        <div role="dialog" aria-label={`Choose ${label.toLowerCase()}`} className="glass menu-in absolute left-0 right-0 z-40 mt-2 origin-top rounded-[20px] p-3 sm:left-auto sm:w-[320px]">
          <div className="mb-3 grid grid-cols-4 gap-1">
            {QUICK.map(([d, l]) => <button key={d} type="button" onClick={() => choose(d)} className={clsx('h-8 rounded-[10px] text-[11px] font-semibold transition-colors', value === d ? 'bg-coral-500 text-white' : 'bg-ink-500/[0.08] text-ink-600 hover:bg-ink-500/[0.14]')}>{l}</button>)}
          </div>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous month" disabled={onFirstMonth} onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors enabled:hover:bg-ink-500/10 disabled:text-ink-300"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-sm font-bold" aria-live="polite">{MONTHS[view.m]} {view.y}</p>
            <button type="button" aria-label="Next month" onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-500/10"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-400">{WEEK.map((w) => <span key={w} className="py-1">{w}</span>)}</div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((t, i) => {
              if (t === null) return <span key={`gap-${i}`} />;
              const days = Math.round((t - today) / DAY);
              const on = days === value;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={days < 0}
                  aria-label={FMT.format(new Date(t))}
                  aria-pressed={on}
                  onClick={() => choose(days)}
                  className={clsx('mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors', on ? 'bg-coral-500 font-bold text-white shadow-coral' : days < 0 ? 'text-ink-300' : 'font-medium text-ink-700 hover:bg-coral-100', days === 0 && !on && 'font-bold text-coral-600 ring-1 ring-coral-300')}
                >
                  {new Date(t).getUTCDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
