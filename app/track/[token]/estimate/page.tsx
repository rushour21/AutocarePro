'use client';

import { useState } from 'react';
import { FileText, TriangleAlert, Check } from 'lucide-react';
import { Chip, ShareCard, useTrack } from '@/components/share/ShareKit';
import { DocLink } from '@/components/features/Documents';
import { EstimateApproval } from '@/components/features/EstimateApproval';
import { Button, EmptyState, Modal, Textarea, useToast } from '@/components/ui';
import { requestEstimateChanges } from '@/lib/actions';
import { estimateOfJob, estimateTotals, inr, quotedItems } from '@/lib/format';
import { useDb } from '@/lib/store';

export default function ShareEstimate() {
  const { job } = useTrack();
  const db = useDb();
  const toast = useToast();
  const est = estimateOfJob(db, job.id);
  const [changes, setChanges] = useState(false);
  const [msg, setMsg] = useState('');
  const visible = est && est.status !== 'Draft' ? est : undefined;

  if (!visible) {
    return (
      <ShareCard>
        <EmptyState icon={<FileText className="h-7 w-7" />} title="No estimate yet" text="When the workshop prepares a quote for approval, it will appear here." />
      </ShareCard>
    );
  }
  const t = estimateTotals(quotedItems(visible));
  const pending = visible.status === 'Awaiting Approval';
  const chip = pending ? <Chip tone="amber"><TriangleAlert className="h-4 w-4" /> Awaiting Your Approval</Chip> : visible.status === 'Approved' ? <Chip tone="green"><Check className="h-4 w-4" strokeWidth={3} /> Approved</Chip> : <Chip tone="red">Rejected</Chip>;

  return (
    <ShareCard chip={chip}>
      <div className="neu-row px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-neu-xs"><FileText className="h-5 w-5" /></span>
          <h1 className="text-xl font-bold">Estimate {visible.id}</h1>
        </div>
        <div className="mt-4"><EstimateApproval est={visible} by="Customer (tracking link)" method="Tracking link" onDone={toast.show} /></div>
        <dl className="mt-2 space-y-2 border-t border-ivory-300/70 pt-3 text-sm">
          <div className="flex justify-between text-ink-600"><dt>Subtotal</dt><dd className="font-bold text-ink">{inr(t.subtotal)}</dd></div>
          <div className="flex justify-between text-ink-600"><dt>GST (18%)</dt><dd className="font-semibold text-ink-700">{inr(t.gst)}</dd></div>
          <div className="flex justify-between border-t border-ivory-300/70 pt-3 text-[15px]"><dt className="font-bold">Total</dt><dd className="font-bold">{inr(t.total)}</dd></div>
        </dl>
      </div>
      {pending && <Button variant="neu" size="lg" className="mt-4 w-full !text-coral-600" onClick={() => setChanges(true)}>Ask the workshop a question</Button>}
      <div className="mt-4 flex justify-center"><DocLink kind="estimate" docKey={job.trackingToken} className="btn btn-neu h-11 px-5 text-sm">Download Estimate</DocLink></div>
      <Modal open={changes} onClose={() => setChanges(false)} title="Ask the workshop" size="sm" footer={<><Button variant="neu" onClick={() => setChanges(false)}>Cancel</Button><Button disabled={!msg.trim()} onClick={() => { requestEstimateChanges(visible.id, msg, 'Customer (share link)'); setMsg(''); setChanges(false); toast.show('Your request was sent to the workshop'); }}>Send request</Button></>}>
        <label className="block text-xs font-medium text-ink-500">What would you like to ask or change?<Textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="mt-1.5" placeholder="e.g. Please keep the old pads for me" /></label>
      </Modal>
      {toast.node}
    </ShareCard>
  );
}
