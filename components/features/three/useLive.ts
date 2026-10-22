import { useMemo } from 'react';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { BAY_STATUS_LABEL, bayStatus, occupantOf } from '@/lib/layout';
import type { BayStatus } from '@/lib/layout';
import { useDb } from '@/lib/store';
import type { Bay, Stage, WorkshopLayout } from '@/lib/types';
import type { BayLive } from './WorkshopScene3D';

export const STAGE_COLOR: Record<Stage, string> = { pending: '#e5482d', inspection: '#2f6bff', diagnostics: '#7456f0', in_repair: '#f26a2e', quality_check: '#ee8a12', ready: '#1d9d65', delivered: '#1d9d65' };
export const STATUS_COLOR: Record<BayStatus, string> = { in_use: '#f26a2e', available: '#1d9d65', maintenance: '#e5482d', reserved: '#7456f0', inactive: '#8d8d90' };

/** Who is in which bay, derived from jobs. `layout` may be a draft: occupancy is looked up by bay id. */
export function useBayLive(layout: WorkshopLayout, opts?: { hideCustomerInfoFor?: (jobId: string) => boolean }) {
  const db = useDb();
  return useMemo(() => {
    const occupants: Record<string, BayLive | undefined> = {};
    const status: Record<string, BayStatus> = {};
    layout.bays.forEach((b) => {
      status[b.id] = bayStatus(b, db.jobs);
      const j = occupantOf(db.jobs, b.id);
      const v = j ? vehicleOf(db, j.vehicleId) : undefined;
      if (j && v) occupants[b.id] = { stage: j.stage, carKey: v.carKey, title: opts?.hideCustomerInfoFor?.(j.id) ? 'Vehicle' : vehicleName(v), chip: STAGE_LABEL[j.stage], color: STAGE_COLOR[j.stage] };
    });
    const idle = (b: Bay) => ({ text: BAY_STATUS_LABEL[status[b.id] ?? 'available'], color: STATUS_COLOR[status[b.id] ?? 'available'] });
    const counts = { total: layout.bays.length, in_use: 0, available: 0, maintenance: 0, reserved: 0, inactive: 0 };
    Object.values(status).forEach((s) => { counts[s]++; });
    return { occupants, idle, status, counts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, db.jobs, db.vehicles]);
}
