'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { MoreVertical, Plus } from 'lucide-react';
import { Pill } from '@/components/ui';
import { partsRequests } from '@/lib/data';

export function PartsRequests({ header }: { header: React.ReactNode }) {
  const [tab, setTab] = useState('Requested');
  const [list, setList] = useState(partsRequests);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', qty: '1' });
  const shown = tab === 'Rejected' ? [] : tab === 'Approved' ? list.filter((p) => p.status === 'Approved') : list;

  return (
    <div className="max-w-[860px]">
      <div className="flex items-center justify-between">
        {header}
        <button onClick={() => setAdding(true)} className="flex h-10 items-center gap-2 rounded-lg bg-emp-blue px-5 text-sm font-medium text-white shadow-card">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>
      <nav className="mt-3 flex gap-2 border-b border-emp-line">
        {[
          ['Requested', 2],
          ['Approved', 1],
          ['Rejected', 0],
        ].map(([k, n]) => (
          <button
            key={k}
            onClick={() => setTab(k as string)}
            className={clsx('-mb-px border-b-2 px-6 py-2.5 text-sm', tab === k ? 'border-emp-blue font-medium text-emp-blue' : 'border-transparent text-gray-500')}
          >
            {k} ({n})
          </button>
        ))}
      </nav>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            setList([{ name: draft.name, sub: 'Honda City 2021', qty: `Qty: ${draft.qty}`, on: '15 Dec 2024', status: 'Pending', image: '/assets/part-bumper.png' }, ...list]);
            setDraft({ name: '', qty: '1' });
            setAdding(false);
          }}
          className="mt-4 flex items-center gap-3 rounded-xl border border-[#b9cdf5] bg-[#f6f9ff] p-3"
        >
          <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Part name" className="h-10 flex-1 rounded-lg border border-[#e3e5e8] px-3 text-sm outline-none" />
          <input value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} className="h-10 w-20 rounded-lg border border-[#e3e5e8] px-3 text-sm outline-none" aria-label="Quantity" />
          <button className="h-10 rounded-lg bg-emp-blue px-4 text-sm font-medium text-white">Request</button>
          <button type="button" onClick={() => setAdding(false)} className="h-10 px-2 text-sm text-gray-500">
            Cancel
          </button>
        </form>
      )}

      <ul className="mt-4 space-y-3">
        {shown.map((p) => (
          <li key={p.name} className="flex items-center gap-6 rounded-xl border border-emp-line bg-white px-5 py-3.5 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="h-[58px] w-[78px] rounded-lg object-contain" />
            <div className="w-56">
              <p className="text-[15px] font-semibold">{p.name}</p>
              <p className="text-sm text-gray-500">{p.sub}</p>
              <p className="text-sm text-gray-500">{p.qty}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Requested on</p>
              <p className="text-[15px] text-gray-600">{p.on}</p>
            </div>
            <Pill tone={p.status === 'Approved' ? 'green' : 'orange'} className="rounded-full px-4 py-1 text-sm">
              {p.status}
            </Pill>
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </li>
        ))}
        {shown.length === 0 && <li className="py-10 text-center text-sm text-gray-400">No rejected requests.</li>}
      </ul>
    </div>
  );
}
