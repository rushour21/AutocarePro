import { inr } from './format';
import type { Claim, ClaimDoc, ClaimPhoto, ClaimStatus, Db } from './types';

/** The demo's "today" (matches Db.today). Every claim date is an ISO string relative to this. */
export const TODAY_ISO = '2025-03-16';
export const nowIso = () => `${TODAY_ISO}T${new Date().toTimeString().slice(0, 5)}`;

export const INSURERS = ['ABC General Insurance', 'XYZ General Insurance', 'Sunrise General Insurance'] as const;

/** Claim lifecycle. Reimbursement claims skip "DO Received" (the Delivery Order is a cashless-only step). */
export const CLAIM_FLOW: ClaimStatus[] = [
  'Intimated', 'Docs Pending', 'Estimate Ready', 'Survey Scheduled', 'Surveyed', 'Approved',
  'In Repair', 'Re-inspection', 'DO Received', 'Delivered', 'Payment Pending', 'Settled',
];
export const flowFor = (type: Claim['type']): ClaimStatus[] => (type === 'Cashless' ? CLAIM_FLOW : CLAIM_FLOW.filter((s) => s !== 'DO Received'));

export type ClaimTone = 'gray' | 'amber' | 'blue' | 'violet' | 'green' | 'red' | 'coral';
export const CLAIM_TONE: Record<ClaimStatus, ClaimTone> = {
  Intimated: 'gray', 'Docs Pending': 'amber', 'Estimate Ready': 'blue', 'Survey Scheduled': 'violet', Surveyed: 'violet', Approved: 'green',
  'In Repair': 'blue', 'Re-inspection': 'amber', 'DO Received': 'green', Delivered: 'green', 'Payment Pending': 'coral', Settled: 'green',
};

/**
 * Reference timelines used for the "Overdue" badges. These are illustrative defaults taken from the IRDAI policyholder
 * rules as we understand them; confirm the exact figures with the current regulation before relying on them in production.
 */
export const SLA = { surveyorHours: 24, reportDays: 15, decisionDays: 7 } as const;

export const DOC_DEFS: Pick<ClaimDoc, 'kind' | 'label' | 'required'>[] = [
  { kind: 'policy', label: 'Insurance policy', required: true },
  { kind: 'rc', label: 'Registration certificate (RC)', required: true },
  { kind: 'dl', label: 'Driving licence', required: true },
  { kind: 'claim_form', label: 'Signed claim form', required: true },
  { kind: 'fir', label: 'FIR (if applicable)', required: false },
];

export const PHOTO_DEFS: Pick<ClaimPhoto, 'label' | 'stage'>[] = [
  { label: 'Front', stage: 'Intake' }, { label: 'Rear', stage: 'Intake' }, { label: 'Left side', stage: 'Intake' }, { label: 'Right side', stage: 'Intake' },
  { label: 'Damage close-up 1', stage: 'Intake' }, { label: 'Damage close-up 2', stage: 'Intake' }, { label: 'Odometer', stage: 'Intake' }, { label: 'Chassis no.', stage: 'Intake' },
  { label: 'Replaced parts', stage: 'Old parts' }, { label: 'Damaged panel (removed)', stage: 'Old parts' },
  { label: 'Front (after repair)', stage: 'Final' }, { label: 'Repaired area', stage: 'Final' }, { label: 'Odometer (delivery)', stage: 'Final' },
];

const SAMPLE_PHOTOS = ['bumper', 'bumper-2', 'bumper-3', 'garage-1', 'disc-dark', 'estimate-disc', 'pads-chat', 'disc-orange'].map((n) => `/assets/photos/${n}.jpg`);
export const placeholderPhoto = (i: number) => SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length];

export const newDocs = (): ClaimDoc[] => DOC_DEFS.map((d) => ({ ...d, uploaded: false }));
export const newPhotos = (id: string): ClaimPhoto[] => PHOTO_DEFS.map((p, i) => ({ ...p, id: `${id}-p${i + 1}`, uploaded: false }));

/* ---------------------------------------------------------------- estimate split */
export interface Split {
  total: number;
  covered: number;
  notCovered: number;
  depreciation: number;
  deductible: number;
  insurance: number;
  customer: number;
}

/**
 * Customer share = non-covered items + depreciation on covered parts (skipped for zero-dep policies) + the compulsory deductible.
 * Insurance pays the rest. Deductible and depreciation % are editable per claim.
 */
export function splitOf(c: Pick<Claim, 'lines' | 'deductible' | 'depreciationPct' | 'zeroDep'>): Split {
  const total = c.lines.reduce((s, l) => s + l.amount, 0);
  const covered = c.lines.filter((l) => l.covered).reduce((s, l) => s + l.amount, 0);
  const coveredParts = c.lines.filter((l) => l.covered && l.kind === 'part').reduce((s, l) => s + l.amount, 0);
  const depreciation = c.zeroDep ? 0 : Math.round((coveredParts * c.depreciationPct) / 100);
  const deductible = Math.min(c.deductible, Math.max(0, covered - depreciation));
  const insurance = Math.max(0, covered - depreciation - deductible);
  return { total, covered, notCovered: total - covered, depreciation, deductible, insurance, customer: total - insurance };
}

/** What the insurer is expected to pay: the surveyor's approved amount when there is one, else the calculated share. */
export const expectedFromInsurer = (c: Claim) => c.approvedAmount ?? splitOf(c).insurance;

/* ---------------------------------------------------------------- dates */
const MS_DAY = 86_400_000;
const parse = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00` : iso).getTime();
export const daysBetween = (fromIso: string, toIso = TODAY_ISO) => Math.floor((parse(toIso) - parse(fromIso)) / MS_DAY);
export const hoursBetween = (fromIso: string, toIso: string) => (parse(toIso) - parse(fromIso)) / 3_600_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
export const fmtAt = (iso: string) => {
  if (iso.length <= 10) return fmtDate(iso);
  const h = Number(iso.slice(11, 13));
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}, ${((h + 11) % 12) + 1}:${iso.slice(14, 16)} ${h < 12 ? 'AM' : 'PM'}`;
};

export const daysOpen = (c: Claim) => Math.max(0, daysBetween(c.intimatedAt.slice(0, 10)));

/** Compact rupee amount for headlines: ₹3.2L, ₹48,200 */
export const inrShort = (n: number) => (Math.abs(n) >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L` : inr(n));

/* ---------------------------------------------------------------- SLA badges */
export interface SlaBadge {
  key: string;
  label: string;
  state: 'ok' | 'overdue' | 'late' | 'pending';
  detail: string;
}

/** fixed reference moment, so server and client render the same SLA text */
const now = () => `${TODAY_ISO}T12:00`;

export function slaOf(c: Claim): SlaBadge[] {
  const out: SlaBadge[] = [];
  // 1. surveyor allocated within 24h of intimation
  if (c.surveyorAllocatedAt) {
    const h = hoursBetween(c.intimatedAt, c.surveyorAllocatedAt);
    out.push({ key: 'surveyor', label: 'Surveyor allocation', state: h > SLA.surveyorHours ? 'late' : 'ok', detail: `${Math.round(h)}h after intimation (limit ${SLA.surveyorHours}h)` });
  } else {
    const h = hoursBetween(c.intimatedAt, now());
    out.push({ key: 'surveyor', label: 'Surveyor allocation', state: h > SLA.surveyorHours ? 'overdue' : 'pending', detail: h > SLA.surveyorHours ? `Overdue by ${Math.round(h - SLA.surveyorHours)}h` : `Due within ${Math.max(1, Math.round(SLA.surveyorHours - h))}h` });
  }
  // 2. survey report within 15 days of surveyor allocation
  if (c.surveyorAllocatedAt) {
    if (c.reportAt) {
      const d = daysBetween(c.surveyorAllocatedAt, c.reportAt);
      out.push({ key: 'report', label: 'Survey report', state: d > SLA.reportDays ? 'late' : 'ok', detail: `Received after ${d} days (limit ${SLA.reportDays})` });
    } else {
      const d = daysBetween(c.surveyorAllocatedAt);
      out.push({ key: 'report', label: 'Survey report', state: d > SLA.reportDays ? 'overdue' : 'pending', detail: d > SLA.reportDays ? `Overdue by ${d - SLA.reportDays} days` : `${SLA.reportDays - d} days left` });
    }
  }
  // 3. insurer decision within 7 days of the report
  if (c.reportAt) {
    if (c.decisionAt) {
      const d = daysBetween(c.reportAt, c.decisionAt);
      out.push({ key: 'decision', label: 'Insurer decision', state: d > SLA.decisionDays ? 'late' : 'ok', detail: `Decided after ${d} days (limit ${SLA.decisionDays})` });
    } else {
      const d = daysBetween(c.reportAt);
      out.push({ key: 'decision', label: 'Insurer decision', state: d > SLA.decisionDays ? 'overdue' : 'pending', detail: d > SLA.decisionDays ? `Overdue by ${d - SLA.decisionDays} days` : `${SLA.decisionDays - d} days left` });
    }
  }
  return out;
}
export const isOverdue = (c: Claim) => slaOf(c).some((b) => b.state === 'overdue');

/* ---------------------------------------------------------------- receivables */
/** Insurer money is owed once the claim is approved and until it is settled. */
const OWED: ClaimStatus[] = ['Approved', 'In Repair', 'Re-inspection', 'DO Received', 'Delivered', 'Payment Pending'];
export const isReceivable = (c: Claim) => OWED.includes(c.status);
export const pendingAmount = (c: Claim) => Math.max(0, expectedFromInsurer(c) - c.received);

export interface InsurerRow {
  insurer: string;
  pending: number;
  claims: number;
  oldestDays: number;
  shortPaid: number;
}

export function receivables(claims: Claim[]) {
  const owed = claims.filter(isReceivable);
  const names = [...new Set(claims.map((c) => c.insurer))];
  const rows: InsurerRow[] = names.map((insurer) => {
    const mine = owed.filter((c) => c.insurer === insurer);
    const short = claims.filter((c) => c.insurer === insurer && c.status === 'Settled').reduce((s, c) => s + Math.max(0, expectedFromInsurer(c) - c.received), 0);
    return {
      insurer,
      pending: mine.reduce((s, c) => s + pendingAmount(c), 0),
      claims: mine.length,
      oldestDays: mine.reduce((m, c) => Math.max(m, daysOpen(c)), 0),
      shortPaid: short,
    };
  });
  return {
    rows,
    pending: owed.reduce((s, c) => s + pendingAmount(c), 0),
    claims: owed.length,
    oldestDays: owed.reduce((m, c) => Math.max(m, daysOpen(c)), 0),
    owed,
  };
}

export const claimOfJob = (db: Db, jobId: string) => db.claims.find((c) => c.jobId === jobId);

export const missingDocs = (c: Claim) => c.docs.filter((d) => d.required && !d.uploaded);
