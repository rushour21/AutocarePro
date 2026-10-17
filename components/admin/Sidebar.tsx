'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Car,
  UsersRound,
  Package,
  FileText,
  Receipt,
  PieChart,
  Settings,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/job-cards', label: 'Job Cards', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/employees', label: 'Employees', icon: UsersRound },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/estimates', label: 'Estimates', icon: FileText },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/reports', label: 'Reports', icon: PieChart },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-admin-side px-3 py-5">
      <Logo className="px-2.5" />
      <nav className="mt-8 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                active ? 'bg-admin-active text-white' : 'text-[#c9cfd1] hover:bg-white/5 hover:text-white',
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
