'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { JobStatusView } from '@/components/features/JobStatusView';
import { Logo } from '@/components/layout/AppShell';
import { Button, EmptyState } from '@/components/ui';
import { jobByToken } from '@/lib/access';
import { useDb } from '@/lib/store';

/**
 * Private tracking link. It resolves only an exact, unguessable token — job numbers never work here —
 * and renders customer-safe information only.
 */
export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const db = useDb();
  const job = jobByToken(db, decodeURIComponent(token));
  return (
    <div className="mx-auto max-w-[900px] p-3 sm:p-5">
      <header className="mb-4 flex items-center justify-between px-2 py-2">
        <Link href="/"><Logo /></Link>
        <span className="hidden items-center gap-2 text-xs text-ink-500 sm:flex"><LockKeyhole className="h-3.5 w-3.5" /> Private tracking link</span>
        <Button size="sm" variant="neu" href="/login">Sign in</Button>
      </header>
      <main className="neu p-4 sm:p-7">
        {job ? (
          <>
            <JobStatusView job={job} />
            <p className="neu-in-sm mt-6 px-4 py-3 text-center text-xs text-ink-500">To approve estimates, see invoices or book a service, <Link href="/login" className="font-semibold text-coral-600">sign in</Link>. Keep this link private.</p>
          </>
        ) : (
          <EmptyState icon={<LockKeyhole className="h-7 w-7" />} title="This link isn’t valid" text="The tracking link may have been mistyped or replaced. Please use the latest link from the workshop." action={<Button href="/">Go to AutoHub</Button>} />
        )}
      </main>
    </div>
  );
}
