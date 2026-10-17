'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronDown, ImageUp, MoreVertical, Plus } from 'lucide-react';
import { Field, inputCls } from '@/components/ui';
import { job, serviceTypes, severities } from '@/lib/data';

const SECTIONS = ['Customer & Vehicle', 'Service Details', 'Initial Inspection (Damage & Photos)', 'Assign & Schedule'];

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, 'appearance-none pr-9')}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

export default function NewJobCardPage() {
  const router = useRouter();
  const [open, setOpen] = useState(0);
  const [form, setForm] = useState({
    customer: '',
    phone: job.customer.phone,
    vehicle: job.vehicle.reg,
    brand: 'Honda',
    model: 'City',
    year: '2021',
    odometer: '28,450 km',
    fuel: 50,
    complaint: '',
    service: 'Body Repair',
    priority: 'Medium',
    mechanic: 'Sandeep Kumar',
    advisor: 'Amit Patil',
    date: '2024-12-18',
  });
  const set = (k: keyof typeof form) => (v: string | number) => setForm({ ...form, [k]: v });

  return (
    <div className="px-8 py-7">
      <div className="max-w-[760px] rounded-xl border border-admin-line bg-admin-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-bold tracking-tight">New Job Card</h1>
          <button className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100" aria-label="More">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {SECTIONS.map((title, i) => (
            <section key={title}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center gap-3 rounded-lg bg-[#f4f3f0] px-3 py-2.5 text-left"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-[15px] font-semibold">{title}</span>
              </button>

              {open === i && i === 0 && (
                <div className="grid grid-cols-[1fr_1fr_1.15fr] gap-x-4 gap-y-5 px-3 pb-2 pt-5">
                  <Field label="Customer" required className="col-span-2">
                    <div className={clsx(inputCls, 'flex items-center justify-between')}>
                      <input
                        value={form.customer}
                        onChange={(e) => set('customer')(e.target.value)}
                        placeholder="Select or add customer"
                        className="w-full bg-transparent outline-none placeholder:text-gray-500"
                      />
                      <button type="button" className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#2f6fed]">
                        <Plus className="h-3 w-3" /> Add New
                      </button>
                    </div>
                  </Field>
                  <Field label="Phone">
                    <input value={form.phone} onChange={(e) => set('phone')(e.target.value)} className={inputCls} />
                  </Field>

                  <Field label="Vehicle Number" required>
                    <input value={form.vehicle} onChange={(e) => set('vehicle')(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Brand" required>
                    <Select value={form.brand} options={['Honda', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Mahindra']} onChange={set('brand')} />
                  </Field>
                  <div className="row-span-2 flex flex-col items-center justify-end gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={job.vehicle.image} alt="Vehicle" className="w-[88%] object-contain" />
                    <button className="flex h-10 items-center gap-2 rounded-lg border border-admin-line bg-white px-5 text-sm font-medium shadow-card">
                      <ImageUp className="h-4 w-4" /> Upload Photos
                    </button>
                  </div>
                  <Field label="Model">
                    <Select value={form.model} options={['City', 'Amaze', 'Elevate']} onChange={set('model')} />
                  </Field>
                  <Field label="Year">
                    <Select value={form.year} options={['2024', '2023', '2022', '2021', '2020']} onChange={set('year')} />
                  </Field>

                  <Field label="Current Odometer">
                    <input value={form.odometer} onChange={(e) => set('odometer')(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Fuel Level" className="col-span-2">
                    <div className="flex h-10 items-center gap-6">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={form.fuel}
                        onChange={(e) => set('fuel')(+e.target.value)}
                        className="fuel w-full"
                        style={{ ['--fill' as string]: '#1f5e57', ['--pct' as string]: `${form.fuel}%` }}
                      />
                      <span className="w-10 text-right text-sm text-gray-600">{form.fuel}%</span>
                    </div>
                  </Field>
                </div>
              )}

              {open === i && i === 1 && (
                <div className="grid grid-cols-2 gap-4 px-3 pb-2 pt-5">
                  <Field label="Customer Complaint" className="col-span-2">
                    <textarea
                      value={form.complaint}
                      onChange={(e) => set('complaint')(e.target.value)}
                      rows={3}
                      placeholder={job.complaint}
                      className={clsx(inputCls, 'h-auto py-2.5')}
                    />
                  </Field>
                  <Field label="Service Type">
                    <Select value={form.service} options={serviceTypes.map((s) => s.label)} onChange={set('service')} />
                  </Field>
                  <Field label="Priority">
                    <Select value={form.priority} options={severities} onChange={set('priority')} />
                  </Field>
                </div>
              )}

              {open === i && i === 2 && (
                <div className="flex items-center justify-between gap-4 px-3 pb-2 pt-5 text-sm text-gray-600">
                  <p>Mark existing damage on the vehicle diagram and attach photos.</p>
                  <button
                    onClick={() => router.push('/admin/job-cards/G-1024/inspection')}
                    className="h-10 shrink-0 rounded-lg border border-admin-line bg-white px-5 font-medium text-gray-800 shadow-card"
                  >
                    Open Inspection
                  </button>
                </div>
              )}

              {open === i && i === 3 && (
                <div className="grid grid-cols-3 gap-4 px-3 pb-2 pt-5">
                  <Field label="Mechanic">
                    <Select value={form.mechanic} options={['Sandeep Kumar', 'Ramesh', 'Vikram', 'Shankar']} onChange={set('mechanic')} />
                  </Field>
                  <Field label="Service Advisor">
                    <Select value={form.advisor} options={['Amit Patil', 'Rajesh Sharma']} onChange={set('advisor')} />
                  </Field>
                  <Field label="Expected Delivery">
                    <input type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="h-11 rounded-lg border border-admin-line bg-white px-6 text-sm font-medium shadow-card">Save as Draft</button>
          <button
            onClick={() => router.push('/admin/job-cards/G-1024')}
            className="h-11 rounded-lg bg-admin-btn px-7 text-sm font-medium text-white shadow-card"
          >
            Create Job Card
          </button>
        </div>
      </div>
    </div>
  );
}
