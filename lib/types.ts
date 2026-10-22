export type Role = 'admin' | 'technician' | 'customer';

export type Stage = 'pending' | 'inspection' | 'diagnostics' | 'in_repair' | 'quality_check' | 'ready' | 'delivered';

export type CarKey = 'bmw3' | 'audiq5' | 'glc' | 'fortuner' | 'bmwx5' | 'rangerover';

export type Priority = 'High' | 'Medium' | 'Low';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Display title, e.g. "Admin", "Technician", "Service Advisor", "Premium Member" */
  title: string;
  email: string;
  phone: string;
  avatar: string;
  password: string; // demo only
  empId?: string;
  joined?: string;
  online?: boolean;
  customerId?: string;
  location?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  totalSpent: number;
  lastService: string;
  followUp?: boolean;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  reg: string;
  year: number;
  variant: string;
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  odometer: number;
  carKey: CarKey;
  primary?: boolean;
  /** Days until the next service is due; negative = overdue */
  serviceInDays?: number;
}

export type TaskStatus = 'Completed' | 'In Progress' | 'Pending';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export type PointStatus = 'good' | 'minor' | 'major' | 'unchecked';
export type Zone = 'body' | 'rear-left' | 'mid-left' | 'wheel-left' | 'rear-right' | 'mid-right' | 'wheel-right';
export type DamageType = 'Scratch' | 'Dent' | 'Paint Damage' | 'Cracked' | 'Missing' | 'Custom';
export type Severity = 'Minor' | 'Major' | 'Critical';

export interface InspectionPoint {
  id: string;
  label: string;
  zone: Zone;
  /** position inside the zone view, in % */
  x: number;
  y: number;
  status: PointStatus;
  damage: DamageType;
  severity: Severity;
  notes: string;
  photos: string[];
}

export interface TimelineStep {
  key: 'inspection' | 'approval' | 'repair' | 'quality' | 'delivery';
  label: string;
  at?: string;
}

export interface Activity {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface JobSlot {
  /** fractional column (Mon=0) the block starts/ends at in the week grid */
  x0: number;
  x1: number;
  start: number;
  end: number;
}

export interface Job {
  id: string;
  vehicleId: string;
  customerId: string;
  techId: string;
  stage: Stage;
  priority: Priority;
  progress: number;
  elapsed?: string;
  service: string;
  serviceCategory: string;
  bayId?: string;
  startedLabel: string;
  estCompletion: string;
  estCompletionDate: string;
  promised: string;
  dueLabel: string;
  /** days relative to the demo "today": 0 = today, <0 = overdue */
  dueIn: number;
  delivery?: { time: string; state: 'On Track' | 'At Risk' };
  delayed?: boolean;
  trackingToken: string;
  tasks: Task[];
  checklistName: string;
  checklist: ChecklistItem[];
  points: InspectionPoint[];
  photos: string[];
  notes: string;
  timeline: Record<TimelineStep['key'], string | undefined>;
  activity: Activity[];
  slot?: JobSlot;
  completedOn?: string;
  completedInDays?: number;
  onHold?: boolean;
  feedback?: { rating: number; comment: string; at: string };
}

export type EstimateStatus = 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Draft';

export interface EstimateItem {
  id: string;
  name: string;
  category: string;
  type: string;
  amount: number;
  /** quantity; unit price is amount / qty (defaults to 1) */
  qty?: number;
}

export interface Estimate {
  id: string;
  jobId: string;
  status: EstimateStatus;
  items: EstimateItem[];
  sentHoursAgo: number;
  why: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Cancelled';

export interface Invoice {
  id: string;
  customerId: string;
  vehicleId: string;
  jobId?: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
  paidOn?: string;
  method?: string;
  txnId?: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  icon?: string;
  supplier?: string;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PartRequest {
  id: string;
  partName: string;
  jobId: string;
  qty: number;
  status: RequestStatus;
  requestedBy: string;
  at: string;
}

export interface Message {
  id: string;
  channelId: string;
  from: string;
  at: string;
  text: string;
  image?: string;
  reactions?: { emoji: string; count: number }[];
}

export interface Channel {
  id: string;
  name: string;
  kind: 'group' | 'dm';
  members?: number;
  withUser?: string;
  last: string;
  lastAt: string;
  unread: number;
}

export type NotificationKind = 'service' | 'estimate' | 'ready' | 'payment' | 'reminder' | 'offer';

export interface Notification {
  id: string;
  customerId: string;
  kind: NotificationKind;
  title: string;
  sub: string;
  ago: string;
  read: boolean;
  href?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  service: string;
  date: string;
  time: string;
  status: 'Requested' | 'Confirmed';
  notes?: string;
}

export type BayType = 'general' | 'inspection' | 'diagnostics' | 'detailing' | 'tyre' | 'quality' | 'wash';
/** Physical condition of a bay. Occupancy is never stored: it is derived from jobs that point at the bay. */
export type BayState = 'normal' | 'maintenance' | 'reserved';

export interface Bay {
  id: string;
  name: string;
  type: BayType;
  /** all geometry is in metres; x/y is the top-left corner of the footprint on the workshop plan */
  x: number;
  y: number;
  /** across the vehicle */
  w: number;
  /** along the vehicle */
  l: number;
  /** 0: the vehicle points along the plan's Y axis, 90: along X (the footprint is rotated) */
  rot: 0 | 90;
  /** inactive bays cannot receive new jobs */
  active: boolean;
  state: BayState;
  equipment: string[];
  notes?: string;
}

export type FixtureKind = 'reception' | 'parts' | 'lounge' | 'cabinet' | 'entrance';

/** Fixed furniture and structure: drawn on the plan and generated in 3D, but not assignable. */
export interface Fixture {
  id: string;
  kind: FixtureKind;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutPlan {
  /** workshop width (X) and length (Y) in metres */
  w: number;
  h: number;
  wallH: number;
  grid: number;
}

export interface WorkshopLayout {
  plan: LayoutPlan;
  bays: Bay[];
  fixtures: Fixture[];
}

export interface Garage {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
  /** the published layout: what Workshop Live View and the dashboard render */
  plan: LayoutPlan;
  bays: Bay[];
  fixtures: Fixture[];
  layoutVersion: number;
  publishedAt?: string;
  /** unpublished edits from the Workshop Layout editor */
  draft?: WorkshopLayout & { baseVersion: number; savedAt: string };
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: string;
  amount: number;
  status: 'Ordered' | 'Delivered' | 'Draft';
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  at: string;
  by: string;
}

export interface Db {
  version: number;
  today: string;
  garage: Garage;
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  jobs: Job[];
  estimates: Estimate[];
  invoices: Invoice[];
  inventory: Part[];
  partRequests: PartRequest[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  channels: Channel[];
  messages: Message[];
  announcements: Announcement[];
  notifications: Notification[];
  bookings: Booking[];
  prefs: Record<string, Record<string, boolean | string>>;
}
