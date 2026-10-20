'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { Download, ReceiptText } from 'lucide-react';
import { ShareCard, useTrack } from '@/components/share/ShareKit';
import { EmptyState, StatusBadge } from '@/components/ui';
import { inr } from '@/lib/format';
import { invoiceBreakdown } from '@/lib/track';
import { useDb } from '@/lib/store';

export default function ShareInvoice() {
  const { job } = useTrack();
  const db = useDb();
  const [tab, setTab] = useState<'inv' | 'pay'>('inv');
  const inv = db.invoices.find((i) => i.jobId === job.id);

  const tabs = (
    <div role="tablist" aria-label="Billing" className="flex gap-1">
      {([['inv', 'Invoices'], ['pay', 'Payments']] as const).map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('h-10 rounded-xl px-5 text-sm font-semibold transition', tab === k ? 'tab-soft-active text-ink' : 'text-ink-500')}>{l}</button>
      ))}
    </div>
  );

  if (!inv) {
    return (
      <ShareCard tabs={tabs}>
        <EmptyState icon={<ReceiptText className="h-7 w-7" />} title="No invoice yet" text="Your invoice is issued when the work is complete. You will be able to see and download it here." />
      </ShareCard>
    );
  }
  const b = invoiceBreakdown(db, job.id, inv.amount);
  const paid = inv.status === 'Paid';

  return (
    <ShareCard tabs={tabs}>
      {tab === 'inv' ? (
        <>
          <div className="neu-row px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 shadow-neu-xs"><ReceiptText className="h-6 w-6" /></span>
              <div className="flex-1"><h1 className="text-xl font-bold">{inv.id}</h1><p className="text-sm text-ink-400">{inv.date}</p></div>
              <StatusBadge tone={paid ? 'green' : inv.status === 'Pending' ? 'amber' : 'gray'} size="lg" className="!px-6 !py-2.5 !text-[15px]">{inv.status}</StatusBadge>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-y border-ivory-300/70 text-left font-semibold"><th className="py-3">Description</th><th className="py-3 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-ivory-300/60 text-ink-600">
                {b.rows.map((r) => <tr key={r.d}><td className="py-3">{r.d}</td><td className="py-3 text-right font-medium text-ink-800">{inr(r.a)}</td></tr>)}
              </tbody>
            </table>
            <dl className="mt-1 space-y-2 border-t border-ivory-300/70 pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-bold">{inr(b.subtotal)}</dd></div>
              <div className="flex justify-between text-ink-600"><dt>GST (18%)</dt><dd className="font-semibold text-ink-700">{inr(b.gst)}</dd></div>
              <div className="flex justify-between border-t border-ivory-300/70 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-bold">{inr(b.total)}</dd></div>
            </dl>
          </div>
          {paid ? (
            <dl className="neu-row mt-3 space-y-2 px-4 py-4 text-sm sm:px-6">
              <dt className="mb-1 font-bold">Payment Details</dt>
              <div className="flex justify-between"><dt className="text-ink-500">Paid on</dt><dd>{inv.paidOn ?? inv.date}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Payment Method</dt><dd>{inv.method ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Transaction ID</dt><dd>{inv.txnId ?? '—'}</dd></div>
            </dl>
          ) : (
            <p className="neu-in-sm mt-3 p-4 text-sm text-ink-600">Payment is pending. <Link href="/login" className="font-semibold text-coral-600">Sign in</Link> to pay securely.</p>
          )}
          <button onClick={() => window.print()} className="mx-auto mt-4 flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink"><Download className="h-4 w-4" /> Download Invoice</button>
        </>
      ) : paid ? (
        <ul className="space-y-2.5">
          <li className="neu-row flex items-center gap-4 px-5 py-4 text-sm"><span className="flex-1"><span className="block font-semibold">{inv.id} · {inr(inv.amount)}</span><span className="block text-ink-400">{inv.paidOn ?? inv.date} · {inv.method ?? 'UPI'}</span></span><StatusBadge tone="green">Paid</StatusBadge></li>
        </ul>
      ) : (
        <EmptyState title="No payments yet" text="Payments for this job will be listed here once they are made." />
      )}
    </ShareCard>
  );
}
