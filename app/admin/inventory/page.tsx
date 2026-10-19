'use client';

import { useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { PartIcon } from '@/components/features/PartIcon';
import { Button, Card, DataTable, EmptyState, Field, FilterTabs, Input, Modal, SearchInput, Select, StatusBadge, useToast, type Column } from '@/components/ui';
import { addPart, decidePartRequest } from '@/lib/actions';
import { inr, isLow, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Part } from '@/lib/types';

export default function InventoryPage() {
  const db = useDb();
  const toast = useToast();
  const [tab, setTab] = useState<'inventory' | 'orders' | 'suppliers'>('inventory');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [add, setAdd] = useState(false);
  const [review, setReview] = useState(false);
  const [f, setF] = useState({ name: '', category: 'Brakes', stock: '', minStock: '10' });
  const [err, setErr] = useState<Record<string, string>>({});

  const cats = [...new Set(db.inventory.map((p) => p.category))];
  const rows = useMemo(() => db.inventory.filter((p) => (cat === 'all' || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))), [db.inventory, cat, q]);
  const pending = db.partRequests.filter((r) => r.status === 'Pending');

  const cols: Column<Part>[] = [
    { key: 'n', header: 'Name', cell: (p) => <span className="flex items-center gap-3"><PartIcon part={p} /> <span className="font-medium">{p.name}</span></span> },
    { key: 'c', header: 'Category', cell: (p) => <span className="text-ink-500">{p.category}</span> },
    { key: 's', header: 'Stock', cell: (p) => <span className="font-semibold">{p.stock}</span> },
    { key: 'm', header: 'Min Stock', cell: (p) => p.minStock },
    { key: 'st', header: 'Status', cell: (p) => <StatusBadge tone={isLow(p) ? 'amber' : 'green'}>{isLow(p) ? 'Low Stock' : 'In Stock'}</StatusBadge> },
  ];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter a part name';
    if (!/^\d+$/.test(f.stock)) e.stock = 'Whole number';
    if (!/^\d+$/.test(f.minStock)) e.minStock = 'Whole number';
    setErr(e);
    if (Object.keys(e).length) return;
    addPart({ name: f.name.trim(), category: f.category, stock: Number(f.stock), minStock: Number(f.minStock) });
    toast.show(`${f.name.trim()} added to inventory`);
    setF({ name: '', category: 'Brakes', stock: '', minStock: '10' });
    setAdd(false);
  };

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          variant="soft"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'inventory', label: 'Inventory' },
            { value: 'orders', label: 'Purchase Orders' },
            { value: 'suppliers', label: 'Suppliers' },
          ]}
        />
        {tab === 'inventory' && (
          <Button onClick={() => setAdd(true)}>
            <Plus className="h-4 w-4" /> Add Part
          </Button>
        )}
      </div>

      {tab === 'inventory' && (
        <>
          {pending.length > 0 && (
            <Card className="mb-5 flex flex-wrap items-center gap-3 !bg-gradient-to-r from-coral-50 to-ivory-50 px-5 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-100 text-coral-500"><Package className="h-4 w-4" /></span>
              <p className="flex-1 text-sm"><b>{pending.length}</b> part {pending.length === 1 ? 'request is' : 'requests are'} waiting for approval.</p>
              <Button size="sm" onClick={() => setReview(true)}>Review</Button>
            </Card>
          )}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="w-[200px]">
              <option value="all">All Categories</option>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <SearchInput value={q} onChange={setQ} placeholder="Search parts..." className="min-w-[220px] flex-1 !h-11" />
          </div>
          <DataTable columns={cols} rows={rows} rowKey={(p) => p.id} pageSize={10} empty={<EmptyState title="No parts found" text="Try a different category or search." />} />
        </>
      )}

      {tab === 'orders' && (
        <ul className="space-y-3">
          {db.purchaseOrders.map((o) => (
            <li key={o.id} className="neu-row flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="w-24 font-semibold">{o.id}</span>
              <span className="min-w-[160px] flex-1"><span className="block font-medium">{o.supplier}</span><span className="block text-xs text-ink-400">{o.items}</span></span>
              <span className="text-sm text-ink-500">{o.date}</span>
              <span className="w-24 text-right font-semibold">{inr(o.amount)}</span>
              <StatusBadge tone={o.status === 'Delivered' ? 'green' : o.status === 'Ordered' ? 'blue' : 'gray'}>{o.status}</StatusBadge>
            </li>
          ))}
        </ul>
      )}

      {tab === 'suppliers' && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {db.suppliers.map((s) => (
            <li key={s.id} className="neu-row px-5 py-4">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-ink-500">{s.contact} · {s.phone}</p>
              <StatusBadge tone="gray" size="sm" className="mt-2">{s.category}</StatusBadge>
            </li>
          ))}
        </ul>
      )}

      <Modal open={add} onClose={() => setAdd(false)} title="Add part" size="sm" footer={<><Button variant="neu" onClick={() => setAdd(false)}>Cancel</Button><Button onClick={submit}>Add part</Button></>}>
        <div className="space-y-4">
          <Field label="Part name" error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Category"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['Brakes', 'Fluids', 'Filters', 'Electrical', 'Suspension', 'Tyres'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="In stock" error={err.stock}><Input inputMode="numeric" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></Field>
            <Field label="Min stock" error={err.minStock}><Input inputMode="numeric" value={f.minStock} onChange={(e) => setF({ ...f, minStock: e.target.value })} /></Field>
          </div>
        </div>
      </Modal>

      <Modal open={review} onClose={() => setReview(false)} title="Part requests" size="lg">
        {pending.length === 0 ? <EmptyState title="All requests are handled" /> : (
          <ul className="space-y-2.5">
            {pending.map((r) => {
              const j = db.jobs.find((x) => x.id === r.jobId);
              return (
                <li key={r.id} className="neu-row flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-[180px] flex-1"><span className="block text-sm font-semibold">{r.partName} × {r.qty}</span><span className="block text-xs text-ink-400">#{r.jobId} · {vehicleName(j && vehicleOf(db, j.vehicleId))} · {userOf(db, r.requestedBy)?.name}</span></span>
                  <Button size="sm" variant="soft" onClick={() => { decidePartRequest(r.id, 'Approved'); toast.show('Approved and stock updated'); }}>Approve</Button>
                  <Button size="sm" variant="neu" onClick={() => decidePartRequest(r.id, 'Rejected')}>Reject</Button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
      {toast.node}
    </>
  );
}
