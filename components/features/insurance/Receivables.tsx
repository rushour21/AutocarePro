'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Button, Card, Field, Input, Modal, StatusBadge, useToast } from '@/components/ui';
import { recordClaimPayment } from '@/lib/actions';
import { customerOf, inr, vehicleName, vehicleOf } from '@/lib/format';
import { daysOpen, expectedFromInsurer, inrShort, pendingAmount, receivables } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import type { Claim } from '@/lib/types';
import { ClaimStatusBadge } from './ClaimParts';

export function Receivables() {
  const db = useDb();
  const toast = useToast();
  const r = receivables(db.claims);
  const [pay, setPay] = useState<Claim | null>(null);
  const [amount, setAmount] = useState('');
  const shortTotal = r.rows.reduce((s, x) => s + x.shortPaid, 0);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5 sm:p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 text-coral-500 ring-[6px] ring-white/70"><Wallet className="h-6 w-6" /></span>
        <div>
          <p className="text-xs font-medium text-ink-500">Insurance receivables</p>
          <p className="text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]" data-testid="receivables-header">
            {inrShort(r.pending)} pending <span className="text-ink-300">·</span> {r.claims} claims <span className="text-ink-300">·</span> oldest {r.oldestDays} days
          </p>
        </div>
        {shortTotal > 0 && <StatusBadge tone="amber" className="sm:ml-auto">{inr(shortTotal)} short-paid so far</StatusBadge>}
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-[17px] font-bold tracking-tight">By insurer</h2>
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-[12px] font-medium text-ink-400"><th className="pb-2">Insurer</th><th className="pb-2 text-right">Pending</th><th className="pb-2 text-right">Claims</th><th className="pb-2 text-right">Oldest pending</th><th className="pb-2 text-right">Short-paid</th></tr>
            </thead>
            <tbody>
              {r.rows.map((x) => (
                <tr key={x.insurer} className="border-t border-ivory-300/70">
                  <td className="py-3 font-semibold">{x.insurer}</td>
                  <td className="py-3 text-right font-semibold">{inr(x.pending)}</td>
                  <td className="py-3 text-right">{x.claims}</td>
                  <td className="py-3 text-right"><span className={x.oldestDays > 30 ? 'font-semibold text-bad' : ''}>{x.claims ? `${x.oldestDays} days` : '-'}</span></td>
                  <td className="py-3 text-right">{x.shortPaid ? <span className="font-semibold text-warn">{inr(x.shortPaid)}</span> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-[17px] font-bold tracking-tight">Claims awaiting payment</h2>
        <ul className="divide-y divide-ivory-300/70">
          {r.owed.sort((a, b) => daysOpen(b) - daysOpen(a)).map((c) => {
            const job = db.jobs.find((j) => j.id === c.jobId);
            const v = job && vehicleOf(db, job.vehicleId);
            const settleable = c.status === 'Delivered' || c.status === 'Payment Pending';
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-0 flex-1 basis-52">
                  <Link href={`/admin/insurance/${c.id}`} className="font-semibold hover:text-coral-600">{c.id} · {vehicleName(v)}</Link>
                  <p className="text-xs text-ink-500">{c.insurer} · {job && customerOf(db, job.customerId)?.name} · {daysOpen(c)} days open</p>
                </div>
                <ClaimStatusBadge status={c.status} />
                <span className="w-24 text-right font-semibold">{inr(pendingAmount(c))}</span>
                <Button size="sm" variant={settleable ? 'coral' : 'neu'} disabled={!settleable} onClick={() => { setPay(c); setAmount(String(pendingAmount(c))); }}>Mark payment received</Button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ink-400">Payment can be marked once the vehicle is delivered. Amounts follow the surveyor&apos;s approved figure when there is one.</p>
      </Card>

      <Modal
        open={!!pay}
        onClose={() => setPay(null)}
        title="Mark payment received"
        size="sm"
        footer={
          <>
            <Button variant="neu" onClick={() => setPay(null)}>Cancel</Button>
            <Button
              disabled={!(Number(amount) > 0)}
              onClick={() => {
                if (!pay) return;
                recordClaimPayment(pay.id, Math.round(Number(amount)));
                toast.show(`Payment recorded for ${pay.id}`);
                setPay(null);
              }}
            >
              Record payment
            </Button>
          </>
        }
      >
        {pay && (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">{pay.insurer} · {pay.id}. Expected {inr(expectedFromInsurer(pay))}. Enter less to record a short payment.</p>
            <Field label="Amount received (₹)"><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          </div>
        )}
      </Modal>
      {toast.node}
    </div>
  );
}
