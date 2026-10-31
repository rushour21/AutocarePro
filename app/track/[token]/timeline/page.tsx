'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Check, Circle, Dot } from 'lucide-react';
import { ShareCard, useTrack } from '@/components/share/ShareKit';
import { buildTimeline, type TimelineEntry } from '@/lib/track';
import { useDb } from '@/lib/store';

const BADGE: Record<NonNullable<TimelineEntry['badge']>['tone'], string> = {
  green: 'bg-ok-soft text-ok-strong',
  amber: 'bg-warn-soft text-warn-strong',
  red: 'bg-bad-soft text-bad-strong',
  coral: 'bg-coral-100 text-coral-600',
  link: 'bg-white text-coral-600 shadow-neu-xs',
};

export default function ShareTimeline() {
  const { job, base } = useTrack();
  const db = useDb();
  const entries = buildTimeline(db, job);
  return (
    <ShareCard>
      <ol className="neu-row px-4 py-4 sm:px-6" aria-label="Service progress">
        {entries.map((e, i) => {
          const last = i === entries.length - 1;
          return (
            <li key={e.label} className="relative flex gap-4 pb-5 last:pb-0" aria-current={e.state === 'current' ? 'step' : undefined}>
              {!last && <span className={clsx('absolute left-[17px] top-9 h-[calc(100%-24px)] w-[3px] rounded-full', e.state === 'done' ? 'bg-[#9fd4c4]' : 'bg-ivory-300')} />}
              <span className={clsx('relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white', e.state === 'done' ? 'bg-gradient-to-b from-[#3fae90] to-[#248a6c] shadow-[0_4px_10px_rgba(36,138,108,0.3)]' : e.state === 'current' ? 'bg-gradient-to-b from-[#e4633f] to-[#cf4320] shadow-coral' : 'neu-sm !rounded-full text-ink-400')}>
                {e.state === 'done' ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : e.state === 'current' ? <Circle className="h-3.5 w-3.5 fill-white" /> : <Dot className="h-6 w-6" strokeWidth={5} />}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <p className={clsx('text-[15px] font-semibold', e.state === 'current' && 'text-coral-600', e.state === 'pending' && 'text-ink-700')}>{e.label}</p>
                  {e.at && e.state !== 'pending' && <p className="text-sm text-ink-400">{e.at}</p>}
                  {e.bullets && e.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {e.bullets.map((b) => <li key={b} className="flex items-center gap-2 text-sm text-ink-600"><span className="h-1.5 w-1.5 rounded-full bg-ink-300" />{b}</li>)}
                    </ul>
                  )}
                </div>
                {e.badge &&
                  (e.badge.tone === 'link' ? (
                    <Link href={`${base}/inspection`} className={clsx('rounded-xl px-5 py-2 text-[13px] font-semibold', BADGE.link)}>{e.badge.text}</Link>
                  ) : (
                    <span className={clsx('min-w-[104px] rounded-xl px-5 py-2 text-center text-[13px] font-semibold', BADGE[e.badge.tone])}>{e.badge.text}</span>
                  ))}
              </div>
            </li>
          );
        })}
      </ol>
    </ShareCard>
  );
}
