'use client';

import { useParams } from 'next/navigation';
import { JobStatusView } from '@/components/features/JobStatusView';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { useDb } from '@/lib/store';

export default function CustomerJobPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!user || !job) return <NoAccess what="job" backHref="/customer" />;
  return (
    <>
      <TopBar showUser />
      <JobStatusView job={job} detailsHref={`/customer/jobs/${job.id}/details`} />
    </>
  );
}
