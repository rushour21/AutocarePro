'use client';

import Link from 'next/link';
import { useState } from 'react';
import { InitialApproval } from '@/components/features/EstimateApproval';
import { JobStepper } from '@/components/features/JobProgress';
import { Card, EmptyState, FilterTabs, StatusBadge, VehicleImage } from '@/components/ui';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Job, Stage } from '@/lib/types';

const BADGE_TONE: Record<Stage, 'blue' | 'violet' | 'amber' | 'green' | 'gray'> = { pending: 'gray', inspection: 'blue', diagnostics: 'violet', in_repair: 'blue', quality_check: 'amber', ready: 'green', delivered: 'green' };

/** Customer-facing job tracking. Only customer-safe data is rendered (no internal notes or other customers' vehicles). */
export function JobStatusView({ job, detailsHref }: { job: Job; detailsHref?: string }) {
  const db = useDb();
  const [tab, setTab] = useState<'photos' | 'checklist' | 'notes'>('notes');
  const v = vehicleOf(db, job.vehicleId);
  const photos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const updates = job.activity.filter((a) => !a.text.startsWith('Note:') && !a.text.startsWith('Requested') && !a.text.startsWith('Assigned'));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight">Job Status</h1>
          <p className="mt-1 text-sm text-ink-500">Track your vehicle&apos;s progress.</p>
        </div>
        <StatusBadge tone={BADGE_TONE[job.stage]} dot size="lg" className="!px-5 !py-2.5 !text-[15px] shadow-neu-sm">{STAGE_LABEL[job.stage]}</StatusBadge>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-5">
          {v && <VehicleImage carKey={v.carKey} className="h-[70px] w-[130px]" />}
          <div className="flex-1">
            <p className="text-lg font-bold">{vehicleName(v)}</p>
            <p className="text-sm text-ink-500">{v?.reg}</p>
          </div>
          <Link href="/customer/share" className="btn btn-neu h-10 px-4 text-sm">Share link</Link>
          {detailsHref && <Link href={detailsHref} className="btn btn-soft h-10 px-4 text-sm">Full job details</Link>}
        </div>
        <JobStepper job={job} className="mt-6" currentStyle="active" showTimes labels={['Inspection', 'Approval', 'In Repair', 'Quality Check', 'Ready for Delivery']} />
      </Card>

      <InitialApproval job={job} by="Customer" />
      <FilterTabs variant="soft" className="my-5" value={tab} onChange={setTab} tabs={[{ value: 'notes', label: 'Updates' }, { value: 'photos', label: 'Photos' }, { value: 'checklist', label: 'Checklist' }]} />

      {tab === 'photos' && (photos.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{photos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p} src={p} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-neu-sm" />
      ))}</div> : <Card><EmptyState title="No photos yet" text="Photos from the workshop will appear here." /></Card>)}
      {tab === 'checklist' && (
        <Card className="p-5"><ul className="space-y-2.5">{job.tasks.map((t) => <li key={t.id} className="neu-row flex items-center gap-3 px-4 py-3 text-sm"><span className="flex-1">{t.title}</span><StatusBadge tone={t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'amber' : 'gray'}>{t.status}</StatusBadge></li>)}</ul></Card>
      )}
      {tab === 'notes' && (
        <Card className="p-5">
          {updates.length === 0 ? <EmptyState title="No updates yet" /> : <ol className="space-y-4 border-l-2 border-ivory-300 pl-5">{updates.map((a) => <li key={a.id} className="relative"><span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-coral-500 ring-4 ring-white" /><p className="text-sm">{a.text}</p><p className="text-xs text-ink-400">{a.at}</p></li>)}</ol>}
        </Card>
      )}
    </>
  );
}
