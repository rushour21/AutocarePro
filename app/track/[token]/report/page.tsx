'use client';

import { Check, CheckCircle2 } from 'lucide-react';
import { DocLink } from '@/components/features/Documents';
import { Chip, Locked, ShareCard, useTrack } from '@/components/share/ShareKit';
import { VehicleImage } from '@/components/ui';
import { STEP_INDEX, userOf, vehicleName, vehicleOf, phaseOf } from '@/lib/format';
import { trackInfo } from '@/lib/track';
import { useDb } from '@/lib/store';

const done = (t: string) => {
  const r = t.match(/^Replace (.+)$/i);
  if (r) return `Replaced ${r[1].toLowerCase()}`;
  if (/ replacement$/i.test(t)) return `Replaced ${t.replace(/ replacement$/i, '').toLowerCase()}`;
  if (/^(Check|Inspect|Install|Change|Top up|Drain)/i.test(t)) return t.replace(/^Check /i, 'Checked ').replace(/^Inspect /i, 'Inspected ').replace(/^Install /i, 'Installed ').replace(/^Change /i, 'Changed ').replace(/^Top up /i, 'Topped up ').replace(/^Drain /i, 'Drained ');
  return `${t} completed`;
};

export default function ShareReport() {
  const { job, base } = useTrack();
  const db = useDb();
  if (STEP_INDEX[job.stage] < 4) {
    return <Locked base={base} title="Your final report isn’t ready yet" text="It will be available here as soon as the work is complete and quality checked." />;
  }
  const v = vehicleOf(db, job.vehicleId);
  const info = trackInfo(db, job);
  const tech = userOf(db, job.techId);
  const start = job.startedLabel.split(',')[0];
  const end = (job.completedOn ?? job.estCompletionDate.split(',')[0]).replace(/\s/g, ' ');
  const work = job.checkin
    ? job.tasks.filter((t) => t.status === 'Completed' && phaseOf(t) === 'repair').map((t) => done(t.title))
    : [...job.tasks.filter((t) => t.status === 'Completed' && !/final/i.test(t.title)).map((t) => done(t.title)), 'Checked suspension, tyres and fluids', 'Final quality check completed'];
  const half = Math.ceil(work.length / 2);

  return (
    <ShareCard chip={<Chip tone="green"><CheckCircle2 className="h-4 w-4" /> Completed</Chip>}>
      <div className="neu-row flex flex-wrap items-center gap-5 px-5 py-4 sm:flex-nowrap">
        {v && <VehicleImage carKey={v.carKey} className="h-[100px] w-[180px] shrink-0" alt={vehicleName(v)} />}
        <dl className="min-w-0 flex-1 text-sm">
          <dt className="sr-only">Service Summary</dt>
          <p className="mb-2 font-bold">Service Summary</p>
          {[['Service Type', job.service], ['Service Date', start === end ? start : `${start} – ${end}`], ['Technician', tech?.name ?? '—'], ['Next Service', info.nextService]].map(([k, val]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-ivory-300/50 py-2 last:border-0"><dt className="text-ink-400">{k}</dt><dd className="font-medium">{val}</dd></div>
          ))}
        </dl>
      </div>
      <div className="neu-row mt-3 px-5 py-4">
        <h2 className="mb-3 font-bold">Work Performed</h2>
        <div className="grid gap-x-8 sm:grid-cols-2 sm:divide-x sm:divide-ivory-300/60">
          {[work.slice(0, half), work.slice(half)].map((col, i) => (
            <ul key={i} className={i ? 'sm:pl-8' : ''}>
              {col.map((w) => (
                <li key={w} className="flex items-center gap-3 border-b border-ivory-300/50 py-3 text-sm last:border-0"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3fae90] to-[#248a6c] text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>{w}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-center"><DocLink kind="inspection" docKey={job.trackingToken} className="btn btn-neu h-11 px-5 text-sm">Download Inspection Report</DocLink></div>
    </ShareCard>
  );
}
