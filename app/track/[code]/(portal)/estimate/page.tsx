'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { CustomerHeader } from '@/components/customer/Sidebar';
import { estimateCustomer as e } from '@/lib/data';

export default function CustomerEstimate() {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  return (
    <>
      <CustomerHeader />
      <div className="mt-6 max-w-[760px]">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-semibold">Estimate #{e.id}</h2>
          <span
            className={
              decision === 'approved'
                ? 'rounded-md bg-ok-bg px-2.5 py-1 text-sm text-ok-fg'
                : decision === 'rejected'
                  ? 'rounded-md bg-bad-bg px-2.5 py-1 text-sm text-bad-fg'
                  : 'rounded-md bg-warn-bg px-2.5 py-1 text-sm text-warn-fg'
            }
          >
            {decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Sent for Approval'}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Sent on {e.sentOn}</p>

        <div className="mt-5 overflow-hidden rounded-xl border border-cust-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f4ef] text-left text-gray-600">
                <th className="border-r border-cust-line px-4 py-3 font-medium">Item</th>
                <th className="border-r border-cust-line px-4 py-3 font-medium">Type</th>
                <th className="border-r border-cust-line px-4 py-3 text-center font-medium">Qty</th>
                <th className="border-r border-cust-line px-4 py-3 text-right font-medium">Rate (₹)</th>
                <th className="px-4 py-3 text-right font-medium">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cust-line text-gray-700">
              {e.items.map((r) => (
                <tr key={r.item}>
                  <td className="border-r border-cust-line px-4 py-3">{r.item}</td>
                  <td className="border-r border-cust-line px-4 py-3">{r.type}</td>
                  <td className="border-r border-cust-line px-4 py-3 text-right">{r.qty}</td>
                  <td className="border-r border-cust-line px-4 py-3 text-right">{r.rate}</td>
                  <td className="px-4 py-3 text-right">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-cust-line text-sm">
            {[
              ['Subtotal', e.subtotal],
              ['GST (18%)', e.gst],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-end gap-14 px-4 py-3">
                <span className="text-gray-600">{k}</span>
                <span className="w-24 text-right font-semibold">{v}</span>
              </div>
            ))}
            <div className="flex justify-end gap-14 border-t border-cust-line px-4 py-3.5">
              <span className="font-semibold">Total Amount</span>
              <span className="w-24 text-right text-base font-bold">{e.total}</span>
            </div>
          </div>
        </div>

        {decision ? (
          <div className="mt-6 rounded-xl border border-cust-line bg-white p-5 text-sm text-gray-600">
            {decision === 'approved'
              ? 'Thank you! Your approval has been sent to the workshop and work will continue as planned.'
              : 'You rejected this estimate. Your service advisor will call you to discuss the next steps.'}
            <button onClick={() => setDecision(null)} className="ml-3 font-medium text-cust-link">
              Undo
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button onClick={() => setDecision('rejected')} className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[#e8a3a3] bg-white text-[15px] font-medium text-[#d6403a]">
              <X className="h-5 w-5" /> Reject Estimate
            </button>
            <button onClick={() => setDecision('approved')} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-cust-teal text-[15px] font-medium text-white">
              <Check className="h-5 w-5" /> Approve Estimate
            </button>
          </div>
        )}
      </div>
    </>
  );
}
