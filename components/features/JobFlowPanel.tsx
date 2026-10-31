'use client';

import clsx from 'clsx';
import { Camera, Check, CircleAlert, MessageCircle, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PhotoButton } from '@/components/features/PhotoButton';
import { Button, Card, Field, Input, Modal, Select, StatusBadge, Textarea } from '@/components/ui';
import { addWorkItem, decideItems, removeWorkItem, requestClientApproval, sendForApproval, setJobHold, setJobStage, startRepair, tickClientApproval } from '@/lib/actions';
import { SERVICE_CATALOG, VISIT_REASONS } from '@/lib/catalog';
import { customerOf, estimateOfJob, estimateTotals, inr, itemApproval, pendingItems, sentItems } from '@/lib/format';
import { flowStep, openApprovals, type FlowStep } from '@/lib/jobflow';
import { useDb } from '@/lib/store';
import type { ApprovalMethod, Job } from '@/lib/types';

const HEAD: Record<FlowStep, { title: string; text: string }> = {
  start_inspection: { title: 'Start inspection', text: 'Read the complaint, then inspect the car.' },
  inspect: { title: 'Inspect and list the work', text: 'Add everything the car needs, then send it for approval.' },
  waiting_client: { title: 'Waiting for client approval', text: 'Work can start when the client decides.' },
  waiting_insurer: { title: 'Waiting for insurer approval', text: 'Repair can start once the insurer approves the claim.' },
  start_repair: { title: 'Approved. Ready to start', text: 'Only approved work should be done.' },
  declined: { title: 'Client declined the work', text: 'Close the job and return the car.' },
  repairing: { title: 'Repair in progress', text: 'Found something else? Add it and send it for approval.' },
  quality: { title: 'Quality check', text: 'Road test the car and check the finished work.' },
  ready: { title: 'Ready for delivery', text: 'Waiting for the customer to collect the car.' },
  delivered: { title: 'Delivered', text: 'This job is complete.' },
};
const HOLD = ['Waiting for a part', 'Waiting for the customer', 'Waiting for the insurer', 'Bay or machine not free'];
const TONE = { Approved: 'green', Declined: 'red', Pending: 'amber' } as const;

/** The check-in record the technician reads before touching the car. */
export function CheckInSummary({ job }: { job: Job }) {
  const c = job.checkin;
  if (!c) return null;
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-bold">Check-in details</h2>
      <div className="mb-3 flex flex-wrap gap-2">{c.reasons.map((r) => <StatusBadge key={r} tone="blue">{VISIT_REASONS.find((x) => x.key === r)?.label}</StatusBadge>)}{c.issues.map((i) => <StatusBadge key={i} tone="amber">{i}</StatusBadge>)}</div>
      {c.complaint && <p className="neu-in-sm mb-3 p-3 text-sm">&ldquo;{c.complaint}&rdquo;</p>}
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-ink-400">Odometer</dt><dd className="font-semibold">{c.odometer.toLocaleString('en-IN')} km</dd></div>
        <div><dt className="text-xs text-ink-400">Fuel</dt><dd className="font-semibold">{c.fuel}</dd></div>
        <div><dt className="text-xs text-ink-400">Brought by</dt><dd className="font-semibold">{c.broughtBy}</dd></div>
        <div><dt className="text-xs text-ink-400">Items in car</dt><dd className="font-semibold">{c.belongings.join(', ') || 'None noted'}</dd></div>
      </dl>
      {c.repeatOf && <p className="mt-3 text-sm text-ink-600">Repeat of job #{c.repeatOf}</p>}
      {c.photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {c.photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={p} alt="Car at check-in" className="h-14 w-20 rounded-xl object-cover" />
          ))}
        </div>
      )}
    </Card>
  );
}

/** One clear next action for the job, for both the technician and the front desk. */
export function JobFlowPanel({ job, by, staff, onToast, compact }: { job: Job; by: string; staff: 'admin' | 'tech'; onToast: (m: string) => void; compact?: boolean }) {
  const db = useDb();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ pick: '', name: '', type: 'Parts + Labour', amount: '', reason: '', photo: '' });
  const [holding, setHolding] = useState(false);
  const [hold, setHold] = useState(HOLD[0]);
  const [method, setMethod] = useState<ApprovalMethod>('Phone');

  const step = flowStep(db, job);
  const inspecting = step === 'start_repair' && job.stage === 'inspection';
  const head = inspecting ? { title: 'Inspection in progress', text: 'Add anything new you find, or start the approved work.' } : HEAD[step];
  const est = estimateOfJob(db, job.id);
  const open = est ? pendingItems(est) : [];
  const waiting = est ? sentItems(est) : [];
  const sent = waiting.length > 0;
  const toSend = open.filter((i) => !waiting.includes(i));
  const unsent = toSend.length > 0;
  const blocked = openApprovals(db, job).length > 0;
  const c = customerOf(db, job.customerId);
  const phone = (c?.phone ?? '').replace(/\D/g, '');
  const canAdd = ['start_inspection', 'inspect', 'waiting_client', 'waiting_insurer', 'start_repair', 'repairing'].includes(step);
  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/track/${job.trackingToken}/estimate`;
  const needsInitial = !!job.checkin && !job.clientApproval && !job.isInsurance && !unsent && !sent && step !== 'delivered';
  const overview = `${link.replace(/\/estimate$/, '')}`;
  const initialText = `Hello ${c?.name ?? ''}, please approve the inspection for job #${job.id} here: ${overview}`;
  const ask = `Hello ${c?.name ?? ''}, your car needs your approval for job #${job.id}. Please check here: ${link}`;
  const name = form.pick === 'other' ? form.name.trim() : form.pick;

  const save = () => {
    const amount = Number(form.amount);
    if (!name || !amount) return;
    addWorkItem(job.id, { name, type: form.type, amount, reason: form.reason.trim(), photo: form.photo || undefined }, by);
    setForm({ pick: '', name: '', type: 'Parts + Labour', amount: '', reason: '', photo: '' });
    setAdding(false);
    onToast('Work added');
  };
  const send = () => {
    sendForApproval(job.id, by);
    onToast(job.isInsurance ? 'Sent to the insurance desk' : 'Sent to the client for approval');
  };
  const begin = () => {
    const r = startRepair(job.id, by);
    onToast(r.ok ? 'Repair started' : r.error ?? 'Could not start');
  };
  const recordApproval = () => {
    if (!est) return;
    if (job.isInsurance) decideItems(est.id, Object.fromEntries(waiting.map((i) => [i.id, 'Approved' as const])), 'Insurer', by);
    else tickClientApproval(job.id, method, by);
    onToast('Approval recorded');
  };
  const finish = () => {
    setJobStage(job.id, 'quality_check', by);
    onToast('Moved to quality check');
  };
  const methodPick = (
    <div className="w-[130px]"><Select aria-label="How the client approved" value={method} onChange={(e) => setMethod(e.target.value as ApprovalMethod)}><option>Phone</option><option>In person</option><option>WhatsApp</option></Select></div>
  );

  const dialogs = () => (
    <>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add work for approval" size="sm" footer={<><Button variant="neu" onClick={() => setAdding(false)}>Cancel</Button><Button disabled={!name || !Number(form.amount)} onClick={save}>Add</Button></>}>
        <div className="space-y-4">
          <Field label="Work"><Select value={form.pick} onChange={(e) => { const s = SERVICE_CATALOG.find((x) => x.label === e.target.value); setForm({ ...form, pick: e.target.value, type: s?.type ?? form.type, amount: s ? String(s.price) : form.amount }); }}><option value="">Choose work</option>{SERVICE_CATALOG.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}<option value="other">Other</option></Select></Field>
          {form.pick === 'other' && <Field label="Work name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Replace wiper blades" /></Field>}
          <Field label="Amount (₹)"><Input inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })} /></Field>
          <Field label="Why is it needed?"><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Front pads are worn to 2 mm" className="!min-h-[64px]" /></Field>
          {form.photo ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.photo} alt="Issue" className="h-14 w-20 rounded-xl object-cover" />
              <Button variant="neu" size="sm" onClick={() => setForm({ ...form, photo: '' })}>Remove photo</Button>
            </div>
          ) : <PhotoButton label="Upload issue photo" onPhoto={(photo) => setForm((f) => ({ ...f, photo }))} onError={onToast} className="h-10 gap-2 px-4 text-sm"><Camera className="h-4 w-4" /> Upload photo</PhotoButton>}
        </div>
      </Modal>
      <Modal open={holding} onClose={() => setHolding(false)} title="Put job on hold" size="sm" footer={<><Button variant="neu" onClick={() => setHolding(false)}>Cancel</Button><Button onClick={() => { setJobHold(job.id, hold, by); setHolding(false); onToast('Job on hold'); }}>Hold job</Button></>}>
        <Field label="Reason"><Select value={hold} onChange={(e) => setHold(e.target.value)}>{HOLD.map((h) => <option key={h}>{h}</option>)}</Select></Field>
      </Modal>
    </>
  );

  const actions = (
    <>
      <div className={clsx('flex flex-wrap gap-2.5', !compact && 'mt-4')}>
        {step === 'start_inspection' && <Button size="lg" onClick={() => { setJobStage(job.id, 'inspection', by); onToast('Inspection started'); }}><Play className="h-4 w-4" /> Start inspection</Button>}
        {needsInitial && !job.approvalAsked && <Button size="lg" onClick={() => { requestClientApproval(job.id, by); onToast('Approval request sent to the client'); }}>Send approval to client</Button>}
        {needsInitial && job.approvalAsked && <a className="btn btn-neu h-12 gap-2 px-5 text-sm" href={`https://wa.me/${phone}?text=${encodeURIComponent(initialText)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp client</a>}
        {unsent && step !== 'start_inspection' && <Button size="lg" onClick={send}>{job.isInsurance ? 'Send to insurance desk' : `Send for approval (${toSend.length})`}</Button>}
        {(step === 'inspect' || inspecting) && <Button size="lg" variant="neu" href={`/${staff === 'tech' ? 'employee' : 'admin'}/jobs/${job.id}/inspection`}>Open inspection map</Button>}
        {step === 'start_repair' && !job.onHold && <Button size="lg" onClick={begin}><Play className="h-4 w-4" /> Start repair</Button>}
        {step === 'declined' && <Button size="lg" onClick={() => { setJobStage(job.id, 'ready', by); onToast('Car ready to return'); }}>Return car without repair</Button>}
        {step === 'repairing' && (blocked ? <Button size="lg" disabled>Finish repair</Button> : staff === 'tech' ? <Button size="lg" href={`/employee/jobs/${job.id}/checklist`}>Finish repair</Button> : <Button size="lg" onClick={finish}>Finish repair</Button>)}
        {step === 'quality' && (
          <>
            <Button size="lg" onClick={() => { setJobStage(job.id, 'ready', by); onToast('Ready for delivery'); }}><Check className="h-4 w-4" strokeWidth={3} /> Passed, ready for delivery</Button>
            <Button size="lg" variant="neu" onClick={() => { setJobStage(job.id, 'in_repair', by); onToast('Back to repair'); }}>Needs more work</Button>
          </>
        )}
        {step === 'ready' && staff === 'admin' && <Button size="lg" onClick={() => { setJobStage(job.id, 'delivered', by); onToast('Delivered and invoice created'); }}>Mark delivered</Button>}
        {canAdd && <Button size="lg" variant="blue" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> {step === 'repairing' ? 'Found another issue' : 'Add new issue'}</Button>}
        {!compact && step !== 'delivered' && step !== 'ready' && (job.onHold ? <Button size="lg" variant="neu" onClick={() => setJobHold(job.id, undefined, by)}><Play className="h-4 w-4" /> Resume</Button> : <Button size="lg" variant="neu" onClick={() => setHolding(true)}><Pause className="h-4 w-4" /> Hold</Button>)}
      </div>
      {step === 'repairing' && blocked && <p className="mt-2 text-xs text-warn-strong">Finish is locked until every item is sent and decided.</p>}
      {needsInitial && job.approvalAsked && <p className="mt-2 text-xs text-warn-strong">Initial approval request sent. Waiting for the client.</p>}
    </>
  );

  if (compact) return <div className="mb-3">{actions}{dialogs()}</div>;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-medium text-ink-400">Next step</p><h2 className="text-lg font-bold leading-tight">{head.title}</h2><p className="text-sm text-ink-500">{job.onHold ? `On hold: ${job.holdReason ?? 'no reason given'}` : head.text}</p></div>
        {job.checkin && <StatusBadge tone={job.clientApproval ? 'green' : 'amber'} dot>{job.clientApproval ? `Client approved · ${job.clientApproval.method}` : 'Client approval pending'}</StatusBadge>}
      </div>

      {!job.clientApproval && job.checkin && staff === 'admin' && !sent && (
        <div className="neu-in-sm mt-4 flex flex-wrap items-center gap-3 p-3">
          {methodPick}
          <Button variant="soft" onClick={() => { tickClientApproval(job.id, method, by); onToast('Approved by client'); }}><Check className="h-4 w-4" strokeWidth={3} /> Approved by client</Button>
        </div>
      )}

      {est && est.items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {est.items.map((i) => {
            const a = itemApproval(est, i);
            return (
              <li key={i.id} className="neu-row flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1"><span className={clsx('block font-medium', a === 'Declined' && 'text-ink-400 line-through')}>{i.name}</span>{i.reason && <span className="block text-xs text-ink-500">{i.reason}</span>}</span>
                <span className="font-semibold">{inr(i.amount)}</span>
                <StatusBadge tone={TONE[a]}>{toSend.includes(i) ? 'Not sent' : a}</StatusBadge>
                {toSend.includes(i) && <button type="button" aria-label={`Remove ${i.name}`} onClick={() => removeWorkItem(job.id, i.id)} className="btn btn-neu h-9 w-9 shrink-0 !rounded-full text-bad"><Trash2 className="h-4 w-4" /></button>}
              </li>
            );
          })}
        </ul>
      )}

      {sent && !job.isInsurance && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <CircleAlert className="h-4 w-4 text-warn" />
          <span className="flex-1">{inr(estimateTotals(waiting).total)} waiting for the client</span>
          <a className="btn btn-neu h-10 gap-2 px-4 text-sm" href={`https://wa.me/${phone}?text=${encodeURIComponent(ask)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp client</a>
        </div>
      )}
      {sent && staff === 'admin' && (
        <div className="neu-in-sm mt-3 flex flex-wrap items-center gap-3 p-3">
          {!job.isInsurance && methodPick}
          <Button variant="soft" onClick={recordApproval}><Check className="h-4 w-4" strokeWidth={3} /> {job.isInsurance ? 'Approved by insurer' : 'Approved by client'}</Button>
        </div>
      )}

      {actions}
      {dialogs()}
    </Card>
  );
}
