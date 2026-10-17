'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Pill, priorityTone } from '@/components/ui';
import { jobCardTabs, jobRows } from '@/lib/data';

export default function JobCardsPage() {
  const [tab, setTab] = useState('All');
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return jobRows.filter(
      (r) =>
        (tab === 'All' || r.group === tab || (tab === 'Ready' && r.status === 'Ready')) &&
        (!s || [r.id, r.vehicle, r.customer, r.service].some((v) => v.toLowerCase().includes(s))),
    );
  }, [tab, q]);

  return (
    <div className="px-8 py-7">
      <header className="flex flex-wrap items-center gap-6">
        <div className="mr-auto">
          <h1 className="text-[26px] font-bold tracking-tight">Job Cards</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage all vehicle service jobs</p>
        </div>
        <label className="flex h-11 w-[380px] items-center gap-3 rounded-lg bg-[#efeeea] px-4 text-sm text-gray-500">
          <Search className="h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by job no, customer, vehicle..."
            className="w-full bg-transparent outline-none placeholder:text-gray-400"
          />
        </label>
        <Link
          href="/admin/job-cards/new"
          className="flex h-11 items-center gap-2 rounded-lg bg-admin-btn px-6 text-sm font-medium text-white shadow-card"
        >
          <Plus className="h-4 w-4" /> New Job Card
        </Link>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {jobCardTabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={clsx(
              'h-10 rounded-lg px-4 text-sm font-medium transition',
              tab === t.label ? 'bg-admin-btn text-white' : 'bg-[#efeeea] text-gray-600 hover:bg-[#e7e6e1]',
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
        <button className="ml-auto flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-5 text-sm font-medium text-gray-700 shadow-card">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-admin-line bg-admin-card shadow-card">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-admin-line bg-[#f7f6f3] text-[13px] text-gray-500">
              <th className="w-10 py-3 pl-5 font-medium">#</th>
              <th className="w-20 py-3 font-medium">#</th>
              <th className="py-3 font-medium">Vehicle</th>
              <th className="py-3 font-medium">Customer</th>
              <th className="py-3 font-medium">Service Type</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Priority</th>
              <th className="py-3 font-medium">Assigned To</th>
              <th className="py-3 pr-5 font-medium">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-line">
            {rows.map((r) => (
              <tr key={r.id} className="text-gray-700 hover:bg-[#faf9f6]">
                <td className="py-3 pl-5">
                  <input
                    type="checkbox"
                    checked={!!checked[r.id]}
                    onChange={(e) => setChecked({ ...checked, [r.id]: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 accent-admin-btn"
                    aria-label={`Select ${r.id}`}
                  />
                </td>
                <td className="py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="h-8 w-14 object-contain" />
                </td>
                <td className="py-3">
                  <Link href={`/admin/job-cards/${r.id}`} className="hover:underline">
                    {r.vehicle}
                  </Link>
                </td>
                <td className="py-3">{r.customer}</td>
                <td className="py-3">{r.service}</td>
                <td className="py-3">
                  <Pill tone={r.statusTone}>{r.status}</Pill>
                </td>
                <td className="py-3">{r.priority === '-' ? '-' : <Pill tone={priorityTone(r.priority)}>{r.priority}</Pill>}</td>
                <td className="py-3">{r.assigned}</td>
                <td className="py-3 pr-5">{r.eta}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  No job cards match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
