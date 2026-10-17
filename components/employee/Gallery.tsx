'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Plus, X } from 'lucide-react';
import { galleryPhotos } from '@/lib/data';

const TABS = [
  { k: 'All Photos', n: 8 },
  { k: 'Inspection', n: 3 },
  { k: 'Repair Progress', n: 4 },
  { k: 'Final', n: 1 },
];

export function Gallery() {
  const [tab, setTab] = useState('All Photos');
  const [open, setOpen] = useState<string | null>(null);
  const shown = galleryPhotos.filter((p) => tab === 'All Photos' || p.group === tab);
  return (
    <div className="max-w-[860px]">
      <nav className="flex gap-2 border-b border-emp-line">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx('-mb-px whitespace-nowrap border-b-2 px-5 py-2.5 text-sm', tab === t.k ? 'border-emp-blue font-medium text-emp-blue' : 'border-transparent text-gray-500')}
          >
            {t.k} ({t.n})
          </button>
        ))}
      </nav>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {shown.map((p) => (
          <button key={p.src} onClick={() => setOpen(p.src)} className="overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" className="aspect-[3/2] w-full object-cover transition hover:scale-[1.03]" />
          </button>
        ))}
        <button className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#b9cdf5] bg-[#f3f7ff] text-sm font-medium text-emp-blue">
          <Plus className="h-5 w-5" /> Add Photos
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-10" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" className="max-h-full max-w-full rounded-xl" />
          <button className="absolute right-6 top-6 rounded-full bg-white/90 p-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
