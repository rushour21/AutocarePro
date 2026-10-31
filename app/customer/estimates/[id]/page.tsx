'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { DocLink } from '@/components/features/Documents';
import { EstimateApproval } from '@/components/features/EstimateApproval';
import { EstimateTotals } from '@/components/features/EstimateView';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { visibleEstimates } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { quotedItems, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const TONE = { 'Awaiting Approval': 'amber', Approved: 'green', Rejected: 'red', Draft: 'gray' } as const;

export default function CustomerEstimate() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const est = user ? visibleEstimates(db, user).find((e) => e.id === id && e.status !== 'Draft') : undefined;
  if (!user || !est) return <NoAccess what="estimate" backHref="/customer/estimates" />;
  const job = db.jobs.find((j) => j.id === est.jobId)!;
  const v = vehicleOf(db, job.vehicleId);

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
          <EstimateApproval est={est} by={user.name} method="Tracking link" onDone={toast.show} />
          <EstimateTotals items={quotedItems(est)} className="mt-4" />
        </div>
        <div className="space-y-4">
          <Button variant="blue" size="lg" className="w-full !h-14 text-[15px] font-semibold" href={`/customer/jobs/${job.id}`}>View Job</Button>
          <DocLink kind="estimate" docKey={job.trackingToken} className="btn btn-neu h-12 w-full justify-center text-[15px]">Download Estimate</DocLink>
          <Card className="overflow-hidden p-3">
            {!job.checkin && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/assets/photos/estimate-disc.jpg" alt="Worn brake disc" className="aspect-[1/0.95] w-full rounded-2xl object-cover" />
            )}
            <div className="p-3 pt-4">
              {est.why && <><h2 className="font-bold">Why this service?</h2><p className="mt-1.5 text-sm leading-6 text-ink-600">{est.why}</p></>}
              <Link href={`/customer/jobs/${job.id}/details`} className="mt-3 inline-block text-sm font-semibold text-info-strong">View Inspection Report</Link>
            </div>
          </Card>
        </div>
      </div>
      {toast.node}
    </>
  );
}
