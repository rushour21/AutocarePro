'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { JobStepper } from '@/components/features/JobProgress';
import { WorkshopLiveView } from '@/components/features/WorkshopLiveView';
import { Card, EmptyState, FilterTabs, StatusBadge, VehicleImage } from '@/components/ui';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Job, Stage } from '@/lib/types';

const CAPTION: Record<Stage, string> = {
  pending: 'Your vehicle is scheduled and will be checked in shortly.',
  inspection: 'Our team is inspecting your vehicle.',
  diagnostics: 'Our team is diagnosing your vehicle.',
  in_repair: 'Our team is working on your vehicle.',
  quality_check: 'Your vehicle is going through its final quality check.',
  ready: 'Your vehicle is ready for pickup.',
  delivered: 'Your vehicle has been delivered.',
};
const BADGE_TONE: Record<Stage, 'blue' | 'violet' | 'amber' | 'green' | 'gray'> = { pending: 'gray', inspection: 'blue', diagnostics: 'violet', in_repair: 'blue', quality_check: 'amber', ready: 'green', delivered: 'green' };

/** Customer-facing live tracking. Only customer-safe data is rendered (no internal notes or other customers' vehicles). */
export function JobStatusView({ job, detailsHref }: { job: Job; detailsHref?: string }) {
  const db = useDb();
  const [tab, setTab] = useState<'live' | 'photos' | 'checklist' | 'notes'>('live');
  const v = vehicleOf(db, job.vehicleId);
  const photos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const updates = job.activity.filter((a) => !a.text.startsWith('Note:') && !a.text.startsWith('Requested') && !a.text.startsWith('Assigned'));
  const detail = job.service.replace(' - ', ' and ').toLowerCase();

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight">Job Status</h1>
          <p className="mt-1 text-sm text-ink-500">Track your vehicle&apos;s real-time progress.</p>
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
          {detailsHref && <Link href={detailsHref} className="btn btn-soft h-10 px-4 text-sm">Full job details</Link>}
        </div>
        <JobStepper job={job} className="mt-6" currentStyle="active" showTimes labels={['Inspection', 'Approval', 'In Repair', 'Quality Check', 'Ready for Delivery']} />
      </Card>

      <FilterTabs variant="soft" className="my-5" value={tab} onChange={setTab} tabs={[{ value: 'live', label: 'Live View' }, { value: 'photos', label: 'Photos' }, { value: 'checklist', label: 'Checklist' }, { value: 'notes', label: 'Notes' }]} />

      {tab === 'live' && (
        <div className="neu-sm p-2">
          <WorkshopLiveView
            mode="customer"
            variant="cover"
            highlightJobId={job.id}
            overlay={
              <>
                <span className="absolute right-3 top-3 flex items-center gap-2 rounded-xl bg-[#fffaf4]/95 px-3 py-2 text-xs font-semibold shadow-neu-xs"><span className="flex h-4 w-4 items-center justify-center rounded bg-bad text-white"><Play className="h-2.5 w-2.5 fill-current" /></span>Live Workshop View</span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1d20]/80 via-[#1c1d20]/45 to-transparent px-5 pb-4 pt-10 text-white">
                  <p className="text-[clamp(15px,2.4cqw,21px)] font-bold leading-tight">Your vehicle is currently {job.stage === 'in_repair' ? 'in Repair' : `in ${STAGE_LABEL[job.stage]}`}</p>
                  <p className="mt-1 text-[clamp(11px,1.7cqw,15px)] text-white/85">{job.stage === 'in_repair' ? `Our team is working on ${detail}.` : CAPTION[job.stage]}</p>
                </div>
              </>
            }
          />
        </div>
      )}
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
