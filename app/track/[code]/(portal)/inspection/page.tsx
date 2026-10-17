'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { Images } from 'lucide-react';
import { DamageDiagram } from '@/components/inspection/Diagram';
import { useTrackCode } from '@/components/customer/Sidebar';
import { ASSET, customerDamages, customerMarkers, damagePoints3d, job } from '@/lib/data';

export default function CustomerInspection() {
  const code = useTrackCode();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 text-[15px] text-gray-700">
        <span>Job #{job.id}</span>·<span>{job.vehicle.name}</span>·<span>{job.vehicle.reg}</span>
        <span className="ml-2 rounded-md bg-ok-bg px-2.5 py-0.5 text-sm font-medium text-ok-fg">In Progress</span>
      </div>
      <div className="mt-6 flex gap-2">
        {(['2d', '3d'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'h-10 w-[110px] rounded-md border text-sm',
              view === v ? 'border-[#c9d8f2] border-b-2 border-b-cust-link bg-white font-medium text-cust-link' : 'border-transparent text-gray-400',
            )}
          >
            {v === '2d' ? '2D View' : '3D View'}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="rounded-xl border border-cust-line bg-white p-5">
          {view === '2d' ? (
            <DamageDiagram src={ASSET('diagram-customer.png')} aspect="243 / 257" markers={customerMarkers} size={13} className="mx-auto w-full max-w-[520px]" />
          ) : (
            <div className="relative overflow-hidden rounded-lg [container-type:inline-size]" style={{ aspectRatio: '963 / 628' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET('viewport-3d.jpg')} alt="" className="h-full w-full scale-[1.25] object-cover" style={{ transformOrigin: '60% 55%' }} />
              {damagePoints3d.map((p) => (
                <span
                  key={p.id}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-semibold text-white"
                  style={{ left: `${60 + (p.x - 60) * 1.25}%`, top: `${55 + (p.y - 55) * 1.25}%`, width: '3.4cqw', height: '3.4cqw', fontSize: '1.7cqw', background: p.color }}
                >
                  {p.id}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-cust-line bg-white p-5">
          <h3 className="text-base font-semibold">Damage Details</h3>
          <ul className="mt-4 divide-y divide-cust-line">
            {customerDamages.map((d) => (
              <li key={d.n} className="flex items-center gap-4 py-3" onMouseEnter={() => setActive(d.n)} onMouseLeave={() => setActive(null)}>
                <span
                  className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white transition', active === d.n && 'scale-110')}
                  style={{ background: d.color }}
                >
                  {d.n}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{d.title}</p>
                  <p className="text-xs text-gray-500">{d.place}</p>
                  {d.side && <p className="text-xs text-gray-500">{d.side}</p>}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.photo} alt="" className="h-[62px] w-[72px] rounded-lg object-cover" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="mt-8 text-base font-semibold">Damage Photos</h3>
      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        {['dphoto-1', 'dphoto-2', 'dphoto-3'].map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p} src={ASSET(`${p}.png`)} alt="" className="aspect-[1.05] w-full rounded-xl object-cover" />
        ))}
        <Link href={`/track/${code}/photos`} className="flex aspect-[1.05] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#b9cdf5] text-sm text-cust-link">
          <Images className="h-5 w-5" />
          <span className="font-medium">View All Photos</span>
          <span className="text-xs">12 Photos</span>
        </Link>
      </div>
    </>
  );
}
