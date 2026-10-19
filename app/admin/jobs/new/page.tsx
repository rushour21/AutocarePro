'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, ChevronRight, Cog, Droplets, Fan, Gauge, Paintbrush, Plus, ScanLine, Search, Settings2, Trash2, Wrench, Zap } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, Field, Input, SearchInput, Select, Textarea, VehicleImage, useToast } from '@/components/ui';
import { EstimateTotals } from '@/components/features/EstimateView';
import { createEstimate, createJob, sendEstimate, updateEstimate } from '@/lib/actions';
import { customerOf, inr, km, vehicleName } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { EstimateItem, Job, Priority } from '@/lib/types';

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

export default function NewJobPage() {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'number' | 'customer'>('number');
  const [q, setQ] = useState('');
  const [vehicleId, setVehicleId] = useState(db.vehicles[0]?.id ?? '');
  const [service, setService] = useState('brake');
  const [priority, setPriority] = useState<Priority>('Medium');
  const techs = db.users.filter((u) => u.role === 'technician' && u.title === 'Technician');
  const [techId, setTechId] = useState(techs[0]?.id ?? '');
  const [due, setDue] = useState(2);
  const [notes, setNotes] = useState('');
  const [fuel, setFuel] = useState('1/2');
  const [damage, setDamage] = useState('');
  const [lines, setLines] = useState<EstimateItem[]>([]);
  const [skipEstimate, setSkip] = useState(false);
  const [sendNow, setSendNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  const svc = SERVICES.find((s) => s.key === service)!;
  const recent = useMemo(() => {
    const seen = new Set<string>();
    return db.jobs.map((j) => db.vehicles.find((v) => v.id === j.vehicleId)).filter((v): v is NonNullable<typeof v> => !!v && !seen.has(v.id) && !!seen.add(v.id)).slice(0, 5);
  }, [db.jobs, db.vehicles]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return recent;
    return db.vehicles.filter((v) => (mode === 'number' ? v.reg.toLowerCase().includes(s.replace(/\s/g, '')) : (customerOf(db, v.customerId)?.name ?? '').toLowerCase().includes(s))).slice(0, 6);
  }, [q, mode, db, recent]);

  const goNext = () => {
    if (step === 2 && lines.length === 0 && svc.lines.length) setLines(svc.lines.map(([name, type, amount], i) => ({ id: `n${i}`, name, category: type === 'Labour' ? 'Labour' : 'Parts', type, amount })));
    setStep((s) => Math.min(5, s + 1));
  };
  const create = () => {
    if (!vehicle || busy) return;
    setBusy(true);
    const id = createJob({ vehicleId: vehicle.id, service: svc.label, category: svc.cat, priority, techId, dueIn: due, notes: [notes, damage && `Existing damage: ${damage}`, `Fuel level: ${fuel}`].filter(Boolean).join(' · '), by: 'Admin' });
    const valid = lines.filter((l) => l.name.trim());
    if (!skipEstimate && valid.length) {
      const eid = createEstimate(id);
      updateEstimate(eid, valid);
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
              <h2 className="mb-3 text-lg font-bold">Search Vehicle</h2>
              <div className="mb-3 flex gap-2.5">
                {(['number', 'customer'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={clsx('h-11 flex-1 rounded-xl text-sm font-semibold transition', mode === m ? 'tab-dark' : 'tab-idle')}>
                    {m === 'number' ? 'By Number' : 'By Customer'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <SearchInput value={q} onChange={setQ} placeholder={mode === 'number' ? 'Enter registration number (e.g. KA01AB1234)' : 'Enter customer name'} className="flex-1 !h-11" />
                <Button className="!h-11 px-5" aria-label="Search"><Search className="h-4 w-4" /> <span className="hidden sm:inline">Search</span></Button>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 text-base font-bold">{q ? 'Results' : 'Recent Vehicles'}</h2>
              <ul className="space-y-2">
                {results.map((v) => (
                  <li key={v.id}>
                    <button onClick={() => setVehicleId(v.id)} aria-pressed={vehicleId === v.id} className={clsx('neu-row flex w-full items-center gap-4 px-4 py-2.5 text-left transition', vehicleId === v.id && 'ring-2 ring-coral-300')}>
                      <VehicleImage carKey={v.carKey} className="h-10 w-[72px]" />
                      <span className="flex-1"><span className="block text-sm font-bold">{vehicleName(v)}</span><span className="block text-xs text-ink-400">{v.reg}</span></span>
                      <ChevronRight className="h-4 w-4 text-ok" strokeWidth={3} />
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="py-6 text-center text-sm text-ink-400">No vehicle found. Add it from Vehicles first.</li>}
              </ul>
            </Card>
          </div>
          <Card className="flex flex-col p-5">
            <h2 className="mb-3 text-lg font-bold">Vehicle Details</h2>
            {vehicle && (
              <>
                <div className="rounded-2xl bg-white/50 px-4 py-3"><VehicleImage carKey={vehicle.carKey} className="mx-auto h-[190px] w-full max-w-[340px]" /></div>
                <dl className="mt-3 divide-y divide-ivory-300/60 text-sm">
                  {[['Make', vehicle.make], ['Model', vehicle.model], ['Year', String(vehicle.year)], ['Fuel', vehicle.fuel], ['Odometer', km(vehicle.odometer)], ['Owner', customerOf(db, vehicle.customerId)?.name ?? '']].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-2 py-3"><dt className="text-ink-500">{k}</dt><dd className="font-semibold">{v}</dd></div>
                  ))}
                </dl>
              </>
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

      {step === 3 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-bold">Initial inspection</h2>
          <p className="mb-5 text-sm text-ink-500">Record the condition at check-in. Detailed damage points and photos are added in Inspection (3D &amp; Photos) once the job exists.</p>
          <Field label="Fuel level">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fuel level">
              {['Empty', '1/4', '1/2', '3/4', 'Full'].map((f) => (
                <button key={f} role="radio" aria-checked={fuel === f} onClick={() => setFuel(f)} className={clsx('h-11 min-w-[72px] rounded-xl px-4 text-sm font-semibold', fuel === f ? 'tab-dark' : 'tab-idle')}>{f}</button>
              ))}
            </div>
          </Field>
          <Field label="Existing damage (optional)" className="mt-5"><Textarea value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="e.g. Scratch on right side bumper" /></Field>
          {nav()}
        </Card>
      )}

      {step === 4 && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Estimate</h2>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={skipEstimate} onChange={(e) => setSkip(e.target.checked)} className="h-4 w-4 accent-[#f26a2e]" /> Skip — I&apos;ll create it later</label>
          </div>
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
          {!skipEstimate && lines.length > 0 && <EstimateTotals items={lines} className="mt-5" />}
          {nav()}
        </Card>
      )}

      {step === 5 && vehicle && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Review</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="neu-row flex items-center gap-4 px-4 py-3"><VehicleImage carKey={vehicle.carKey} className="h-14 w-24" /><div><p className="font-bold">{vehicleName(vehicle)}</p><p className="text-sm text-ink-500">{vehicle.reg} · {customerOf(db, vehicle.customerId)?.name}</p></div></div>
            <dl className="neu-row space-y-1.5 px-4 py-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Service</dt><dd className="font-semibold">{svc.label}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Priority</dt><dd className="font-semibold">{priority}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Technician</dt><dd className="font-semibold">{techs.find((t) => t.id === techId)?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Delivery</dt><dd className="font-semibold">{DAYS.find(([d]) => d === due)?.[1]}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Fuel level</dt><dd className="font-semibold">{fuel}</dd></div>
            </dl>
          </div>
          {!skipEstimate && lines.filter((l) => l.name.trim()).length > 0 ? (
            <div className="mt-4">
              <ul className="neu-in-sm divide-y divide-ivory-300/50 p-2 text-sm">{lines.filter((l) => l.name.trim()).map((l) => <li key={l.id} className="flex justify-between px-3 py-2"><span>{l.name}</span><span className="font-semibold">{inr(l.amount)}</span></li>)}</ul>
              <EstimateTotals items={lines.filter((l) => l.name.trim())} className="mt-3" />
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
