import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { Tone, TimelineStep } from '@/lib/data';

const toneClass: Record<Tone, string> = {
  green: 'bg-ok-bg text-ok-fg',
  orange: 'bg-warn-bg text-warn-fg',
  purple: 'bg-violet-bg text-violet-fg',
  blue: 'bg-info-bg text-info-fg',
  red: 'bg-bad-bg text-bad-fg',
  gray: 'bg-gray-100 text-gray-500',
  teal: 'bg-[#e1efe9] text-[#2c7a5c]',
};

export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center whitespace-nowrap rounded-md px-2 py-[3px] text-xs font-medium', toneClass[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes('waiting') || s === 'pending' || s.includes('sent for')) return 'orange';
  if (s.includes('inspection') || s.includes('diagnosis')) return 'purple';
  if (s.includes('ready')) return 'blue';
  if (s.includes('unpaid') || s.includes('rejected')) return 'red';
  return 'green';
}

export function priorityTone(p: string): Tone {
  return p === 'High' ? 'red' : p === 'Medium' ? 'orange' : p === 'Low' ? 'green' : 'gray';
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('rounded-xl border border-admin-line bg-admin-card shadow-card', className)}>{children}</div>;
}

export function Avatar({ src, size = 36, className }: { src: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className={clsx('shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />
  );
}

export function Initial({ letter, size = 36, className }: { letter: string; size?: number; className?: string }) {
  return (
    <span
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', className)}
      style={{ width: size, height: size }}
    >
      {letter}
    </span>
  );
}

/** Vertical status timeline used in admin/employee job overviews and the mobile tracker. */
export function VTimeline({
  steps,
  accent = '#1f9d63',
  current = '#1d63ed',
  dense = false,
}: {
  steps: TimelineStep[];
  accent?: string;
  current?: string;
  dense?: boolean;
}) {
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const lineColor = s.state === 'done' ? accent : '#d9dcdf';
        return (
          <li key={s.label} className={clsx('relative flex gap-3', dense ? 'pb-4' : 'pb-5', last && 'pb-0')}>
            {!last && <span className="absolute left-[11px] top-6 h-[calc(100%-20px)] w-[2px]" style={{ background: lineColor }} />}
            <span
              className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: s.state === 'done' ? accent : s.state === 'current' ? current : '#fff',
                border: s.state === 'pending' ? '2px solid #d4d7db' : 'none',
              }}
            >
              {s.state === 'done' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-white" />}
              {s.state === 'pending' && <Check className="h-3 w-3 text-[#cfd3d7]" strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <p
                className={clsx('text-sm font-medium leading-5', s.state === 'pending' && 'text-gray-400')}
                style={s.state === 'current' ? { color: current } : undefined}
              >
                {s.label}
              </p>
              {s.time && <p className={clsx('text-xs', s.state === 'pending' ? 'text-gray-300' : 'text-gray-500')}>{s.time}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Horizontal progress stepper (approval status, customer tracker, work progress). */
export function HStepper({
  steps,
  accent = '#1f9d63',
  current = '#1d63ed',
  labelTone = 'accent',
}: {
  steps: { label: string; time?: string; state: 'done' | 'current' | 'pending' }[];
  accent?: string;
  current?: string;
  labelTone?: 'accent' | 'plain';
}) {
  return (
    <div className="flex w-full items-start">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const nextState = steps[i + 1]?.state;
        const line = s.state === 'done' ? (nextState === 'current' ? `linear-gradient(to right, ${accent}, ${current})` : accent) : '#dcdfe3';
        return (
          <div key={s.label} className="relative flex flex-1 flex-col items-center text-center">
            {!last && <span className="absolute left-1/2 top-[11px] h-[2px] w-full" style={{ background: line }} />}
            <span
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white"
              style={{
                background: s.state === 'done' ? accent : s.state === 'current' ? current : '#fff',
                border: s.state === 'pending' ? '3px solid #d7dadd' : 'none',
                boxShadow: s.state === 'current' ? `0 0 0 4px ${current}22` : undefined,
              }}
            >
              {s.state === 'done' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              {s.state === 'current' && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <p
              className={clsx('mt-2 text-xs font-medium', s.state === 'pending' ? 'text-gray-500' : '')}
              style={
                labelTone === 'accent'
                  ? { color: s.state === 'done' ? accent : s.state === 'current' ? current : undefined }
                  : s.state === 'current'
                    ? { color: current }
                    : undefined
              }
            >
              {s.label}
            </p>
            {s.time && <p className="mt-0.5 text-[11px] text-gray-400">{s.time}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('text-[15px] font-semibold text-admin-ink', className)}>{children}</h3>;
}

export function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-xs text-gray-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  'h-10 w-full rounded-lg border border-[#e3e5e8] bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#9db7f5] focus:ring-2 focus:ring-[#1d63ed]/10';
