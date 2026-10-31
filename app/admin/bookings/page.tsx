'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarCheck, Check, MessageCircle, Phone, Wrench, X } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, EmptyState, FilterTabs, Input, Modal, PageHeader, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { setBookingStatus } from '@/lib/actions';
import { VISIT_REASONS } from '@/lib/catalog';
import { BOOKING_TONE, customerOf, km, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Booking } from '@/lib/types';

type Tab = 'open' | 'done' | 'declined' | 'all';

const Row = ({ k, v }: { k: string; v?: string | number }) => (v ? <div><dt className="text-xs text-ink-400">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div> : null);

export default function AdminBookingsPage() {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('open');
  const [sel, setSel] = useState('');
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const list = db.bookings.filter((b) => (tab === 'all' ? true : tab === 'open' ? b.status === 'Requested' || b.status === 'Confirmed' : tab === 'done' ? b.status === 'Checked In' : b.status === 'Declined'));
  const cur = db.bookings.find((b) => b.id === sel);
  const d = cur?.details;
  const c = cur && customerOf(db, cur.customerId);
  const v = cur && vehicleOf(db, cur.vehicleId);
  const phone = (d?.customer.phone ?? c?.phone ?? '').replace(/\D/g, '');
  const open = cur && (cur.status === 'Requested' || cur.status === 'Confirmed');

  const confirm = (b: Booking) => {
    setBookingStatus(b.id, 'Confirmed');
    toast.show(`${b.id} confirmed`);
  };

  return (
    <>
      <TopBar showUser />
      <PageHeader title="Bookings" subtitle="Service requests from customers." />
      <FilterTabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'open', label: 'Open' }, { value: 'done', label: 'Checked In' }, { value: 'declined', label: 'Declined' }, { value: 'all', label: 'All' }]} />
      {list.length === 0 ? <div className="neu"><EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="No bookings here" /></div> : (
        <ul className="space-y-3">
          {list.map((b) => {
            const car = vehicleOf(db, b.vehicleId);
            return (
              <li key={b.id} className="neu flex flex-wrap items-center gap-4 !rounded-[20px] px-4 py-3">
                {car && <VehicleImage carKey={car.carKey} className="h-12 w-20 shrink-0" />}
                <div className="min-w-[180px] flex-1">
                  <p className="font-bold">{b.details?.customer.name ?? customerOf(db, b.customerId)?.name} <span className="font-normal text-ink-400">· {b.id}</span></p>
                  <p className="text-sm text-ink-500">{vehicleName(car)} · {car?.reg}</p>
                  <p className="text-sm text-ink-500">{b.service} · {b.date}, {b.time}</p>
                </div>
                {b.details?.quick && b.status !== 'Checked In' && <StatusBadge tone="violet">Call customer</StatusBadge>}
                <StatusBadge tone={BOOKING_TONE[b.status]} dot>{b.status}</StatusBadge>
                <Button size="sm" variant="neu" onClick={() => setSel(b.id)}>View</Button>
                {b.status === 'Requested' && <Button size="sm" variant="soft" onClick={() => confirm(b)}><Check className="h-4 w-4" strokeWidth={3} /> Confirm</Button>}
                {b.status === 'Confirmed' && <Button size="sm" href={`/admin/jobs/new?booking=${b.id}`}><Wrench className="h-4 w-4" /> Check in</Button>}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!cur}
        onClose={() => { setSel(''); setDeclining(false); }}
        title={cur ? `Booking ${cur.id}` : ''}
        size="lg"
        footer={cur && (
          <>
            {phone && <a href={`tel:+${phone}`} aria-label="Call customer" className="btn btn-neu h-11 w-11 !rounded-xl"><Phone className="h-4 w-4" /></a>}
            {phone && <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" aria-label="WhatsApp customer" className="btn btn-neu h-11 w-11 !rounded-xl"><MessageCircle className="h-4 w-4" /></a>}
            {open && <Button variant="neu" onClick={() => setDeclining(true)}><X className="h-4 w-4" /> Decline</Button>}
            {cur.status === 'Requested' && <Button variant="soft" onClick={() => confirm(cur)}>Confirm</Button>}
            {open && <Button onClick={() => router.push(`/admin/jobs/new?booking=${cur.id}`)}><Wrench className="h-4 w-4" /> Check in car</Button>}
            {cur.jobId && <Button href={`/admin/jobs/${cur.jobId}`}>Open job</Button>}
          </>
        )}
      >
        {cur && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Row k="Status" v={cur.status} />
              <Row k="Date" v={cur.date} />
              <Row k="Time" v={cur.time} />
              <Row k="Getting the car in" v={d?.pickup} />
              <Row k="Pickup address" v={d?.pickupAddress} />
            </dl>
            {d?.quick && <p className="rounded-xl bg-info-soft px-3 py-2 text-sm text-info-strong">Quick booking. Call the customer to agree a time and get the car details.</p>}
            {cur.declineReason && <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad-strong">Declined: {cur.declineReason}</p>}
            <section>
              <h3 className="mb-2 font-bold">Customer</h3>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Row k="Name" v={d?.customer.name ?? c?.name} />
                <Row k="Mobile" v={d?.customer.phone ?? c?.phone} />
                <Row k="Alternate" v={d?.customer.altPhone} />
                <Row k="Email" v={d?.customer.email ?? c?.email} />
                <Row k="Contact by" v={d?.customer.contactBy} />
                <Row k="Address" v={d && [d.customer.address, d.customer.city, d.customer.pincode].filter(Boolean).join(', ')} />
              </dl>
            </section>
            <section>
              <h3 className="mb-2 font-bold">Car</h3>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Row k="Number" v={d?.car.reg ?? v?.reg} />
                <Row k="Car" v={d ? `${d.car.make} ${d.car.model}` : vehicleName(v)} />
                <Row k="Variant" v={d?.car.variant ?? v?.variant} />
                <Row k="Year" v={d?.car.year ?? v?.year} />
                <Row k="Fuel" v={d?.car.fuel ?? v?.fuel} />
                <Row k="Transmission" v={d?.car.transmission} />
                <Row k="Colour" v={d?.car.color} />
                <Row k="Odometer" v={km(d?.car.odometer ?? v?.odometer ?? 0)} />
                <Row k="VIN or chassis" v={d?.car.vin} />
                <Row k="Last service" v={d?.car.lastService} />
                <Row k="Insurance" v={d?.car.insurer} />
                <Row k="Insurance expiry" v={d?.car.insuranceExpiry} />
              </dl>
            </section>
            <section>
              <h3 className="mb-2 font-bold">Work requested</h3>
              <div className="flex flex-wrap gap-2">
                {d?.reasons.map((r) => <StatusBadge key={r} tone="blue" size="sm">{VISIT_REASONS.find((x) => x.key === r)?.label}</StatusBadge>)}
                {d?.issues.map((i) => <StatusBadge key={i} tone="amber" size="sm">{i}</StatusBadge>)}
                {(d?.services ?? [cur.service]).map((s) => <StatusBadge key={s} tone="gray" size="sm">{s}</StatusBadge>)}
              </div>
              {cur.notes && <p className="neu-in-sm mt-2 p-3 text-sm">{cur.notes}</p>}
            </section>
            {declining && (
              <div className="rounded-xl bg-ivory-100 p-3">
                <label className="block text-xs font-medium text-ink-500">Reason for the customer<Input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5" placeholder="e.g. Workshop fully booked that day" /></label>
                <Button size="sm" className="mt-2" disabled={!reason.trim()} onClick={() => { setBookingStatus(cur.id, 'Declined', reason.trim()); setReason(''); setDeclining(false); setSel(''); toast.show('Booking declined'); }}>Decline booking</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      {toast.node}
    </>
  );
}
