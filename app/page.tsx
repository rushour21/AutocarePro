'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BadgeCheck, Car, Check, ClipboardCheck, Cog, Eye, FileCheck2, Mail, MapPin, Menu, Paintbrush, Phone, ScanSearch, Search, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui';
import { useDb } from '@/lib/store';

const SERVICES = [
  { label: 'Car Service', text: 'Periodic service and oil changes', icon: Car },
  { label: 'Repairs', text: 'Engine, brakes and suspension', icon: Wrench },
  { label: 'Diagnostics', text: 'Scans for warning lights and faults', icon: Search },
  { label: 'Modifications', text: 'Upgrades fitted the right way', icon: Cog },
  { label: 'Detailing', text: 'Wash, polish and paint protection', icon: Sparkles },
  { label: 'Accessories', text: 'Parts and accessories for your car', icon: Paintbrush },
];
const NAV = [['Services', '#services'], ['How It Works', '#how'], ['Why Us', '#why'], ['Contact', '#contact']];
// Marketing figures below are placeholders copied from the design; replace with your own before launch.
const STATS = [{ k: '4.9/5', l: 'Customer rating' }, { k: '10K+', l: 'Vehicles serviced' }, { k: '5+ Years', l: 'Of excellence' }];
const STEPS = [
  { t: 'Check in', d: 'We record your complaint, the odometer, fuel and the car’s condition.', icon: ClipboardCheck },
  { t: 'Inspect', d: 'A technician inspects the car and documents every issue with photos.', icon: ScanSearch },
  { t: 'You approve', d: 'Approve or decline each item from your phone. Nothing starts without you.', icon: FileCheck2 },
  { t: 'Drive away', d: 'After repair and a quality check, you get your report and invoice.', icon: BadgeCheck },
];
const WHY = [
  { t: 'Track every step', d: 'Follow your car through inspection, repair and quality check.', icon: Eye },
  { t: 'Clear estimates', d: 'See every item and price before any work begins.', icon: FileCheck2 },
  { t: 'Photo proof', d: 'Before and after photos show exactly what was done.', icon: ScanSearch },
  { t: 'Insurance support', d: 'We handle cashless and reimbursement claims with you.', icon: ShieldCheck },
];

export default function LandingPage() {
  const db = useDb();
  const [menu, setMenu] = useState(false);
  const g = db.garage;
  return (
    <div>
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="AutoHub home"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-[14px] font-medium text-ink-700 lg:flex" aria-label="Site">
            {NAV.map(([l, h]) => <a key={l} href={h} className="transition-colors hover:text-coral-600">{l}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="neu" href="/login" className="hidden sm:inline-flex">Login</Button>
            <Button href="/customer/bookings/new" className="hidden sm:inline-flex">Book Service</Button>
            <button aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className="btn btn-neu h-11 w-11 !rounded-xl lg:hidden">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {menu && (
          <nav className="slide-up mx-4 mb-3 flex flex-col gap-1 rounded-2xl bg-white/70 p-3 lg:hidden" aria-label="Mobile site">
            {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)} className="rounded-xl px-4 py-3 text-sm font-medium">{l}</a>)}
            <Link href="/login" className="rounded-xl px-4 py-3 text-sm font-medium">Login</Link>
            <Link href="/customer/bookings/new" className="rounded-xl bg-coral-100 px-4 py-3 text-sm font-semibold text-coral-600">Book Service</Link>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <section className="grid items-center gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-14" aria-label="Introduction">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral-100 px-3.5 py-1.5 text-[13px] font-semibold text-coral-600"><ShieldCheck className="h-4 w-4" /> Trusted garage care</p>
            <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px] lg:text-[64px]">Premium car care, <span className="text-coral-500">made simple.</span></h1>
            <p className="mt-5 max-w-[500px] text-[17px] leading-7 text-ink-600">Service, repairs and modifications in one place. See the work, approve every price and track your car from your phone.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" href="/customer/bookings/new" className="min-w-[180px]">Book a Service <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="neu" href="#services">Explore Services</Button>
            </div>
            <dl className="mt-8 grid max-w-[500px] grid-cols-3 gap-3 border-t border-ink/10 pt-5">
              {STATS.map((s) => <div key={s.k}><dd className="text-[20px] font-bold leading-tight sm:text-[22px]">{s.k}</dd><dt className="text-xs text-ink-500 sm:text-[13px]">{s.l}</dt></div>)}
            </dl>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/photos/hero-2x.jpg" width={2128} height={1454} alt="Silver sedan in the AutoHub showroom" className="aspect-[7/5] h-auto w-full rounded-[28px] object-cover shadow-[0_24px_60px_rgba(60,68,84,0.22)]" />
            <div className="glass absolute left-3 top-3 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 sm:left-5 sm:top-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ok text-white"><Check className="h-5 w-5" strokeWidth={3} /></span>
              <span><span className="block text-sm font-bold">Ready for delivery</span><span className="block text-xs text-ink-500">Quality check passed</span></span>
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 py-8 lg:py-12">
          <p className="text-sm font-semibold text-coral-600">Services</p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">Everything your car needs</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ label, text, icon: Icon }) => (
              <Link key={label} href={`/customer/bookings/new?service=${encodeURIComponent(label)}`} className="neu group flex items-center gap-4 !rounded-[20px] p-4 transition hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-500"><Icon className="h-6 w-6" strokeWidth={1.8} /></span>
                <span className="min-w-0 flex-1"><span className="block font-bold">{label}</span><span className="block text-sm text-ink-500">{text}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-coral-500" />
              </Link>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24 py-8 lg:py-12">
          <p className="text-sm font-semibold text-coral-600">How it works</p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">From check-in to delivery</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ t, d, icon: Icon }, i) => (
              <li key={t} className="neu !rounded-[20px] p-5">
                <div className="mb-4 flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"><Icon className="h-5 w-5" strokeWidth={1.8} /></span><span className="text-[28px] font-extrabold text-ink/10">0{i + 1}</span></div>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-600">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="why" className="scroll-mt-24 py-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-coral-600">Why AutoHub</p>
              <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">No surprises. Just honest work.</h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {WHY.map(({ t, d, icon: Icon }) => <li key={t}><Icon className="mb-2 h-6 w-6 text-coral-500" strokeWidth={1.8} /><h3 className="font-bold">{t}</h3><p className="mt-0.5 text-sm leading-6 text-ink-600">{d}</p></li>)}
              </ul>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/share/live-main.jpg" alt="Car being serviced in the AutoHub workshop" className="aspect-[3/2] w-full rounded-[24px] object-cover shadow-neu-sm" />
          </div>
        </section>

        <section className="my-8 flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-ink p-6 text-white sm:p-10" aria-label="Book a service">
          <div><h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">Ready to book your car in?</h2><p className="mt-1 text-white/70">Pick a service and a time that works for you.</p></div>
          <Button size="lg" href="/customer/bookings/new">Book a Service <ArrowRight className="h-4 w-4" /></Button>
        </section>
      </main>

      <footer id="contact" className="scroll-mt-24 border-t border-ink/10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-6 px-4 py-8 sm:px-6">
          <div><Logo /><p className="mt-2 text-sm text-ink-500">{g.name}</p></div>
          <ul className="space-y-2 text-sm text-ink-700">
            <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-coral-500" /> {g.address}</li>
            <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-coral-500" /> <a href={`tel:${g.phone.replace(/\s/g, '')}`}>{g.phone}</a></li>
            <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-coral-500" /> <a href={`mailto:${g.email}`}>{g.email}</a></li>
          </ul>
          <div className="flex gap-3"><Button variant="neu" href="/login">Login</Button><Button href="/customer/bookings/new">Book a Service</Button></div>
        </div>
      </footer>
    </div>
  );
}
