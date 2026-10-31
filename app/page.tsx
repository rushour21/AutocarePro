'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BadgeCheck, ClipboardCheck, Eye, FileCheck2, Mail, MapPin, Menu, Phone, ScanSearch, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react';
import { GarageBackdrop } from '@/components/features/GarageBackdrop';
import { LandingMotion, WheelStory } from '@/components/features/LandingMotion';
import { Logo, LogoMark } from '@/components/layout/AppShell';
import { Button } from '@/components/ui';
import { Gear, HexBolt, Piston, SparkPlug, SpinningGear, Tyre } from '@/components/ui/Mechanical';
import { useDb } from '@/lib/store';

const PartCog = ({ className }: { className?: string; strokeWidth?: number }) => <Gear teeth={10} className={className} />;
const SERVICES = [
  { label: 'Car Service', text: 'Periodic service and oil changes', icon: Piston },
  { label: 'Repairs', text: 'Engine, brakes and suspension', icon: Wrench },
  { label: 'Diagnostics', text: 'Scans for warning lights and faults', icon: SparkPlug },
  { label: 'Modifications', text: 'Upgrades fitted the right way', icon: PartCog },
  { label: 'Detailing', text: 'Wash, polish and paint protection', icon: Sparkles },
  { label: 'Accessories', text: 'Parts and accessories for your car', icon: Tyre },
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

const PartGear = ({ className }: { className?: string }) => <Gear teeth={10} className={className} />;
const PARTS = [PartGear, Piston, HexBolt, Tyre, SparkPlug, Wrench, PartGear, HexBolt, Piston, Tyre];
const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="flex items-center gap-1.5 text-sm font-semibold text-coral-600"><Gear teeth={10} className="h-4 w-4" /> {children}</p>;

export default function LandingPage() {
  const db = useDb();
  const [menu, setMenu] = useState(false);
  const g = db.garage;
  return (
    <div>
      <LandingMotion />
      <header className="sticky top-3 z-40 h-[60px] px-3 sm:px-5">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[20px] bg-[#14161b]/75 text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
            <Link href="/" aria-label="AutoHub home" className="flex items-center gap-2 text-[17px] font-bold tracking-tight"><LogoMark className="h-7 w-7" /> AutoHub</Link>
            <nav className="hidden items-center gap-1 text-[14px] font-medium lg:flex" aria-label="Site">
              {NAV.map(([l, h]) => <a key={l} href={h} className="rounded-xl px-3.5 py-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white">{l}</a>)}
            </nav>
            <div className="flex items-center gap-2">
              <span data-spin="0.25" className="hidden text-coral-400 sm:block" aria-hidden><Gear teeth={10} className="h-5 w-5" /></span>
              <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block">Login</Link>
              <Button href="/book" className="hidden !h-10 sm:inline-flex">Book Service <ArrowRight className="h-4 w-4" /></Button>
              <button aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 lg:hidden">{menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
            </div>
          </div>
          <span data-progress="" className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-coral-500 to-[#f0a08a]" aria-hidden />
          {menu && (
            <nav className="slide-up flex flex-col gap-1 border-t border-white/10 p-2 lg:hidden" aria-label="Mobile site">
              {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 hover:bg-white/10">{l}</a>)}
              <Link href="/login" className="rounded-xl px-4 py-3 text-sm font-medium text-white/85 hover:bg-white/10">Login</Link>
              <Link href="/book" className="rounded-xl bg-coral-500 px-4 py-3 text-sm font-semibold">Book Service</Link>
            </nav>
          )}
        </div>
      </header>

      <section className="relative isolate -mt-[60px] overflow-hidden bg-[#14161b] text-white" aria-label="Introduction">
        <div data-parallax="0.2" className="hero-zoom absolute inset-0"><GarageBackdrop /></div>
        <div className="lights-on absolute inset-0 z-10 bg-black" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1014]/90 via-[#0e1014]/45 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0e1014]/60 to-transparent" aria-hidden />
        <div className="absolute inset-0 bg-[#0e1014]/45 sm:hidden" aria-hidden />
        <span data-spin="0.12" className="absolute -bottom-24 -right-16 hidden h-72 w-72 sm:block"><SpinningGear teeth={16} seconds={60} className="h-full w-full text-white/[0.07]" /></span>
        <span data-spin="-0.2" className="absolute bottom-24 right-48 hidden h-32 w-32 sm:block"><SpinningGear teeth={10} seconds={38} reverse className="h-full w-full text-coral-500/20" /></span>
        <div className="relative mx-auto flex min-h-svh max-w-[1240px] items-center px-4 pb-14 pt-[110px] sm:px-6">
          <div className="max-w-[620px]">
            <p style={{ '--d': 0 } as React.CSSProperties} className="hero-rise mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-white/90 ring-1 ring-white/15"><Gear teeth={10} className="h-4 w-4 text-coral-400" /> Trusted garage care</p>
            <h1 style={{ '--d': 120 } as React.CSSProperties} className="hero-rise text-[44px] font-extrabold leading-[1.04] tracking-tight sm:text-[60px] lg:text-[72px]">Premium car care, <span className="text-coral-400">made simple.</span></h1>
            <p style={{ '--d': 260 } as React.CSSProperties} className="hero-rise mt-5 max-w-[520px] text-[17px] leading-7 text-white/80">Service, repairs and modifications in one modern workshop. See the work, approve every price and track your car from your phone.</p>
            <div style={{ '--d': 380 } as React.CSSProperties} className="hero-rise mt-7 flex flex-wrap gap-3">
              <Button size="lg" href="/book" className="min-w-[180px]">Book a Service <ArrowRight className="h-4 w-4" /></Button>
              <a href="#services" className="btn h-12 bg-white/10 px-6 text-[15px] text-white ring-1 ring-white/25 transition-colors hover:bg-white/20">Explore Services</a>
            </div>
            <dl style={{ '--d': 500 } as React.CSSProperties} className="hero-rise mt-9 grid max-w-[480px] grid-cols-3 gap-3 border-t border-white/15 pt-5">
              {STATS.map((s) => <div key={s.k}><dd className="text-[20px] font-bold leading-tight sm:text-[24px]">{s.k}</dd><dt className="text-xs text-white/65 sm:text-[13px]">{s.l}</dt></div>)}
            </dl>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-b border-ink/10 bg-[#fbfbfc] py-4" aria-hidden>
        <div className="marquee flex w-max items-center gap-14 text-ink-300">
          {[...PARTS, ...PARTS, ...PARTS, ...PARTS].map((Part, i) => <Part key={i} className="h-7 w-7 shrink-0" />)}
        </div>
      </div>

      <main className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
        <section id="services" className="scroll-mt-24 py-8 lg:py-12">
          <div data-reveal=""><Eyebrow>Services</Eyebrow>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">Everything your car needs</h2></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ label, text, icon: Icon }, i) => (
              <Link key={label} data-reveal="" style={{ '--d': `${i * 70}ms` } as React.CSSProperties} href={`/book?service=${encodeURIComponent(label)}`} className="neu group flex items-center gap-4 !rounded-[20px] p-4 transition hover:-translate-y-0.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-500"><span className="transition-transform duration-500 group-hover:rotate-[60deg]"><Icon className="h-6 w-6" strokeWidth={1.8} /></span></span>
                <span className="min-w-0 flex-1"><span className="block font-bold">{label}</span><span className="block text-sm text-ink-500">{text}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-coral-500" />
              </Link>
            ))}
          </div>
        </section>

        <WheelStory steps={STEPS} />

        <section id="why" className="scroll-mt-24 py-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div data-reveal="">
              <Eyebrow>Why AutoHub</Eyebrow>
              <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">No surprises. Just honest work.</h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {WHY.map(({ t, d, icon: Icon }) => <li key={t}><Icon className="mb-2 h-6 w-6 text-coral-500" strokeWidth={1.8} /><h3 className="font-bold">{t}</h3><p className="mt-0.5 text-sm leading-6 text-ink-600">{d}</p></li>)}
              </ul>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-reveal="" style={{ '--d': '120ms' } as React.CSSProperties} src="/assets/share/live-main.jpg" alt="Car being serviced in the AutoHub workshop" className="aspect-[3/2] w-full rounded-[24px] object-cover shadow-neu-sm" />
          </div>
        </section>

        <section data-reveal="" className="relative my-8 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[28px] bg-ink p-6 text-white sm:p-10" aria-label="Book a service">
          <span data-spin="0.15" className="absolute -right-10 -top-16 h-52 w-52"><SpinningGear teeth={14} seconds={50} className="h-full w-full text-white/[0.06]" /></span>
          <div className="relative"><h2 className="text-[26px] font-extrabold tracking-tight sm:text-[32px]">Ready to book your car in?</h2><p className="mt-1 text-white/70">Pick a service and a time that works for you.</p></div>
          <Button size="lg" href="/book" className="relative">Book a Service <ArrowRight className="h-4 w-4" /></Button>
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
          <div className="flex gap-3"><Button variant="neu" href="/login">Login</Button><Button href="/book">Book a Service</Button></div>
        </div>
      </footer>
    </div>
  );
}
