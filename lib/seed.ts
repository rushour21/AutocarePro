import type {
  Activity, Bay, CarKey, Channel, Customer, Db, Estimate, InspectionPoint, Invoice, Job, Message, Notification,
  Part, PartRequest, Stage, User, Vehicle, Zone, Task, ChecklistItem, PointStatus,
} from './types';

const AV = (n: string) => `/assets/avatars/${n}.png`;
const PH = (n: string) => `/assets/photos/${n}.jpg`;

export const DB_VERSION = 3;
export const TODAY_LABEL = 'Mon, 16 Mar 2025';

// ------------------------------------------------------------------ users
const users: User[] = [
  { id: 'u-admin', name: 'Rahul Sharma', role: 'admin', title: 'Admin', email: 'admin@autohub.com', phone: '+91 98765 43210', avatar: AV('rahul-sharma'), password: 'admin123', online: true, empId: 'EMP-001', joined: '03 Feb 2020' },
  { id: 'u-amit', name: 'Amit Gupta', role: 'technician', title: 'Technician', email: 'amit@autohub.com', phone: '+91 98765 43210', avatar: AV('amit-gupta'), password: 'tech123', online: true, empId: 'EMP-104', joined: '12 Jan 2024' },
  { id: 'u-priya', name: 'Priya Singh', role: 'technician', title: 'Technician', email: 'priya@autohub.com', phone: '+91 98765 43211', avatar: AV('priya-singh'), password: 'tech123', online: true, empId: 'EMP-105', joined: '20 Feb 2024' },
  { id: 'u-karan', name: 'Karan Singh', role: 'technician', title: 'Technician', email: 'karan@autohub.com', phone: '+91 98765 43212', avatar: AV('karan-singh'), password: 'tech123', online: false, empId: 'EMP-106', joined: '04 Mar 2024' },
  { id: 'u-nilesh', name: 'Nilesh Patil', role: 'technician', title: 'Technician', email: 'nilesh@autohub.com', phone: '+91 98765 43213', avatar: AV('nilesh-patil'), password: 'tech123', online: true, empId: 'EMP-107', joined: '18 Apr 2024' },
  { id: 'u-rohit', name: 'Rohit Kamble', role: 'technician', title: 'Technician', email: 'rohit@autohub.com', phone: '+91 98765 43214', avatar: AV('rohit-kamble'), password: 'tech123', online: true, empId: 'EMP-108', joined: '02 Jun 2024' },
  { id: 'u-vikram', name: 'Vikram Jadhav', role: 'technician', title: 'Service Advisor', email: 'vikram@autohub.com', phone: '+91 98765 43215', avatar: AV('vikram-jadhav'), password: 'tech123', online: false, empId: 'EMP-109', joined: '15 Jul 2024' },
  { id: 'u-rahul-m', name: 'Rahul Mehta', role: 'customer', title: 'Premium Member', email: 'rahul.mehta@example.com', phone: '+91 98765 43210', avatar: AV('rahul-mehta'), password: 'customer123', customerId: 'c-rahul-m', location: 'Pune, Maharashtra' },
];

// ------------------------------------------------------------------ customers
const cust = (id: string, name: string, phone: string, spent: number, last: string, avatar: string, extra: Partial<Customer> = {}): Customer => ({
  id, name, phone, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`, avatar: AV(avatar), totalSpent: spent, lastService: last, ...extra,
});
const FILLER_NAMES = ['Ankit Joshi', 'Meera Kulkarni', 'Sanjay Rao', 'Pooja Nair', 'Aditya Verma', 'Kavita Shah', 'Manish Gupta', 'Ritu Agarwal', 'Arjun Reddy', 'Divya Menon', 'Harsh Vyas', 'Nisha Thakur', 'Gaurav Sinha', 'Tanvi Desai'];
const FILLER_AV = ['priya-singh', 'karan-singh', 'nilesh-patil', 'rohit-kamble', 'vikram-jadhav', 'c-vikram-iyer', 'c-sneha-mehta'];
const customers: Customer[] = [
  cust('c-rahul-s', 'Rahul Sharma', '+91 98765 43310', 245000, '10 Mar 2025', 'rahul-sharma'),
  cust('c-priya-m', 'Priya Mehta', '+91 87654 3210', 135000, '15 Feb 2025', 'c-priya-mehta', { followUp: true }),
  cust('c-rohit-k', 'Rohit Kumar', '+91 98765 4321', 78000, '22 Jan 2025', 'c-rohit-kumar'),
  cust('c-neha-p', 'Neha Patil', '+91 87654 3212', 90000, '14 Mar 2025', 'neha-patil'),
  cust('c-vikram-i', 'Vikram Iyer', '+91 98675 1234', 110000, '1 Mar 2025', 'c-vikram-iyer'),
  cust('c-karan-s', 'Karan Singh', '+91 98876 5432', 60000, '18 Feb 2025', 'karan-singh'),
  cust('c-sneha-m', 'Sneha Mehta', '+91 88776 4321', 96000, '12 Mar 2025', 'c-sneha-mehta', { followUp: true }),
  cust('c-rahul-m', 'Rahul Mehta', '+91 98765 43210', 24500, '12 Mar 2025', 'rahul-mehta'),
  ...FILLER_NAMES.map((n, i) =>
    cust(`c-f${i + 1}`, n, `+91 9${(8000 + i * 137) % 10000} ${(10000 + i * 7919) % 100000}`, 30000 + ((i * 17000) % 90000), `${(i % 27) + 1} ${['Jan', 'Feb', 'Mar'][i % 3]} 2025`, FILLER_AV[i % FILLER_AV.length]),
  ),
];

// ------------------------------------------------------------------ vehicles
const MODELS: Record<string, { make: string; model: string; variant: string; fuel: Vehicle['fuel']; carKey: CarKey }> = {
  bmw3: { make: 'BMW', model: '3 Series', variant: '330i M Sport', fuel: 'Petrol', carKey: 'bmw3' },
  audiq5: { make: 'Audi', model: 'Q5', variant: '2.0 TFSI', fuel: 'Petrol', carKey: 'audiq5' },
  glc: { make: 'Mercedes', model: 'GLC', variant: '300 4MATIC', fuel: 'Petrol', carKey: 'glc' },
  fortuner: { make: 'Toyota', model: 'Fortuner', variant: '2.8 Diesel', fuel: 'Diesel', carKey: 'fortuner' },
  bmwx5: { make: 'BMW', model: 'X5', variant: 'xDrive30d', fuel: 'Diesel', carKey: 'bmwx5' },
  rangerover: { make: 'Range Rover', model: 'Sport', variant: '3.0 D', fuel: 'Diesel', carKey: 'rangerover' },
  city: { make: 'Honda', model: 'City', variant: 'ZX CVT', fuel: 'Petrol', carKey: 'bmw3' },
  cayman: { make: 'Porsche', model: 'Cayman', variant: '718 GTS', fuel: 'Petrol', carKey: 'bmw3' },
};
let vSeq = 0;
const veh = (customerId: string, key: keyof typeof MODELS, reg: string, odometer: number, serviceInDays: number | undefined, extra: Partial<Vehicle> = {}): Vehicle => {
  const m = MODELS[key];
  return { id: `v-${++vSeq}`, customerId, ...m, reg, year: 2020 + (vSeq % 4), odometer, serviceInDays, ...extra };
};
const V = {
  bmw3: veh('c-rahul-m', 'bmw3', 'KA01AB1234', 42500, 5, { primary: true, year: 2021 }),
  audiPriya: veh('c-priya-m', 'audiq5', 'KA01CD5678', 38200, -3, { year: 2020 }),
  glcSneha: veh('c-sneha-m', 'glc', 'KA01EF9012', 51000, 12, { year: 2021 }),
  rrNeha: veh('c-neha-p', 'rangerover', 'KA03IJ3456', 28450, 3, { year: 2022 }),
  fortRohit: veh('c-rohit-k', 'fortuner', 'KA02GH9012', 62300, -6, { year: 2022 }),
  audiRm: veh('c-rahul-m', 'audiq5', 'KA01CD5688', 38200, 60, { year: 2020 }),
  glcRm: veh('c-rahul-m', 'glc', 'KA01EF9014', 51000, 75, { year: 2021 }),
  fortRm: veh('c-rahul-m', 'fortuner', 'KA02GH9014', 62300, 90, { year: 2022 }),
  cityRs: veh('c-rahul-s', 'city', 'MH12AB4455', 31200, 45, { year: 2021 }),
  x5Rs: veh('c-rahul-s', 'bmwx5', 'MH12CD7788', 22100, 50),
  rrRs: veh('c-rahul-s', 'rangerover', 'MH12EF9900', 18700, 40),
  bmwPriya: veh('c-priya-m', 'bmw3', 'MH14GH1122', 27800, 55),
  cityviSneha: veh('c-sneha-m', 'city', 'MH14JK3344', 44100, 65),
  audiNeha: veh('c-neha-p', 'audiq5', 'MH12LM5566', 36900, 70),
  vikram1: veh('c-vikram-i', 'glc', 'MH12NP7788', 29900, 35),
  vikram2: veh('c-vikram-i', 'city', 'MH12QR9900', 52000, 80),
  karan1: veh('c-karan-s', 'fortuner', 'MH12ST1357', 47000, 90),
  // vehicles of the other jobs on the floor
  audiF1: veh('c-f1', 'audiq5', 'MH12UV2468', 33500, 38),
  glcF2: veh('c-f2', 'glc', 'MH14WX1357', 41200, 42),
  rrF3: veh('c-f3', 'rangerover', 'MH12YZ2460', 25600, 36),
  x5F4: veh('c-f4', 'bmwx5', 'MH14AA3579', 38800, 44),
  fortF5: veh('c-f5', 'fortuner', 'MH12BB4680', 59000, 33),
  glcF6: veh('c-f6', 'glc', 'MH12CC5791', 30100, 48),
  fortF7: veh('c-f7', 'fortuner', 'MH14DD6802', 71000, 52),
  caymanF8: veh('c-f8', 'cayman', 'MH12EE7913', 19800, 58),
};
const vehicles: Vehicle[] = Object.values(V);
// filler vehicles so the fleet totals 42 (8 due soon, 3 overdue)
const FILLER_DUE = [8, 14, 21, 25, 29, -2];
const FILLER_KEYS: (keyof typeof MODELS)[] = ['bmw3', 'audiq5', 'glc', 'fortuner', 'bmwx5', 'rangerover', 'city'];
for (let i = 0; vehicles.length < 42; i++) {
  vehicles.push(veh(`c-f${(i % 14) + 1}`, FILLER_KEYS[i % FILLER_KEYS.length], `MH${12 + (i % 3)}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + (i % 24))}${1000 + i * 37}`, 15000 + i * 2900, FILLER_DUE[i] ?? 40 + i * 3));
}

// ------------------------------------------------------------------ inspection
const POINT_DEFS: { id: string; label: string; zone: Zone; x: number; y: number }[] = [
  { id: 'p-rear-bumper', label: 'Rear Bumper', zone: 'body', x: 50, y: 4 },
  { id: 'p-tail-l', label: 'Left Tail Light', zone: 'body', x: 17, y: 7 },
  { id: 'p-tail-r', label: 'Right Tail Light', zone: 'body', x: 83, y: 7 },
  { id: 'p-mirror-l', label: 'Left Mirror', zone: 'body', x: -2, y: 21 },
  { id: 'p-mirror-r', label: 'Right Mirror', zone: 'body', x: 102, y: 21 },
  { id: 'p-door-rf', label: 'Right Front Door', zone: 'body', x: 100, y: 61 },
  { id: 'p-door-lf', label: 'Left Front Door', zone: 'body', x: -2, y: 67 },
  { id: 'p-wheel-lf', label: 'Front Left Wheel', zone: 'body', x: -4, y: 80 },
  { id: 'p-wheel-rf', label: 'Front Right Wheel', zone: 'body', x: 104, y: 79 },
  { id: 'p-front-bumper', label: 'Front Bumper', zone: 'body', x: 50, y: 98 },
  { id: 'p-hood', label: 'Hood', zone: 'body', x: 50, y: 84 },
  { id: 'p-roof', label: 'Roof', zone: 'body', x: 50, y: 45 },
  { id: 'p-z-rl', label: 'Rear Left Quarter', zone: 'rear-left', x: 78, y: 86 },
  { id: 'p-z-ml', label: 'Left Door Panel', zone: 'mid-left', x: 80, y: 18 },
  { id: 'p-z-wl', label: 'Left Wheel', zone: 'wheel-left', x: 22, y: 20 },
  { id: 'p-z-rr', label: 'Rear Right Quarter', zone: 'rear-right', x: 22, y: 20 },
  { id: 'p-z-mr', label: 'Right Door Panel', zone: 'mid-right', x: 26, y: 18 },
  { id: 'p-z-wr', label: 'Right Wheel', zone: 'wheel-right', x: 80, y: 20 },
];
const BMW_POINT_STATE: Record<string, [PointStatus, InspectionPoint['damage'], InspectionPoint['severity'], string]> = {
  'p-rear-bumper': ['minor', 'Scratch', 'Minor', 'Light scuffing on the lower edge.'],
  'p-tail-l': ['major', 'Cracked', 'Major', 'Cracked lens, moisture inside.'],
  'p-tail-r': ['major', 'Scratch', 'Major', 'Deep scratch near the corner.'],
  'p-mirror-l': ['minor', 'Paint Damage', 'Minor', 'Paint chipped on the housing.'],
  'p-mirror-r': ['major', 'Dent', 'Major', 'Housing dented, loose on mount.'],
  'p-door-rf': ['major', 'Scratch', 'Major', 'Deep scratch on right side panel.'],
  'p-door-lf': ['good', 'Scratch', 'Minor', ''],
  'p-wheel-lf': ['major', 'Scratch', 'Major', 'Kerb damage on the alloy.'],
  'p-wheel-rf': ['minor', 'Paint Damage', 'Minor', 'Light kerb rash.'],
  'p-front-bumper': ['major', 'Scratch', 'Major', 'Scratch on right side bumper.'],
  'p-z-rl': ['good', 'Scratch', 'Minor', ''],
  'p-z-ml': ['good', 'Scratch', 'Minor', ''],
  'p-z-wl': ['minor', 'Scratch', 'Minor', ''],
  'p-z-rr': ['unchecked', 'Scratch', 'Minor', ''],
  'p-z-mr': ['major', 'Dent', 'Major', 'Dent near the door handle.'],
  'p-z-wr': ['minor', 'Paint Damage', 'Minor', ''],
};
const makePoints = (detailed: boolean): InspectionPoint[] =>
  POINT_DEFS.map((d) => {
    const s = detailed ? BMW_POINT_STATE[d.id] : undefined;
    return {
      ...d,
      status: s?.[0] ?? 'unchecked',
      damage: s?.[1] ?? 'Scratch',
      severity: s?.[2] ?? 'Minor',
      notes: s?.[3] ?? '',
      photos: d.id === 'p-front-bumper' ? [PH('bumper'), PH('bumper-2'), PH('bumper-3')] : [],
    };
  });

// ------------------------------------------------------------------ jobs
const TECH_NAMES: Record<string, string> = { 'u-amit': 'Amit Gupta', 'u-priya': 'Priya Singh', 'u-karan': 'Karan Singh', 'u-nilesh': 'Nilesh Patil', 'u-rohit': 'Rohit Kamble' };
const STAGE_STEP: Record<Stage, number> = { pending: -1, inspection: 0, diagnostics: 1, in_repair: 2, quality_check: 3, ready: 4, delivered: 5 };

const tasksFor = (kind: string, done: number): Task[] => {
  const T: Record<string, string[]> = {
    brake: ['Replace brake pads', 'Brake disc replacement', 'Engine oil & filter', 'AC Filter', 'Final inspection'],
    service: ['Inspect vehicle', 'Change engine oil', 'Replace filters', 'Top up fluids', 'Final inspection'],
    body: ['Panel assessment', 'Dent repair', 'Paint preparation', 'Painting', 'Final inspection'],
    ac: ['Check AC performance', 'Recover refrigerant', 'Replace filter', 'Refill gas', 'Final inspection'],
  };
  const list = T[kind] ?? T.service;
  return list.map((title, i) => ({ id: `t${i + 1}`, title, status: i < done ? 'Completed' : i === done ? 'In Progress' : 'Pending' }));
};
const CHECKLISTS: Record<string, string[]> = {
  'Brake Service Checklist': ['Lift vehicle and safety check', 'Inspect brake pads', 'Remove old brake pads', 'Install new brake pads', 'Inspect brake discs', 'Replace brake discs (if needed)', 'Check brake fluid level', 'Road test'],
  'General Service Checklist': ['Vehicle check-in photos', 'Drain engine oil', 'Replace oil filter', 'Replace air filter', 'Top up fluids', 'Tyre pressure check', 'Road test'],
  'AC Service Checklist': ['Check cabin temperature', 'Recover refrigerant', 'Replace cabin filter', 'Leak test', 'Recharge system', 'Final temperature check'],
  'Body Repair Checklist': ['Document damage', 'Remove panel', 'Repair dent', 'Sand and prime', 'Paint and cure', 'Refit panel', 'Quality inspection'],
};
const checklistFor = (name: string, done: number): ChecklistItem[] => CHECKLISTS[name].map((label, i) => ({ id: `c${i + 1}`, label, done: i < done }));

interface JobSpec {
  id: string; v: Vehicle; tech: string; stage: Stage; prog: number; prio?: Job['priority'];
  service: string; cat?: 'brake' | 'service' | 'body' | 'ac'; elapsed?: string; bay?: string; dueIn: number; delivery?: Job['delivery'];
  delayed?: boolean; slot?: Job['slot']; done?: number; est?: string; estDate?: string; started?: string;
}
let tokSeq = 0;
const TOKCHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const token = (id: string) => {
  let s = '';
  let n = 7919 * (id.charCodeAt(id.length - 1) + 31 * ++tokSeq);
  for (let i = 0; i < 16; i++) { n = (n * 1103515245 + 12345) & 0x7fffffff; s += TOKCHARS[n % TOKCHARS.length]; }
  return `trk_${id.toLowerCase()}_${s}`;
};
const act = (by: string, at: string, text: string, i: number): Activity => ({ id: `a${i}`, at, by, text });

const mkJob = (s: JobSpec): Job => {
  const cat = s.cat ?? 'service';
  const step = STAGE_STEP[s.stage];
  const cl = cat === 'brake' ? 'Brake Service Checklist' : cat === 'ac' ? 'AC Service Checklist' : cat === 'body' ? 'Body Repair Checklist' : 'General Service Checklist';
  const total = CHECKLISTS[cl].length;
  const doneN = s.done ?? Math.round((s.prog / 100) * total * 0.5);
  const tn = TECH_NAMES[s.tech] ?? 'Team';
  const ts: Job['timeline'] = {
    inspection: step >= 0 ? '12 Mar 10:00 AM' : undefined,
    approval: step >= 2 ? '12 Mar 11:50 AM' : undefined,
    repair: step >= 2 ? '13 Mar 02:15 PM' : undefined,
    quality: step >= 4 ? '15 Mar 04:30 PM' : undefined,
    delivery: step >= 5 ? '16 Mar 05:00 PM' : undefined,
  };
  return {
    id: s.id, vehicleId: s.v.id, customerId: s.v.customerId, techId: s.tech, stage: s.stage, priority: s.prio ?? 'Medium', progress: s.prog,
    elapsed: s.elapsed, service: s.service, serviceCategory: cat, bayId: s.bay,
    startedLabel: s.started ?? '10 Mar 2025, 10:00 AM', estCompletion: s.est ?? 'Mon, 18 Mar 2025', estCompletionDate: s.estDate ?? '18 Mar 2025, 6:00 PM',
    promised: s.dueIn === 0 ? 'Mon, 16 Mar 2025, 03:30 PM' : s.dueIn < 0 ? `Sat, ${15 + s.dueIn} Mar 2025, 05:00 PM` : `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][(s.dueIn) % 5]}, ${16 + s.dueIn} Mar 2025, 05:00 PM`,
    dueLabel: s.dueIn === 0 ? '16 Mar 2025, 5:00 PM' : `${16 + s.dueIn} Mar 2025, 5:00 PM`,
    dueIn: s.dueIn, delivery: s.delivery, delayed: s.delayed, trackingToken: token(s.id),
    tasks: s.stage === 'delivered' ? tasksFor(cat, 5) : s.stage === 'pending' ? tasksFor(cat, -1) : tasksFor(cat, Math.min(4, Math.floor(s.prog / 40))),
    checklistName: cl, checklist: checklistFor(cl, s.stage === 'delivered' ? total : doneN),
    points: makePoints(s.id === 'J1004'),
    photos: s.id === 'J1004' ? [PH('disc-orange'), PH('disc-dark'), PH('garage-1'), PH('estimate-disc'), PH('bumper')] : [],
    notes: '', timeline: ts,
    activity: [
      act(tn, '12 Mar 2025, 10:00 AM', 'Vehicle checked in and inspection started', 1),
      ...(step >= 2 ? [act('Rahul Sharma', '12 Mar 2025, 11:50 AM', 'Estimate approved by customer', 2), act(tn, '13 Mar 2025, 02:15 PM', 'Repair work started', 3)] : []),
    ],
    slot: s.slot,
  };
};

const J: JobSpec[] = [
  { id: 'J1004', v: V.bmw3, tech: 'u-amit', stage: 'in_repair', prog: 75, prio: 'High', service: 'Brake Service - Disc Replacement', cat: 'brake', elapsed: '2h 30m', bay: 'bay-1', dueIn: 2, done: 3, slot: { x0: 0.05, x1: 2.65, start: 9, end: 10.2 } },
  { id: 'J1005', v: V.audiPriya, tech: 'u-amit', stage: 'diagnostics', prog: 30, service: 'General Service', elapsed: '1h 15m', dueIn: 3, slot: { x0: 0.2, x1: 3.0, start: 10, end: 11.4 } },
  { id: 'J1006', v: V.glcSneha, tech: 'u-amit', stage: 'quality_check', prog: 90, service: 'General Service', elapsed: '45m', bay: 'bay-4', dueIn: 0, delivery: { time: '4:30 PM', state: 'On Track' }, slot: { x0: 2.0, x1: 5.0, start: 12, end: 13.4 } },
  { id: 'J1007', v: V.fortRohit, tech: 'u-amit', stage: 'pending', prog: 0, service: 'AC Service', cat: 'ac', dueIn: 3, slot: { x0: 0.05, x1: 3.0, start: 14, end: 15.4 } },
  { id: 'J1008', v: V.rrNeha, tech: 'u-amit', stage: 'inspection', prog: 20, service: 'Inspection', bay: 'bay-2', dueIn: 2, slot: { x0: 2.2, x1: 5.0, start: 16, end: 17.4 } },
  { id: 'J1010', v: V.audiF1, tech: 'u-priya', stage: 'in_repair', prog: 60, prio: 'High', service: 'Brake Service', cat: 'brake', dueIn: 0, delivery: { time: '10:30 AM', state: 'At Risk' }, slot: { x0: 0, x1: 1, start: 9.75, end: 11.75 } },
  { id: 'J1011', v: V.glcF2, tech: 'u-karan', stage: 'in_repair', prog: 55, prio: 'High', service: 'General Service', dueIn: -1, delayed: true, slot: { x0: 0, x1: 1, start: 12, end: 13.75 } },
  { id: 'J1012', v: V.cityRs, tech: 'u-priya', stage: 'inspection', prog: 15, service: 'Inspection', bay: 'bay-3', dueIn: 1, slot: { x0: 0, x1: 1, start: 16.75, end: 18.25 } },
  { id: 'J1013', v: V.x5Rs, tech: 'u-nilesh', stage: 'diagnostics', prog: 35, service: 'AC Service', cat: 'ac', dueIn: 2, slot: { x0: 0, x1: 1, start: 11.25, end: 13.25 } },
  { id: 'J1014', v: V.rrF3, tech: 'u-nilesh', stage: 'in_repair', prog: 50, service: 'Detailing & PPF', cat: 'body', dueIn: 2, slot: { x0: 0, x1: 1, start: 8.75, end: 10.5 } },
  { id: 'J1015', v: V.x5F4, tech: 'u-rohit', stage: 'in_repair', prog: 45, prio: 'Medium', service: 'AC Service', cat: 'ac', dueIn: -2, slot: { x0: 0, x1: 1, start: 14.5, end: 16.25 } },
  { id: 'J1016', v: V.fortF5, tech: 'u-priya', stage: 'quality_check', prog: 85, service: 'Engine Service', dueIn: 0, delivery: { time: '2:00 PM', state: 'On Track' } },
  { id: 'J1017', v: V.glcF6, tech: 'u-nilesh', stage: 'ready', prog: 100, service: 'AC Service', cat: 'ac', bay: 'bay-5', dueIn: 1 },
  { id: 'J1018', v: V.fortF7, tech: 'u-karan', stage: 'ready', prog: 100, service: 'General Service', bay: 'bay-6', dueIn: 1 },
  { id: 'J1019', v: V.caymanF8, tech: 'u-rohit', stage: 'pending', prog: 0, service: 'Body Repair', cat: 'body', dueIn: 4 },
  { id: 'J1020', v: V.bmwPriya, tech: 'u-priya', stage: 'pending', prog: 0, service: 'General Service', dueIn: 3 },
  { id: 'J1021', v: V.audiNeha, tech: 'u-karan', stage: 'pending', prog: 0, service: 'Brake Service', cat: 'brake', dueIn: 4 },
  { id: 'J1022', v: V.cityviSneha, tech: 'u-nilesh', stage: 'pending', prog: 0, service: 'Inspection', dueIn: 5 },
];

// completed history: Rahul's four visits + eight more for Amit
const HIST: { id: string; v: Vehicle; service: string; cat: 'brake' | 'service' | 'body' | 'ac'; on: string; amt: number; days: number }[] = [
  { id: 'J0987', v: V.bmw3, service: 'Brake Service', cat: 'brake', on: '12 Mar 2025', amt: 18400, days: 4 },
  { id: 'J0971', v: V.audiRm, service: 'General Service', cat: 'service', on: '21 Jan 2025', amt: 12600, days: 54 },
  { id: 'J0925', v: V.glcRm, service: 'AC Service', cat: 'ac', on: '05 Dec 2024', amt: 24800, days: 101 },
  { id: 'J0860', v: V.fortRm, service: 'Engine Service', cat: 'service', on: '18 Oct 2024', amt: 15200, days: 149 },
  ...[V.cityRs, V.x5Rs, V.rrRs, V.bmwPriya, V.audiNeha, V.vikram1, V.vikram2, V.karan1].map((v, i) => ({
    id: `J09${40 + i}`, v, service: ['General Service', 'Brake Service', 'AC Service', 'General Service', 'Body Repair', 'General Service', 'Brake Service', 'AC Service'][i],
    cat: (['service', 'brake', 'ac', 'service', 'body', 'service', 'brake', 'ac'] as const)[i], on: `${3 + i * 3} Feb 2025`, amt: 8000 + i * 1300, days: 30 + i * 6,
  })),
];

const jobs: Job[] = [
  ...J.map(mkJob),
  ...HIST.map((h) => ({
    ...mkJob({ id: h.id, v: h.v, tech: 'u-amit', stage: 'delivered', prog: 100, service: h.service, cat: h.cat, dueIn: -h.days, started: h.on }),
    completedOn: h.on, completedInDays: h.days, estCompletion: h.on, estCompletionDate: h.on,
  })),
];
// Bay-bound inspection photos for the active BMW job
jobs.find((j) => j.id === 'J1004')!.notes = 'Customer asked for a road test after the brake job.';

// ------------------------------------------------------------------ estimates
const it = (id: string, name: string, category: string, type: string, amount: number) => ({ id, name, category, type, amount });
const estimates: Estimate[] = [
  { id: 'EST-1024', jobId: 'J1004', status: 'Awaiting Approval', sentHoursAgo: 4, why: 'Your brake pads are worn out and discs show deep scoring. Replacing them ensures safe driving.',
    items: [it('i1', 'Brake Pad (Front)', 'Parts', 'Parts', 8500), it('i2', 'Brake Disc (Front)', 'Parts', 'Parts', 18000), it('i3', 'Labour - Brake Service', 'Labour', 'Labour', 4000), it('i4', 'Brake Fluid', 'Parts', 'Parts', 1200), it('i5', 'Consumables', 'Parts', 'Parts', 800)] },
  { id: 'EST-1025', jobId: 'J1005', status: 'Awaiting Approval', sentHoursAgo: 30, why: 'Routine service items found worn during diagnostics.',
    items: [it('i1', 'Engine Oil & Filter', 'Parts', 'Parts + Labour', 9500), it('i2', 'Air Filter', 'Parts', 'Parts', 4500), it('i3', 'Labour - General Service', 'Labour', 'Labour', 12000), it('i4', 'Consumables', 'Parts', 'Parts', 4000)] },
  { id: 'EST-1026', jobId: 'J1013', status: 'Awaiting Approval', sentHoursAgo: 26, why: 'AC compressor needs replacement for proper cooling.',
    items: [it('i1', 'AC Compressor', 'Parts', 'Parts', 21000), it('i2', 'Labour - AC Service', 'Labour', 'Labour', 9000), it('i3', 'Refrigerant', 'Parts', 'Parts', 5000)] },
  { id: 'EST-1027', jobId: 'J1014', status: 'Awaiting Approval', sentHoursAgo: 2, why: 'Paint protection film and detailing as requested.',
    items: [it('i1', 'PPF Wrap', 'Parts', 'Parts', 20500), it('i2', 'Labour - Detailing', 'Labour', 'Labour', 10000)] },
  { id: 'EST-1023', jobId: 'J1006', status: 'Approved', sentHoursAgo: 52, why: 'Standard service.', items: [it('i1', 'Engine Oil & Filter', 'Parts', 'Parts + Labour', 6500), it('i2', 'Labour', 'Labour', 'Labour', 3500)] },
  { id: 'EST-1022', jobId: 'J1010', status: 'Approved', sentHoursAgo: 60, why: 'Brake service.', items: [it('i1', 'Brake Pad (Front)', 'Parts', 'Parts', 7500), it('i2', 'Labour - Brake Service', 'Labour', 'Labour', 4000)] },
  { id: 'EST-1021', jobId: 'J1016', status: 'Rejected', sentHoursAgo: 90, why: 'Engine service.', items: [it('i1', 'Timing belt kit', 'Parts', 'Parts', 15000), it('i2', 'Labour', 'Labour', 'Labour', 8000)] },
];

// ------------------------------------------------------------------ invoices
const invoices: Invoice[] = [
  { id: 'INV-1024', customerId: 'c-rahul-m', vehicleId: V.bmw3.id, jobId: 'J0987', amount: 18400, date: '12 Mar 2025', status: 'Paid' },
  { id: 'INV-1023', customerId: 'c-rahul-m', vehicleId: V.audiRm.id, jobId: 'J0971', amount: 12600, date: '21 Jan 2025', status: 'Paid' },
  { id: 'INV-1022', customerId: 'c-rahul-m', vehicleId: V.glcRm.id, jobId: 'J0925', amount: 24800, date: '05 Dec 2024', status: 'Paid' },
  { id: 'INV-1021', customerId: 'c-rahul-m', vehicleId: V.fortRm.id, jobId: 'J0860', amount: 15200, date: '18 Oct 2024', status: 'Paid' },
  { id: 'INV-1020', customerId: 'c-rahul-s', vehicleId: V.cityRs.id, amount: 9300, date: '10 Mar 2025', status: 'Paid' },
  { id: 'INV-1019', customerId: 'c-neha-p', vehicleId: V.audiNeha.id, amount: 11200, date: '14 Mar 2025', status: 'Pending' },
];

// ------------------------------------------------------------------ inventory
const part = (id: string, name: string, category: string, stock: number, minStock: number, icon?: string, supplier?: string): Part => ({ id, name, category, stock, minStock, icon, supplier });
const inventory: Part[] = [
  part('p1', 'Brake Pad (Front)', 'Brakes', 24, 10, 'brake-pad', 'Bosch India'),
  part('p2', 'Brake Disc (Front)', 'Brakes', 12, 10, 'brake-disc', 'Bosch India'),
  part('p3', 'Engine Oil SW30', 'Fluids', 48, 20, 'engine-oil', 'Castrol'),
  part('p4', 'Air Filter', 'Filters', 18, 10, 'air-filter', 'Mann Filter'),
  part('p5', 'Spark Plug', 'Electrical', 8, 10, 'spark-plug', 'NGK'),
  part('p6', 'AC Filter', 'Filters', 14, 10, 'ac-filter', 'Mann Filter'),
  part('p7', 'Cabin Filter', 'Filters', 10, 10, 'cabin-filter', 'Mann Filter'),
  part('p8', 'Oil Filter', 'Filters', 22, 10, 'oil-filter', 'Mann Filter'),
];

const partRequests: PartRequest[] = [
  { id: 'pr1', partName: 'Brake Pad (Front)', jobId: 'J1004', qty: 4, status: 'Approved', requestedBy: 'u-amit', at: '15 Mar 2025' },
  { id: 'pr2', partName: 'Engine Oil SW30', jobId: 'J1005', qty: 6, status: 'Pending', requestedBy: 'u-amit', at: '16 Mar 2025' },
  { id: 'pr3', partName: 'Air Filter', jobId: 'J1007', qty: 1, status: 'Approved', requestedBy: 'u-amit', at: '16 Mar 2025' },
  { id: 'pr4', partName: 'Spark Plug', jobId: 'J1006', qty: 4, status: 'Rejected', requestedBy: 'u-amit', at: '14 Mar 2025' },
];

// ------------------------------------------------------------------ chat
const channels: Channel[] = [
  { id: 'ch-general', name: 'General', kind: 'group', members: 12, last: 'New jobs assigned...', lastAt: '12:00 PM', unread: 3 },
  { id: 'dm-priya', name: 'Priya Singh', kind: 'dm', withUser: 'u-priya', last: 'Brake pads arrived', lastAt: '10:30 AM', unread: 0 },
  { id: 'dm-karan', name: 'Karan Singh', kind: 'dm', withUser: 'u-karan', last: 'On my way', lastAt: '09:15 AM', unread: 0 },
  { id: 'dm-neha', name: 'Neha Patil', kind: 'dm', withUser: 'u-nilesh', last: 'Check this photo', lastAt: '09:00 AM', unread: 0 },
  { id: 'dm-vikram', name: 'Vikram Jadhav', kind: 'dm', withUser: 'u-vikram', last: 'Job completed', lastAt: 'Yesterday', unread: 0 },
];
const messages: Message[] = [
  { id: 'm1', channelId: 'ch-general', from: 'u-priya', at: '10:30 AM', text: 'The brake pads for BMW have arrived.', image: PH('pads-chat'), reactions: [{ emoji: '👍', count: 2 }] },
  { id: 'm2', channelId: 'ch-general', from: 'u-karan', at: '10:45 AM', text: 'I am starting the inspection for Toyota.' },
  { id: 'm3', channelId: 'ch-general', from: 'u-amit', at: '11:20 AM', text: 'Great. Please update the checklist once done.' },
  { id: 'm4', channelId: 'dm-priya', from: 'u-priya', at: '10:30 AM', text: 'Brake pads arrived' },
  { id: 'm5', channelId: 'dm-karan', from: 'u-karan', at: '09:15 AM', text: 'On my way' },
  { id: 'm6', channelId: 'dm-neha', from: 'u-nilesh', at: '09:00 AM', text: 'Check this photo' },
  { id: 'm7', channelId: 'dm-vikram', from: 'u-vikram', at: 'Yesterday', text: 'Job completed' },
];

// ------------------------------------------------------------------ notifications (customer)
const n = (id: string, kind: Notification['kind'], title: string, sub: string, ago: string, read: boolean, href?: string): Notification => ({ id, customerId: 'c-rahul-m', kind, title, sub, ago, read, href });
const notifications: Notification[] = [
  n('n1', 'service', 'Your vehicle is in Repair', 'BMW 3 Series', '2 hours ago', false, '/customer/jobs/J1004'),
  n('n2', 'estimate', 'Estimate EST-1024 awaiting approval', 'BMW 3 Series', '4 hours ago', false, '/customer/estimates/EST-1024'),
  n('n3', 'ready', 'Your vehicle is ready for delivery', 'Audi Q5', '2 days ago', true),
  n('n4', 'payment', 'Payment received', 'Invoice INV-1025', '5 days ago', true, '/customer/invoices'),
  n('n5', 'reminder', 'Upcoming service reminder', 'Toyota Fortuner', '1 week ago', true, '/customer/bookings'),
];

// ------------------------------------------------------------------ garage + bays
const bays: Bay[] = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
  id: `bay-${i}`, name: `Bay ${i}`, x: 70 + ((i - 1) % 4) * 225, y: i <= 4 ? 70 : 340, w: 190, h: 190, lift: i <= 4,
}));

export const createSeed = (): Db => ({
  version: DB_VERSION,
  today: TODAY_LABEL,
  garage: { name: 'AutoHub Premium Car Care', address: 'Pune, Maharashtra, India', phone: '+91 98765 43210', email: 'support@autohub.com', currency: 'INR (₹)', dateFormat: 'DD MMM YYYY', timeZone: 'Asia/Kolkata', plan: { w: 1000, h: 600 }, bays },
  users, customers, vehicles, jobs, estimates, invoices, inventory, partRequests,
  purchaseOrders: [
    { id: 'PO-2041', supplier: 'Bosch India', items: 'Brake Pad (Front) x20, Brake Disc (Front) x10', amount: 96000, status: 'Ordered', date: '14 Mar 2025' },
    { id: 'PO-2040', supplier: 'NGK', items: 'Spark Plug x40', amount: 18400, status: 'Delivered', date: '08 Mar 2025' },
    { id: 'PO-2039', supplier: 'Mann Filter', items: 'Cabin Filter x30', amount: 12600, status: 'Draft', date: '05 Mar 2025' },
  ],
  suppliers: [
    { id: 's1', name: 'Bosch India', contact: 'Anil Deshmukh', phone: '+91 98220 11001', category: 'Brakes' },
    { id: 's2', name: 'Mann Filter', contact: 'Sunita Rao', phone: '+91 98220 11002', category: 'Filters' },
    { id: 's3', name: 'Castrol', contact: 'Mohan Das', phone: '+91 98220 11003', category: 'Fluids' },
    { id: 's4', name: 'NGK', contact: 'Hiroshi Tanaka', phone: '+91 98220 11004', category: 'Electrical' },
  ],
  channels, messages,
  announcements: [
    { id: 'an1', title: 'Safety briefing', body: 'Mandatory lift-safety refresher this Friday at 4:00 PM in Bay 1.', at: '15 Mar 2025', by: 'Rahul Sharma' },
    { id: 'an2', title: 'New brake pad supplier', body: 'Bosch India is now our primary supplier for brake pads and discs.', at: '12 Mar 2025', by: 'Rahul Sharma' },
  ],
  notifications, bookings: [
    { id: 'bk1', customerId: 'c-rahul-m', vehicleId: V.fortRm.id, service: 'General Service', date: 'Sat, 22 Mar 2025', time: '10:00 AM', status: 'Confirmed' },
  ],
  prefs: {
    'u-amit': { notifications: true, jobAlerts: true, partsUpdates: true, teamMessages: true, darkMode: false, language: 'English' },
    'u-admin': { notifications: true, jobAlerts: true, partsUpdates: true, teamMessages: true, darkMode: false, language: 'English' },
  },
});
