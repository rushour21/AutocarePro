'use client';

import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { EmptyState, PageHeader, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleEstimates } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateTotals, quotedItems, inr, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const TONE = { 'Awaiting Approval': 'amber', Approved: 'green', Rejected: 'red', Draft: 'gray' } as const;

export default function CustomerEstimates() {
  const db = useDb();
  const { user } = useSession();
  if (!user) return null;
  const list = visibleEstimates(db, user).filter((e) => e.status !== 'Draft');
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Estimates" subtitle="Review and approve quotes for your vehicles." />
      {list.length === 0 ? <div className="neu"><EmptyState icon={<FileText className="h-7 w-7" />} title="No estimates yet" text="When the workshop prepares a quote, it will appear here." /></div> : (
        <ul className="space-y-4">
          {list.map((e) => {
            const j = db.jobs.find((x) => x.id === e.jobId);
            const v = j && vehicleOf(db, j.vehicleId);
            return (
              <li key={e.id}>
                <Link href={`/customer/estimates/${e.id}`} className="neu flex items-center gap-5 !rounded-[22px] px-5 py-4 transition hover:-translate-y-0.5">
                  {v && <VehicleImage carKey={v.carKey} className="h-14 w-28" />}
                  <span className="flex-1"><span className="block font-bold">{e.id}</span><span className="block text-sm text-ink-500">{vehicleName(v)} · {j?.service}</span></span>
                  <span className="text-right"><span className="block font-bold">{inr(estimateTotals(quotedItems(e)).total)}</span><StatusBadge tone={TONE[e.status]} size="sm">{e.status}</StatusBadge></span>
                  <ChevronRight className="h-5 w-5 text-ink-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
