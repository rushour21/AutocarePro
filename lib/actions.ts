import { mutate, getDb } from './store';
import { estimateTotals, STAGE_LABEL, STEP_INDEX } from './format';
import type { Booking, Customer, Estimate, EstimateItem, Garage, InspectionPoint, Job, PartRequest, RequestStatus, Stage, TaskStatus, User, Vehicle, Invoice, WorkshopLayout } from './types';
import { createSeed } from './seed';
import { CLAIM_FLOW, INSURERS, TODAY_ISO, expectedFromInsurer, newDocs, newPhotos, nowIso, placeholderPhoto, splitOf } from './insurance';
import type { Claim, ClaimDocKind, ClaimLine, ClaimStatus } from './types';
import { cloneLayout, validateLayout } from './layout';

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const NOW = () => '16 Mar 2025, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
const SHORT = () => '16 Mar ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

const log = (j: Job, by: string, text: string) => j.activity.unshift({ id: uid('a'), at: NOW(), by, text });

// ------------------------------------------------------------------ jobs
export function setJobStage(jobId: string, stage: Stage, by = 'Team') {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j || j.stage === stage) return;
    const from = j.stage;
    j.stage = stage;
    const step = STEP_INDEX[stage];
    if (step >= 0 && !j.timeline.inspection) j.timeline.inspection = SHORT();
    if (step >= 2 && !j.timeline.approval) j.timeline.approval = SHORT();
    if (step >= 2 && !j.timeline.repair) j.timeline.repair = SHORT();
    if (step >= 3 && !j.timeline.quality) j.timeline.quality = SHORT();
    if (step >= 4 && !j.timeline.delivery) j.timeline.delivery = undefined;
    if (stage === 'ready') j.progress = 100;
    if (stage === 'quality_check') j.progress = Math.max(j.progress, 90);
    if (stage === 'in_repair') j.progress = Math.max(j.progress, 40);
    if (stage === 'delivered') {
      j.progress = 100;
      j.bayId = undefined;
      j.completedOn = '16 Mar 2025';
      j.completedInDays = 0;
      j.timeline.delivery = SHORT();
      const est = d.estimates.find((e) => e.jobId === j.id && e.status === 'Approved');
      const amount = est ? estimateTotals(est.items).total : 0;
      if (!d.invoices.some((i) => i.jobId === j.id)) {
        const n = Math.max(...d.invoices.map((i) => Number(i.id.replace('INV-', '')))) + 1;
        const inv: Invoice = { id: `INV-${n}`, customerId: j.customerId, vehicleId: j.vehicleId, jobId: j.id, amount, date: '16 Mar 2025', status: 'Pending' };
        d.invoices.unshift(inv);
      }
    }
    log(j, by, `Status changed from ${STAGE_LABEL[from]} to ${STAGE_LABEL[stage]}`);
    const v = d.vehicles.find((x) => x.id === j.vehicleId);
    const vname = v ? `${v.make} ${v.model}` : 'Vehicle';
    if (['in_repair', 'ready', 'quality_check', 'inspection', 'delivered'].includes(stage)) {
      d.notifications.unshift({
        id: uid('n'), customerId: j.customerId, read: false, ago: 'Just now', href: `/customer/jobs/${j.id}`,
        kind: stage === 'ready' ? 'ready' : 'service',
        title: stage === 'ready' ? 'Your vehicle is ready for delivery' : stage === 'delivered' ? 'Your vehicle has been delivered' : `Your vehicle is in ${STAGE_LABEL[stage]}`,
        sub: vname,
      });
    }
  });
}

export function assignBay(jobId: string, bayId: string | undefined): { ok: boolean; error?: string } {
  const d = getDb();
  if (bayId) {
    const bay = d.garage.bays.find((b) => b.id === bayId);
    if (!bay) return { ok: false, error: 'That bay no longer exists.' };
    const occupant = d.jobs.find((j) => j.bayId === bayId && j.id !== jobId && j.stage !== 'delivered');
    if (occupant) return { ok: false, error: `${bay.name} is already occupied by #${occupant.id}.` };
    const current = d.jobs.find((j) => j.id === jobId)?.bayId === bayId;
    if (!current && !bay.active) return { ok: false, error: `${bay.name} is inactive and cannot take new jobs.` };
    if (!current && bay.state === 'maintenance') return { ok: false, error: `${bay.name} is under maintenance.` };
  }
  mutate((x) => {
    const j = x.jobs.find((y) => y.id === jobId);
    if (!j) return;
    j.bayId = bayId;
    log(j, 'Team', bayId ? `Assigned to ${x.garage.bays.find((b) => b.id === bayId)?.name ?? 'bay'}` : 'Removed from bay');
  });
  return { ok: true };
}

export function updateJob(jobId: string, patch: Partial<Job>) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) Object.assign(j, patch);
  });
}

export function reassignJob(jobId: string, techId: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.techId = techId;
    log(j, 'Admin', `Assigned to ${d.users.find((u) => u.id === techId)?.name ?? 'technician'}`);
  });
}

export interface NewJobInput {
  vehicleId: string;
  service: string;
  category: Job['serviceCategory'];
  priority: Job['priority'];
  techId: string;
  notes?: string;
  dueIn?: number;
  by?: string;
  /** check-in inspection recorded in the New Job wizard */
  points?: InspectionPoint[];
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WKD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** `today` is the demo date label, e.g. "Mon, 16 Mar 2025"; returns the label `days` later. */
function dateAfter(today: string, days: number) {
  const m = today.match(/(\d+) (\w+) (\d{4})/);
  const base = m ? new Date(Date.UTC(Number(m[3]), MON.indexOf(m[2]), Number(m[1]))) : new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return { wd: WKD[base.getUTCDay()], d: base.getUTCDate(), mon: MON[base.getUTCMonth()], y: base.getUTCFullYear() };
}

/** An inspection with every point unchecked: the starting state for a new job. */
export function blankPoints(): InspectionPoint[] {
  const tpl = createSeed().jobs.find((j) => j.id === 'J1020')!;
  return tpl.points.map((p) => ({ ...p, status: 'unchecked' as const, notes: '', photos: [] }));
}

export function createJob(input: NewJobInput): string {
  let id = '';
  mutate((d) => {
    const n = Math.max(...d.jobs.map((j) => Number(j.id.replace('J', '')))) + 1;
    id = `J${n}`;
    const v = d.vehicles.find((x) => x.id === input.vehicleId)!;
    const seed = createSeed().jobs.find((j) => j.id === 'J1020')!; // blank templates for tasks/checklist/points
    const cat = (['brake', 'service', 'body', 'ac'].includes(input.category) ? input.category : 'service') as Job['serviceCategory'];
    const dueIn = input.dueIn ?? 4;
    const due = dateAfter(d.today, dueIn);
    // next free window on the technician's calendar, so the job shows up in Calendar and Today's Schedule
    const taken = d.jobs.filter((x) => x.techId === input.techId && x.slot && x.stage !== 'delivered').map((x) => x.slot!.end);
    const start = Math.min(17, Math.max(9, Math.ceil(Math.max(0, ...taken) * 4) / 4));
    const slot: Job['slot'] = { x0: 0.05, x1: Math.min(5, dueIn + 0.95), start, end: start + 1.5 };
    const tpl = createSeed().jobs.find((j) => j.serviceCategory === cat && j.stage === 'pending') ?? seed;
    const job: Job = {
      ...structuredClone(tpl),
      id, vehicleId: v.id, customerId: v.customerId, techId: input.techId, stage: 'pending', priority: input.priority, progress: 0,
      service: input.service, serviceCategory: cat, bayId: undefined, elapsed: undefined, startedLabel: NOW(),
      estCompletion: `${due.wd}, ${due.d} ${due.mon} ${due.y}`, estCompletionDate: `${due.d} ${due.mon} ${due.y}, 6:00 PM`, promised: `${due.wd}, ${due.d} ${due.mon} ${due.y}, 05:00 PM`, dueLabel: `${due.d} ${due.mon} ${due.y}, 5:00 PM`,
      dueIn: dueIn, delivery: undefined, delayed: false, notes: input.notes ?? '', slot,
      trackingToken: `trk_${id.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
      timeline: { inspection: undefined, approval: undefined, repair: undefined, quality: undefined, delivery: undefined },
      activity: [{ id: uid('a'), at: NOW(), by: input.by ?? 'Admin', text: 'Job created' }],
      photos: [], completedOn: undefined, completedInDays: undefined,
    };
    if (cat === 'service' && input.service !== 'General Service') {
      job.tasks = ['Inspect & diagnose', input.service, 'Road test & quality check', 'Final inspection'].map((title) => ({ id: uid('t'), title, status: 'Pending' as const }));
    }
    job.points = input.points ? structuredClone(input.points) : blankPoints();
    const flagged = job.points.filter((p) => p.status === 'minor' || p.status === 'major').length;
    if (flagged) job.activity.unshift({ id: uid('a'), at: NOW(), by: input.by ?? 'Admin', text: `Check-in inspection: ${flagged} ${flagged === 1 ? 'area' : 'areas'} flagged` });
    job.checklist = job.checklist.map((c) => ({ ...c, done: false }));
    d.jobs.unshift(job);
    d.notifications.unshift({ id: uid('n'), customerId: v.customerId, kind: 'service', read: false, ago: 'Just now', href: `/customer/jobs/${id}`, title: 'Your vehicle has been booked in', sub: `${v.make} ${v.model} · ${input.service}` });
  });
  return id;
}

export function setTaskStatus(jobId: string, taskId: string, status: TaskStatus) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    const t = j?.tasks.find((x) => x.id === taskId);
    if (!j || !t) return;
    t.status = status;
    log(j, 'Team', `Task "${t.title}" marked ${status}`);
  });
}

export function addTask(jobId: string, title: string) {
  if (!title.trim()) return;
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) j.tasks.push({ id: uid('t'), title: title.trim(), status: 'Pending' });
  });
}

export function toggleChecklist(jobId: string, itemId: string) {
  mutate((d) => {
    const c = d.jobs.find((x) => x.id === jobId)?.checklist.find((i) => i.id === itemId);
    if (c) c.done = !c.done;
  });
}

export function completeChecklist(jobId: string, by: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.checklist.forEach((c) => (c.done = true));
    j.tasks.forEach((t) => (t.status = 'Completed'));
    log(j, by, `${j.checklistName} completed`);
  });
  setJobStage(jobId, 'quality_check', by);
}

export function setJobNotes(jobId: string, notes: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) j.notes = notes;
  });
}

export function addJobPhoto(jobId: string, url: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) j.photos.push(url);
  });
}

export function rotateTrackingToken(jobId: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) j.trackingToken = `trk_${jobId.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
  });
}

// ------------------------------------------------------------------ inspection
export function setPoint(jobId: string, pointId: string, patch: Partial<InspectionPoint>, by = 'Team') {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    const p = j?.points.find((x) => x.id === pointId);
    if (!j || !p) return;
    Object.assign(p, patch);
    if (patch.status || patch.severity) log(j, by, `Inspection updated: ${p.label}`);
  });
}

export function addPointPhoto(jobId: string, pointId: string, url: string) {
  mutate((d) => {
    d.jobs.find((x) => x.id === jobId)?.points.find((x) => x.id === pointId)?.photos.push(url);
  });
}

// ------------------------------------------------------------------ estimates / invoices
export function updateEstimate(id: string, items: EstimateItem[]) {
  mutate((d) => {
    const e = d.estimates.find((x) => x.id === id);
    if (e) e.items = items;
  });
}

export function createEstimate(jobId: string): string {
  let id = '';
  mutate((d) => {
    const n = Math.max(...d.estimates.map((e) => Number(e.id.replace('EST-', '')))) + 1;
    id = `EST-${n}`;
    const e: Estimate = { id, jobId, status: 'Draft', sentHoursAgo: 0, why: '', items: [{ id: uid('i'), name: 'Labour', category: 'Labour', type: 'Labour', amount: 0 }] };
    d.estimates.unshift(e);
  });
  return id;
}

export function sendEstimate(id: string) {
  mutate((d) => {
    const e = d.estimates.find((x) => x.id === id);
    if (!e) return;
    e.status = 'Awaiting Approval';
    e.sentHoursAgo = 0;
    const j = d.jobs.find((x) => x.id === e.jobId);
    if (!j) return;
    log(j, 'Admin', `Estimate ${e.id} sent to customer`);
    const v = d.vehicles.find((x) => x.id === j.vehicleId);
    d.notifications.unshift({ id: uid('n'), customerId: j.customerId, kind: 'estimate', title: `Estimate ${e.id} awaiting approval`, sub: v ? `${v.make} ${v.model}` : '', ago: 'Just now', read: false, href: `/customer/estimates/${e.id}` });
  });
}

export function decideEstimate(id: string, decision: 'Approved' | 'Rejected', by: string) {
  mutate((d) => {
    const e = d.estimates.find((x) => x.id === id);
    if (!e) return;
    e.status = decision;
    const j = d.jobs.find((x) => x.id === e.jobId);
    if (!j) return;
    log(j, by, `Estimate ${e.id} ${decision.toLowerCase()}`);
    if (decision === 'Approved' && (j.stage === 'diagnostics' || j.stage === 'inspection' || j.stage === 'pending')) {
      j.stage = 'in_repair';
      j.progress = Math.max(j.progress, 40);
      j.timeline.approval = SHORT();
      j.timeline.repair = SHORT();
    }
  });
}

export function payInvoice(id: string) {
  mutate((d) => {
    const i = d.invoices.find((x) => x.id === id);
    if (!i || i.status === 'Paid') return;
    i.status = 'Paid';
    i.paidOn = '16 Mar 2025, ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    i.method = 'UPI';
    i.txnId = `UPI${Date.now().toString().slice(-10)}`;
    d.notifications.unshift({ id: uid('n'), customerId: i.customerId, kind: 'payment', title: 'Payment received', sub: `Invoice ${i.id}`, ago: 'Just now', read: false, href: '/customer/invoices' });
    const c = d.customers.find((x) => x.id === i.customerId);
    if (c) c.totalSpent += i.amount;
  });
}

// ------------------------------------------------------------------ inventory & parts
export function requestPart(input: { partName: string; jobId: string; qty: number; by: string }) {
  mutate((d) => {
    const r: PartRequest = { id: uid('pr'), partName: input.partName, jobId: input.jobId, qty: input.qty, status: 'Pending', requestedBy: input.by, at: '16 Mar 2025' };
    d.partRequests.unshift(r);
    const j = d.jobs.find((x) => x.id === input.jobId);
    if (j) log(j, d.users.find((u) => u.id === input.by)?.name ?? 'Team', `Requested ${input.qty} × ${input.partName}`);
  });
}

export function decidePartRequest(id: string, status: Exclude<RequestStatus, 'Pending'>) {
  mutate((d) => {
    const r = d.partRequests.find((x) => x.id === id);
    if (!r || r.status !== 'Pending') return;
    r.status = status;
    if (status === 'Approved') {
      const p = d.inventory.find((x) => x.name === r.partName);
      if (p) p.stock = Math.max(0, p.stock - r.qty);
    }
  });
}

export function addPart(p: { name: string; category: string; stock: number; minStock: number }) {
  mutate((d) => {
    d.inventory.push({ id: uid('p'), ...p });
  });
}

// ------------------------------------------------------------------ people
export function addCustomer(c: { name: string; phone: string; email?: string }): string {
  const id = uid('c');
  mutate((d) => {
    const cu: Customer = { id, name: c.name, phone: c.phone, email: c.email ?? '', avatar: '', totalSpent: 0, lastService: '—' };
    d.customers.unshift(cu);
  });
  return id;
}

export function addVehicle(v: Omit<Vehicle, 'id'>): string {
  const id = uid('v');
  mutate((d) => {
    d.vehicles.unshift({ id, ...v });
  });
  return id;
}

export function addMember(u: { name: string; title: string; email: string; phone: string }) {
  mutate((d) => {
    const n = d.users.filter((x) => x.empId).length + 101;
    const user: User = { id: uid('u'), role: 'technician', password: 'tech123', avatar: '/assets/avatars/c-vikram-iyer.png', online: false, empId: `EMP-${n}`, joined: '16 Mar 2025', ...u };
    d.users.push(user);
  });
}

export function updateUser(id: string, patch: Partial<User>) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === id);
    if (u) Object.assign(u, patch);
  });
}

export function setPref(userId: string, key: string, value: boolean | string) {
  mutate((d) => {
    d.prefs[userId] = { ...(d.prefs[userId] ?? {}), [key]: value };
  });
}

export function saveGarage(patch: Partial<Garage>) {
  mutate((d) => {
    Object.assign(d.garage, patch);
  });
}

// ------------------------------------------------------------------ chat & notifications
export function sendMessage(channelId: string, from: string, text: string) {
  if (!text.trim()) return;
  mutate((d) => {
    d.messages.push({ id: uid('m'), channelId, from, at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(), text: text.trim() });
    const ch = d.channels.find((c) => c.id === channelId);
    if (ch) {
      ch.last = text.trim();
      ch.lastAt = 'Now';
      ch.unread = 0;
    }
  });
}

export function markChannelRead(channelId: string) {
  mutate((d) => {
    const ch = d.channels.find((c) => c.id === channelId);
    if (ch) ch.unread = 0;
  });
}

export function reactToMessage(id: string, emoji: string) {
  mutate((d) => {
    const m = d.messages.find((x) => x.id === id);
    if (!m) return;
    m.reactions = m.reactions ?? [];
    const r = m.reactions.find((x) => x.emoji === emoji);
    if (r) r.count += 1;
    else m.reactions.push({ emoji, count: 1 });
  });
}

export function markNotificationRead(id: string) {
  mutate((d) => {
    const n = d.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
}

export function markAllNotificationsRead(customerId: string) {
  mutate((d) => {
    d.notifications.filter((n) => n.customerId === customerId).forEach((n) => (n.read = true));
  });
}

// ------------------------------------------------------------------ customer booking
export function bookService(b: Omit<Booking, 'id' | 'status'>): string {
  let jobId = '';
  mutate((d) => {
    const booking: Booking = { id: uid('bk'), status: 'Requested', ...b };
    d.bookings.unshift(booking);
  });
  const d = getDb();
  const techs = d.users.filter((u) => u.role === 'technician' && u.title === 'Technician');
  const load = (id: string) => d.jobs.filter((j) => j.techId === id && j.stage !== 'delivered').length;
  const tech = techs.sort((a, c) => load(a.id) - load(c.id))[0];
  const cat = /brake/i.test(b.service) ? 'brake' : /ac/i.test(b.service) ? 'ac' : /body|detail/i.test(b.service) ? 'body' : 'service';
  jobId = createJob({ vehicleId: b.vehicleId, service: b.service, category: cat, priority: 'Medium', techId: tech.id, notes: `Booked online for ${b.date}, ${b.time}`, by: 'Customer booking' });
  return jobId;
}

export function resetDemo() {
  mutate((d) => {
    Object.assign(d, createSeed());
  });
}

export function addNote(jobId: string, by: string, text: string) {
  if (!text.trim()) return;
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) log(j, by, `Note: ${text.trim()}`);
  });
}

// ------------------------------------------------------------------ workshop layout (draft -> publish)
export function saveLayoutDraft(layout: WorkshopLayout) {
  mutate((d) => {
    d.garage.draft = { ...cloneLayout(layout), baseVersion: d.garage.layoutVersion, savedAt: new Date().toISOString() };
  });
}

export function discardLayoutDraft() {
  mutate((d) => {
    delete d.garage.draft;
  });
}

/**
 * Publish a layout to the live dashboard. Everything is re-validated here (not only in the editor), and a bay
 * that still has an active job cannot be removed.
 */
export function publishLayout(layout: WorkshopLayout): { ok: boolean; errors: string[] } {
  const d = getDb();
  const errors = validateLayout(layout).filter((i) => i.level === 'error').map((i) => i.message);
  const keep = new Set(layout.bays.map((b) => b.id));
  d.garage.bays.forEach((b) => {
    const j = d.jobs.find((x) => x.bayId === b.id && x.stage !== 'delivered');
    if (j && !keep.has(b.id)) errors.push(`${b.name} still has job #${j.id}. Move the job first, or deactivate the bay instead of removing it.`);
  });
  if (d.garage.draft && d.garage.draft.baseVersion !== d.garage.layoutVersion) errors.push('The published layout changed since this draft was started. Discard the draft and start again.');
  if (errors.length) return { ok: false, errors };
  mutate((x) => {
    const l = cloneLayout(layout);
    x.garage.plan = l.plan;
    x.garage.bays = l.bays;
    x.garage.fixtures = l.fixtures;
    x.garage.layoutVersion += 1;
    x.garage.publishedAt = new Date().toISOString();
    delete x.garage.draft;
  });
  return { ok: true, errors: [] };
}

export function setOnHold(jobId: string, onHold: boolean, by: string) {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.onHold = onHold;
    log(j, by, onHold ? 'Job put on hold' : 'Job resumed');
  });
}

export function changePassword(userId: string, current: string, next: string): { ok: boolean; error?: string } {
  const u = getDb().users.find((x) => x.id === userId);
  if (!u) return { ok: false, error: 'Account not found.' };
  if (u.password !== current) return { ok: false, error: 'Current password is incorrect.' };
  if (next.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
  mutate((d) => {
    const x = d.users.find((y) => y.id === userId);
    if (x) x.password = next;
  });
  return { ok: true };
}

export function updateCustomerProfile(userId: string, patch: { name: string; email: string; phone: string; location: string }) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) return;
    u.name = patch.name;
    u.email = patch.email;
    u.phone = patch.phone;
    u.location = patch.location;
    const c = d.customers.find((x) => x.id === u.customerId);
    if (c) {
      c.name = patch.name;
      c.email = patch.email;
      c.phone = patch.phone;
    }
  });
}

export function submitFeedback(jobId: string, rating: number, comment: string) {
  if (rating < 1 || rating > 5) return;
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.feedback = { rating, comment: comment.trim(), at: '16 Mar 2025' };
    log(j, 'Customer', `Left ${rating}-star feedback${comment.trim() ? `: ${comment.trim()}` : ''}`);
  });
}

export function requestEstimateChanges(estimateId: string, message: string, by: string) {
  mutate((d) => {
    const e = d.estimates.find((x) => x.id === estimateId);
    const j = e && d.jobs.find((x) => x.id === e.jobId);
    if (!e || !j) return;
    log(j, by, `Note: Customer requested changes to ${e.id}${message.trim() ? ` — ${message.trim()}` : ''}`);
  });
}


// ------------------------------------------------------------------ insurance claims (front-end only: local state)
const claimEvent = (c: Claim, by: string, text: string) => c.events.unshift({ id: uid('ce'), at: nowIso(), by, text });
const rankOf = (s: ClaimStatus) => CLAIM_FLOW.indexOf(s);
/** moves a claim forward only; a status never goes backwards by itself */
const advance = (c: Claim, to: ClaimStatus) => {
  if (rankOf(to) > rankOf(c.status)) c.status = to;
};

export function setJobInsurance(jobId: string, on: boolean, by = 'Team') {
  mutate((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.isInsurance = on;
    if (on && !j.claimId) {
      const est = d.estimates.find((e) => e.jobId === jobId);
      const n = Math.max(2400, ...d.claims.map((c) => Number(c.id.replace('CLM-', '')))) + 1;
      const id = `CLM-${n}`;
      const claim: Claim = {
        id, jobId, type: 'Cashless', insurer: INSURERS[0], policyNo: '', claimNo: '', accidentDate: TODAY_ISO, surveyorName: '', surveyorPhone: '', status: 'Intimated', intimatedAt: nowIso(),
        docs: newDocs(), photos: newPhotos(id), deductible: 1000, depreciationPct: 25, zeroDep: false, received: 0,
        lines: (est?.items ?? []).map((it, i) => ({ id: `${id}-l${i + 1}`, name: it.name, kind: it.category === 'Parts' ? ('part' as const) : ('labour' as const), amount: it.amount, covered: true })),
        events: [],
      };
      claimEvent(claim, by, 'Claim created from the job card');
      d.claims.unshift(claim);
      j.claimId = id;
    }
    log(j, by, on ? 'Marked as an insurance job' : 'Insurance job flag removed');
  });
}

export function updateClaim(id: string, patch: Partial<Pick<Claim, 'type' | 'insurer' | 'policyNo' | 'claimNo' | 'accidentDate' | 'surveyorName' | 'surveyorPhone' | 'deductible' | 'depreciationPct' | 'zeroDep'>>, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    if (patch.surveyorName !== undefined && patch.surveyorName !== c.surveyorName && patch.surveyorName.trim()) {
      claimEvent(c, by, `Surveyor set to ${patch.surveyorName.trim()}`);
      if (!c.surveyorAllocatedAt) c.surveyorAllocatedAt = nowIso();
    }
    Object.assign(c, patch);
  });
}

export function setClaimStatus(id: string, status: ClaimStatus, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c || c.status === status) return;
    c.status = status;
    claimEvent(c, by, `Status changed to ${status}`);
  });
}

export function setDocUploaded(id: string, kind: ClaimDocKind, uploaded: boolean, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    const doc = c?.docs.find((x) => x.kind === kind);
    if (!c || !doc || doc.uploaded === uploaded) return;
    doc.uploaded = uploaded;
    doc.uploadedAt = uploaded ? nowIso() : undefined;
    claimEvent(c, by, uploaded ? `${doc.label} marked as uploaded` : `${doc.label} marked as missing`);
    if (c.docs.some((x) => x.required && !x.uploaded)) advance(c, 'Docs Pending');
    else if (c.lines.length) advance(c, 'Estimate Ready');
  });
}

export function sendUploadLink(id: string, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    claimEvent(c, by, 'Document upload link sent to the customer on WhatsApp');
    advance(c, 'Docs Pending');
  });
}

export function setPhotoUploaded(id: string, photoId: string, uploaded: boolean) {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    const p = c?.photos.find((x) => x.id === photoId);
    if (!p) return;
    p.uploaded = uploaded;
    p.src = uploaded ? placeholderPhoto(c!.photos.indexOf(p) + 3) : undefined;
  });
}

export function toggleClaimLine(id: string, lineId: string) {
  mutate((d) => {
    const l = d.claims.find((x) => x.id === id)?.lines.find((x) => x.id === lineId);
    if (l) l.covered = !l.covered;
  });
}

export function addClaimLine(id: string, line: Omit<ClaimLine, 'id'>) {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    c.lines.push({ ...line, id: uid('cl') });
    if (c.lines.length === 1 && !c.docs.some((x) => x.required && !x.uploaded)) advance(c, 'Estimate Ready');
  });
}

export function removeClaimLine(id: string, lineId: string) {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (c) c.lines = c.lines.filter((l) => l.id !== lineId);
  });
}

/** Mock claim pack: marks it generated and "sends" it to the surveyor. */
export function generateClaimPack(id: string, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    c.packAt = nowIso();
    if (!c.surveyorAllocatedAt) c.surveyorAllocatedAt = nowIso();
    claimEvent(c, by, 'Claim pack generated and sent to the surveyor');
    advance(c, 'Survey Scheduled');
  });
}

/** Surveyor page (no login): remarks plus the approved amount move the claim to Approved. */
export function surveyorSubmit(id: string, remarks: string, amount: number) {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    c.surveyorRemarks = remarks;
    c.approvedAmount = amount;
    c.reportAt = nowIso();
    c.decisionAt = nowIso();
    claimEvent(c, c.surveyorName || 'Surveyor', `Survey report submitted. Approved amount ${new Intl.NumberFormat('en-IN').format(amount)}`);
    c.status = rankOf(c.status) < rankOf('Approved') ? 'Approved' : c.status;
  });
}

export function approveCustomerShare(id: string, by = 'Customer') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c || c.customerApprovedAt) return;
    c.customerApprovedAt = nowIso();
    claimEvent(c, by, `Customer approved their share of ₹${new Intl.NumberFormat('en-IN').format(splitOf(c).customer)}`);
  });
}

/** Mock payment: records what the insurer paid; anything below the expected amount shows up as short-paid. */
export function recordClaimPayment(id: string, amount: number, by = 'Team') {
  mutate((d) => {
    const c = d.claims.find((x) => x.id === id);
    if (!c) return;
    c.received += amount;
    c.receivedOn = TODAY_ISO;
    c.status = 'Settled';
    const short = Math.max(0, expectedFromInsurer(c) - c.received);
    claimEvent(c, by, `Payment of ₹${new Intl.NumberFormat('en-IN').format(amount)} received from ${c.insurer}${short ? `, short-paid by ₹${new Intl.NumberFormat('en-IN').format(short)}` : ''}`);
  });
}
