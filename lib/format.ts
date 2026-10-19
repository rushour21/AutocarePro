import type { Stage, Vehicle, Job, Db, Part } from './types';

const IN = new Intl.NumberFormat('en-IN');
export const inr = (n: number) => `₹${IN.format(Math.round(n))}`;
export const km = (n: number) => `${IN.format(n)} km`;

export const vehicleName = (v?: Pick<Vehicle, 'make' | 'model'>) => (v ? (v.make === 'Range Rover' ? 'Range Rover' : `${v.make} ${v.model}`) : 'Vehicle');
export const vehicleSub = (v: Vehicle) => `${v.year} · ${v.variant} · ${v.fuel}`;

export const STAGE_LABEL: Record<Stage, string> = {
  pending: 'Pending',
  inspection: 'Inspection',
  diagnostics: 'Diagnostics',
  in_repair: 'In Repair',
  quality_check: 'Quality Check',
  ready: 'Ready for Delivery',
  delivered: 'Completed',
};

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'gray' | 'coral';

/** Status chip colours (My Jobs / job details). */
export const STAGE_TONE: Record<Stage, Tone> = {
  pending: 'red',
  inspection: 'blue',
  diagnostics: 'violet',
  in_repair: 'blue',
  quality_check: 'amber',
  ready: 'green',
  delivered: 'green',
};

/** Workshop board column order (admin Jobs). */
export const BOARD_COLUMNS: { stage: Stage; label: string; tone: Tone }[] = [
  { stage: 'inspection', label: 'Inspection', tone: 'blue' },
  { stage: 'in_repair', label: 'In Repair', tone: 'red' },
  { stage: 'diagnostics', label: 'Diagnostics', tone: 'violet' },
  { stage: 'quality_check', label: 'Quality Check', tone: 'amber' },
  { stage: 'ready', label: 'Ready', tone: 'green' },
];

export const ACTIVE_STAGES: Stage[] = ['pending', 'inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'];
export const isActive = (j: Job) => ACTIVE_STAGES.includes(j.stage);

export const STEP_INDEX: Record<Stage, number> = { pending: -1, inspection: 0, diagnostics: 1, in_repair: 2, quality_check: 3, ready: 4, delivered: 5 };

export const estimateTotals = (items: { amount: number }[]) => {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const gst = Math.round(subtotal * 0.18);
  return { subtotal, gst, total: subtotal + gst };
};

export const isLow = (p: Part) => p.stock <= Math.ceil(p.minStock * 1.2);

export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const customerOf = (db: Db, id: string) => db.customers.find((c) => c.id === id);
export const vehicleOf = (db: Db, id: string) => db.vehicles.find((v) => v.id === id);
export const userOf = (db: Db, id: string) => db.users.find((u) => u.id === id);
export const jobOf = (db: Db, id: string) => db.jobs.find((j) => j.id === id);
export const estimateOfJob = (db: Db, jobId: string) => db.estimates.find((e) => e.jobId === jobId);

export const serviceDueLabel = (days?: number): { label: string; tone: Tone } | null => {
  if (days === undefined) return null;
  if (days < 0) return { label: `Overdue by ${Math.abs(days)} days`, tone: 'red' };
  if (days <= 30) return { label: `Service Due in ${days} days`, tone: 'amber' };
  return null;
};
