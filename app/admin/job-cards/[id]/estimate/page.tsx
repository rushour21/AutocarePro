'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { AdminJobBar, AdminJobTabs } from '@/components/admin/JobTabs';
import { Card, HStepper, Pill } from '@/components/ui';
import { estimateAdmin as e } from '@/lib/data';

export default function AdminEstimate() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <AdminJobBar />
      <AdminJobTabs />
      <div className="mt-6 max-w-[760px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Estimate #{e.id}</h2>
              <Pill tone={sent ? 'green' : 'orange'}>{sent ? 'Sent to Customer' : 'Sent for Approval'}</Pill>
            </div>
            <p className="mt-1 text-xs text-gray-500">Created on {e.createdOn}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-4 text-sm font-medium shadow-card">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => setSent(true)} className="h-10 rounded-lg bg-admin-btn px-5 text-sm font-medium text-white shadow-card">
              Send to Customer
            </button>
          </div>
        </div>

        <Card className="mt-5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f6f3] text-left text-[13px] text-gray-600">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="py-3 font-medium">Type</th>
                <th className="py-3 text-center font-medium">Qty</th>
                <th className="py-3 text-right font-medium">Rate (₹)</th>
                <th className="px-5 py-3 text-right font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-line text-gray-700">
              {e.items.map((r) => (
                <tr key={r.item}>
                  <td className="px-5 py-3">{r.item}</td>
                  <td className="py-3">{r.type}</td>
                  <td className="py-3 text-center">{r.qty}</td>
                  <td className="py-3 text-right">{r.rate}</td>
                  <td className="px-5 py-3 text-right">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-admin-line border-t border-admin-line">
            {[
              ['Subtotal', e.subtotal, false],
              ['GST (18%)', e.gst, false],
              ['Total Amount', e.total, true],
            ].map(([k, v, bold]) => (
              <div key={k as string} className="flex justify-end gap-16 px-5 py-3 text-sm">
                <span className={bold ? 'font-semibold' : 'text-gray-600'}>{k}</span>
                <span className={`w-24 text-right ${bold ? 'text-base font-bold' : 'font-semibold'}`}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <h3 className="mt-7 text-[15px] font-semibold">Approval Status</h3>
        <div className="mt-4">
          <HStepper steps={e.approval} />
        </div>
      </div>
    </>
  );
}
