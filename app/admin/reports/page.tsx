'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/AppShell';
import { BarChart, Donut, LineChart } from '@/components/features/Charts';
import { Card, Select } from '@/components/ui';
import { inr } from '@/lib/format';

// Aggregates are seeded demo figures (a real build would compute them from invoices and jobs).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const REVENUE = [150000, 180000, 220000, 210000, 240000, 245000];
const JOBS = [3, 3, 4, 3, 4, 4, 3, 5, 4, 5, 5, 5]; // fortnightly, sums to 48
const KPI: Record<number, { jobs: number; customers: number }> = { 3: { jobs: 27, customers: 11 }, 6: { jobs: 48, customers: 18 } };
const NEW_CUSTOMERS = [2, 2, 3, 2, 4, 5];
const STEPS_PER_MONTH = 10;
const SERVICES = [
  { label: 'General Service', value: 35, color: '#d84a27' },
  { label: 'Modification', value: 20, color: '#78a2c6' },
  { label: 'Detailing & PPF', value: 15, color: '#c9a24a' },
  { label: 'Repairs', value: 10, color: '#248a6c' },
  { label: 'Inspection', value: 7, color: '#a9c4dc' },
  { label: 'Other', value: 5, color: '#b4b7bd' },
];

const signed = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}%`;

// Expands monthly totals into a seeded daily-style walk, as % against the period average.
function trend(monthly: number[], seed: number, swing: number) {
  const avg = monthly.reduce((a, b) => a + b, 0) / monthly.length;
  const pct = monthly.map((v) => (v / avg - 1) * 100);
  let walk = 0;
  let state = seed;
  return Array.from({ length: pct.length * STEPS_PER_MONTH }, (_, i) => {
    const t = i / STEPS_PER_MONTH;
    const from = Math.min(Math.floor(t), pct.length - 1);
    const to = Math.min(from + 1, pct.length - 1);
    state = (state * 16807) % 2147483647;
    walk = walk * 0.78 + ((state / 2147483647) * 2 - 1) * swing;
    return pct[from] + (pct[to] - pct[from]) * (t - from) + walk;
  });
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Card className="px-6 py-5">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="mt-2 flex items-baseline gap-4 text-[30px] font-bold leading-none">
        {value}
        <span className="text-sm font-semibold text-ok">+{delta}</span>
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
  const jobsByMonth = months.map((_, i) => jobs[i * 2] + jobs[i * 2 + 1]);
  const trends = [
    { label: 'Revenue', color: '#d84a27', values: trend(rev, 11, 3.2) },
    { label: 'Jobs', color: '#78a2c6', values: trend(jobsByMonth, 23, 3.2) },
    { label: 'New Customers', color: '#c2c5cb', values: trend(NEW_CUSTOMERS.slice(-n), 37, 4.4) },
  ];
  const dayLabels = trends[0].values.map((_, i) => `${months[Math.floor(i / STEPS_PER_MONTH)]} ${(i % STEPS_PER_MONTH) * 3 + 1}`);
  const monthTicks = months.map((label, i) => ({ index: i * STEPS_PER_MONTH, label }));
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
            <BarChart data={rev.map((v, i) => ({ label: months[i], value: v }))} format={inr} highlight={rev.length - 3} />
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Monthly Jobs</h2>
            <BarChart data={jobs.map((v, i) => ({ label: i % 2 === 0 ? months[i / 2] : '', value: v }))} format={(v) => `${v} jobs`} height={190} highlight={jobs.length - 1} />
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold">Service Type Distribution</h2>
            <div className="flex flex-wrap items-center gap-6">
              <Donut slices={SERVICES} center="48" sub="Jobs" />
              <ul className="min-w-[180px] flex-1 space-y-2.5">
                {SERVICES.map((s) => (
                  <li key={s.label} className="flex items-center gap-3 text-sm"><span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: s.color }} /><span className="flex-1 text-ink-600">{s.label}</span><span className="font-medium text-ink-700">{s.value}%</span></li>
                ))}
              </ul>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-bold">Trends</h2>
            <p className="mb-3 text-xs text-ink-500">Against the period average</p>
            <LineChart series={trends} labels={dayLabels} ticks={monthTicks} format={signed} ariaLabel="Revenue, jobs and new customers against the period average" />
          </Card>
        </div>
      </div>
    </>
  );
}
