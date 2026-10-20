'use client';

import { CalendarClock, CalendarDays, MessageCircle, Phone, Wrench, NotebookPen } from 'lucide-react';
import { Chip, RowIcon, ShareCard, useTrack } from '@/components/share/ShareKit';
import { Avatar, VehicleImage } from '@/components/ui';
import { km, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { trackInfo } from '@/lib/track';
import { useDb } from '@/lib/store';

export default function ShareDetails() {
  const { job } = useTrack();
  const db = useDb();
  const v = vehicleOf(db, job.vehicleId);
  const tech = userOf(db, job.techId);
  const info = trackInfo(db, job);
  const g = db.garage;
  const phone = g.phone.replace(/\s/g, '');

  return (
    <ShareCard chip={<Chip>{v?.reg}</Chip>}>
      <div className="neu-row flex items-center gap-5 px-5 py-4">
        {v && <VehicleImage carKey={v.carKey} className="h-[92px] w-[170px] shrink-0" alt={vehicleName(v)} />}
        <div>
          <p className="text-xl font-bold">{vehicleName(v)}</p>
          <p className="mt-1 text-sm text-ink-500">{v?.year} <span className="mx-1">•</span> {v?.variant} <span className="mx-1">•</span> {v?.fuel}</p>
          <p className="text-sm text-ink-500">{v && km(v.odometer)}</p>
        </div>
      </div>
      <dl className="neu-row mt-3 divide-y divide-ivory-300/60 px-5">
        <div className="flex items-center gap-4 py-4"><RowIcon icon={Wrench} /><div><dt className="text-xs text-ink-400">Service Type</dt><dd className="text-[15px] font-semibold">{job.service}</dd></div></div>
        <div className="flex items-center gap-4 py-4">
          <Avatar src={tech?.avatar} name={tech?.name} size={44} />
          <div className="flex-1"><dt className="text-xs text-ink-400">Assigned Technician</dt><dd className="text-[15px] font-semibold">{tech?.name}</dd></div>
          {/* contact goes to the workshop, never to a staff member's personal number */}
          <a href={`tel:${phone}`} aria-label="Call the workshop" className="btn btn-soft h-11 w-11 !rounded-xl"><Phone className="h-[18px] w-[18px]" /></a>
          <a href={`https://wa.me/${phone.replace('+', '')}`} target="_blank" rel="noreferrer" aria-label="Message the workshop on WhatsApp" className="btn btn-soft h-11 w-11 !rounded-xl"><MessageCircle className="h-[18px] w-[18px]" /></a>
        </div>
        <div className="flex items-center gap-4 py-4"><RowIcon icon={CalendarDays} /><div><dt className="text-xs text-ink-400">Start Date</dt><dd className="text-[15px] font-semibold">{job.startedLabel}</dd></div></div>
        <div className="flex items-center gap-4 py-4"><RowIcon icon={CalendarClock} /><div><dt className="text-xs text-ink-400">Expected Delivery</dt><dd className="text-[15px] font-semibold">{job.estCompletionDate}</dd></div></div>
      </dl>
      <div className="neu-row mt-3 flex items-start gap-4 px-5 py-4">
        <RowIcon icon={NotebookPen} />
        <div><p className="text-xs text-ink-400">Service Notes</p><p className="mt-0.5 text-[15px] leading-6 text-ink-700">{info.complaint}</p></div>
      </div>
    </ShareCard>
  );
}
