'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, LockKeyhole, RefreshCw, Share2 } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, ConfirmDialog, EmptyState, PageHeader, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { rotateTrackingToken } from '@/lib/actions';
import { visibleJobs } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { isActive, STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function ShareLinkPage() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [renew, setRenew] = useState<string | null>(null);
  if (!user) return null;
  const jobs = visibleJobs(db, user);
  const list = [...jobs.filter(isActive), ...jobs.filter((j) => j.stage === 'delivered').sort((a, b) => (a.completedInDays ?? 0) - (b.completedInDays ?? 0)).slice(0, 2)];
  const url = (t: string) => `${window.location.origin}/track/${t}`;

  const copy = async (id: string, token: string) => {
    try {
      await navigator.clipboard.writeText(url(token));
      setCopied(id);
      toast.show('Link copied');
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.show('Could not copy — select the link and copy it manually');
    }
  };

  return (
    <>
      <TopBar showUser />
      <PageHeader title="Share Link" subtitle="Give family, a driver or an insurer a private, read-only view of a service — no sign-in needed." />
      <p className="neu-in-sm mb-5 flex items-start gap-3 p-4 text-sm leading-6 text-ink-600">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
        Anyone with a link can see that vehicle’s progress, photos, estimate and invoice, and can approve the estimate. Create a new link to switch off an old one.
      </p>
      {list.length === 0 ? (
        <div className="neu"><EmptyState icon={<Share2 className="h-7 w-7" />} title="Nothing to share yet" text="Links appear here once a vehicle is booked in for service." /></div>
      ) : (
        <ul className="space-y-4">
          {list.map((j) => {
            const v = vehicleOf(db, j.vehicleId);
            return (
              <li key={j.id} className="neu !rounded-[22px] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-4">
                  {v && <VehicleImage carKey={v.carKey} className="h-12 w-24" />}
                  <div className="min-w-0 flex-1"><p className="font-bold">{vehicleName(v)}</p><p className="text-sm text-ink-500">#{j.id} · {j.service}</p></div>
                  <StatusBadge tone={j.stage === 'delivered' || j.stage === 'ready' ? 'green' : 'blue'} dot>{STAGE_LABEL[j.stage]}</StatusBadge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <input readOnly aria-label={`Share link for ${vehicleName(v)}`} value={url(j.trackingToken)} onFocus={(e) => e.currentTarget.select()} className="neu-in-sm h-11 min-w-0 flex-1 px-4 font-mono text-[12.5px] text-ink-600 outline-none" />
                  <Button variant="coral" onClick={() => copy(j.id, j.trackingToken)}>{copied === j.id ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}</Button>
                  <Button variant="neu" href={`/track/${j.trackingToken}`}><ExternalLink className="h-4 w-4" /> Open</Button>
                  <Button variant="neu" onClick={() => setRenew(j.id)} aria-label={`Create a new link for ${vehicleName(v)}`}><RefreshCw className="h-4 w-4" /> New link</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog open={!!renew} onClose={() => setRenew(null)} title="Create a new link?" message="The current link will stop working immediately. Anyone you shared it with will need the new one." confirmLabel="Create new link" danger onConfirm={() => { if (renew) { rotateTrackingToken(renew); toast.show('New link created'); } }} />
      {toast.node}
    </>
  );
}
