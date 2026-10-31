'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { InspectionBoard } from '@/components/features/InspectionBoard';
import { NoAccess } from '@/components/features/NoAccess';
import { StatusBadge } from '@/components/ui';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { STAGE_LABEL, STAGE_TONE, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function EmployeeInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!user || !job) return <NoAccess what="inspection" backHref="/employee/jobs" />;
  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/employee/jobs/${job.id}`} aria-label="Back to job" className="btn btn-neu h-11 w-11 !rounded-full"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1"><h1 className="text-[22px] font-bold leading-tight">Inspection (3D &amp; Photos)</h1><p className="text-sm text-ink-500">#{job.id} · {vehicleName(vehicleOf(db, job.vehicleId))}</p></div>
        <StatusBadge tone={STAGE_TONE[job.stage]} dot className="hidden sm:inline-flex">{STAGE_LABEL[job.stage]}</StatusBadge>
      </div>
      <InspectionBoard jobId={job.id} mode="tech" canEdit doneHref={`/employee/jobs/${job.id}`} />
    </div>
  );
}
