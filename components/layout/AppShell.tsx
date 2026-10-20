'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  BarChart3, Bell, CalendarCheck, CalendarDays, Car, ChevronDown, ClipboardList, FileText, History, LayoutGrid, LifeBuoy, LogOut, Menu,
  MessageSquare, Package, PackageSearch, Receipt, ScanSearch, Search, Settings, ShieldCheck, Share2, Plug, CreditCard, Warehouse, User as UserIcon, Users, UsersRound, Wrench, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { homeFor, logout, useSession } from '@/lib/auth';
import { useDb } from '@/lib/store';
import { visibleNotifications } from '@/lib/access';
import type { Role } from '@/lib/types';
import { Avatar, Button, LoadingState } from '@/components/ui';

/* ------------------------------------------------------------------ logo */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('h-8 w-8', className)} aria-hidden>
      <defs>
        <linearGradient id="ah-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a5e" />
          <stop offset="1" stopColor="#ee5416" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="12.2" fill="none" stroke="url(#ah-g)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="66 11" transform="rotate(-62 16 16)" />
      <path d="M10.8 19.4 16 11.2l5.2 8.2" fill="none" stroke="url(#ah-g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <span className={clsx('flex items-center gap-2.5 font-bold tracking-tight text-ink', size === 'lg' ? 'text-[28px]' : 'text-xl', className)}>
      <LogoMark className={size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} />
      AutoHub
    </span>
  );
}

/* ------------------------------------------------------------------ nav definitions */
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  /** extra pathname prefixes that should light this item */
  also?: string[];
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/admin/jobs', label: 'Jobs', icon: Wrench },
    { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { href: '/admin/estimates', label: 'Estimates', icon: FileText },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/team', label: 'Team', icon: UsersRound },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  technician: [
    { href: '/employee', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/employee/jobs', label: 'My Jobs', icon: ClipboardList },
    { href: '/employee/inspections', label: 'Inspections', icon: ScanSearch },
    { href: '/employee/parts-request', label: 'Parts Request', icon: PackageSearch },
    { href: '/employee/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/employee/messages', label: 'Messages', icon: MessageSquare },
    { href: '/employee/team', label: 'Team', icon: Users },
    { href: '/employee/profile', label: 'Profile', icon: UserIcon },
  ],
  customer: [
    { href: '/customer', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { href: '/customer/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/customer/estimates', label: 'Estimates', icon: FileText },
    { href: '/customer/invoices', label: 'Invoices', icon: Receipt },
    { href: '/customer/history', label: 'Service History', icon: History },
    { href: '/customer/notifications', label: 'Notifications', icon: Bell },
    { href: '/customer/share', label: 'Share Link', icon: Share2 },
    { href: '/customer/support', label: 'Support', icon: LifeBuoy },
  ],
};

/** Settings swaps the admin sidebar for the settings menu, exactly as in the reference. */
const SETTINGS_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/settings/workshop', label: 'Workshop', icon: Warehouse },
  { href: '/admin/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings/integrations', label: 'Integrations', icon: Plug },
  { href: '/admin/settings/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/admin/settings/security', label: 'Data & Security', icon: ShieldCheck },
];

/** Customer profile & settings swaps the sidebar, as in the reference. */
const PROFILE_NAV: NavItem[] = [
  { href: '/customer/profile', label: 'Profile', icon: UserIcon, exact: true },
  { href: '/customer/vehicles', label: 'Vehicles', icon: Car },
  { href: '/customer/notifications', label: 'Notifications', icon: Bell },
  { href: '/customer/profile/payment', label: 'Payment Methods', icon: CreditCard },
  { href: '/customer/profile/security', label: 'Security', icon: ShieldCheck },
  { href: '/customer/support', label: 'Support', icon: LifeBuoy },
];

const MOBILE_TABS: Record<Role, NavItem[]> = {
  admin: [],
  technician: [NAV.technician[0], NAV.technician[1], NAV.technician[2], NAV.technician[5], NAV.technician[7]],
  customer: [
    { href: '/customer', label: 'Home', icon: LayoutGrid, exact: true },
    NAV.customer[1],
    { href: '/customer/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/customer/profile', label: 'Profile', icon: UserIcon },
  ],
};

/* ------------------------------------------------------------------ pieces */
function Swoosh() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full" viewBox="0 0 240 330" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sw1" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff9a5e" stopOpacity="0.34" />
          <stop offset="0.6" stopColor="#ffc9a3" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="sw-blur">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <path d="M-20 330 V150 C 20 120 60 190 90 250 C 110 290 150 310 260 330 Z" fill="url(#sw1)" filter="url(#sw-blur)" />
      <path d="M-10 330 V210 C 30 200 52 250 80 290 C 96 312 130 322 200 330 Z" fill="#ffb98a" opacity="0.18" filter="url(#sw-blur)" />
    </svg>
  );
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const settingsGeneral = path === '/admin/settings';
  return (
    <nav className="mt-5 flex flex-col gap-1" aria-label="Main">
      {items.map(({ href, label, icon: Icon, exact, also }) => {
        let active = exact ? path === href : path === href || path.startsWith(href + '/') || (also ?? []).some((a) => path.startsWith(a));
        // reference quirk: the settings landing page highlights the first ("Dashboard") entry
        if (items === SETTINGS_NAV) active = label === 'Dashboard' ? settingsGeneral : path.startsWith(href);
        return (
          <Link
            key={href + label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition',
              active ? 'bg-gradient-to-r from-coral-100 to-coral-50 text-coral-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_4px_12px_rgba(242,106,46,0.10)]' : 'text-ink-600 hover:bg-white/55',
            )}
          >
            <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full', active ? 'text-coral-500' : 'text-ink-500')}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function UserMenu({ compact, placement = 'down', avatarOnlyOnPhone }: { compact?: boolean; placement?: 'down' | 'up'; avatarOnlyOnPhone?: boolean }) {
  const { user } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const profile = user.role === 'technician' ? '/employee/profile' : user.role === 'customer' ? '/customer/profile' : '/admin/settings';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx('flex items-center gap-3 rounded-full text-left transition', compact ? 'neu-sm w-full p-3 !rounded-2xl' : 'pr-1 hover:opacity-90')}
      >
        <Avatar src={user.avatar} name={user.name} size={compact ? 38 : 40} />
        <span className={clsx('min-w-0 flex-1 leading-tight', avatarOnlyOnPhone && 'hidden sm:block')}>
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-ink-400">{user.title}</span>
        </span>
        {!compact && <ChevronDown className={clsx('h-4 w-4 text-ink-400', avatarOnlyOnPhone && 'hidden sm:block')} />}
      </button>
      {open && (
        <>
          <button aria-label="Close menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className={clsx('neu-sm slide-up absolute z-40 w-48 overflow-hidden p-1.5', placement === 'up' ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2')}>
            <Link role="menuitem" href={profile} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/70">
              <UserIcon className="h-4 w-4" /> {user.role === 'admin' ? 'Settings' : 'Profile'}
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-bad hover:bg-white/70"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationBell({ className }: { className?: string }) {
  const { user } = useSession();
  const db = useDb();
  const unread = user ? visibleNotifications(db, user).filter((n) => !n.read).length : 0;
  const href = user?.role === 'customer' ? '/customer/notifications' : user?.role === 'technician' ? '/employee/messages' : '/admin/jobs';
  return (
    <Link href={href} aria-label="Notifications" title="Notifications" className={clsx('btn btn-neu relative h-11 w-11 !rounded-full', className)}>
      <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
      {(user?.role !== 'customer' || unread > 0) && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral-500 ring-2 ring-white" />}
    </Link>
  );
}

/** Search + actions row shown at the top of every portal page. */
export function TopBar({
  search, right, showUser, className,
}: {
  search?: { value: string; onChange: (v: string) => void; placeholder: string; onSubmit?: () => void };
  right?: React.ReactNode;
  showUser?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('mb-4 hidden items-center gap-4 lg:flex', className)}>
      {search && (
        <form
          className="neu-in flex h-11 max-w-[520px] flex-1 items-center gap-3 !rounded-2xl px-4 text-ink-400"
          onSubmit={(e) => {
            e.preventDefault();
            search.onSubmit?.();
          }}
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <input value={search.value} onChange={(e) => search.onChange(e.target.value)} placeholder={search.placeholder} aria-label={search.placeholder} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-300" />
          {search.value && (
            <button type="button" aria-label="Clear search" onClick={() => search.onChange('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      )}
      <div className="ml-auto flex items-center gap-3">
        {right}
        {showUser && (
          <>
            <NotificationBell />
            <UserMenu />
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ shell */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, router, path]);

  const items = useMemo(() => (role === 'admin' && path.startsWith('/admin/settings') ? SETTINGS_NAV : role === 'customer' && path.startsWith('/customer/profile') ? PROFILE_NAV : NAV[role]), [role, path]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <LoadingState rows={5} />
      </div>
    );
  }
  if (user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="neu max-w-md p-8 text-center">
          <span className="neu-in mx-auto mb-4 flex h-16 w-16 items-center justify-center !rounded-full text-coral-500">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold">Access restricted</h1>
          <p className="mt-2 text-sm text-ink-500">
            You are signed in as {user.name} ({user.title}). This area is only available to {role === 'admin' ? 'garage admins' : role === 'technician' ? 'workshop technicians' : 'customers'}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button href={homeFor(user.role)}>Go to my portal</Button>
            <Button
              variant="neu"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Switch account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = MOBILE_TABS[role];
  return (
    <div className="min-h-screen p-3 sm:p-4 lg:flex lg:gap-3">
      {/* desktop sidebar */}
      <aside className="neu sticky top-4 hidden h-[calc(100vh-2rem)] w-[208px] shrink-0 flex-col overflow-hidden px-3 py-5 lg:flex xl:w-[216px]">
        <Swoosh />
        <Link href={homeFor(role)} className="relative px-2">
          <Logo />
        </Link>
        <div className="thin-scroll relative -mx-1 flex-1 overflow-y-auto px-1">
          <NavList items={items} />
        </div>
        {role !== 'admin' && (
          <div className="relative mt-4">
            <UserMenu compact placement="up" />
          </div>
        )}
      </aside>

      {/* mobile top bar */}
      <header className="neu-sm mb-3 flex items-center justify-between px-3 py-2.5 lg:hidden">
        <button type="button" aria-label="Open menu" onClick={() => setDrawer(true)} className="btn btn-neu h-10 w-10 !rounded-xl">
          <Menu className="h-5 w-5" />
        </button>
        <Link href={homeFor(role)} className="shrink-0">
          <Logo className="!text-lg" />
        </Link>
        <UserMenu compact={false} avatarOnlyOnPhone />
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-[#2a2118]/35 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="neu slide-up relative h-full w-[280px] overflow-hidden !rounded-l-none px-4 py-6">
            <Swoosh />
            <div className="relative flex items-center justify-between px-2">
              <Logo />
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="btn btn-neu h-9 w-9 !rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <NavList items={items} onNavigate={() => setDrawer(false)} />
            </div>
          </aside>
        </div>
      )}

      <main className="neu min-w-0 flex-1 !rounded-[26px] p-4 pb-24 sm:p-6 lg:min-h-[calc(100vh-2rem)] lg:p-5 lg:pb-5">{children}</main>

      {tabs.length > 0 && (
        <nav className="neu fixed inset-x-3 bottom-3 z-40 flex justify-around !rounded-3xl px-2 py-2 lg:hidden" aria-label="Quick navigation">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? path === href : path.startsWith(href);
            return (
              <Link key={href + label} href={href} aria-current={active ? 'page' : undefined} className={clsx('flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium', active ? 'text-coral-600' : 'text-ink-400')}>
                <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full', active && 'bg-gradient-to-b from-coral-400 to-coral-600 text-white shadow-coral')}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

