'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { createContext, useContext } from 'react';
import { LockKeyhole } from 'lucide-react';
import { LogoMark } from '@/components/layout/AppShell';
import { Button, EmptyState } from '@/components/ui';
import type { Job } from '@/lib/types';

export interface TrackCtx {
  job: Job;
  token: string;
  base: string;
}
export const TrackContext = createContext<TrackCtx | null>(null);
export function useTrack() {
  const c = useContext(TrackContext);
  if (!c) throw new Error('useTrack must be used inside the share layout');
  return c;
}

export const SHARE_TABS: { slug: string; label: string }[] = [
  { slug: '', label: 'Overview' },
  { slug: 'live', label: 'Live View' },
  { slug: 'details', label: 'Details' },
  { slug: 'inspection', label: 'Inspection' },
  { slug: 'photos', label: 'Photos' },
  { slug: 'estimate', label: 'Estimate' },
  { slug: 'timeline', label: 'Timeline' },
  { slug: 'invoice', label: 'Invoice' },
  { slug: 'report', label: 'Final Report' },
  { slug: 'feedback', label: 'Feedback' },
];

export function ShareNav() {
  const { base } = useTrack();
  const path = usePathname();
  return (
    <nav aria-label="Sections" className="neu-sm thin-scroll sticky top-2 z-30 mb-4 flex gap-1 overflow-x-auto !rounded-2xl p-1.5">
      {SHARE_TABS.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? path.startsWith(href) : path === base;
        return (
          <Link
            key={t.label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={clsx('relative shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-medium transition', active ? 'tab-soft-active text-ink' : 'text-ink-500 hover:text-ink')}
          >
            {t.label}
            {active && <span className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-coral-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Card with the AutoHub header row used by every share-link screen. */
export function ShareCard({ chip, children, className, tabs, flush }: { chip?: React.ReactNode; children: React.ReactNode; className?: string; tabs?: React.ReactNode; flush?: boolean }) {
  return (
    <section className={clsx('neu !rounded-[28px]', flush ? 'overflow-hidden pb-0' : 'p-4 sm:p-6', className)}>
      <header className={clsx('mb-4 flex items-center justify-between gap-3', flush && 'px-4 pt-4 sm:px-6 sm:pt-6')}>
        <span className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
          <LogoMark className="h-7 w-7" />
          AutoHub
        </span>
        {tabs}
        {chip}
      </header>
      {children}
    </section>
  );
}

export function Chip({ children, tone = 'plain', className }: { children: React.ReactNode; tone?: 'plain' | 'green' | 'amber' | 'red' | 'live'; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-[13px] font-semibold shadow-neu-xs',
        tone === 'plain' && 'neu-xs !rounded-2xl text-ink-700',
        tone === 'green' && 'bg-gradient-to-br from-[#e5f8ee] to-[#d3f1e1] text-ok-strong',
        tone === 'amber' && 'bg-gradient-to-br from-[#fff1da] to-[#ffe6bf] text-warn-strong',
        tone === 'red' && 'bg-gradient-to-br from-[#ffe8e2] to-[#ffd7cd] text-bad-strong',
        tone === 'live' && 'neu-xs !rounded-2xl text-ink-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-ink-700 shadow-neu-xs">
      <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
    </span>
  );
}

export function Locked({ title, text, base }: { title: string; text: string; base: string }) {
  return (
    <ShareCard>
      <EmptyState icon={<LockKeyhole className="h-7 w-7" />} title={title} text={text} action={<Button variant="neu" href={base}>Back to overview</Button>} />
    </ShareCard>
  );
}
