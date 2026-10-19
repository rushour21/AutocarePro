'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { JobRow } from '@/components/features/JobRow';
import { Button, EmptyState, Field, FilterTabs, Modal, Select, Textarea, useToast } from '@/components/ui';
import { createJob } from '@/lib/actions';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { customerOf, isActive, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Priority } from '@/lib/types';
import { useRouter } from 'next/navigation';

type Tab = 'all' | 'mine' | 'progress' | 'hold' | 'done';
const SERVICES: [string, 'service' | 'brake' | 'ac' | 'body'][] = [['General Service', 'service'], ['Brake Service', 'brake'], ['AC Service', 'ac'], ['Body Repair', 'body'], ['Inspection', 'service']];

function Inner() {
  const db = useDb();
  const { user } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'progress' ? 'progress' : 'mine');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ vehicleId: db.vehicles[0]?.id ?? '', service: 0, priority: 'Medium' as Priority, notes: '' });

  const all = useMemo(() => (user ? visibleJobs(db, user) : []), [db, user]);
  const active = useMemo(() => all.filter(isActive), [all]);
  const counts = {
    mine: active.length,
    progress: active.filter((j) => !j.onHold && (j.stage === 'in_repair' || j.stage === 'diagnostics')).length,
    hold: active.filter((j) => j.onHold).length,
    done: all.filter((j) => j.stage === 'delivered').length,
  };
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = tab === 'all' ? all : tab === 'mine' ? active : tab === 'progress' ? active.filter((j) => !j.onHold && (j.stage === 'in_repair' || j.stage === 'diagnostics')) : tab === 'hold' ? active.filter((j) => j.onHold) : all.filter((j) => j.stage === 'delivered');
    return base.filter((j) => {
      if (!s) return true;
      const v = vehicleOf(db, j.vehicleId);
      return [j.id, v?.make, v?.model, v?.reg, customerOf(db, j.customerId)?.name].some((x) => x?.toLowerCase().includes(s));
    });
  }, [all, active, tab, q, db]);
  if (!user) return null;

  return (
    <>
      <TopBar
        search={{ value: q, onChange: setQ, placeholder: 'Search job number, customer, vehicle...' }}
        right={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Job</Button>}
      />
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <h1 className="text-[24px] font-bold">My Jobs</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Job</Button>
      </div>
      <FilterTabs
        variant="coral"
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', emphasis: true },
          { value: 'mine', label: 'Assigned to Me', count: counts.mine },
          { value: 'progress', label: 'In Progress', count: counts.progress },
          { value: 'hold', label: 'On Hold', count: counts.hold },
          { value: 'done', label: 'Completed', count: counts.done },
        ]}
      />
      <div className="space-y-4">
        {rows.map((j) => <JobRow key={j.id} db={db} job={j} by={user.name} />)}
        {rows.length === 0 && <div className="neu"><EmptyState title={tab === 'hold' ? 'No jobs on hold' : 'No jobs found'} text={q ? `Nothing matches “${q}”.` : 'Jobs assigned to you will show up here.'} /></div>}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New job"
        size="sm"
        footer={<><Button variant="neu" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { const [label, cat] = SERVICES[f.service]; const id = createJob({ vehicleId: f.vehicleId, service: label, category: cat, priority: f.priority, techId: user.id, notes: f.notes, by: user.name }); setOpen(false); toast.show(`Job #${id} created`); router.push(`/employee/jobs/${id}`); }}>Create job</Button></>}
      >
        <div className="space-y-4">
          <Field label="Vehicle"><Select value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })}>{db.vehicles.slice(0, 25).map((v) => <option key={v.id} value={v.id}>{vehicleName(v)} — {v.reg}</option>)}</Select></Field>
          <Field label="Service"><Select value={f.service} onChange={(e) => setF({ ...f, service: Number(e.target.value) })}>{SERVICES.map(([l], i) => <option key={l} value={i}>{l}</option>)}</Select></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></Select></Field>
          <Field label="Notes"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}

export default function MyJobsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
