'use client';

import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Gear } from '@/components/ui/Mechanical';

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Drives the landing page's scroll motion. Sections opt in with data attributes:
 * data-reveal (ease in once), data-spin (rotate with scroll), data-parallax (drift), data-progress (page progress),
 * data-pin (pinned story). Only transforms and opacity change, and nothing runs for reduced motion.
 */
export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.classList.add('fx');

    const seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        seen.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((el) => seen.observe(el));

    const all = (s: string) => [...document.querySelectorAll<HTMLElement>(s)];
    const spins = all('[data-spin]');
    const drifts = all('[data-parallax]');
    const bars = all('[data-progress]');
    const pins = all('[data-pin]');

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      spins.forEach((el) => { el.style.transform = `rotate(${y * Number(el.dataset.spin)}deg)`; });
      drifts.forEach((el) => { el.style.transform = `translate3d(0, ${y * Number(el.dataset.parallax)}px, 0)`; });
      bars.forEach((el) => { el.style.transform = `scaleX(${max > 0 ? y / max : 0})`; });
      pins.forEach((pin) => {
        const box = pin.getBoundingClientRect();
        const p = clamp(-box.top / (box.height - window.innerHeight));
        const step = Math.min(3, Math.floor(p * 4));
        pin.querySelectorAll<SVGGElement>('[data-explode]').forEach((part) => { part.style.transform = `translateX(${Number(part.dataset.explode) * p * 92}px)`; });
        pin.querySelectorAll<SVGGElement>('[data-turn]').forEach((part) => { part.style.transform = `rotate(${p * 360}deg)`; });
        pin.querySelectorAll<SVGTextElement>('[data-part-label]').forEach((label) => { label.style.opacity = String(clamp((p - 0.7) * 6)); });
        pin.querySelectorAll('[data-step-item]').forEach((item, i) => item.classList.toggle('is-active', i === step));
        pin.querySelectorAll<HTMLElement>('[data-step-bar]').forEach((bar) => { bar.style.transform = `scaleY(${p})`; });
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.classList.remove('fx');
    };
  }, []);
  return null;
}

const BOLTS = [0, 72, 144, 216, 288];

/** A wheel seen face on. Scrolling pulls its layers apart along the axle. */
function ExplodedWheel() {
  const y = 170;
  return (
    <svg viewBox="0 0 640 380" role="img" aria-label="A car wheel separating into tyre, rim, brake disc, caliper and hub" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="ew-tyre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a3d44" /><stop offset="1" stopColor="#14161b" /></linearGradient>
        <linearGradient id="ew-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2f4f7" /><stop offset="1" stopColor="#8d97a6" /></linearGradient>
        <linearGradient id="ew-disc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9ced6" /><stop offset="1" stopColor="#6f737b" /></linearGradient>
        <linearGradient id="ew-coral" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e4633f" /><stop offset="1" stopColor="#a8331a" /></linearGradient>
      </defs>

      <g data-explode="-1.1">
        <circle cx="320" cy={y} r="112" fill="url(#ew-disc)" />
        <circle cx="320" cy={y} r="96" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 9" />
        <circle cx="320" cy={y} r="48" fill="#3a3d44" />
        <text data-part-label="" x="320" y="350" textAnchor="middle" className="ew-label">Brake disc</text>
      </g>
      <g data-explode="0">
        <path d={`M262 ${y - 100} a100 100 0 0 1 116 0 l-18 34 a62 62 0 0 0 -80 0 z`} fill="url(#ew-coral)" />
        <text data-part-label="" x="320" y="350" textAnchor="middle" className="ew-label">Caliper</text>
      </g>
      <g data-explode="2.2">
        <circle cx="320" cy={y} r="58" fill="url(#ew-coral)" />
        <circle cx="320" cy={y} r="22" fill="#14161b" />
        <g data-turn="" className="ew-turn">{BOLTS.map((a) => <circle key={a} cx={(320 + 40 * Math.cos((a * Math.PI) / 180)).toFixed(2)} cy={(y + 40 * Math.sin((a * Math.PI) / 180)).toFixed(2)} r="6" fill="#f2f4f7" />)}</g>
        <text data-part-label="" x="320" y="350" textAnchor="middle" className="ew-label">Hub</text>
      </g>
      <g data-explode="1.1">
        <g data-turn="" className="ew-turn">
          <circle cx="320" cy={y} r="126" fill="none" stroke="url(#ew-rim)" strokeWidth="14" />
          {BOLTS.map((a) => <rect key={a} x="312" y={y - 122} width="16" height="92" rx="7" fill="url(#ew-rim)" transform={`rotate(${a} 320 ${y})`} />)}
        </g>
        <text data-part-label="" x="320" y="350" textAnchor="middle" className="ew-label">Alloy rim</text>
      </g>
      <g data-explode="-2.2">
        <circle cx="320" cy={y} r="150" fill="none" stroke="url(#ew-tyre)" strokeWidth="30" />
        <circle cx="320" cy={y} r="150" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="24" strokeDasharray="4 12" />
        <text data-part-label="" x="320" y="350" textAnchor="middle" className="ew-label">Tyre</text>
      </g>
    </svg>
  );
}

/** Pinned story: the steps change as the wheel comes apart. Shows as a plain list for reduced motion. */
export function WheelStory({ steps }: { steps: { t: string; d: string; icon: LucideIcon }[] }) {
  return (
    <section id="how" data-pin="" className="pin-wrap relative scroll-mt-24 py-8 lg:py-0">
      <div className="pin-sticky grid items-center gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-coral-600"><Gear teeth={10} className="h-4 w-4" /> How it works</p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-tight sm:text-[34px]">From check-in to delivery</h2>
          <div className="relative mt-5 pl-5">
            <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-ink-500/15" aria-hidden />
            <span data-step-bar="" className="absolute inset-y-1 left-0 w-[3px] origin-top rounded-full bg-coral-500" aria-hidden />
            <ol className="space-y-2.5">
              {steps.map(({ t, d, icon: Icon }, i) => (
                <li key={t} data-step-item="" className={i === 0 ? 'step-item is-active' : 'step-item'}>
                  <h3 className="flex items-center gap-2 font-bold"><Icon className="h-[18px] w-[18px] text-coral-500" strokeWidth={1.9} /> {t}</h3>
                  <div className="step-desc"><p className="overflow-hidden text-sm leading-6 text-ink-600">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mx-auto h-[240px] w-full max-w-[640px] sm:h-[360px]"><ExplodedWheel /></div>
      </div>
    </section>
  );
}
