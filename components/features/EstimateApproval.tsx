'use client';

import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button, StatusBadge } from '@/components/ui';
import { decideItems, tickClientApproval } from '@/lib/actions';
import { estimateTotals, inr, itemApproval, quotedItems, sentItems } from '@/lib/format';
import type { ApprovalMethod, Estimate, Job } from '@/lib/types';

/** Shown to the client when the workshop asks for the initial go-ahead. */
export function InitialApproval({ job, by, onDone }: { job: Job; by: string; onDone?: () => void }) {
  if (!job.approvalAsked || job.clientApproval) return null;
  return (
    <div className="mx-auto mt-5 flex max-w-[780px] flex-wrap items-center gap-3 rounded-2xl bg-warn-soft px-5 py-4 text-warn-strong">
      <span className="min-w-[200px] flex-1"><span className="block text-[17px] font-bold">Approve the inspection?</span><span className="block text-[15px]">We will send you the price before doing any work.</span></span>
      <Button onClick={() => { tickClientApproval(job.id, 'Tracking link', by); onDone?.(); }}><Check className="h-4 w-4" strokeWidth={3} /> Approve</Button>
    </div>
  );
}

const TONE = { Approved: 'green', Declined: 'red', Pending: 'amber' } as const;

/** The client decides each new line on its own, so one disagreement never blocks the rest. */
export function EstimateApproval({ est, by, method, onDone }: { est: Estimate; by: string; method: ApprovalMethod; onDone: (m: string) => void }) {
  const [picks, setPicks] = useState<Record<string, 'Approved' | 'Declined'>>({});
  const open = sentItems(est);
  const decided = est.items.filter((i) => itemApproval(est, i) !== 'Pending');
  const allPicked = open.length > 0 && open.every((i) => picks[i.id]);
  const after = estimateTotals(quotedItems(est).filter((i) => picks[i.id] !== 'Declined'));
  const set = (id: string, d: 'Approved' | 'Declined') => setPicks((p) => ({ ...p, [id]: d }));

  return (
    <div className="space-y-4">
      {open.length > 0 && (
        <section aria-label="Needs your approval">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-bold">Needs your approval</h2>
            <Button size="sm" variant="neu" onClick={() => setPicks(Object.fromEntries(open.map((i) => [i.id, 'Approved' as const])))}>Approve all</Button>
          </div>
          <ul className="space-y-2.5">
            {open.map((i) => (
              <li key={i.id} className="neu-row px-4 py-3">
                <div className="flex gap-3">
                  {i.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.photo} alt={`Photo of ${i.name}`} className="h-16 w-20 shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3"><p className="font-semibold">{i.name}</p><p className="font-bold">{inr(i.amount)}</p></div>
                    {i.reason && <p className="mt-0.5 text-sm text-ink-600">{i.reason}</p>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={picks[i.id] === 'Declined'} onClick={() => set(i.id, 'Declined')} className={clsx('flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition', picks[i.id] === 'Declined' ? 'bg-bad text-white' : 'neu-sm text-ink-600')}><X className="h-4 w-4" /> Decline</button>
                  <button type="button" aria-pressed={picks[i.id] === 'Approved'} onClick={() => set(i.id, 'Approved')} className={clsx('flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition', picks[i.id] === 'Approved' ? 'bg-ok text-white' : 'neu-sm text-ink-600')}><Check className="h-4 w-4" strokeWidth={3} /> Approve</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between text-sm font-bold"><span>Total with GST</span><span>{inr(after.total)}</span></div>
          <Button size="lg" className="mt-3 w-full !h-14" disabled={!allPicked} onClick={() => { decideItems(est.id, picks, method, by); setPicks({}); onDone('Your decision was sent to the workshop'); }}>Confirm decision</Button>
        </section>
      )}
      {decided.length > 0 && (
        <section aria-label="Decided work">
          <h2 className="mb-2 font-bold">{open.length ? 'Already decided' : 'Your work list'}</h2>
          <ul className="space-y-2">
            {decided.map((i) => {
              const a = itemApproval(est, i);
              return <li key={i.id} className="neu-row flex items-center gap-3 px-4 py-3 text-sm"><span className="min-w-0 flex-1"><span className={clsx('block', a === 'Declined' && 'text-ink-400 line-through')}>{i.name}</span>{i.decidedVia && <span className="block text-xs text-ink-400">{i.decidedVia}</span>}</span><span className="font-semibold">{inr(i.amount)}</span><StatusBadge tone={TONE[a]}>{a}</StatusBadge></li>;
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
