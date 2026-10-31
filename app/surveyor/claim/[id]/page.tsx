'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ClaimStatusBadge } from '@/components/features/insurance/ClaimParts';
import { Button, Card, Field, Input, StatusBadge, Textarea } from '@/components/ui';
import { surveyorSubmit } from '@/lib/actions';
import { customerOf, inr, vehicleName, vehicleOf } from '@/lib/format';
import { BeforeAfter } from '@/components/features/BeforeAfter';
import { RepairBrief } from '@/components/features/insurance/RepairDetails';
import { fmtAt, fmtDate, splitOf } from '@/lib/insurance';
import { useDb } from '@/lib/store';

/** Public, read-only surveyor view: no login. Remarks and the approved amount move the claim to Approved. */
export default function SurveyorClaimPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const claim = db.claims.find((c) => c.id === id);
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [sent, setSent] = useState(false);

  if (!claim) {
    return <main className="mx-auto max-w-md px-5 py-20 text-center"><h1 className="text-xl font-bold">Claim not found</h1><p className="mt-2 text-sm text-ink-500">This link is not valid in this browser. Ask the workshop to resend it.</p></main>;
  }
  const job = db.jobs.find((j) => j.id === claim.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  const cust = job && customerOf(db, job.customerId);
  const s = splitOf(claim);
  const done = sent || claim.approvedAmount !== undefined;
  const photos = claim.photos.filter((p) => p.uploaded);

  return (
    <div className="min-h-screen bg-ivory-100 pb-16">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
          <span className="text-lg font-bold tracking-tight">AutoHub</span>
          <StatusBadge tone="blue" size="sm">Surveyor view · read-only</StatusBadge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-5">
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-bold tracking-tight">Claim {claim.id}</h1>
            <ClaimStatusBadge status={claim.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">{claim.insurer} · {claim.type} · Claim no. {claim.claimNo || '-'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt className="text-xs text-ink-400">Vehicle</dt><dd className="font-semibold">{vehicleName(v)} · {v?.reg}</dd></div>
            <div><dt className="text-xs text-ink-400">Owner</dt><dd className="font-semibold">{cust?.name}</dd></div>
            <div><dt className="text-xs text-ink-400">Policy no.</dt><dd className="font-semibold">{claim.policyNo || '-'}</dd></div>
            <div><dt className="text-xs text-ink-400">Accident date</dt><dd className="font-semibold">{fmtDate(claim.accidentDate)}</dd></div>
          </dl>
        </Card>

        {job && (
          <Card className="p-4 text-sm sm:p-5">
            <h2 className="mb-3 text-[17px] font-bold tracking-tight">Repair details</h2>
            <RepairBrief job={job} />
          </Card>
        )}
        {job && <Card className="p-4 sm:p-5"><h2 className="mb-3 text-[17px] font-bold tracking-tight">Before and after</h2><BeforeAfter job={job} /></Card>}

        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight">Photos ({photos.length})</h2>
          {photos.length === 0 ? <p className="text-sm text-ink-500">No photos uploaded yet.</p> : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {photos.map((p) => (
                <figure key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ivory-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.label} className="h-full w-full object-cover" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-medium text-white">{p.stage}: {p.label}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight">Documents</h2>
          <ul className="divide-y divide-ivory-300/70 text-sm">
            {claim.docs.map((d) => (
              <li key={d.kind} className="flex items-center justify-between gap-3 py-2.5">
                <span>{d.label}</span>
                <StatusBadge tone={d.uploaded ? 'green' : d.required ? 'amber' : 'gray'} size="sm">{d.uploaded ? 'Received' : d.required ? 'Missing' : 'Not provided'}</StatusBadge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight">Repair estimate</h2>
          <table className="w-full text-sm">
            <tbody>
              {claim.lines.map((l) => (
                <tr key={l.id} className="border-t border-ivory-300/70"><td className="py-2.5">{l.name}</td><td className="py-2.5 text-right font-medium">{inr(l.amount)}</td><td className="w-24 py-2.5 pl-3 text-right text-xs text-ink-500">{l.covered ? 'Insurer' : 'Customer'}</td></tr>
              ))}
              <tr className="border-t border-ivory-300"><td className="pt-3 text-ink-500">Depreciation and deductible (customer)</td><td className="pt-3 text-right">{inr(s.depreciation + s.deductible)}</td><td /></tr>
              <tr><td className="pt-1 font-bold">Claimed from insurer</td><td className="pt-1 text-right text-base font-bold">{inr(s.insurance)}</td><td /></tr>
            </tbody>
          </table>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-[17px] font-bold tracking-tight">Surveyor assessment</h2>
          {done ? (
            <div className="space-y-2" role="status">
              <p className="flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2.5 text-sm font-semibold text-ok"><CheckCircle2 className="h-4 w-4" /> Submitted. Claim approved for {inr(claim.approvedAmount ?? Number(amount))}</p>
              {claim.surveyorRemarks && <p className="text-sm text-ink-600">&ldquo;{claim.surveyorRemarks}&rdquo;</p>}
              {claim.decisionAt && <p className="text-xs text-ink-400">{fmtAt(claim.decisionAt)}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Remarks"><Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Findings, parts to be replaced or repaired, conditions…" /></Field>
              <Field label="Approved amount (₹)"><Input type="number" min={0} value={amount} placeholder={String(s.insurance)} onChange={(e) => setAmount(e.target.value)} /></Field>
              <Button
                disabled={!remarks.trim()}
                onClick={() => { surveyorSubmit(claim.id, remarks.trim(), Math.round(Number(amount) || s.insurance)); setSent(true); }}
              >
                Submit assessment
              </Button>
              <p className="text-xs text-ink-400">Demo page: nothing leaves this browser.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
