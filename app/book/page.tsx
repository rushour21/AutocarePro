'use client';

import Link from 'next/link';
import { BookingForm } from '@/components/features/BookingForm';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui';

/** Public booking page: no account needed. */
export default function BookPage() {
  return (
    <div className="px-4 pb-10">
      <header className="mx-auto flex max-w-[860px] items-center justify-between py-4">
        <Link href="/" aria-label="AutoHub home"><Logo /></Link>
        <Button variant="neu" size="sm" href="/login">Sign in</Button>
      </header>
      <BookingForm doneHref="/" />
    </div>
  );
}
