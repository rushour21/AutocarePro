'use client';

import clsx from 'clsx';
import { ChevronDown, Plus } from 'lucide-react';
import { damageLegend, damageTypes, severities } from '@/lib/data';

export type Marker = { x: number; y: number; color: string; type?: string };

export const colorFor = (type: string) => damageLegend.find((d) => d.label === type)?.color ?? '#e5484d';

/** Vehicle diagram image with live damage markers; clicking the image adds a marker. */
export function DamageDiagram({
  src,
  aspect,
  markers,
  selected,
  onSelect,
  onAdd,
  size = 14,
  className,
}: {
  src: string;
  aspect: string;
  markers: Marker[];
  selected?: number;
  onSelect?: (i: number) => void;
  onAdd?: (x: number, y: number) => void;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={clsx('relative select-none', onAdd && 'cursor-crosshair', className)}
      style={{ aspectRatio: aspect }}
      onClick={(e) => {
        if (!onAdd) return;
        const r = e.currentTarget.getBoundingClientRect();
        onAdd(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Vehicle diagram" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      {markers.map((m, i) => (
        <button
          key={`${m.x}-${m.y}-${i}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(i);
          }}
          className={clsx('marker-pop absolute rounded-full', selected === i && 'ring-4 ring-[#1d63ed]/25')}
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: size,
            height: size,
            background: m.color,
            boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.25)',
          }}
          aria-label={`Damage marker ${i + 1}${m.type ? `: ${m.type}` : ''}`}
        />
      ))}
    </div>
  );
}

export function Legend({ className }: { className?: string }) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600', className)}>
      {damageLegend.map((d) => (
        <span key={d.label} className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: d.color }} />
          {d.label}
        </span>
      ))}
    </div>
  );
}

function SelectBox({ value, options, onChange, tone }: { value: string; options: string[]; onChange: (v: string) => void; tone?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#e3e5e8] px-3 pr-9 text-sm outline-none focus:border-[#9db7f5]"
        style={tone ? { background: `${tone}14`, color: tone, borderColor: `${tone}40` } : { background: '#fff' }}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  );
}

export const severityTone = (s: string) => (s === 'High' ? '#e5484d' : s === 'Medium' ? '#f08c00' : '#1f9d63');

/** Right-hand "Selected Area" editor: photo, damage type, severity, notes and photos. */
export function SelectedArea({
  photo,
  thumbs,
  type,
  severity,
  notes,
  onChange,
  addTile = 'plain',
  footer,
  className,
}: {
  photo: string;
  thumbs: string[];
  type: string;
  severity: string;
  notes: string;
  onChange: (patch: { type?: string; severity?: string; notes?: string }) => void;
  addTile?: 'plain' | 'labelled';
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('rounded-xl border border-[#e8e9ec] bg-white p-4 shadow-card', className)}>
      <h4 className="text-[15px] font-semibold">Selected Area</h4>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Selected area" className="mt-3 h-[88px] w-full rounded-lg object-cover" />
      <p className="mb-1.5 mt-4 text-xs text-gray-500">Damage Type</p>
      <SelectBox value={type} options={damageTypes} onChange={(v) => onChange({ type: v })} />
      <p className="mb-1.5 mt-4 text-xs text-gray-500">Severity</p>
      <SelectBox value={severity} options={severities} onChange={(v) => onChange({ severity: v })} tone={severityTone(severity)} />
      <p className="mb-1.5 mt-4 text-xs text-gray-500">Notes</p>
      <textarea
        value={notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        rows={2}
        className="w-full resize-none rounded-lg border border-[#e3e5e8] px-3 py-2 text-sm leading-6 text-gray-700 outline-none focus:border-[#9db7f5]"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {thumbs.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t} src={t} alt="" className="aspect-square w-full rounded-lg object-cover" />
        ))}
        <button className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#b9cdf5] bg-[#f3f7ff] text-xs text-[#2f6fed]">
          <Plus className="h-4 w-4" />
          {addTile === 'labelled' && 'Add Photo'}
        </button>
      </div>
      {footer}
    </div>
  );
}
