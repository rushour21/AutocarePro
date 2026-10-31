'use client';

import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

const nice = (max: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / p) * p;
};

/** Solid bars with every value printed, for small sets where the numbers are the point. The latest bar is darker. */
export function ValueBars({ data, format, short, height = 240 }: { data: { label: string; value: number }[]; format: (n: number) => string; short: (n: number) => string; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <ul className="flex items-end gap-3 border-b border-ink-500/25 sm:gap-5" style={{ height }} aria-label="Values by month">
        {data.map((d, i) => (
          <li key={d.label} title={`${d.label}: ${format(d.value)}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-1 whitespace-nowrap text-[13px] font-bold tabular-nums text-ink">{short(d.value)}</span>
            <span className={clsx('block w-full max-w-[56px] rounded-t transition-colors', i === data.length - 1 ? 'bg-[#4f7ea8]' : 'bg-[#a9c4dc]')} style={{ height: `${(d.value / max) * 84}%`, minHeight: 4 }} />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-3 text-center text-xs font-medium text-ink-500 sm:gap-5">
        {data.map((d) => <span key={d.label} className="min-w-0 flex-1">{d.label}</span>)}
      </div>
    </div>
  );
}

export function BarChart({ data, format, height = 190, highlight, hideTooltip }: { data: { label: string; value: number }[]; format: (n: number) => string; height?: number; highlight?: number; hideTooltip?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? highlight;
  const max = nice(Math.max(...data.map((d) => d.value), 1));
  return (
    <div className="flex flex-col pt-12" style={{ height }}>
      <div className="flex min-h-0 flex-1 gap-[2%]">
        {data.map((d, i) => {
          const active = shown === i;
          const edge = i === 0 ? 'left-0' : i === data.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2';
          return (
            <button
              key={d.label + i}
              type="button"
              aria-label={`${d.label}: ${format(d.value)}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
            >
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ivory-400/70" aria-hidden />
              {!hideTooltip && active && (
                <span className={clsx('absolute z-10 whitespace-nowrap rounded-lg bg-[#fcfcfd] px-2.5 py-1.5 text-left text-[11px] leading-tight text-ink shadow-neu-sm', edge)} style={{ bottom: `calc(${(d.value / max) * 100}% + 8px)` }}>
                  {d.label && <span className="block font-semibold">{d.label}</span>}
                  <span className="block text-ink-500">{format(d.value)}</span>
                </span>
              )}
              <span
                className={clsx('relative block w-[46%] min-w-[12px] max-w-[26px] rounded-full border-[1.5px] transition-colors', active ? 'border-transparent bg-gradient-to-b from-[#86aed0] to-[#5f8fb8]' : 'border-[#a9c4dc] bg-[#fbfbfc] group-hover:border-[#78a2c6]')}
                style={{ height: `${(d.value / max) * 100}%`, minHeight: 14 }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[2%] text-center text-[10px] text-ink-400">
        {data.map((d, i) => (
          <span key={d.label + i} className="flex-1">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ slices, center, sub }: { slices: { label: string; value: number; color: string }[]; center: string; sub: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 68;
  const Cc = 2 * Math.PI * R;
  const gap = 4;
  let acc = 0;
  return (
    <div className="relative h-[170px] w-[170px] shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Service type distribution">
        {slices.map((s) => {
          const len = (s.value / total) * Cc;
          const el = <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={s.color} strokeWidth="7" strokeDasharray={`${Math.max(0, len - gap)} ${Cc - len + gap}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-semibold leading-none">{center}</span>
        <span className="mt-1 text-xs text-ink-500">{sub}</span>
      </div>
    </div>
  );
}

export interface TrendSeries {
  label: string;
  color: string;
  values: number[];
}

const PAD = { top: 12, right: 40, bottom: 26, left: 4 };

export function LineChart({ series, labels, ticks, height = 240, format, ariaLabel }: { series: TrendSeries[]; labels: string[]; ticks: { index: number; label: string }[]; height?: number; format: (n: number) => string; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  const count = labels.length;
  const resting = Math.round((count - 1) * 0.78);
  const [hover, setHover] = useState<number | null>(null);
  const at = Math.min(hover ?? resting, count - 1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const all = series.flatMap((s) => s.values);
  const step = nice(Math.max(...all.map(Math.abs), 1) / 2);
  const hi = Math.ceil(Math.max(...all) / step) * step;
  const lo = Math.floor(Math.min(...all) / step) * step;
  const yTicks: number[] = [];
  for (let v = hi; v >= lo; v -= step) yTicks.push(v);

  const iw = Math.max(W - PAD.left - PAD.right, 1);
  const ih = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (count - 1)) * iw;
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo || 1)) * ih;
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setHover(Math.round(((e.clientX - box.left) / box.width) * (count - 1)));
  };

  const tipW = 172;
  const tipLeft = Math.min(Math.max(x(at) - tipW / 2, 0), W - tipW);
  const anchorY = Math.min(...series.map((s) => y(s.values[at])));
  const tipAbove = anchorY - 24 * series.length - 16;
  const tipTop = tipAbove >= 0 ? tipAbove : anchorY + 18;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative" style={{ height }}>
        <svg width={W} height={height} className="absolute inset-0" role="img" aria-label={ariaLabel}>
          {yTicks.map((v) => (
            <text key={v} x={W - 2} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#b4b7bd">{format(v)}</text>
          ))}
          {ticks.map((t) => (
            <g key={t.label}>
              <line x1={x(t.index)} x2={x(t.index)} y1={PAD.top + ih * 0.55} y2={height - PAD.bottom} stroke="#e0e2e7" />
              <text x={Math.max(x(t.index), 10)} y={height - 8} textAnchor="middle" fontSize="10" letterSpacing="0.5" fill="#92959c">{t.label.toUpperCase()}</text>
            </g>
          ))}
          <defs>
            <clipPath id="trend-past"><rect x="0" y="0" width={x(at)} height={height} /></clipPath>
            <clipPath id="trend-next"><rect x={x(at)} y="0" width={Math.max(W - x(at), 0)} height={height} /></clipPath>
          </defs>
          {series.map((s) => (
            <g key={s.label} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
              <path d={path(s.values)} clipPath="url(#trend-past)" />
              <path d={path(s.values)} clipPath="url(#trend-next)" opacity="0.45" />
            </g>
          ))}
          <line x1={x(at)} x2={x(at)} y1={PAD.top} y2={height - PAD.bottom - 4} stroke="#92959c" strokeDasharray="3 3" />
          {series.map((s) => (
            <g key={s.label} fill="#fbfbfc" stroke={s.color} strokeWidth="1.75">
              <circle cx={x(at)} cy={y(s.values[at])} r="3.5" />
              {at < count - 1 && <circle cx={x(count - 1)} cy={y(s.values[count - 1])} r="3" />}
            </g>
          ))}
          <rect x={PAD.left} y={0} width={iw} height={height} fill="transparent" className="touch-pan-y" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-medium leading-tight text-white" style={{ left: Math.min(Math.max(x(at), 22), W - 22), top: height - 21 }}>
          {labels[at]}
        </span>
        <div className="pointer-events-none absolute rounded-lg bg-[#fcfcfd] px-2.5 py-1.5 text-[11px] shadow-neu-sm" style={{ left: tipLeft, top: tipTop, width: tipW }}>
          {series.map((s) => (
            <p key={s.label} className="flex items-center gap-1.5 leading-[18px]">
              <span className="h-2.5 w-[3px] rounded-sm" style={{ background: s.color }} />
              <span className="flex-1 truncate text-ink-600">{s.label}</span>
              <span className="font-medium tabular-nums text-ink">{format(s.values[at])}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
