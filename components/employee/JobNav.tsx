'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ArrowLeft, MoreVertical, Printer, Share2 } from 'lucide-react';
import { Pill } from '@/components/ui';
import { job } from '@/lib/data';

const TABS = [
  { slug: '', label: 'Overview' },
  { slug: 'inspection', label: 'Inspection' },
  { slug: 'work-progress', label: 'Work Progress' },
  { slug: 'parts', label: 'Parts & Labour' },
  { slug: 'photos', label: 'Photos' },
];

export function useEmpJobId() {
  const p = useParams<{ id: string }>();
  return decodeURIComponent(p?.id ?? 'G-1024');
}

export function EmpJobTabs({ className }: { className?: string }) {
  const id = useEmpJobId();
  const path = usePathname();
  const base = `/employee/jobs/${id}`;
  return (
    <nav className={clsx('flex gap-2 overflow-x-auto border-b border-emp-line scrollbar-none', className)}>
      {TABS.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? path.startsWith(href) : path === base;
        return (
          <Link
            key={t.label}
            href={href}
            className={clsx(
              '-mb-px whitespace-nowrap border-b-2 px-5 py-2.5 text-sm transition',
              active ? 'border-emp-blue font-medium text-emp-blue' : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function EmpJobHeader() {
  const id = useEmpJobId();
  return (
    <>
      <Link href="/employee" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to My Jobs
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight">Job #{id}</h1>
            <Pill tone="green" className="rounded-full px-3 py-1 text-sm">
              {job.status}
            </Pill>
          </div>
          <p className="mt-0.5 text-sm text-gray-400">Created on {job.createdOn}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-lg border border-emp-line bg-white px-4 text-sm font-medium shadow-card">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button className="flex h-10 items-center gap-2 rounded-lg border border-emp-line bg-white px-4 text-sm font-medium shadow-card">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100" aria-label="More">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
      <EmpJobTabs className="mt-5" />
    </>
  );
}

export function EmpJobBar({ right }: { right?: React.ReactNode }) {
  const id = useEmpJobId();
  return (
    <div className="mb-3 flex items-center justify-between">
      <Link href={`/employee/jobs/${id}`} className="flex items-center gap-3 text-[15px] text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" /> Job #{id}
      </Link>
      {right}
    </div>
  );
}
