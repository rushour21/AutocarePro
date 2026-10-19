'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { EstimateTable, EstimateTotals } from '@/components/features/EstimateView';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, ConfirmDialog, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { decideEstimate } from '@/lib/actions';
import { visibleEstimates } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateTotals, inr, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const TONE = { 'Awaiting Approval': 'amber', Approved: 'green', Rejected: 'red', Draft: 'gray' } as const;

export default function CustomerEstimate() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [ask, setAsk] = useState<'approve' | 'reject' | null>(null);
  const est = user ? visibleEstimates(db, user).find((e) => e.id === id && e.status !== 'Draft') : undefined;
  if (!user || !est) return <NoAccess what="estimate" backHref="/customer/estimates" />;
  const job = db.jobs.find((j) => j.id === est.jobId)!;
  const v = vehicleOf(db, job.vehicleId);
  const pending = est.status === 'Awaiting Approval';

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/customer/estimates" aria-label="Back to estimates" className="btn btn-neu h-11 w-11 !rounded-full"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-[24px] font-bold">Estimate {est.id}</h1>
        <StatusBadge tone={TONE[est.status]} dot size="lg" className="ml-auto">{est.status}</StatusBadge>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Card className="mb-4 flex items-center gap-4 p-4">{v && <VehicleImage carKey={v.carKey} className="h-14 w-28" />}<div><p className="font-bold">{vehicleName(v)}</p><p className="text-sm text-ink-400">{v?.reg}</p></div></Card>
          <EstimateTable items={est.items} columns={['type']} />
          <EstimateTotals items={est.items} className="mt-4" />
          {pending ? (
            <div className="mt-5 grid grid-cols-[1fr_1.6fr] gap-3">
              <Button variant="soft" size="lg" className="!h-14 !rounded-2xl text-[15px]" onClick={() => setAsk('reject')}>Reject</Button>
              <Button size="lg" className="!h-14 !rounded-2xl text-[15px]" onClick={() => setAsk('approve')}>Approve Estimate</Button>
            </div>
          ) : (
            <p className="neu-in-sm mt-5 p-4 text-sm text-ink-600">You {est.status.toLowerCase()} this estimate for {inr(estimateTotals(est.items).total)}.</p>
          )}
        </div>
        <div className="space-y-4">
          <Button variant="blue" size="lg" className="w-full !h-14 text-[15px] font-semibold" href={`/customer/jobs/${job.id}`}>View Job</Button>
          <Card className="overflow-hidden p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/photos/estimate-disc.jpg" alt="Worn brake disc" className="aspect-[1/0.95] w-full rounded-2xl object-cover" />
            <div className="p-3 pt-4">
              <h2 className="font-bold">Why this service?</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-600">{est.why}</p>
              <Link href={`/customer/jobs/${job.id}/details`} className="mt-3 inline-block text-sm font-semibold text-info-strong">View Inspection Report</Link>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={ask !== null}
        onClose={() => setAsk(null)}
        title={ask === 'approve' ? 'Approve this estimate?' : 'Reject this estimate?'}
        message={ask === 'approve' ? `The workshop will start the work. Total: ${inr(estimateTotals(est.items).total)} including GST.` : 'The workshop will not proceed with this work. You can talk to your service advisor if you want to change the quote.'}
        confirmLabel={ask === 'approve' ? 'Approve' : 'Reject'}
        danger={ask === 'reject'}
        onConfirm={() => { decideEstimate(est.id, ask === 'approve' ? 'Approved' : 'Rejected', user.name); toast.show(ask === 'approve' ? 'Estimate approved' : 'Estimate rejected'); }}
      />
      {toast.node}
    </>
  );
}
