'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Check, CircleAlert } from 'lucide-react';
import { CAR_COLOR, CarTopSvg } from '@/components/features/CarTop';
import { ShareCard, useTrack } from '@/components/share/ShareKit';
import { findingsFor, type Finding } from '@/lib/track';
import type { PointStatus } from '@/lib/types';
import { vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';

const MARK: Record<PointStatus, { c: string; label: string }> = {
  good: { c: '#1d9d65', label: 'Good' },
  minor: { c: '#f5a524', label: 'Minor Issue' },
  major: { c: '#ef4d2f', label: 'Major Issue' },
  unchecked: { c: '#b9b2a7', label: 'Not checked' },
};

function FindingRow({ f }: { f: Finding }) {
  const good = f.state === 'good';
  return (
    <li className="neu-row flex items-center gap-4 px-4 py-3.5">
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white', good ? 'bg-gradient-to-b from-[#2fcf8a] to-[#17a368] shadow-[0_3px_8px_rgba(29,157,101,0.35)]' : f.state === 'warn' ? 'bg-gradient-to-b from-[#ffbf4a] to-[#ee8a12]' : 'bg-gradient-to-b from-[#ff8a5c] to-[#ef4d2f] shadow-coral')}>
        {good ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : <CircleAlert className="h-[18px] w-[18px]" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{f.label}</p>
        {f.lines.map((l) =>
          l.chip ? (
            <span key={l.text} className="mt-1 inline-block rounded-md bg-bad-soft px-2 py-0.5 text-xs font-medium text-bad-strong">{l.text}</span>
          ) : (
            <p key={l.text} className={clsx('text-sm font-medium', good ? 'text-ok' : 'text-bad')}>{l.text}</p>
          ),
        )}
      </div>
    </li>
  );
}

function Tile({ src, label }: { src: string; label: string }) {
  return (
    <div className="neu-sm flex aspect-[0.92] items-center justify-center !rounded-[22px] p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="blend-multiply h-full w-full object-contain" />
    </div>
  );
}

export default function ShareInspection() {
  const { job } = useTrack();
  const db = useDb();
  const v = vehicleOf(db, job.vehicleId);
  const [tab, setTab] = useState<'3d' | 'check' | 'find'>('3d');
  const findings = findingsFor(job);
  const marks = job.points.filter((p) => p.zone === 'body' && p.status !== 'unchecked');
  const pos = (x: number, y: number): React.CSSProperties => ({ left: `${((x + 6) / 112) * 100}%`, top: `${((y * 2.5 + 4) / 258) * 100}%`, transform: 'translate(-50%,-50%)' });

  const tabs = (
    <div role="tablist" aria-label="Report view" className="thin-scroll neu-in-sm flex max-w-full gap-1 overflow-x-auto !rounded-2xl p-1.5">
      {([['3d', '3D View'], ['check', 'Checklist'], ['find', 'Findings']] as const).map(([k, l]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('h-10 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition sm:px-5', tab === k ? 'tab-dark' : 'text-ink-600')}>{l}</button>
      ))}
    </div>
  );

  return (
    <ShareCard tabs={tabs}>
      {tab === '3d' && (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[84px_minmax(170px,1fr)_84px_minmax(220px,1.05fr)] xl:grid-cols-[96px_minmax(180px,1fr)_96px_minmax(230px,1.1fr)]">
            <div className="hidden space-y-3 lg:block"><Tile src="/assets/share/part-l1.png" label="Brake drum" /><Tile src="/assets/share/part-l2.png" label="Suspension spring" /><Tile src="/assets/share/part-l3.png" label="Tyre" /></div>
            <div className="neu-sm relative mx-auto w-full max-w-[260px] !rounded-[26px] px-6 py-5">
              <div className="relative mx-auto w-full" style={{ aspectRatio: '112 / 258' }}>
                <CarTopSvg color={v ? CAR_COLOR[v.carKey] : '#f1f0ee'} className="absolute inset-0 h-full w-full" />
                {marks.map((p) => (
                  <span key={p.id} title={`${p.label}: ${MARK[p.status].label}`} className="absolute h-[15px] w-[15px] rounded-full border-2 border-white" style={{ ...pos(p.x, p.y), background: MARK[p.status].c, boxShadow: `0 0 10px 3px ${MARK[p.status].c}66` }} />
                ))}
              </div>
            </div>
            <div className="hidden space-y-3 lg:block"><Tile src="/assets/share/part-r1.png" label="Brake caliper" /><Tile src="/assets/share/part-r2.png" label="Suspension" /><Tile src="/assets/share/part-r3.png" label="Tyre" /></div>
            <ul className="space-y-2.5 lg:col-auto" aria-label="Findings">{findings.map((f) => <FindingRow key={f.label} f={f} />)}</ul>
          </div>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-ink-600" aria-label="Legend">
            {(['good', 'minor', 'major'] as PointStatus[]).map((k) => (
              <li key={k} className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full" style={{ background: MARK[k].c, boxShadow: `0 0 0 4px ${MARK[k].c}26` }} />{MARK[k].label}</li>
            ))}
          </ul>
        </>
      )}
      {tab === 'check' && (
        <ul className="space-y-2.5">
          {job.checklist.map((c) => (
            <li key={c.id} className="neu-row flex items-center gap-4 px-4 py-3.5 text-sm">
              <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full', c.done ? 'bg-gradient-to-b from-[#2fcf8a] to-[#17a368] text-white' : 'neu-in-sm !rounded-full')}>{c.done && <Check className="h-4 w-4" strokeWidth={3} />}</span>
              <span className="flex-1">{c.label}</span>
              <span className={c.done ? 'font-medium text-ok' : 'text-ink-400'}>{c.done ? 'Done' : 'Pending'}</span>
            </li>
          ))}
        </ul>
      )}
      {tab === 'find' && <ul className="grid gap-2.5 sm:grid-cols-2">{findings.map((f) => <FindingRow key={f.label} f={f} />)}</ul>}
    </ShareCard>
  );
}
