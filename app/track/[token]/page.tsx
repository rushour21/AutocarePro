'use client';

import Link from 'next/link';
import { CalendarCheck, CalendarClock, ClipboardCheck, Flame, Gauge, TriangleAlert, Wrench, CalendarDays } from 'lucide-react';
import { InitialApproval } from '@/components/features/EstimateApproval';
import { JobStepper } from '@/components/features/JobProgress';
import { Chip, RowIcon, ShareCard, useTrack } from '@/components/share/ShareKit';
import { Button, VehicleImage } from '@/components/ui';
import { estimateOfJob, STEP_INDEX, vehicleName, vehicleOf } from '@/lib/format';
import { STAGE_HEADLINE, trackInfo } from '@/lib/track';
import { useDb } from '@/lib/store';

const CONFETTI = [
  [8, 10, '#d9b45f'], [14, 32, '#3fa98b'], [20, 6, '#d84a27'], [27, 42, '#78a2c6'], [34, 14, '#d9b45f'], [44, 6, '#3fa98b'], [56, 36, '#d84a27'], [62, 9, '#78a2c6'],
  [72, 40, '#d9b45f'], [78, 18, '#d84a27'], [86, 5, '#3fa98b'], [92, 30, '#78a2c6'], [96, 14, '#d9b45f'], [5, 44, '#d84a27'], [12, 20, '#78a2c6'], [88, 44, '#3fa98b'],
] as const;

export default function ShareOverview() {
  const { job, base } = useTrack();
  const db = useDb();
  const v = vehicleOf(db, job.vehicleId);
  const info = trackInfo(db, job);
  const step = STEP_INDEX[job.stage];
  const name = vehicleName(v);
  const done = step >= 4;
  const head = STAGE_HEADLINE[job.stage];
  const awaiting = estimateOfJob(db, job.id)?.status === 'Awaiting Approval' && !job.isInsurance;

  if (done) {
    return (
      <ShareCard>
        <div className="relative px-2 pb-2 pt-2 text-center">
          <div className="relative mx-auto h-[190px] w-full max-w-[460px] sm:h-[230px]">
            {CONFETTI.map(([x, y, c], i) => (
              <span key={i} aria-hidden className="absolute h-1.5 w-1.5 rotate-12 rounded-[2px]" style={{ left: `${x}%`, top: `${y * 2}%`, background: c }} />
            ))}
            {v && <VehicleImage carKey={v.carKey} className="mx-auto h-full w-full max-w-[380px]" alt={name} />}
          </div>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight sm:text-[32px]">Your Vehicle is Ready!</h1>
          <p className="mt-2 text-[15px] leading-6 text-ink-500">All services are completed and quality checked.<br />You can collect your vehicle anytime.</p>
          <div className="neu-row mt-6 grid divide-y divide-ivory-300/70 px-2 py-2 text-left sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:py-4">
            <div className="flex items-center gap-3 px-3 py-2 sm:py-0"><RowIcon icon={CalendarCheck} /><div><p className="text-xs text-ink-400">Completed On</p><p className="text-sm font-semibold">{info.completedOn}</p></div></div>
            <div className="flex items-center gap-3 px-3 py-2 sm:py-0"><RowIcon icon={Gauge} /><div><p className="text-xs text-ink-400">Final KM</p><p className="text-sm font-semibold">{v?.odometer.toLocaleString('en-IN')} km</p></div></div>
          </div>
          <Button size="lg" href={`${base}/report`} className="mt-5 w-full !h-14 text-base">View Final Report</Button>
        </div>
      </ShareCard>
    );
  }

  return (
    <ShareCard chip={<Chip><Flame className="h-4 w-4 text-coral-500" /> Shared by AutoHub</Chip>}>
      <div className="px-1 text-center">
        <h1 className="mx-auto max-w-[520px] text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-[34px]">
          Your {name}
          <br />
          {head.title.startsWith('Service') ? head.title : `Service ${head.title}`}
        </h1>
        <p className="mt-3 text-[16px] text-ink-500">Track the status of your vehicle.</p>
        {v && <VehicleImage carKey={v.carKey} className="mx-auto mt-4 h-[200px] w-full max-w-[440px] sm:h-[250px]" alt={name} />}
        <p className="mt-1 text-lg font-bold">{name}</p>
        <p className="text-[15px] tracking-wide text-ink-400">{v?.reg}</p>
      </div>
      <dl className="mx-auto mt-6 grid max-w-[720px] gap-4 sm:grid-cols-3">
        {[{ icon: Wrench, k: 'Service Type', v: job.service.split(' - ')[0] }, { icon: CalendarDays, k: 'Booked On', v: info.bookedAt.split(',')[0] }, { icon: CalendarClock, k: 'Expected Delivery', v: job.estCompletion }].map(({ icon, k, v: val }) => (
          <div key={k} className="flex items-center gap-3"><RowIcon icon={icon} /><div><dt className="text-xs text-ink-400">{k}</dt><dd className="text-[15px] font-semibold leading-tight">{val}</dd></div></div>
        ))}
      </dl>
      <JobStepper job={job} currentStyle="active" labels={['Inspection', 'Approval', 'In Repair', 'Quality Check', 'Ready']} className="mx-auto mt-7 max-w-[760px]" />
      <InitialApproval job={job} by="Customer (tracking link)" />
      {awaiting && (
        <Link href={`${base}/estimate`} className="mx-auto mt-7 flex max-w-[780px] items-center gap-4 rounded-2xl bg-warn-soft px-5 py-4 text-warn-strong">
          <TriangleAlert className="h-6 w-6 shrink-0" />
          <span className="min-w-0 flex-1"><span className="block text-[17px] font-bold">Your approval is needed</span><span className="block text-[15px]">We will start this work after you approve it.</span></span>
          <span className="shrink-0 font-semibold">Review</span>
        </Link>
      )}
      <div className="neu-row mx-auto mt-7 flex max-w-[780px] items-center gap-4 px-5 py-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-info-soft text-info"><ClipboardCheck className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold">Your vehicle is currently {job.stage === 'in_repair' ? 'in Repair' : job.stage === 'quality_check' ? 'in Quality Check' : job.stage === 'pending' ? (job.checkin ? 'checked in' : 'scheduled') : job.stage === 'inspection' ? 'being inspected' : 'being diagnosed'}</p>
          <p className="text-[15px] text-ink-600">{job.stage === 'in_repair' ? `Our team is working on ${job.service.replace(' - ', ' and ').toLowerCase()}.` : head.text}</p>
        </div>
        <span className="hidden self-end text-xs text-ink-400 sm:block">{info.updatedAgo}</span>
      </div>
      <p className="mt-3 text-center text-xs text-ink-400 sm:hidden">{info.updatedAgo}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="neu" href={`${base}/timeline`}>See full timeline</Button>
      </div>
    </ShareCard>
  );
}
