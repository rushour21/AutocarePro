'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock3, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { setJobStage, setOnHold } from '@/lib/actions';
import { STAGE_LABEL, STAGE_TONE, vehicleName, vehicleOf } from '@/lib/format';
import type { Db, Job } from '@/lib/types';
import { Button, ProgressBar, StatusBadge, VehicleImage } from '@/components/ui';

/** My Jobs row: car, ids, status + progress, time on job, primary action. */
export function JobRow({ db, job, by }: { db: Db; job: Job; by: string }) {
  const v = vehicleOf(db, job.vehicleId);
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const href = `/employee/jobs/${job.id}`;
  const action = job.stage === 'pending' || job.stage === 'inspection' ? 'Start' : job.stage === 'quality_check' || job.stage === 'ready' || job.stage === 'delivered' ? 'View' : 'Continue';
  const go = () => {
    if (job.stage === 'pending') setJobStage(job.id, 'inspection', by);
    router.push(href);
  };
  return (
    <div className="neu relative !rounded-[22px] px-4 py-4 sm:flex sm:items-center sm:gap-6 sm:px-5">
      <Link href={href} className="flex min-w-0 items-center gap-4 sm:flex-1 sm:gap-6">
        {v && <VehicleImage carKey={v.carKey} className="h-[54px] w-[96px] shrink-0 sm:h-[60px] sm:w-[110px]" />}
        <span className="min-w-0 sm:w-[170px]">
          <span className="block text-[17px] font-bold leading-tight">#{job.id}</span>
          <span className="block truncate text-[15px] font-semibold text-ink-700">{vehicleName(v)}</span>
          <span className="block text-xs text-ink-400">{v?.reg}</span>
        </span>
      </Link>
      <div className="mt-3 min-w-0 sm:mt-0 sm:w-[190px] sm:shrink-0">
        {job.onHold ? <StatusBadge tone="gray" dot size="lg">On Hold</StatusBadge> : <StatusBadge tone={STAGE_TONE[job.stage]} dot size="lg">{STAGE_LABEL[job.stage]}</StatusBadge>}
        <div className="mt-2 flex items-center gap-2.5">
          <ProgressBar value={job.progress} tone={job.progress === 0 ? 'coral' : 'green'} className="flex-1 !h-2" />
          <span className="w-8 text-[11px] text-ink-400">{job.progress}%</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 sm:mt-0 sm:contents">
        <span className="flex items-center gap-2 text-sm text-ink-700 sm:w-[84px] sm:shrink-0">
          <Clock3 className="h-[18px] w-[18px] text-ink-500" />
          {job.elapsed ?? '-'}
        </span>
        <Button variant={action === 'View' ? 'soft' : 'coral'} onClick={go} className="ml-auto min-w-[104px] sm:ml-0">
          {action}
        </Button>
        <div className="relative">
          <button type="button" aria-label={`More actions for ${job.id}`} aria-haspopup="menu" onClick={() => setMenu(!menu)} className="rounded-lg p-1.5 text-ink-500 hover:bg-white/70">
            <MoreVertical className="h-5 w-5" />
          </button>
          {menu && (
            <>
              <button className="fixed inset-0 z-20 cursor-default" aria-label="Close menu" onClick={() => setMenu(false)} />
              <div role="menu" className="neu-sm slide-up absolute right-0 top-full z-30 mt-1 w-48 p-1.5">
                <Link role="menuitem" href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/70">Open job</Link>
                <Link role="menuitem" href={`/employee/jobs/${job.id}/inspection`} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/70">Inspection</Link>
                <Link role="menuitem" href={`/employee/jobs/${job.id}/checklist`} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/70">Service checklist</Link>
                <button role="menuitem" onClick={() => { setOnHold(job.id, !job.onHold, by); setMenu(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/70">{job.onHold ? 'Resume job' : 'Put on hold'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
