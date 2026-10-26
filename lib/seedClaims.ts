import { CLAIM_FLOW, DOC_DEFS, PHOTO_DEFS, TODAY_ISO, expectedFromInsurer, fmtDate, placeholderPhoto, splitOf } from './insurance';
import { inr } from './format';
import type { Claim, ClaimEvent, ClaimLine, ClaimStatus, Customer, Job, Stage, Vehicle } from './types';

/** Mock insurance data: 15 claims across 3 generic insurers, each with its own job card, vehicle and customer. */
interface Helpers {
  cust: (id: string, name: string, phone: string, spent: number, last: string, avatar: string) => Customer;
  veh: (customerId: string, key: string, reg: string, odometer: number, serviceInDays: number | undefined, extra?: Partial<Vehicle>) => Vehicle;
  mkJob: (s: { id: string; v: Vehicle; tech: string; stage: Stage; prog: number; service: string; cat?: 'body'; dueIn: number; started?: string; bay?: string }) => Job;
  avatars: string[];
}

const INS = { ABC: 'ABC General Insurance', XYZ: 'XYZ General Insurance', SUN: 'Sunrise General Insurance' } as const;

interface Spec {
  status: ClaimStatus;
  type: Claim['type'];
  ins: keyof typeof INS;
  /** customer id when it is an existing customer, else a new customer is created from `name` */
  cust: string;
  phone?: string;
  car: 'creta' | 'city' | 'xuv700' | 'fortuner' | 'bmw3' | 'audiq5';
  reg: string;
  /** days since the claim was intimated */
  d: number;
  /** parts, labour, paint, not-covered */
  amt: [number, number, number, number];
  ded: number;
  zeroDep?: boolean;
  surveyor: string;
  received?: number;
  /** hours after intimation that the surveyor was allocated (omit: never allocated) */
  alloc?: number;
  /** days from survey report to insurer decision */
  decisionAfter?: number;
  what: string;
}

const SPECS: Spec[] = [
  { status: 'Intimated', type: 'Cashless', ins: 'ABC', cust: 'Sagar Bhosale', car: 'city', reg: 'MH12PQ2201', d: 0, amt: [0, 0, 0, 0], ded: 1000, surveyor: 'Not assigned yet', what: 'Accident repair: rear bumper' },
  { status: 'Docs Pending', type: 'Cashless', ins: 'XYZ', cust: 'Anita Deshpande', car: 'xuv700', reg: 'MH14RT5509', d: 2, amt: [0, 0, 0, 0], ded: 2000, surveyor: 'Not assigned yet', what: 'Accident repair: door and fender' },
  { status: 'Estimate Ready', type: 'Cashless', ins: 'ABC', cust: 'c-rahul-m', car: 'creta', reg: 'MH12KD7731', d: 3, amt: [12200, 40050, 0, 2400], ded: 1000, surveyor: 'Prakash Deshpande', alloc: 18, what: 'Accident repair: front bumper and headlamp' },
  { status: 'Survey Scheduled', type: 'Cashless', ins: 'XYZ', cust: 'Vivek Kulkarni', car: 'fortuner', reg: 'MH12LM9042', d: 5, amt: [21000, 12000, 8000, 0], ded: 2000, surveyor: 'Sunil Rane', alloc: 20, what: 'Accident repair: tailgate and bumper' },
  { status: 'Surveyed', type: 'Reimbursement', ins: 'SUN', cust: 'Sunil Pawar', car: 'bmw3', reg: 'MH14BN3318', d: 9, amt: [26000, 15000, 10000, 1800], ded: 2000, surveyor: 'Meera Phadke', alloc: 22, what: 'Accident repair: left side panels' },
  { status: 'Approved', type: 'Cashless', ins: 'ABC', cust: 'Neelam Joshi', car: 'audiq5', reg: 'MH12AQ5150', d: 12, amt: [28000, 14500, 9000, 0], ded: 2000, surveyor: 'Rajesh Kamat', alloc: 16, what: 'Accident repair: front end' },
  { status: 'In Repair', type: 'Cashless', ins: 'SUN', cust: 'Tushar Jadhav', car: 'creta', reg: 'MH12SV6620', d: 17, amt: [18200, 9800, 6500, 1200], ded: 1000, surveyor: 'Meera Phadke', alloc: 12, what: 'Accident repair: bonnet and grille' },
  { status: 'In Repair', type: 'Cashless', ins: 'XYZ', cust: 'Madhuri Kale', car: 'city', reg: 'MH14GH2874', d: 21, amt: [14000, 7500, 5200, 0], ded: 1000, surveyor: 'Sunil Rane', alloc: 30, what: 'Accident repair: rear quarter panel' },
  { status: 'Re-inspection', type: 'Cashless', ins: 'ABC', cust: 'Imran Shaikh', car: 'xuv700', reg: 'MH12ZX1187', d: 26, amt: [28000, 14500, 11000, 3400], ded: 2000, surveyor: 'Rajesh Kamat', alloc: 14, decisionAfter: 11, what: 'Accident repair: roof and pillar' },
  { status: 'DO Received', type: 'Cashless', ins: 'SUN', cust: 'Pradeep Gokhale', car: 'fortuner', reg: 'MH14PK7765', d: 30, amt: [34000, 17000, 12500, 0], ded: 2000, zeroDep: true, surveyor: 'Meera Phadke', alloc: 10, what: 'Accident repair: front bumper and radiator' },
  { status: 'Delivered', type: 'Cashless', ins: 'XYZ', cust: 'Shweta Naik', car: 'bmw3', reg: 'MH12CC0901', d: 33, amt: [36000, 20000, 13500, 0], ded: 2000, zeroDep: true, surveyor: 'Sunil Rane', alloc: 19, what: 'Accident repair: both doors' },
  { status: 'Payment Pending', type: 'Cashless', ins: 'ABC', cust: 'Amol Chavan', car: 'audiq5', reg: 'MH12TT4410', d: 41, amt: [20000, 11000, 8000, 2000], ded: 2000, surveyor: 'Rajesh Kamat', alloc: 21, what: 'Accident repair: rear bumper and boot' },
  { status: 'Payment Pending', type: 'Reimbursement', ins: 'SUN', cust: 'Rekha Bhagat', car: 'creta', reg: 'MH14FD3392', d: 36, amt: [12500, 8000, 6000, 0], ded: 1000, surveyor: 'Meera Phadke', alloc: 15, what: 'Accident repair: fender and headlamp' },
  { status: 'Settled', type: 'Cashless', ins: 'ABC', cust: 'Yash Mane', car: 'city', reg: 'MH12NN6063', d: 52, amt: [16000, 9000, 7000, 0], ded: 1000, surveyor: 'Rajesh Kamat', alloc: 11, received: 25150, what: 'Accident repair: front bumper' },
  { status: 'Settled', type: 'Cashless', ins: 'XYZ', cust: 'Farhan Khan', car: 'xuv700', reg: 'MH14JJ8821', d: 58, amt: [24000, 13000, 9500, 1500], ded: 2000, surveyor: 'Sunil Rane', alloc: 13, what: 'Accident repair: left door and mirror' },
];

const rank = (s: ClaimStatus) => CLAIM_FLOW.indexOf(s);
const JOB_STAGE: Record<ClaimStatus, Stage> = {
  Intimated: 'pending', 'Docs Pending': 'pending', 'Estimate Ready': 'inspection', 'Survey Scheduled': 'inspection', Surveyed: 'diagnostics', Approved: 'diagnostics',
  'In Repair': 'in_repair', 'Re-inspection': 'quality_check', 'DO Received': 'ready', Delivered: 'delivered', 'Payment Pending': 'delivered', Settled: 'delivered',
};
const TECHS = ['u-amit', 'u-priya', 'u-karan', 'u-nilesh', 'u-rohit'];

const iso = (daysAgo: number, hhmm = '10:15') => {
  const d = new Date(`${TODAY_ISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return `${d.toISOString().slice(0, 10)}T${hhmm}`;
};
const addH = (at: string, h: number) => new Date(new Date(`${at}:00Z`).getTime() + h * 3_600_000).toISOString().slice(0, 16);
const addD = (at: string, days: number) => addH(at, days * 24);

function lines(id: string, [parts, labour, paint, nc]: Spec['amt']): ClaimLine[] {
  const out: ClaimLine[] = [];
  if (parts) out.push({ id: `${id}-l1`, name: 'Genuine replacement parts', kind: 'part', amount: parts, covered: true });
  if (labour) out.push({ id: `${id}-l2`, name: 'Denting, panel beating and labour', kind: 'labour', amount: labour, covered: true });
  if (paint) out.push({ id: `${id}-l3`, name: 'Paint and materials', kind: 'paint', amount: paint, covered: true });
  if (nc) out.push({ id: `${id}-l4`, name: 'Alloy wheel refurbish (pre-existing)', kind: 'labour', amount: nc, covered: false });
  return out;
}

/** The hero claim reads naturally: parts as two lines, repair work as three. */
function heroLines(id: string): ClaimLine[] {
  return [
    { id: `${id}-l1`, name: 'Headlamp assembly (LH)', kind: 'part', amount: 8200, covered: true },
    { id: `${id}-l2`, name: 'Front bumper cover', kind: 'part', amount: 4000, covered: true },
    { id: `${id}-l3`, name: 'Denting and panel beating', kind: 'labour', amount: 17500, covered: true },
    { id: `${id}-l4`, name: 'Paint: bumper, fender, bonnet', kind: 'paint', amount: 13500, covered: true },
    { id: `${id}-l5`, name: 'Labour: R&R and wheel alignment', kind: 'labour', amount: 9050, covered: true },
    { id: `${id}-l6`, name: 'Alloy wheel refurbish (pre-existing)', kind: 'labour', amount: 2400, covered: false },
  ];
}

export function insuranceSeed(h: Helpers, nextJobNo: number, existingCustomers: Customer[]) {
  const customers: Customer[] = [];
  const vehicles: Vehicle[] = [];
  const jobs: Job[] = [];
  const claims: Claim[] = [];

  SPECS.forEach((s, i) => {
    const n = i + 1;
    const cid = `CLM-${2400 + n}`;
    const jobId = `J${nextJobNo + i}`;
    const existing = existingCustomers.find((c) => c.id === s.cust);
    const custId = existing ? existing.id : `c-ins${n}`;
    if (!existing) customers.push(h.cust(custId, s.cust, `+91 9${(8100 + n * 211) % 10000} ${(20000 + n * 6143) % 100000}`, 40000 + n * 3500, fmtDate(iso(s.d).slice(0, 10)), h.avatars[n % h.avatars.length]));
    const v = h.veh(custId, s.car, s.reg, 18000 + n * 2300, undefined, { year: 2021 + (n % 4) });
    vehicles.push(v);
    const job = h.mkJob({ id: jobId, v, tech: TECHS[i % TECHS.length], stage: JOB_STAGE[s.status], prog: JOB_STAGE[s.status] === 'delivered' ? 100 : JOB_STAGE[s.status] === 'ready' ? 100 : rank(s.status) * 7, service: s.what, cat: 'body', dueIn: 3 + (i % 4), started: `${fmtDate(iso(s.d).slice(0, 10))}, 10:00 AM` });
    job.isInsurance = true;
    job.claimId = cid;
    if (job.stage === 'delivered') { job.completedOn = fmtDate(iso(Math.max(0, s.d - 12)).slice(0, 10)); job.completedInDays = 8; }
    jobs.push(job);

    const r = rank(s.status);
    const at0 = iso(s.d);
    const allocAt = s.alloc !== undefined && r >= rank('Estimate Ready') ? addH(at0, s.alloc) : undefined;
    const packAt = r >= rank('Survey Scheduled') ? addD(at0, 2) : undefined;
    const reportAt = r >= rank('Surveyed') ? addD(at0, Math.max(3, Math.round(s.d * 0.35))) : undefined;
    const decisionAt = r >= rank('Approved') && reportAt ? addD(reportAt, s.decisionAfter ?? 2) : undefined;

    const lns = s.status === 'Estimate Ready' && s.cust === 'c-rahul-m' ? heroLines(cid) : lines(cid, s.amt);
    const base = { lines: lns, deductible: s.ded, depreciationPct: 25, zeroDep: !!s.zeroDep };
    const sp = splitOf(base);

    const docsDone = r >= rank('Survey Scheduled') ? 5 : r >= rank('Estimate Ready') ? 3 : r >= rank('Docs Pending') ? 2 : 0;
    const docs = DOC_DEFS.map((d, k) => ({ ...d, uploaded: k < docsDone || (k === 3 && r >= rank('Survey Scheduled')), uploadedAt: k < docsDone ? addH(at0, 6 + k) : undefined }));
    // the hero claim keeps its signed claim form outstanding so the checklist has something to show
    const photoCount = r >= rank('Survey Scheduled') ? 8 : r >= rank('Estimate Ready') ? 6 : r >= rank('Docs Pending') ? 4 : 0;
    const photos = PHOTO_DEFS.map((p, k) => {
      const up = p.stage === 'Intake' ? k < photoCount : p.stage === 'Old parts' ? r >= rank('In Repair') : r >= rank('Re-inspection');
      return { ...p, id: `${cid}-p${k + 1}`, uploaded: up, src: up ? placeholderPhoto(k + n) : undefined };
    });

    const events: ClaimEvent[] = [{ id: `${cid}-e1`, at: at0, by: 'Rahul Sharma', text: `Claim intimated to ${INS[s.ins]}` }];
    let e = 2;
    const ev = (at: string, text: string, by = 'Rahul Sharma') => events.push({ id: `${cid}-e${e++}`, at, by, text });
    if (docsDone >= 2) ev(addH(at0, 7), 'Policy and RC received from customer');
    if (docsDone >= 3) ev(addH(at0, 9), 'Driving licence received');
    if (allocAt) ev(allocAt, `Surveyor ${s.surveyor} allocated`, INS[s.ins]);
    if (r >= rank('Estimate Ready')) ev(addH(at0, 30), 'Estimate prepared and split between insurer and customer');
    if (packAt) ev(packAt, 'Claim pack sent to surveyor');
    if (reportAt) ev(reportAt, 'Survey report received', s.surveyor);
    if (decisionAt) ev(decisionAt, `Insurer approved ${inr(sp.insurance)}`, INS[s.ins]);
    if (r >= rank('Approved')) ev(addH(decisionAt ?? at0, 5), 'Customer approved their share', s.cust === 'c-rahul-m' ? 'Rahul Mehta' : 'Customer');
    if (r >= rank('In Repair')) ev(addD(decisionAt ?? at0, 1), 'Repair started');
    if (r >= rank('Re-inspection')) ev(addD(decisionAt ?? at0, 7), 'Re-inspection requested by surveyor', s.surveyor);
    if (r >= rank('DO Received')) ev(addD(decisionAt ?? at0, 9), 'Delivery order received from insurer', INS[s.ins]);
    if (r >= rank('Delivered')) ev(addD(decisionAt ?? at0, 11), 'Vehicle delivered to customer');
    if (r >= rank('Payment Pending')) ev(addD(decisionAt ?? at0, 12), 'Invoice raised to insurer');
    if (r >= rank('Settled')) ev(addD(decisionAt ?? at0, 20), 'Payment received from insurer', INS[s.ins]);

    const claim: Claim = {
      id: cid, jobId, type: s.type, insurer: INS[s.ins], policyNo: `${s.ins}/MOT/25/${String(104200 + n * 37)}`, claimNo: `${s.ins}-CL-${String(5100 + n * 53)}`,
      accidentDate: iso(s.d + 1).slice(0, 10), surveyorName: s.surveyor, surveyorPhone: `+91 98${(220 + n * 17) % 1000} ${(10000 + n * 3917) % 100000}`,
      status: s.status, intimatedAt: at0, surveyorAllocatedAt: allocAt, reportAt, decisionAt,
      docs, photos, ...base,
      customerApprovedAt: r >= rank('Approved') ? addH(decisionAt ?? at0, 5) : undefined,
      packAt, received: s.status === 'Settled' ? (s.received ?? 0) : 0, receivedOn: s.status === 'Settled' ? addD(decisionAt ?? at0, 20).slice(0, 10) : undefined,
      events: events.sort((a, b) => (a.at < b.at ? 1 : -1)),
    };
    if (s.status === 'Settled' && !s.received) claim.received = expectedFromInsurer(claim);
    claims.push(claim);
  });
  return { customers, vehicles, jobs, claims };
}
