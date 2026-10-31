'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Box, CheckCircle2, Copy, Hand, LayoutGrid, MousePointer2, Plus, Redo2, Save, Trash2, Undo2, UploadCloud, X, ZoomIn, ZoomOut } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Button, Card, ConfirmDialog, Field, Input, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { discardLayoutDraft, publishLayout, saveLayoutDraft } from '@/lib/actions';
import { BAY_TYPES, EQUIPMENT, FIXTURE_KINDS, LIMITS, bayRect, bayType, cloneLayout, equipmentLabel, findFreeSpot, hasErrors, nextBayName, newId, occupantOf, r2, sameLayout, validateLayout } from '@/lib/layout';
import { useDb } from '@/lib/store';
import type { Bay, BayState, Fixture, FixtureKind, WorkshopLayout } from '@/lib/types';
import { FloorPlan } from './FloorPlan';
import type { FloorPlanHandle } from './FloorPlan';
import { NumField } from './NumField';
import { useLayoutHistory } from './useLayoutHistory';

const STATE_LABEL: Record<BayState, string> = { normal: 'Normal', maintenance: 'Maintenance', reserved: 'Reserved' };

export function LayoutStudio({ preview }: { preview?: (layout: WorkshopLayout, selectedId: string | null, onSelect: (id: string | null) => void) => React.ReactNode }) {
  const db = useDb();
  const toast = useToast();
  const g = db.garage;
  const published = useMemo<WorkshopLayout>(() => ({ plan: g.plan, bays: g.bays, fixtures: g.fixtures }), [g.plan, g.bays, g.fixtures]);
  const staleDraft = !!g.draft && g.draft.baseVersion !== g.layoutVersion;
  const h = useLayoutHistory(g.draft && !staleDraft ? cloneLayout(g.draft) : cloneLayout(published));
  const { layout } = h;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  const [snapOn, setSnapOn] = useState(true);
  const [view, setView] = useState<'plan' | '3d'>('plan');
  const [equipMenu, setEquipMenu] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const plan = useRef<FloorPlanHandle>(null);

  const issues = useMemo(() => validateLayout(layout), [layout]);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const dirty = !sameLayout(layout, published);
  const draftSaved = !!g.draft && !staleDraft && sameLayout(layout, g.draft);
  const bay = layout.bays.find((b) => b.id === selectedId);
  const fixture = layout.fixtures.find((f) => f.id === selectedId);

  // warn before leaving with edits that are not even saved as a draft
  useEffect(() => {
    if (!dirty || draftSaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, draftSaved]);

  /* ---------------- edits ---------------- */
  const setPlanField = (patch: Partial<WorkshopLayout['plan']>) => h.set({ ...layout, plan: { ...layout.plan, ...patch } });
  const patchBay = (id: string, patch: Partial<Bay>) => {
    setPublishErrors([]);
    h.set({ ...layout, bays: layout.bays.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  };
  const patchFixture = (id: string, patch: Partial<Fixture>) => h.set({ ...layout, fixtures: layout.fixtures.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  /** a free spot for w x h; if the floor is full, lengthen the workshop (never place on top of something) */
  const place = (w: number, hgt: number): { plan: WorkshopLayout['plan']; x: number; y: number; grew?: boolean } | undefined => {
    const spot = findFreeSpot(layout, w, hgt);
    if (spot) return { plan: layout.plan, ...spot };
    const nh = r2(layout.plan.h + hgt + 1);
    if (nh > LIMITS.maxDim || w > layout.plan.w) return undefined;
    const plan = { ...layout.plan, h: nh };
    const grown = findFreeSpot({ ...layout, plan }, w, hgt);
    return grown ? { plan, ...grown, grew: true } : undefined;
  };

  const addBay = () => {
    const w = 4.5, l = 7;
    const spot = place(w, l);
    if (!spot) {
      toast.show('No space for another bay. Move bays or enlarge the workshop first.');
      return;
    }
    const b: Bay = { id: newId('bay'), name: nextBayName(layout.bays), type: 'general', x: spot.x, y: spot.y, w, l, rot: 0, active: true, state: 'normal', equipment: [], notes: '' };
    h.set({ ...layout, plan: spot.plan, bays: [...layout.bays, b] });
    if (spot.grew) toast.show(`The floor was full, so the workshop is now ${spot.plan.h} m long. Undo to revert.`);
    setSelectedId(b.id);
    setTool('select');
  };
  const addFixture = (kind: FixtureKind) => {
    const k = FIXTURE_KINDS.find((x) => x.key === kind)!;
    const spot = kind === 'entrance' ? { plan: layout.plan, x: 0, y: Math.max(0, Math.round(layout.plan.h / 2 - k.h / 2)) } : place(k.w, k.h);
    setEquipMenu(false);
    if (!spot) {
      toast.show(`No free space for ${k.label.toLowerCase()}.`);
      return;
    }
    const f: Fixture = { id: newId('fx'), kind, name: k.label, x: spot.x, y: spot.y, w: k.w, h: k.h };
    h.set({ ...layout, plan: spot.plan, fixtures: [...layout.fixtures, f] });
    setSelectedId(f.id);
    setTool('select');
  };
  const duplicateBay = (b: Bay) => {
    const r = bayRect(b);
    const spot = place(r.w, r.h);
    if (!spot) {
      toast.show('No free space to duplicate this bay.');
      return;
    }
    const copy: Bay = { ...b, id: newId('bay'), name: nextBayName(layout.bays), x: spot.x, y: spot.y, equipment: [...b.equipment] };
    h.set({ ...layout, plan: spot.plan, bays: [...layout.bays, copy] });
    if (spot.grew) toast.show(`The floor was full, so the workshop is now ${spot.plan.h} m long. Undo to revert.`);
    setSelectedId(copy.id);
  };
  const deleteReason = (id: string): string | undefined => {
    const b = layout.bays.find((x) => x.id === id);
    if (!b) return undefined;
    const j = occupantOf(db.jobs, b.id);
    return j ? `${b.name} has job #${j.id}. Move the job to another bay, or switch the bay to inactive instead.` : undefined;
  };
  const requestDelete = (id: string) => {
    if (layout.fixtures.some((f) => f.id === id)) {
      h.set({ ...layout, fixtures: layout.fixtures.filter((f) => f.id !== id) });
      setSelectedId(null);
      return;
    }
    const why = deleteReason(id);
    if (why) toast.show(why);
    else setConfirmDel(id);
  };
  const doDelete = () => {
    if (!confirmDel) return;
    h.set({ ...layout, bays: layout.bays.filter((b) => b.id !== confirmDel) });
    setSelectedId(null);
  };

  /* ---------------- save / publish ---------------- */
  const saveDraft = () => {
    saveLayoutDraft(layout);
    toast.show('Draft saved. It is not live until you publish.');
  };
  const publish = () => {
    const res = publishLayout(layout);
    if (!res.ok) {
      setPublishErrors(res.errors);
      toast.show('Layout not published. Fix the issues listed below.');
      return;
    }
    setPublishErrors([]);
    toast.show('Layout published. The dashboard now shows it.');
  };
  const discard = () => {
    discardLayoutDraft();
    h.reset(cloneLayout(published));
    setSelectedId(null);
    setPublishErrors([]);
    toast.show('Changes discarded');
  };

  const status = staleDraft
    ? { tone: 'amber', text: 'A saved draft was started on an older layout and was ignored.' }
    : dirty
      ? { tone: 'amber', text: draftSaved ? 'Draft saved. Not published yet.' : 'Unsaved changes.' }
      : { tone: 'green', text: `Published (version ${g.layoutVersion})${g.publishedAt ? ` · ${new Date(g.publishedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}` };

  const toolBtn = (active: boolean) => clsx('flex h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition', active ? 'bg-gradient-to-b from-[#6b97bf] to-[#4f7ea8] text-white shadow-[0_6px_14px_rgba(79,126,168,0.35)]' : 'neu-sm text-ink-600 hover:-translate-y-0.5');

  return (
    <>
      <TopBar showUser />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight">Workshop Layout</h1>
          <p className="mt-0.5 text-[13px] text-ink-500">Design your workshop. Add bays, position equipment and preview in 3D.</p>
          <p className={clsx('mt-1.5 flex items-center gap-1.5 text-xs font-medium', status.tone === 'green' ? 'text-ok' : 'text-warn-strong')} aria-live="polite">
            {status.tone === 'green' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} {status.text}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {preview && (
            <div className="neu-in-sm flex gap-1 !rounded-xl p-1" role="tablist" aria-label="Preview mode">
              {([['plan', '2D Floor Plan', LayoutGrid], ['3d', '3D Preview', Box]] as const).map(([k, label, Icon]) => (
                <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={clsx('flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition', view === k ? 'tab-dark' : 'text-ink-500 hover:text-ink')}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          )}
          {dirty && <Button variant="neu" size="sm" onClick={discard}><X className="h-4 w-4" /> Discard</Button>}
          <Button variant="neu" onClick={saveDraft} disabled={!dirty || draftSaved}><Save className="h-4 w-4" /> Save Draft</Button>
          <Button onClick={publish} disabled={!dirty || hasErrors(issues)} title={hasErrors(issues) ? 'Fix the layout errors first' : undefined}><UploadCloud className="h-4 w-4" /> Publish Layout</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_290px]">
        {/* ---------- left: dimensions + tools ---------- */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-[15px] font-bold">Workshop Dimensions</h2>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Width (X)" value={layout.plan.w} min={LIMITS.minDim} max={LIMITS.maxDim} onCommit={(v) => setPlanField({ w: v })} />
              <NumField label="Length (Y)" value={layout.plan.h} min={LIMITS.minDim} max={LIMITS.maxDim} onCommit={(v) => setPlanField({ h: v })} />
              <NumField label="Wall Height" value={layout.plan.wallH} min={LIMITS.minWall} max={LIMITS.maxWall} onCommit={(v) => setPlanField({ wallH: v })} />
              <Field label="Grid Spacing">
                <Select aria-label="Grid spacing" value={layout.plan.grid} onChange={(e) => setPlanField({ grid: Number(e.target.value) })} className="!h-10 text-sm">
                  {[0.25, 0.5, 1].map((v) => <option key={v} value={v}>{v} m</option>)}
                </Select>
              </Field>
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-[15px] font-bold">Tools</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button className={toolBtn(true)} onClick={addBay} aria-label="Add bay"><Plus className="h-[18px] w-[18px]" />Add Bay</button>
              <div className="relative">
                <button className={clsx(toolBtn(false), 'w-full')} onClick={() => setEquipMenu((v) => !v)} aria-haspopup="menu" aria-expanded={equipMenu} aria-label="Add equipment"><Box className="h-[18px] w-[18px]" />Add Equipment</button>
                {equipMenu && (
                  <div role="menu" className="neu-sm slide-up absolute left-0 top-full z-30 mt-2 w-48 p-1.5">
                    {FIXTURE_KINDS.map((k) => (
                      <button key={k.key} role="menuitem" onClick={() => addFixture(k.key)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/70">{k.label}</button>
                    ))}
                    <p className="px-3 pb-1.5 pt-1 text-[11px] leading-snug text-ink-400">Lifts, balancers and diagnostic tools are set per bay in its properties.</p>
                  </div>
                )}
              </div>
              <button className={toolBtn(tool === 'select')} onClick={() => setTool('select')} aria-pressed={tool === 'select'} aria-label="Select tool"><MousePointer2 className="h-[18px] w-[18px]" />Select</button>
              <button className={toolBtn(tool === 'pan')} onClick={() => setTool('pan')} aria-pressed={tool === 'pan'} aria-label="Move tool (pan the view)"><Hand className="h-[18px] w-[18px]" />Move</button>
              <button className={toolBtn(false)} onClick={() => plan.current?.zoomIn()} aria-label="Zoom in"><ZoomIn className="h-[18px] w-[18px]" />Zoom In</button>
              <button className={toolBtn(false)} onClick={() => plan.current?.zoomOut()} aria-label="Zoom out"><ZoomOut className="h-[18px] w-[18px]" />Zoom Out</button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="btn btn-neu h-9 flex-1 text-xs" onClick={h.undo} disabled={!h.canUndo} aria-label="Undo"><Undo2 className="h-4 w-4" /> Undo</button>
              <button className="btn btn-neu h-9 flex-1 text-xs" onClick={h.redo} disabled={!h.canRedo} aria-label="Redo"><Redo2 className="h-4 w-4" /> Redo</button>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-ink-600">Snap to grid</span>
              <Toggle label="Snap to grid" checked={snapOn} onChange={setSnapOn} />
            </div>
          </Card>
        </div>

        {/* ---------- centre: canvas + validation ---------- */}
        <div className="min-w-0 space-y-4">
          <Card className="p-3">
            {view === 'plan' || !preview ? (
              <FloorPlan ref={plan} layout={layout} mode="edit" selectedId={selectedId} onSelect={setSelectedId} onChange={(l, commit) => h.set(l, commit)} onDelete={requestDelete} issues={issues} tool={tool} snapOn={snapOn} />
            ) : (
              preview(layout, selectedId, setSelectedId)
            )}
          </Card>
          <Card className="p-4" aria-live="polite">
            <h2 className="mb-2 text-[15px] font-bold">Layout Check</h2>
            {issues.length === 0 && publishErrors.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ok"><CheckCircle2 className="h-4 w-4" /> No problems found. {layout.bays.length} bays, {layout.fixtures.length} fixtures.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {errors.map((i, k) => <li key={`e${k}`} className="flex items-start gap-2 text-bad"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{i.message}</li>)}
                {warnings.map((i, k) => <li key={`w${k}`} className="flex items-start gap-2 text-warn-strong"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{i.message}</li>)}
                {publishErrors.filter((m) => !errors.some((e) => e.message === m)).map((m, k) => <li key={`p${k}`} className="flex items-start gap-2 text-bad"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{m}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-400">These checks help you plan the floor. They are not a safety or regulatory assessment.</p>
          </Card>
        </div>

        {/* ---------- right: properties ---------- */}
        <Card className="h-fit p-4" aria-label="Properties">
          {bay ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-[17px] font-bold">{bay.name}</h2>
                <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
                  <Toggle label={`${bay.name} active`} checked={bay.active} onChange={(v) => patchBay(bay.id, { active: v })} /> Active
                </label>
              </div>
              <Field label="Name"><Input aria-label="Bay name" value={bay.name} onChange={(e) => patchBay(bay.id, { name: e.target.value })} className="!h-10 text-sm" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select aria-label="Bay type" value={bay.type} onChange={(e) => patchBay(bay.id, { type: e.target.value as Bay['type'] })} className="!h-10 text-sm">
                    {BAY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select aria-label="Bay status" value={bay.state} onChange={(e) => patchBay(bay.id, { state: e.target.value as BayState })} className="!h-10 text-sm">
                    {(Object.keys(STATE_LABEL) as BayState[]).map((k) => <option key={k} value={k}>{STATE_LABEL[k]}</option>)}
                  </Select>
                </Field>
                <NumField label="Width" value={bay.w} min={LIMITS.minBay} max={LIMITS.maxBay} onCommit={(v) => patchBay(bay.id, { w: v })} />
                <NumField label="Length" value={bay.l} min={LIMITS.minBay} max={LIMITS.maxBay} onCommit={(v) => patchBay(bay.id, { l: v })} />
                <NumField label="Position X" value={bay.x} min={0} onCommit={(v) => patchBay(bay.id, { x: v })} />
                <NumField label="Position Y" value={bay.y} min={0} onCommit={(v) => patchBay(bay.id, { y: v })} />
              </div>
              <Field label="Rotation">
                <Select aria-label="Rotation" value={bay.rot} onChange={(e) => patchBay(bay.id, { rot: Number(e.target.value) as 0 | 90 })} className="!h-10 text-sm">
                  <option value={0}>0° (vehicle points up / down)</option>
                  <option value={90}>90° (vehicle points left / right)</option>
                </Select>
              </Field>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-500">Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                  {bay.equipment.map((k) => (
                    <span key={k} className="flex items-center gap-1 rounded-lg bg-coral-50 px-2 py-1 text-[11px] font-medium text-coral-700 ring-1 ring-coral-200">
                      {equipmentLabel(k)}
                      <button aria-label={`Remove ${equipmentLabel(k)}`} onClick={() => patchBay(bay.id, { equipment: bay.equipment.filter((x) => x !== k) })} className="text-coral-500 hover:text-coral-700"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {bay.equipment.length === 0 && <span className="text-xs text-ink-400">None</span>}
                </div>
                {EQUIPMENT.some((e) => !bay.equipment.includes(e.key)) && (
                  <Select aria-label="Add equipment to bay" value="" onChange={(e) => e.target.value && patchBay(bay.id, { equipment: [...bay.equipment, e.target.value] })} className="mt-2 !h-9 text-xs">
                    <option value="">+ Add equipment…</option>
                    {EQUIPMENT.filter((e) => !bay.equipment.includes(e.key)).map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </Select>
                )}
              </div>
              <Field label="Notes"><Textarea aria-label="Bay notes" value={bay.notes ?? ''} onChange={(e) => patchBay(bay.id, { notes: e.target.value })} placeholder="Add notes…" className="!min-h-[64px] text-sm" /></Field>
              {deleteReason(bay.id) && <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn-strong">{deleteReason(bay.id)}</p>}
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="neu" onClick={() => duplicateBay(bay)}><Copy className="h-4 w-4" /> Duplicate</Button>
                <Button variant="dark" onClick={() => requestDelete(bay.id)} disabled={!!deleteReason(bay.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </div>
          ) : fixture ? (
            <div className="space-y-3.5">
              <h2 className="text-[17px] font-bold">{fixture.name}</h2>
              <Field label="Name"><Input aria-label="Fixture name" value={fixture.name} onChange={(e) => patchFixture(fixture.id, { name: e.target.value })} className="!h-10 text-sm" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Width" value={fixture.w} min={0.3} onCommit={(v) => patchFixture(fixture.id, { w: v })} />
                <NumField label="Depth" value={fixture.h} min={0.3} onCommit={(v) => patchFixture(fixture.id, { h: v })} />
                <NumField label="Position X" value={fixture.x} min={0} onCommit={(v) => patchFixture(fixture.id, { x: v })} />
                <NumField label="Position Y" value={fixture.y} min={0} onCommit={(v) => patchFixture(fixture.id, { y: v })} />
              </div>
              <Button variant="dark" className="w-full" onClick={() => requestDelete(fixture.id)}><Trash2 className="h-4 w-4" /> Delete</Button>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-ink-400">
              <MousePointer2 className="mx-auto mb-2 h-6 w-6" />
              Select a bay or fixture on the plan to edit it.
              <p className="mt-3 text-xs">Drag to move, drag the handles to resize, or use the arrow keys (Shift for 1 m). Delete removes the selection.</p>
              <ul className="mt-5 space-y-1.5 text-left">
                {layout.bays.map((b) => (
                  <li key={b.id}>
                    <button onClick={() => setSelectedId(b.id)} className="neu-row flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px]">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: bayType(b.type).color }} />
                      <span className="flex-1 font-medium text-ink">{b.name}</span>
                      <span className="text-xs text-ink-400">{bayType(b.type).label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={doDelete} title="Remove this bay?" message="The bay is removed from the draft. You can undo it until you publish." confirmLabel="Remove bay" danger />
      {toast.node}
    </>
  );
}
