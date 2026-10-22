'use client';

import { useState } from 'react';
import { Button, Select } from '@/components/ui';
import { assignBay } from '@/lib/actions';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Bay } from '@/lib/types';

/** Put an unassigned active job into a free bay. */
export function AssignJob({ bay, onDone, notify, className }: { bay: Bay; onDone?: () => void; notify: (m: string) => void; className?: string }) {
  const db = useDb();
  const [pick, setPick] = useState('');
  const unassigned = db.jobs.filter((j) => !j.bayId && j.stage !== 'delivered' && j.stage !== 'pending');
  if (!unassigned.length) return <p className="text-center text-sm text-ink-500">Every active job already has a bay.</p>;
  return (
    <div className={className ?? 'space-y-3'}>
      <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Choose a job">
        <option value="">Choose a job…</option>
        {unassigned.map((j) => (
          <option key={j.id} value={j.id}>#{j.id} · {vehicleName(vehicleOf(db, j.vehicleId))} — {STAGE_LABEL[j.stage]}</option>
        ))}
      </Select>
      <Button
        className="w-full"
        disabled={!pick}
        onClick={() => {
          const r = assignBay(pick, bay.id);
          notify(r.ok ? `#${pick} assigned to ${bay.name}` : r.error ?? 'Could not assign');
          if (r.ok) {
            setPick('');
            onDone?.();
          }
        }}
      >
        Assign to {bay.name}
      </Button>
    </div>
  );
}
