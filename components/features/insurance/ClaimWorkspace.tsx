'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Link2, Loader2, Phone } from 'lucide-react';
import { Button, Card, Modal, Select, StatusBadge, useToast } from '@/components/ui';
import { generateClaimPack, setClaimStatus } from '@/lib/actions';
import { customerOf, inr, vehicleName, vehicleOf } from '@/lib/format';
import { daysOpen, flowFor, fmtAt, fmtDate, missingDocs, splitOf } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import type { Claim } from '@/lib/types';
import { ClaimDetails, ClaimStatusBadge, ClaimTimeline, DocChecklist, EstimateSplit, PhotoChecklist, Section, SlaList } from './ClaimParts';

export const surveyorPath = (id: string) => `/surveyor/claim/${id}`;

/* ---------------------------------------------------------------- claim pack (mock PDF) */
function PackPreview({ claim }: { claim: Claim }) {
  const db = useDb();
  const job = db.jobs.find((j) => j.id === claim.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  const c = job && customerOf(db, job.customerId);
  const s = splitOf(claim);
  const shots = claim.photos.filter((p) => p.uploaded).slice(0, 4);
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-md bg-white p-4 text-[11px] leading-4 text-ink shadow-[0_10px_30px_rgba(60,40,20,0.18)] ring-1 ring-black/5 sm:p-5">
      <div className="flex items-start justify-between border-b border-ivory-300 pb-2">
        <div><p className="text-[13px] font-bold">Claim pack</p><p className="text-ink-500">{claim.id} · {claim.insurer}</p></div>
        <p className="text-right text-ink-500">{fmtDate(claim.accidentDate)}<br />{claim.type}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-b border-ivory-300 py-2">
        <p><span className="text-ink-400">Vehicle</span><br /><b>{vehicleName(v)} · {v?.reg}</b></p>
        <p><span className="text-ink-400">Customer</span><br /><b>{c?.name}</b></p>
        <p><span className="text-ink-400">Policy</span><br /><b>{claim.policyNo || '-'}</b></p>
        <p><span className="text-ink-400">Claim no.</span><br /><b>{claim.claimNo || '-'}</b></p>
      </div>
      <p className="mb-1 mt-2 font-bold">Photos ({claim.photos.filter((p) => p.uploaded).length})</p>
      <div className="grid grid-cols-4 gap-1">
        {shots.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.src} alt={p.label} className="aspect-[4/3] w-full rounded object-cover" />
        ))}
      </div>
      <p className="mb-1 mt-2 font-bold">Documents</p>
      <p className="text-ink-600">{claim.docs.filter((d) => d.uploaded).map((d) => d.label.replace(/ \(.*\)/, '')).join(' · ')}</p>
      <p className="mb-1 mt-2 font-bold">Estimate</p>
      <table className="w-full">
        <tbody>
          {claim.lines.map((l) => (
            <tr key={l.id} className="border-t border-ivory-200"><td className="py-0.5">{l.name}</td><td className="text-right">{inr(l.amount)}</td></tr>
          ))}
          <tr className="border-t border-ivory-300 font-bold"><td className="pt-1">Insurance pays</td><td className="pt-1 text-right">{inr(s.insurance)}</td></tr>
          <tr className="font-bold"><td>Customer pays</td><td className="text-right">{inr(s.customer)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ClaimPackModal({ claim, open, onClose, onToast }: { claim: Claim; open: boolean; onClose: () => void; onToast: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) return;
    setBusy(true);
    setReady(false);
    const t = setTimeout(() => {
      generateClaimPack(claim.id);
      setBusy(false);
      setReady(true);
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const link = typeof window !== 'undefined' ? `${window.location.origin}${surveyorPath(claim.id)}` : surveyorPath(claim.id);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Claim pack"
      size="md"
      footer={
        <>
          <Button variant="neu" onClick={onClose}>Close</Button>
          <Button disabled={!ready} onClick={() => { navigator.clipboard?.writeText(link); onToast('Surveyor link copied'); }}><Link2 className="h-4 w-4" /> Copy surveyor link</Button>
        </>
      }
    >
      {busy ? (
        <div className="flex flex-col items-center gap-3 py-12 text-ink-500" role="status">
          <Loader2 className="h-9 w-9 animate-spin text-coral-500" />
          <p className="text-sm font-medium">Putting together photos, documents and estimate…</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-ok-soft py-3 text-base font-semibold text-ok" role="status"><CheckCircle2 className="h-5 w-5" /> Claim pack ready ✓</div>
          <p className="text-center text-sm text-ink-500">Sent to surveyor {claim.surveyorName || 'on assignment'}. Preview (demo PDF):</p>
          <PackPreview claim={claim} />
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------- workspace */
export function ClaimWorkspace({ claimId, embedded }: { claimId: string; embedded?: boolean }) {
  const db = useDb();
  const toast = useToast();
  const [pack, setPack] = useState(false);
  const claim = db.claims.find((c) => c.id === claimId);
  if (!claim) return <Card className="p-8 text-center text-ink-500">Claim not found.</Card>;
  const job = db.jobs.find((j) => j.id === claim.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  const cust = job && customerOf(db, job.customerId);
  const missing = missingDocs(claim);
  const blocked = missing.length > 0 || claim.lines.length === 0;

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
          <div className="min-w-0 flex-1 basis-60">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] font-bold tracking-tight">{claim.id}</h2>
              <ClaimStatusBadge status={claim.status} />
              <StatusBadge tone="gray" size="sm">{claim.type}</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-ink-500">{claim.insurer} · {daysOpen(claim)} days open</p>
            <p className="mt-2 text-sm font-semibold">{vehicleName(v)} <span className="font-normal text-ink-500">· {v?.reg}</span></p>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-500">
              <span>{cust?.name}</span>
              {cust && <a href={`tel:${cust.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-coral-600"><Phone className="h-3.5 w-3.5" /> {cust.phone}</a>}
              {job && !embedded && <Link href={`/admin/jobs/${job.id}`} className="inline-flex items-center gap-1 text-coral-600">Job #{job.id} <ExternalLink className="h-3 w-3" /></Link>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <label className="text-xs font-medium text-ink-500">Claim status
              <Select className="mt-1" value={claim.status} onChange={(e) => setClaimStatus(claim.id, e.target.value as Claim['status'])}>
                {flowFor(claim.type).map((s) => <option key={s}>{s}</option>)}
              </Select>
            </label>
            <Button disabled={blocked} onClick={() => setPack(true)}><FileText className="h-4 w-4" /> {claim.packAt ? 'Regenerate claim pack' : 'Generate claim pack'}</Button>
            {blocked && <p className="max-w-[16rem] text-xs text-ink-500">{missing.length ? `Upload ${missing.length} missing required document${missing.length > 1 ? 's' : ''}` : 'Add estimate lines'} to generate the pack.</p>}
            {claim.packAt && (
              <Link href={surveyorPath(claim.id)} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-medium text-coral-600"><ExternalLink className="h-3.5 w-3.5" /> Open surveyor view</Link>
            )}
          </div>
        </div>
        {claim.customerApprovedAt ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok"><CheckCircle2 className="h-4 w-4" /> Customer approved their share of {inr(splitOf(claim).customer)} on {fmtAt(claim.customerApprovedAt)}</p>
        ) : claim.lines.length > 0 ? (
          <p className="mt-4 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">Customer has not approved their share of {inr(splitOf(claim).customer)} yet.</p>
        ) : null}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Section title="Claim details"><ClaimDetails claim={claim} /></Section>
          <Section title="Documents" aside={<StatusBadge tone={missing.length ? 'amber' : 'green'} size="sm">{missing.length ? `${missing.length} missing` : 'Complete'}</StatusBadge>}>
            <DocChecklist claim={claim} onToast={toast.show} />
          </Section>
          <Section title="Photos" aside={<StatusBadge tone="gray" size="sm">{claim.photos.filter((p) => p.uploaded).length}/{claim.photos.length}</StatusBadge>}>
            <PhotoChecklist claim={claim} />
          </Section>
        </div>
        <div className="space-y-5">
          <Section title="Estimate split"><EstimateSplit claim={claim} /></Section>
          <Section title="Timelines (reference)"><SlaList claim={claim} /></Section>
          <Section title="Claim timeline"><ClaimTimeline claim={claim} /></Section>
        </div>
      </div>

      <ClaimPackModal claim={claim} open={pack} onClose={() => setPack(false)} onToast={toast.show} />
      {toast.node}
    </div>
  );
}
