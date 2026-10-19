import type { Db, Job, User, Estimate, Invoice, Vehicle, Notification, Booking, PartRequest } from './types';

/**
 * Role-scoped reads. UI code must go through these instead of touching raw collections, so that
 *  - admins see the whole garage,
 *  - technicians only see jobs assigned to them,
 *  - customers only see their own vehicles, jobs, estimates, invoices and notifications.
 */
export const visibleJobs = (db: Db, user: User): Job[] => {
  if (user.role === 'admin') return db.jobs;
  if (user.role === 'technician') return db.jobs.filter((j) => j.techId === user.id);
  return db.jobs.filter((j) => j.customerId === user.customerId);
};

export const getJobFor = (db: Db, user: User, id: string): Job | undefined => visibleJobs(db, user).find((j) => j.id === id);

export const visibleVehicles = (db: Db, user: User): Vehicle[] => {
  if (user.role === 'admin') return db.vehicles;
  if (user.role === 'technician') {
    const ids = new Set(visibleJobs(db, user).map((j) => j.vehicleId));
    return db.vehicles.filter((v) => ids.has(v.id));
  }
  return db.vehicles.filter((v) => v.customerId === user.customerId);
};

export const visibleEstimates = (db: Db, user: User): Estimate[] => {
  const ids = new Set(visibleJobs(db, user).map((j) => j.id));
  return db.estimates.filter((e) => ids.has(e.jobId));
};

export const visibleInvoices = (db: Db, user: User): Invoice[] => {
  if (user.role === 'admin') return db.invoices;
  if (user.role === 'customer') return db.invoices.filter((i) => i.customerId === user.customerId);
  return [];
};

export const visibleNotifications = (db: Db, user: User): Notification[] =>
  user.role === 'customer' ? db.notifications.filter((n) => n.customerId === user.customerId) : [];

export const visibleBookings = (db: Db, user: User): Booking[] =>
  user.role === 'customer' ? db.bookings.filter((b) => b.customerId === user.customerId) : user.role === 'admin' ? db.bookings : [];

export const visiblePartRequests = (db: Db, user: User): PartRequest[] =>
  user.role === 'admin' ? db.partRequests : user.role === 'technician' ? db.partRequests.filter((p) => p.requestedBy === user.id) : [];

export const can = {
  manageWorkshop: (u: User) => u.role === 'admin',
  editJob: (u: User, j: Job) => u.role === 'admin' || (u.role === 'technician' && j.techId === u.id),
  decideEstimate: (u: User) => u.role === 'customer' || u.role === 'admin',
  manageTeam: (u: User) => u.role === 'admin',
  approveParts: (u: User) => u.role === 'admin',
};

/** Secure customer link: resolves only an exact, unguessable token. Job ids never resolve here. */
export const jobByToken = (db: Db, token: string): Job | undefined => (token.length >= 20 ? db.jobs.find((j) => j.trackingToken === token) : undefined);
