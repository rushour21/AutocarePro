'use client';

import clsx from 'clsx';
import { Camera, Download, Expand, ImagePlus, Plus, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addPointPhoto, setPoint } from '@/lib/actions';
import { useDb } from '@/lib/store';
import type { DamageType, InspectionPoint, Job, PointStatus, Severity, Zone } from '@/lib/types';
import { Button, Card, Checkbox, EmptyState, FilterTabs, StatusBadge, Textarea, useToast } from '@/components/ui';
import { mutate } from '@/lib/store';
import { CAR_COLOR, CarTopSvg } from './CarTop';

/* ------------------------------------------------------------------ colours */
export const CONDITION: { key: PointStatus; label: string; color: string }[] = [
  { key: 'good', label: 'Good', color: '#1d9d65' },
  { key: 'minor', label: 'Minor Issue', color: '#f5a524' },
  { key: 'major', label: 'Major Issue', color: '#ef4d2f' },
  { key: 'unchecked', label: 'Not Checked', color: '#b9b2a7' },
];
export const DAMAGE: { key: DamageType; color: string; hollow?: boolean }[] = [
  { key: 'Scratch', color: '#f26a2e' },
  { key: 'Dent', color: '#f6c63c' },
  { key: 'Paint Damage', color: '#2eb872' },
  { key: 'Cracked', color: '#9a948b', hollow: true },
  { key: 'Missing', color: '#9bbcff' },
  { key: 'Custom', color: '#2f6bff' },
];
const SAMPLE_PHOTOS = ['bumper', 'bumper-2', 'bumper-3', 'disc-orange', 'disc-dark', 'garage-1'].map((n) => `/assets/photos/${n}.jpg`);
const ZONES: Zone[] = ['rear-left', 'mid-left', 'wheel-left', 'rear-right', 'mid-right', 'wheel-right'];

type Mode = 'admin' | 'tech';

function markerLook(p: InspectionPoint, mode: Mode) {
  if (mode === 'tech') {
    const c = CONDITION.find((x) => x.key === p.status)!;
    return { color: c.color, hollow: p.status === 'unchecked' };
  }
  if (p.status === 'good' || p.status === 'unchecked') return { color: '#b9b2a7', hollow: true };
  const d = DAMAGE.find((x) => x.key === p.damage)!;
  return { color: d.color, hollow: !!d.hollow };
}

function Marker({ p, mode, selected, onSelect, style, disabled }: { p: InspectionPoint; mode: Mode; selected: boolean; onSelect: () => void; style: React.CSSProperties; disabled?: boolean }) {
  const { color, hollow } = markerLook(p, mode);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      disabled={disabled}
      aria-label={`${p.label}: ${p.status}`}
      aria-pressed={selected}
      title={p.label}
      style={{
        ...style,
        background: hollow ? '#fbf6ef' : color,
        border: hollow ? `2px solid ${color}` : '2px solid #fff',
        boxShadow: hollow ? 'none' : `0 0 0 ${selected ? 5 : 3}px ${color}33, 0 3px 8px ${color}77`,
      }}
      className={clsx('pop absolute z-10 h-[15px] w-[15px] rounded-full transition-[width,height] hover:scale-125', selected && '!h-[19px] !w-[19px] ring-2 ring-coral-500 ring-offset-1 ring-offset-white')}
    />
  );
}

/* ------------------------------------------------------------------ composite (car + six angle tiles) */
function CarComposite({ points, mode, selectedId, onSelect, onAdd, canEdit }: { points: InspectionPoint[]; mode: Mode; selectedId: string; onSelect: (id: string) => void; onAdd: (x: number, y: number) => void; canEdit: boolean }) {
  const carRef = useRef<HTMLDivElement>(null);
  const body = points.filter((p) => p.zone === 'body');
  const pos = (x: number, y: number): React.CSSProperties => ({ left: `${((x + 6) / 112) * 100}%`, top: `${((y * 2.5 + 4) / 258) * 100}%`, transform: 'translate(-50%,-50%)' });
  const Tile = ({ zone }: { zone: Zone }) => {
    const here = points.filter((p) => p.zone === zone);
    const active = here.some((p) => p.id === selectedId);
    return (
      <div className={clsx('neu-sm relative aspect-[0.82] overflow-hidden !rounded-[18px] transition', active && 'ring-2 ring-coral-400')} role="group" aria-label={`${zone.replace('-', ' ')} view`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/inspect/${zone}.png`} alt="" className="blend-multiply absolute inset-0 h-full w-full object-contain p-1" draggable={false} />
        {here.map((p) => (
          <Marker key={p.id} p={p} mode={mode} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)' }} />
        ))}
      </div>
    );
  };
  return (
    <div className="mx-auto grid w-full max-w-[460px] grid-cols-[1fr_1.45fr_1fr] gap-x-3 gap-y-3">
      <div className="space-y-3">
        {ZONES.slice(0, 3).map((z) => (
          <Tile key={z} zone={z} />
        ))}
      </div>
      <div
        ref={carRef}
        className={clsx('relative mx-auto flex h-full w-full items-center justify-center', canEdit && 'cursor-crosshair')}
        onClick={(e) => {
          if (!canEdit || !carRef.current) return;
          const svg = carRef.current.querySelector('svg')!.getBoundingClientRect();
          const rx = ((e.clientX - svg.left) / svg.width) * 112 - 6;
          const ry = (((e.clientY - svg.top) / svg.height) * 258 - 4) / 2.5;
          if (rx < 8 || rx > 92 || ry < 2 || ry > 98) return;
          onAdd(rx, ry);
        }}
      >
        <div className="relative w-full" style={{ aspectRatio: '112 / 258' }}>
          <CarTopSvg color={CAR_COLOR.bmw3} className="absolute inset-0 h-full w-full" />
          {body.map((p) => (
            <Marker key={p.id} p={p} mode={mode} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} style={pos(p.x, p.y)} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {ZONES.slice(3).map((z) => (
          <Tile key={z} zone={z} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ main board */
export function InspectionBoard({ jobId, mode, canEdit = true, layout }: { jobId: string; mode: Mode; canEdit?: boolean; layout?: 'split' | 'stack' }) {
  const db = useDb();
  const job: Job | undefined = db.jobs.find((j) => j.id === jobId);
  const [tab, setTab] = useState<'3d' | 'photos' | 'checklist' | 'findings'>('3d');
  const [selectedId, setSelectedId] = useState('p-front-bumper');
  const toast = useToast();
  const root = useRef<HTMLDivElement>(null);

  const point = job?.points.find((p) => p.id === selectedId) ?? job?.points[0];
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<Severity>('Minor');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (point) {
      setNotes(point.notes);
      setSeverity(point.severity);
      setSaved(false);
    }
  }, [point?.id, point?.notes, point?.severity]); // eslint-disable-line react-hooks/exhaustive-deps

  const lay = layout ?? (mode === 'admin' ? 'split' : 'stack');
  const counts = useMemo(() => {
    const c = { good: 0, minor: 0, major: 0, unchecked: 0 } as Record<PointStatus, number>;
    job?.points.forEach((p) => c[p.status]++);
    return c;
  }, [job]);

  if (!job || !point) return <EmptyState title="Inspection not available" />;

  const photos = point.photos;
  const addPhoto = () => {
    const next = SAMPLE_PHOTOS.find((p) => !point.photos.includes(p)) ?? SAMPLE_PHOTOS[0];
    addPointPhoto(job.id, point.id, next);
    toast.show('Photo added to ' + point.label);
  };
  const addPoint = (x: number, y: number) => {
    mutate((d) => {
      const j = d.jobs.find((q) => q.id === job.id);
      if (!j) return;
      const n = j.points.filter((p) => p.id.startsWith('p-custom')).length + 1;
      const id = `p-custom-${n}`;
      j.points.push({ id, label: `Custom point ${n}`, zone: 'body', x, y, status: 'minor', damage: 'Custom', severity: 'Minor', notes: '', photos: [] });
      setSelectedId(id);
    });
  };

  const damageLegend = (
    <ul className="space-y-2.5" aria-label="Damage types">
      {DAMAGE.map((d) => (
        <li key={d.key}>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setPoint(job.id, point.id, { damage: d.key, status: point.status === 'good' || point.status === 'unchecked' ? 'minor' : point.status })}
            className={clsx('flex items-center gap-2.5 rounded-lg px-1 text-[13px] transition', point.damage === d.key && point.status !== 'unchecked' && point.status !== 'good' ? 'font-semibold text-ink' : 'text-ink-500')}
            aria-pressed={point.damage === d.key}
          >
            <span className="h-3.5 w-3.5 rounded-full" style={d.hollow ? { border: `2px solid ${d.color}`, background: '#fbf6ef' } : { background: d.color, boxShadow: `0 0 0 3px ${d.color}2e` }} />
            {d.key}
          </button>
        </li>
      ))}
    </ul>
  );
  const conditionLegend = (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-ink-600" aria-label="Condition legend">
      {CONDITION.map((c) => (
        <li key={c.key} className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={c.key === 'unchecked' ? { border: `2px solid ${c.color}`, background: '#fbf6ef' } : { background: c.color, boxShadow: `0 0 0 3px ${c.color}33` }} />
          {c.label}
        </li>
      ))}
    </ul>
  );

  /* ---- right-hand details panel ---- */
  const bigPhoto = photos[0];
  const photoPanel = (
    <div className="relative overflow-hidden rounded-2xl">
      {bigPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bigPhoto} alt={point.label} className="h-[170px] w-full object-cover" />
      ) : (
        <div className="neu-in flex h-[170px] w-full flex-col items-center justify-center gap-2 text-ink-400">
          <ImagePlus className="h-7 w-7" />
          <span className="text-sm">No photo yet</span>
        </div>
      )}
      {canEdit && (
        <button type="button" aria-label="Take photo" onClick={addPhoto} className="btn btn-neu absolute bottom-3 right-3 h-11 w-11 !rounded-full">
          <Camera className="h-5 w-5" />
        </button>
      )}
    </div>
  );
  const thumbs = (
    <div className="mt-3 grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) =>
        photos[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={photos[i]} alt="" className="h-[68px] w-full rounded-xl object-cover" />
        ) : (
          <span key={i} className="neu-in-sm h-[68px] w-full opacity-60" />
        ),
      )}
    </div>
  );

  const adminPanel = (
    <Card className="flex h-full flex-col gap-4 p-5">
      <h3 className="text-lg font-bold">{point.label}</h3>
      <div>
        {photoPanel}
        {thumbs}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Severity</p>
        <div className="neu-in-sm grid grid-cols-3 gap-1.5 !rounded-2xl p-1.5" role="radiogroup" aria-label="Severity">
          {(['Minor', 'Major', 'Critical'] as Severity[]).map((s) => {
            const on = severity === s;
            return (
              <button
                key={s}
                role="radio"
                aria-checked={on}
                disabled={!canEdit}
                onClick={() => {
                  setSeverity(s);
                  setSaved(false);
                }}
                className={clsx(
                  'h-10 rounded-xl text-sm font-semibold transition',
                  on ? (s === 'Critical' ? 'btn-coral' : s === 'Major' ? 'bg-coral-100 text-coral-600 shadow-neu-xs' : 'tab-dark') : s === 'Major' ? 'text-coral-600' : 'text-ink-500 hover:text-ink',
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Notes</p>
        <Textarea
          value={notes}
          disabled={!canEdit}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Add notes about this area…"
          className="!min-h-[72px]"
          aria-label="Notes"
        />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button variant="blue" onClick={addPhoto} disabled={!canEdit} className="!h-12">
          <Plus className="h-4 w-4" /> Add Photo
        </Button>
        <Button
          disabled={!canEdit}
          className="!h-12"
          onClick={() => {
            setPoint(job.id, point.id, { severity, notes, status: point.status === 'good' || point.status === 'unchecked' ? 'minor' : severity === 'Minor' ? 'minor' : 'major' });
            setSaved(true);
            toast.show('Inspection saved');
          }}
        >
          {saved ? 'Saved ✓' : 'Save'}
        </Button>
      </div>
    </Card>
  );

  const techPanel = (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-lg font-bold">{point.label}</h3>
        <div className="mt-3 grid grid-cols-[1.25fr_1fr] gap-3">
          <div className="relative overflow-hidden rounded-2xl">
            {bigPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bigPhoto} alt={point.label} className="h-[150px] w-full object-cover" />
            ) : (
              <div className="neu-in flex h-[150px] items-center justify-center text-sm text-ink-400">No photo yet</div>
            )}
          </div>
          <div className="grid grid-rows-[1fr_auto] gap-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) =>
                photos[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={photos[i]} alt="" className="h-[68px] w-full rounded-xl object-cover" />
                ) : (
                  <span key={i} className="neu-in-sm h-[68px] w-full opacity-60" />
                ),
              )}
            </div>
            <button type="button" onClick={addPhoto} disabled={!canEdit} className="flex h-[70px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#b8caff] bg-[#eef3ff] text-sm font-semibold text-info-strong transition hover:bg-[#e4ecff] disabled:opacity-50">
              <Plus className="h-4 w-4" /> Add Photo
            </button>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Condition</p>
        <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Condition">
          {([['good', 'Good'], ['minor', 'Minor'], ['major', 'Major']] as [PointStatus, string][]).map(([k, label]) => {
            const on = point.status === k;
            return (
              <button
                key={k}
                role="radio"
                aria-checked={on}
                disabled={!canEdit}
                onClick={() => setPoint(job.id, point.id, { status: k, severity: k === 'major' ? 'Major' : 'Minor' })}
                className={clsx('flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition', on ? 'bg-coral-100 text-coral-600 shadow-neu-xs' : 'neu-in-sm text-ink-500')}
              >
                <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full border-2', on ? 'border-coral-500' : 'border-ink-200 bg-white')}>{on && <span className="h-2 w-2 rounded-full bg-coral-500" />}</span>
                {label}
              </button>
            );
          })}
        </div>
      </Card>
      <Card className="p-5">
        <p className="mb-2 text-sm font-semibold">Notes</p>
        <Textarea
          value={notes}
          disabled={!canEdit}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== point.notes && setPoint(job.id, point.id, { notes })}
          placeholder="Add notes about this area…"
          className="!min-h-[64px]"
          aria-label="Notes"
        />
      </Card>
    </div>
  );

  /* ---- tab bodies ---- */
  const body3d =
    lay === 'split' ? (
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Card className="p-5">
          <CarComposite points={job.points} mode={mode} selectedId={point.id} onSelect={setSelectedId} onAdd={addPoint} canEdit={canEdit} />
          <div className="mt-5">{damageLegend}</div>
          {canEdit && <p className="mt-4 text-xs text-ink-400">Tap a marker to inspect it, or tap the vehicle to add a custom point.</p>}
        </Card>
        {adminPanel}
      </div>
    ) : (
      <div className="space-y-4">
        <Card className="p-5">
          <CarComposite points={job.points} mode={mode} selectedId={point.id} onSelect={setSelectedId} onAdd={addPoint} canEdit={canEdit} />
          <div className="mt-5">{conditionLegend}</div>
        </Card>
        {techPanel}
      </div>
    );

  const allPhotos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const bodyPhotos = allPhotos.length ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {allPhotos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p} src={p} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-neu-sm" />
      ))}
    </div>
  ) : (
    <EmptyState title="No inspection photos" text="Photos you add to inspection points will appear here." />
  );

  const bodyChecklist = (
    <Card className="divide-y divide-ivory-300/60 p-2">
      {job.points.map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
          <Checkbox label={`${p.label} checked`} checked={p.status !== 'unchecked'} disabled={!canEdit} onChange={(v) => setPoint(job.id, p.id, { status: v ? 'good' : 'unchecked' })} />
          <button className="flex-1 text-left text-sm" onClick={() => { setSelectedId(p.id); setTab('3d'); }}>
            {p.label}
          </button>
          <StatusBadge tone={p.status === 'good' ? 'green' : p.status === 'minor' ? 'amber' : p.status === 'major' ? 'red' : 'gray'} size="sm">
            {CONDITION.find((c) => c.key === p.status)!.label}
          </StatusBadge>
        </div>
      ))}
    </Card>
  );

  const issues = job.points.filter((p) => p.status === 'minor' || p.status === 'major').sort((a, b) => (a.status === 'major' ? -1 : 1) - (b.status === 'major' ? -1 : 1));
  const bodyFindings = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONDITION.map((c) => (
          <Card key={c.key} className="p-4">
            <p className="text-2xl font-bold" style={{ color: c.color }}>{counts[c.key]}</p>
            <p className="text-xs text-ink-500">{c.label}</p>
          </Card>
        ))}
      </div>
      {issues.length === 0 ? (
        <EmptyState title="No issues recorded" text="Everything checked so far is in good condition." />
      ) : (
        <Card className="divide-y divide-ivory-300/60 p-2">
          {issues.map((p) => (
            <button key={p.id} onClick={() => { setSelectedId(p.id); setTab('3d'); }} className="flex w-full items-center gap-3 px-3 py-3 text-left">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: markerLook(p, 'tech').color }} />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{p.label}</span>
                <span className="block text-xs text-ink-500">{p.damage} · {p.severity}{p.notes ? ` · ${p.notes}` : ''}</span>
              </span>
              <StatusBadge tone={p.status === 'major' ? 'red' : 'amber'} size="sm">{p.status === 'major' ? 'Major' : 'Minor'}</StatusBadge>
            </button>
          ))}
        </Card>
      )}
    </div>
  );

  return (
    <div ref={root}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          variant="underline"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: '3d', label: '3D View' },
            { value: 'photos', label: 'Photos' },
            { value: 'checklist', label: 'Checklist' },
            { value: 'findings', label: 'Findings' },
          ]}
        />
        <div className="flex gap-2.5">
          <button aria-label="Copy link" title="Share" className="btn btn-neu h-11 w-11 !rounded-xl" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.show('Link copied'); }}>
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Download report" title="Print / save as PDF" className="btn btn-neu h-11 w-11 !rounded-xl" onClick={() => window.print()}>
            <Download className="h-[18px] w-[18px]" />
          </button>
          <button aria-label="Fullscreen" title="Fullscreen" className="btn btn-neu h-11 w-11 !rounded-xl" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.())}>
            <Expand className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      {tab === '3d' && body3d}
      {tab === 'photos' && bodyPhotos}
      {tab === 'checklist' && bodyChecklist}
      {tab === 'findings' && bodyFindings}
      {toast.node}
    </div>
  );
}
