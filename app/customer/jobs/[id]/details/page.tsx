'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, MessageCircle, Phone } from 'lucide-react';
import { InspectionBoard } from '@/components/features/InspectionBoard';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, Card, EmptyState, FilterTabs, StatusBadge, VehicleImage } from '@/components/ui';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateOfJob, inr, STAGE_LABEL, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

type Tab = 'overview' | 'tasks' | 'parts' | 'inspection' | 'photos' | 'notes';

export default function CustomerJobDetails() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>('overview');
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!user || !job) return <NoAccess what="job" backHref="/customer" />;
  const v = vehicleOf(db, job.vehicleId);
  const tech = userOf(db, job.techId);
  const est = estimateOfJob(db, job.id);
  const photos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const parts = est?.items.filter((i) => i.category === 'Parts') ?? [];
  const updates = job.activity.filter((a) => !a.text.startsWith('Note:') && !a.text.startsWith('Requested') && !a.text.startsWith('Assigned'));

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={`/customer/jobs/${job.id}`} className="btn btn-neu h-11 gap-2 px-4 text-sm"><ChevronLeft className="h-4 w-4" /> Back to Jobs</Link>
        <StatusBadge tone="blue" dot size="lg" className="!px-5 !py-2.5 !text-[15px] shadow-neu-sm">{STAGE_LABEL[job.stage]}</StatusBadge>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="flex items-center gap-5 p-5">
          {v && <VehicleImage carKey={v.carKey} className="h-[110px] w-[170px] shrink-0" />}
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-tight">#{job.id} - {vehicleName(v)}</h1>
            <p className="text-sm text-ink-400">{v?.reg}</p>
            <p className="mt-3 text-xs text-ink-400">Service Type</p>
            <p className="text-sm font-semibold">{job.service}</p>
            <p className="text-sm font-semibold">{job.startedLabel}</p>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar src={tech?.avatar} size={52} />
            <div className="flex-1"><p className="font-bold">{tech?.name}</p><p className="text-sm text-ink-400">Technician</p></div>
            <a href={`tel:${tech?.phone.replace(/\s/g, '')}`} aria-label="Call technician" className="btn btn-neu h-10 w-10 !rounded-full"><Phone className="h-4 w-4" /></a>
            <Link href="/customer/support" aria-label="Message the workshop" className="btn btn-neu h-10 w-10 !rounded-full"><MessageCircle className="h-4 w-4" /></Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-ink-400">Start Date</dt><dd className="font-semibold">{job.startedLabel}</dd></div><div><dt className="text-xs text-ink-400">Est. Completion</dt><dd className="font-semibold">{job.estCompletionDate}</dd></div></dl>
        </Card>
      </div>

      <FilterTabs variant="underline" className="my-5" value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'tasks', label: 'Tasks' }, { value: 'parts', label: 'Parts' }, { value: 'inspection', label: 'Inspection' }, { value: 'photos', label: 'Photos' }, { value: 'notes', label: 'Notes' }]} />

      {(tab === 'overview' || tab === 'tasks') && (
        <div className={tab === 'overview' ? 'grid gap-5 lg:grid-cols-[1fr_1fr]' : ''}>
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-bold">Service Tasks</h2>
            <ul className="space-y-2.5">{job.tasks.map((t) => <li key={t.id} className="neu-row flex items-center gap-3 px-4 py-3 text-sm"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${t.status === 'Completed' ? 'bg-ok' : t.status === 'In Progress' ? 'border-[3px] border-warn bg-warn-soft' : 'border-[3px] border-bad bg-bad-soft'}`} /><span className="flex-1">{t.title}</span><StatusBadge tone={t.status === 'Completed' ? 'green' : t.status === 'In Progress' ? 'amber' : 'red'}>{t.status}</StatusBadge></li>)}</ul>
          </Card>
          {tab === 'overview' && (
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-bold">Vehicle Photos</h2>
              <div className="grid grid-cols-2 gap-3">
                {photos.slice(0, 3).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={p} alt="" className="aspect-[1.2] w-full rounded-2xl object-cover shadow-neu-xs" />
                ))}
                {photos.length > 3 ? <button onClick={() => setTab('photos')} className="flex aspect-[1.2] items-center justify-center rounded-2xl bg-[#6b6a68] text-xl font-bold text-white shadow-neu-xs">+{photos.length - 3}</button> : photos.length === 0 && <div className="col-span-2"><EmptyState title="No photos yet" /></div>}
              </div>
            </Card>
          )}
        </div>
      )}
      {tab === 'parts' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Parts</h2>
          {parts.length === 0 ? <EmptyState title="No parts listed" text="Parts appear here once an estimate is prepared." /> : <ul className="divide-y divide-ivory-300/60 text-sm">{parts.map((p) => <li key={p.id} className="flex justify-between py-3"><span>{p.name}</span><span className="font-semibold">{inr(p.amount)}</span></li>)}</ul>}
        </Card>
      )}
      {tab === 'inspection' && <InspectionBoard jobId={job.id} mode="tech" canEdit={false} layout="stack" />}
      {tab === 'photos' && (photos.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{photos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p} src={p} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-neu-sm" />
      ))}</div> : <Card><EmptyState title="No photos yet" /></Card>)}
      {tab === 'notes' && <Card className="p-5">{updates.length === 0 ? <EmptyState title="No updates yet" /> : <ol className="space-y-4 border-l-2 border-ivory-300 pl-5">{updates.map((a) => <li key={a.id}><p className="text-sm">{a.text}</p><p className="text-xs text-ink-400">{a.at}</p></li>)}</ol>}</Card>}
    </>
  );
}
