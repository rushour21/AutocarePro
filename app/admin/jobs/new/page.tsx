'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Camera, Check, CheckCircle2, MessageCircle, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { DayPicker } from '@/components/ui/DayPicker';
import { Button, Card, Field, Input, SearchInput, Select, Textarea, VehicleImage } from '@/components/ui';
import { addCustomer, addVehicle, checkInJob } from '@/lib/actions';
import { BELONGINGS, FUEL_LEVELS, ISSUE_GROUPS, ISSUE_SUGGESTS, MODELS, REG_RE, SERVICE_CATALOG, VISIT_REASONS, normReg } from '@/lib/catalog';
import { customerOf, estimateTotals, inr, km, vehicleName } from '@/lib/format';
import { INSURERS, TODAY_ISO } from '@/lib/insurance';
import { useDb } from '@/lib/store';
import type { ApprovalMethod, BroughtBy, CarKey, ClaimType, Job, Vehicle, VisitReason } from '@/lib/types';

const SIDES = ['Front', 'Back', 'Left', 'Right'];
const SAMPLE = ['bumper', 'bumper-2', 'bumper-3', 'garage-1'].map((n) => `/assets/photos/${n}.jpg`);
const NEEDS_ISSUES: VisitReason[] = ['repair', 'breakdown', 'repeat'];

interface WorkLine {
  name: string;
  type: string;
  amount: number;
  cat: Job['serviceCategory'];
}

function Tap({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={clsx('rounded-xl px-3 py-2.5 text-sm font-medium transition', on ? 'bg-coral-50 text-coral-600 shadow-neu-in-sm ring-1 ring-coral-300' : 'neu-sm text-ink-600', className)}>{children}</button>;
}

function Part({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="btn-coral flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">{n}</span>
        <div><h2 className="text-lg font-bold leading-tight">{title}</h2>{hint && <p className="text-sm text-ink-500">{hint}</p>}</div>
      </div>
      {children}
    </Card>
  );
}

const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((i) => i !== x) : [...list, x]);

export default function CheckInPage() {
  const db = useDb();
  const router = useRouter();
  const techs = db.users.filter((u) => u.role === 'technician' && u.title === 'Technician');
  const load = (id: string) => db.jobs.filter((j) => j.techId === id && j.stage !== 'delivered').length;

  const [q, setQ] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [adding, setAdding] = useState(false);
  const [nv, setNv] = useState({ reg: '', name: '', phone: '', quick: '', make: '', model: '', fuel: 'Petrol' as Vehicle['fuel'], carKey: 'bmw3' as CarKey });

  const [reasons, setReasons] = useState<VisitReason[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [complaint, setComplaint] = useState('');
  const [work, setWork] = useState<WorkLine[]>([]);
  const [repeatOf, setRepeatOf] = useState('');
  const [claiming, setClaiming] = useState(true);
  const [claim, setClaim] = useState({ type: 'Cashless' as ClaimType, insurer: INSURERS[0] as string, policyNo: '', claimNo: '', accidentDate: TODAY_ISO });

  const [odometer, setOdometer] = useState('');
  const [fuel, setFuel] = useState('1/2');
  const [broughtBy, setBroughtBy] = useState<BroughtBy>('Owner');
  const [belongings, setBelongings] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>(['', '', '', '']);
  const [due, setDue] = useState(1);
  const [techId, setTechId] = useState(() => [...techs].sort((a, b) => load(a.id) - load(b.id))[0]?.id ?? '');
  const [urgent, setUrgent] = useState(false);
  const [approved, setApproved] = useState(false);
  const [method, setMethod] = useState<ApprovalMethod>('In person');
  const [err, setErr] = useState<Record<string, string>>({});
  const [doneId, setDoneId] = useState('');

  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  const owner = vehicle && customerOf(db, vehicle.customerId);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/\s/g, '');
    if (!s) return [];
    return db.vehicles.filter((v) => {
      const c = customerOf(db, v.customerId);
      return v.reg.toLowerCase().includes(s) || (c?.phone ?? '').replace(/\s/g, '').includes(s) || (c?.name ?? '').toLowerCase().replace(/\s/g, '').includes(s);
    }).slice(0, 5);
  }, [q, db]);
  const pastJobs = vehicle ? db.jobs.filter((j) => j.vehicleId === vehicle.id && j.stage === 'delivered') : [];
  const insurance = reasons.includes('accident') && claiming;
  const totals = estimateTotals(work);

  const pick = (v: Vehicle) => { setVehicleId(v.id); setOdometer(String(v.odometer)); setErr({}); };
  const addWork = (name: string) => {
    const s = SERVICE_CATALOG.find((x) => x.label === name)!;
    setWork((w) => (w.some((x) => x.name === name) ? w.filter((x) => x.name !== name) : [...w, { name, type: s.type, amount: s.price, cat: s.cat }]));
  };
  const tapReason = (r: VisitReason) => {
    const next = toggle(reasons, r);
    setReasons(next);
    if (r === 'breakdown' && next.includes(r)) { setUrgent(true); setBroughtBy('Towed in'); setMethod('Phone'); }
  };
  const tapIssue = (i: string) => {
    const on = !issues.includes(i);
    setIssues(toggle(issues, i));
    const hint = ISSUE_SUGGESTS[i];
    if (on && hint && !work.some((w) => w.name === hint)) addWork(hint);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (adding) {
      if (!REG_RE.test(nv.reg.trim())) e.reg = 'Use a format like MH12AB1234';
      else if (db.vehicles.some((v) => v.reg === normReg(nv.reg))) e.reg = 'This car is already saved. Search for it instead.';
      if (!nv.name.trim()) e.name = 'Enter the customer name';
      if (!/^[+\d][\d\s-]{7,}$/.test(nv.phone.trim())) e.phone = 'Enter a valid phone number';
      if (!nv.make.trim()) e.make = 'Enter the make';
      if (!nv.model.trim()) e.model = 'Enter the model';
    } else if (!vehicle) e.vehicle = 'Find the car first';
    if (reasons.length === 0) e.reasons = 'Choose why the car has come in';
    const odo = Number(odometer.replace(/,/g, ''));
    if (!odometer.trim() || !Number.isFinite(odo) || odo < 0) e.odometer = 'Enter the odometer reading';
    return e;
  };

  const submit = () => {
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    let vid = vehicleId;
    if (adding) {
      const cid = addCustomer({ name: nv.name.trim(), phone: nv.phone.trim() });
      vid = addVehicle({ customerId: cid, make: nv.make.trim(), model: nv.model.trim(), variant: '—', fuel: nv.fuel, carKey: nv.carKey, reg: normReg(nv.reg), year: 2022, odometer: Number(odometer.replace(/,/g, '')), serviceInDays: 90 });
    }
    setDoneId(checkInJob({
      vehicleId: vid, techId, priority: urgent ? 'High' : 'Medium', dueIn: due, work,
      checkin: { reasons, issues, complaint: complaint.trim(), odometer: Number(odometer.replace(/,/g, '')), fuel, broughtBy, belongings, photos: photos.filter(Boolean), repeatOf: repeatOf || undefined },
      approval: approved ? method : undefined,
      insurance: insurance ? claim : undefined,
      by: 'Admin',
    }));
    window.scrollTo({ top: 0 });
  };

  const done = db.jobs.find((j) => j.id === doneId);
  if (done) {
    const c = customerOf(db, done.customerId);
    const link = `${window.location.origin}/track/${done.trackingToken}`;
    const text = `Hello ${c?.name ?? ''}, your car has been checked in at ${db.garage.name}. Job #${done.id}. Track it here: ${link}`;
    return (
      <>
        <TopBar showUser />
        <Card className="mx-auto max-w-[560px] p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-ok" />
          <h1 className="mt-3 text-[24px] font-bold">Car checked in</h1>
          <p className="mt-1 text-sm text-ink-500">Job #{done.id} is with {db.users.find((u) => u.id === done.techId)?.name}.</p>
          {!done.clientApproval && <p className="neu-in-sm mt-4 p-3 text-sm text-warn-strong">Client approval is still pending. You can tick it on the job page.</p>}
          <div className="mt-5 grid gap-3">
            <a className="btn btn-coral h-12 gap-2 px-5 text-sm" href={`https://wa.me/${(c?.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Send tracking link on WhatsApp</a>
            <Button size="lg" variant="neu" onClick={() => router.push(`/admin/jobs/${done.id}`)}>Open job</Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <TopBar showUser />
      <div className="mx-auto max-w-[860px] space-y-4">
        <div>
          <h1 className="text-[26px] font-bold">Check In a Car</h1>
          <p className="text-sm text-ink-500">Record what you know now. The technician adds the rest after inspection.</p>
        </div>

        <Part n={1} title="Find the car" hint="Search by car number, phone or name">
          {vehicle ? (
            <div className="neu-row flex items-center gap-4 px-4 py-3">
              <VehicleImage carKey={vehicle.carKey} className="h-12 w-20 shrink-0" />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{vehicleName(vehicle)} · {vehicle.reg}</p><p className="truncate text-sm text-ink-500">{owner?.name} · {owner?.phone} · {km(vehicle.odometer)}</p></div>
              <button type="button" aria-label="Change car" onClick={() => { setVehicleId(''); setQ(''); }} className="btn btn-neu h-10 w-10 shrink-0 !rounded-full"><X className="h-4 w-4" /></button>
            </div>
          ) : adding ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Car number *" error={err.reg}><Input value={nv.reg} onChange={(e) => setNv({ ...nv, reg: e.target.value })} placeholder="MH12AB1234" autoCapitalize="characters" /></Field>
                <Field label="Customer name *" error={err.name}><Input value={nv.name} onChange={(e) => setNv({ ...nv, name: e.target.value })} placeholder="Rohit Kumar" /></Field>
                <Field label="Phone *" error={err.phone}><Input inputMode="tel" value={nv.phone} onChange={(e) => setNv({ ...nv, phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Quick pick"><Select value={nv.quick} onChange={(e) => { const m = MODELS.find((x) => x.key === e.target.value); setNv(m ? { ...nv, quick: m.key, make: m.make, model: m.model, fuel: m.fuel, carKey: m.carKey } : { ...nv, quick: '' }); }}><option value="">Other</option>{MODELS.map((m) => <option key={m.key} value={m.key}>{m.make} {m.model}</option>)}</Select></Field>
                <Field label="Make *" error={err.make}><Input value={nv.make} onChange={(e) => setNv({ ...nv, make: e.target.value, quick: '' })} placeholder="Honda" /></Field>
                <Field label="Model *" error={err.model}><Input value={nv.model} onChange={(e) => setNv({ ...nv, model: e.target.value, quick: '' })} placeholder="City" /></Field>
              </div>
              <Button variant="neu" size="sm" onClick={() => setAdding(false)}><Search className="h-4 w-4" /> Search saved cars instead</Button>
            </div>
          ) : (
            <>
              <SearchInput value={q} onChange={setQ} placeholder="MH12AB1234, 98765 or customer name" className="!h-12" />
              {err.vehicle && <p className="mt-2 text-xs text-bad">{err.vehicle}</p>}
              {results.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {results.map((v) => (
                    <li key={v.id}>
                      <button type="button" onClick={() => pick(v)} className="neu-row flex w-full items-center gap-4 px-4 py-2.5 text-left">
                        <VehicleImage carKey={v.carKey} className="h-10 w-[72px] shrink-0" />
                        <span className="min-w-0"><span className="block truncate text-sm font-bold">{v.reg} · {vehicleName(v)}</span><span className="block truncate text-xs text-ink-400">{customerOf(db, v.customerId)?.name} · {customerOf(db, v.customerId)?.phone}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {q.trim() && results.length === 0 && <p className="mt-3 text-sm text-ink-500">No saved car found.</p>}
              <Button variant="blue" size="sm" className="mt-3" onClick={() => { setAdding(true); setNv({ ...nv, reg: /\d/.test(q) && /[a-z]/i.test(q) ? q.toUpperCase() : '' }); }}><UserPlus className="h-4 w-4" /> Add new customer and car</Button>
            </>
          )}
        </Part>

        <Part n={2} title="Why has the car come in?" hint="Choose all that apply">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {VISIT_REASONS.map((r) => <Tap key={r.key} on={reasons.includes(r.key)} onClick={() => tapReason(r.key)} className="!py-3 text-left"><span className="block font-semibold">{r.label}</span><span className="block text-xs font-normal text-ink-400">{r.hint}</span></Tap>)}
          </div>
          {err.reasons && <p className="mt-2 text-xs text-bad">{err.reasons}</p>}

          {reasons.some((r) => NEEDS_ISSUES.includes(r)) && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold">What does the customer notice?</h3>
              <div className="space-y-3">
                {ISSUE_GROUPS.map((g) => (
                  <div key={g.area}><p className="mb-1.5 text-xs font-medium text-ink-400">{g.area}</p><div className="flex flex-wrap gap-2">{g.issues.map((i) => <Tap key={i} on={issues.includes(i)} onClick={() => tapIssue(i)}>{i}</Tap>)}</div></div>
                ))}
              </div>
            </div>
          )}

          {reasons.includes('repeat') && pastJobs.length > 0 && (
            <Field label="Earlier job" className="mt-4"><Select value={repeatOf} onChange={(e) => setRepeatOf(e.target.value)}><option value="">Not sure</option>{pastJobs.map((j) => <option key={j.id} value={j.id}>#{j.id} · {j.service}</option>)}</Select></Field>
          )}

          <Field label="Customer's words (optional)" className="mt-4"><Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="e.g. Noise from front left when turning" className="!min-h-[64px]" /></Field>

          {reasons.includes('accident') && (
            <div className="neu-in-sm mt-4 p-4">
              <p className="mb-2 text-sm font-bold">Is the customer claiming insurance?</p>
              <div className="grid grid-cols-2 gap-2"><Tap on={claiming} onClick={() => setClaiming(true)}>Yes, insurance claim</Tap><Tap on={!claiming} onClick={() => setClaiming(false)}>No, customer pays</Tap></div>
              {claiming && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Insurer"><Select value={claim.insurer} onChange={(e) => setClaim({ ...claim, insurer: e.target.value })}>{INSURERS.map((i) => <option key={i}>{i}</option>)}</Select></Field>
                  <Field label="Claim type"><Select value={claim.type} onChange={(e) => setClaim({ ...claim, type: e.target.value as ClaimType })}><option>Cashless</option><option>Reimbursement</option></Select></Field>
                  <Field label="Policy number (can add later)"><Input value={claim.policyNo} onChange={(e) => setClaim({ ...claim, policyNo: e.target.value })} /></Field>
                  <Field label="Claim number (can add later)"><Input value={claim.claimNo} onChange={(e) => setClaim({ ...claim, claimNo: e.target.value })} /></Field>
                  <Field label="Accident date"><Input type="date" value={claim.accidentDate} max={TODAY_ISO} onChange={(e) => setClaim({ ...claim, accidentDate: e.target.value })} /></Field>
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold">Work the customer asked for <span className="font-normal text-ink-400">(optional)</span></h3>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATALOG.map((s) => {
                const on = work.some((w) => w.name === s.label);
                return <Tap key={s.label} on={on} onClick={() => addWork(s.label)}><span className="inline-flex items-center gap-1.5">{on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" />}{s.label}</span></Tap>;
              })}
            </div>
            {work.length > 0 && (
              <ul className="mt-3 space-y-2">
                {work.map((w) => (
                  <li key={w.name} className="neu-row flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.name}</span>
                    <Input aria-label={`${w.name} amount`} inputMode="numeric" className="!h-10 !w-[100px] text-right" value={w.amount} onChange={(e) => setWork(work.map((x) => (x.name === w.name ? { ...x, amount: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))} />
                    <button type="button" aria-label={`Remove ${w.name}`} onClick={() => addWork(w.name)} className="btn btn-neu h-10 w-10 shrink-0 !rounded-full text-bad"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
                <li className="flex justify-between px-3 pt-1 text-sm font-bold"><span>Approx. total with GST</span><span>{inr(totals.total)}</span></li>
              </ul>
            )}
          </div>
        </Part>

        <Part n={3} title="Record and confirm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Odometer (km) *" error={err.odometer}><Input inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="42500" /></Field>
            <Field label="Fuel level"><div className="grid grid-cols-5 gap-1.5">{FUEL_LEVELS.map((f) => <Tap key={f} on={fuel === f} onClick={() => setFuel(f)} className="!px-1 text-xs">{f}</Tap>)}</div></Field>
            <Field label="Brought in by"><div className="grid grid-cols-3 gap-1.5">{(['Owner', 'Driver', 'Towed in'] as BroughtBy[]).map((b) => <Tap key={b} on={broughtBy === b} onClick={() => { setBroughtBy(b); if (b !== 'Owner') setMethod('Phone'); }} className="!px-1">{b}</Tap>)}</div></Field>
            <DayPicker label="Promised delivery" value={due} onChange={setDue} todayIso={TODAY_ISO} />
            <Field label="Technician"><Select value={techId} onChange={(e) => setTechId(e.target.value)}>{techs.map((t) => <option key={t.id} value={t.id}>{t.name} · {load(t.id)} active jobs</option>)}</Select></Field>
            <Field label="Priority"><div className="grid grid-cols-2 gap-1.5"><Tap on={!urgent} onClick={() => setUrgent(false)}>Normal</Tap><Tap on={urgent} onClick={() => setUrgent(true)}>Urgent</Tap></div></Field>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink-500">Items in the car</p>
            <div className="flex flex-wrap gap-2">{BELONGINGS.map((b) => <Tap key={b} on={belongings.includes(b)} onClick={() => setBelongings(toggle(belongings, b))}>{b}</Tap>)}</div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink-500">Car photos</p>
            <div className="grid grid-cols-4 gap-2">
              {SIDES.map((s, i) => (
                <button key={s} type="button" aria-label={`Photo of ${s}`} onClick={() => setPhotos(photos.map((p, j) => (j === i ? (p ? '' : SAMPLE[i]) : p)))} className="neu-in-sm relative flex aspect-[4/3] flex-col items-center justify-center gap-1 overflow-hidden text-xs text-ink-500">
                  {photos[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[i]} alt={s} className="absolute inset-0 h-full w-full object-cover" />
                  ) : <><Camera className="h-5 w-5" />{s}</>}
                </button>
              ))}
            </div>
          </div>

          <div className={clsx('mt-5 rounded-2xl p-4 transition', approved ? 'bg-ok-soft ring-1 ring-ok/40' : 'neu-in-sm')}>
            <button type="button" role="checkbox" aria-checked={approved} onClick={() => setApproved(!approved)} className="flex w-full items-center gap-3 text-left">
              <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', approved ? 'bg-ok text-white' : 'neu-sm text-transparent')}><Check className="h-5 w-5" strokeWidth={3} /></span>
              <span><span className="block font-bold">Approved by client</span><span className="block text-sm text-ink-500">{insurance ? 'Client agrees to this claim and to the inspection' : work.length ? `Client agrees to inspection and ${work.length} ${work.length === 1 ? 'item' : 'items'}, about ${inr(totals.total)}` : 'Client agrees to the inspection'}</span></span>
            </button>
            {approved && <div className="mt-3 grid grid-cols-3 gap-1.5">{(['In person', 'Phone', 'WhatsApp'] as ApprovalMethod[]).map((m) => <Tap key={m} on={method === m} onClick={() => setMethod(m)} className="!px-1">{m}</Tap>)}</div>}
            {approved && <p className="mt-3 text-xs text-ink-600">Any new work found later goes to the client for approval first.</p>}
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
            <Button size="lg" variant="neu" onClick={() => router.push('/admin/jobs')}>Cancel</Button>
            <Button size="lg" onClick={submit}>Check in car</Button>
          </div>
        </Part>
      </div>
    </>
  );
}
