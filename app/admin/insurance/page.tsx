'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/AppShell';
import { ClaimStatusBadge } from '@/components/features/insurance/ClaimParts';
import { Receivables } from '@/components/features/insurance/Receivables';
import { Card, DataTable, FilterTabs, PageHeader, SearchInput, Select, StatusBadge, type Column } from '@/components/ui';
import { customerOf, inr, vehicleName, vehicleOf } from '@/lib/format';
import { CLAIM_FLOW, daysOpen, isOverdue, splitOf } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import type { Claim, ClaimStatus } from '@/lib/types';

function Inner() {
  const db = useDb();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<'claims' | 'receivables'>(params.get('tab') === 'receivables' ? 'receivables' : 'claims');
  const [status, setStatus] = useState<'all' | ClaimStatus>('all');
  const [insurer, setInsurer] = useState('all');
  const [q, setQ] = useState('');

  const jobOf = (c: Claim) => db.jobs.find((j) => j.id === c.jobId);
  const carOf = (c: Claim) => { const j = jobOf(c); return j && vehicleOf(db, j.vehicleId); };
  const insurers = [...new Set(db.claims.map((c) => c.insurer))];
  const rows = useMemo(
    () =>
      db.claims
        .filter((c) => (status === 'all' || c.status === status) && (insurer === 'all' || c.insurer === insurer))
        .filter((c) => {
          if (!q.trim()) return true;
          const j = db.jobs.find((x) => x.id === c.jobId);
          const v = j && vehicleOf(db, j.vehicleId);
          const t = `${c.id} ${c.claimNo} ${j?.id} ${v?.reg} ${v?.model} ${j && customerOf(db, j.customerId)?.name}`.toLowerCase();
          return t.includes(q.trim().toLowerCase());
        })
        .sort((a, b) => daysOpen(b) - daysOpen(a)),
    [db, status, insurer, q],
  );

  const days = (c: Claim) => (
    <span className="inline-flex items-center gap-2">
      {daysOpen(c)}d
      {isOverdue(c) && <StatusBadge tone="red" size="sm">Overdue</StatusBadge>}
    </span>
  );
  const cols: Column<Claim>[] = [
    { key: 'job', header: 'Job no.', cell: (c) => <span className="font-semibold">#{c.jobId}</span> },
    { key: 'car', header: 'Car', cell: (c) => { const v = carOf(c); return <span>{vehicleName(v)} <span className="text-ink-400">· {v?.reg}</span></span>; } },
    { key: 'cust', header: 'Customer', cell: (c) => { const j = jobOf(c); return j && customerOf(db, j.customerId)?.name; } },
    { key: 'ins', header: 'Insurer', cell: (c) => c.insurer },
    { key: 'no', header: 'Claim no.', cell: (c) => <span className="font-medium">{c.claimNo || '-'}</span> },
    { key: 'type', header: 'Type', cell: (c) => <StatusBadge tone={c.type === 'Cashless' ? 'blue' : 'gray'} size="sm">{c.type}</StatusBadge> },
    { key: 'st', header: 'Status', cell: (c) => <ClaimStatusBadge status={c.status} /> },
    { key: 'days', header: 'Days open', cell: days },
  ];

  return (
    <>
      <TopBar showUser />
      <PageHeader title="Insurance Claims" subtitle="Cashless and reimbursement claims, documents, surveyor status and what each insurer owes you" />
      <FilterTabs variant="underline" className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'claims', label: 'Claims', count: db.claims.length }, { value: 'receivables', label: 'Receivables' }]} />

      {tab === 'receivables' ? (
        <Receivables />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_240px]">
            <SearchInput value={q} onChange={setQ} placeholder="Search claim, car, customer…" />
            <Select value={insurer} onChange={(e) => setInsurer(e.target.value)} aria-label="Filter by insurer">
              <option value="all">All insurers</option>
              {insurers.map((i) => <option key={i}>{i}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | ClaimStatus)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {CLAIM_FLOW.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>

          {/* phones: cards; tablets and up: table */}
          <ul className="space-y-3 md:hidden">
            {rows.map((c) => {
              const v = carOf(c);
              const j = jobOf(c);
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => router.push(`/admin/insurance/${c.id}`)} className="neu w-full p-4 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{vehicleName(v)} <span className="font-normal text-ink-400">· {v?.reg}</span></p>
                        <p className="truncate text-xs text-ink-500">{j && customerOf(db, j.customerId)?.name} · #{c.jobId}</p>
                      </div>
                      <ClaimStatusBadge status={c.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
                      <span>{c.insurer}</span>
                      <span className="inline-flex items-center gap-2">{c.type} · {days(c)}</span>
                    </div>
                    {c.lines.length > 0 && <p className="mt-2 text-xs text-ink-500">Insurance pays <b className="text-ink">{inr(splitOf(c).insurance)}</b> · Customer pays <b className="text-ink">{inr(splitOf(c).customer)}</b></p>}
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && <Card className="p-8 text-center text-sm text-ink-500">No claims match these filters.</Card>}
          </ul>
          <div className="hidden md:block">
            <DataTable columns={cols} rows={rows} rowKey={(c) => c.id} onRowClick={(c) => router.push(`/admin/insurance/${c.id}`)} pageSize={10} />
          </div>
        </>
      )}
    </>
  );
}

export default function InsurancePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
