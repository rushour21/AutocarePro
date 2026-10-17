'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Car, CalendarDays, Check, ClipboardCheck, FileText, ImageIcon, List, Menu, Phone, RefreshCw, Wrench, X } from 'lucide-react';
import { CustomerLogo } from '@/components/Logo';
import { HStepper } from '@/components/ui';
import { ASSET, customerTimeline, job, mobileTimeline } from '@/lib/data';

const MOBILE_ICONS = [Car, ClipboardCheck, FileText, Wrench];

export default function TrackingOverview() {
  const p = useParams<{ code: string }>();
  const base = `/track/${decodeURIComponent(p.code)}`;
  const [menu, setMenu] = useState(false);

  const links = [
    { title: 'Vehicle Inspection', sub: 'View damage report', icon: Car, href: `${base}/inspection` },
    { title: 'Estimate & Approval', sub: 'View estimate details', icon: FileText, href: `${base}/estimate` },
    { title: 'Photos', sub: 'See latest updates', icon: ImageIcon, href: `${base}/photos` },
    { title: 'Service Details', sub: 'Job information', icon: List, href: `${base}/summary` },
  ];

  return (
    <>
      {/* ---------------- desktop ---------------- */}
      <div className="hidden min-h-screen md:block">
        <header className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-5">
          <CustomerLogo size="lg" />
          <div className="flex items-center gap-10 text-sm text-gray-700">
            <span>Need Help?</span>
            <a href="tel:+919876543210" className="flex items-center gap-2 font-medium">
              <Phone className="h-4 w-4 fill-current" /> +91 98765 43210
            </a>
          </div>
        </header>

        <section className="relative mx-auto max-w-[1240px] overflow-hidden rounded-none bg-[#111818] md:rounded-xl">
          <div className="relative flex h-[330px] items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET('banner-car.jpg')} alt="" className="absolute right-0 top-0 h-full w-[60%] object-cover object-left" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111818] via-[#111818]/85 via-45% to-transparent" />
            <div className="relative px-14 pb-10">
              <h1 className="font-serif text-[54px] font-medium leading-[1.08] text-white">
                Your Vehicle
                <br />
                Service Progress
              </h1>
              <p className="mt-4 text-lg text-white/85">Live updates from AutoCare Garage</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2f8a5b] px-4 py-1.5 text-sm font-medium text-white">
                <RefreshCw className="h-3.5 w-3.5" /> In Progress
              </span>
            </div>
          </div>
        </section>

        <div className="relative mx-auto -mt-12 max-w-[1180px] px-8">
          <div className="rounded-2xl bg-cust-card px-8 py-7 shadow-pop">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex h-[110px] w-[180px] items-center justify-center rounded-xl bg-[#f1efea]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={job.vehicle.image} alt="" className="h-[86px] object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{job.vehicle.name}</p>
                  <p className="mt-1.5 text-[15px] text-gray-600">
                    {job.vehicle.reg} &nbsp;·&nbsp; Job #{job.id}
                  </p>
                  <p className="mt-1.5 text-[15px] text-gray-600">{job.serviceType}</p>
                </div>
              </div>
              <div className="border-l border-cust-line pl-8">
                <p className="text-sm text-gray-500">Expected Completion</p>
                <div className="mt-2 flex items-center gap-4">
                  <CalendarDays className="h-7 w-7 text-gray-800" strokeWidth={1.6} />
                  <p className="text-xl font-semibold leading-7">
                    {job.expectedDate}
                    <br />
                    {job.expectedTime}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <HStepper steps={customerTimeline} labelTone="plain" accent="#1f9d63" current="#1d63ed" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-5 pb-12">
            {links.map(({ title, sub, icon: Icon, href }) => (
              <Link key={title} href={href} className="rounded-2xl bg-cust-card p-6 shadow-card transition hover:shadow-pop">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#efede8]">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <p className="mt-8 text-[17px] font-medium">{title}</p>
                <p className="mt-1 text-sm text-gray-500">{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- mobile ---------------- */}
      <div className="min-h-screen px-4 pb-8 pt-4 md:hidden">
        <header className="flex items-center justify-between">
          <CustomerLogo />
          <button onClick={() => setMenu(!menu)} aria-label="Menu" className="p-1">
            {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>
        {menu && (
          <nav className="mt-3 space-y-1 rounded-xl bg-white p-2 shadow-pop">
            {links.map((l) => (
              <Link key={l.title} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm">
                {l.title}
              </Link>
            ))}
          </nav>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET('mobile-hero.png')} alt="" className="mt-4 aspect-[192/72] w-full rounded-xl object-cover" />
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xl font-semibold">{job.vehicle.name}</p>
          <span className="rounded-md bg-ok-bg px-2.5 py-1 text-xs font-medium text-ok-fg">In Progress</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {job.vehicle.reg} &nbsp;·&nbsp; #{job.id}
        </p>
        <p className="mt-1 text-sm text-gray-600">{job.serviceType}</p>

        <ol className="mt-6">
          {mobileTimeline.map((s, i) => {
            const Icon = MOBILE_ICONS[i];
            const last = i === mobileTimeline.length - 1;
            return (
              <li key={s.label} className="relative flex gap-4 pb-5 last:pb-0">
                {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-[3px]" style={{ background: s.state === 'done' ? '#28a464' : '#d6d9dc' }} />}
                <span
                  className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: s.state === 'done' ? '#28a464' : s.state === 'current' ? '#1d63ed' : '#fff',
                    border: s.state === 'pending' ? '4px solid #d4d7db' : 'none',
                  }}
                >
                  {s.state !== 'pending' && Icon && <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />}
                  {s.state === 'done' && !Icon && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <div>
                  <p className={s.state === 'current' ? 'font-medium text-[#1d4fbf]' : s.state === 'pending' ? 'text-gray-600' : 'font-medium'}>{s.label}</p>
                  <p className={s.state === 'current' ? 'text-sm text-[#1d63ed]' : 'text-sm text-gray-400'}>{s.time}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 rounded-xl border border-cust-line bg-white px-5 py-4">
          <p className="text-center text-sm text-gray-500">Expected Completion</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <CalendarDays className="h-7 w-7" strokeWidth={1.6} />
            <p className="text-lg font-semibold leading-6">
              {job.expectedDate}
              <br />
              {job.expectedTime}
            </p>
          </div>
        </div>
        <Link href={`${base}/progress`} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#26353a] font-medium text-white">
          View Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
