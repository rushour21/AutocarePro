'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, ChevronRight, Cog, Droplets, Fan, Gauge, Paintbrush, Plus, ScanLine, Search, Settings2, Trash2, UserPlus, Wrench, Zap } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, Field, Input, SearchInput, Select, Textarea, VehicleImage, useToast } from '@/components/ui';
import { EstimateTotals } from '@/components/features/EstimateView';
import { InspectionBoard } from '@/components/features/InspectionBoard';
import { addCustomer, addVehicle, blankPoints, createEstimate, createJob, sendEstimate, updateEstimate } from '@/lib/actions';
import { BODY_STYLES, MODELS, REG_RE, normReg } from '@/lib/catalog';
import { customerOf, inr, km, vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { CarKey, EstimateItem, InspectionPoint, Job, Priority, Vehicle } from '@/lib/types';

const STEPS = ['Vehicle', 'Service', 'Inspection', 'Estimate', 'Review'];
const SERVICES: { key: string; label: string; cat: Job['serviceCategory']; icon: React.ElementType; lines: [string, string, number][] }[] = [
  { key: 'general', label: 'General Service', cat: 'service', icon: Wrench, lines: [['Engine Oil & Filter', 'Parts + Labour', 4500], ['Labour - General Service', 'Labour', 2500]] },
  { key: 'brake', label: 'Brake Service', cat: 'brake', icon: Gauge, lines: [['Brake Pad (Front)', 'Parts', 8500], ['Labour - Brake Service', 'Labour', 4000]] },
  { key: 'engine', label: 'Engine Service', cat: 'service', icon: Cog, lines: [['Engine Oil & Filter', 'Parts + Labour', 4500], ['Labour - Engine Service', 'Labour', 6000]] },
  { key: 'ac', label: 'AC Service', cat: 'ac', icon: Fan, lines: [['AC Filter Replacement', 'Parts + Labour', 3200], ['Refrigerant', 'Parts', 2400]] },
  { key: 'susp', label: 'Suspension', cat: 'service', icon: Settings2, lines: [['Shock Absorber', 'Parts', 9000], ['Labour - Suspension', 'Labour', 3500]] },
  { key: 'diag', label: 'Diagnostics', cat: 'service', icon: ScanLine, lines: [['Diagnostic scan', 'Labour', 1500]] },
  { key: 'detail', label: 'Detailing', cat: 'body', icon: Droplets, lines: [['Detailing package', 'Labour', 6500]] },
  { key: 'body', label: 'Body Repair', cat: 'body', icon: Paintbrush, lines: [['Panel repair & paint', 'Labour', 12000]] },
  { key: 'custom', label: 'Custom Request', cat: 'service', icon: Zap, lines: [] },
];
const DAYS: [number, string][] = [[0, 'Today'], [1, 'Tomorrow'], [2, 'In 2 days'], [3, 'In 3 days'], [5, 'In 5 days']];
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

interface NewVehicleForm {
  owner: 'new' | 'existing';
  customerId: string;
  name: string;
  phone: string;
  email: string;
  quick: string;
  make: string;
  model: string;
  variant: string;
  fuel: Vehicle['fuel'];
  year: string;
  reg: string;
  odometer: string;
  carKey: CarKey;
}
const EMPTY_NV = (customerId: string): NewVehicleForm => ({ owner: 'new', customerId, name: '', phone: '', email: '', quick: '', make: '', model: '', variant: '', fuel: 'Petrol', year: '2022', reg: '', odometer: '', carKey: 'bmw3' });
const isFlagged = (p: InspectionPoint) => p.status === 'minor' || p.status === 'major';

export default function NewJobPage() {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'number' | 'customer' | 'new'>('number');
  const [q, setQ] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [nv, setNv] = useState<NewVehicleForm>(() => EMPTY_NV(db.customers[0]?.id ?? ''));
  const [err, setErr] = useState<Record<string, string>>({});
  const [service, setService] = useState('brake');
  const [priority, setPriority] = useState<Priority>('Medium');
  const techs = db.users.filter((u) => u.role === 'technician' && u.title === 'Technician');
  const load = (id: string) => db.jobs.filter((j) => j.techId === id && j.stage !== 'delivered').length;
  // default to the least-busy technician
  const [techId, setTechId] = useState(() => [...techs].sort((a, b) => load(a.id) - load(b.id))[0]?.id ?? '');
  const [due, setDue] = useState(2);
  const [notes, setNotes] = useState('');
  const [fuel, setFuel] = useState('1/2');
  const [damage, setDamage] = useState('');
  const [points, setPoints] = useState<InspectionPoint[]>(() => blankPoints());
  const [lines, setLines] = useState<EstimateItem[]>([]);
  const [skipEstimate, setSkip] = useState(false);
  const [sendNow, setSendNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const creating = mode === 'new';
  const draftVehicle: Vehicle = { id: 'draft', customerId: nv.owner === 'existing' ? nv.customerId : 'draft', make: nv.make.trim(), model: nv.model.trim(), variant: nv.variant.trim(), fuel: nv.fuel, reg: normReg(nv.reg), year: Number(nv.year), odometer: Number(nv.odometer.replace(/,/g, '')) || 0, carKey: nv.carKey };
  const vehicle = creating ? draftVehicle : db.vehicles.find((v) => v.id === vehicleId);
  const ownerName = !vehicle ? '' : creating && nv.owner === 'new' ? nv.name.trim() : customerOf(db, vehicle.customerId)?.name ?? '';
  const flagged = points.filter(isFlagged);
  const svc = SERVICES.find((s) => s.key === service)!;
  const recent = useMemo(() => {
    const seen = new Set<string>();
    return db.jobs.map((j) => db.vehicles.find((v) => v.id === j.vehicleId)).filter((v): v is NonNullable<typeof v> => !!v && !seen.has(v.id) && !!seen.add(v.id)).slice(0, 5);
  }, [db.jobs, db.vehicles]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return recent;
    return db.vehicles.filter((v) => (mode !== 'customer' ? v.reg.toLowerCase().includes(s.replace(/\s/g, '')) : (customerOf(db, v.customerId)?.name ?? '').toLowerCase().includes(s))).slice(0, 6);
  }, [q, mode, db, recent]);

  const validateNew = () => {
    const e: Record<string, string> = {};
    if (nv.owner === 'new') {
      if (!nv.name.trim()) e.name = 'Enter the customer name';
      if (!/^[+\d][\d\s-]{7,}$/.test(nv.phone.trim())) e.phone = 'Enter a valid phone number';
      if (nv.email.trim() && !/^\S+@\S+\.\S+$/.test(nv.email.trim())) e.email = 'Enter a valid email or leave it empty';
    }
    if (!nv.make.trim()) e.make = 'Enter the make';
    if (!nv.model.trim()) e.model = 'Enter the model';
    if (!REG_RE.test(nv.reg.trim())) e.reg = 'Use a format like KA01AB1234';
    else if (db.vehicles.some((v) => v.reg === normReg(nv.reg))) e.reg = 'This registration is already saved. Search it by number instead.';
    const odo = Number(nv.odometer.replace(/,/g, ''));
    if (nv.odometer.trim() === '' || !Number.isFinite(odo) || odo < 0) e.odometer = 'Enter the odometer reading';
    return e;
  };
  const quickPick = (key: string) => {
    const m = MODELS.find((x) => x.key === key);
    setNv(m ? { ...nv, quick: key, make: m.make, model: m.model, variant: m.variant, fuel: m.fuel, carKey: m.carKey } : { ...nv, quick: '' });
  };

  const validLines = lines.filter((l) => l.name.trim() && l.amount > 0);
  const goNext = () => {
    if (step === 1 && creating) {
      const e = validateNew();
      setErr(e);
      if (Object.keys(e).length) return;
    }
    if (step === 2 && lines.length === 0 && svc.lines.length) setLines(svc.lines.map(([name, type, amount], i) => ({ id: `n${i}`, name, category: type === 'Labour' ? 'Labour' : 'Parts', type, amount })));
    setStep((s) => Math.min(5, s + 1));
  };
  const create = () => {
    if (!vehicle || busy) return;
    if (creating && Object.keys(validateNew()).length) {
      setErr(validateNew());
      setStep(1);
      return;
    }
    setBusy(true);
    let vid = vehicle.id;
    if (creating) {
      const cid = nv.owner === 'new' ? addCustomer({ name: nv.name.trim(), phone: nv.phone.trim(), email: nv.email.trim() }) : nv.customerId;
      vid = addVehicle({ customerId: cid, make: nv.make.trim(), model: nv.model.trim(), variant: nv.variant.trim() || '—', fuel: nv.fuel, carKey: nv.carKey, reg: normReg(nv.reg), year: Number(nv.year), odometer: Number(nv.odometer.replace(/,/g, '')), serviceInDays: 90 });
    }
    const id = createJob({ vehicleId: vid, service: svc.label, category: svc.cat, priority, techId, dueIn: due, notes: [notes, damage, `Fuel level: ${fuel}`].filter(Boolean).join(' · '), points, by: 'Admin' });
    if (!skipEstimate && validLines.length) {
      const eid = createEstimate(id);
      updateEstimate(eid, validLines);
      if (sendNow) sendEstimate(eid);
    }
    toast.show(`Job #${id} created`);
    router.push(`/admin/jobs/${id}`);
  };

  const stepper = (
    <ol className="mb-6 grid grid-cols-5" aria-label="Steps">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const cur = n === step;
        return (
          <li key={s} className="relative flex flex-col items-center" aria-current={cur ? 'step' : undefined}>
            {i < STEPS.length - 1 && <span className={clsx('absolute left-1/2 top-[17px] h-[2px] w-full', done ? 'bg-coral-300' : 'bg-ivory-300')} />}
            <button
              type="button"
              disabled={n > step}
              onClick={() => setStep(n)}
              className={clsx('relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition', cur ? 'btn-coral' : done ? 'bg-coral-100 text-coral-600 shadow-neu-xs' : 'neu-sm !rounded-full text-ink-400')}
            >
              {n}
            </button>
            <span className={clsx('mt-2 text-sm', cur ? 'font-semibold text-coral-600' : 'text-ink-500')}>{s}</span>
          </li>
        );
      })}
    </ol>
  );

  const nav = (disabledNext?: boolean) => (
    <div className="mt-6 flex justify-between">
      <Button variant="neu" size="lg" onClick={() => (step === 1 ? router.push('/admin/jobs') : setStep(step - 1))}><ArrowLeft className="h-4 w-4" /> {step === 1 ? 'Cancel' : 'Back'}</Button>
      {step < 5 ? <Button size="lg" onClick={goNext} disabled={disabledNext} className="min-w-[150px]">Next <ArrowRight className="h-4 w-4" /></Button> : <Button size="lg" onClick={create} disabled={busy} className="min-w-[170px]">Create Job</Button>}
    </div>
  );

  return (
    <>
      <TopBar showUser />
      <h1 className="mb-5 text-[26px] font-bold">Create New Job</h1>
      {stepper}

      {step === 1 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">{creating ? 'New Customer & Vehicle' : 'Search Vehicle'}</h2>
              <div className="mb-3 grid grid-cols-3 gap-2" role="tablist" aria-label="Find or add a vehicle">
                {([['number', 'By Number'], ['customer', 'By Customer'], ['new', 'New Vehicle']] as const).map(([m, label]) => (
                  <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr({}); }} className={clsx('flex h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition', mode === m ? 'tab-dark' : 'tab-idle')}>
                    {m === 'new' && <UserPlus className="h-4 w-4" />} {label}
                  </button>
                ))}
              </div>
              {!creating ? (
                <div className="flex gap-2.5">
                  <SearchInput value={q} onChange={setQ} placeholder={mode === 'number' ? 'Enter registration number (e.g. KA01AB1234)' : 'Enter customer name'} className="flex-1 !h-11" />
                  <Button className="!h-11 px-5" aria-label="Search"><Search className="h-4 w-4" /> <span className="hidden sm:inline">Search</span></Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Owner</p>
                    <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Owner">
                      {([['new', 'New customer'], ['existing', 'Existing customer']] as const).map(([o, label]) => (
                        <button key={o} role="radio" aria-checked={nv.owner === o} onClick={() => setNv({ ...nv, owner: o })} className={clsx('h-10 rounded-xl text-sm font-semibold transition', nv.owner === o ? 'tab-dark' : 'tab-idle')}>{label}</button>
                      ))}
                    </div>
                    {nv.owner === 'new' ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Full name *" error={err.name}><Input value={nv.name} onChange={(e) => setNv({ ...nv, name: e.target.value })} placeholder="e.g. Rohit Kumar" autoComplete="off" /></Field>
                        <Field label="Phone *" error={err.phone}><Input inputMode="tel" value={nv.phone} onChange={(e) => setNv({ ...nv, phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
                        <Field label="Email (optional)" error={err.email} className="sm:col-span-2"><Input type="email" value={nv.email} onChange={(e) => setNv({ ...nv, email: e.target.value })} placeholder="name@example.com" /></Field>
                      </div>
                    ) : (
                      <Field label="Customer"><Select value={nv.customerId} onChange={(e) => setNv({ ...nv, customerId: e.target.value })}>{db.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</Select></Field>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Vehicle</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Quick pick" className="sm:col-span-2">
                        <Select value={nv.quick} onChange={(e) => quickPick(e.target.value)}>
                          <option value="">Other / enter manually</option>
                          {MODELS.map((m) => <option key={m.key} value={m.key}>{m.make} {m.model} · {m.variant}</option>)}
                        </Select>
                      </Field>
                      <Field label="Make *" error={err.make}><Input value={nv.make} onChange={(e) => setNv({ ...nv, make: e.target.value, quick: '' })} placeholder="e.g. Honda" /></Field>
                      <Field label="Model *" error={err.model}><Input value={nv.model} onChange={(e) => setNv({ ...nv, model: e.target.value, quick: '' })} placeholder="e.g. City" /></Field>
                      <Field label="Variant (optional)"><Input value={nv.variant} onChange={(e) => setNv({ ...nv, variant: e.target.value })} placeholder="e.g. ZX CVT" /></Field>
                      <Field label="Fuel"><Select value={nv.fuel} onChange={(e) => setNv({ ...nv, fuel: e.target.value as Vehicle['fuel'] })}>{['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((f) => <option key={f}>{f}</option>)}</Select></Field>
                      <Field label="Registration number *" error={err.reg}><Input value={nv.reg} onChange={(e) => setNv({ ...nv, reg: e.target.value })} placeholder="KA01AB1234" autoCapitalize="characters" /></Field>
                      <Field label="Year"><Select value={nv.year} onChange={(e) => setNv({ ...nv, year: e.target.value })}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Select></Field>
                      <Field label="Odometer (km) *" error={err.odometer}><Input inputMode="numeric" value={nv.odometer} onChange={(e) => setNv({ ...nv, odometer: e.target.value })} placeholder="42,500" /></Field>
                      <Field label="Picture"><Select value={nv.carKey} onChange={(e) => setNv({ ...nv, carKey: e.target.value as CarKey })}>{BODY_STYLES.map((b) => <option key={b.carKey} value={b.carKey}>{b.label}</option>)}</Select></Field>
                    </div>
                  </div>
                  <p className="text-xs text-ink-400">The customer and vehicle are saved when you create the job.</p>
                </div>
              )}
            </Card>
            {!creating && (
              <Card className="p-5">
                <h2 className="mb-3 text-base font-bold">{q ? 'Results' : 'Recent Vehicles'}</h2>
                <ul className="space-y-2">
                  {results.map((v) => (
                    <li key={v.id}>
                      <button onClick={() => setVehicleId(v.id)} aria-pressed={vehicleId === v.id} className={clsx('neu-row flex w-full items-center gap-4 px-4 py-2.5 text-left transition', vehicleId === v.id && 'ring-2 ring-coral-300')}>
                        <VehicleImage carKey={v.carKey} className="h-10 w-[72px]" />
                        <span className="flex-1"><span className="block text-sm font-bold">{vehicleName(v)}</span><span className="block text-xs text-ink-400">{v.reg} · {customerOf(db, v.customerId)?.name}</span></span>
                        <ChevronRight className={clsx('h-4 w-4', vehicleId === v.id ? 'text-ok' : 'text-ink-300')} strokeWidth={3} />
                      </button>
                    </li>
                  ))}
                  {results.length === 0 && (
                    <li className="flex flex-col items-center gap-3 py-6 text-center text-sm text-ink-400">
                      No vehicle found.
                      <Button variant="blue" size="sm" onClick={() => { setNv({ ...EMPTY_NV(db.customers[0]?.id ?? ''), reg: mode === 'number' ? q.toUpperCase() : '' }); setMode('new'); }}><UserPlus className="h-4 w-4" /> Add as a new customer / vehicle</Button>
                    </li>
                  )}
                </ul>
              </Card>
            )}
          </div>
          <Card className="flex flex-col p-5">
            <h2 className="mb-3 text-lg font-bold">Vehicle Details</h2>
            {vehicle ? (
              <>
                <div className="rounded-2xl bg-white/50 px-4 py-3"><VehicleImage carKey={vehicle.carKey} className="mx-auto h-[190px] w-full max-w-[340px]" /></div>
                <dl className="mt-3 divide-y divide-ivory-300/60 text-sm">
                  {[['Make', vehicle.make || '—'], ['Model', vehicle.model || '—'], ['Registration', vehicle.reg || '—'], ['Year', String(vehicle.year)], ['Fuel', vehicle.fuel], ['Odometer', vehicle.odometer ? km(vehicle.odometer) : '—'], ['Owner', ownerName || '—']].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-2 py-3"><dt className="text-ink-500">{k}</dt><dd className="font-semibold">{v}</dd></div>
                  ))}
                </dl>
                {creating && nv.owner === 'new' && <p className="mt-1 px-2 text-xs font-semibold text-coral-600">New customer — will be added with this job</p>}
              </>
            ) : (
              <div className="neu-in flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-sm text-ink-400">Select a vehicle to see its details,<br />or add a new customer and vehicle.</div>
            )}
            <div className="mt-auto flex justify-end pt-5"><Button size="lg" onClick={goNext} disabled={!vehicle} className="min-w-[170px]">Next <ArrowRight className="h-4 w-4" /></Button></div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Service Type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Service type">
            {SERVICES.map(({ key, label, icon: Icon }) => (
              <button key={key} role="radio" aria-checked={service === key} onClick={() => { setService(key); setLines([]); }} className={clsx('flex h-[76px] flex-col items-center justify-center gap-2 rounded-2xl text-sm font-medium transition', service === key ? 'bg-coral-50 text-coral-600 shadow-neu-in-sm ring-1 ring-coral-300' : 'neu-sm text-ink-600')}>
                <Icon className="h-5 w-5" strokeWidth={1.8} /> {label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Priority">
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Priority">
                {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                  <button key={p} role="radio" aria-checked={priority === p} onClick={() => setPriority(p)} className={clsx('h-11 rounded-xl text-sm font-semibold transition', priority === p ? (p === 'High' ? 'btn-coral' : 'tab-dark') : 'tab-idle')}>{p}</button>
                ))}
              </div>
            </Field>
            <Field label="Promised delivery"><Select value={due} onChange={(e) => setDue(Number(e.target.value))}>{DAYS.map(([d, l]) => <option key={d} value={d}>{l}</option>)}</Select></Field>
            <Field label="Assign technician"><Select value={techId} onChange={(e) => setTechId(e.target.value)}>{techs.map((t) => <option key={t.id} value={t.id}>{t.name} — {db.jobs.filter((j) => j.techId === t.id && j.stage !== 'delivered').length} active jobs</option>)}</Select></Field>
            <Field label="Customer complaint / notes" className="sm:col-span-2"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did the customer report?" /></Field>
          </div>
          {nav()}
        </Card>
      )}

      {step === 3 && vehicle && (
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-bold">Check-in inspection</h2>
            <p className="mb-5 text-sm text-ink-500">Tap the car to mark the parts that have an issue, then choose the damage type, severity, notes and photos. Anything you don&apos;t touch stays &quot;Not checked&quot;.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Fuel level">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fuel level">
                  {['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => (
                    <button key={f} role="radio" aria-checked={fuel === f} onClick={() => setFuel(f)} className={clsx('h-10 min-w-[60px] rounded-xl px-3 text-sm font-semibold', fuel === f ? 'tab-dark' : 'tab-idle')}>{f}</button>
                  ))}
                </div>
              </Field>
              <Field label="Other notes (optional)"><Textarea value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="e.g. Customer left a spare key" className="!min-h-[44px]" /></Field>
            </div>
          </Card>
          <InspectionBoard mode="admin" layout="split" draft={{ points, onChange: setPoints }} carKey={vehicle.carKey} />
          <p className="text-sm text-ink-500" aria-live="polite">{flagged.length === 0 ? 'No areas flagged yet. You can continue if the vehicle has no visible issues.' : `${flagged.length} ${flagged.length === 1 ? 'area' : 'areas'} flagged: ${flagged.map((p) => p.label).join(', ')}`}</p>
          {nav()}
        </div>
      )}

      {step === 4 && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Estimate</h2>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={skipEstimate} onChange={(e) => setSkip(e.target.checked)} className="h-4 w-4 accent-[#f26a2e]" /> Skip — I&apos;ll create it later</label>
          </div>
          {flagged.length > 0 && (
            <div className="neu-in-sm mb-4 px-4 py-3 text-sm">
              <p className="mb-1 font-semibold">Flagged at check-in</p>
              <ul className="space-y-0.5 text-ink-600">{flagged.map((p) => <li key={p.id}>{p.label} — {p.damage}, {p.severity}{p.notes ? ` (${p.notes})` : ''}</li>)}</ul>
            </div>
          )}
          <div className={clsx('space-y-2.5', skipEstimate && 'pointer-events-none opacity-40')}>
            {lines.map((l, i) => (
              <div key={l.id} className="grid grid-cols-[1fr_130px_auto] items-center gap-2 sm:grid-cols-[1.4fr_1fr_120px_auto]">
                <Input aria-label="Item" value={l.name} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Item" className="col-span-3 sm:col-span-1" />
                <Select aria-label="Type" value={l.type} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, type: e.target.value, category: e.target.value === 'Labour' ? 'Labour' : 'Parts' } : x)))}><option>Parts</option><option>Labour</option><option>Parts + Labour</option></Select>
                <Input aria-label="Amount" inputMode="numeric" value={l.amount} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))} />
                <button aria-label="Remove line" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="btn btn-neu h-10 w-10 !rounded-full text-bad"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <Button variant="blue" size="sm" onClick={() => setLines([...lines, { id: `n${Date.now()}`, name: '', category: 'Parts', type: 'Parts', amount: 0 }])}><Plus className="h-4 w-4" /> Add line</Button>
          </div>
          {!skipEstimate && lines.some((l) => l.name.trim() && l.amount <= 0) && <p className="mt-3 text-xs text-bad">Lines with no amount are left out of the estimate.</p>}
          {!skipEstimate && validLines.length > 0 && <EstimateTotals items={validLines} className="mt-5" />}
          {nav()}
        </Card>
      )}

      {step === 5 && vehicle && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Review</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="neu-row flex items-center gap-4 px-4 py-3"><VehicleImage carKey={vehicle.carKey} className="h-14 w-24" /><div><p className="font-bold">{vehicleName(vehicle)}</p><p className="text-sm text-ink-500">{vehicle.reg} · {ownerName}{creating && nv.owner === 'new' && <span className="ml-2 rounded-md bg-coral-100 px-1.5 py-0.5 text-[11px] font-semibold text-coral-600">New customer</span>}</p></div></div>
            <dl className="neu-row space-y-1.5 px-4 py-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Service</dt><dd className="font-semibold">{svc.label}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Priority</dt><dd className="font-semibold">{priority}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Technician</dt><dd className="font-semibold">{techs.find((t) => t.id === techId)?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Delivery</dt><dd className="font-semibold">{DAYS.find(([d]) => d === due)?.[1]}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Fuel level</dt><dd className="font-semibold">{fuel}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Areas flagged</dt><dd className="font-semibold">{flagged.length}</dd></div>
            </dl>
          </div>
          {flagged.length > 0 && (
            <ul className="neu-in-sm mt-4 divide-y divide-ivory-300/50 p-2 text-sm" aria-label="Flagged areas">
              {flagged.map((p) => <li key={p.id} className="flex justify-between gap-3 px-3 py-2"><span className="font-medium">{p.label}</span><span className="text-ink-500">{p.damage} · {p.severity}</span></li>)}
            </ul>
          )}
          {!skipEstimate && validLines.length > 0 ? (
            <div className="mt-4">
              <ul className="neu-in-sm divide-y divide-ivory-300/50 p-2 text-sm">{validLines.map((l) => <li key={l.id} className="flex justify-between px-3 py-2"><span>{l.name}</span><span className="font-semibold">{inr(l.amount)}</span></li>)}</ul>
              <EstimateTotals items={validLines} className="mt-3" />
              <label className="mt-4 flex items-center gap-2.5 text-sm"><input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} className="h-4 w-4 accent-[#f26a2e]" /> Send the estimate to the customer now</label>
            </div>
          ) : <p className="mt-4 text-sm text-ink-500">No estimate will be created with this job.</p>}
          {nav()}
        </Card>
      )}
      {toast.node}
    </>
  );
}
