'use client';

import { useParams } from 'next/navigation';
import { Download, FileX } from 'lucide-react';
import { ClaimDoc, EstimateDoc, InspectionDoc, InvoiceDoc, JobCardDoc, ReceiptDoc, type DocKind } from '@/components/features/Documents';
import { Button, EmptyState } from '@/components/ui';
import { jobByToken, visibleInvoices } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateOfJob } from '@/lib/format';
import { useDb } from '@/lib/store';

/**
 * A printable A4 document. The key is a job's private tracking token, or an invoice number the signed-in user
 * may see. Browsers save these pages as PDF with real text, so the ₹ sign and tables stay sharp, and name the
 * file after the page title.
 */
export default function DocumentPage() {
  const { kind, key } = useParams<{ kind: DocKind; key: string }>();
  const db = useDb();
  const { user } = useSession();
  const raw = decodeURIComponent(key);
  const tokenJob = jobByToken(db, raw);
  const invoice = tokenJob ? db.invoices.find((i) => i.jobId === tokenJob.id) : user ? visibleInvoices(db, user).find((i) => i.id === raw) : undefined;
  const job = tokenJob ?? db.jobs.find((j) => j.id === invoice?.jobId);
  const claim = job && db.claims.find((c) => c.id === job.claimId);
  const staff = user?.role === 'admin' || user?.role === 'technician';
  const est = job && estimateOfJob(db, job.id);

  let doc: React.ReactNode = null;
  let name = '';
  if (kind === 'invoice' && invoice) {
    doc = <InvoiceDoc db={db} invoice={invoice} job={job} />;
    name = `Invoice-${invoice.id}`;
  } else if (kind === 'receipt' && invoice?.status === 'Paid') {
    doc = <ReceiptDoc db={db} invoice={invoice} job={job} />;
    name = `Receipt-${invoice.id.replace('INV', 'RCT')}`;
  } else if (kind === 'estimate' && tokenJob && est) {
    doc = <EstimateDoc db={db} job={tokenJob} />;
    name = `Estimate-${est.id}`;
  } else if (kind === 'inspection' && tokenJob) {
    doc = <InspectionDoc db={db} job={tokenJob} />;
    name = `Inspection-Report-${tokenJob.id}`;
  } else if (kind === 'job-card' && tokenJob) {
    doc = <JobCardDoc db={db} job={tokenJob} />;
    name = `Job-Card-${tokenJob.id}`;
  } else if (kind === 'claim' && tokenJob && claim && staff) {
    doc = <ClaimDoc db={db} claim={claim} job={tokenJob} />;
    name = `Claim-Pack-${claim.id}`;
  }

  if (!doc) return <main className="mx-auto max-w-md p-8"><EmptyState icon={<FileX className="h-7 w-7" />} title="This document isn’t available" text="It may not exist yet, or you may need to sign in." /></main>;

  return (
    <div className="doc-page min-h-screen bg-ivory-200 py-4">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <p className="text-sm text-ink-500">Choose <b>Save as PDF</b> in the next window.</p>
        <Button onClick={() => { document.title = name; window.print(); }}><Download className="h-4 w-4" /> Download PDF</Button>
      </div>
      <div className="doc-scroll overflow-x-auto px-4">{doc}</div>
    </div>
  );
}
