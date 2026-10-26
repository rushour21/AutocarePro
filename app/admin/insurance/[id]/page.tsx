'use client';

import { useParams } from 'next/navigation';
import { TopBar } from '@/components/layout/AppShell';
import { ClaimWorkspace } from '@/components/features/insurance/ClaimWorkspace';
import { PageHeader } from '@/components/ui';
import { useDb } from '@/lib/store';

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const claim = db.claims.find((c) => c.id === id);
  return (
    <>
      <TopBar showUser />
      <PageHeader back={{ href: '/admin/insurance', label: 'Insurance Claims' }} title={claim ? `Claim ${claim.id}` : 'Claim not found'} subtitle={claim ? `Job #${claim.jobId}` : undefined} />
      <ClaimWorkspace claimId={id} />
    </>
  );
}
