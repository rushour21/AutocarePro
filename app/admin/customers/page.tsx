'use client';

import { useMemo, useState } from 'react';
import { Plus, UserRound } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, Button, DataTable, Field, IconButton, Input, Modal, SearchInput, useToast, type Column } from '@/components/ui';
import { addCustomer } from '@/lib/actions';
import { inr } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const db = useDb();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '' });
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.customers.filter((c) => !s || c.name.toLowerCase().includes(s) || c.phone.includes(s));
  }, [db.customers, q]);

  const cols: Column<Customer>[] = [
    { key: 'n', header: 'Name', cell: (c) => <span className="flex items-center gap-3"><Avatar src={c.avatar} name={c.name} size={34} /><span className="font-semibold">{c.name}</span></span> },
    { key: 'p', header: 'Phone', cell: (c) => c.phone },
    { key: 'v', header: 'Vehicles', cell: (c) => <span className="font-semibold">{db.vehicles.filter((v) => v.customerId === c.id).length}</span>, className: 'text-center', headClassName: 'text-center' },
    { key: 's', header: 'Total Spent', cell: (c) => <span className="font-semibold">{inr(c.totalSpent)}</span> },
    { key: 'l', header: 'Last Service', cell: (c) => c.lastService },
  ];

  const submit = () => {
    const e: typeof err = {};
    if (!f.name.trim()) e.name = 'Enter the customer name';
    if (!/^[+\d][\d\s-]{7,}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    setErr(e);
    if (Object.keys(e).length) return;
    addCustomer({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() });
    toast.show(`${f.name.trim()} added`);
    setF({ name: '', phone: '', email: '' });
    setOpen(false);
  };

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search customers..." className="min-w-[240px] flex-1 sm:max-w-md" />
        <IconButton label="Customer filters" className="!h-12 !w-12">
          <UserRound className="h-[18px] w-[18px]" />
        </IconButton>
        <Button className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>
      <DataTable columns={cols} rows={rows} rowKey={(c) => c.id} pageSize={8} empty={<p className="py-12 text-center text-sm text-ink-400">No customers match “{q}”.</p>} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add customer" size="sm" footer={<><Button variant="neu" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Add customer</Button></>}>
        <div className="space-y-4">
          <Field label="Full name" error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Phone" error={err.phone}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
          <Field label="Email (optional)"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}
