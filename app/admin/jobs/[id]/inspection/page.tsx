'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { InspectionBoard } from '@/components/features/InspectionBoard';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function AdminInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!job) return <NoAccess what="inspection" backHref="/admin/jobs" />;
  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/admin/jobs/${job.id}`} aria-label="Back to job" className="btn btn-neu h-11 w-11 !rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[24px] font-bold leading-tight">Inspection</h1>
          <p className="text-sm text-ink-500">#{job.id} · {vehicleName(vehicleOf(db, job.vehicleId))}</p>
        </div>
      </div>
      <InspectionBoard jobId={job.id} mode="admin" canEdit doneHref={`/admin/jobs/${job.id}`} />
    </>
  );
}
