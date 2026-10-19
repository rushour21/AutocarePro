'use client';

import { useState } from 'react';
import { PartIcon } from '@/components/features/PartIcon';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, DataTable, EmptyState, FilterTabs, Input, Modal, SearchInput, Select, StatusBadge, useToast, type Column } from '@/components/ui';
import { requestPart } from '@/lib/actions';
import { visibleJobs, visiblePartRequests } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Part, PartRequest } from '@/lib/types';

const TONE = { Approved: 'green', Pending: 'amber', Rejected: 'red' } as const;

export default function PartsRequestPage() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<'request' | 'mine'>('request');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Part | null>(null);
  const [jobId, setJobId] = useState('');
  const [qty, setQty] = useState('1');
  const [err, setErr] = useState('');
  if (!user) return null;
  const jobs = visibleJobs(db, user).filter(isActive);
  const mine = visiblePartRequests(db, user);
  const parts = db.inventory.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const jobOf = (r: PartRequest) => db.jobs.find((j) => j.id === r.jobId);

  const cols: Column<PartRequest>[] = [
    { key: 'p', header: 'Part Name', cell: (r) => <span className="flex items-center gap-2.5"><span className="h-3 w-3 rounded-full border-[3px] border-coral-400" />{r.partName}</span> },
    { key: 'v', header: 'Vehicle', cell: (r) => vehicleName(vehicleOf(db, jobOf(r)?.vehicleId ?? '') ) },
    { key: 'q', header: 'Quantity', cell: (r) => r.qty, className: 'text-center', headClassName: 'text-center' },
    { key: 's', header: 'Status', cell: (r) => <StatusBadge tone={TONE[r.status]}>{r.status}</StatusBadge> },
  ];

  const submit = () => {
    const n = Number(qty);
    if (!jobId) return setErr('Choose a job');
    if (!Number.isInteger(n) || n < 1 || n > 99) return setErr('Quantity must be between 1 and 99');
    requestPart({ partName: sel!.name, jobId, qty: n, by: user.id });
    toast.show(`${sel!.name} requested`);
    setSel(null);
    setQty('1');
    setErr('');
  };

  return (
    <>
      <TopBar />
      <h1 className="mb-4 text-[24px] font-bold lg:hidden">Parts Request</h1>
      <FilterTabs variant="soft" value={tab} onChange={setTab} className="mb-5" tabs={[{ value: 'request', label: 'Request Parts' }, { value: 'mine', label: 'My Requests', count: mine.length }]} />
      {tab === 'request' ? (
        <>
          <SearchInput value={q} onChange={setQ} placeholder="Search parts..." className="mb-6" />
          <h2 className="mb-3 text-lg font-bold">Common Parts</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {parts.map((p) => (
              <Card key={p.id} className="flex flex-col items-start p-4">
                <div className="mb-2 flex h-14 w-full items-center justify-center"><PartIcon part={p} size={56} /></div>
                <p className="font-bold">{p.name.replace(' (Front)', '')}</p>
                <p className="mb-3 text-sm text-ink-400">Stock: {p.stock}</p>
                <Button variant="soft" className="w-full" onClick={() => { setSel(p); setJobId(jobs[0]?.id ?? ''); setErr(''); }}>Request</Button>
              </Card>
            ))}
            {parts.length === 0 && <div className="col-span-full"><EmptyState title="No parts match your search" /></div>}
          </div>
          <h2 className="mb-3 mt-8 text-lg font-bold">Recent Requests</h2>
          <DataTable columns={cols} rows={mine.slice(0, 6)} rowKey={(r) => r.id} dense empty={<EmptyState title="No requests yet" />} />
        </>
      ) : (
        <DataTable columns={[...cols, { key: 'd', header: 'Requested', cell: (r: PartRequest) => r.at }]} rows={mine} rowKey={(r) => r.id} empty={<EmptyState title="You haven’t requested any parts" />} />
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Request ${sel.name}` : ''} size="sm" footer={<><Button variant="neu" onClick={() => setSel(null)}>Cancel</Button><Button onClick={submit} disabled={jobs.length === 0}>Send request</Button></>}>
        <div className="space-y-4">
          {jobs.length === 0 ? <p className="text-sm text-ink-500">You have no active jobs to attach this request to.</p> : (
            <label className="block text-xs font-medium text-ink-500">For job
              <Select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-1.5">{jobs.map((j) => <option key={j.id} value={j.id}>#{j.id} · {vehicleName(vehicleOf(db, j.vehicleId))}</option>)}</Select>
            </label>
          )}
          <label className="block text-xs font-medium text-ink-500">Quantity<Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1.5" /></label>
          {sel && sel.stock <= sel.minStock && <p className="text-xs text-warn-strong">Only {sel.stock} in stock — approval may take longer.</p>}
          {err && <p className="text-sm text-bad">{err}</p>}
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
