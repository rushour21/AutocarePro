'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  CircleGauge,
  Clock3,
  Cog,
  Disc3,
  Fan,
  MinusCircle,
  MoreVertical,
  PencilLine,
  Plus,
  Wrench,
  Zap,
  Sparkles,
} from 'lucide-react';
import { DamageDiagram, Legend, SelectedArea } from '@/components/inspection/Diagram';
import { Viewer3D } from '@/components/inspection/Viewer3D';
import { Avatar, inputCls } from '@/components/ui';
import { ASSET, job, serviceTypes } from '@/lib/data';

const STEPS = ['Customer & Vehicle', 'Complaint & Service', 'Initial Inspection', 'Review & Create'];
const SERVICE_ICONS: Record<string, React.ElementType> = {
  body: Car, general: Sparkles, ac: Fan, electrical: Zap, engine: Cog, suspension: Wrench, tyre: Disc3, other: MinusCircle,
};

function Stepper({ step, compact }: { step: number; compact?: boolean }) {
  const dot = (n: number) => {
    const done = n < step;
    const cur = n === step;
    return (
      <span
        className={clsx(
          'relative z-10 flex shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          compact ? 'h-8 w-8 text-sm' : 'h-6 w-6',
          done && 'bg-[#1fa25f] text-white',
          cur && 'bg-emp-blue text-white shadow-[0_0_0_4px_rgba(29,99,237,0.15)]',
          !done && !cur && 'bg-[#e4e7eb] text-white',
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n}
      </span>
    );
  };
  if (compact) {
    return (
      <div className="flex items-center gap-4 px-10">
        {STEPS.map((label, i) => (
          <div key={label} className={clsx('flex items-center gap-3', i < STEPS.length - 1 && 'flex-1')}>
            {dot(i + 1)}
            <span className={clsx('whitespace-nowrap text-sm', i + 1 === step ? 'font-medium text-emp-blue' : 'text-gray-600')}>{label}</span>
            {i < STEPS.length - 1 && <span className={clsx('h-px flex-1', i + 1 < step ? 'bg-[#43b77a]' : 'bg-[#e3e6ea]')} />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-start px-2">
      {STEPS.map((label, i) => (
        <div key={label} className="relative flex flex-1 flex-col items-center">
          {i < STEPS.length - 1 && (
            <span className={clsx('absolute left-1/2 top-[11px] h-[2px] w-full', i + 1 < step ? 'bg-[#43b77a]' : 'bg-[#e3e6ea]')} />
          )}
          {dot(i + 1)}
          <span className={clsx('mt-2 text-xs', i + 1 === step ? 'font-medium text-emp-blue' : 'text-gray-500')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Select({ value, options, onChange, className }: { value: string; options: string[]; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={clsx('relative', className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, 'appearance-none pr-8')}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <span className="mb-1.5 block text-xs text-gray-500">{children}</span>;

export default function CreateJobCard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [view3d, setView3d] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [f, setF] = useState({
    customer: 'Rahul Sharma – +91 98765 43210',
    name: job.customer.name,
    phone: job.customer.phone,
    email: job.customer.email,
    reg: job.vehicle.reg,
    brand: 'Honda',
    model: 'City',
    year: '2021',
    variant: 'VX',
    odometer: '28,450',
    fuel: 50,
    complaint: job.complaint,
    service: 'body',
    priority: 'High',
    date: '18 Dec 2024',
    time: '5:00 PM',
  });
  const [area, setArea] = useState({ type: 'Scratch', severity: 'Medium', notes: 'Front bumper scratched.\nWill need repainting.' });
  const [tab, setTab] = useState<'inspection' | 'photos'>('inspection');
  const [notify, setNotify] = useState(true);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF({ ...f, [k]: v });

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const footer = (
    <div className="mt-6 flex justify-end gap-3">
      {step === 1 ? (
        <Link href="/employee" className="flex h-10 w-[140px] items-center justify-center rounded-lg border border-emp-line bg-white text-sm font-medium shadow-card">
          Cancel
        </Link>
      ) : (
        <button onClick={back} className="flex h-10 w-[140px] items-center justify-center gap-2 rounded-lg border border-emp-line bg-white text-sm font-medium shadow-card">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <button onClick={next} className="flex h-10 w-[170px] items-center justify-center gap-2 rounded-lg bg-emp-blue text-sm font-medium text-white shadow-card">
        Next <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  // Step 3 in 3D: full-width inspection workspace (design: "Create Job Card – Step 3")
  if (step === 3 && view3d) {
    return (
      <div className="bg-[#fbfcfe] px-7 py-6">
        <header className="flex flex-wrap items-start gap-4">
          <div className="mr-auto">
            <h1 className="text-[26px] font-bold tracking-tight">
              Create Job Card <span className="font-normal">–</span> Step 3 <span className="font-normal">(Initial Inspection)</span>
            </h1>
            <p className="mt-1 text-[15px] text-gray-500">Mark existing damages on the 3D model and capture photos.</p>
          </div>
          <span className="mt-2 text-[15px] font-medium">Job #G-1024</span>
          <span className="mt-1.5 rounded-md bg-[#dff3e8] px-2.5 py-1 text-sm text-[#23824f]">Creating</span>
          <button onClick={() => router.push('/employee')} className="flex h-11 items-center gap-2 rounded-lg border border-emp-line bg-white px-5 text-sm font-medium shadow-card">
            <ArrowLeft className="h-4 w-4" /> Save &amp; Exit
          </button>
          <button onClick={next} className="flex h-11 items-center gap-2 rounded-lg bg-[#13263a] px-6 text-sm font-medium text-white shadow-card">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </header>
        <div className="mt-4 rounded-xl border border-[#e8ebf0] bg-white py-4 shadow-card">
          <Stepper step={3} compact />
        </div>
        <div className="mt-4">
          <Viewer3D
            toggle={
              <div className="flex rounded-lg border border-[#e6e9ee] p-0.5">
                <button onClick={() => setView3d(false)} className="h-9 w-[132px] rounded-md text-sm font-medium text-gray-700">
                  2D View
                </button>
                <button className="h-9 w-[132px] rounded-md bg-[#13263a] text-sm font-medium text-white">3D View</button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="max-w-[1080px] rounded-2xl border border-emp-line bg-white p-7 shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight">Create Job Card</h1>
          {step >= 3 && <MoreVertical className="h-5 w-5 text-gray-600" />}
        </div>
        <div className="mt-5 border-b border-emp-line pb-4">
          <Stepper step={step} />
        </div>

        {step === 1 && (
          <>
            <h2 className="mt-5 text-[15px] font-semibold">Customer Information</h2>
            <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#f4f6f9] p-1 text-sm">
              {(['existing', 'new'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={clsx('h-9 rounded-md', mode === m ? 'border-b-2 border-emp-blue bg-white font-medium text-emp-blue shadow-card' : 'text-gray-600')}
                >
                  {m === 'existing' ? 'Existing Customer' : 'New Customer'}
                </button>
              ))}
            </div>
            {mode === 'existing' && (
              <div className="mt-5 flex items-end gap-6">
                <label className="flex-1">
                  <Label>Select Customer</Label>
                  <Select value={f.customer} options={['Rahul Sharma – +91 98765 43210', 'Priya Patel – +91 98220 11223', 'Amit Singh – +91 99870 44556']} onChange={set('customer')} />
                </label>
                <button onClick={() => setMode('new')} className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-emp-blue">
                  <Plus className="h-4 w-4" /> Add New Customer
                </button>
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-4">
              <label>
                <Label>Customer Name</Label>
                <input value={f.name} onChange={(e) => set('name')(e.target.value)} className={inputCls} />
              </label>
              <label>
                <Label>Phone Number</Label>
                <input value={f.phone} onChange={(e) => set('phone')(e.target.value)} className={inputCls} />
              </label>
              <label>
                <Label>Email (Optional)</Label>
                <input value={f.email} onChange={(e) => set('email')(e.target.value)} className={inputCls} />
              </label>
            </div>

            <h2 className="mt-7 text-[15px] font-semibold">Vehicle Information</h2>
            <div className="mt-3 grid grid-cols-[1.6fr_1.2fr_1.6fr_0.9fr_0.9fr] gap-4">
              <label>
                <Label>Registration Number</Label>
                <input value={f.reg} onChange={(e) => set('reg')(e.target.value)} className={inputCls} />
              </label>
              <label>
                <Label>Brand</Label>
                <Select value={f.brand} options={['Honda', 'Hyundai', 'Maruti Suzuki', 'Tata']} onChange={set('brand')} />
              </label>
              <label>
                <Label>Model</Label>
                <Select value={f.model} options={['City', 'Amaze', 'Elevate']} onChange={set('model')} />
              </label>
              <label>
                <Label>Year</Label>
                <Select value={f.year} options={['2024', '2023', '2022', '2021', '2020']} onChange={set('year')} />
              </label>
              <label>
                <Label>Variant</Label>
                <Select value={f.variant} options={['V', 'VX', 'ZX']} onChange={set('variant')} />
              </label>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_2fr_1.6fr] items-end gap-6">
              <label>
                <Label>Odometer (Optional)</Label>
                <div className={clsx(inputCls, 'flex items-center')}>
                  <input value={f.odometer} onChange={(e) => set('odometer')(e.target.value)} className="w-full bg-transparent outline-none" />
                  <span className="text-sm text-gray-500">km</span>
                </div>
              </label>
              <label>
                <Label>Fuel Level</Label>
                <div className="flex h-10 items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={f.fuel}
                    onChange={(e) => set('fuel')(+e.target.value)}
                    className="fuel w-full"
                    style={{ ['--fill' as string]: '#0f5e66', ['--pct' as string]: `${f.fuel}%` }}
                  />
                  <span className="w-10 text-sm text-gray-500">{f.fuel}%</span>
                </div>
              </label>
              <div className="flex h-[88px] items-center justify-center rounded-xl bg-[#f3f5f8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.vehicle.image} alt="Vehicle" className="h-[78px] object-contain" />
              </div>
            </div>
            {footer}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mt-5 text-[15px] font-semibold">Customer Complaint</h2>
            <textarea
              value={f.complaint}
              maxLength={500}
              onChange={(e) => set('complaint')(e.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-[#e3e5e8] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#9db7f5]"
            />
            <p className="text-right text-xs text-gray-400">{f.complaint.length}/500</p>

            <h2 className="mt-2 text-[15px] font-semibold">Service Type</h2>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {serviceTypes.map((s) => {
                const Icon = SERVICE_ICONS[s.key];
                const on = f.service === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => set('service')(s.key)}
                    className={clsx(
                      'flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border text-sm transition',
                      on ? 'border-[#8fb0f5] bg-[#f1f6ff] text-emp-blue' : 'border-emp-line bg-white text-gray-600 hover:border-gray-300',
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-[15px] font-semibold">Priority</h2>
                <div className="mt-3 flex gap-3">
                  {[
                    { k: 'Low', c: '#1fa25f' },
                    { k: 'Medium', c: '#f5a524' },
                    { k: 'High', c: '#e5484d' },
                  ].map(({ k, c }) => (
                    <button
                      key={k}
                      onClick={() => set('priority')(k)}
                      className={clsx('flex h-10 items-center gap-2 rounded-lg border px-4 text-sm', f.priority === k ? 'border-[#f2a3a3] bg-[#fdecec] text-[#e5484d]' : 'border-emp-line text-gray-600')}
                      style={f.priority === k ? { borderColor: `${c}88`, background: `${c}14`, color: c } : undefined}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 0 3px ${c}33` }} />
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold">Expected Delivery Date</h2>
                <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">
                  <div className={clsx(inputCls, 'flex items-center gap-2')}>
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <input value={f.date} onChange={(e) => set('date')(e.target.value)} className="w-full bg-transparent outline-none" />
                  </div>
                  <div className={clsx(inputCls, 'flex items-center gap-2')}>
                    <Clock3 className="h-4 w-4 text-gray-500" />
                    <input value={f.time} onChange={(e) => set('time')(e.target.value)} className="w-full bg-transparent outline-none" />
                  </div>
                </div>
              </div>
            </div>
            {footer}
          </>
        )}

        {step === 3 && (
          <>
            <div className="mt-4 flex gap-6 border-b border-emp-line">
              {(['inspection', 'photos'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx('-mb-px border-b-2 pb-2.5 text-sm', tab === t ? 'border-emp-blue font-medium text-emp-blue' : 'border-transparent text-gray-500')}
                >
                  {t === 'inspection' ? 'Vehicle Inspection' : 'Photos'}
                </button>
              ))}
            </div>
            {tab === 'inspection' ? (
              <div className="mt-4 grid grid-cols-[1fr_300px] gap-6">
                <div>
                  <div className="flex gap-2">
                    <button className="h-10 w-[120px] rounded-lg bg-[#13263a] text-sm font-medium text-white">2D View</button>
                    <button onClick={() => setView3d(true)} className="h-10 w-[120px] rounded-lg border border-emp-line text-sm font-medium text-gray-700">
                      3D View
                    </button>
                  </div>
                  <DamageDiagram src={ASSET('diagram-e3.png')} aspect="242 / 148" markers={[]} className="mt-4 w-full" />
                  <Legend className="mt-6" />
                </div>
                <SelectedArea
                  photo={ASSET('sel-area.png')}
                  thumbs={[ASSET('e3-thumb-1.png'), ASSET('e3-thumb-2.png')]}
                  {...area}
                  onChange={(p) => setArea({ ...area, ...p })}
                />
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-4 gap-3">
                {['ephoto-1', 'ephoto-2', 'ephoto-3', 'ephoto-4', 'ephoto-5'].map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={ASSET(`${p}.png`)} alt="" className="aspect-[3/2] w-full rounded-lg object-cover" />
                ))}
                <button className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#b9cdf5] bg-[#f6f9ff] text-sm font-medium text-emp-blue">
                  <Plus className="h-5 w-5" /> Add Photos
                </button>
              </div>
            )}
            {footer}
          </>
        )}

        {step === 4 && (
          <>
            <div className="mt-5 grid grid-cols-[1fr_1fr] gap-6">
              <div className="space-y-5">
                <section className="rounded-xl border border-emp-line p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold">Customer &amp; Vehicle</h3>
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-emp-blue">
                      <PencilLine className="h-4 w-4" /> Edit
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Avatar src={job.customer.avatar} size={52} />
                    <div className="text-sm">
                      <p className="font-semibold">{f.name}</p>
                      <p className="text-gray-500">{f.phone}</p>
                      <p className="text-gray-500">{f.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={job.vehicle.image} alt="" className="w-[140px] object-contain" />
                    <div className="text-sm">
                      <p className="font-semibold">
                        {f.brand} {f.model} {f.year}
                      </p>
                      <p className="text-gray-600">{f.reg}</p>
                      <p className="text-gray-600">{f.odometer} km</p>
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-emp-line p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold">Complaint &amp; Service</h3>
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-emp-blue">
                      <PencilLine className="h-4 w-4" /> Edit
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">{f.complaint}</p>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li className="flex items-center gap-3">
                      <Car className="h-4 w-4" /> {serviceTypes.find((s) => s.key === f.service)?.label}
                    </li>
                    <li className="flex items-center gap-3">
                      <CircleGauge className="h-4 w-4" /> Priority: {f.priority}
                    </li>
                    <li className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4" /> Expected Delivery: {f.date}, {f.time}
                    </li>
                  </ul>
                </section>
              </div>
              <section className="rounded-xl border border-emp-line p-5">
                <h3 className="text-[15px] font-semibold">Initial Inspection</h3>
                <DamageDiagram src={ASSET('diagram-e4.png')} aspect="181 / 109" markers={[]} className="mt-3 w-full" />
                <Legend className="mt-4 gap-x-5 text-xs" />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {['e4-photo-1', 'e4-photo-2', 'e4-photo-3'].map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p} src={ASSET(`${p}.png`)} alt="" className="aspect-[1.15] w-full rounded-lg object-cover" />
                  ))}
                  <button className="flex aspect-[1.15] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#b9cdf5] bg-[#f6f9ff] text-xs text-emp-blue">
                    <Plus className="h-4 w-4" /> +4 more
                  </button>
                </div>
              </section>
            </div>
            <div className="mt-6 flex items-center justify-end gap-6">
              <label className="flex items-center gap-2.5 text-sm text-gray-700">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-emp-blue" />
                Notify customer with tracking link
              </label>
              <button onClick={back} className="flex h-11 items-center gap-2 rounded-lg border border-emp-line px-5 text-sm font-medium">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => router.push('/employee/jobs/G-1024')}
                className="h-11 rounded-lg bg-[#13263a] px-7 text-sm font-medium text-white shadow-card"
              >
                Create Job Card
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
