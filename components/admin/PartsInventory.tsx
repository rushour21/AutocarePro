'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { Card, Pill } from '@/components/ui';
import { partsRequestsAdmin, partsUsed } from '@/lib/data';

export function PartsInventory() {
  const [tab, setTab] = useState('Requested');
  const [requests, setRequests] = useState(partsRequestsAdmin);
  const counts = { Requested: 2, Approved: requests.filter((r) => r.status === 'Approved').length, Rejected: 0 };

  return (
    <div className="max-w-[760px]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Parts Used</h2>
        <button className="flex h-10 items-center gap-2 rounded-lg bg-admin-btn px-5 text-sm font-medium text-white shadow-card">
          <Plus className="h-4 w-4" /> Add Part
        </button>
      </div>
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f6f3] text-left text-[13px] text-gray-600">
              <th className="px-5 py-3 font-medium">Part Name</th>
              <th className="py-3 font-medium">Part No.</th>
              <th className="py-3 text-center font-medium">Quantity</th>
              <th className="py-3 text-center font-medium">Unit Price (₹)</th>
              <th className="px-5 py-3 text-center font-medium">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-line text-gray-700">
            {partsUsed.map((p) => (
              <tr key={p.no}>
                <td className="px-5 py-3">{p.name}</td>
                <td className="py-3">{p.no}</td>
                <td className="py-3 text-center">{p.qty}</td>
                <td className="py-3 text-center">{p.unit}</td>
                <td className="px-5 py-3 text-center">{p.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-bold">Parts Request</h2>
        <button className="flex h-10 items-center gap-2 rounded-lg bg-admin-btn px-5 text-sm font-medium text-white shadow-card">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={clsx('h-9 rounded-lg px-4 text-sm', tab === k ? 'border border-admin-line bg-white font-semibold shadow-card' : 'bg-[#efeeea] text-gray-600')}
          >
            {k} ({counts[k]})
          </button>
        ))}
      </div>
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f6f3] text-left text-[13px] text-gray-600">
              <th className="px-5 py-3 font-medium">Part Name</th>
              <th className="py-3 font-medium">Reason</th>
              <th className="py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Requested On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-line text-gray-700">
            {(tab === 'Rejected' ? [] : tab === 'Approved' ? requests.filter((r) => r.status === 'Approved') : requests).map((r) => (
              <tr key={r.name}>
                <td className="px-5 py-3">{r.name}</td>
                <td className="py-3">{r.reason}</td>
                <td className="py-3">
                  {r.status === 'Pending' ? (
                    <button
                      title="Approve request"
                      onClick={() => setRequests(requests.map((x) => (x.name === r.name ? { ...x, status: 'Approved', tone: 'green' } : x)))}
                    >
                      <Pill tone={r.tone}>{r.status}</Pill>
                    </button>
                  ) : (
                    <Pill tone={r.tone}>{r.status}</Pill>
                  )}
                </td>
                <td className="px-5 py-3">{r.on}</td>
              </tr>
            ))}
            {tab === 'Rejected' && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">No rejected requests.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
