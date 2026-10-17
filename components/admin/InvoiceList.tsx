'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { Pill } from '@/components/ui';
import { invoices } from '@/lib/data';

export function InvoiceList({ only }: { only?: string }) {
  const [tab, setTab] = useState<'All' | 'Unpaid' | 'Paid'>('All');
  const [q, setQ] = useState('');
  const rows = useMemo(
    () =>
      invoices
        .filter((i) => !only || i.id === only)
        .filter((i) => tab === 'All' || i.status === tab)
        .filter((i) => !q || `${i.id} ${i.customer} ${i.vehicle}`.toLowerCase().includes(q.toLowerCase())),
    [tab, q, only],
  );
  const tabs = [
    { k: 'All' as const, n: 12 },
    { k: 'Unpaid' as const, n: 3 },
    { k: 'Paid' as const, n: 9 },
  ];

  return (
    <div className="max-w-[720px]">
      <div className="flex items-center gap-4">
        <label className="flex h-11 flex-1 items-center gap-3 rounded-lg bg-[#efeeea] px-4 text-sm text-gray-500">
          <Search className="h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by invoice, customer, vehicle..." className="w-full bg-transparent outline-none placeholder:text-gray-400" />
        </label>
        <button className="flex h-11 items-center gap-2 rounded-lg bg-admin-btn px-5 text-sm font-medium text-white shadow-card">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>
      <div className="mt-4 flex gap-3">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx('h-10 rounded-lg px-4 text-sm font-medium', tab === t.k ? 'bg-admin-btn text-white' : 'bg-[#efeeea] text-gray-600')}
          >
            {t.k} ({t.n})
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((i) => (
          <li key={i.id} className="flex items-center gap-6 rounded-xl border border-admin-line bg-admin-card px-5 py-4 shadow-card">
            <span className="w-24 text-sm font-semibold">{i.id}</span>
            <div className="w-40">
              <p className="text-sm text-gray-800">{i.customer}</p>
              <p className="text-sm text-gray-500">{i.vehicle}</p>
            </div>
            <div className="w-32">
              <p className="text-sm font-medium">{i.amount}</p>
              <p className="text-xs text-gray-500">{i.date}</p>
            </div>
            <Pill tone={i.status === 'Paid' ? 'green' : 'red'}>{i.status}</Pill>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-500" />
          </li>
        ))}
      </ul>
    </div>
  );
}
