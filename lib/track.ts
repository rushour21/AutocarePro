import { estimateOfJob, itemApproval, phaseOf, quotedItems, STEP_INDEX, estimateTotals } from './format';
import type { Db, Estimate, Job, Stage } from './types';

/**
 * Customer-facing view model for the private share link. Everything the link renders passes through here,
 * so internal fields (job.notes, activity log, other customers, staff phone numbers) never leave the workshop.
 */

export type GalleryGroup = 'Inspection' | 'During Service' | 'Parts' | 'Complete';
export interface GalleryItem {
  src: string;
  title: string;
  at: string;
  groups: GalleryGroup[];
  /** only visible once the job has reached this stage */
  minStep?: number;
}

const ph = (n: number) => `/assets/share/ph-${n}.jpg`;

const BRAKE_GALLERY: GalleryItem[] = [
  { src: ph(1), title: 'Front brake disc (old)', at: '10 Mar 2025, 11:20 AM', groups: ['Inspection', 'Parts'] },
  { src: ph(2), title: 'Front brake disc (new)', at: '13 Mar 2025, 11:35 AM', groups: ['During Service', 'Parts'] },
  { src: ph(3), title: 'Brake pads (old)', at: '10 Mar 2025, 11:40 AM', groups: ['Inspection', 'Parts'] },
  { src: ph(4), title: 'Brake pads (new)', at: '13 Mar 2025, 12:10 PM', groups: ['During Service', 'Parts'] },
  { src: ph(5), title: 'Wheel inspection', at: '10 Mar 2025, 12:20 PM', groups: ['Inspection'] },
  { src: ph(6), title: 'Underbody check', at: '10 Mar 2025, 12:35 PM', groups: ['Inspection'] },
  { src: ph(7), title: 'Parts replacement', at: '13 Mar 2025, 01:10 PM', groups: ['During Service'] },
  { src: ph(8), title: 'Final inspection', at: '15 Mar 2025, 03:15 PM', groups: ['Complete'], minStep: 4 },
];

const datePart = (s: string) => s.split(',')[0];
const withYear = (s?: string) => (s ? s.replace(/^(\d+ \w+) (?=\d)/, '$1 2025, ') : undefined);

export interface TrackInfo {
  bookedAt: string;
  receivedAt: string;
  inspectedAt: string;
  estimateSentAt: string;
  repairAt?: string;
  qcAt?: string;
  readyAt?: string;
  complaint: string;
  updatedAgo: string;
  completedOn: string;
  nextService: string;
  gallery: GalleryItem[];
}

export function trackInfo(db: Db, job: Job): TrackInfo {
  const date = datePart(job.startedLabel);
  // sample content belongs to the seeded brake jobs only
  const brake = job.serviceCategory === 'brake' && !job.checkin;
  const told = job.checkin ? [...job.checkin.issues, job.checkin.complaint].filter(Boolean).join('. ') : '';
  const photos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const gallery = brake
    ? BRAKE_GALLERY.filter((g) => STEP_INDEX[job.stage] >= (g.minStep ?? 0))
    : photos.map((src, i) => ({ src, title: `Photo ${i + 1}`, at: job.startedLabel, groups: ['Inspection'] as GalleryGroup[] }));
  void db;
  return {
    bookedAt: job.checkin ? job.startedLabel : `${date}, 9:30 AM`,
    receivedAt: job.startedLabel,
    inspectedAt: job.checkin ? withYear(job.timeline.inspection) ?? '' : `${date}, 11:00 AM`,
    estimateSentAt: job.checkin ? '' : `${date}, 11:30 AM`,
    repairAt: withYear(job.timeline.repair),
    qcAt: withYear(job.timeline.quality),
    readyAt: job.completedOn ? `${job.completedOn}, 4:30 PM` : undefined,
    complaint: told || (brake ? 'Customer reported brake noise while applying brakes at low speed.' : `Customer requested ${job.service.toLowerCase()}.`),
    updatedAgo: job.stage === 'delivered' ? 'Completed' : 'Updated 2 hours ago',
    completedOn: job.completedOn ? `${job.completedOn}, 4:30 PM` : `${job.estCompletionDate.split(',')[0]}, 4:30 PM`,
    nextService: 'In 8,000 km or 6 months',
    gallery,
  };
}

/* ---------------------------------------------------------------- timeline */
export interface TimelineEntry {
  label: string;
  at?: string;
  state: 'done' | 'current' | 'pending';
  badge?: { text: string; tone: 'green' | 'amber' | 'red' | 'coral' | 'link' };
  bullets?: string[];
}

const bulletFor = (title: string, status: string) => {
  const r = title.match(/^Replace (.+)$/i);
  const base = r ? `${r[1][0].toUpperCase()}${r[1].slice(1)} replaced` : /replacement$/i.test(title) ? `${title.replace(/ replacement$/i, '')} replaced` : `${title} done`;
  return status === 'In Progress' ? `${base.replace(/ (replaced|done)$/, '')} — in progress` : base;
};

const APPROVAL_TEXT = { Approved: 'approved', Declined: 'declined', Pending: 'waiting for your approval' };

function checkInTimeline(db: Db, job: Job): TimelineEntry[] {
  const info = trackInfo(db, job);
  const step = STEP_INDEX[job.stage];
  const est = estimateOfJob(db, job.id);
  const extras = est?.status === 'Draft' ? [] : est?.items.filter((i) => i.extra) ?? [];
  const waiting = !!est && est.status === 'Awaiting Approval' && !job.isInsurance;
  const worked = job.tasks.filter((t) => t.status !== 'Pending' && phaseOf(t) === 'repair').map((t) => bulletFor(t.title, t.status)).slice(0, 5);
  const approved = !!job.clientApproval || !!job.timeline.approval;
  return [
    { label: 'Vehicle Received', at: job.startedLabel, state: 'done', bullets: job.checkin?.issues.length ? job.checkin.issues : undefined },
    { label: 'Initial Approval', at: job.clientApproval ? `${job.clientApproval.at} · ${job.clientApproval.method}` : undefined, state: approved ? 'done' : 'current', badge: approved ? { text: 'Approved', tone: 'green' } : { text: 'Pending', tone: 'amber' } },
    { label: 'Inspection', at: info.inspectedAt, state: step >= 1 ? 'done' : step === 0 ? 'current' : 'pending', badge: step >= 1 ? { text: 'View Report', tone: 'link' } : undefined },
    ...(extras.length ? [{ label: 'Additional Work', state: waiting ? ('current' as const) : ('done' as const), badge: waiting ? { text: 'Needs Approval', tone: 'amber' as const } : undefined, bullets: extras.map((i) => `${i.name}: ${APPROVAL_TEXT[itemApproval(est!, i)]}`) }] : []),
    { label: 'In Repair', at: info.repairAt, state: step === 2 ? 'current' : step > 2 ? 'done' : 'pending', bullets: step >= 2 ? worked : undefined },
    { label: 'Quality Check', at: info.qcAt, state: step === 3 ? 'current' : step > 3 ? 'done' : 'pending' },
    { label: 'Ready for Delivery', state: step >= 4 ? 'done' : 'pending' },
  ];
}

export function buildTimeline(db: Db, job: Job): TimelineEntry[] {
  if (job.checkin) return checkInTimeline(db, job);
  const info = trackInfo(db, job);
  const step = STEP_INDEX[job.stage];
  const est = estimateOfJob(db, job.id);
  const bullets = job.tasks.filter((t) => t.status !== 'Pending').map((t) => bulletFor(t.title, t.status)).slice(0, 5);
  const estBadge: TimelineEntry['badge'] | undefined = est
    ? est.status === 'Approved' ? { text: 'Approved', tone: 'green' } : est.status === 'Rejected' ? { text: 'Rejected', tone: 'red' } : { text: 'Awaiting Approval', tone: 'amber' }
    : undefined;
  return [
    { label: 'Booking Confirmed', at: info.bookedAt, state: 'done' },
    { label: 'Vehicle Received', at: info.receivedAt, state: step >= 0 ? 'done' : 'pending' },
    { label: 'Inspection Completed', at: info.inspectedAt, state: step >= 1 ? 'done' : 'pending', badge: step >= 1 ? { text: 'View Report', tone: 'link' } : undefined },
    { label: 'Estimate Sent', at: info.estimateSentAt, state: est && est.status !== 'Draft' ? 'done' : 'pending', badge: est && est.status !== 'Draft' ? estBadge : undefined },
    { label: 'In Repair', at: info.repairAt, state: step === 2 ? 'current' : step > 2 ? 'done' : 'pending', bullets: step >= 2 ? bullets : undefined },
    { label: 'Quality Check', at: info.qcAt, state: step === 3 ? 'current' : step > 3 ? 'done' : 'pending', badge: step < 3 ? { text: 'Pending', tone: 'coral' } : undefined },
    { label: 'Ready for Delivery', at: info.readyAt, state: step >= 4 ? 'done' : 'pending', badge: step < 4 ? { text: 'Pending', tone: 'coral' } : undefined },
  ];
}

/* ---------------------------------------------------------------- inspection findings */
export interface Finding {
  label: string;
  state: 'bad' | 'warn' | 'good';
  lines: { text: string; chip?: boolean }[];
}

/** Findings as recorded at the inspection (a snapshot: repairs are shown in the timeline, not here). */
export function findingsFor(job: Job): Finding[] {
  if (job.serviceCategory === 'brake' && !job.checkin) {
    return [
      { label: 'Front Brake Pads', state: 'bad', lines: [{ text: 'Worn' }, { text: 'Needs Replacement', chip: true }] },
      { label: 'Front Brake Disc', state: 'bad', lines: [{ text: 'Worn' }, { text: 'Needs Replacement', chip: true }] },
      { label: 'Rear Brake Pads', state: 'good', lines: [{ text: 'Good' }] },
      { label: 'Rear Brake Disc', state: 'good', lines: [{ text: 'Good' }] },
      { label: 'Suspension', state: 'good', lines: [{ text: 'No Issues' }] },
      { label: 'Engine', state: 'good', lines: [{ text: 'No Issues' }] },
    ];
  }
  const issues: Finding[] = job.points
    .filter((p) => p.status === 'major' || p.status === 'minor')
    .map((p) => ({ label: p.label, state: p.status === 'major' ? ('bad' as const) : ('warn' as const), lines: [{ text: p.damage }, { text: p.status === 'major' ? 'Needs Attention' : 'Minor Issue', chip: true }] }));
  if (job.checkin) return issues;
  return [
    ...issues.slice(0, 4),
    { label: 'Suspension', state: 'good', lines: [{ text: 'No Issues' }] },
    { label: 'Engine', state: 'good', lines: [{ text: 'No Issues' }] },
  ];
}

/* ---------------------------------------------------------------- estimate / invoice */
export interface Line {
  name: string;
  type: string;
  qty: number;
  price: number;
  amount: number;
}
export const estimateLines = (e: Estimate): Line[] => quotedItems(e).map((i) => ({ name: i.name.replace(' (Front)', ''), type: i.type === 'Labour' ? 'Labour' : 'Parts', qty: i.qty ?? 1, price: Math.round(i.amount / (i.qty ?? 1)), amount: i.amount }));

export function invoiceBreakdown(db: Db, jobId: string, total: number) {
  const est = estimateOfJob(db, jobId);
  if (est) {
    const items = quotedItems(est);
    const t = estimateTotals(items);
    const parts = items.filter((i) => i.category === 'Parts' && !/consumable/i.test(i.name)).reduce((s, i) => s + i.amount, 0);
    const labour = items.filter((i) => i.category === 'Labour').reduce((s, i) => s + i.amount, 0);
    const cons = items.filter((i) => /consumable/i.test(i.name)).reduce((s, i) => s + i.amount, 0);
    const partNames = items.filter((i) => i.category === 'Parts' && !/consumable/i.test(i.name)).map((i) => i.name.replace(/ \(.*\)/, '').replace('Brake ', '')).join(', ');
    return { rows: [{ d: `Parts (${partNames})`, a: parts }, { d: 'Labour', a: labour }, ...(cons ? [{ d: 'Consumables', a: cons }] : [])], subtotal: t.subtotal, gst: t.gst, total: t.total };
  }
  const subtotal = Math.round(total / 1.18);
  return { rows: [{ d: 'Service charges', a: subtotal }], subtotal, gst: total - subtotal, total };
}

export const STAGE_HEADLINE: Record<Stage, { title: string; text: string }> = {
  pending: { title: 'is Scheduled', text: 'Your vehicle is booked in. We will start as soon as it arrives.' },
  inspection: { title: 'is Being Inspected', text: 'Our team is inspecting your vehicle.' },
  diagnostics: { title: 'is Being Diagnosed', text: 'Our team is diagnosing your vehicle.' },
  in_repair: { title: 'Service is in Progress', text: 'Our team is working on your vehicle.' },
  quality_check: { title: 'is in Quality Check', text: 'Your vehicle is going through its final quality check.' },
  ready: { title: 'is Ready', text: 'Your vehicle is ready for pickup.' },
  delivered: { title: 'Service is Complete', text: 'Your vehicle has been delivered.' },
};
