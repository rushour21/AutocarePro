'use client';

import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { DocLink } from '@/components/features/Documents';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, FilterTabs, Modal, PageHeader, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { EstimateTotals } from '@/components/features/EstimateView';
import { payInvoice } from '@/lib/actions';
import { visibleInvoices } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { estimateOfJob, inr, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

type Tab = 'all' | 'pending' | 'paid' | 'cancelled';

export default function CustomerInvoices() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [sel, setSel] = useState<string | null>(null);
  if (!user) return null;
  const all = visibleInvoices(db, user);
  const list = all.filter((i) => tab === 'all' || i.status.toLowerCase() === tab);
  const cur = all.find((i) => i.id === sel);
  const est = cur?.jobId ? estimateOfJob(db, cur.jobId) : undefined;
  const cv = cur && vehicleOf(db, cur.vehicleId);

  return (
    <>
      <TopBar showUser />
      <PageHeader title="Invoices" subtitle="View and pay your invoices." />
      <FilterTabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'cancelled', label: 'Cancelled' }]} />
      {list.length === 0 ? <div className="neu"><EmptyState icon={<Receipt className="h-7 w-7" />} title={tab === 'all' ? 'No invoices yet' : `No ${tab} invoices`} /></div> : (
        <ul className="space-y-4">
          {list.map((i) => {
            const v = vehicleOf(db, i.vehicleId);
            return (
              <li key={i.id} className="neu flex items-center gap-4 !rounded-[22px] px-5 py-4 sm:gap-6">
                {v && <VehicleImage carKey={v.carKey} className="h-12 w-24" />}
                <div className="min-w-0 flex-1"><p className="font-bold">{i.id}</p><p className="text-sm text-ink-500">{vehicleName(v)}</p><p className="text-xs text-ink-400">{i.date}</p></div>
                <div className="text-right"><p className="font-bold">{inr(i.amount)}</p><StatusBadge tone={i.status === 'Paid' ? 'green' : i.status === 'Pending' ? 'amber' : 'gray'} size="sm">{i.status}</StatusBadge></div>
                <Button variant="soft" size="sm" onClick={() => setSel(i.id)}>View</Button>
                <DocLink kind="invoice" docKey={i.id} className="btn btn-neu h-9 px-3 text-[13px]">PDF</DocLink>
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={!!cur} onClose={() => setSel(null)} title={cur ? `Invoice ${cur.id}` : ''} footer={cur && <><DocLink kind="invoice" docKey={cur.id} className="btn btn-neu h-11 px-5 text-sm">Invoice</DocLink>{cur.status === 'Paid' && <DocLink kind="receipt" docKey={cur.id} className="btn btn-neu h-11 px-5 text-sm">Receipt</DocLink>}{cur.status === 'Pending' && <Button onClick={() => { payInvoice(cur.id); toast.show('Payment received — thank you!'); }}>Pay {inr(cur.amount)}</Button>}</>}>
        {cur && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">{cv && <VehicleImage carKey={cv.carKey} className="h-12 w-24" />}<div><p className="font-bold">{vehicleName(cv)}</p><p className="text-sm text-ink-500">{cur.date}</p></div><StatusBadge className="ml-auto" tone={cur.status === 'Paid' ? 'green' : 'amber'}>{cur.status}</StatusBadge></div>
            {est ? <><ul className="neu-in-sm divide-y divide-ivory-300/50 p-2 text-sm">{est.items.map((x) => <li key={x.id} className="flex justify-between px-3 py-2"><span>{x.name}</span><span className="font-semibold">{inr(x.amount)}</span></li>)}</ul><EstimateTotals items={est.items} /></> : <p className="neu-in-sm flex justify-between p-4 text-sm"><span className="font-bold">Total</span><span className="font-bold">{inr(cur.amount)}</span></p>}
          </div>
        )}
      </Modal>
      {toast.node}
    </>
  );
}
