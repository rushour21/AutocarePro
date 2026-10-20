'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { LockKeyhole, Share2 } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { ShareNav, TrackContext } from '@/components/share/ShareKit';
import { Button, EmptyState } from '@/components/ui';
import { jobByToken } from '@/lib/access';
import { useDb } from '@/lib/store';

/**
 * Private share link. It resolves only an exact, unguessable token — job numbers never work here —
 * and every page under it renders customer-safe information only (see lib/track.ts).
 */
export default function TrackLayout({ children }: { children: React.ReactNode }) {
  const { token } = useParams<{ token: string }>();
  const db = useDb();
  const raw = decodeURIComponent(token);
  const job = jobByToken(db, raw);
  const ctx = useMemo(() => (job ? { job, token: raw, base: `/track/${token}` } : null), [job, raw, token]);

  return (
    <div className="mx-auto max-w-[940px] p-3 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <Link href="/" aria-label="AutoHub home"><Logo /></Link>
        <span className="hidden items-center gap-2 text-xs text-ink-500 sm:flex"><LockKeyhole className="h-3.5 w-3.5" /> Private link — keep it to yourself</span>
        <Button size="sm" variant="neu" href="/login">Sign in</Button>
      </header>
      {ctx ? (
        <TrackContext.Provider value={ctx}>
          <ShareNav />
          <main>{children}</main>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ink-400"><Share2 className="h-3.5 w-3.5" /> Shared by AutoHub. Sign in to see all your vehicles and invoices.</p>
        </TrackContext.Provider>
      ) : (
        <main className="neu !rounded-[28px]">
          <EmptyState icon={<LockKeyhole className="h-7 w-7" />} title="This link isn’t valid" text="The link may have been mistyped or replaced. Please use the latest link from the workshop." action={<Button href="/">Go to AutoHub</Button>} />
        </main>
      )}
    </div>
  );
}
