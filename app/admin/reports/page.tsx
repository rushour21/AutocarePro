'use client';

import { useState } from 'react';
import { CircleDollarSign, ClipboardCheck, Gauge, UserPlus } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Donut, LineChart, ValueBars } from '@/components/features/Charts';
import { Card, FilterTabs } from '@/components/ui';
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

function Kpi({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta?: string; icon: React.ElementType; tone: string }) {
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-500">{label}</p>
        <p className="truncate text-[22px] font-bold leading-tight tracking-tight">{value}</p>
      </div>
      {delta && <span className="shrink-0 self-start rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok-strong">+{delta}</span>}
    </Card>
  );
}

function Panel({ title, sub, className, children }: { title: string; sub?: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={`flex min-w-0 flex-col p-5 ${className ?? ''}`}>
      <h2 className="text-base font-bold">{title}</h2>
      {sub && <p className="text-xs text-ink-500">{sub}</p>}
      <div className="mt-4 min-w-0 flex-1">{children}</div>
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
  const revenue = rev.reduce((a, b) => a + b, 0);
  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight">Reports &amp; Analytics</h1>
          <p className="text-sm text-ink-500">How the workshop is performing</p>
        </div>
        <FilterTabs value={range} onChange={setRange} tabs={[{ value: '3', label: 'Last 3 Months' }, { value: '6', label: 'Last 6 Months' }]} />
      </div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
        <Kpi label="Revenue" value={inr(revenue)} delta="12%" icon={CircleDollarSign} tone="bg-coral-100 text-coral-500" />
        <Kpi label="Jobs Completed" value={String(KPI[n].jobs)} delta="8%" icon={ClipboardCheck} tone="bg-info-soft text-info" />
        <Kpi label="New Customers" value={String(KPI[n].customers)} delta="20%" icon={UserPlus} tone="bg-warn-soft text-warn" />
        <Kpi label="Average per Job" value={inr(revenue / KPI[n].jobs)} icon={Gauge} tone="bg-ok-soft text-ok" />
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title="Trends" sub="Against the period average">
          <LineChart series={trends} labels={dayLabels} ticks={monthTicks} height={300} format={signed} ariaLabel="Revenue, jobs and new customers against the period average" />
        </Panel>
        <Panel title="Service Types" sub="Share of jobs">
          <div className="flex h-full flex-col items-center justify-center gap-5">
            <Donut slices={SERVICES} center={String(KPI[n].jobs)} sub="Jobs" />
            <ul className="grid w-full grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {SERVICES.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} /><span className="min-w-0 flex-1 truncate text-ink-600">{s.label}</span><span className="font-medium text-ink-700">{s.value}%</span></li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue by Month" sub={`Total ${inr(revenue)} · Best month ${months[rev.indexOf(Math.max(...rev))]}`}>
          <ValueBars data={rev.map((v, i) => ({ label: months[i], value: v }))} format={inr} short={(v) => `₹${(v / 100000).toFixed(2)}L`} />
        </Panel>
        <Panel title="Jobs Completed by Month" sub={`Total ${KPI[n].jobs} jobs · Busiest month ${months[jobsByMonth.indexOf(Math.max(...jobsByMonth))]}`}>
          <ValueBars data={jobsByMonth.map((v, i) => ({ label: months[i], value: v }))} format={(v) => `${v} jobs`} short={String} />
        </Panel>
      </div>
    </>
  );
}
