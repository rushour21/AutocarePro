'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Camera, ChevronLeft } from 'lucide-react';
import { NoAccess } from '@/components/features/NoAccess';
import { Button, Card, Checkbox, ProgressBar, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { addJobPhoto, completeChecklist, toggleChecklist } from '@/lib/actions';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { openApprovals } from '@/lib/jobflow';
import { useDb } from '@/lib/store';

const SAMPLE = ['disc-orange', 'disc-dark', 'garage-1', 'estimate-disc'].map((n) => `/assets/photos/${n}.jpg`);

export default function ChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!user || !job) return <NoAccess what="checklist" backHref="/employee/jobs" />;
  const v = vehicleOf(db, job.vehicleId);
  const done = job.checklist.filter((c) => c.done).length;
  const pct = Math.round((done / job.checklist.length) * 100);
  const waiting = openApprovals(db, job).length;

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-5 flex items-center gap-3">
        <Link href={`/employee/jobs/${job.id}`} aria-label="Back to job" className="btn btn-neu h-11 w-11 !rounded-full"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="flex-1 text-[24px] font-bold">Service Checklist</h1>
        <StatusBadge tone="green" dot size="lg">{job.stage === 'in_repair' ? 'In Progress' : STAGE_LABEL[job.stage]}</StatusBadge>
      </div>
      <Card className="mb-4 flex items-center gap-4 p-4">
        {v && <VehicleImage carKey={v.carKey} className="h-14 w-28" />}
        <div><p className="font-bold">#{job.id} - {vehicleName(v)}</p><p className="text-sm text-ink-400">{v?.reg}</p></div>
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold">{job.checklistName}</h2>
        <div className="mt-4 flex items-center gap-4">
          <ProgressBar value={pct} tone="coral" className="flex-1 !h-3" label={`${done}/${job.checklist.length} completed`} />
          <span className="w-10 text-sm font-semibold text-ink-700">{pct}%</span>
        </div>
        <ul className="mt-4 divide-y divide-ivory-300/60">
          {job.checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-3.5">
              <Checkbox label={c.label} checked={c.done} onChange={() => toggleChecklist(job.id, c.id)} />
              <span className={`flex-1 text-[15px] ${c.done ? 'text-ink-700' : 'text-ink-600'}`}>{c.label}</span>
              <button aria-label={`Add photo for ${c.label}`} onClick={() => { addJobPhoto(job.id, SAMPLE[Math.floor(Math.random() * SAMPLE.length)]); toast.show('Photo attached'); }} className="btn btn-neu h-10 w-10 !rounded-xl"><Camera className="h-[18px] w-[18px]" /></button>
            </li>
          ))}
        </ul>
        {waiting > 0 && <p className="neu-in-sm mt-5 p-3 text-sm text-warn-strong">{waiting} {waiting === 1 ? 'item still needs' : 'items still need'} approval. Finish them before completing the job.</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="soft" size="lg" onClick={() => toast.show('Progress saved')}>Save Progress</Button>
          <Button size="lg" disabled={waiting > 0} onClick={() => { completeChecklist(job.id, user.name); toast.show('Checklist completed — job moved to Quality Check'); setTimeout(() => router.push(`/employee/jobs/${job.id}`), 900); }}>Mark as Complete</Button>
        </div>
      </Card>
      {toast.node}
    </div>
  );
}
