'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Avatar } from '@/components/ui';

export type EventTone = 'blue' | 'green' | 'red' | 'amber' | 'violet';
export interface ScheduleEvent {
  id: string;
  title: string;
  line2: string;
  line3?: string;
  tone: EventTone;
  /** fractional column span */
  col0: number;
  col1: number;
  start: number;
  end: number;
  href?: string;
}
export interface ScheduleColumn {
  key: string;
  label: string;
  avatar?: string;
}

const EV: Record<EventTone, { bg: string; fg: string; bar: string }> = {
  blue: { bg: 'linear-gradient(135deg,#e6eff6,#d6e4ef)', fg: '#3f6f99', bar: '#5f8fb8' },
  green: { bg: 'linear-gradient(135deg,#e4f3ee,#d3ebe3)', fg: '#1a6f56', bar: '#248a6c' },
  red: { bg: 'linear-gradient(135deg,#fbeeeb,#f5d9d3)', fg: '#b93a1c', bar: '#d84a27' },
  amber: { bg: 'linear-gradient(135deg,#f7f1e1,#efe5c8)', fg: '#86661a', bar: '#c9a24a' },
  violet: { bg: 'linear-gradient(135deg,#eceef6,#dfe2ee)', fg: '#565f94', bar: '#7d86b5' },
};

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;

export function ScheduleGrid({
  columns, events, startHour = 8, endHour = 18, accentBar, className, empty,
}: {
  columns: ScheduleColumn[]; events: ScheduleEvent[]; startHour?: number; endHour?: number; accentBar?: boolean; className?: string; empty?: React.ReactNode;
}) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const n = columns.length;
  const H = 640;
  const pct = (h: number) => ((h - startHour) / (endHour - startHour)) * 100;
  return (
    <div className={clsx('neu-sm overflow-hidden !rounded-[20px] p-3 sm:p-4', className)}>
      <div className="thin-scroll overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${n}, 1fr)` }}>
            <span />
            {columns.map((c) => (
              <div key={c.key} className="flex items-center justify-center gap-2 pb-3 text-sm font-medium text-ink-700">
                {c.avatar && <Avatar src={c.avatar} name={c.label} size={30} />}
                {c.label}
              </div>
            ))}
          </div>
          <div className="relative" style={{ height: H }}>
            {hours.map((h) => (
              <div key={h} className="absolute left-0 right-0" style={{ top: `${pct(h)}%` }}>
                <span className="absolute -top-2 left-0 w-12 text-right text-[11px] text-ink-400">{hourLabel(h)}</span>
                <div className="ml-14 border-t border-ivory-300/80" />
              </div>
            ))}
            <div className="absolute inset-y-0 left-14 right-0 grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {columns.map((c) => (
                <div key={c.key} className="border-l border-ivory-300/70" />
              ))}
            </div>
            <div className="absolute inset-y-0 left-14 right-0">
              {events.map((e) => {
                const t = EV[e.tone];
                const style: React.CSSProperties = {
                  left: `${(e.col0 / n) * 100}%`,
                  width: `${((e.col1 - e.col0) / n) * 100}%`,
                  top: `${pct(e.start)}%`,
                  height: `${pct(e.end) - pct(e.start)}%`,
                  background: t.bg,
                  color: t.fg,
                  borderLeft: accentBar ? `3px solid ${t.bar}` : undefined,
                };
                const body = (
                  <>
                    <span className="block truncate text-[13px] font-bold leading-tight">{e.title}</span>
                    <span className="block truncate text-[13px] leading-tight opacity-90">{e.line2}</span>
                    {e.line3 && <span className="block truncate text-[13px] leading-tight opacity-90">{e.line3}</span>}
                  </>
                );
                const cls = 'absolute overflow-hidden rounded-xl px-3 py-2 shadow-[0_6px_14px_rgba(90,100,120,0.12),inset_0_0_0_1px_rgba(255,255,255,0.5)] transition hover:z-10 hover:shadow-pop';
                return e.href ? (
                  <Link key={e.id} href={e.href} className={cls} style={style}>
                    {body}
                  </Link>
                ) : (
                  <div key={e.id} className={cls} style={style}>
                    {body}
                  </div>
                );
              })}
            </div>
            {events.length === 0 && <div className="absolute inset-0 flex items-center justify-center">{empty}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MonthGrid({ monthLabel, firstWeekday, days, today, chips }: { monthLabel: string; firstWeekday: number; days: number; today: number; chips: Record<number, { id: string; label: string; tone: EventTone; href?: string }[]> }) {
  const cells = Array.from({ length: Math.ceil((firstWeekday + days) / 7) * 7 }, (_, i) => i - firstWeekday + 1);
  return (
    <div className="neu-sm !rounded-[20px] p-3 sm:p-4" aria-label={monthLabel}>
      <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-xs font-medium text-ink-400">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          const inMonth = d >= 1 && d <= days;
          return (
            <div key={i} className={clsx('min-h-[52px] rounded-xl p-1 text-xs sm:min-h-[92px] sm:p-1.5', inMonth ? 'bg-ink-500/[0.04]' : 'opacity-0', d === today && 'ring-2 ring-coral-400')}>
              {inMonth && <span className={clsx('mb-1 block font-semibold', d === today ? 'text-coral-600' : 'text-ink-500')}>{d}</span>}
              {inMonth && (chips[d]?.length ?? 0) > 0 && (
                <span className="flex flex-wrap gap-0.5 sm:hidden" aria-label={`${chips[d].length} jobs`}>
                  {chips[d].slice(0, 4).map((c) => <span key={c.id} className="h-1.5 w-1.5 rounded-full" style={{ background: EV[c.tone].bar }} />)}
                </span>
              )}
              <div className="hidden space-y-1 sm:block">
                {(inMonth ? chips[d] ?? [] : []).slice(0, 3).map((c) => {
                  const t = EV[c.tone];
                  const cls = 'block truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-medium';
                  return c.href ? (
                    <Link key={c.id} href={c.href} className={cls} style={{ background: t.bg, color: t.fg }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span key={c.id} className={cls} style={{ background: t.bg, color: t.fg }}>
                      {c.label}
                    </span>
                  );
                })}
                {inMonth && (chips[d]?.length ?? 0) > 3 && <span className="block text-[10px] text-ink-400">+{chips[d].length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const toneForCategory = (cat: string, service: string): EventTone =>
  /detail|ppf/i.test(service) ? 'violet' : cat === 'brake' ? 'green' : cat === 'body' ? 'red' : cat === 'ac' ? 'blue' : /inspection/i.test(service) ? 'blue' : 'amber';
