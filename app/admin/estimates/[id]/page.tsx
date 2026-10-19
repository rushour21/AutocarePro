'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { EstimateTable, EstimateTotals } from '@/components/features/EstimateView';
import { NoAccess } from '@/components/features/NoAccess';
import { Button, Card, Input, Modal, Select, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { sendEstimate, updateEstimate } from '@/lib/actions';
import { vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { EstimateItem } from '@/lib/types';

const TONE = { 'Awaiting Approval': 'amber', Approved: 'green', Rejected: 'red', Draft: 'gray' } as const;

export default function AdminEstimatePage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const toast = useToast();
  const est = db.estimates.find((e) => e.id === id);
  const [edit, setEdit] = useState(false);
  const [rows, setRows] = useState<EstimateItem[]>([]);
  const job = est && db.jobs.find((j) => j.id === est.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  if (!est || !job) return <NoAccess what="estimate" backHref="/admin/estimates" />;

  return (
    <>
      <TopBar showUser />
      <div className="mx-auto max-w-[760px]">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Link href="/admin/estimates" aria-label="Back to estimates" className="btn btn-neu h-11 w-11 !rounded-full"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-[24px] font-bold">Estimate {est.id}</h1>
          <StatusBadge tone={TONE[est.status]} dot size="lg" className="ml-auto">{est.status}</StatusBadge>
        </div>
        <Card className="mb-4 flex items-center gap-4 p-4">
          {v && <VehicleImage carKey={v.carKey} className="h-14 w-28" />}
          <div className="flex-1">
            <p className="font-bold">{vehicleName(v)}</p>
            <p className="text-sm text-ink-400">{v?.reg}</p>
          </div>
          <Button variant="blue" href={`/admin/jobs/${job.id}/inspection`} className="!h-12 px-6 font-semibold">View Inspection</Button>
        </Card>
        <EstimateTable items={est.items} columns={['category', 'type']} />
        <EstimateTotals items={est.items} className="mt-4" />
        <div className="mt-5 grid grid-cols-[auto_auto_1fr] gap-3">
          <Button variant="neu" size="lg" onClick={() => { setRows(structuredClone(est.items)); setEdit(true); }}><Pencil className="h-4 w-4" /> Edit</Button>
          <Button variant="neu" size="lg" onClick={() => window.print()}><Download className="h-4 w-4" /> Download PDF</Button>
          <Button size="lg" disabled={est.status === 'Approved' || est.status === 'Rejected'} onClick={() => { sendEstimate(est.id); toast.show('Estimate sent to the customer'); }}>
            Send to Customer
          </Button>
        </div>
      </div>

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title={`Edit ${est.id}`}
        size="lg"
        footer={<><Button variant="neu" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={() => { updateEstimate(est.id, rows.filter((r) => r.name.trim())); setEdit(false); toast.show('Estimate updated'); }}>Save changes</Button></>}
      >
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] items-center gap-2">
              <Input aria-label="Item" value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Item" />
              <Select aria-label="Category" value={r.category} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}><option>Parts</option><option>Labour</option></Select>
              <Select aria-label="Type" value={r.type} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}><option>Parts</option><option>Labour</option><option>Parts + Labour</option></Select>
              <Input aria-label="Amount" inputMode="numeric" value={r.amount} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, amount: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0) } : x)))} />
              <button aria-label="Remove line" className="btn btn-neu h-10 w-10 !rounded-full text-bad" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="blue" size="sm" onClick={() => setRows([...rows, { id: `i${Date.now()}`, name: '', category: 'Parts', type: 'Parts', amount: 0 }])}><Plus className="h-4 w-4" /> Add line</Button>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
