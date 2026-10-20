'use client';

import { useState } from 'react';
import { FileText, TriangleAlert, Check } from 'lucide-react';
import { Chip, ShareCard, useTrack } from '@/components/share/ShareKit';
import { Button, ConfirmDialog, EmptyState, Modal, Textarea, useToast } from '@/components/ui';
import { decideEstimate, requestEstimateChanges } from '@/lib/actions';
import { estimateOfJob, estimateTotals, inr } from '@/lib/format';
import { estimateLines, trackInfo } from '@/lib/track';
import { useDb } from '@/lib/store';

export default function ShareEstimate() {
  const { job } = useTrack();
  const db = useDb();
  const toast = useToast();
  const est = estimateOfJob(db, job.id);
  const [ask, setAsk] = useState(false);
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
  const t = estimateTotals(visible.items);
  const lines = estimateLines(visible);
  const pending = visible.status === 'Awaiting Approval';
  const info = trackInfo(db, job);
  const chip = pending ? <Chip tone="amber"><TriangleAlert className="h-4 w-4" /> Awaiting Your Approval</Chip> : visible.status === 'Approved' ? <Chip tone="green"><Check className="h-4 w-4" strokeWidth={3} /> Approved</Chip> : <Chip tone="red">Rejected</Chip>;

  return (
    <ShareCard chip={chip}>
      <div className="neu-row px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 shadow-neu-xs"><FileText className="h-5 w-5" /></span>
          <div><h1 className="text-xl font-bold">Estimate {visible.id}</h1><p className="text-sm text-ink-400">Generated on {info.estimateSentAt.split(',')[0]}</p></div>
        </div>
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead><tr className="border-y border-ivory-300/70 text-left font-semibold"><th className="py-3">Item</th><th className="hidden py-3 text-center font-medium sm:table-cell">Type</th><th className="hidden py-3 text-center font-medium sm:table-cell">Qty</th><th className="hidden py-3 text-right font-medium sm:table-cell">Price</th><th className="py-3 text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-ivory-300/60">
              {lines.map((l) => (
                <tr key={l.name}>
                  <td className="py-3 pr-2">{l.name}{l.qty > 1 && <span className="text-ink-400 sm:hidden"> × {l.qty}</span>}</td>
                  <td className="hidden py-3 text-center text-ink-500 sm:table-cell">{l.type}</td>
                  <td className="hidden py-3 text-center text-ink-500 sm:table-cell">{l.qty}</td>
                  <td className="hidden py-3 text-right sm:table-cell">{inr(l.price)}</td>
                  <td className="py-3 text-right font-semibold">{inr(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-2 space-y-2 border-t border-ivory-300/70 pt-3 text-sm">
          <div className="flex justify-between text-ink-600"><dt>Subtotal</dt><dd className="font-bold text-ink">{inr(t.subtotal)}</dd></div>
          <div className="flex justify-between text-ink-600"><dt>GST (18%)</dt><dd className="font-semibold text-ink-700">{inr(t.gst)}</dd></div>
          <div className="flex justify-between border-t border-ivory-300/70 pt-3 text-[15px]"><dt className="font-bold">Total</dt><dd className="font-bold">{inr(t.total)}</dd></div>
        </dl>
      </div>
      {pending ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.35fr]">
          <Button variant="neu" size="lg" className="!h-14 text-[15px] !text-coral-600 max-sm:order-2" onClick={() => setChanges(true)}>Request Changes</Button>
          <Button size="lg" className="!h-14 text-[15px] max-sm:order-1" onClick={() => setAsk(true)}>Approve Estimate</Button>
        </div>
      ) : (
        <p className="neu-in-sm mt-4 p-4 text-sm text-ink-600">This estimate was {visible.status.toLowerCase()}. {visible.status === 'Approved' ? 'The workshop is carrying out the work.' : 'The workshop will contact you about the next steps.'}</p>
      )}
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} title="Approve this estimate?" message={`The workshop will start the work. Total: ${inr(t.total)} including GST.`} confirmLabel="Approve" onConfirm={() => { decideEstimate(visible.id, 'Approved', 'Customer (share link)'); toast.show('Estimate approved'); }} />
      <Modal open={changes} onClose={() => setChanges(false)} title="Request changes" size="sm" footer={<><Button variant="neu" onClick={() => setChanges(false)}>Cancel</Button><Button disabled={!msg.trim()} onClick={() => { requestEstimateChanges(visible.id, msg, 'Customer (share link)'); setMsg(''); setChanges(false); toast.show('Your request was sent to the workshop'); }}>Send request</Button></>}>
        <label className="block text-xs font-medium text-ink-500">What would you like to change?<Textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="mt-1.5" placeholder="e.g. Please keep the old pads for me" /></label>
      </Modal>
      {toast.node}
    </ShareCard>
  );
}
