'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, Link2, Loader2, Phone } from 'lucide-react';
import { Button, Card, FilterTabs, Modal, Select, StatusBadge, useToast } from '@/components/ui';
import { generateClaimPack, setClaimStatus } from '@/lib/actions';
import { customerOf, inr, vehicleName, vehicleOf } from '@/lib/format';
import { claimPending, flowFor, fmtDate, missingDocs, payoutOf, splitOf } from '@/lib/insurance';
import { useSession } from '@/lib/auth';
import { DocLink } from '@/components/features/Documents';
import { BeforeAfter } from '@/components/features/BeforeAfter';
import { useDb } from '@/lib/store';
import type { Claim } from '@/lib/types';
import { ClaimDetails, ClaimStatusBadge, ClaimTimeline, DocChecklist, EstimateSplit, PayoutSplit, PhotoChecklist, Section, SlaList } from './ClaimParts';
import { RepairBrief, RepairDetails } from './RepairDetails';

export const surveyorPath = (id: string) => `/surveyor/claim/${id}`;

/* ---------------------------------------------------------------- claim pack (mock PDF) */
function PackPreview({ claim, draft }: { claim: Claim; draft: boolean }) {
  const db = useDb();
  const job = db.jobs.find((j) => j.id === claim.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  const c = job && customerOf(db, job.customerId);
  const s = splitOf(claim);
  const shots = claim.photos.filter((p) => p.uploaded).slice(0, 4);
  const pay = payoutOf(claim);
  const pending = claimPending(claim);
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-md bg-white p-4 text-[11px] leading-4 text-ink shadow-[0_10px_30px_rgba(60,40,20,0.18)] ring-1 ring-black/5 sm:p-5">
      <div className="flex items-start justify-between border-b border-ivory-300 pb-2">
        <div><p className="text-[13px] font-bold">Claim pack{draft ? ' (draft)' : ''}</p><p className="text-ink-500">{claim.id} · {claim.insurer}</p></div>
        <p className="text-right text-ink-500">{fmtDate(claim.accidentDate)}<br />{claim.type}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-b border-ivory-300 py-2">
        <p><span className="text-ink-400">Vehicle</span><br /><b>{vehicleName(v)} · {v?.reg}</b></p>
        <p><span className="text-ink-400">Customer</span><br /><b>{c?.name}</b></p>
        <p><span className="text-ink-400">Policy</span><br /><b>{claim.policyNo || '-'}</b></p>
        <p><span className="text-ink-400">Claim no.</span><br /><b>{claim.claimNo || '-'}</b></p>
      </div>
      {draft && pending.length > 0 && (
        <div className="mt-2 rounded bg-warn-soft p-2 text-warn-strong"><p className="font-bold">Pending ({pending.length})</p><ul>{pending.map((x) => <li key={x.item}>{x.item}</li>)}</ul></div>
      )}
      {job && <><p className="mb-1 mt-2 font-bold">Repair details</p><RepairBrief job={job} /></>}
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
          {claim.type === 'Cashless' ? (
            <tr><td colSpan={2} className="pt-1 text-ink-600">Cashless: insurer pays the garage {inr(pay.insurer)}, customer pays the garage {inr(pay.customer)}.</td></tr>
          ) : (
            <tr><td colSpan={2} className="pt-1 text-ink-600">Reimbursement: customer pays the garage {inr(pay.total)}, insurer pays the customer back {inr(pay.insurer)}.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClaimPackModal({ claim, open, draft, onClose, onToast }: { claim: Claim; open: boolean; draft: boolean; onClose: () => void; onToast: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) return;
    setBusy(true);
    setReady(false);
    const t = setTimeout(() => {
      if (!draft) generateClaimPack(claim.id);
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
          {!draft && <Button disabled={!ready} onClick={() => { navigator.clipboard?.writeText(link); onToast('Surveyor link copied'); }}><Link2 className="h-4 w-4" /> Copy surveyor link</Button>}
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
          {draft ? (
            <div className="rounded-2xl bg-warn-soft py-3 text-center text-base font-semibold text-warn-strong" role="status">Draft only. Not sent to the surveyor.</div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-ok-soft py-3 text-base font-semibold text-ok" role="status"><CheckCircle2 className="h-5 w-5" /> Claim pack ready ✓</div>
          )}
          <p className="text-center text-sm text-ink-500">{draft ? 'Clear the pending items to send it.' : `Sent to surveyor ${claim.surveyorName || 'on assignment'}.`} Preview (demo PDF):</p>
          <PackPreview claim={claim} draft={draft} />
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------- workspace */
export function ClaimWorkspace({ claimId, embedded }: { claimId: string; embedded?: boolean }) {
  const db = useDb();
  const toast = useToast();
  const { user } = useSession();
  const [pack, setPack] = useState(false);
  const [tab, setTab] = useState<'claim' | 'photos' | 'payment' | 'repair'>('claim');
  const claim = db.claims.find((c) => c.id === claimId);
  if (!claim) return <Card className="p-8 text-center text-ink-500">Claim not found.</Card>;
  const job = db.jobs.find((j) => j.id === claim.jobId);
  const v = job && vehicleOf(db, job.vehicleId);
  const cust = job && customerOf(db, job.customerId);
  const missing = missingDocs(claim);
  const pending = claimPending(claim);
  const draft = pending.some((p) => p.blocks);
  const split = splitOf(claim);

  const next = pending[0]?.item;
  const others = pending.filter((p) => !p.item.startsWith('Upload '));

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
          <div className="min-w-0 flex-1 basis-60">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] font-bold tracking-tight">{claim.id}</h2>
              <ClaimStatusBadge status={claim.status} />
              <StatusBadge tone="gray" size="sm">{claim.type}</StatusBadge>
            </div>
            <p className="mt-1 text-sm font-semibold">{vehicleName(v)} <span className="font-normal text-ink-500">· {v?.reg}</span></p>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-500">
              <span>{cust?.name}</span>
              <span>{claim.insurer}</span>
              {cust && <a href={`tel:${cust.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-coral-600"><Phone className="h-3.5 w-3.5" /> Call</a>}
              {job && !embedded && <Link href={`/admin/jobs/${job.id}`} className="inline-flex items-center gap-1 text-coral-600">Job #{job.id} <ExternalLink className="h-3 w-3" /></Link>}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <div className="min-w-[170px] flex-1 sm:flex-none"><Select aria-label="Claim status" value={claim.status} onChange={(e) => setClaimStatus(claim.id, e.target.value as Claim['status'])}>{flowFor(claim.type).map((st) => <option key={st}>{st}</option>)}</Select></div>
            <Button onClick={() => setPack(true)}><FileText className="h-4 w-4" /> {draft ? 'Draft pack' : 'Claim pack'}</Button>
            {job && <DocLink kind="claim" docKey={job.trackingToken} className="btn btn-neu h-11 px-4 text-sm">PDF</DocLink>}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[['Total', inr(split.total)], ['Insurer pays', inr(payoutOf(claim).insurer)], ['Customer pays', inr(payoutOf(claim).customer)]].map(([k, val]) => <div key={k} className="rounded-xl bg-ivory-100 px-3 py-2"><p className="text-xs text-ink-500">{k}</p><p className="font-bold">{val}</p></div>)}
        </div>
        {next ? <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn-strong"><b>Next:</b> {next}{pending.length > 1 ? ` (+${pending.length - 1} more)` : ''}</p> : <p className="mt-3 flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok"><CheckCircle2 className="h-4 w-4" /> Nothing pending on this claim</p>}
      </Card>

      <FilterTabs variant="soft" value={tab} onChange={setTab} tabs={[{ value: 'claim', label: 'Claim' }, { value: 'photos', label: 'Photos' }, { value: 'payment', label: 'Payment' }, { value: 'repair', label: 'Repair' }]} />

      {tab === 'claim' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Documents" aside={<StatusBadge tone={missing.length ? 'amber' : 'green'} size="sm">{missing.length ? `${missing.length} missing` : 'Complete'}</StatusBadge>}>
            <DocChecklist claim={claim} onToast={toast.show} />
          </Section>
          <div className="space-y-4">
            {others.length > 0 && <Section title="Also pending"><ul className="space-y-1.5 text-sm">{others.map((p) => <li key={p.item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> {p.item}</li>)}</ul></Section>}
            <Section title="Claim details"><ClaimDetails claim={claim} /></Section>
            <details className="neu p-4 sm:p-5">
              <summary className="cursor-pointer font-bold">Claim history</summary>
              <div className="mt-3 space-y-4"><SlaList claim={claim} /><ClaimTimeline claim={claim} /></div>
            </details>
          </div>
        </div>
      )}

      {tab === 'photos' && (
        <div className="space-y-4">
          {job && <Section title="Before and after"><BeforeAfter job={job} by={user?.name ?? 'Team'} onError={toast.show} /></Section>}
          <Section title="Required by the insurer" aside={<StatusBadge tone="gray" size="sm">{claim.photos.filter((p) => p.uploaded).length}/{claim.photos.length}</StatusBadge>}><PhotoChecklist claim={claim} /></Section>
        </div>
      )}

      {tab === 'payment' && (
        <div className="space-y-4">
          <Section title="Who pays what"><PayoutSplit claim={claim} /></Section>
          <Section title="Estimate"><EstimateSplit claim={claim} /></Section>
        </div>
      )}

      {tab === 'repair' && job && <RepairDetails job={job} by={user?.name ?? 'Team'} />}

      <ClaimPackModal claim={claim} open={pack} draft={draft} onClose={() => setPack(false)} onToast={toast.show} />
      {toast.node}
    </div>
  );
}
