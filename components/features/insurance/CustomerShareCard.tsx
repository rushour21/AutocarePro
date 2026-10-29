'use client';

import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Card, StatusBadge, useToast } from '@/components/ui';
import { approveCustomerShare } from '@/lib/actions';
import { inr } from '@/lib/format';
import { fmtAt, splitOf } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import { ClaimStatusBadge } from './ClaimParts';

/** Customer-portal card: what the insurer covers, what the customer pays, and a one-tap approval. */
export function CustomerShareCard({ jobId, customerName }: { jobId: string; customerName: string }) {
  const db = useDb();
  const toast = useToast();
  const claim = db.claims.find((c) => c.jobId === jobId);
  if (!claim || claim.lines.length === 0) return null;
  const s = splitOf(claim);
  return (
    <Card className="mb-5 p-4 sm:p-5" aria-label="Insurance claim">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-info-soft text-info"><ShieldCheck className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold leading-tight tracking-tight">Insurance claim</p>
          <p className="text-xs text-ink-500">{claim.insurer} · {claim.id}</p>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-info-soft/70 p-3.5">
          <p className="text-xs text-ink-500">Insurance pays</p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-info sm:text-[26px]">{inr(s.insurance)}</p>
        </div>
        <div className="rounded-2xl bg-coral-100 p-3.5">
          <p className="text-xs text-ink-500">You pay</p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-coral-600 sm:text-[26px]">{inr(s.customer)}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        <li className="flex justify-between text-ink-600"><span>Repair estimate</span><span className="font-medium">{inr(s.total)}</span></li>
        {s.notCovered > 0 && <li className="flex justify-between text-ink-600"><span>Items not covered by insurance</span><span className="font-medium">{inr(s.notCovered)}</span></li>}
        {s.depreciation > 0 && <li className="flex justify-between text-ink-600"><span>Depreciation on parts</span><span className="font-medium">{inr(s.depreciation)}</span></li>}
        <li className="flex justify-between text-ink-600"><span>Compulsory deductible</span><span className="font-medium">{inr(s.deductible)}</span></li>
      </ul>

      {claim.customerApprovedAt ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2.5 text-sm font-medium text-ok" role="status">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Approved on {fmtAt(claim.customerApprovedAt)}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => { approveCustomerShare(claim.id, customerName); toast.show('Your share is approved'); }}>Approve {inr(s.customer)}</Button>
          <StatusBadge tone="amber" size="sm">Waiting for your approval</StatusBadge>
        </div>
      )}
      {toast.node}
    </Card>
  );
}
