'use client';

import clsx from 'clsx';
import { CheckCircle2, Clock } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Field, Input, Select, Textarea, VehicleImage } from '@/components/ui';
import { DayPicker } from '@/components/ui/DayPicker';
import { BOOKING_SLOT_LIMIT, CALL_TO_CONFIRM, CAR_UNKNOWN, bookingsInSlot, createBooking } from '@/lib/actions';
import { visibleVehicles } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { ISSUE_GROUPS, MODELS, REG_RE, SERVICE_CATALOG, VISIT_REASONS, normReg } from '@/lib/catalog';
import { estimateTotals, inr } from '@/lib/format';
import { INSURERS, TODAY_ISO } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import type { CarKey, PickupOption, Vehicle, VisitReason } from '@/lib/types';

const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const QUICK_PICKUP = ['I\'ll bring the car', 'Pickup', 'Pickup and drop'];
const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i);
const PICKUPS: PickupOption[] = ['I will drop the car', 'Pick up from my address', 'Pick up and drop back'];
/** Service names on the landing page, mapped to the price list. */
const SERVICE_ALIAS: Record<string, string> = { 'Car Service': 'Periodic service', Diagnostics: 'Diagnostic scan', Detailing: 'Car wash and detailing' };
const STEP_TITLES = ['You and your car', 'What the car needs', 'Date and time'];
const STEP_OF: Record<string, number> = { name: 1, phone: 1, email: 1, pincode: 1, reg: 1, make: 1, model: 1, odometer: 1, reasons: 2, time: 3, pickup: 3 };
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Same label the rest of the app uses, e.g. "Tue, 18 Mar 2025". */
const dayLabel = (days: number) => {
  const d = new Date(Date.parse(`${TODAY_ISO}T00:00:00Z`) + days * 86400000);
  return `${WEEK[d.getUTCDay()]}, ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

function Tap({ on, onClick, children, className, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick} className={clsx('rounded-xl px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40', on ? 'bg-coral-50 text-coral-600 shadow-neu-in-sm ring-1 ring-coral-300' : 'neu-sm text-ink-600', className)}>{children}</button>;
}

const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((i) => i !== x) : [...list, x]);

/** One booking form for everyone. A signed-in customer gets their details and saved cars filled in. */
export function BookingForm({ doneHref }: { doneHref: string }) {
  const db = useDb();
  const { user } = useSession();
  const customer = user?.role === 'customer' ? db.customers.find((c) => c.id === user.customerId) : undefined;
  const saved = user?.role === 'customer' ? visibleVehicles(db, user) : [];

  const [who, setWho] = useState({ name: '', phone: '', altPhone: '', email: '', address: '', city: 'Pune', pincode: '', contactBy: 'WhatsApp' });
  const [vehicleId, setVehicleId] = useState('');
  const [car, setCar] = useState({ reg: '', quick: '', make: '', model: '', variant: '', year: '2022', fuel: 'Petrol' as Vehicle['fuel'], transmission: 'Manual', color: '', odometer: '', vin: '', lastService: '', insurer: '', insuranceExpiry: '', carKey: 'bmw3' as CarKey });
  const [reasons, setReasons] = useState<VisitReason[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('');
  const [pickup, setPickup] = useState<PickupOption>(PICKUPS[0]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [doneId, setDoneId] = useState('');
  const [step, setStep] = useState(1);
  const [quick, setQuick] = useState(true);
  const [need, setNeed] = useState<VisitReason>('service');

  const firstCar = saved[0]?.id;
  // the session and store load after the first render, so fill in the customer once they arrive
  const filled = useRef(false);
  useEffect(() => {
    if (filled.current || !customer) return;
    filled.current = true;
    setWho((w) => ({ ...w, name: customer.name, phone: customer.phone, email: customer.email }));
    const asked = new URLSearchParams(window.location.search).get('vehicle');
    if (asked || firstCar) setVehicleId(asked ?? firstCar);
  }, [customer, firstCar]);

  // read from the address directly: useSearchParams needs a Suspense wrapper, which left this form unresponsive on a direct load
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('service');
    const name = asked ? SERVICE_ALIAS[asked] ?? asked : '';
    if (SERVICE_CATALOG.some((s) => s.label === name)) setServices([name]);
  }, []);

  const picked = saved.find((v) => v.id === vehicleId);
  const date = dayLabel(day);
  const quote = useMemo(() => estimateTotals(services.map((s) => ({ amount: SERVICE_CATALOG.find((x) => x.label === s)?.price ?? 0 }))), [services]);
  const set = <K extends keyof typeof who>(k: K, v: string) => setWho((w) => ({ ...w, [k]: v }));
  const setC = <K extends keyof typeof car>(k: K, v: (typeof car)[K]) => setCar((c) => ({ ...c, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (who.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[+\d][\d\s-]{9,}$/.test(who.phone.trim())) e.phone = 'Enter a valid mobile number';
    if (who.email.trim() && !/^\S+@\S+\.\S+$/.test(who.email.trim())) e.email = 'Enter a valid email or leave it empty';
    if (who.pincode.trim() && !/^\d{6}$/.test(who.pincode.trim())) e.pincode = 'Enter a 6-digit pincode';
    if (!picked) {
      if (!REG_RE.test(car.reg.trim())) e.reg = 'Use a format like MH12AB1234';
      if (!car.make.trim()) e.make = 'Enter the make';
      if (!car.model.trim()) e.model = 'Enter the model';
    }
    const odo = picked ? picked.odometer : Number(car.odometer.replace(/,/g, ''));
    if (!picked && (!car.odometer.trim() || !Number.isFinite(odo) || odo < 0)) e.odometer = 'Enter the current reading';
    if (reasons.length === 0) e.reasons = 'Choose why you are booking';
    if (!time) e.time = 'Choose a time';
    if (pickup !== PICKUPS[0] && !pickupAddress.trim() && !who.address.trim()) e.pickup = 'Enter the pickup address';
    return e;
  };

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };
  const next = () => {
    const e = Object.fromEntries(Object.entries(validate()).filter(([k]) => STEP_OF[k] === step));
    setErr(e);
    if (Object.keys(e).length === 0) go(step + 1);
  };

  const submit = () => {
    const e = validate();
    setErr(e);
    const bad = Object.keys(e).map((k) => STEP_OF[k]);
    if (bad.length) {
      go(Math.min(...bad));
      return;
    }
    const r = createBooking({
      customerId: customer?.id,
      vehicleId: picked?.id,
      carKey: picked?.carKey ?? car.carKey,
      customer: { ...who, name: who.name.trim(), phone: who.phone.trim(), email: who.email.trim() },
      car: { reg: picked?.reg ?? normReg(car.reg), make: picked?.make ?? car.make.trim(), model: picked?.model ?? car.model.trim(), variant: picked?.variant ?? car.variant.trim(), year: picked?.year ?? Number(car.year), fuel: picked?.fuel ?? car.fuel, transmission: car.transmission, color: car.color.trim(), odometer: picked ? Number(car.odometer.replace(/,/g, '')) || picked.odometer : Number(car.odometer.replace(/,/g, '')), vin: car.vin.trim(), lastService: car.lastService, insurer: car.insurer, insuranceExpiry: car.insuranceExpiry },
      reasons, issues, services, date, time, pickup,
      pickupAddress: pickup === PICKUPS[0] ? '' : pickupAddress.trim() || who.address.trim(),
      notes: notes.trim(),
    });
    if (!r.ok) {
      setErr({ form: r.error ?? 'Could not save the booking.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setDoneId(r.id!);
    window.scrollTo({ top: 0 });
  };

  const submitQuick = () => {
    const e: Record<string, string> = {};
    if (who.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^[+\d][\d\s-]{9,}$/.test(who.phone.trim())) e.phone = 'Enter a valid mobile number';
    if (!picked && !REG_RE.test(car.reg.trim())) e.reg = 'Use a format like MH12AB1234';
    if (pickup !== PICKUPS[0] && !pickupAddress.trim()) e.pickup = 'Enter the pickup address';
    setErr(e);
    if (Object.keys(e).length) return;
    const r = createBooking({
      quick: true,
      customerId: customer?.id,
      vehicleId: picked?.id,
      carKey: picked?.carKey ?? car.carKey,
      customer: { ...who, name: who.name.trim(), phone: who.phone.trim() },
      car: { reg: picked?.reg ?? normReg(car.reg), make: picked?.make ?? CAR_UNKNOWN.make, model: picked?.model ?? CAR_UNKNOWN.model, variant: picked?.variant ?? '', year: picked?.year ?? 2022, fuel: picked?.fuel ?? 'Petrol', transmission: '', color: '', odometer: picked?.odometer ?? 0, vin: '', lastService: '', insurer: '', insuranceExpiry: '' },
      reasons: [need], issues: [], services: [], date, time: CALL_TO_CONFIRM, pickup, pickupAddress: pickup === PICKUPS[0] ? '' : pickupAddress.trim(), notes: notes.trim(),
    });
    if (!r.ok) {
      setErr({ form: r.error ?? 'Could not save the booking.' });
      return;
    }
    setDoneId(r.id!);
    window.scrollTo({ top: 0 });
  };

  if (doneId) {
    return (
      <Card className="mx-auto mt-6 max-w-[560px] p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto h-14 w-14 text-ok" />
        <h1 className="mt-3 text-[24px] font-bold">Booking received</h1>
        <p className="mt-1 text-sm text-ink-500">Your reference is <b className="text-ink">{doneId}</b>.</p>
        <p className="neu-in-sm mt-4 p-3 text-sm text-ink-600">{quick ? `We will call ${who.phone} to confirm a time on ${date}.` : `${date} at ${time}. The workshop will confirm this by ${who.contactBy.toLowerCase()} on ${who.phone}.`}</p>
        <Button size="lg" className="mt-5 w-full" href={doneHref}>Done</Button>
      </Card>
    );
  }

  const more = 'mt-3 rounded-2xl bg-ivory-100 p-3 [&[open]>summary]:mb-3';
  const summary = 'cursor-pointer text-sm font-semibold text-coral-600';

  return (
    <div className="mx-auto max-w-[680px] space-y-4">
      <div>
        <h1 className="text-[24px] font-bold">Book a Service</h1>
        <div className="mt-2 grid grid-cols-2 gap-2" role="tablist" aria-label="Booking type">
          {[[true, 'Quick booking'], [false, 'Full details']].map(([q, l]) => <Tap key={String(q)} on={quick === q} onClick={() => { setQuick(q as boolean); setErr({}); }}>{l}</Tap>)}
        </div>
        {!quick && (
          <>
            <p className="mt-3 text-sm text-ink-500">Step {step} of 3 · {STEP_TITLES[step - 1]}</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden>{STEP_TITLES.map((t, i) => <span key={t} className={clsx('h-1.5 rounded-full', i < step ? 'bg-coral-500' : 'bg-ink-500/15')} />)}</div>
          </>
        )}
      </div>
      {err.form && <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad-strong">{err.form}</p>}

      {quick && (
        <Card className="p-4 sm:p-5">
          <p className="mb-3 text-sm text-ink-500">Takes 30 seconds. We will call you for the rest.</p>
          {saved.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{saved.map((v) => <Tap key={v.id} on={vehicleId === v.id} onClick={() => setVehicleId(v.id)}>{v.reg}</Tap>)}<Tap on={!picked} onClick={() => setVehicleId('')}>Another car</Tap></div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *" error={err.name}><Input value={who.name} autoComplete="name" onChange={(e) => set('name', e.target.value)} placeholder="Rohit Kumar" /></Field>
            <Field label="Mobile number *" error={err.phone}><Input inputMode="tel" autoComplete="tel" value={who.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
            {!picked && <Field label="Car number *" error={err.reg}><Input value={car.reg} autoCapitalize="characters" onChange={(e) => setC('reg', e.target.value)} placeholder="MH12AB1234" /></Field>}
            <DayPicker label="Preferred day" value={day} onChange={setDay} todayIso={TODAY_ISO} />
          </div>
          <span className="mb-1.5 mt-3 block text-xs font-medium text-ink-500">What do you need?</span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{VISIT_REASONS.map((r) => <Tap key={r.key} on={need === r.key} onClick={() => setNeed(r.key)} className="!px-2 text-[13px]">{r.label}</Tap>)}</div>
          <span className="mb-1.5 mt-3 block text-xs font-medium text-ink-500">How will the car reach us?</span>
          <div className="grid grid-cols-3 gap-1.5">{PICKUPS.map((p, i) => <Tap key={p} on={pickup === p} onClick={() => setPickup(p)} className="!px-1 text-[13px]">{QUICK_PICKUP[i]}</Tap>)}</div>
          {pickup !== PICKUPS[0] && <Field label="Pickup address *" error={err.pickup} className="mt-3"><Input autoComplete="street-address" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Flat, building, street, area" /></Field>}
          <Button size="lg" className="mt-4 w-full" onClick={submitQuick}>Book now</Button>
        </Card>
      )}

      {!quick && step === 1 && (
        <Card className="p-4 sm:p-5">
          {saved.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {saved.map((v) => <Tap key={v.id} on={vehicleId === v.id} onClick={() => setVehicleId(v.id)} className="flex items-center gap-2"><VehicleImage carKey={v.carKey} className="h-6 w-10" /> {v.reg}</Tap>)}
              <Tap on={!picked} onClick={() => setVehicleId('')}>Another car</Tap>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *" error={err.name}><Input value={who.name} autoComplete="name" onChange={(e) => set('name', e.target.value)} placeholder="Rohit Kumar" /></Field>
            <Field label="Mobile number *" error={err.phone}><Input inputMode="tel" autoComplete="tel" value={who.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
            {!picked && (
              <>
                <Field label="Car number *" error={err.reg}><Input value={car.reg} autoCapitalize="characters" onChange={(e) => setC('reg', e.target.value)} placeholder="MH12AB1234" /></Field>
                <Field label="Quick pick"><Select value={car.quick} onChange={(e) => { const m = MODELS.find((x) => x.key === e.target.value); setCar((c) => (m ? { ...c, quick: m.key, make: m.make, model: m.model, variant: m.variant, fuel: m.fuel, carKey: m.carKey } : { ...c, quick: '' })); }}><option value="">Other</option>{MODELS.map((m) => <option key={m.key} value={m.key}>{m.make} {m.model}</option>)}</Select></Field>
                <Field label="Make *" error={err.make}><Input value={car.make} onChange={(e) => setC('make', e.target.value)} placeholder="Honda" /></Field>
                <Field label="Model *" error={err.model}><Input value={car.model} onChange={(e) => setC('model', e.target.value)} placeholder="City" /></Field>
              </>
            )}
            <Field label={picked ? 'Current odometer (km)' : 'Current odometer (km) *'} error={err.odometer}><Input inputMode="numeric" value={car.odometer} onChange={(e) => setC('odometer', e.target.value)} placeholder={picked ? String(picked.odometer) : '42500'} /></Field>
          </div>
          <details className={more} open={!!(err.email || err.pincode)}>
            <summary className={summary}>Add more details (optional)</summary>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Alternate number"><Input inputMode="tel" value={who.altPhone} onChange={(e) => set('altPhone', e.target.value)} /></Field>
              <Field label="Email" error={err.email}><Input type="email" autoComplete="email" value={who.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
              <Field label="Address" className="sm:col-span-2"><Input autoComplete="street-address" value={who.address} onChange={(e) => set('address', e.target.value)} placeholder="Flat, building, street, area" /></Field>
              <Field label="City"><Input value={who.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="Pincode" error={err.pincode}><Input inputMode="numeric" value={who.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="411001" /></Field>
              <Field label="Contact me by"><Select value={who.contactBy} onChange={(e) => set('contactBy', e.target.value)}>{['WhatsApp', 'Call', 'Email'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
              {!picked && (
                <>
                  <Field label="Variant"><Input value={car.variant} onChange={(e) => setC('variant', e.target.value)} placeholder="ZX CVT" /></Field>
                  <Field label="Year"><Select value={car.year} onChange={(e) => setC('year', e.target.value)}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
                  <Field label="Fuel"><Select value={car.fuel} onChange={(e) => setC('fuel', e.target.value as Vehicle['fuel'])}>{['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((f) => <option key={f}>{f}</option>)}</Select></Field>
                  <Field label="Transmission"><Select value={car.transmission} onChange={(e) => setC('transmission', e.target.value)}>{['Manual', 'Automatic'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
                  <Field label="Colour"><Input value={car.color} onChange={(e) => setC('color', e.target.value)} placeholder="Pearl white" /></Field>
                  <Field label="VIN or chassis number"><Input value={car.vin} autoCapitalize="characters" onChange={(e) => setC('vin', e.target.value)} /></Field>
                  <Field label="Last service date"><Input type="date" max={TODAY_ISO} value={car.lastService} onChange={(e) => setC('lastService', e.target.value)} /></Field>
                </>
              )}
              <Field label="Insurance company"><Select value={car.insurer} onChange={(e) => setC('insurer', e.target.value)}><option value="">Not sure</option>{INSURERS.map((i) => <option key={i}>{i}</option>)}</Select></Field>
              <Field label="Insurance expiry"><Input type="date" value={car.insuranceExpiry} onChange={(e) => setC('insuranceExpiry', e.target.value)} /></Field>
            </div>
          </details>
          <Button size="lg" className="mt-4 w-full" onClick={next}>Next</Button>
        </Card>
      )}

      {!quick && step === 2 && (
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VISIT_REASONS.map((r) => <Tap key={r.key} on={reasons.includes(r.key)} onClick={() => setReasons(toggle(reasons, r.key))}>{r.label}</Tap>)}
          </div>
          {err.reasons && <p className="mt-2 text-xs text-bad">{err.reasons}</p>}
          {reasons.some((r) => r === 'repair' || r === 'breakdown' || r === 'repeat') && (
            <details className={more}>
              <summary className={summary}>What do you notice?{issues.length > 0 ? ` (${issues.length})` : ''}</summary>
              <div className="flex flex-wrap gap-1.5">{ISSUE_GROUPS.flatMap((g) => g.issues).map((i) => <Tap key={i} on={issues.includes(i)} onClick={() => setIssues(toggle(issues, i))} className="!px-2.5 !py-1.5 text-[13px]">{i}</Tap>)}</div>
            </details>
          )}
          <details className={more}>
            <summary className={summary}>Add services (optional){services.length > 0 ? ` (${services.length})` : ''}</summary>
            <div className="flex flex-wrap gap-1.5">{SERVICE_CATALOG.map((s) => <Tap key={s.label} on={services.includes(s.label)} onClick={() => setServices(toggle(services, s.label))} className="!px-2.5 !py-1.5 text-[13px]">{s.label}</Tap>)}</div>
          </details>
          {services.length > 0 && <p className="mt-2 text-sm text-ink-600">Approx. <b className="text-ink">{inr(quote.total)}</b> with GST. Final price after inspection.</p>}
          <Field label="Anything else we should know?" className="mt-3"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Noise from front left when turning" className="!min-h-[60px]" /></Field>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3"><Button size="lg" variant="neu" onClick={() => go(1)}>Back</Button><Button size="lg" onClick={next}>Next</Button></div>
        </Card>
      )}

      {!quick && step === 3 && (
        <Card className="p-4 sm:p-5">
          <DayPicker label="Preferred date" value={day} onChange={(d) => { setDay(d); setTime(''); }} todayIso={TODAY_ISO} />
          <span className="mb-1.5 mt-3 block text-xs font-medium text-ink-500">Preferred time *</span>
          <div className="grid grid-cols-4 gap-1.5">
            {TIMES.map((t) => { const full = bookingsInSlot(db, date, t) >= BOOKING_SLOT_LIMIT; return <Tap key={t} on={time === t} disabled={full} onClick={() => setTime(t)} className="!px-1 text-xs">{t}</Tap>; })}
          </div>
          {err.time && <p className="mt-1 text-xs text-bad">{err.time}</p>}
          <Field label="Getting the car to us" className="mt-3"><Select value={pickup} onChange={(e) => setPickup(e.target.value as PickupOption)}>{PICKUPS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
          {pickup !== PICKUPS[0] && <Field label="Pickup address *" error={err.pickup} className="mt-3"><Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder={who.address || 'Flat, building, street, area'} /></Field>}
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-500"><Clock className="h-4 w-4" /> {date}{time ? ` at ${time}` : ''}</p>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-3"><Button size="lg" variant="neu" onClick={() => go(2)}>Back</Button><Button size="lg" onClick={submit}>Request booking</Button></div>
        </Card>
      )}
    </div>
  );
}
