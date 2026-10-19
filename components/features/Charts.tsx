'use client';

import clsx from 'clsx';
import { useState } from 'react';

const nice = (max: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / p) * p;
};

export function BarChart({ data, format, height = 190, highlight, barClass = 'from-[#9db4ff] to-[#7b95f5]', hideTooltip }: { data: { label: string; value: number }[]; format: (n: number) => string; height?: number; highlight?: number; barClass?: string; hideTooltip?: boolean }) {
  const [hover, setHover] = useState<number | null>(highlight ?? null);
  const max = nice(Math.max(...data.map((d) => d.value), 1));
  const ticks = [max, (max * 2) / 3, max / 3, 0];
  return (
    <div className="flex gap-3" style={{ height }}>
      <div className="flex flex-col justify-between pb-6 text-right text-[10px] leading-none text-ink-400">
        {ticks.map((t) => (
          <span key={t}>{t >= 100000 ? `${Math.round(t / 1000)}K` : Math.round(t)}</span>
        ))}
      </div>
      <div className="relative flex flex-1 flex-col">
        <div className="relative flex flex-1 items-end gap-[3%] border-b border-ivory-300">
          {[1, 2, 3].map((i) => (
            <span key={i} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ivory-300/80" style={{ bottom: `${(i / 3) * 100}%` }} />
          ))}
          {data.map((d, i) => (
            <button
              key={d.label + i}
              type="button"
              aria-label={`${d.label}: ${format(d.value)}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onMouseLeave={() => setHover(highlight ?? null)}
              className="group relative flex h-full flex-1 items-end justify-center"
            >
              {!hideTooltip && hover === i && (
                <span className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium leading-tight text-white shadow-dark" style={{ bottom: `calc(${(d.value / max) * 100}% + 8px)` }}>
                  {d.label}
                  <br />
                  {format(d.value)}
                </span>
              )}
              <span className={clsx('block w-[62%] max-w-[34px] rounded-t-md bg-gradient-to-b transition', barClass, hover === i && 'brightness-95')} style={{ height: `${(d.value / max) * 100}%` }} />
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-[3%] text-center text-[10px] text-ink-400">
          {data.map((d, i) => (
            <span key={d.label + i} className="flex-1">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Donut({ slices, center, sub }: { slices: { label: string; value: number; color: string }[]; center: string; sub: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 62;
  const Cc = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative h-[170px] w-[170px] shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Service type distribution">
        {slices.map((s) => {
          const len = (s.value / total) * Cc;
          const el = <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={s.color} strokeWidth="24" strokeDasharray={`${Math.max(0, len - 2)} ${Cc - len + 2}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#fffbf7] to-[#f6ede2] shadow-neu-in-sm">
        <span className="text-[30px] font-bold leading-none">{center}</span>
        <span className="mt-1 text-xs text-ink-500">{sub}</span>
      </div>
    </div>
  );
}

export function LineChart({ points, height = 120, format }: { points: { label: string; value: number }[]; height?: number; format: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 100, padX = 14;
  const max = nice(Math.max(...points.map((p) => p.value)));
  const min = 0;
  const xy = points.map((p, i) => [padX + (i / (points.length - 1)) * (W - padX * 2), H - 8 - ((p.value - min) / (max - min)) * (H - 22)] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1][0]} ${H} L${xy[0][0]} ${H} Z`;
  return (
    <div style={{ height }} className="relative">
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="h-full w-full" role="img" aria-label="Customer growth">
        <defs>
          <linearGradient id="lg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a86ff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#4a86ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1="0" x2={W} y1={H * t} y2={H * t} stroke="#e6d9c7" strokeDasharray="3 4" />
        ))}
        <path d={area} fill="url(#lg-fill)" />
        <path d={line} fill="none" stroke="#3b7bf0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {xy.map(([x, y], i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={x} cy={y} r="9" fill="transparent" />
            <circle cx={x} cy={y} r={hover === i ? 4.5 : 3} fill="#3b7bf0" stroke="#fff" strokeWidth="1.5" />
            <text x={x} y={H + 11} textAnchor="middle" fontSize="8" fill="#928e87">{points[i].label}</text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <rect x={Math.min(Math.max(xy[hover][0] - 28, 0), W - 56)} y={xy[hover][1] - 30} width="56" height="22" rx="6" fill="#1c1d20" />
            <text x={Math.min(Math.max(xy[hover][0], 28), W - 28)} y={xy[hover][1] - 15} textAnchor="middle" fontSize="9" fill="#fff">{format(points[hover].value)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
