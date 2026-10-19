'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, PageHeader, Select, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleJobs, visibleVehicles } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateOfJob, estimateTotals, inr, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function ServiceHistory() {
  const db = useDb();
  const { user } = useSession();
  const [vid, setVid] = useState('all');
  if (!user) return null;
  const vehicles = visibleVehicles(db, user);
  const jobs = visibleJobs(db, user).filter((j) => j.stage === 'delivered' && (vid === 'all' || j.vehicleId === vid)).sort((a, b) => (a.completedInDays ?? 0) - (b.completedInDays ?? 0));
  const amount = (id: string) => {
    const inv = db.invoices.find((i) => i.jobId === id);
    if (inv) return inv.amount;
    const e = estimateOfJob(db, id);
    return e ? estimateTotals(e.items).total : 0;
  };
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Service History" subtitle="All past services for your vehicles." actions={<Select aria-label="Vehicle" value={vid} onChange={(e) => setVid(e.target.value)} className="w-[190px]"><option value="all">All Vehicles</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{vehicleName(v)}</option>)}</Select>} />
      {jobs.length === 0 ? <div className="neu"><EmptyState title="No completed services" text="Finished jobs will be listed here." /></div> : (
        <ul className="space-y-4">
          {jobs.map((j) => {
            const v = vehicleOf(db, j.vehicleId);
            return (
              <li key={j.id} className="neu flex items-center gap-4 !rounded-[22px] px-5 py-4 sm:gap-6">
                {v && <VehicleImage carKey={v.carKey} className="h-12 w-24" />}
                <div className="min-w-0 flex-1"><p className="font-bold">{vehicleName(v)}</p><p className="text-sm text-ink-500">{j.service}</p><p className="text-xs text-ink-400">{j.completedOn}</p></div>
                <p className="hidden font-bold sm:block">{inr(amount(j.id))}</p>
                <StatusBadge tone="green" className="hidden !px-5 !py-2 sm:inline-flex">Completed</StatusBadge>
                <Button variant="soft" size="sm" href={`/customer/jobs/${j.id}/details`}>View</Button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
