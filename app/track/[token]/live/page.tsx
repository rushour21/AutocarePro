'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { Chip, ShareCard, useTrack } from '@/components/share/ShareKit';
import { EmptyState } from '@/components/ui';
import { vehicleName, vehicleOf } from '@/lib/format';
import { trackInfo } from '@/lib/track';
import { useDb } from '@/lib/store';

const CAMERAS = [
  { id: 'bay-1', label: 'Bay 1', img: '/assets/share/cam-bay1.jpg' },
  { id: 'bay-2', label: 'Bay 2', img: '/assets/share/cam-bay2.jpg' },
  { id: 'bay-3', label: 'Bay 3', img: '/assets/share/cam-bay3.jpg' },
  { id: 'parts', label: 'Parts Area', img: '/assets/share/cam-parts.jpg' },
];

export default function ShareLive() {
  const { job } = useTrack();
  const db = useDb();
  const info = trackInfo(db, job);
  const own = CAMERAS.find((c) => c.id === job.bayId)?.id ?? 'bay-2';
  const [tab, setTab] = useState<'live' | 'photos' | 'time'>('live');
  const [cam, setCam] = useState(own);
  const idx = CAMERAS.findIndex((c) => c.id === cam);
  const go = (d: number) => setCam(CAMERAS[(idx + d + CAMERAS.length) % CAMERAS.length].id);
  const isOwn = cam === own;
  const name = vehicleName(vehicleOf(db, job.vehicleId));
  const current = CAMERAS[idx];

  return (
    <ShareCard chip={<Chip tone="live"><span className="h-2.5 w-2.5 rounded-full bg-ok" /> Live from Workshop</Chip>} flush>
      <div className="px-0">
        <div className="relative overflow-hidden bg-[#e9dfd0]" style={{ aspectRatio: '1.7 / 1' }}>
          {tab === 'live' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={isOwn ? '/assets/share/live-main.jpg' : current.img} alt={isOwn ? `${current.label}: your ${name}` : current.label} className={clsx('h-full w-full object-cover', !isOwn && 'blur-[1px]')} />
          ) : tab === 'photos' ? (
            <div className="grid h-full grid-cols-2 gap-1 bg-ivory-200 p-1">
              {info.gallery.slice(0, 4).map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g.src} src={g.src} alt={g.title} className="h-full w-full rounded-lg object-cover" />
              ))}
              {info.gallery.length === 0 && <div className="col-span-2 flex items-center justify-center"><EmptyState title="No photos yet" /></div>}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-ivory-100"><EmptyState title="Time-lapse isn’t available yet" text="Photos from the workshop appear in the Photos tab." /></div>
          )}
        </div>

        <div className="neu-sm relative z-10 -mt-1 mx-3 !rounded-[20px] p-3 sm:mx-5 sm:p-4">
          <div className="flex items-center gap-2">
            <button aria-label="Previous camera" onClick={() => go(-1)} className="btn btn-neu h-10 w-10 shrink-0 !rounded-xl sm:h-11 sm:w-11"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex min-w-0 flex-1 justify-center gap-1 sm:gap-2" role="tablist" aria-label="View">
              {([['live', 'Live View'], ['photos', 'Photos'], ['time', 'Time-lapse']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('h-11 whitespace-nowrap rounded-xl px-2 text-[12.5px] font-semibold transition sm:px-6 sm:text-sm', tab === k ? 'btn-coral' : 'text-ink-700 hover:bg-white/60')}>{l}</button>
              ))}
            </div>
            <button aria-label="Next camera" onClick={() => go(1)} className="btn btn-neu h-10 w-10 shrink-0 !rounded-xl sm:h-11 sm:w-11"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
            <p className="font-bold">{current.label}{isOwn && <> <span className="mx-1 text-ink-400">•</span> {name}</>}</p>
            <p className="text-ink-400">{info.liveAt}</p>
          </div>
        </div>

        <div className="thin-scroll mx-3 mt-3 mb-4 flex items-stretch gap-3 overflow-x-auto pb-1 sm:mx-5" role="tablist" aria-label="Cameras">
          {CAMERAS.map((c) => (
            <button key={c.id} role="tab" aria-selected={cam === c.id} onClick={() => setCam(c.id)} className={clsx('group w-[128px] shrink-0 rounded-2xl p-1.5 text-center transition sm:w-[150px]', cam === c.id ? 'neu-sm' : 'opacity-90 hover:opacity-100')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt="" className="aspect-[1.65] w-full rounded-xl object-cover" />
              <span className={clsx('mt-1.5 block text-xs font-medium', cam === c.id ? 'text-coral-600' : 'text-ink-500')}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ShareCard>
  );
}
