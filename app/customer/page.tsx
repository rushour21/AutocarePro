'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarCheck, Car, CheckCircle2, CircleDollarSign, Clock, Receipt, Wrench } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { WorkshopLiveView } from '@/components/features/WorkshopLiveView';
import { Button, Card, ProgressBar, StatCard, StatusBadge, VehicleImage } from '@/components/ui';
import { visibleBookings, visibleEstimates, visibleInvoices, visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { inr, isActive, STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function CustomerDashboard() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');
  if (!user) return null;
  const jobs = visibleJobs(db, user);
  const active = jobs.filter(isActive);
  const awaiting = visibleEstimates(db, user).filter((e) => e.status === 'Awaiting Approval');
  const completed = jobs.filter((j) => j.stage === 'delivered' && (j.completedInDays ?? 999) <= 120);
  const customer = db.customers.find((c) => c.id === user.customerId);
  const current = active[0];
  const cv = current && vehicleOf(db, current.vehicleId);
  const invoice = visibleInvoices(db, user)[0];
  const booking = visibleBookings(db, user)[0];
  const bv = booking && vehicleOf(db, booking.vehicleId);
  const iv = invoice && vehicleOf(db, invoice.vehicleId);
  const unread = db.notifications.filter((n) => n.customerId === user.customerId && !n.read).length;

  const sentence = [
    active.length ? `Your ${active.map((j) => vehicleName(vehicleOf(db, j.vehicleId))).join(' and ')} ${active.length > 1 ? 'are' : 'is'} in service` : 'None of your vehicles are in service right now',
    awaiting.length ? ` and ${awaiting.length} estimate${awaiting.length > 1 ? 's are' : ' is'} awaiting approval.` : '.',
  ].join('');

  return (
    <>
      <TopBar search={{ value: q, onChange: setQ, placeholder: 'Search anything...', onSubmit: () => router.push('/customer/history') }} showUser />
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">Good morning, {user.name.split(' ')[0]} <span>👋</span></h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">{sentence}</p>

      <div className="mb-6 grid grid-cols-3 gap-3 lg:hidden">
        {[{ href: '/customer/bookings/new', icon: CalendarCheck, label: 'Book Service' }, { href: '/customer/vehicles', icon: Car, label: 'My Vehicles' }, { href: '/customer/invoices', icon: Receipt, label: 'Invoices' }].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="neu flex flex-col items-center gap-2 !rounded-[20px] px-2 py-4 text-xs font-medium"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-100 text-coral-500"><Icon className="h-5 w-5" /></span>{label}</Link>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Summary">
        <StatCard variant="stacked" tone="red" icon={<Wrench className="h-5 w-5" />} value={active.length} label="Active Service" />
        <StatCard variant="stacked" tone="amber" icon={<Clock className="h-5 w-5" />} value={awaiting.length} label="Pending Approval" href={awaiting[0] ? `/customer/estimates/${awaiting[0].id}` : '/customer/estimates'} />
        <StatCard variant="stacked" tone="green" icon={<CheckCircle2 className="h-5 w-5" />} value={completed.length} label="Completed" />
        <StatCard variant="stacked" tone="violet" icon={<CircleDollarSign className="h-5 w-5" />} value={inr(customer?.totalSpent ?? 0)} label="Total Spent" />
      </section>

      <Card className="mt-5 p-5">
        <h2 className="mb-4 text-lg font-bold">Current Service</h2>
        {current && cv ? (
          <div className="grid items-center gap-5 md:grid-cols-[auto_1fr_auto]">
            <div className="flex items-center gap-5">
              <VehicleImage carKey={cv.carKey} className="h-[64px] w-[120px]" />
              <div><p className="text-lg font-bold">{vehicleName(cv)}</p><p className="text-sm text-ink-500">{cv.reg}</p></div>
            </div>
            <div className="md:justify-self-center"><StatusBadge tone={current.stage === 'quality_check' ? 'amber' : current.stage === 'ready' ? 'green' : 'blue'} dot size="lg" className="!px-4 !py-2 shadow-neu-sm">{STAGE_LABEL[current.stage]}</StatusBadge></div>
            <div className="text-sm md:text-right"><p className="text-ink-500">Est. Completion</p><p className="font-semibold">{current.estCompletion}</p></div>
            <div className="md:col-span-3">
              <div className="flex items-center gap-4"><ProgressBar value={current.progress} className="flex-1 !h-3" /><span className="w-10 text-xs text-ink-400">{current.progress}%</span></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-600">{current.service.replace(' - ', ' and ')}</p>
                <Button size="lg" href={`/customer/jobs/${current.id}`} className="min-w-[160px]">View Details</Button>
              </div>
            </div>
          </div>
        ) : <p className="py-4 text-sm text-ink-500">No vehicle is in service. <Link href="/customer/bookings/new" className="font-semibold text-coral-600">Book a service</Link></p>}
      </Card>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Upcoming Appointment</h2>
          {booking && bv ? (
            <div className="neu-row flex items-center gap-4 px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warn-soft text-warn"><CalendarCheck className="h-5 w-5" /></span>
              <div className="flex-1"><p className="font-bold">{vehicleName(bv)}</p><p className="text-sm text-ink-500">{booking.service}</p><p className="text-sm text-ink-500">{booking.date}</p></div>
              <Button variant="soft" size="sm" href="/customer/bookings">View</Button>
            </div>
          ) : <p className="py-4 text-sm text-ink-500">No upcoming appointments.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Recent Invoice</h2>
          {invoice && iv ? (
            <div className="neu-row flex items-center gap-4 px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warn-soft text-warn"><Receipt className="h-5 w-5" /></span>
              <div className="flex-1"><p className="font-bold">{vehicleName(iv)}</p><p className="text-lg font-bold">{inr(invoice.amount)}</p><p className="text-sm"><span className={invoice.status === 'Paid' ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{invoice.status}</span> <span className="text-ink-500">- {invoice.date}</span></p></div>
              <Button variant="soft" size="sm" href="/customer/invoices">View</Button>
            </div>
          ) : <p className="py-4 text-sm text-ink-500">No invoices yet.</p>}
        </Card>
      </section>

      <section className="mt-5 lg:hidden">
        <h2 className="mb-3 flex items-center justify-between text-lg font-bold">Live Workshop {unread > 0 && <Link href="/customer/notifications" className="flex items-center gap-1 text-xs font-medium text-coral-600"><Bell className="h-3.5 w-3.5" /> {unread} new</Link>}</h2>
        {current && <WorkshopLiveView mode="customer" variant="cover" highlightJobId={current.id} />}
      </section>
    </>
  );
}
