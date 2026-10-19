'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { CalendarDays, Check, Cog, Droplets, Fan, Gauge, ScanLine, Settings2, Sparkles, Wrench } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, Field, Select, Textarea, VehicleImage, useToast } from '@/components/ui';
import { bookService } from '@/lib/actions';
import { visibleVehicles } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';

const SERVICES = [
  { label: 'General Service', icon: Wrench }, { label: 'Brake Service', icon: Gauge }, { label: 'Engine Service', icon: Cog }, { label: 'AC Service', icon: Fan },
  { label: 'Suspension', icon: Settings2 }, { label: 'Diagnostics', icon: ScanLine }, { label: 'Detailing', icon: Droplets }, { label: 'Custom Request', icon: Sparkles },
];
const DATES = ['Mon, 18 Mar 2025', 'Tue, 19 Mar 2025', 'Wed, 20 Mar 2025', 'Thu, 21 Mar 2025', 'Fri, 22 Mar 2025', 'Sat, 23 Mar 2025'];
const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
const STEPS = ['Select Vehicle', 'Choose Service', 'Date & Time', 'Confirm'];

function Inner() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const vehicles = user ? visibleVehicles(db, user) : [];
  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState(params.get('vehicle') ?? vehicles[0]?.id ?? '');
  const [service, setService] = useState('Brake Service');
  const [date, setDate] = useState(DATES[0]);
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState<string | null>(null);
  if (!user) return null;
  const v = vehicles.find((x) => x.id === vehicleId) ?? vehicles[0];

  if (done) {
    return (
      <div className="neu mx-auto mt-6 max-w-xl p-8 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-8 w-8" strokeWidth={3} /></span>
        <h1 className="text-2xl font-bold">Service booked</h1>
        <p className="mt-2 text-sm text-ink-500">{service} for your {vehicleName(v)} on {date} at {time}. We&apos;ll confirm shortly.</p>
        <div className="mt-6 flex justify-center gap-3"><Button href="/customer/bookings">View bookings</Button><Button variant="neu" href="/customer">Dashboard</Button></div>
      </div>
    );
  }

  const stepper = (
    <ol className="neu-sm mb-5 grid grid-cols-4 !rounded-[20px] px-3 py-4" aria-label="Booking steps">
      {STEPS.map((s, i) => (
        <li key={s} className="relative flex flex-col items-center" aria-current={i + 1 === step ? 'step' : undefined}>
          {i < 3 && <span className={clsx('absolute left-1/2 top-[17px] h-[2px] w-full', i + 1 < step ? 'bg-coral-300' : 'bg-ivory-300')} />}
          <span className={clsx('relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold', i + 1 === step ? 'btn-coral' : i + 1 < step ? 'bg-coral-100 text-coral-600' : 'neu-sm !rounded-full text-ink-400')}>{i + 1 < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}</span>
          <span className={clsx('mt-2 text-center text-[11px] sm:text-xs', i + 1 === step ? 'font-semibold text-ink' : 'text-ink-400')}>{s}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <TopBar showUser />
      <h1 className="text-[26px] font-bold">Book a Service</h1>
      <p className="mb-5 mt-1 text-sm text-ink-500">Schedule a service at your convenience.</p>
      {stepper}

      {step === 1 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">Select Vehicle</h2>
          <div className="neu-row mb-6 flex items-center gap-4 px-4 py-3">
            {v && <VehicleImage carKey={v.carKey} className="h-12 w-24" />}
            <Select aria-label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="flex-1">{vehicles.map((x) => <option key={x.id} value={x.id}>{vehicleName(x)} — {x.reg}</option>)}</Select>
          </div>
          <h2 className="mb-3 text-lg font-bold">Service Type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Service type">
            {SERVICES.map(({ label, icon: Icon }) => (
              <button key={label} role="radio" aria-checked={service === label} onClick={() => setService(label)} className={clsx('flex h-[84px] flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center text-[13px] font-medium transition', service === label ? 'bg-coral-50 text-coral-600 shadow-neu-in-sm ring-1 ring-coral-300' : 'neu-sm text-ink-600')}>
                <Icon className="h-5 w-5" strokeWidth={1.7} /> {label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Preferred Date"><div className="relative"><CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" /><Select value={date} onChange={(e) => setDate(e.target.value)} className="[&_select]:pl-10">{DATES.map((d) => <option key={d}>{d}</option>)}</Select></div></Field>
            <Field label="Preferred Time"><Select value={time} onChange={(e) => setTime(e.target.value)}>{TIMES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          </div>
          <Button size="lg" className="mt-6 w-full" disabled={!v} onClick={() => setStep(2)}>Next Step →</Button>
        </Card>
      )}
      {step === 2 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-bold">{service}</h2>
          <p className="mb-4 text-sm text-ink-500">Tell us anything our team should know before your visit.</p>
          <Field label="Notes (optional)"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Squeaking noise when braking" /></Field>
          <div className="mt-6 flex gap-3"><Button variant="neu" size="lg" onClick={() => setStep(1)}>Back</Button><Button size="lg" className="flex-1" onClick={() => setStep(3)}>Next Step →</Button></div>
        </Card>
      )}
      {step === 3 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">Date &amp; Time</h2>
          <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Date">{DATES.map((d) => <button key={d} role="radio" aria-checked={date === d} onClick={() => setDate(d)} className={clsx('rounded-xl px-4 py-2.5 text-sm font-medium', date === d ? 'tab-dark' : 'tab-idle')}>{d.slice(0, 11)}</button>)}</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Time">{TIMES.map((t) => <button key={t} role="radio" aria-checked={time === t} onClick={() => setTime(t)} className={clsx('rounded-xl px-4 py-2.5 text-sm font-medium', time === t ? 'btn-coral' : 'tab-idle')}>{t}</button>)}</div>
          <div className="mt-6 flex gap-3"><Button variant="neu" size="lg" onClick={() => setStep(2)}>Back</Button><Button size="lg" className="flex-1" onClick={() => setStep(4)}>Next Step →</Button></div>
        </Card>
      )}
      {step === 4 && v && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">Confirm</h2>
          <div className="neu-row mb-4 flex items-center gap-4 px-4 py-3"><VehicleImage carKey={v.carKey} className="h-12 w-24" /><div><p className="font-bold">{vehicleName(v)}</p><p className="text-sm text-ink-500">{v.reg}</p></div></div>
          <dl className="neu-in-sm space-y-2 p-4 text-sm"><div className="flex justify-between"><dt className="text-ink-500">Service</dt><dd className="font-semibold">{service}</dd></div><div className="flex justify-between"><dt className="text-ink-500">Date</dt><dd className="font-semibold">{date}</dd></div><div className="flex justify-between"><dt className="text-ink-500">Time</dt><dd className="font-semibold">{time}</dd></div>{notes && <div className="flex justify-between gap-4"><dt className="text-ink-500">Notes</dt><dd className="text-right">{notes}</dd></div>}</dl>
          <div className="mt-6 flex gap-3"><Button variant="neu" size="lg" onClick={() => setStep(3)}>Back</Button><Button size="lg" className="flex-1" onClick={() => { bookService({ customerId: user.customerId!, vehicleId: v.id, service, date, time, notes }); toast.show('Booking requested'); setDone('ok'); }}>Confirm Booking</Button></div>
        </Card>
      )}
      <button className="sr-only" onClick={() => router.back()}>Back</button>
      {toast.node}
    </>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
