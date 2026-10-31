'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { Locked, ShareCard, useTrack } from '@/components/share/ShareKit';
import { Button, Textarea, useToast } from '@/components/ui';
import { submitFeedback } from '@/lib/actions';
import { STEP_INDEX } from '@/lib/format';

export default function ShareFeedback() {
  const { job, base } = useTrack();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  if (STEP_INDEX[job.stage] < 4) {
    return <Locked base={base} title="Feedback opens when your vehicle is ready" text="We’d love to hear how the service went once the work is complete." />;
  }
  const sent = job.feedback;
  const shown = sent ? sent.rating : hover || rating;

  return (
    <ShareCard>
      <div className="mx-auto max-w-[560px] text-center">
        <h1 className="mt-2 text-[26px] font-extrabold tracking-tight">{sent ? 'Thank you!' : 'How was your experience?'}</h1>
        <p className="mt-1 text-sm text-ink-600">{sent ? 'Your feedback helps us serve you better.' : 'Your feedback helps us serve you better.'}</p>
        <div className="mt-5 flex justify-center gap-2.5" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={shown === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              disabled={!!sent}
              onClick={() => { setRating(n); setErr(''); }}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="rounded-xl p-1 transition hover:scale-110 disabled:hover:scale-100"
            >
              <Star className={clsx('h-11 w-11', n <= shown ? 'fill-[#d84a27] text-[#cf4320] drop-shadow-[0_4px_6px_rgba(216,74,39,0.35)]' : 'fill-[#e4e6ea] text-[#cfd2d8]')} strokeWidth={1.5} />
            </button>
          ))}
        </div>
        {sent ? (
          sent.comment && <p className="neu-in-sm mt-6 p-4 text-left text-sm text-ink-700">“{sent.comment}”</p>
        ) : (
          <>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience (optional)..." className="mt-6 !min-h-[120px] text-left" aria-label="Your experience" maxLength={600} />
            {err && <p role="alert" className="mt-2 text-sm text-bad">{err}</p>}
            <Button size="lg" className="mt-4 w-full !h-14 text-base" onClick={() => { if (!rating) return setErr('Please choose a star rating.'); submitFeedback(job.id, rating, comment); toast.show('Thanks for your feedback!'); }}>Submit Feedback</Button>
          </>
        )}
      </div>
      {toast.node}
    </ShareCard>
  );
}
