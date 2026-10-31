'use client';

import { Upload } from 'lucide-react';
import { PhotoButton } from '@/components/features/PhotoButton';
import { addStagePhoto } from '@/lib/actions';
import { estimateOfJob, photosOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Job } from '@/lib/types';

function Side({ title, photos, empty, children }: { title: string; photos: string[]; empty: string; children?: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold">{title} ({photos.length})</h3>
        {children}
      </div>
      {photos.length === 0 ? <p className="neu-in-sm flex h-[110px] items-center justify-center px-3 text-center text-sm text-ink-500">{empty}</p> : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt={`${title} photo ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
          ))}
        </div>
      )}
    </section>
  );
}

/** The car as it arrived next to the finished work. Leave out `by` for a read-only view. */
export function BeforeAfter({ job, by, onError }: { job: Job; by?: string; onError?: (m: string) => void }) {
  const db = useDb();
  const { before, after } = photosOf(job, db.claims.find((c) => c.id === job.claimId), estimateOfJob(db, job.id));
  const upload = (side: 'before' | 'after') => by && (
    <PhotoButton label={`Upload ${side} photo`} onPhoto={(src) => addStagePhoto(job.id, side, src, by)} onError={onError} className="h-9 gap-1.5 px-3 text-xs"><Upload className="h-3.5 w-3.5" /> Upload</PhotoButton>
  );
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Side title="Before" photos={before} empty="No before photos yet.">{upload('before')}</Side>
      <Side title="After" photos={after} empty="No after photos yet.">{upload('after')}</Side>
    </div>
  );
}
