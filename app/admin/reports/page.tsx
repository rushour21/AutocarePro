'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui';
import { reportStats, revenueTrend, serviceBreakdown } from '@/lib/data';

function Donut() {
  const r = 70;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 200 200" className="h-48 w-48 -rotate-90">
      {serviceBreakdown.map((s) => {
        const len = (s.pct / 100) * c;
        const el = (
          <circle key={s.label} cx="100" cy="100" r={r} fill="none" stroke={s.color} strokeWidth="36" strokeDasharray={`${len - 2} ${c - len + 2}`} strokeDashoffset={-acc} />
        );
        acc += len;
        return el;
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const [hover, setHover] = useState(2);
  const max = 1500;
  return (
    <div className="px-8 py-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-tight">Reports</h1>
        <button className="flex h-10 items-center gap-3 rounded-lg border border-admin-line bg-white px-4 text-sm text-gray-600 shadow-card">
          1 Dec 2024 – 31 Dec 2024 <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {reportStats.map((s) => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="mt-1 flex items-baseline gap-5 text-[28px] font-bold">
              {s.value}
              <span className="text-sm font-medium text-[#1f9d63]">{s.change}</span>
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-base font-semibold">Revenue Trend</h3>
          <div className="relative mt-6 h-64 pl-10">
            <div className="absolute inset-y-0 left-0 flex flex-col justify-between pb-6 text-[11px] leading-none text-gray-400">
              {[1500, 1000, 500, 0].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div className="flex h-[calc(100%-24px)] items-end gap-4 border-b border-admin-line">
              {revenueTrend.map((b, i) => (
                <div key={b.month} className="relative flex h-full flex-1 flex-col items-center justify-end" onMouseEnter={() => setHover(i)}>
                  {hover === i && (
                    <span
                      className="absolute z-10 -translate-y-2 whitespace-nowrap rounded-md bg-[#1b2629] px-3 py-1.5 text-xs text-white"
                      style={{ bottom: `${(b.value / max) * 100}%` }}
                    >
                      {b.label ?? `₹ ${(b.value * 400).toLocaleString('en-IN')}`}
                    </span>
                  )}
                  <div className="w-full max-w-[44px] rounded-t-sm bg-[#7690a8] transition hover:bg-[#5f7a93]" style={{ height: `${(b.value / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              {revenueTrend.map((b) => (
                <span key={b.month} className="mt-2 flex-1 text-center text-xs text-gray-500">
                  {b.month}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold">Service Type Breakdown</h3>
          <div className="mt-4 flex items-center gap-8">
            <div className="relative">
              <Donut />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">128</span>
                <span className="text-xs text-gray-500">Jobs</span>
              </div>
            </div>
            <ul className="flex-1 space-y-3">
              {serviceBreakdown.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-gray-700">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
