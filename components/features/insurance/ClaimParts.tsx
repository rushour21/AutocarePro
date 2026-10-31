'use client';

import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Clock, FileText, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Field, Input, Modal, Select, StatusBadge, Toggle, cn } from '@/components/ui';
import { PhotoButton } from '@/components/features/PhotoButton';
import { addClaimLine, removeClaimLine, sendUploadLink, setDocUploaded, setPhotoUploaded, toggleClaimLine, updateClaim } from '@/lib/actions';
import { inr } from '@/lib/format';
import { CLAIM_TONE, fmtAt, INSURERS, payoutOf, slaOf, splitOf, missingDocs, type SlaBadge } from '@/lib/insurance';
import type { Claim, ClaimPhotoStage } from '@/lib/types';

export const ClaimStatusBadge = ({ status }: { status: Claim['status'] }) => <StatusBadge tone={CLAIM_TONE[status]} dot>{status}</StatusBadge>;

const SLA_TONE = { ok: 'green', late: 'amber', overdue: 'red', pending: 'gray' } as const;
const SLA_LABEL = { ok: 'On time', late: 'Late', overdue: 'Overdue', pending: 'In time' } as const;

export function SlaList({ claim }: { claim: Claim }) {
  const items: SlaBadge[] = slaOf(claim);
  return (
    <ul className="divide-y divide-ivory-300/70">
      {items.map((b) => (
        <li key={b.key} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{b.label}</p>
            <p className="text-xs text-ink-500">{b.detail}</p>
          </div>
          <StatusBadge tone={SLA_TONE[b.state]} dot size="sm">{SLA_LABEL[b.state]}</StatusBadge>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- details */
export function ClaimDetails({ claim, readOnly }: { claim: Claim; readOnly?: boolean }) {
  const set = (patch: Parameters<typeof updateClaim>[1]) => updateClaim(claim.id, patch);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Claim type" className="sm:col-span-2">
        <div className="segmented inline-flex gap-0.5 p-0.5">
          {(['Cashless', 'Reimbursement'] as const).map((t) => (
            <button key={t} type="button" disabled={readOnly} onClick={() => set({ type: t })} className={cn('rounded-[9px] px-4 py-1.5 text-[13px] font-medium transition-colors', claim.type === t ? 'segmented-thumb text-ink' : 'text-ink-500')}>
              {t}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Insurer">
        <Select value={claim.insurer} disabled={readOnly} onChange={(e) => set({ insurer: e.target.value })}>
          {[...new Set<string>([...INSURERS, claim.insurer])].map((i) => <option key={i}>{i}</option>)}
        </Select>
      </Field>
      <Field label="Accident date"><Input type="date" value={claim.accidentDate} disabled={readOnly} onChange={(e) => set({ accidentDate: e.target.value })} /></Field>
      <Field label="Policy no."><Input value={claim.policyNo} disabled={readOnly} placeholder="e.g. ABC/MOT/25/104237" onChange={(e) => set({ policyNo: e.target.value })} /></Field>
      <Field label="Claim no."><Input value={claim.claimNo} disabled={readOnly} placeholder="e.g. ABC-CL-5153" onChange={(e) => set({ claimNo: e.target.value })} /></Field>
      <Field label="Surveyor name"><Input value={claim.surveyorName} disabled={readOnly} onChange={(e) => set({ surveyorName: e.target.value })} /></Field>
      <Field label="Surveyor phone"><Input value={claim.surveyorPhone} disabled={readOnly} inputMode="tel" onChange={(e) => set({ surveyorPhone: e.target.value })} /></Field>
    </div>
  );
}

/* ---------------------------------------------------------------- documents */
export function DocChecklist({ claim, onToast }: { claim: Claim; onToast: (m: string) => void }) {
  const missing = missingDocs(claim).length;
  return (
    <div>
      <ul className="divide-y divide-ivory-300/70">
        {claim.docs.map((d) => (
          <li key={d.kind} className="flex flex-wrap items-center gap-3 py-3">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', d.uploaded ? 'bg-ok-soft text-ok' : d.required ? 'bg-warn-soft text-warn' : 'bg-ivory-200 text-ink-400')}>
              {d.uploaded ? <CheckCircle2 className="h-5 w-5" /> : d.required ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{d.label}</p>
              <p className="text-xs text-ink-500">{d.uploaded ? `Uploaded ${d.uploadedAt ? fmtAt(d.uploadedAt) : ''}` : d.required ? 'Missing' : 'Optional'}</p>
            </div>
            <Button size="sm" variant="neu" onClick={() => setDocUploaded(claim.id, d.kind, !d.uploaded)}>{d.uploaded ? 'Undo' : 'Mark uploaded'}</Button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" variant={missing ? 'coral' : 'neu'} onClick={() => { sendUploadLink(claim.id); onToast('Link sent on WhatsApp (demo)'); }}>
          <MessageCircle className="h-4 w-4" /> Send upload link to customer
        </Button>
        <span className="text-xs text-ink-500">{missing ? `${missing} required document${missing > 1 ? 's' : ''} missing` : 'All required documents received'}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- photos */
const STAGES: ClaimPhotoStage[] = ['Intake', 'Old parts', 'Final'];
export function PhotoChecklist({ claim }: { claim: Claim }) {
  return (
    <div className="space-y-5">
      {STAGES.map((stage) => {
        const list = claim.photos.filter((p) => p.stage === stage);
        const done = list.filter((p) => p.uploaded).length;
        return (
          <div key={stage}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{stage}</p>
              <StatusBadge tone={done === list.length ? 'green' : done ? 'amber' : 'gray'} size="sm">{done}/{list.length}</StatusBadge>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {list.map((p) =>
                p.uploaded ? (
                  <button key={p.id} type="button" onClick={() => setPhotoUploaded(claim.id, p.id, false)} title="Tap to remove" className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ivory-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.label} className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-left text-[11px] font-medium text-white">{p.label}</span>
                    <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" />
                  </button>
                ) : (
                  <PhotoButton key={p.id} plain label={`Upload ${p.label}`} onPhoto={(src) => setPhotoUploaded(claim.id, p.id, true, src)} className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ivory-400 px-1 text-center text-[11px] font-medium text-ink-500 transition hover:border-coral-300 hover:text-coral-500">
                    <Camera className="h-4 w-4" />
                    {p.label}
                    <span className="text-[10px] font-normal text-warn">Missing</span>
                  </PhotoButton>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- estimate split */
const KIND_LABEL = { part: 'Part', labour: 'Labour', paint: 'Paint' } as const;

export function SplitSummary({ claim, className }: { claim: Claim; className?: string }) {
  const s = splitOf(claim);
  return (
    <div className={cn('rounded-2xl bg-ink p-4 text-white sm:p-5', className)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-white/60">Insurance pays</p>
          <p className="mt-1 text-[24px] font-bold leading-none tracking-tight sm:text-[28px]">{inr(s.insurance)}</p>
        </div>
        <div>
          <p className="text-xs text-white/60">Customer pays</p>
          <p className="mt-1 text-[24px] font-bold leading-none tracking-tight text-coral-300 sm:text-[28px]">{inr(s.customer)}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5 border-t border-white/15 pt-3 text-xs text-white/70">
        <div className="flex justify-between"><span>Estimate total</span><span>{inr(s.total)}</span></div>
        <div className="flex justify-between"><span>Not covered by insurance</span><span>{inr(s.notCovered)}</span></div>
        <div className="flex justify-between"><span>Depreciation{claim.zeroDep ? ' (zero-dep policy)' : ` (${claim.depreciationPct}% on parts)`}</span><span>{inr(s.depreciation)}</span></div>
        <div className="flex justify-between"><span>Compulsory deductible</span><span>{inr(s.deductible)}</span></div>
      </div>
    </div>
  );
}

/** Both ways of settling this claim, side by side. Tapping one makes it the claim's type. */
export function PayoutSplit({ claim, readOnly }: { claim: Claim; readOnly?: boolean }) {
  const p = payoutOf(claim);
  const cards = [
    { type: 'Cashless' as const, lines: [['Customer pays garage at delivery', p.customer], ['Insurer pays garage directly', p.insurer]], foot: `Garage waits for ${inr(p.insurer)} from the insurer. Customer's final cost: ${inr(p.customer)}.` },
    { type: 'Reimbursement' as const, lines: [['Customer pays garage at delivery', p.total], ['Insurer pays customer back', p.insurer]], foot: `Garage collects the full ${inr(p.total)}. Customer's final cost: ${inr(p.customer)}.` },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => {
        const on = claim.type === c.type;
        return (
          <button key={c.type} type="button" disabled={readOnly} aria-pressed={on} onClick={() => updateClaim(claim.id, { type: c.type })} className={cn('rounded-2xl p-4 text-left transition', on ? 'bg-coral-50 ring-1 ring-coral-300' : 'neu-sm')}>
            <span className="flex items-center justify-between gap-2"><span className="font-bold">{c.type}</span>{on && <StatusBadge tone="coral" size="sm">This claim</StatusBadge>}</span>
            <span className="mt-3 block space-y-2">
              {c.lines.map(([k, v]) => <span key={k as string} className="flex justify-between gap-3 text-sm"><span className="text-ink-600">{k}</span><span className="font-bold">{inr(v as number)}</span></span>)}
            </span>
            <span className="mt-3 block text-xs text-ink-500">{c.foot}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EstimateSplit({ claim }: { claim: Claim }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'part' | 'labour' | 'paint'>('part');
  return (
    <div>
      {claim.lines.length === 0 ? (
        <p className="rounded-2xl bg-ivory-100 px-4 py-6 text-center text-sm text-ink-500">No estimate lines yet. Add the repair items to see who pays what.</p>
      ) : (
        <ul className="divide-y divide-ivory-300/70">
          {claim.lines.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <div className="min-w-0 flex-1 basis-[11rem]">
                <p className="text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-ink-500">{KIND_LABEL[l.kind]}</p>
              </div>
              <span className="w-24 text-right text-sm font-semibold">{inr(l.amount)}</span>
              <button
                type="button"
                onClick={() => toggleClaimLine(claim.id, l.id)}
                aria-label={`${l.name}: ${l.covered ? 'covered by insurance' : 'customer pays'}. Tap to switch`}
                className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold transition', l.covered ? 'bg-info-soft text-info' : 'bg-coral-100 text-coral-600')}
              >
                {l.covered ? 'Insurance covers' : 'Customer pays'}
              </button>
              <button type="button" aria-label={`Remove ${l.name}`} onClick={() => removeClaimLine(claim.id, l.id)} className="text-ink-300 transition hover:text-bad"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="neu" className="mt-3" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add line</Button>

      <div className="mt-5 grid gap-3 rounded-2xl bg-ivory-100 p-4 sm:grid-cols-3">
        <Field label="Compulsory deductible (₹)"><Input type="number" min={0} value={claim.deductible} onChange={(e) => updateClaim(claim.id, { deductible: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <Field label="Depreciation on parts (%)"><Input type="number" min={0} max={100} value={claim.depreciationPct} disabled={claim.zeroDep} onChange={(e) => updateClaim(claim.id, { depreciationPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} /></Field>
        <div className="flex items-center gap-3 sm:pt-6">
          <Toggle checked={claim.zeroDep} onChange={(v) => updateClaim(claim.id, { zeroDep: v })} label="Zero depreciation policy" />
          <span className="text-sm text-ink-600">Zero-dep policy</span>
        </div>
      </div>
      <SplitSummary claim={claim} className="mt-4" />

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add estimate line"
        size="sm"
        footer={
          <>
            <Button variant="neu" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              disabled={!name.trim() || !(Number(amount) > 0)}
              onClick={() => {
                addClaimLine(claim.id, { name: name.trim(), amount: Math.round(Number(amount)), kind, covered: true });
                setName(''); setAmount(''); setKind('part'); setAdding(false);
              }}
            >
              Add line
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Item"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Radiator support panel" /></Field>
          <Field label="Amount (₹)"><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Type">
            <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="part">Part</option><option value="labour">Labour</option><option value="paint">Paint</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- timeline */
export function ClaimTimeline({ claim }: { claim: Claim }) {
  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-ivory-300">
      {claim.events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-[3px] border-coral-400 bg-white" />
          <p className="text-sm font-medium">{e.text}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400"><Clock className="h-3 w-3" /> {fmtAt(e.at)} · {e.by}</p>
        </li>
      ))}
    </ol>
  );
}

export const Section = ({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <Card className={cn('p-4 sm:p-5', className)}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      {aside}
    </div>
    {children}
  </Card>
);
