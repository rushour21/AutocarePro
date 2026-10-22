'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, Clock3, ClipboardList, Hand, Maximize2, Minimize2, Minus, Package, Plus, RotateCcw, Settings, Sun, UserPlus, Wrench } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, ProgressBar, StatusBadge, VehicleImage, useToast } from '@/components/ui';
import { setJobStage } from '@/lib/actions';
import { useSession } from '@/lib/auth';
import { STAGE_LABEL, STAGE_TONE, estimateTotals, inr, isActive, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { BAY_STATUS_LABEL, bayType, occupantOf } from '@/lib/layout';
import type { BayStatus } from '@/lib/layout';
import { useDb } from '@/lib/store';
import type { Stage, WorkshopLayout } from '@/lib/types';
import { AssignJob } from '../AssignJob';
import { FloorPlan } from '../layout/FloorPlan';
import type { BayOccupant } from '../layout/FloorPlan';
import { Workshop3D } from '../three/Workshop3D';
import type { SceneApi } from '../three/WorkshopScene3D';
import { STATUS_COLOR, useBayLive } from '../three/useLive';
import { useUpdated } from '../three/useUpdated';

const STAGES: Stage[] = ['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'];

function useMedia(q: string) {
  const [d, setD] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setD(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return d;
}

const glass = 'rounded-2xl bg-white/85 shadow-[0_10px_30px_rgba(60,75,100,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 backdrop-blur-md';

/** The admin dashboard: the workshop fills the page and everything else floats on top of it. */
export function LiveHero() {
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const desktop = useMedia('(min-width: 1024px)');
  const short = useMedia('(min-width: 1024px) and (max-height: 860px)');
  const api = useRef<SceneApi | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState<'2d' | '3d'>('3d');
  const [pan, setPan] = useState(false);
  const [full, setFull] = useState(false);
  const [tab, setTab] = useState<'overview' | 'details' | 'timeline'>('overview');
  const [menu, setMenu] = useState(false);

  const layout = useMemo<WorkshopLayout>(() => ({ plan: db.garage.plan, bays: db.garage.bays, fixtures: db.garage.fixtures }), [db.garage.plan, db.garage.bays, db.garage.fixtures]);
  const live = useBayLive(layout);
  const updated = useUpdated(db.jobs, db.garage.layoutVersion);
  const firstBusy = layout.bays.find((b) => occupantOf(db.jobs, b.id))?.id ?? layout.bays[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstBusy);
  const bay = layout.bays.find((b) => b.id === selectedId);
  const job = bay ? occupantOf(db.jobs, bay.id) : undefined;
  const veh = job ? vehicleOf(db, job.vehicleId) : undefined;
  const tech = job ? userOf(db, job.techId) : undefined;
  const st: BayStatus | undefined = bay ? live.status[bay.id] : undefined;

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  useEffect(() => { setTab('overview'); setMenu(false); }, [selectedId]);

  /* ---------------- numbers ---------------- */
  const active = db.jobs.filter(isActive);
  const awaiting = db.estimates.filter((e) => e.status === 'Awaiting Approval');
  const pending = awaiting.reduce((s, e) => s + estimateTotals(e.items).subtotal, 0);
  const dueToday = active.filter((j) => j.dueIn === 0);
  const doneToday = db.jobs.filter((j) => j.stage === 'delivered' && j.completedOn && db.today.includes(j.completedOn.split(',')[0].trim())).length;
  const group = (s: Stage[]) => active.filter((j) => s.includes(j.stage)).length;
  const schedule = active
    .filter((j) => j.slot)
    .sort((a, b) => a.slot!.start - b.slot!.start)
    .slice(0, short ? 3 : 5)
    .map((j) => ({ job: j, time: hhmm(j.slot!.start), status: j.stage === 'pending' ? 'Scheduled' : j.stage === 'in_repair' || j.stage === 'quality_check' ? 'In Progress' : 'Pending' }));

  const stats: { icon: React.ElementType; tone: string; label: string; value: number | string; sub?: string; trend?: { up: boolean; n: number }; href: string }[] = [
    { icon: ClipboardList, tone: 'bg-coral-100 text-coral-500', label: 'Active jobs', value: active.length, trend: { up: true, n: 2 }, href: '/admin/jobs' },
    { icon: CircleDollarSign, tone: 'bg-warn-soft text-warn', label: 'Awaiting approval', value: awaiting.length, sub: inr(pending), trend: { up: false, n: 1 }, href: '/admin/estimates?status=awaiting' },
    { icon: Clock3, tone: 'bg-info-soft text-info', label: 'Due today', value: dueToday.length, trend: { up: true, n: 2 }, href: '/admin/jobs?due=today' },
    { icon: CheckCircle2, tone: 'bg-ok-soft text-ok', label: 'Completed today', value: doneToday, trend: { up: true, n: 4 }, href: '/admin/jobs' },
  ];

  const occ = useMemo(() => Object.fromEntries(Object.entries(live.occupants).map(([k, v]) => [k, v && ({ carKey: v.carKey, title: v.title } as BayOccupant)])), [live.occupants]);
  const statusTile = (s: BayStatus, label: string, n: number) => (
    <button
      key={s}
      onClick={() => { const b = layout.bays.find((x) => live.status[x.id] === s); if (b) setSelectedId(b.id); else toast.show(`No bays are ${label.toLowerCase()} right now.`); }}
      className="flex flex-1 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-left transition hover:-translate-y-0.5"
      style={{ background: `${STATUS_COLOR[s]}14` }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: STATUS_COLOR[s] }}>{n}</span>
      <span className="text-[11.5px] font-semibold" style={{ color: STATUS_COLOR[s] }}>{label}</span>
    </button>
  );
  const jobTile = (label: string, n: number, color: string) => (
    <div key={label} className="flex flex-1 items-center gap-1.5 whitespace-nowrap px-0.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>{n}</span>
      <span className="text-[11.5px] font-medium text-ink-600">{label}</span>
    </div>
  );
  const quick: { icon: React.ElementType; label: string; href?: string; on?: () => void }[] = [
    { icon: Plus, label: 'Add Job', href: '/admin/jobs/new' },
    { icon: UserPlus, label: 'Assign Bay', on: () => { const b = layout.bays.find((x) => live.status[x.id] === 'available'); if (b) { setSelectedId(b.id); toast.show(`${b.name} is free. Choose a job in the panel.`); } else toast.show('No free bays right now.'); } },
    { icon: Package, label: 'Inventory', href: '/admin/inventory' },
    { icon: BarChart3, label: 'View Reports', href: '/admin/reports' },
  ];

  const ctl = 'flex h-11 w-11 items-center justify-center rounded-xl text-ink-600 transition hover:bg-white';

  return (
    <div ref={wrap} className={clsx('relative lg:-m-5 lg:h-[calc(100vh-2rem)] lg:min-h-[700px] lg:overflow-hidden lg:rounded-[26px]', full && '!m-0 !h-screen !rounded-none')}>
      {/* ---------- top: search, greeting, KPIs ---------- */}
      <div className="relative z-20 pb-3 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:top-0 lg:p-5 lg:pb-0">
        <div className="lg:pointer-events-auto">
          <TopBar
            showUser
            className="!mb-3"
            search={{ value: q, onChange: setQ, placeholder: 'Search by customer, vehicle, job number...', onSubmit: () => router.push(`/admin/jobs?q=${encodeURIComponent(q)}`) }}
            right={
              <>
                <span className="neu-sm flex items-center gap-2 px-3.5 py-2 text-xs text-ink-600"><CalendarDays className="h-4 w-4 text-ink-500" /> {db.today}</span>
                {/* decorative demo reading: there is no weather integration */}
                <span title="Demo value" className="neu-sm flex items-center gap-2 px-3.5 py-2 text-xs font-semibold"><Sun className="h-4 w-4 text-warn" /> 28°C</span>
              </>
            }
          />
        </div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 lg:pointer-events-none">
          <div className="lg:pointer-events-auto">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">Good morning, {user?.name.split(' ')[0]} <span className="inline-block">👋</span></h1>
            <p className="mt-0.5 text-[13px] text-ink-500">Here&apos;s your workshop. Everything in one view.</p>
          </div>
          <div className="flex items-center gap-2.5 lg:pointer-events-auto">
            <Link href="/admin/settings/workshop" className="btn btn-neu h-10 px-4 text-sm"><Settings className="h-4 w-4" /> View Settings</Link>
            <Link href="/admin/jobs/new" className="btn btn-coral h-10 px-5 text-sm"><Plus className="h-4 w-4" /> New Job</Link>
          </div>
        </div>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:pointer-events-auto lg:w-[calc(100%-372px)]" aria-label="Summary">
          {stats.map(({ icon: Icon, tone, label, value, sub, trend, href }) => (
            <Link key={label} href={href} className={clsx(glass, 'flex items-center gap-3 px-3.5 py-3 transition hover:-translate-y-0.5')}>
              <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 ring-white/70', tone)}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold tracking-tight">{value}</span>
                  {trend && <span title="Demo value" className={clsx('text-[11px] font-semibold', trend.up ? 'text-ok' : 'text-bad')}>{trend.up ? '↑' : '↓'} {trend.n}</span>}
                </span>
                <span className="block truncate text-xs text-ink-500">{label}</span>
                {sub && <span className="block text-[11px] font-medium text-bad">{sub}</span>}
              </span>
            </Link>
          ))}
        </section>
      </div>

      {/* ---------- the workshop ---------- */}
      <div className="relative z-0 mt-1 h-[400px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#eef3fa] to-[#d9e2ef] sm:h-[500px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto lg:rounded-none">
        {view === '3d' ? (
          <Workshop3D layout={layout} occupants={live.occupants} idle={live.idle} selectedId={selectedId} onSelect={(id) => id && setSelectedId(id)} interactive={desktop} panMode={pan} apiRef={api} padding={desktop ? { top: 190, right: 372, bottom: 112, left: 76 } : undefined} />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 lg:pb-[116px] lg:pl-[84px] lg:pr-[384px] lg:pt-[196px]">
            <FloorPlan layout={layout} mode="view" selectedId={selectedId} onSelect={(id) => id && setSelectedId(id)} occupants={occ} className="max-h-full" />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] text-ink-500 backdrop-blur lg:hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Live · {updated}
        </div>
      </div>

      {/* ---------- left controls ---------- */}
      <div className="absolute left-3 top-[218px] z-20 hidden flex-col gap-3 lg:flex" role="toolbar" aria-label="Workshop view controls">
        <div className={clsx(glass, 'flex flex-col gap-1 p-1.5')} role="tablist" aria-label="View mode">
          {(['2d', '3d'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={clsx('flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition', view === v ? 'bg-[#2563eb] text-white shadow-[0_6px_14px_rgba(37,99,235,0.35)]' : 'text-ink-700 hover:bg-white')}>{v.toUpperCase()}</button>
          ))}
        </div>
        <div className={clsx(glass, 'flex flex-col gap-1 p-1.5')}>
          <button className={clsx(ctl, pan && '!bg-[#2563eb] text-white')} aria-label="Move (pan) mode" aria-pressed={pan} title="Pan: drag to move the view" onClick={() => setPan((p) => !p)} disabled={view === '2d'}><Hand className="h-[18px] w-[18px]" /></button>
          <button className={ctl} aria-label="Zoom in" title="Zoom in" onClick={() => api.current?.zoomIn()} disabled={view === '2d'}><Plus className="h-[18px] w-[18px]" /></button>
          <button className={ctl} aria-label="Zoom out" title="Zoom out" onClick={() => api.current?.zoomOut()} disabled={view === '2d'}><Minus className="h-[18px] w-[18px]" /></button>
          <button className={ctl} aria-label="Reset view" title="Reset view" onClick={() => api.current?.reset()} disabled={view === '2d'}><RotateCcw className="h-[18px] w-[18px]" /></button>
          <button className={ctl} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} title={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}>{full ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}</button>
        </div>
        <div className={clsx(glass, 'w-[56px] px-1.5 py-2 text-center')} aria-live="polite" title="Data is kept in this browser, so this is when this page last saw a change.">
          <span className="flex items-center justify-center gap-1 text-[11px] font-bold"><span className="h-2 w-2 rounded-full bg-ok" /> Live</span>
          <span className="mt-0.5 block text-[9px] leading-tight text-ink-500">{updated.replace('Updated ', '')}</span>
        </div>
      </div>

      {/* ---------- right column: bay panel + schedule ---------- */}
      <div className="relative z-20 mt-4 flex flex-col gap-3 lg:pointer-events-none lg:absolute lg:bottom-[112px] lg:right-5 lg:top-[146px] lg:mt-0 lg:w-[352px] lg:overflow-y-auto lg:pr-0.5 thin-scroll">
        <section className={clsx(glass, 'p-4 lg:pointer-events-auto')} aria-label="Selected bay">
          {bay ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="min-w-0 truncate text-[16px] font-bold">{bay.name} <span className="font-medium text-ink-500">– {bayType(bay.type).label}</span></h2>
                {job ? <StatusBadge tone={STAGE_TONE[job.stage]} dot size="sm">{STAGE_LABEL[job.stage]}</StatusBadge> : st && <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: STATUS_COLOR[st], background: `${STATUS_COLOR[st]}1f` }}>{BAY_STATUS_LABEL[st]}</span>}
              </div>
              {job && veh ? (
                <>
                  <div className="mt-3 flex gap-1 rounded-xl bg-[#e9eef6] p-1 text-xs font-semibold" role="tablist" aria-label="Bay details">
                    {([['overview', 'Overview'], ['details', 'Job Details'], ['timeline', 'Timeline']] as const).map(([k, l]) => (
                      <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('h-8 flex-1 rounded-lg transition', tab === k ? 'bg-white text-ink shadow-neu-xs' : 'text-ink-500 hover:text-ink')}>{l}</button>
                    ))}
                  </div>
                  {tab === 'overview' && (
                    <div className="mt-3 space-y-2.5 text-[13px]">
                      <div className="flex items-center gap-3 rounded-xl bg-white/70 p-2.5">
                        <VehicleImage carKey={veh.carKey} className="h-11 w-[72px]" />
                        <div className="min-w-0 flex-1 leading-tight"><p className="truncate font-bold">{vehicleName(veh)}</p><p className="text-xs text-ink-500">{veh.reg}</p></div>
                        <span className="rounded-md bg-info-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-info">Job #{job.id}</span>
                      </div>
                      <Row icon={<Wrench className="h-4 w-4" />} k="Service Type" v={job.service} />
                      <div className="flex items-center gap-3"><Avatar src={tech?.avatar} name={tech?.name} size={32} /><div className="leading-tight"><p className="text-[11px] text-ink-500">Technician</p><p className="font-semibold">{tech?.name ?? 'Unassigned'}</p></div></div>
                      {!short && <Row icon={<Clock3 className="h-4 w-4" />} k="Started" v={job.startedLabel} />}
                      <Row icon={<Clock3 className="h-4 w-4" />} k="Est. Completion" v={job.estCompletionDate} />
                      <div className="flex items-center gap-3"><ProgressBar value={job.progress} className="flex-1" /><span className="text-xs font-semibold text-ink-600">{job.progress}%</span></div>
                    </div>
                  )}
                  {tab === 'details' && (
                    <ul className="mt-3 space-y-1.5 text-[13px]" aria-label="Tasks">
                      {job.tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-1.5"><span className={clsx('h-2 w-2 rounded-full', t.status === 'Completed' ? 'bg-ok' : t.status === 'In Progress' ? 'bg-warn' : 'bg-ink-200')} /><span className="flex-1 truncate">{t.title}</span><span className="text-[11px] text-ink-500">{t.status}</span></li>
                      ))}
                      <li className="px-1 pt-1 text-xs text-ink-500">Priority: <b className="text-ink-700">{job.priority}</b></li>
                    </ul>
                  )}
                  {tab === 'timeline' && (
                    <ul className="mt-3 space-y-2 text-[13px]" aria-label="Activity">
                      {job.activity.slice(0, 5).map((a) => (
                        <li key={a.id} className="rounded-lg bg-white/70 px-2.5 py-1.5"><p className="leading-snug">{a.text}</p><p className="text-[11px] text-ink-500">{a.by} · {a.at}</p></li>
                      ))}
                    </ul>
                  )}
                  <div className="relative mt-3 flex gap-2.5">
                    <Link href={`/admin/jobs/${job.id}`} className="btn btn-neu h-10 flex-1 text-sm">View Job</Link>
                    <div className="relative flex flex-[1.5]">
                      <button className="btn btn-dark h-10 flex-1 text-sm" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>Update Status <ChevronDown className="h-4 w-4" /></button>
                      {menu && (
                        <div role="menu" className="neu-sm slide-up absolute bottom-full right-0 z-30 mb-2 w-48 p-1.5">
                          {STAGES.map((s) => (
                            <button key={s} role="menuitem" onClick={() => { setJobStage(job.id, s, 'Admin'); setMenu(false); toast.show(`#${job.id} moved to ${STAGE_LABEL[s]}`); }} className={clsx('block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/70', job.stage === s && 'font-semibold text-coral-600')}>{STAGE_LABEL[s]}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-3 text-sm">
                  {st === 'available' && (<><p className="text-ink-500">{bay.name} is free. Assign an active job to bring its vehicle onto the floor.</p><AssignJob bay={bay} notify={toast.show} /></>)}
                  {st === 'maintenance' && <p className="text-ink-500">{bay.name} is under maintenance and cannot take jobs. Change its status in <Link className="font-semibold text-coral-600 underline" href="/admin/settings/workshop">Workshop Layout</Link>.</p>}
                  {st === 'reserved' && <p className="text-ink-500">{bay.name} is reserved. Change its status in <Link className="font-semibold text-coral-600 underline" href="/admin/settings/workshop">Workshop Layout</Link> to release it.</p>}
                  {st === 'inactive' && <p className="text-ink-500">{bay.name} is inactive. Turn it on in <Link className="font-semibold text-coral-600 underline" href="/admin/settings/workshop">Workshop Layout</Link>.</p>}
                  {bay.equipment.length > 0 && <p className="text-xs text-ink-400">Equipment: {bay.equipment.length} item{bay.equipment.length === 1 ? '' : 's'}</p>}
                </div>
              )}
            </>
          ) : (
            <p className="py-6 text-center text-sm text-ink-400">Select a bay to see its details.</p>
          )}
        </section>

        <section className={clsx(glass, 'p-4 lg:pointer-events-auto')} aria-label="Today's schedule">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Today&apos;s Schedule</h2>
            <Link href="/admin/calendar" className="flex items-center gap-1 text-xs font-medium text-coral-600 hover:underline">View All <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ul>
            {schedule.map(({ job: j, time, status }) => {
              const v = vehicleOf(db, j.vehicleId);
              const tone = status === 'In Progress' ? 'bg-info-soft text-info' : status === 'Pending' ? 'bg-warn-soft text-coral-600' : 'bg-[#efe8de] text-ink-500';
              return (
                <li key={j.id}>
                  <Link href={`/admin/jobs/${j.id}`} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-white/60">
                    <span className="w-[62px] shrink-0 text-[11px] text-ink-500">{time}</span>
                    {v && <VehicleImage carKey={v.carKey} className="h-7 w-12 shrink-0" />}
                    <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-xs font-semibold">{vehicleName(v)}</span><span className="block truncate text-[10.5px] text-ink-400">{j.service}</span></span>
                    <span className={clsx('rounded-lg px-2 py-1 text-[10px] font-semibold', tone)}>{status}</span>
                  </Link>
                </li>
              );
            })}
            {schedule.length === 0 && <li className="py-4 text-center text-sm text-ink-400">Nothing scheduled today.</li>}
          </ul>
        </section>
      </div>

      {/* ---------- bottom bar ---------- */}
      <div className={clsx(glass, 'relative z-20 mt-4 grid gap-4 p-3 lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:mt-0 lg:grid-cols-[1.15fr_1.35fr_1fr] lg:items-center')}>
        <div>
          <p className="mb-1.5 text-[13px] font-bold">Bay Status</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {statusTile('in_use', 'In Use', live.counts.in_use)}
            {statusTile('available', 'Available', live.counts.available)}
            {statusTile('maintenance', 'Maintenance', live.counts.maintenance)}
            {statusTile('reserved', 'Reserved', live.counts.reserved)}
          </div>
        </div>
        <div className="lg:border-l lg:border-ivory-300/70 lg:pl-4">
          <p className="mb-1.5 text-[13px] font-bold">Active Jobs</p>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-1">
            {jobTile('Total', active.length, '#2f6bff')}
            {jobTile('Inspection', group(['inspection']), '#2f6bff')}
            {jobTile('Diagnostics', group(['diagnostics']), '#7456f0')}
            {jobTile('In Repair', group(['in_repair']), '#f26a2e')}
            {jobTile('Others', group(['quality_check', 'ready', 'pending']), '#8d8d90')}
          </div>
        </div>
        <div className="lg:border-l lg:border-ivory-300/70 lg:pl-4">
          <p className="mb-1.5 text-[13px] font-bold">Quick Actions</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {quick.map(({ icon: Icon, label, href, on }) => {
              const inner = (<><Icon className="h-[17px] w-[17px] text-ink-700" /><span className="mt-1 hidden text-[10.5px] font-medium leading-tight min-[1500px]:block max-lg:block">{label}</span></>);
              const cls = 'neu-sm flex h-[58px] flex-col items-center justify-center !rounded-xl px-1 text-center transition hover:-translate-y-0.5';
              return href ? <Link key={label} href={href} className={cls} aria-label={label} title={label}>{inner}</Link> : <button key={label} onClick={on} className={cls} aria-label={label} title={label}>{inner}</button>;
            })}
          </div>
        </div>
      </div>
      {toast.node}
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-500">{icon}</span>
      <div className="min-w-0 leading-tight"><p className="text-[11px] text-ink-500">{k}</p><p className="truncate font-semibold">{v}</p></div>
    </div>
  );
}

const hhmm = (h: number) => {
  const hr = Math.floor(h), m = Math.round((h - hr) * 60);
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${hr >= 12 ? 'PM' : 'AM'}`;
};
