'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, CalendarClock, Car, ChevronRight, CreditCard, FileText, Gift, Wrench } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { EmptyState, FilterTabs, PageHeader } from '@/components/ui';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions';
import { visibleNotifications } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { useDb } from '@/lib/store';
import type { NotificationKind } from '@/lib/types';

const ICON: Record<NotificationKind, { icon: React.ElementType; cls: string }> = {
  service: { icon: Wrench, cls: 'bg-info-soft text-info' }, estimate: { icon: FileText, cls: 'bg-coral-100 text-coral-500' }, ready: { icon: Car, cls: 'bg-warn-soft text-warn' },
  payment: { icon: CreditCard, cls: 'bg-info-soft text-info' }, reminder: { icon: CalendarClock, cls: 'bg-info-soft text-info-strong' }, offer: { icon: Gift, cls: 'bg-violet-soft text-violet' },
};
type Tab = 'all' | 'service' | 'payments' | 'offers';

export default function Notifications() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  if (!user) return null;
  const all = visibleNotifications(db, user);
  const unread = all.filter((n) => !n.read).length;
  const list = all.filter((n) => tab === 'all' || (tab === 'service' && ['service', 'estimate', 'ready', 'reminder'].includes(n.kind)) || (tab === 'payments' && n.kind === 'payment') || (tab === 'offers' && n.kind === 'offer'));
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Notifications" actions={unread > 0 ? <button onClick={() => markAllNotificationsRead(user.customerId!)} className="text-sm font-semibold text-coral-600">Mark all as read <span className="ml-1 rounded-md bg-coral-100 px-2 py-0.5">{unread}</span></button> : null} />
      <FilterTabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All' }, { value: 'service', label: 'Service Updates' }, { value: 'payments', label: 'Payments' }, { value: 'offers', label: 'Offers' }]} />
      {list.length === 0 ? <div className="neu"><EmptyState icon={<Bell className="h-7 w-7" />} title="Nothing here" text={tab === 'offers' ? 'There are no offers right now.' : 'You are all caught up.'} /></div> : (
        <ul className="space-y-3">
          {list.map((n) => {
            const { icon: Icon, cls } = ICON[n.kind];
            return (
              <li key={n.id}>
                <button onClick={() => { markNotificationRead(n.id); if (n.href) router.push(n.href); }} className="neu flex w-full items-center gap-4 !rounded-[20px] px-5 py-4 text-left transition hover:-translate-y-0.5">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cls}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className={`block ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</span><span className="block text-sm text-ink-500">{n.sub} • {n.ago}</span></span>
                  {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-coral-500" aria-label="Unread" />}
                  <ChevronRight className="h-5 w-5 text-ink-300" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
