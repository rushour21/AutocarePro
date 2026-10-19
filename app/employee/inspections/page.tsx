'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { EmptyState, PageHeader, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function InspectionsPage() {
  const db = useDb();
  const { user } = useSession();
  if (!user) return null;
  const jobs = visibleJobs(db, user).filter(isActive);
  return (
    <>
      <TopBar />
      <PageHeader title="Inspections" subtitle="Record the condition of each vehicle you are working on" />
      <ul className="space-y-3">
        {jobs.map((j) => {
          const v = vehicleOf(db, j.vehicleId);
          const issues = j.points.filter((p) => p.status === 'minor' || p.status === 'major').length;
          const checked = j.points.filter((p) => p.status !== 'unchecked').length;
          return (
            <li key={j.id}>
              <Link href={`/employee/jobs/${j.id}/inspection`} className="neu flex items-center gap-5 !rounded-[20px] px-5 py-3.5 transition hover:-translate-y-0.5">
                {v && <VehicleImage carKey={v.carKey} className="h-12 w-24" />}
                <span className="flex-1"><span className="block font-bold">#{j.id} · {vehicleName(v)}</span><span className="block text-sm text-ink-500">{checked}/{j.points.length} areas checked</span></span>
                <StatusBadge tone={issues ? 'amber' : 'gray'}>{issues} {issues === 1 ? 'issue' : 'issues'}</StatusBadge>
                <ChevronRight className="h-5 w-5 text-ink-300" />
              </Link>
            </li>
          );
        })}
        {jobs.length === 0 && <EmptyState title="No vehicles to inspect" />}
      </ul>
    </>
  );
}
