'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, ChevronRight, CircleDollarSign, Clock3, ClipboardList, Cloud, Flame } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { WorkshopLiveView } from '@/components/features/WorkshopLiveView';
import { Card, StatCard, StatusBadge, VehicleImage } from '@/components/ui';
import { estimateTotals, inr, isActive, isLow, vehicleName, vehicleOf } from '@/lib/format';
import { useSession } from '@/lib/auth';
import { useDb } from '@/lib/store';

export default function AdminDashboard() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');

  const active = db.jobs.filter(isActive);
  const awaiting = db.estimates.filter((e) => e.status === 'Awaiting Approval');
  const pending = awaiting.reduce((s, e) => s + estimateTotals(e.items).subtotal, 0);
  const dueToday = active.filter((j) => j.dueIn === 0);
  const overdue = active.filter((j) => j.dueIn < 0);
  const deliveries = active.filter((j) => j.delivery).sort((a, b) => new Date('1/1/2000 ' + a.delivery!.time).getTime() - new Date('1/1/2000 ' + b.delivery!.time).getTime());
  const lowStock = db.inventory.filter(isLow);
  const delayed = active.filter((j) => j.delayed);
  const oldEstimates = awaiting.filter((e) => e.sentHoursAgo >= 24);
  const followUps = db.customers.filter((c) => c.followUp);

  const attention = [
    { text: `${oldEstimates.length} estimates awaiting approval`, href: '/admin/estimates?status=awaiting', show: oldEstimates.length > 0 },
    ...delayed.map((j) => ({ text: `${delayed.length} vehicle delayed (${vehicleName(vehicleOf(db, j.vehicleId))})`, href: `/admin/jobs/${j.id}`, show: true })),
    { text: `${lowStock.length} parts low in stock`, href: '/admin/inventory', show: lowStock.length > 0 },
    { text: `${followUps.length} customer follow-ups`, href: '/admin/customers', show: followUps.length > 0 },
  ].filter((a) => a.show);

  return (
    <>
      <TopBar
        showUser
        search={{ value: q, onChange: setQ, placeholder: 'Search by customer, vehicle, job number...', onSubmit: () => router.push(`/admin/jobs?q=${encodeURIComponent(q)}`) }}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold leading-tight tracking-tight">Good morning, {user?.name.split(' ')[0]} <span className="inline-block">👋</span></h1>
          <p className="mt-1 text-sm text-ink-500">
            Your workshop is running smoothly. {dueToday.length} {dueToday.length === 1 ? 'vehicle' : 'vehicles'} ready for delivery today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-400">{db.today}</span>
          {/* decorative demo reading: there is no weather integration */}
          <span title="Demo value" className="neu-sm flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
            <Cloud className="h-5 w-5 text-warn" /> 28°C
          </span>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Summary">
        <StatCard icon={<ClipboardList className="h-[18px] w-[18px]" />} tone="coral" label="Active Jobs" value={active.length} sub="+3 from yesterday" subTone="green" />
        <StatCard icon={<CircleDollarSign className="h-[18px] w-[18px]" />} tone="coral" label="Awaiting Approval" value={awaiting.length} sub={`${inr(pending)} pending`} subTone="red" href="/admin/estimates?status=awaiting" />
        <StatCard icon={<Clock3 className="h-[18px] w-[18px]" />} tone="blue" label="Due Today" value={dueToday.length} sub={`${dueToday.filter((j) => j.priority === 'High').length} high priority`} subTone="amber" href="/admin/jobs?due=today" />
        <StatCard icon={<Flame className="h-[18px] w-[18px]" />} tone="coral" label="Overdue" value={overdue.length} sub={`${overdue.filter((j) => j.priority === 'High').length} high priority`} subTone="red" href="/admin/jobs?due=overdue" />
      </section>

      <WorkshopLiveView mode="admin" className="mt-6" hrefFor={(j) => `/admin/jobs/${j.id}`} />

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Today&apos;s Deliveries ({deliveries.length})</h2>
            <Link href="/admin/jobs" aria-label="All jobs" className="text-ink-400 hover:text-ink">
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          <ul className="space-y-2">
            {deliveries.map((j) => {
              const v = vehicleOf(db, j.vehicleId);
              return (
                <li key={j.id}>
                  <Link href={`/admin/jobs/${j.id}`} className="neu-row flex items-center gap-4 px-4 py-3 transition hover:-translate-y-0.5">
                    {v && <VehicleImage carKey={v.carKey} className="h-9 w-16" />}
                    <span className="flex-1 text-sm font-semibold">{vehicleName(v)}</span>
                    <span className="text-sm text-ink-500">{j.delivery!.time}</span>
                    <StatusBadge tone={j.delivery!.state === 'At Risk' ? 'red' : 'green'} className="min-w-[72px] justify-center">{j.delivery!.state}</StatusBadge>
                  </Link>
                </li>
              );
            })}
            {deliveries.length === 0 && <li className="py-6 text-center text-sm text-ink-400">No deliveries scheduled today.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Needs Attention</h2>
            <ChevronRight className="h-5 w-5 text-ink-400" />
          </div>
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="neu-row flex items-center gap-4 px-4 py-3.5 transition hover:-translate-y-0.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn-soft text-warn">
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm text-ink-700">{a.text}</span>
                </Link>
              </li>
            ))}
            {attention.length === 0 && <li className="py-6 text-center text-sm text-ink-400">Nothing needs your attention right now.</li>}
          </ul>
        </Card>
      </section>
    </>
  );
}
