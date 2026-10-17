// Mock data mirroring the AutoCare Pro design screens. Replace with API calls later.

export type Tone = 'green' | 'orange' | 'purple' | 'blue' | 'red' | 'gray' | 'teal';

export const ASSET = (name: string) => `/assets/${name}`;

export const JOB_ID = 'G-1024';
export const TRACK_CODE = 'G-1024-a8f7xk9';

export const job = {
  id: 'G-1024',
  status: 'In Progress',
  createdOn: '15 Dec 2024, 10:30 AM',
  vehicle: {
    name: 'Honda City 2021',
    shortName: 'Honda City',
    reg: 'MH12 AB 1234',
    brand: 'Honda',
    model: 'City',
    year: '2021',
    variant: 'VX',
    odometer: '28,450 km',
    fuel: 50,
    image: ASSET('car-hero.png'),
  },
  customer: {
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul@example.com',
    avatar: ASSET('avatar-rahul.png'),
  },
  serviceType: 'Body Repair',
  priority: 'High',
  complaint: 'Front bumper scratched and right rear door dent. Need repainting.',
  expectedDelivery: '18 Dec 2024, 5:00 PM',
  expectedDate: '18 Dec 2024',
  expectedTime: '5:00 PM',
  team: [
    { name: 'Sandeep Kumar', role: 'Mechanic', avatar: ASSET('avatar-sandeep.png') },
    { name: 'Amit Patil', role: 'Service Advisor', avatar: ASSET('avatar-amit.png') },
  ],
};

export type TimelineStep = { label: string; time?: string; state: 'done' | 'current' | 'pending' };

export const adminTimeline: TimelineStep[] = [
  { label: 'Vehicle Received', time: '15 Dec, 10:30 AM', state: 'done' },
  { label: 'Inspection Completed', time: '15 Dec, 11:00 AM', state: 'done' },
  { label: 'Estimate Sent', time: '15 Dec, 12:00 PM', state: 'done' },
  { label: 'Estimate Approved', time: '15 Dec, 12:30 PM', state: 'done' },
  { label: 'Repair in Progress', time: '15 Dec, 02:30 PM', state: 'current' },
  { label: 'Quality Check', state: 'pending' },
  { label: 'Ready for Pickup', state: 'pending' },
];

export const employeeTimeline: TimelineStep[] = [
  { label: 'Vehicle Received', time: '15 Dec, 10:30 AM', state: 'done' },
  { label: 'Inspection Completed', time: '15 Dec, 11:00 AM', state: 'done' },
  { label: 'Estimate Sent', time: '15 Dec, 12:00 PM', state: 'done' },
  { label: 'Repair in Progress', time: '15 Dec, 02:30 PM', state: 'current' },
  { label: 'Quality Check', time: 'Pending', state: 'pending' },
  { label: 'Ready for Pickup', time: 'Pending', state: 'pending' },
];

export const customerTimeline: TimelineStep[] = [
  { label: 'Received', time: '15 Dec, 10:30 AM', state: 'done' },
  { label: 'Inspection', time: '15 Dec, 11:00 AM', state: 'done' },
  { label: 'Estimate', time: '15 Dec, 12:00 PM', state: 'done' },
  { label: 'Repair', time: 'In Progress', state: 'current' },
  { label: 'Quality Check', time: 'Pending', state: 'pending' },
  { label: 'Ready for Pickup', time: 'Pending', state: 'pending' },
];

export const mobileTimeline: TimelineStep[] = [
  { label: 'Vehicle Received', time: '15 Dec, 10:30 AM', state: 'done' },
  { label: 'Inspection Completed', time: '15 Dec, 11:00 AM', state: 'done' },
  { label: 'Estimate Approved', time: '15 Dec, 12:00 PM', state: 'done' },
  { label: 'Repair in Progress', time: 'In Progress', state: 'current' },
  { label: 'Quality Check', time: 'Pending', state: 'pending' },
  { label: 'Ready for Pickup', time: 'Pending', state: 'pending' },
];

// ---------------------------------------------------------------- admin
export const dashboardStats = [
  { value: '18', label: 'Active Jobs', tone: 'blue' as Tone, icon: 'jobs' },
  { value: '6', label: 'Waiting Approval', tone: 'red' as Tone, icon: 'clock' },
  { value: '4', label: 'Ready for Pickup', tone: 'green' as Tone, icon: 'ready' },
  { value: '₹ 4,85,000', label: 'Revenue (This Month)', tone: 'green' as Tone, icon: 'revenue', link: true },
];

export const todaysJobs = [
  { id: 'G-1024', vehicle: 'Honda City', status: 'In Progress', tone: 'green' as Tone, image: ASSET('car-silver-1.png') },
  { id: 'G-1023', vehicle: 'Creta', status: 'Waiting Approval', tone: 'orange' as Tone, image: ASSET('car-red.png') },
  { id: 'G-1022', vehicle: 'Swift', status: 'Inspection', tone: 'purple' as Tone, image: ASSET('car-red-2.png') },
  { id: 'G-1021', vehicle: 'Nexon', status: 'Ready for Pickup', tone: 'blue' as Tone, image: ASSET('car-silver-2.png') },
  { id: 'G-1019', vehicle: 'i20', status: 'In Progress', tone: 'green' as Tone, image: ASSET('car-silver-3.png') },
];

// Bay callouts positioned over the workshop photo (percentages of the photo box)
export const bays = [
  { name: 'Bay 1', status: 'In Progress', vehicle: 'Honda City', dot: '#2f6fed', left: 8.6, top: 18.2 },
  { name: 'Bay 3', status: 'Waiting Parts', vehicle: 'Swift', dot: '#e5484d', left: 55.2, top: 3.9 },
  { name: 'Bay 3', status: 'Waiting for QC', vehicle: 'Swift', dot: '#8b5cf6', left: 73.5, top: 38.4 },
  { name: 'Bay 4', status: 'Ready for QC', vehicle: 'Virtus', dot: '#1f9d63', left: 42.1, top: 64.5 },
];

export const jobCardTabs = [
  { label: 'All', count: 28 },
  { label: 'In Progress', count: 12 },
  { label: 'Waiting Approval', count: 6 },
  { label: 'Ready', count: 4 },
  { label: 'Completed', count: 120 },
];

export type JobRow = {
  id: string;
  vehicle: string;
  customer: string;
  service: string;
  status: string;
  statusTone: Tone;
  priority: 'High' | 'Medium' | 'Low' | '-';
  assigned: string;
  eta: string;
  image: string;
  group: string;
};

export const jobRows: JobRow[] = [
  { id: 'G-1024', vehicle: 'Honda City', customer: 'Rahul Sharma', service: 'Body Repair', status: 'In Progress', statusTone: 'green', priority: 'High', assigned: 'Sandeep', eta: '15 Dec', image: ASSET('car-white.png'), group: 'In Progress' },
  { id: 'G-1023', vehicle: 'Creta', customer: 'Priya Patel', service: 'AC Service', status: 'Waiting Approval', statusTone: 'orange', priority: 'Medium', assigned: 'Amit', eta: '16 Dec', image: ASSET('car-silver-2.png'), group: 'Waiting Approval' },
  { id: 'G-1022', vehicle: 'Swift', customer: 'Amit Singh', service: 'General Service', status: 'Inspection', statusTone: 'purple', priority: 'Medium', assigned: 'Ramesh', eta: '15 Dec', image: ASSET('car-dark.png'), group: 'In Progress' },
  { id: 'G-1021', vehicle: 'Nexon', customer: 'Neha Jadhav', service: 'Engine Repair', status: 'Ready', statusTone: 'blue', priority: 'High', assigned: 'Vikram', eta: '15 Dec', image: ASSET('car-dark.png'), group: 'Ready' },
  { id: 'G-1020', vehicle: 'Virtus', customer: 'Karan Mehta', service: 'Brake Repair', status: 'In Progress', statusTone: 'blue', priority: 'Low', assigned: 'Shankar', eta: '16 Dec', image: ASSET('car-silver-3.png'), group: 'In Progress' },
  { id: 'G-1019', vehicle: 'i20', customer: 'Deepak Patil', service: 'General Service', status: 'In Progress', statusTone: 'blue', priority: 'Medium', assigned: 'Ramesh', eta: '15 Dec', image: ASSET('car-blue.png'), group: 'In Progress' },
  { id: 'G-1018', vehicle: 'XUV700', customer: 'Anjali Deshpande', service: 'AC Service', status: 'Completed', statusTone: 'green', priority: '-', assigned: '-', eta: '14 Dec', image: ASSET('car-white.png'), group: 'Completed' },
  { id: 'G-1017', vehicle: 'Ertiga', customer: 'Sameer Khan', service: 'Suspension', status: 'In Progress', statusTone: 'blue', priority: 'High', assigned: 'Amit', eta: '16 Dec', image: ASSET('car-blue.png'), group: 'In Progress' },
  { id: 'G-1016', vehicle: 'Grand i10', customer: 'Rohit Bansal', service: 'Body Repair', status: 'Waiting Parts', statusTone: 'orange', priority: 'High', assigned: 'Vikram', eta: '17 Dec', image: ASSET('car-red-2.png'), group: 'Waiting Approval' },
];

export const estimateAdmin = {
  id: 'E-1024',
  createdOn: '15 Dec 2024',
  items: [
    { item: 'Front Bumper', type: 'Part', qty: 1, rate: '8,500', amount: '8,500' },
    { item: 'Paint Material', type: 'Part', qty: 1, rate: '2,000', amount: '2,000' },
    { item: 'Bumper Painting', type: 'Labour', qty: 4, rate: '800', amount: '3,200' },
    { item: 'Dent Repair', type: 'Labour', qty: 3, rate: '800', amount: '2,400' },
  ],
  subtotal: '₹ 16,100',
  gst: '₹ 2,898',
  total: '₹ 18,998',
  approval: [
    { label: 'Estimate Sent', time: '15 Dec, 12:00 PM', state: 'done' as const },
    { label: 'Customer Approved', time: '15 Dec, 12:30 PM', state: 'done' as const },
    { label: 'Work in Progress', state: 'current' as const },
    { label: 'Completed', state: 'pending' as const },
  ],
};

export const estimateCustomer = {
  id: 'E-1024',
  sentOn: '15 Dec 2024, 12:00 PM',
  items: [
    { item: 'Front Bumper', type: 'Part', qty: 1, rate: '8,500', amount: '8,500' },
    { item: 'Painting (Bumper)', type: 'Labour', qty: 1, rate: '3,200', amount: '3,200' },
    { item: 'Right Door Dent Repair', type: 'Labour', qty: 1, rate: '2,400', amount: '2,400' },
    { item: 'Paint Material', type: 'Part', qty: 1, rate: '2,000', amount: '2,000' },
  ],
  subtotal: '₹ 16,100',
  gst: '₹ 2,898',
  total: '₹ 18,998',
};

export const adminWorkSteps = [
  { label: 'Diagnosis', detail: 'Completed 15 Dec, 11:00 AM', state: 'done' as const },
  { label: 'Repair Work', detail: 'Front bumper removed and repair started', state: 'current' as const },
  { label: 'Painting', detail: 'Waiting for body shop slot', state: 'pending' as const },
  { label: 'Reassembly', detail: 'Pending', state: 'pending' as const },
  { label: 'Quality Check', detail: 'Pending', state: 'pending' as const },
];

export const progressPhotos = [1, 2, 3, 4, 5, 6].map((n) => ASSET(`prog-${n}.png`));

export const partsUsed = [
  { name: 'Front Bumper', no: '71101-T8A', qty: 1, unit: '8,500', total: '8,500' },
  { name: 'Paint Material', no: 'PP-102', qty: 1, unit: '2,000', total: '2,000' },
];

export const partsRequestsAdmin = [
  { name: 'Front Bumper', reason: 'Damaged', status: 'Approved', tone: 'green' as Tone, on: '15 Dec 2024' },
  { name: 'Paint Material', reason: 'Required for painting', status: 'Pending', tone: 'orange' as Tone, on: '15 Dec 2024' },
];

export const invoices = [
  { id: 'INV-1024', customer: 'Rahul Sharma', vehicle: 'Honda City', amount: '₹ 18,998', date: '15 Dec 2024', status: 'Paid' },
  { id: 'INV-1023', customer: 'Priya Patel', vehicle: 'Creta', amount: '₹ 12,450', date: '14 Dec 2024', status: 'Unpaid' },
  { id: 'INV-1022', customer: 'Amit Singh', vehicle: 'Swift', amount: '₹ 8,760', date: '13 Dec 2024', status: 'Paid' },
  { id: 'INV-1021', customer: 'Neha Jadhav', vehicle: 'Nexon', amount: '₹ 21,300', date: '12 Dec 2024', status: 'Paid' },
];

export const reportStats = [
  { label: 'Total Revenue', value: '₹ 4,85,000', change: '+ 12%' },
  { label: 'Total Jobs', value: '128', change: '+ 8%' },
  { label: 'Avg. Job Value', value: '₹ 3,789', change: '+ 5%' },
];

export const revenueTrend = [
  { month: 'Dec', value: 620 },
  { month: 'Jan', value: 780 },
  { month: 'Feb', value: 940, label: '₹ 4,85,000' },
  { month: 'Mar', value: 1000 },
  { month: 'Apr', value: 1150 },
  { month: 'May', value: 1350 },
];

export const serviceBreakdown = [
  { label: 'General Service', pct: 35, color: '#2e6d68' },
  { label: 'AC Service', pct: 20, color: '#3daf6c' },
  { label: 'Body Repair', pct: 18, color: '#eda24a' },
  { label: 'Engine Repair', pct: 15, color: '#b77fc4' },
  { label: 'Others', pct: 12, color: '#8c7aa6' },
];

// ---------------------------------------------------------------- employee
export const myJobsTabs = [
  { label: 'All', count: 6 },
  { label: 'In Progress', count: 3 },
  { label: 'Waiting for Parts', count: 1 },
  { label: 'Completed', count: 2 },
];

export const myJobs = [
  { id: 'G-1024', vehicle: 'Honda City 2021', reg: 'MH12 AB 1234', status: 'In Progress', tone: 'blue' as Tone, task: 'Front bumper repair', progress: 60, day: 'Today', time: '5:00 PM', image: ASSET('car-silver-1.png'), bar: '#1fa25f' },
  { id: 'G-1023', vehicle: 'Creta 2022', reg: 'MH14 CD 5678', status: 'Waiting for Parts', tone: 'orange' as Tone, task: 'AC Compressor', progress: 30, day: 'Today', time: '3:00 PM', image: ASSET('car-red.png'), bar: '#7c8a96' },
  { id: 'G-1021', vehicle: 'Swift 2020', reg: 'MH12 EF 9012', status: 'Diagnosis', tone: 'purple' as Tone, task: 'Electrical issue', progress: 10, day: 'Today', time: '6:00 PM', image: ASSET('car-silver-2.png'), bar: '#7c8a96' },
  { id: 'G-1018', vehicle: 'i20 2023', reg: 'MH14 GH 3456', status: 'In Progress', tone: 'blue' as Tone, task: 'General Service', progress: 40, day: 'Tomorrow', time: '11:00 AM', image: ASSET('car-silver-3.png'), bar: '#1fa25f' },
];

export const serviceTypes = [
  { key: 'body', label: 'Body Repair' },
  { key: 'general', label: 'General Service' },
  { key: 'ac', label: 'AC Service' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'engine', label: 'Engine Repair' },
  { key: 'suspension', label: 'Suspension' },
  { key: 'tyre', label: 'Tyre & Wheel' },
  { key: 'other', label: 'Other' },
];

export const damageTypes = ['Scratch', 'Dent', 'Paint Damage', 'Broken', 'Replace'];
export const damageLegend = [
  { label: 'Scratch', color: '#e5484d' },
  { label: 'Dent', color: '#f5a524' },
  { label: 'Paint Damage', color: '#f7b84b' },
  { label: 'Broken', color: '#2563eb' },
  { label: 'Replace', color: '#1e2f45' },
];
export const severities = ['Low', 'Medium', 'High'];

export const workDone = [
  { label: 'Front bumper removed', done: true },
  { label: 'Dent repair started', done: true },
  { label: 'Painting in progress', done: false },
  { label: 'Reassembly', done: false },
  { label: 'Quality check', done: false },
];

export const partsRequests = [
  { name: 'Front Bumper', sub: 'Honda City 2021', qty: 'Qty: 1', on: '15 Dec 2024', status: 'Pending', image: ASSET('part-bumper.png') },
  { name: 'Paint Material', sub: 'Pearl White NH-883P', qty: 'Qty: 1', on: '15 Dec 2024', status: 'Approved', image: ASSET('part-paint.png') },
  { name: 'Bumper Clips', sub: 'OEM', qty: 'Qty: 10', on: '14 Dec 2024', status: 'Pending', image: ASSET('part-clips.png') },
];

export const galleryPhotos = [
  { src: ASSET('ephoto-1.png'), group: 'Inspection' },
  { src: ASSET('ephoto-2.png'), group: 'Inspection' },
  { src: ASSET('ephoto-3.png'), group: 'Inspection' },
  { src: ASSET('ephoto-4.png'), group: 'Repair Progress' },
  { src: ASSET('ephoto-5.png'), group: 'Repair Progress' },
];

export const serviceHistory = [
  { id: 'G-0987', date: '12 Nov 2024', title: 'General Service', detail: 'Oil change, filter replacement' },
  { id: 'G-0854', date: '14 Aug 2024', title: 'AC Service', detail: 'Gas refill, cleaning' },
  { id: 'G-0721', date: '20 May 2024', title: 'Brake Repair', detail: 'Brake pads replacement' },
  { id: 'G-0610', date: '12 Jan 2024', title: 'Tyre Replacement', detail: '2 tyres replaced' },
];

// 3D inspection damage points (positions are % of the viewport image)
export type DamagePoint = {
  id: number;
  panel: string;
  description: string;
  type: string;
  severity: string;
  color: string;
  x: number;
  y: number;
  thumb: string;
};

export const damagePoints3d: DamagePoint[] = [
  { id: 1, panel: 'Front Bumper', description: 'Scratch on lower bumper. Needs repainting.', type: 'Scratch', severity: 'Medium', color: '#e5484d', x: 40.3, y: 59.8, thumb: ASSET('x3d-p1.png') },
  { id: 2, panel: 'Right Front Door', description: 'Dent and scratch. Panel repair required.', type: 'Dent', severity: 'High', color: '#f5a524', x: 62.8, y: 48.1, thumb: ASSET('x3d-p2.png') },
  { id: 3, panel: 'Right Rear Door', description: 'Paint damage and scratch.', type: 'Paint Damage', severity: 'Medium', color: '#2563eb', x: 76.1, y: 43.8, thumb: ASSET('x3d-p3.png') },
  { id: 4, panel: 'Rear Right Panel', description: 'Deep scratch near tail light.', type: 'Scratch', severity: 'Medium', color: '#f5a524', x: 84.8, y: 38.1, thumb: ASSET('x3d-p4.png') },
];

export const viewAngles = [
  { key: 'front-left', label: 'Front Left' },
  { key: 'front', label: 'Front' },
  { key: 'front-right', label: 'Front Right' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
  { key: 'back-right', label: 'Back Right' },
  { key: 'back', label: 'Back' },
  { key: 'top', label: 'Top' },
];

// Admin 2D inspection markers (positions are % of diagram-admin.png)
export const adminMarkers = [
  { x: 50.3, y: 12.9, color: '#e5484d', type: 'Scratch' },
  { x: 50.3, y: 46.3, color: '#1e4f86', type: 'Replace' },
  { x: 16.3, y: 62.1, color: '#2563eb', type: 'Broken' },
  { x: 82.4, y: 65.8, color: '#f5a524', type: 'Paint Damage' },
];

// Customer damage-diagram markers (positions are % of diagram-customer.png)
export const customerMarkers = [
  { x: 74.1, y: 21.8, color: '#2563eb' },
  { x: 77.2, y: 48.6, color: '#2563eb' },
  { x: 18.9, y: 49.0, color: '#f5a524' },
  { x: 9.9, y: 79.4, color: '#e5484d' },
  { x: 40.1, y: 85.2, color: '#f5a524' },
  { x: 72.2, y: 77.4, color: '#e5484d' },
  { x: 82.1, y: 78.2, color: '#f5a524' },
  { x: 76.9, y: 82.3, color: '#2563eb' },
];

export const customerDamages = [
  { n: 1, title: 'Scratch', place: 'Front bumper', side: 'Left side', color: '#e5484d', photo: ASSET('dmg-1.png') },
  { n: 2, title: 'Dent', place: 'Right rear door', color: '#f5a524', photo: ASSET('dmg-2.png') },
  { n: 3, title: 'Paint Damage', place: 'Left side panel', color: '#2563eb', photo: ASSET('dmg-3.png') },
  { n: 4, title: 'Broken', place: 'Right tail light', color: '#1e2f45', photo: ASSET('dmg-4.png') },
];

export const customerProgress = [
  { title: 'Front bumper removed', time: '15 Dec, 02:30 PM', text: 'Front bumper removed and dent repair started.', state: 'current' as const, photo: ASSET('prog-2.png') },
  { title: 'Painting in progress', time: '15 Dec, 11:00 AM', text: 'Vehicle moved to paint booth.', state: 'done' as const, photo: ASSET('car-silver-1.png') },
  { title: 'Inspection completed', time: '15 Dec, 10:30 PM', text: 'Damage areas identified and estimate prepared.', state: 'done' as const, photo: ASSET('dphoto-2.png') },
  { title: 'Vehicle received', time: '15 Dec, 10:30 AM', text: 'Vehicle checked in at our garage.', state: 'done' as const, photo: ASSET('dphoto-1.png') },
];
