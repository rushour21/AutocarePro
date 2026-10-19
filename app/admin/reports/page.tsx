'use client';

import { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { BarChart, Donut, LineChart } from '@/components/features/Charts';
import { Card, Select } from '@/components/ui';
import { inr } from '@/lib/format';

// Aggregates are seeded demo figures (a real build would compute them from invoices and jobs).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const REVENUE = [150000, 180000, 220000, 210000, 240000, 245000];
const JOBS = [3, 3, 4, 3, 4, 4, 3, 5, 4, 5, 5, 5]; // fortnightly, sums to 48
const KPI: Record<number, { jobs: number; customers: number }> = { 3: { jobs: 27, customers: 11 }, 6: { jobs: 48, customers: 18 } };
const GROWTH = [2, 4, 7, 9, 13, 18];
const SERVICES = [
  { label: 'General Service', value: 35, color: '#f26a2e' },
  { label: 'Modification', value: 20, color: '#f6c63c' },
  { label: 'Detailing & PPF', value: 15, color: '#8e9cf2' },
  { label: 'Repairs', value: 10, color: '#4aa8f0' },
  { label: 'Inspection', value: 7, color: '#8b6bf0' },
  { label: 'Other', value: 5, color: '#2eb872' },
];

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Card className="px-6 py-5">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="mt-2 flex items-baseline gap-4 text-[30px] font-bold leading-none">
        {value}
        <span className="flex items-center gap-0.5 text-sm font-semibold text-ok"><ArrowUp className="h-3.5 w-3.5" />{delta}</span>
      </p>
    </Card>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState('6');
  const n = Number(range);
  const rev = REVENUE.slice(-n);
  const months = MONTHS.slice(-n);
  const jobs = JOBS.slice(-n * 2);
  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[26px] font-bold">Reports &amp; Analytics</h1>
        <Select aria-label="Period" value={range} onChange={(e) => setRange(e.target.value)} className="w-[180px]">
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Revenue" value={inr(rev.reduce((a, b) => a + b, 0))} delta="12%" />
        <Kpi label="Jobs Completed" value={String(KPI[n].jobs)} delta="8%" />
        <Kpi label="New Customers" value={String(KPI[n].customers)} delta="20%" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Revenue Trend</h2>
            <BarChart data={rev.map((v, i) => ({ label: months[i], value: v }))} format={inr} highlight={Math.min(3, rev.length - 1)} />
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Monthly Jobs</h2>
            <BarChart data={jobs.map((v, i) => ({ label: i % 2 === 0 ? months[i / 2] : '', value: v }))} format={(v) => `${v} jobs`} height={150} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Service Type Distribution</h2>
            <div className="flex flex-wrap items-center gap-6">
              <Donut slices={SERVICES} center="48" sub="Jobs" />
              <ul className="min-w-[180px] flex-1 space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.label} className="flex items-center gap-3 text-sm"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} /><span className="flex-1 text-ink-600">{s.label}</span><span className="font-medium text-ink-700">{s.value}%</span></li>
                ))}
              </ul>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-2 text-base font-bold">Customer Growth</h2>
            <LineChart points={GROWTH.slice(-n).map((v, i) => ({ label: months[i], value: v }))} format={(v) => `${v} customers`} height={160} />
          </Card>
        </div>
      </div>
    </>
  );
}
