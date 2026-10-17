'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ArrowLeft, KeyRound, MoreVertical } from 'lucide-react';

export const ADMIN_JOB_TABS = [
  { slug: '', label: 'Overview' },
  { slug: 'inspection', label: 'Inspection' },
  { slug: 'estimate', label: 'Estimate' },
  { slug: 'work-progress', label: 'Work Progress' },
  { slug: 'parts-labour', label: 'Parts & Labour' },
  { slug: 'photos', label: 'Photos' },
  { slug: 'invoices', label: 'Invoices' },
];

export function useJobId() {
  const p = useParams<{ id: string }>();
  return decodeURIComponent(p?.id ?? 'G-1024');
}

export function AdminJobTabs() {
  const id = useJobId();
  const path = usePathname();
  const base = `/admin/job-cards/${id}`;
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-admin-line scrollbar-none">
      {ADMIN_JOB_TABS.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? path.startsWith(href) : path === base;
        return (
          <Link
            key={t.label}
            href={href}
            className={clsx(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition',
              active ? 'border-[#2f6fed] font-medium text-[#2f6fed]' : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact header used on every job tab except Overview. */
export function AdminJobBar() {
  const id = useJobId();
  return (
    <div className="mb-3 flex items-center justify-between">
      <Link href="/admin/job-cards" className="flex items-center gap-3 text-[15px] text-gray-700 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Job #{id}
      </Link>
      <div className="flex items-center gap-2 text-gray-600">
        <button className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Vehicle keys">
          <KeyRound className="h-4 w-4" />
        </button>
        <button className="rounded-md p-1.5 hover:bg-gray-100" aria-label="More">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
