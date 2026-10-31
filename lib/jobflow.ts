import { estimateOfJob, approvedItems, pendingItems } from './format';
import { CLAIM_FLOW } from './insurance';
import type { Db, Job } from './types';

export type FlowStep = 'start_inspection' | 'inspect' | 'waiting_client' | 'waiting_insurer' | 'start_repair' | 'declined' | 'repairing' | 'quality' | 'ready' | 'delivered';

/** The one next thing a job needs. Everything here is derived, so it can never disagree with the estimate or the claim. */
export function flowStep(db: Db, job: Job): FlowStep {
  const est = estimateOfJob(db, job.id);
  if (job.stage === 'delivered') return 'delivered';
  if (job.stage === 'ready') return 'ready';
  if (job.stage === 'quality_check') return 'quality';
  if (job.stage === 'in_repair') return 'repairing';
  if (job.stage === 'pending') return 'start_inspection';
  if (job.isInsurance) {
    const claim = db.claims.find((c) => c.id === job.claimId);
    if (claim && CLAIM_FLOW.indexOf(claim.status) >= CLAIM_FLOW.indexOf('Approved')) return 'start_repair';
    return est?.status === 'Awaiting Approval' ? 'waiting_insurer' : 'inspect';
  }
  if (!est) return 'inspect';
  if (est.status === 'Awaiting Approval') return 'waiting_client';
  if (pendingItems(est).length) return 'inspect';
  if (est.status === 'Rejected') return 'declined';
  return approvedItems(est).length ? 'start_repair' : 'inspect';
}

/** Lines the client has not decided: they stop the job from being finished. */
export const openApprovals = (db: Db, job: Job) => {
  const est = estimateOfJob(db, job.id);
  return est ? pendingItems(est) : [];
};
