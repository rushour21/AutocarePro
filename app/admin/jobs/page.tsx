'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { JobBoard } from '@/components/features/JobBoard';
import { Button, DataTable, FilterTabs, PageHeader, StatusBadge, VehicleImage, Avatar, useToast, type Column } from '@/components/ui';
import { isActive, STAGE_LABEL, STAGE_TONE, userOf, vehicleName, vehicleOf, customerOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Job } from '@/lib/types';
import { AdminCalendarView } from '@/components/features/AdminCalendar';

function JobsInner() {
  const db = useDb();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board');
  const [q, setQ] = useState(params.get('q') ?? '');
  const due = params.get('due');

  const jobs = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.jobs
      .filter(isActive)
      .filter((j) => (due === 'today' ? j.dueIn === 0 : due === 'overdue' ? j.dueIn < 0 : true))
      .filter((j) => {
        if (!s) return true;
        const v = vehicleOf(db, j.vehicleId);
        const c = customerOf(db, j.customerId);
        return [j.id, v?.make, v?.model, v?.reg, c?.name, j.service].some((x) => x?.toLowerCase().includes(s));
      });
  }, [db, q, due]);

  const cols: Column<Job>[] = [
    { key: 'id', header: 'Job', cell: (j) => <span className="font-semibold">#{j.id}</span> },
    { key: 'v', header: 'Vehicle', cell: (j) => { const v = vehicleOf(db, j.vehicleId); return <span className="flex items-center gap-3">{v && <VehicleImage carKey={v.carKey} className="h-8 w-14" />}<span><span className="block font-medium">{vehicleName(v)}</span><span className="block text-xs text-ink-400">{v?.reg}</span></span></span>; } },
    { key: 'c', header: 'Customer', cell: (j) => customerOf(db, j.customerId)?.name },
    { key: 's', header: 'Service', cell: (j) => j.service },
    { key: 'st', header: 'Status', cell: (j) => <StatusBadge tone={STAGE_TONE[j.stage]} dot>{STAGE_LABEL[j.stage]}</StatusBadge> },
    { key: 't', header: 'Technician', cell: (j) => { const u = userOf(db, j.techId); return <span className="flex items-center gap-2"><Avatar src={u?.avatar} size={26} />{u?.name}</span>; } },
    { key: 'd', header: 'Due', cell: (j) => <span className={j.dueIn < 0 ? 'font-medium text-bad' : ''}>{j.dueLabel}</span> },
  ];

  return (
    <>
      <TopBar
        showUser
        search={{ value: q, onChange: setQ, placeholder: 'Search by customer, vehicle...' }}
      />
      <PageHeader
        title="Jobs"
        subtitle={`${jobs.length} active ${jobs.length === 1 ? 'job' : 'jobs'} in the workshop`}
        actions={
          <>
            {(due || q) && (
              <button
                onClick={() => {
                  setQ('');
                  router.push('/admin/jobs');
                }}
                className="btn btn-neu h-10 gap-2 px-3.5 text-sm"
              >
                {due === 'today' ? 'Due today' : due === 'overdue' ? 'Overdue' : `“${q}”`} <X className="h-4 w-4" />
              </button>
            )}
            <Button href="/admin/jobs/new">
              <Plus className="h-4 w-4" /> New Job
            </Button>
          </>
        }
      />
      <FilterTabs
        className="mb-4"
        variant="soft"
        value={view}
        onChange={setView}
        tabs={[
          { value: 'board', label: 'Board' },
          { value: 'list', label: 'List' },
          { value: 'calendar', label: 'Calendar' },
        ]}
      />
      {view === 'board' && <JobBoard db={db} jobs={jobs} onToast={toast.show} />}
      {view === 'list' && (
        <>
          <div className="hidden md:block">
            <DataTable columns={cols} rows={jobs} rowKey={(j) => j.id} onRowClick={(j) => router.push(`/admin/jobs/${j.id}`)} pageSize={10} />
          </div>
          <ul className="space-y-2 md:hidden">
            {jobs.map((j) => {
              const v = vehicleOf(db, j.vehicleId);
              return (
                <li key={j.id}>
                  <Link href={`/admin/jobs/${j.id}`} className="flex items-center gap-3 rounded-[18px] bg-[#fbfbfc] p-3 shadow-neu-xs active:scale-[0.99]">
                    {v && <VehicleImage carKey={v.carKey} className="h-9 w-14 shrink-0" />}
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-semibold">{vehicleName(v)}</span>
                      <span className="block truncate text-xs text-ink-500">#{j.id} · {customerOf(db, j.customerId)?.name}</span>
                      <span className={j.dueIn < 0 ? 'mt-0.5 block truncate text-[11px] font-medium text-bad' : 'mt-0.5 block truncate text-[11px] text-ink-500'}>{j.dueLabel}</span>
                    </span>
                    <StatusBadge tone={STAGE_TONE[j.stage]} size="sm">{STAGE_LABEL[j.stage]}</StatusBadge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {view === 'calendar' && <AdminCalendarView />}
      {toast.node}
    </>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsInner />
    </Suspense>
  );
}
