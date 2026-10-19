'use client';

import { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Card, PageHeader } from '@/components/ui';
import { useDb } from '@/lib/store';

const FAQ: [string, string][] = [
  ['How do I approve an estimate?', 'Open Estimates, choose the estimate and select Approve Estimate. The workshop is notified immediately and starts the work.'],
  ['Can I see photos of my vehicle?', 'Yes. Open your job and use the Photos tab, or Inspection for the damage report with photos.'],
  ['How do I pay an invoice?', 'Go to Invoices, open the pending invoice with View and choose Pay.'],
];

export default function Support() {
  const db = useDb();
  const [open, setOpen] = useState<number | null>(0);
  const g = db.garage;
  return (
    <>
      <TopBar showUser />
      <PageHeader title="Support" subtitle={`We’re here to help — ${g.name}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[{ icon: Phone, label: 'Call us', value: g.phone, href: `tel:${g.phone.replace(/\s/g, '')}` }, { icon: MessageCircle, label: 'WhatsApp', value: g.phone, href: `https://wa.me/${g.phone.replace(/\D/g, '')}` }, { icon: Mail, label: 'Email', value: g.email, href: `mailto:${g.email}` }].map(({ icon: Icon, label, value, href }) => (
          <a key={label} href={href} className="neu flex items-center gap-4 !rounded-[20px] p-5 transition hover:-translate-y-0.5"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-500"><Icon className="h-5 w-5" /></span><span><span className="block text-sm text-ink-500">{label}</span><span className="block break-all font-semibold">{value}</span></span></a>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="mb-3 text-lg font-bold">Frequently asked</h2>
        <ul className="divide-y divide-ivory-300/60">
          {FAQ.map(([q, a], i) => (
            <li key={q}>
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-3 py-4 text-left font-medium">{q}<ChevronDown className={`h-4 w-4 transition ${open === i ? 'rotate-180' : ''}`} /></button>
              {open === i && <p className="pb-4 text-sm leading-6 text-ink-600">{a}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
