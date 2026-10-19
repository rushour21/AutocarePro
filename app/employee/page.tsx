'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, ChevronRight, ClipboardList, Flame, Gauge, Wrench } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { WorkshopLiveView } from '@/components/features/WorkshopLiveView';
import { Button, Card, EmptyState, StatCard, StatusBadge, VehicleImage } from '@/components/ui';
import { setTaskStatus } from '@/lib/actions';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, STAGE_LABEL, STAGE_TONE, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function EmployeeDashboard() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');
  if (!user) return null;
  const mine = visibleJobs(db, user).filter(isActive);
  const inProgress = mine.filter((j) => j.stage === 'in_repair' || j.stage === 'diagnostics');
  const qc = mine.filter((j) => j.stage === 'quality_check');
  const due = mine.filter((j) => j.dueIn === 0);
  const current = mine.find((j) => j.stage === 'in_repair') ?? mine[0];
  const cv = current && vehicleOf(db, current.vehicleId);
  const tasks = mine.flatMap((j) => {
    const t = j.tasks.find((x) => x.status !== 'Completed');
    return t ? [{ job: j, task: t }] : [];
  });

  return (
    <>
      <TopBar
        search={{ value: q, onChange: setQ, placeholder: 'Search job number, vehicle, customer...', onSubmit: () => router.push(`/employee/jobs?q=${encodeURIComponent(q)}`) }}
        right={<span className="neu-sm px-4 py-2.5 text-sm text-ink-600">{db.today}</span>}
      />
      <div className="mb-6">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight">Good morning, {user.name.split(' ')[0]} <span>👋</span></h1>
        <p className="mt-1 text-sm text-ink-500">You have {mine.length} jobs assigned today.</p>
      </div>
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Summary">
        <StatCard variant="stacked" tone="coral" icon={<Flame className="h-5 w-5" />} value={mine.length} label="My Jobs" href="/employee/jobs" />
        <StatCard variant="stacked" tone="blue" icon={<Wrench className="h-5 w-5" />} value={inProgress.length} label="In Progress" href="/employee/jobs?tab=progress" />
        <StatCard variant="stacked" tone="amber" icon={<Gauge className="h-5 w-5" />} value={qc.length} label="Quality Check" />
        <StatCard variant="stacked" tone="blue" icon={<ClipboardList className="h-5 w-5" />} value={due.length} label="Due Today" />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Current Job</h2>
          {current && cv ? (
            <div className="neu-row p-4">
              <div className="flex items-center gap-4">
                <div className="neu-in-sm flex h-[84px] w-[120px] shrink-0 items-center justify-center !rounded-2xl"><VehicleImage carKey={cv.carKey} className="h-16 w-[104px]" /></div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">#{current.id}</p>
                  <p className="font-bold">{vehicleName(cv)}</p>
                  <p className="text-sm text-ink-400">{cv.reg}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <StatusBadge tone={STAGE_TONE[current.stage]} dot size="lg">{STAGE_LABEL[current.stage]}</StatusBadge>
                <div className="text-right">
                  <p className="mb-2 text-xs text-ink-500">{current.elapsed ?? '—'} elapsed</p>
                  <Button href={`/employee/jobs/${current.id}`} size="lg">Continue Work</Button>
                </div>
              </div>
            </div>
          ) : <EmptyState title="No active job" text="New assignments will appear here." />}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Workshop Live View</h2>
          <WorkshopLiveView mode="tech" variant="compact" userId={user.id} hrefFor={(j) => `/employee/jobs/${j.id}`} />
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Today&apos;s Jobs ({mine.length})</h2>
            <Link href="/employee/jobs" className="btn btn-soft h-8 px-3 text-xs">View All</Link>
          </div>
          <ul className="divide-y divide-ivory-300/60">
            {mine.map((j) => {
              const v = vehicleOf(db, j.vehicleId);
              return (
                <li key={j.id}>
                  <Link href={`/employee/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 transition hover:opacity-80">
                    {v && <VehicleImage carKey={v.carKey} className="h-8 w-14" />}
                    <span className="w-14 text-xs font-semibold text-ink-500">#{j.id}</span>
                    <span className="flex-1 truncate text-sm font-bold">{vehicleName(v)}</span>
                    <StatusBadge tone={STAGE_TONE[j.stage]} dot size="sm" className="hidden sm:inline-flex">{STAGE_LABEL[j.stage]}</StatusBadge>
                    <span className="w-12 text-right text-xs text-ink-500">{j.elapsed ?? '–'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">My Tasks</h2>
            <Link href="/employee/jobs" className="btn btn-soft h-8 px-3 text-xs">View All</Link>
          </div>
          <ul className="space-y-1">
            {tasks.map(({ job, task }) => (
              <li key={job.id} className="flex items-center gap-3 border-b border-ivory-300/50 py-3 last:border-0">
                <button
                  aria-label={`Mark "${task.title}" for ${vehicleName(vehicleOf(db, job.vehicleId))} as completed`}
                  onClick={() => setTaskStatus(job.id, task.id, 'Completed')}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#ff9a5e] to-[#f25a1f] text-white shadow-coral"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
                <span className="flex-1 text-sm text-ink-700">{task.title} - {vehicleName(vehicleOf(db, job.vehicleId))}</span>
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </li>
            ))}
            {tasks.length === 0 && <li className="py-6 text-center text-sm text-ink-400">All tasks are complete.</li>}
          </ul>
        </Card>
      </section>
    </>
  );
}
