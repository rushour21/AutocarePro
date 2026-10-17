'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ClipboardCheck, History, Package, ScanSearch, UserRound } from 'lucide-react';
import { Logo } from '@/components/Logo';

const NAV = [
  { href: '/employee', label: 'My Jobs', icon: ClipboardCheck, match: (p: string) => p === '/employee' || p.startsWith('/employee/jobs') },
  { href: '/employee/inspections', label: 'Inspections', icon: ScanSearch },
  { href: '/employee/parts-request', label: 'Parts Request', icon: Package },
  { href: '/employee/service-history', label: 'Service History', icon: History },
  { href: '/employee/profile', label: 'Profile', icon: UserRound },
];

export function EmployeeSidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-emp-side px-3 py-5">
      <Logo className="px-2.5" />
      <nav className="mt-8 space-y-1.5">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match ? match(path) : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                active ? 'bg-emp-blue text-white shadow-[0_4px_14px_rgba(29,99,237,0.35)]' : 'text-[#c3cad4] hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cfe6d6] text-sm font-semibold text-[#2b5d3c]">S</span>
        <div>
          <p className="text-sm font-medium text-white">Sandeep Kumar</p>
          <p className="text-xs text-[#9aa4b2]">Mechanic</p>
        </div>
      </div>
    </aside>
  );
}
