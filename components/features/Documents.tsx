'use client';

import clsx from 'clsx';
import { Download } from 'lucide-react';
import { LogoMark } from '@/components/layout/AppShell';
import { approvedItems, customerOf, estimateOfJob, estimateTotals, inr, itemApproval, km, photosOf, quotedItems, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { claimPending, fmtDate, payoutOf, splitOf } from '@/lib/insurance';
import { VISIT_REASONS } from '@/lib/catalog';
import type { Claim, Db, Invoice, Job } from '@/lib/types';

export type DocKind = 'invoice' | 'receipt' | 'estimate' | 'inspection' | 'job-card' | 'claim';

export const docHref = (kind: DocKind, key: string) => `/documents/${kind}/${encodeURIComponent(key)}`;

export function DocLink({ kind, docKey, children, className }: { kind: DocKind; docKey: string; children: React.ReactNode; className?: string }) {
  return <a href={docHref(kind, docKey)} target="_blank" rel="noreferrer" className={clsx('inline-flex items-center gap-2', className)}><Download className="h-4 w-4" /> {children}</a>;
}

/* ---------------------------------------------------------------- tax and wording */
/** Sample value until the garage's own GST number is captured in settings. */
const SAMPLE_GSTIN = '27AAAAA0000A1Z5';
const STATE = 'Maharashtra (27)';
const SAC_REPAIR = '998714';
const HSN_PARTS = '8708';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const upTo99 = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);

/** Indian numbering: lakh and crore. */
export function rupeesInWords(value: number) {
  let n = Math.round(value);
  if (n === 0) return 'Rupees Zero Only';
  const out: string[] = [];
  for (const [size, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [100, 'Hundred']] as const) {
    const part = Math.floor(n / size);
    if (part) out.push(`${upTo99(part)} ${name}`);
    n %= size;
  }
  if (n) out.push(upTo99(n));
  return `Rupees ${out.join(' ')} Only`;
}

const taxOf = (taxable: number, gst: number) => {
  const cgst = Math.round(gst / 2);
  return { taxable, cgst, sgst: gst - cgst, total: taxable + gst };
};

/* ---------------------------------------------------------------- shared layout */
const STAMP = { green: 'border-ok text-ok', red: 'border-bad text-bad', amber: 'border-warn text-warn' } as const;

function Sheet({ db, title, number, meta, stamp, children }: { db: Db; title: string; number: string; meta: [string, string][]; stamp?: { text: string; tone: keyof typeof STAMP }; children: React.ReactNode }) {
  const g = db.garage;
  return (
    <article className="doc-sheet mx-auto w-[210mm] min-w-[210mm] bg-white p-[14mm] text-[12px] leading-[1.45] text-ink shadow-[0_8px_30px_rgba(40,44,60,0.14)]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-coral-500 pb-4">
        <div className="flex items-start gap-3">
          <LogoMark className="h-11 w-11 shrink-0" />
          <div>
            <p className="text-[17px] font-bold leading-tight">{g.name}</p>
            <p className="text-ink-600">{g.address}</p>
            <p className="text-ink-600">{g.phone} · {g.email}</p>
            <p className="text-ink-600">GSTIN: {SAMPLE_GSTIN}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-[20px] font-extrabold uppercase tracking-wide">{title}</h1>
          <p className="text-[13px] font-semibold">{number}</p>
          {stamp && <span className={clsx('mt-1.5 inline-block rounded border-2 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest', STAMP[stamp.tone])}>{stamp.text}</span>}
        </div>
      </header>
      <dl className="my-3 grid grid-cols-4 gap-x-4 gap-y-1 border-b border-ivory-300 pb-3">
        {meta.map(([k, v]) => <div key={k}><dt className="text-[10px] uppercase tracking-wide text-ink-400">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
      </dl>
      {children}
      <footer className="mt-6 border-t border-ivory-300 pt-2 text-center text-[10px] text-ink-400">{g.name} · {g.address} · {g.phone} · This is a computer-generated document.</footer>
    </article>
  );
}

const Box = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="doc-avoid rounded border border-ivory-300 p-3">
    <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">{title}</h2>
    {children}
  </section>
);

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-1.5 mt-4 text-[12px] font-bold uppercase tracking-wide">{children}</h2>;

function Parties({ db, job, customerId, vehicleId }: { db: Db; job?: Job; customerId: string; vehicleId: string }) {
  const c = customerOf(db, customerId);
  const v = vehicleOf(db, vehicleId);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Box title="Customer">
        <p className="text-[13px] font-bold">{c?.name}</p>
        <p>{c?.phone}</p>
        {c?.email && <p>{c.email}</p>}
      </Box>
      <Box title="Vehicle">
        <p className="text-[13px] font-bold">{vehicleName(v)} · {v?.reg}</p>
        <p>{v?.variant !== '—' ? `${v?.variant} · ` : ''}{v?.year} · {v?.fuel}</p>
        <p>Odometer: {km(job?.checkin?.odometer ?? v?.odometer ?? 0)}</p>
      </Box>
    </div>
  );
}

interface Line {
  name: string;
  note?: string;
  code: string;
  qty: number;
  amount: number;
  status?: string;
}

function Lines({ rows }: { rows: Line[] }) {
  const showStatus = rows.some((r) => r.status);
  return (
    <table className="mt-3 w-full border-collapse">
      <thead><tr className="bg-ink text-left text-[10px] uppercase tracking-wide text-white"><th className="w-7 px-2 py-1.5">#</th><th className="px-2 py-1.5">Description</th><th className="px-2 py-1.5">HSN/SAC</th><th className="px-2 py-1.5 text-right">Qty</th><th className="px-2 py-1.5 text-right">Rate</th>{showStatus && <th className="px-2 py-1.5">Status</th>}<th className="px-2 py-1.5 text-right">Amount</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="doc-avoid border-b border-ivory-300 align-top">
            <td className="px-2 py-1.5">{i + 1}</td>
            <td className={clsx('px-2 py-1.5', r.status === 'Declined' && 'text-ink-400 line-through')}><span className="font-medium">{r.name}</span>{r.note && <span className="block text-[10.5px] text-ink-500">{r.note}</span>}</td>
            <td className="px-2 py-1.5">{r.code}</td>
            <td className="px-2 py-1.5 text-right">{r.qty}</td>
            <td className="px-2 py-1.5 text-right">{inr(Math.round(r.amount / r.qty))}</td>
            {showStatus && <td className="px-2 py-1.5">{r.status}</td>}
            <td className="px-2 py-1.5 text-right font-semibold">{inr(r.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ t, label = 'Total' }: { t: ReturnType<typeof taxOf>; label?: string }) {
  return (
    <div className="doc-avoid mt-2 flex items-start justify-between gap-6">
      <p className="max-w-[55%] pt-1"><span className="text-[10px] uppercase tracking-wide text-ink-400">Amount in words</span><br /><span className="font-semibold">{rupeesInWords(t.total)}</span></p>
      <dl className="w-[46%] space-y-0.5">
        <div className="flex justify-between"><dt>Taxable value</dt><dd>{inr(t.taxable)}</dd></div>
        <div className="flex justify-between"><dt>CGST @ 9%</dt><dd>{inr(t.cgst)}</dd></div>
        <div className="flex justify-between"><dt>SGST @ 9%</dt><dd>{inr(t.sgst)}</dd></div>
        <div className="mt-1 flex justify-between border-t-2 border-ink pt-1 text-[14px] font-extrabold"><dt>{label}</dt><dd>{inr(t.total)}</dd></div>
      </dl>
    </div>
  );
}

const Terms = ({ items }: { items: string[] }) => (
  <section className="doc-avoid mt-4">
    <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">Terms and conditions</h2>
    <ol className="list-decimal pl-4 text-[10.5px] text-ink-600">{items.map((t) => <li key={t}>{t}</li>)}</ol>
  </section>
);

const Signatures = ({ left, right }: { left: string; right: string }) => (
  <div className="doc-avoid mt-10 grid grid-cols-2 gap-16">
    {[left, right].map((s) => <p key={s} className="border-t border-ink pt-1 text-[11px] font-semibold">{s}</p>)}
  </div>
);

function PhotoGrid({ title, photos }: { title: string; photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="doc-avoid">
      <H>{title}</H>
      <div className="grid grid-cols-4 gap-2">
        {photos.slice(0, 8).map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p} alt={`${title} ${i + 1}`} className="aspect-[4/3] w-full rounded object-cover" />
        ))}
      </div>
    </section>
  );
}

const codeOf = (type: string) => (type === 'Labour' ? SAC_REPAIR : HSN_PARTS);

/* ---------------------------------------------------------------- invoice */
export function InvoiceDoc({ db, invoice, job }: { db: Db; invoice: Invoice; job?: Job }) {
  const est = job && estimateOfJob(db, job.id);
  const items = est ? approvedItems(est) : [];
  const fromEstimate = estimateTotals(items);
  // an invoice is final: its lines must add up to the billed amount, or it shows one summary line
  const matches = items.length > 0 && fromEstimate.total === invoice.amount;
  const taxable = matches ? fromEstimate.subtotal : Math.round(invoice.amount / 1.18);
  const rows: Line[] = matches ? items.map((i) => ({ name: i.name, code: codeOf(i.type), qty: i.qty ?? 1, amount: i.amount })) : [{ name: job?.service ?? 'Vehicle service and repair charges', code: SAC_REPAIR, qty: 1, amount: taxable }];
  const claim = job && db.claims.find((c) => c.id === job.claimId);
  const pay = claim && payoutOf(claim);
  const paid = invoice.status === 'Paid';
  return (
    <Sheet db={db} title="Tax Invoice" number={invoice.id} stamp={paid ? { text: 'Paid', tone: 'green' } : invoice.status === 'Cancelled' ? { text: 'Cancelled', tone: 'red' } : { text: 'Unpaid', tone: 'amber' }} meta={[['Invoice date', invoice.date], ['Job no.', job ? `#${job.id}` : invoice.jobId ?? '-'], ['Place of supply', STATE], ['Payment', paid ? invoice.method ?? 'Received' : 'Due on delivery']]}>
      <Parties db={db} job={job} customerId={invoice.customerId} vehicleId={invoice.vehicleId} />
      <Lines rows={rows} />
      <Totals t={taxOf(taxable, invoice.amount - taxable)} label="Invoice total" />
      {claim && pay && (
        <div className="mt-3">
          <Box title={`Insurance: ${claim.type}`}>
            <p>{claim.insurer} · Policy {claim.policyNo || '-'} · Claim {claim.claimNo || '-'}</p>
            <p>Estimated insurer share: <b>{inr(pay.insurer)}</b> · Customer share: <b>{inr(pay.customer)}</b> (before GST)</p>
          </Box>
        </div>
      )}
      <Terms items={['Payment is due on delivery of the vehicle unless agreed otherwise.', 'Replaced parts carry the manufacturer warranty. Labour is guaranteed for 30 days or 1,000 km, whichever is earlier.', 'Subject to Pune jurisdiction.']} />
      <Signatures left="Customer signature" right={`For ${db.garage.name}`} />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- receipt */
export function ReceiptDoc({ db, invoice, job }: { db: Db; invoice: Invoice; job?: Job }) {
  const c = customerOf(db, invoice.customerId);
  const v = vehicleOf(db, invoice.vehicleId);
  return (
    <Sheet db={db} title="Payment Receipt" number={invoice.id.replace('INV', 'RCT')} stamp={{ text: 'Received', tone: 'green' }} meta={[['Receipt date', invoice.paidOn?.split(',')[0] ?? invoice.date], ['Against invoice', invoice.id], ['Mode', invoice.method ?? 'Not recorded'], ['Reference', invoice.txnId ?? 'Not recorded']]}>
      <div className="my-4 rounded bg-ivory-100 p-5 text-center">
        <p className="text-[10px] uppercase tracking-wide text-ink-400">Amount received</p>
        <p className="text-[28px] font-extrabold">{inr(invoice.amount)}</p>
        <p className="font-semibold">{rupeesInWords(invoice.amount)}</p>
      </div>
      <p className="text-[13px]">Received with thanks from <b>{c?.name}</b> towards the service of <b>{vehicleName(v)} ({v?.reg})</b>{job ? <>, job <b>#{job.id}</b></> : null}, in settlement of invoice <b>{invoice.id}</b> dated {invoice.date}.</p>
      <Signatures left="Customer signature" right={`For ${db.garage.name}`} />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- estimate */
export function EstimateDoc({ db, job }: { db: Db; job: Job }) {
  const est = estimateOfJob(db, job.id)!;
  const t = estimateTotals(quotedItems(est));
  return (
    <Sheet db={db} title="Repair Estimate" number={est.id} stamp={est.status === 'Approved' ? { text: 'Approved', tone: 'green' } : est.status === 'Rejected' ? { text: 'Declined', tone: 'red' } : { text: 'Awaiting approval', tone: 'amber' }} meta={[['Estimate date', job.startedLabel.split(',')[0]], ['Job no.', `#${job.id}`], ['Technician', userOf(db, job.techId)?.name ?? '-'], ['Promised', job.estCompletion]]}>
      <Parties db={db} job={job} customerId={job.customerId} vehicleId={job.vehicleId} />
      <Lines rows={est.items.filter((i) => !i.draft).map((i) => ({ name: i.name, note: i.reason, code: codeOf(i.type), qty: i.qty ?? 1, amount: i.amount, status: itemApproval(est, i) }))} />
      <Totals t={taxOf(t.subtotal, t.gst)} label="Estimated total" />
      <PhotoGrid title="Photos" photos={photosOf(job, undefined, est).before} />
      <Terms items={['This is an estimate, not a bill. The final amount may change if further work is found.', 'No additional work is carried out without the customer’s approval.', 'This estimate is valid for 7 days from its date.', 'Declined items are not included in the total.']} />
      <Signatures left="Customer acceptance" right={`For ${db.garage.name}`} />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- inspection */
const CONDITION = { good: 'Good', minor: 'Needs attention', major: 'Urgent', unchecked: 'Not checked' } as const;

export function InspectionDoc({ db, job }: { db: Db; job: Job }) {
  const count = (s: keyof typeof CONDITION) => job.points.filter((p) => p.status === s).length;
  const told = [...(job.checkin?.issues ?? []), job.checkin?.complaint].filter(Boolean).join('. ');
  return (
    <Sheet db={db} title="Inspection Report" number={`INS-${job.id}`} meta={[['Report date', job.startedLabel.split(',')[0]], ['Job no.', `#${job.id}`], ['Inspected by', userOf(db, job.techId)?.name ?? '-'], ['Areas checked', `${job.points.length - count('unchecked')} of ${job.points.length}`]]}>
      <Parties db={db} job={job} customerId={job.customerId} vehicleId={job.vehicleId} />
      {told && <><H>Customer complaint</H><p>{told}</p></>}
      <H>Summary</H>
      <div className="grid grid-cols-4 gap-2 text-center">
        {(['good', 'minor', 'major', 'unchecked'] as const).map((s) => <div key={s} className="rounded border border-ivory-300 py-2"><p className="text-[16px] font-extrabold">{count(s)}</p><p className="text-[10px] uppercase tracking-wide text-ink-500">{CONDITION[s]}</p></div>)}
      </div>
      <H>Findings</H>
      <table className="w-full border-collapse">
        <thead><tr className="bg-ink text-left text-[10px] uppercase tracking-wide text-white"><th className="px-2 py-1.5">Area</th><th className="px-2 py-1.5">Condition</th><th className="px-2 py-1.5">Damage</th><th className="px-2 py-1.5">Notes</th></tr></thead>
        <tbody>
          {job.points.filter((p) => p.status !== 'unchecked').map((p) => <tr key={p.id} className="doc-avoid border-b border-ivory-300"><td className="px-2 py-1.5 font-medium">{p.label}</td><td className="px-2 py-1.5">{CONDITION[p.status]}</td><td className="px-2 py-1.5">{p.status === 'good' ? '-' : `${p.damage}, ${p.severity}`}</td><td className="px-2 py-1.5">{p.notes || '-'}</td></tr>)}
          {count('unchecked') === job.points.length && <tr><td colSpan={4} className="px-2 py-3 text-ink-500">Inspection has not been recorded yet.</td></tr>}
        </tbody>
      </table>
      <PhotoGrid title="Inspection photos" photos={[...new Set(job.points.flatMap((p) => p.photos))]} />
      <Signatures left="Technician signature" right="Customer acknowledgement" />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- job card */
export function JobCardDoc({ db, job }: { db: Db; job: Job }) {
  const c = job.checkin;
  const est = estimateOfJob(db, job.id);
  return (
    <Sheet db={db} title="Job Card" number={`#${job.id}`} meta={[['Checked in', job.startedLabel], ['Promised', job.promised], ['Technician', userOf(db, job.techId)?.name ?? '-'], ['Priority', job.priority]]}>
      <Parties db={db} job={job} customerId={job.customerId} vehicleId={job.vehicleId} />
      {c && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Box title="Visit">
            <p>{c.reasons.map((r) => VISIT_REASONS.find((x) => x.key === r)?.label).join(', ')}</p>
            {c.issues.length > 0 && <p>Issues: {c.issues.join(', ')}</p>}
            {c.complaint && <p>Customer&apos;s words: {c.complaint}</p>}
          </Box>
          <Box title="Vehicle at arrival">
            <p>Fuel: {c.fuel} · Brought by: {c.broughtBy}</p>
            <p>Items in car: {c.belongings.join(', ') || 'None noted'}</p>
          </Box>
        </div>
      )}
      {est && est.items.length > 0 ? <Lines rows={est.items.filter((i) => !i.draft).map((i) => ({ name: i.name, note: i.reason, code: codeOf(i.type), qty: i.qty ?? 1, amount: i.amount, status: itemApproval(est, i) }))} /> : <><H>Work requested</H><p>{job.service}</p></>}
      <H>Task checklist</H>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1">{job.tasks.map((t) => <li key={t.id} className="flex items-center gap-2"><span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-ink text-[10px] font-bold">{t.status === 'Completed' ? '✓' : ''}</span>{t.title}</li>)}</ul>
      <PhotoGrid title="Condition at check-in" photos={c?.photos ?? []} />
      <section className="doc-avoid mt-4 rounded border border-ivory-300 p-3 text-[11px]">
        <p className="font-bold">Customer authorisation{job.clientApproval ? `: approved by ${job.clientApproval.method.toLowerCase()} on ${job.clientApproval.at}` : ''}</p>
        <p className="text-ink-600">I authorise the workshop to inspect the vehicle and carry out the approved work, and to road test it where needed. Any further work needs my approval. The workshop is not responsible for valuables left in the vehicle.</p>
      </section>
      <Signatures left="Customer signature" right="Service advisor" />
    </Sheet>
  );
}

/* ---------------------------------------------------------------- claim pack */
export function ClaimDoc({ db, claim, job }: { db: Db; claim: Claim; job: Job }) {
  const s = splitOf(claim);
  const pay = payoutOf(claim);
  const pending = claimPending(claim);
  const draft = pending.some((p) => p.blocks);
  const { before, after } = photosOf(job, claim, estimateOfJob(db, job.id));
  const findings = job.points.filter((p) => p.status === 'minor' || p.status === 'major');
  const told = [...(job.checkin?.issues ?? []), job.checkin?.complaint].filter(Boolean).join('. ');
  return (
    <Sheet db={db} title="Insurance Claim Pack" number={claim.id} stamp={draft ? { text: 'Draft', tone: 'amber' } : { text: claim.status, tone: 'green' }} meta={[['Insurer', claim.insurer], ['Claim type', claim.type], ['Policy no.', claim.policyNo || '-'], ['Claim no.', claim.claimNo || '-'], ['Accident date', fmtDate(claim.accidentDate)], ['Job no.', `#${job.id}`], ['Surveyor', claim.surveyorName || '-'], ['Surveyor phone', claim.surveyorPhone || '-']]}>
      <Parties db={db} job={job} customerId={job.customerId} vehicleId={job.vehicleId} />
      {told && <><H>Customer report</H><p>{told}</p></>}
      {findings.length > 0 && (
        <>
          <H>Inspection findings</H>
          <ul className="list-disc pl-4">{findings.map((p) => <li key={p.id}>{p.label}: {p.damage}, {p.severity}{p.notes ? ` (${p.notes})` : ''}</li>)}</ul>
        </>
      )}
      <H>Repair estimate (before GST)</H>
      <table className="w-full border-collapse">
        <thead><tr className="bg-ink text-left text-[10px] uppercase tracking-wide text-white"><th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5">Type</th><th className="px-2 py-1.5">Payable by</th><th className="px-2 py-1.5 text-right">Amount</th></tr></thead>
        <tbody>{claim.lines.map((l) => <tr key={l.id} className="doc-avoid border-b border-ivory-300"><td className="px-2 py-1.5 font-medium">{l.name}</td><td className="px-2 py-1.5 capitalize">{l.kind}</td><td className="px-2 py-1.5">{l.covered ? 'Insurer' : 'Customer'}</td><td className="px-2 py-1.5 text-right font-semibold">{inr(l.amount)}</td></tr>)}</tbody>
      </table>
      <div className="doc-avoid mt-3 grid grid-cols-2 gap-3">
        <Box title="Claim split">
          <dl className="space-y-0.5">
            {([['Estimate total', s.total], ['Not covered', s.notCovered], [`Depreciation${claim.zeroDep ? ' (zero-dep)' : ` (${claim.depreciationPct}% on parts)`}`, s.depreciation], ['Compulsory deductible', s.deductible]] as [string, number][]).map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd>{inr(v)}</dd></div>)}
            <div className="flex justify-between border-t border-ink pt-1 font-bold"><dt>Insurer pays</dt><dd>{inr(pay.insurer)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Customer pays</dt><dd>{inr(pay.customer)}</dd></div>
          </dl>
        </Box>
        <Box title={`Settlement: ${claim.type}`}>
          {claim.type === 'Cashless'
            ? <p>The insurer pays the garage {inr(pay.insurer)} directly. The customer pays the garage {inr(pay.customer)} at delivery.</p>
            : <p>The customer pays the garage {inr(pay.total)} at delivery. The insurer then reimburses the customer {inr(pay.insurer)}.</p>}
        </Box>
      </div>
      <H>Documents</H>
      <ul className="grid grid-cols-2 gap-x-6">{claim.docs.map((d) => <li key={d.kind}>{d.uploaded ? '✓' : '✗'} {d.label}</li>)}</ul>
      {pending.length > 0 && <><H>Pending</H><ul className="list-disc pl-4">{pending.map((p) => <li key={p.item}>{p.item}</li>)}</ul></>}
      <PhotoGrid title="Before repair" photos={before} />
      <PhotoGrid title="After repair" photos={after} />
      <Signatures left="Surveyor" right={`For ${db.garage.name}`} />
    </Sheet>
  );
}
