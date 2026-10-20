'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, CalendarDays, ChevronRight, CircleDollarSign, Clock3, ClipboardList, Package, Plus, Sun } from 'lucide-react';
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
  const deliveries = active.filter((j) => j.delivery).sort((a, b) => new Date('1/1/2000 ' + a.delivery!.time).getTime() - new Date('1/1/2000 ' + b.delivery!.time).getTime());
  const lowStock = db.inventory.filter(isLow);
  const delayed = active.filter((j) => j.delayed);
  const oldEstimates = awaiting.filter((e) => e.sentHoursAgo >= 24);
  const followUps = db.customers.filter((c) => c.followUp);

  // today's schedule: active jobs ordered by their calendar slot
  const hhmm = (h: number) => {
    const hr = Math.floor(h), m = Math.round((h - hr) * 60);
    const h12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${hr >= 12 ? 'PM' : 'AM'}`;
  };
  const schedule = active
    .filter((j) => j.slot)
    .sort((a, b) => a.slot!.start - b.slot!.start)
    .slice(0, 5)
    .map((j) => ({
      job: j,
      time: hhmm(j.slot!.start),
      status: j.stage === 'pending' ? 'Scheduled' : j.stage === 'in_repair' || j.stage === 'quality_check' ? 'In Progress' : 'Pending',
    }));
  const quick = [
    { href: '/admin/jobs/new', icon: Plus, title: 'Create New Job', sub: 'Add a customer job', solid: true },
    { href: '/admin/calendar', icon: CalendarDays, title: 'View Calendar', sub: 'Check bookings' },
    { href: '/admin/inventory', icon: Package, title: 'Manage Inventory', sub: 'Parts & stock' },
    { href: '/admin/reports', icon: BarChart3, title: 'View Reports', sub: 'Workshop performance' },
  ];

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
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">Good morning, {user?.name.split(' ')[0]} <span className="inline-block">👋</span></h1>
          <p className="mt-0.5 text-[13px] text-ink-500">Here&apos;s what&apos;s happening at your workshop today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="neu-sm flex items-center gap-2 px-3.5 py-2 text-xs text-ink-600">
            <CalendarDays className="h-4 w-4 text-ink-500" /> {db.today}
          </span>
          {/* decorative demo reading: there is no weather integration */}
          <span title="Demo value" className="neu-sm flex items-center gap-2 px-3.5 py-2 text-xs font-semibold">
            <Sun className="h-4 w-4 text-warn" /> 28°C
          </span>
          <Link href="/admin/jobs/new" className="btn btn-coral h-10 px-5 text-sm">
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="min-w-0 space-y-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Summary">
            <StatCard icon={<ClipboardList className="h-[17px] w-[17px]" />} tone="coral" label="Active Jobs" value={active.length} sub="↑ 3 from yesterday" subTone="green" href="/admin/jobs" className="!p-4" />
            <StatCard icon={<CircleDollarSign className="h-[17px] w-[17px]" />} tone="coral" label="Awaiting Approval" value={awaiting.length} sub={`${inr(pending)} pending`} subTone="red" href="/admin/estimates?status=awaiting" className="!p-4" />
            <StatCard icon={<Clock3 className="h-[17px] w-[17px]" />} tone="blue" label="Due Today" value={dueToday.length} sub={`${dueToday.filter((j) => j.priority === 'High').length} high priority`} subTone="amber" href="/admin/jobs?due=today" className="!p-4" />
          </section>

          <div id="live-view" className="scroll-mt-4">
            <WorkshopLiveView mode="admin" wide hrefFor={(j) => `/admin/jobs/${j.id}`} />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15px] font-bold">Today&apos;s Deliveries</h2>
                <Link href="/admin/jobs" className="flex items-center gap-1 text-xs font-medium text-coral-600 hover:underline">View All <ArrowRight className="h-3 w-3" /></Link>
              </div>
              <ul className="space-y-1.5">
                {deliveries.slice(0, 3).map((j) => {
                  const v = vehicleOf(db, j.vehicleId);
                  return (
                    <li key={j.id}>
                      <Link href={`/admin/jobs/${j.id}`} className="neu-row flex items-center gap-3 px-3 py-2 transition hover:-translate-y-0.5">
                        {v && <VehicleImage carKey={v.carKey} className="h-8 w-14" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold">{vehicleName(v)}</span>
                          <span className="block text-[11px] text-ink-400">{v?.reg}</span>
                        </span>
                        <span className="text-xs text-ink-500">{j.delivery!.time}</span>
                        <StatusBadge tone={j.delivery!.state === 'At Risk' ? 'red' : 'green'} className="min-w-[68px] justify-center">{j.delivery!.state}</StatusBadge>
                      </Link>
                    </li>
                  );
                })}
                {deliveries.length === 0 && <li className="py-5 text-center text-sm text-ink-400">No deliveries scheduled today.</li>}
              </ul>
            </Card>

            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15px] font-bold">Needs Attention</h2>
                <Link href="/admin/jobs" className="flex items-center gap-1 text-xs font-medium text-coral-600 hover:underline">View All <ArrowRight className="h-3 w-3" /></Link>
              </div>
              <ul className="space-y-1.5">
                {attention.map((a) => (
                  <li key={a.text}>
                    <Link href={a.href} className="neu-row flex items-center gap-3 px-3 py-2.5 transition hover:-translate-y-0.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warn-soft text-warn">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-[13px] text-ink-700">{a.text}</span>
                      <ChevronRight className="h-4 w-4 text-ink-300" />
                    </Link>
                  </li>
                ))}
                {attention.length === 0 && <li className="py-5 text-center text-sm text-ink-400">Nothing needs your attention right now.</li>}
              </ul>
            </Card>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Quick actions and schedule">
          <Card className="p-4">
            <h2 className="mb-3 text-[15px] font-bold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {quick.map(({ href, icon: Icon, title, sub, solid }) => (
                <Link key={title} href={href} className="neu-row flex items-center gap-2 px-2 py-2.5 transition hover:-translate-y-0.5">
                  <span className={solid ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-coral-400 to-coral-500 text-white shadow-[0_4px_10px_rgba(242,106,46,0.35)]' : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-100 text-coral-500'}>
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[11.5px] font-semibold">{title}</span>
                    <span className="block truncate text-[10px] text-ink-400">{sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">Today&apos;s Schedule</h2>
              <Link href="/admin/calendar" className="flex items-center gap-1 text-xs font-medium text-coral-600 hover:underline">View All <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <ul>
              {schedule.map(({ job: j, time, status }) => {
                const v = vehicleOf(db, j.vehicleId);
                const tone = status === 'In Progress' ? 'bg-info-soft text-info' : status === 'Pending' ? 'bg-warn-soft text-coral-600' : 'bg-[#efe8de] text-ink-500';
                return (
                  <li key={j.id}>
                    <Link href={`/admin/jobs/${j.id}`} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-white/60">
                      <span className="flex w-[62px] shrink-0 items-center gap-1.5 text-[11px] text-ink-500">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500" />
                        {time}
                      </span>
                      {v && <VehicleImage carKey={v.carKey} className="h-7 w-12 shrink-0" />}
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-xs font-semibold">{vehicleName(v)}</span>
                        <span className="block truncate text-[10.5px] text-ink-400">{j.service}</span>
                      </span>
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${tone}`}>{status}</span>
                    </Link>
                  </li>
                );
              })}
              {schedule.length === 0 && <li className="py-5 text-center text-sm text-ink-400">Nothing scheduled today.</li>}
            </ul>
          </Card>

          <div className="relative min-h-[190px] flex-1 overflow-hidden rounded-[22px] shadow-neu" style={{ backgroundColor: '#f7efe4', backgroundImage: 'url(/assets/photos/hero.jpg)', backgroundSize: 'auto 78%', backgroundPosition: '100% 100%', backgroundRepeat: 'no-repeat' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#f7efe4] via-[#f7efe4]/40 to-transparent" />
            <div className="relative flex h-full flex-col items-start p-5">
              <h2 className="max-w-[170px] text-[17px] font-bold leading-tight">Keep Your Garage Running Smoothly</h2>
              <p className="mt-1.5 max-w-[170px] text-[11px] leading-snug text-ink-500">Track jobs, manage work, and deliver great service — all in one place.</p>
              <a href="#live-view" className="btn btn-neu mt-3 h-9 self-start px-3.5 text-xs font-semibold">
                View Workshop Live View <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
