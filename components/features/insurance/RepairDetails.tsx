'use client';

import { useState } from 'react';
import { Button, StatusBadge, Textarea } from '@/components/ui';
import { addNote } from '@/lib/actions';
import { VISIT_REASONS } from '@/lib/catalog';
import { estimateOfJob, inr, itemApproval, km, PHASE_LABEL, PHASES, phaseOf, STAGE_LABEL, userOf, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Job } from '@/lib/types';
import { Section } from './ClaimParts';

const APPROVAL_TONE = { Approved: 'green', Declined: 'red', Pending: 'amber' } as const;
const TASK_TONE = { Completed: 'green', 'In Progress': 'amber', Pending: 'gray' } as const;
const NOTE = 'Note: ';

const Row = ({ k, v }: { k: string; v: string }) => <div><dt className="text-xs text-ink-400">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>;

/** Everything the workshop recorded on the car, so nobody has to leave the claim to answer the insurer. */
export function RepairDetails({ job, by }: { job: Job; by: string }) {
  const db = useDb();
  const [note, setNote] = useState('');
  const c = job.checkin;
  const v = vehicleOf(db, job.vehicleId);
  const est = estimateOfJob(db, job.id);
  const findings = job.points.filter((p) => p.status === 'minor' || p.status === 'major');
  const notes = job.activity.filter((a) => a.text.startsWith(NOTE));
  const history = job.activity.filter((a) => !a.text.startsWith(NOTE));

  return (
    <div className="space-y-5">
      <Section title="Repair details" aside={<StatusBadge tone="blue" size="sm">{STAGE_LABEL[job.stage]}</StatusBadge>}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Row k="Job" v={`#${job.id}`} />
          <Row k="Technician" v={userOf(db, job.techId)?.name ?? '-'} />
          <Row k="Promised delivery" v={job.promised} />
          <Row k="Checked in" v={job.startedLabel} />
          <Row k="Odometer" v={c ? km(c.odometer) : v ? km(v.odometer) : '-'} />
          {c && <Row k="Fuel" v={c.fuel} />}
          {c && <Row k="Brought in by" v={c.broughtBy} />}
          {c && <Row k="Items in car" v={c.belongings.join(', ') || 'None noted'} />}
        </dl>
        {c && (c.reasons.length > 0 || c.issues.length > 0) && <div className="mt-4 flex flex-wrap gap-2">{c.reasons.map((r) => <StatusBadge key={r} tone="blue" size="sm">{VISIT_REASONS.find((x) => x.key === r)?.label}</StatusBadge>)}{c.issues.map((i) => <StatusBadge key={i} tone="amber" size="sm">{i}</StatusBadge>)}</div>}
        {c?.complaint && <p className="neu-in-sm mt-3 p-3 text-sm">&ldquo;{c.complaint}&rdquo;</p>}
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title={`Inspection findings (${findings.length})`}>
          {findings.length === 0 ? <p className="text-sm text-ink-500">No damage marked on the inspection map yet.</p> : (
            <ul className="divide-y divide-ivory-300/70">
              {findings.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{p.label}</p><StatusBadge tone={p.status === 'major' ? 'red' : 'amber'} size="sm">{p.severity}</StatusBadge></div>
                  <p className="text-xs text-ink-500">{p.damage}{p.notes ? ` · ${p.notes}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Repair work">
          {!est || est.items.length === 0 ? <p className="text-sm text-ink-500">No work listed yet.</p> : (
            <ul className="divide-y divide-ivory-300/70">
              {est.items.map((i) => {
                const a = itemApproval(est, i);
                return (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{i.name}</span>{i.reason && <span className="block text-xs text-ink-500">{i.reason}</span>}{i.decidedVia && <span className="block text-xs text-ink-400">{i.decidedVia}</span>}</span>
                    <span className="text-sm font-semibold">{inr(i.amount)}</span>
                    <StatusBadge tone={APPROVAL_TONE[a]} size="sm">{a}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Work progress">
        <div className="grid gap-4 md:grid-cols-3">
          {(job.checkin ? PHASES : (['repair'] as const)).map((p) => {
            const tasks = job.checkin ? job.tasks.filter((t) => phaseOf(t) === p) : job.tasks;
            return (
              <div key={p}>
                {job.checkin && <p className="mb-2 text-sm font-bold">{PHASE_LABEL[p]}</p>}
                {tasks.length === 0 ? <p className="text-sm text-ink-500">No tasks.</p> : (
                  <ul className="space-y-2">{tasks.map((t) => <li key={t.id} className="flex items-center justify-between gap-2 text-sm"><span className="min-w-0">{t.title}</span><StatusBadge tone={TASK_TONE[t.status]} size="sm">{t.status}</StatusBadge></li>)}</ul>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title={`Notes (${notes.length + (job.notes ? 1 : 0)})`}>
          {job.notes && <p className="neu-in-sm mb-3 p-3 text-sm">{job.notes}</p>}
          <ul className="mb-3 space-y-2.5">{notes.map((a) => <li key={a.id}><p className="text-sm">{a.text.slice(NOTE.length)}</p><p className="text-xs text-ink-400">{a.by} · {a.at}</p></li>)}</ul>
          <Textarea aria-label="New note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note about this repair…" className="!min-h-[64px]" />
          <Button size="sm" className="mt-2" disabled={!note.trim()} onClick={() => { addNote(job.id, by, note); setNote(''); }}>Add note</Button>
        </Section>
        <Section title="Job history">
          <ol className="thin-scroll max-h-[320px] space-y-3 overflow-y-auto border-l-2 border-ivory-300 pl-4">{history.map((a) => <li key={a.id}><p className="text-sm">{a.text}</p><p className="text-xs text-ink-400">{a.by} · {a.at}</p></li>)}</ol>
        </Section>
      </div>
    </div>
  );
}

/** The part of the repair record that goes outside the workshop. Staff notes and history stay inside. */
export function RepairBrief({ job }: { job: Job }) {
  const db = useDb();
  const est = estimateOfJob(db, job.id);
  const told = [...(job.checkin?.issues ?? []), job.checkin?.complaint].filter(Boolean).join('. ');
  const findings = job.points.filter((p) => p.status === 'minor' || p.status === 'major');
  const work = est?.items.filter((i) => !i.draft && itemApproval(est, i) !== 'Declined') ?? [];
  return (
    <div className="space-y-2">
      {told && <p><span className="text-ink-400">Reported by customer: </span>{told}</p>}
      {findings.length > 0 && <div><p className="text-ink-400">Inspection findings</p><ul>{findings.map((p) => <li key={p.id}>{p.label}: {p.damage}, {p.severity}{p.notes ? ` (${p.notes})` : ''}</li>)}</ul></div>}
      {work.length > 0 && <div><p className="text-ink-400">Repair work</p><ul>{work.map((i) => <li key={i.id}>{i.name}{i.reason ? `: ${i.reason}` : ''}</li>)}</ul></div>}
      <p><span className="text-ink-400">Job status: </span>{STAGE_LABEL[job.stage]} · {job.tasks.filter((t) => t.status === 'Completed').length}/{job.tasks.length} tasks done</p>
    </div>
  );
}
