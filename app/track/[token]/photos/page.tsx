'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ShareCard, useTrack } from '@/components/share/ShareKit';
import { EmptyState, Modal } from '@/components/ui';
import { trackInfo, type GalleryGroup, type GalleryItem } from '@/lib/track';
import { useDb } from '@/lib/store';

const TABS: ('All Photos' | GalleryGroup)[] = ['All Photos', 'Inspection', 'During Service', 'Parts', 'Complete'];

export default function SharePhotos() {
  const { job } = useTrack();
  const db = useDb();
  const info = trackInfo(db, job);
  const [tab, setTab] = useState<(typeof TABS)[number]>('All Photos');
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const list = info.gallery.filter((g) => tab === 'All Photos' || g.groups.includes(tab));

  const tabs = (
    <div role="tablist" aria-label="Photo groups" className="thin-scroll flex max-w-full gap-1 overflow-x-auto">
      {TABS.map((t) => (
        <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={clsx('h-10 shrink-0 whitespace-nowrap rounded-xl px-4 text-[13px] font-medium transition', tab === t ? 'tab-soft-active font-semibold text-ink' : 'text-ink-500 hover:text-ink')}>{t}</button>
      ))}
    </div>
  );

  return (
    <ShareCard tabs={tabs} className="[&>header]:flex-wrap">
      {list.length === 0 ? (
        <EmptyState title="No photos here yet" text="Photos from the workshop will appear as the work progresses." />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          {list.map((g) => (
            <li key={g.src}>
              <button onClick={() => setOpen(g)} className="group block w-full text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.title} className="aspect-[1.25] w-full rounded-2xl object-cover shadow-neu-sm transition group-hover:brightness-95" />
                <span className="mt-2 block text-sm font-semibold">{g.title}</span>
                <span className="block text-xs text-ink-400">{g.at}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.src} alt={open.title} className="w-full rounded-2xl object-cover" />
            <p className="mt-3 text-sm text-ink-500">{open.at}</p>
          </>
        )}
      </Modal>
    </ShareCard>
  );
}
