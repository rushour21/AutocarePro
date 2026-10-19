'use client';

import clsx from 'clsx';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { setTaskStatus } from '@/lib/actions';
import { STEP_INDEX } from '@/lib/format';
import type { Job, Task, TaskStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui';

const STEP_KEYS = ['inspection', 'approval', 'repair', 'quality', 'delivery'] as const;

export function JobStepper({
  job, labels = ['Inspection', 'Approval', 'Repair', 'Quality Check', 'Delivery'], showTimes, currentStyle = 'done', className,
}: {
  job: Job; labels?: string[]; showTimes?: boolean; currentStyle?: 'done' | 'active'; className?: string;
}) {
  const cur = STEP_INDEX[job.stage];
  return (
    <ol className={clsx('flex items-start', className)} aria-label="Job progress">
      {labels.map((label, i) => {
        const done = i < cur || (currentStyle === 'done' && i === cur);
        const active = currentStyle === 'active' && i === cur;
        const lineDone = i < cur;
        const time = job.timeline[STEP_KEYS[i]];
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center text-center" aria-current={i === cur ? 'step' : undefined}>
            {i < labels.length - 1 && <span className={clsx('absolute left-1/2 top-[15px] h-[3px] w-full rounded-full sm:top-[17px]', lineDone ? 'bg-gradient-to-r from-[#2fcf8a] to-[#18a56a]' : 'bg-ivory-300')} />}
            <span
              className={clsx(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white sm:h-9 sm:w-9',
                done ? 'bg-gradient-to-b from-[#2fcf8a] to-[#17a368] shadow-[0_4px_10px_rgba(29,157,101,0.35)]' : active ? 'bg-gradient-to-b from-[#ffa05f] to-[#f25a1f] shadow-coral' : 'neu-sm !rounded-full text-ink-400',
              )}
            >
              {done || active ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : <ChevronDown className="h-4 w-4" />}
            </span>
            <span className={clsx('mt-2 px-0.5 text-[11px] font-medium leading-tight sm:px-1 sm:text-[13px]', active ? 'text-coral-600' : done && i === cur ? 'font-semibold text-ink' : done ? 'text-ok-strong' : 'text-ink-500')}>{label}</span>
            {showTimes && <span className="mt-0.5 text-[10px] leading-tight text-ink-400 sm:text-[11px]">{time ?? 'Pending'}</span>}
          </li>
        );
      })}
    </ol>
  );
}

const TASK_TONE: Record<TaskStatus, { badge: 'green' | 'amber' | 'red'; ring: string }> = {
  Completed: { badge: 'green', ring: 'bg-ok text-white' },
  'In Progress': { badge: 'amber', ring: 'border-[3px] border-warn bg-warn-soft' },
  Pending: { badge: 'red', ring: 'border-[3px] border-bad bg-bad-soft' },
};
const NEXT: Record<TaskStatus, TaskStatus> = { Pending: 'In Progress', 'In Progress': 'Completed', Completed: 'Pending' };

export function TaskList({ jobId, tasks, canEdit }: { jobId: string; tasks: Task[]; canEdit: boolean }) {
  return (
    <ul className="space-y-2.5">
      {tasks.map((t) => {
        const tone = TASK_TONE[t.status];
        return (
          <li key={t.id}>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setTaskStatus(jobId, t.id, NEXT[t.status])}
              aria-label={`${t.title}: ${t.status}${canEdit ? '. Activate to change status' : ''}`}
              className="neu-row flex w-full items-center gap-3.5 px-4 py-3 text-left transition enabled:hover:-translate-y-0.5 disabled:cursor-default"
            >
              <span className={clsx('flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full', tone.ring)}>{t.status === 'Completed' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</span>
              <span className="flex-1 text-sm">{t.title}</span>
              <StatusBadge tone={tone.badge} className="min-w-[84px] justify-center">{t.status}</StatusBadge>
              {canEdit && <ChevronRight className="h-4 w-4 text-ink-300" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
