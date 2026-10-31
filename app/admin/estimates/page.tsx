'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, DataTable, FilterTabs, Modal, PageHeader, Select, StatusBadge, VehicleImage, useToast, type Column } from '@/components/ui';
import { createEstimate } from '@/lib/actions';
import { customerOf, estimateTotals, quotedItems, inr, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Estimate } from '@/lib/types';

const TONE = { 'Awaiting Approval': 'amber', Approved: 'green', Rejected: 'red', Draft: 'gray' } as const;

function Inner() {
  const db = useDb();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'awaiting' | 'approved' | 'rejected'>((params.get('status') as 'awaiting') || 'all');
  const [open, setOpen] = useState(false);
  const [jobId, setJobId] = useState('');
  const withoutEstimate = db.jobs.filter((j) => j.stage !== 'delivered' && !db.estimates.some((e) => e.jobId === j.id));

  const rows = useMemo(
    () => db.estimates.filter((e) => tab === 'all' || (tab === 'awaiting' ? e.status === 'Awaiting Approval' : tab === 'approved' ? e.status === 'Approved' : e.status === 'Rejected')),
    [db.estimates, tab],
  );
  const cols: Column<Estimate>[] = [
    { key: 'id', header: 'Estimate', cell: (e) => <span className="font-semibold">{e.id}</span> },
    { key: 'v', header: 'Vehicle', cell: (e) => { const j = db.jobs.find((x) => x.id === e.jobId); const v = j && vehicleOf(db, j.vehicleId); return <span className="flex items-center gap-3">{v && <VehicleImage carKey={v.carKey} className="h-8 w-14" />}{vehicleName(v)}</span>; } },
    { key: 'c', header: 'Customer', cell: (e) => { const j = db.jobs.find((x) => x.id === e.jobId); return j && customerOf(db, j.customerId)?.name; } },
    { key: 't', header: 'Total', cell: (e) => <span className="font-semibold">{inr(estimateTotals(quotedItems(e)).total)}</span> },
    { key: 's', header: 'Status', cell: (e) => <StatusBadge tone={TONE[e.status]} dot>{e.status}</StatusBadge> },
  ];
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Estimates" subtitle="Quotes sent to customers for approval" actions={<Button onClick={() => { setJobId(withoutEstimate[0]?.id ?? ''); setOpen(true); }} disabled={withoutEstimate.length === 0}><Plus className="h-4 w-4" /> New Estimate</Button>} />
      <FilterTabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All', count: db.estimates.length },
          { value: 'awaiting', label: 'Awaiting Approval', count: db.estimates.filter((e) => e.status === 'Awaiting Approval').length },
          { value: 'approved', label: 'Approved', count: db.estimates.filter((e) => e.status === 'Approved').length },
          { value: 'rejected', label: 'Rejected', count: db.estimates.filter((e) => e.status === 'Rejected').length },
        ]}
      />
      <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} onRowClick={(e) => router.push(`/admin/estimates/${e.id}`)} pageSize={10} />
      <Modal open={open} onClose={() => setOpen(false)} title="New estimate" size="sm" footer={<><Button variant="neu" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!jobId} onClick={() => { const id = createEstimate(jobId); setOpen(false); toast.show(`${id} created`); router.push(`/admin/estimates/${id}`); }}>Create draft</Button></>}>
        <label className="block text-xs font-medium text-ink-500">Job
          <Select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1.5">{withoutEstimate.map((j) => <option key={j.id} value={j.id}>#{j.id} · {vehicleName(vehicleOf(db, j.vehicleId))} — {j.service}</option>)}</Select>
        </label>
      </Modal>
      {toast.node}
    </>
  );
}

export default function EstimatesPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
