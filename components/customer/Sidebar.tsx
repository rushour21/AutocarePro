'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Car, FileText, Gauge, ImageIcon, ListChecks, ReceiptText, RefreshCcwDot } from 'lucide-react';
import { CustomerLogo } from '@/components/Logo';

export function useTrackCode() {
  const p = useParams<{ code: string }>();
  return decodeURIComponent(p?.code ?? 'G-1024-a8f7xk9');
}

export function CustomerSidebar() {
  const code = useTrackCode();
  const path = usePathname();
  const base = `/track/${code}`;
  const NAV = [
    { href: base, label: 'Overview', icon: Gauge, exact: true },
    { href: `${base}/inspection`, label: 'Vehicle Inspection', icon: Car },
    { href: `${base}/progress`, label: 'Service Progress', icon: RefreshCcwDot },
    { href: `${base}/estimate`, label: 'Estimate', icon: FileText },
    { href: `${base}/photos`, label: 'Photos', icon: ImageIcon },
    { href: `${base}/invoice`, label: 'Invoices', icon: ReceiptText },
    { href: `${base}/summary`, label: 'Service Details', icon: ListChecks },
  ];
  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-cust-side px-4 py-6 md:flex">
      <Link href={base}>
        <CustomerLogo className="px-2" />
      </Link>
      <nav className="mt-10 space-y-1.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                active ? 'bg-cust-active font-medium text-cust-link' : 'text-gray-600 hover:bg-black/[0.03] hover:text-gray-900',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Mobile top bar + horizontal section menu for the portal pages. */
export function CustomerMobileNav() {
  const code = useTrackCode();
  const path = usePathname();
  const base = `/track/${code}`;
  const items = [
    ['Overview', base],
    ['Inspection', `${base}/inspection`],
    ['Progress', `${base}/progress`],
    ['Estimate', `${base}/estimate`],
    ['Photos', `${base}/photos`],
    ['Invoice', `${base}/invoice`],
    ['Details', `${base}/summary`],
  ];
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <CustomerLogo />
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
        {items.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className={clsx(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs',
              (href === base ? path === base : path.startsWith(href)) ? 'bg-cust-teal text-white' : 'bg-white text-gray-600',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function CustomerHeader({ title = 'Job #G-1024', status = 'In Progress', done = false }: { title?: React.ReactNode; status?: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-cust-line pb-4">
      <div className="text-[15px] text-gray-700">{title}</div>
      <span className={clsx('rounded-md px-3 py-1 text-sm font-medium', done ? 'bg-ok-bg text-ok-fg' : 'bg-ok-bg text-ok-fg')}>{status}</span>
    </div>
  );
}
