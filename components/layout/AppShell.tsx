'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  BarChart3, Bell, CalendarCheck, CalendarDays, Car, ChevronDown, ClipboardList, FileText, History, LayoutGrid, LifeBuoy, LogOut, Menu,
  MessageSquare, Package, PackageSearch, Receipt, ScanSearch, Search, Settings, ShieldCheck, Share2, User as UserIcon, Users, UsersRound, Wrench, X,
} from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
          <stop offset="0" stopColor="#e4633f" />
          <stop offset="1" stopColor="#cf4320" />
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
  /** starts a new group in the rail */
  group?: boolean;
  /** pinned to the foot of the rail */
  foot?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/admin/jobs', label: 'Jobs', icon: Wrench },
    { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/admin/customers', label: 'Customers', icon: Users, group: true },
    { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
    { href: '/admin/team', label: 'Team', icon: UsersRound },
    { href: '/admin/estimates', label: 'Estimates', icon: FileText, group: true },
    { href: '/admin/insurance', label: 'Insurance Claims', icon: ShieldCheck },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings, foot: true },
  ],
  technician: [
    { href: '/employee', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/employee/jobs', label: 'My Jobs', icon: ClipboardList },
    { href: '/employee/inspections', label: 'Inspections', icon: ScanSearch },
    { href: '/employee/parts-request', label: 'Parts Request', icon: PackageSearch },
    { href: '/employee/calendar', label: 'Calendar', icon: CalendarDays, group: true },
    { href: '/employee/messages', label: 'Messages', icon: MessageSquare },
    { href: '/employee/team', label: 'Team', icon: Users },
    { href: '/employee/profile', label: 'Profile', icon: UserIcon, foot: true },
  ],
  customer: [
    { href: '/customer', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { href: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { href: '/customer/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/customer/estimates', label: 'Estimates', icon: FileText, group: true },
    { href: '/customer/invoices', label: 'Invoices', icon: Receipt },
    { href: '/customer/history', label: 'Service History', icon: History },
    { href: '/customer/notifications', label: 'Notifications', icon: Bell, group: true },
    { href: '/customer/share', label: 'Share Link', icon: Share2 },
    { href: '/customer/support', label: 'Support', icon: LifeBuoy, foot: true },
  ],
};

/** Sections of a page group, shown as a segmented row inside the page so the rail never changes. */
const SUB_NAV: { prefix: string; items: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    prefix: '/admin/settings',
    items: [
      { href: '/admin/settings', label: 'General', exact: true },
      { href: '/admin/settings/workshop', label: 'Workshop' },
      { href: '/admin/settings/notifications', label: 'Notifications' },
      { href: '/admin/settings/integrations', label: 'Integrations' },
      { href: '/admin/settings/subscription', label: 'Subscription' },
      { href: '/admin/settings/security', label: 'Data & Security' },
    ],
  },
  {
    prefix: '/customer/profile',
    items: [
      { href: '/customer/profile', label: 'Profile', exact: true },
      { href: '/customer/profile/payment', label: 'Payment Methods' },
      { href: '/customer/profile/security', label: 'Security' },
    ],
  },
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
const isActive = (path: string, { href, exact, also }: NavItem) => (exact ? path === href : path === href || path.startsWith(href + '/') || (also ?? []).some((a) => path.startsWith(a)));

function RailLink({ item, path }: { item: NavItem; path: string }) {
  const { href, label, icon: Icon } = item;
  const active = isActive(path, item);
  return (
    <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className={clsx('rail-link group relative flex flex-col items-center justify-center rounded-2xl transition-colors active:scale-95', active ? 'bg-coral-500 text-white' : 'text-ink-500 hover:bg-ink-500/[0.08] hover:text-ink')}>
      <Icon className="h-5 w-5" strokeWidth={1.8} />
      <span className="rail-label text-center text-[9.5px] font-medium leading-tight">{label}</span>
      <span className="rail-tip glass pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{label}</span>
    </Link>
  );
}

function Rail({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <aside className="rail neu sticky top-[72px] z-20 hidden h-[calc(100vh-84px)] shrink-0 flex-col items-center !rounded-[26px] py-3 lg:flex">
      <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main">
        {items.filter((i) => !i.foot).map((item) => (
          <div key={item.href + item.label} className="flex flex-col items-center gap-1">
            {item.group && <span className="my-1 h-px w-6 bg-ink/[0.08]" aria-hidden />}
            <RailLink item={item} path={path} />
          </div>
        ))}
        <div className="flex-1" />
        {items.filter((i) => i.foot).map((item) => <RailLink key={item.href} item={item} path={path} />)}
      </nav>
    </aside>
  );
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="mt-5 flex flex-col gap-1" aria-label="Main">
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isActive(path, item);
        return (
          <Link
            key={href + label}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium transition-colors',
              item.group && 'mt-3',
              active ? 'bg-coral-500 text-white' : 'text-ink-600 hover:bg-ink-500/[0.07]',
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center">
              <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SubNav() {
  const path = usePathname();
  const group = SUB_NAV.find((g) => path.startsWith(g.prefix));
  if (!group) return null;
  return (
    <nav className="segmented thin-scroll mb-4 flex max-w-full gap-0.5 overflow-x-auto p-0.5 sm:inline-flex" aria-label="Section">
      {group.items.map(({ href, label, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={clsx('whitespace-nowrap rounded-[9px] px-4 py-2 text-[13px] font-medium transition-colors', active ? 'segmented-thumb !transition-none text-ink' : 'text-ink-500 hover:text-ink')}>
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
          <div role="menu" className={clsx('glass menu-in absolute z-40 w-48 overflow-hidden rounded-2xl p-1.5', placement === 'up' ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2')}>
            <Link role="menuitem" href={profile} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm hover:bg-coral-500 hover:text-white">
              <UserIcon className="h-4 w-4" /> {user.role === 'admin' ? 'Settings' : 'Profile'}
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-bad hover:bg-coral-500 hover:text-white"
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

const TopSlot = createContext<HTMLElement | null>(null);

/** Hands a page's search and actions to the shell's top bar. */
export function TopBar({
  search, right,
}: {
  search?: { value: string; onChange: (v: string) => void; placeholder: string; onSubmit?: () => void };
  right?: React.ReactNode;
  showUser?: boolean;
  className?: string;
}) {
  const slot = useContext(TopSlot);
  const { user } = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');
  const field = search ?? (user?.role === 'admin' ? { value: q, onChange: setQ, placeholder: 'Search jobs, customers, vehicles…', onSubmit: () => router.push(`/admin/jobs?q=${encodeURIComponent(q)}`) } : undefined);
  if (!slot) return null;
  return createPortal(
    <>
      {field && (
        <form
          className="search-field flex h-10 max-w-[460px] flex-1 items-center gap-2.5 px-3.5 text-ink-400"
          onSubmit={(e) => {
            e.preventDefault();
            field.onSubmit?.();
          }}
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder={field.placeholder} aria-label={field.placeholder} className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-400" />
          {field.value && (
            <button type="button" aria-label="Clear search" onClick={() => field.onChange('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      )}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </>,
    slot,
  );
}

/* ------------------------------------------------------------------ shell */
export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, router, path]);

  const items = NAV[role];

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
    <TopSlot.Provider value={slot}>
    <div className="min-h-screen p-3 lg:pt-3">
      {/* desktop top bar */}
      <header data-scrolled={scrolled} className="topbar sticky top-0 z-30 -mx-3 -mt-3 mb-1 hidden h-[64px] items-center gap-4 px-5 lg:flex">
        <Link href={homeFor(role)} className="w-[150px] shrink-0">
          <Logo className="!text-[17px]" />
        </Link>
        <div ref={setSlot} className="flex min-w-0 flex-1 items-center gap-3" />
        <NotificationBell className="!h-10 !w-10" />
        <UserMenu />
      </header>

      {/* mobile top bar */}
      <header data-scrolled={scrolled} className="topbar sticky top-0 z-30 -mx-3 -mt-3 mb-2 flex items-center justify-between px-3 py-2 lg:hidden">
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
          <button aria-label="Close menu" className="absolute inset-0 bg-[#1d2129]/30" onClick={() => setDrawer(false)} />
          <aside className="neu slide-up relative h-full w-[280px] overflow-y-auto !rounded-l-none px-4 py-6">
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

      <div className="lg:flex lg:gap-3">
        <Rail items={items} />
        <main className="min-w-0 flex-1 px-1 pb-24 pt-1 lg:px-2 lg:pb-3">
          <SubNav />
          {children}
        </main>
      </div>

      {tabs.length > 0 && (
        <nav className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-[28px] px-2 py-1.5 lg:hidden" aria-label="Quick navigation">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? path === href : path.startsWith(href);
            return (
              <Link key={href + label} href={href} aria-current={active ? 'page' : undefined} className={clsx('flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium', active ? 'text-coral-600' : 'text-ink-400')}>
                <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full', active && 'bg-coral-500 text-white')}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
    </TopSlot.Provider>
  );
}

