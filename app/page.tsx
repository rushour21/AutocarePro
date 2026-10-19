'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Eye, FileCheck2, Mail, MapPin, Menu, Phone, ScanSearch, X } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui';
import { useDb } from '@/lib/store';

const SERVICES = [
  { key: 'car-service', label: 'Car Service' }, { key: 'repairs', label: 'Repairs' }, { key: 'diagnostics', label: 'Diagnostics' },
  { key: 'modifications', label: 'Modifications' }, { key: 'detailing', label: 'Detailing' }, { key: 'accessories', label: 'Accessories' },
];
const NAV = [['Services', '#services'], ['About', '#about'], ['Why Us', '#why'], ['Gallery', '#gallery'], ['Contact', '#contact']];
// Marketing figures below are placeholders copied from the design; replace with your own before launch.
const STATS = [{ k: '4.9/5', l: 'Customer Rating', icon: '⭐' }, { k: '10K+', l: 'Vehicles Serviced', icon: '🚗' }, { k: '5+ Years', l: 'Of Excellence', icon: '🏆' }];

export default function LandingPage() {
  const db = useDb();
  const [menu, setMenu] = useState(false);
  const g = db.garage;
  return (
    <div className="mx-auto max-w-[1320px] p-3 sm:p-5">
      <div className="neu relative overflow-hidden !rounded-[30px]">
        <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-9">
          <Link href="/" aria-label="AutoHub home"><Logo /></Link>
          <nav className="hidden items-center gap-9 text-[14px] font-medium text-ink-700 lg:flex" aria-label="Site">
            {NAV.map(([l, h]) => <a key={l} href={h} className="hover:text-coral-600">{l}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="neu" href="/login" className="hidden sm:inline-flex">Login</Button>
            <Button href="/customer/bookings/new" className="hidden sm:inline-flex">Book Service</Button>
            <button aria-label="Menu" onClick={() => setMenu(!menu)} className="btn btn-neu h-11 w-11 !rounded-xl lg:hidden">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </header>
        {menu && (
          <nav className="slide-up mx-5 mb-3 flex flex-col gap-1 rounded-2xl bg-white/60 p-3 lg:hidden" aria-label="Mobile site">
            {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)} className="rounded-xl px-4 py-3 text-sm font-medium">{l}</a>)}
            <Link href="/login" className="rounded-xl px-4 py-3 text-sm font-medium">Login</Link>
            <Link href="/customer/bookings/new" className="rounded-xl bg-coral-100 px-4 py-3 text-sm font-semibold text-coral-600">Book Service</Link>
          </nav>
        )}

        <section id="about" className="relative grid items-center gap-6 px-5 pb-8 pt-6 sm:px-9 lg:grid-cols-[1fr_1.2fr] lg:pt-10">
          <div className="relative z-10">
            <p className="mb-5 text-sm text-ink-400">Trusted garage care</p>
            <h1 className="text-[44px] font-extrabold leading-[1.04] tracking-tight sm:text-[58px] lg:text-[68px]">Premium<br />Car Care<br />Made Simple</h1>
            <p className="mt-6 text-[17px] font-semibold text-coral-600">Service <span className="mx-1">•</span> Maintenance <span className="mx-1">•</span> Modifications</p>
            <p className="mt-1 text-[17px] text-ink-600">All in one place.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" href="/customer/bookings/new" className="min-w-[190px]">Book a Service <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="neu" href="#services">Explore Services</Button>
            </div>
          </div>
          <div className="relative -mx-5 min-h-[260px] sm:mx-0 lg:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/photos/hero.jpg" alt="Premium sedan in the AutoHub showroom" className="absolute inset-0 h-full w-full object-cover object-right [mask-image:linear-gradient(to_right,transparent,#000_28%)]" />
          </div>
        </section>

        <section className="grid gap-4 px-5 pb-6 sm:grid-cols-3 sm:px-9" aria-label="Highlights">
          {STATS.map((s) => (
            <div key={s.k} className="neu-sm flex items-center gap-4 px-5 py-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-xl">{s.icon}</span>
              <div><p className="text-xl font-bold leading-tight">{s.k}</p><p className="text-sm text-ink-500">{s.l}</p></div>
            </div>
          ))}
        </section>

        <section id="services" className="grid grid-cols-2 gap-4 px-5 pb-8 sm:grid-cols-3 sm:px-9 lg:grid-cols-6" aria-label="Services">
          {SERVICES.map((s) => (
            <Link key={s.key} href={`/customer/bookings/new?service=${encodeURIComponent(s.label)}`} className="neu-sm flex flex-col items-center gap-3 !rounded-[22px] px-3 py-5 text-center text-sm font-medium transition hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/icons/${s.key}.png`} alt="" className="blend-multiply h-16 w-20 object-contain" />
              {s.label}
            </Link>
          ))}
        </section>
      </div>

      <section id="why" className="mt-6 grid gap-5 md:grid-cols-3">
        {[{ icon: Eye, t: 'Live job tracking', d: 'Follow your vehicle through inspection, repair and quality check in real time.' }, { icon: FileCheck2, t: 'Transparent estimates', d: 'Review every line item and approve or reject the quote from your phone.' }, { icon: ScanSearch, t: 'Inspection with photos', d: 'See exactly what our technicians found, marked on your vehicle with photos.' }].map(({ icon: Icon, t, d }) => (
          <div key={t} className="neu p-6"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-500"><Icon className="h-6 w-6" /></span><h2 className="text-lg font-bold">{t}</h2><p className="mt-1.5 text-sm leading-6 text-ink-600">{d}</p></div>
        ))}
      </section>

      <section id="gallery" className="neu mt-6 p-6 sm:p-8">
        <h2 className="mb-4 text-xl font-bold">From our workshop</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {['workshop-e01', 'garage-1', 'estimate-disc'].map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={`/assets/photos/${n}.jpg`} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-neu-sm" />
          ))}
        </div>
      </section>

      <footer id="contact" className="neu mt-6 flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
        <div><Logo /><p className="mt-2 text-sm text-ink-500">{g.name}</p></div>
        <ul className="space-y-2 text-sm text-ink-700">
          <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-coral-500" /> {g.address}</li>
          <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-coral-500" /> <a href={`tel:${g.phone.replace(/\s/g, '')}`}>{g.phone}</a></li>
          <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-coral-500" /> <a href={`mailto:${g.email}`}>{g.email}</a></li>
        </ul>
        <div className="flex gap-3"><Button variant="neu" href="/login">Login</Button><Button href="/customer/bookings/new">Book a Service</Button></div>
      </footer>
    </div>
  );
}
