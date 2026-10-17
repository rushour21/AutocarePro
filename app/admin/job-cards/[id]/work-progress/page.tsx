'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronRight, Plus } from 'lucide-react';
import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { adminWorkSteps, progressPhotos } from '@/lib/data';

export default function AdminWorkProgress() {
  const [steps, setSteps] = useState(adminWorkSteps);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_400px]">
        <ol className="relative">
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <li key={s.label} className="relative flex gap-4 border-b border-admin-line py-4 last:border-0">
                {!last && <span className={clsx('absolute left-[15px] top-12 h-[calc(100%-24px)] w-[2px]', s.state === 'done' ? 'bg-[#1f9d63]' : 'bg-[#d9dcdf]')} />}
                <span
                  className={clsx(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    s.state === 'done' && 'bg-[#1f9d63]',
                    s.state === 'current' && 'bg-[#1d63ed]',
                    s.state === 'pending' && 'bg-[#e4e6e8]',
                  )}
                >
                  {s.state === 'done' && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  {s.state === 'current' && <ChevronRight className="h-4 w-4 text-white" strokeWidth={3} />}
                  {s.state === 'pending' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-[15px] font-medium', s.state === 'done' && 'text-[#1f9d63]', s.state === 'current' && 'text-[#1d63ed]')}>{s.label}</p>
                  <p className="text-sm text-gray-500">{s.detail}</p>
                </div>
                {s.state === 'done' && <ChevronRight className="mt-2 h-4 w-4 text-gray-400" />}
                {s.state === 'current' && (
                  <button className="h-9 self-center rounded-md border border-[#b9cdf5] bg-[#f3f7ff] px-3 text-xs font-medium text-[#1d63ed]">View Details</button>
                )}
                {s.state === 'pending' && (
                  <button
                    onClick={() =>
                      setSteps(steps.map((x, j) => (j < i ? { ...x, state: 'done' } : j === i ? { ...x, state: 'current' } : x)))
                    }
                    className="h-8 self-center rounded-md px-2 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    Start
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <div>
          <h3 className="text-[15px] font-semibold">Progress Photos</h3>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {progressPhotos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={p} alt="" className="aspect-[1/0.92] w-full rounded-lg object-cover" />
            ))}
          </div>
          <button className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#b9cdf5] text-sm font-medium text-[#2f6fed]">
            <Plus className="h-4 w-4" /> Add Photo
          </button>
          <button onClick={() => setSaved(true)} className="mt-4 h-11 w-full rounded-lg bg-admin-btn text-sm font-medium text-white shadow-card">
            {saved ? 'Progress Updated ✓' : 'Update Progress'}
          </button>
        </div>
      </div>
    </>
  );
}
