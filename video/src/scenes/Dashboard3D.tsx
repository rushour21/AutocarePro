import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Activity, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardList } from 'lucide-react';
import { Backdrop, Enter, Sprite } from '../components/Bits';
import { Cursor } from '../components/Cursor';
import type { CursorKey } from '../components/Cursor';
import { Callout, Chip, Kpi } from '../components/Hud';
import { Kinetic } from '../components/Kinetic';
import { C, FPS, clamp01, cues, eout, prog, sp, track } from '../theme';
import { FilmWorld, project } from '../three/FilmWorld';
import { ARRIVAL, LAYOUT, OCC, SHIFT, revealCamera, revealWorld } from '../three/world';

const R = cues.reveal, I = cues.interact;

// where the HUD sits (1920 x 1080 space)
const PANEL = { x: 1499, y: 168, w: 350, k: 1.1 };
const SCHED = { x: 1499, y: 612, w: 350, k: 1.1 };
const BOTTOM = { x: 40, y: 928, w: 1246, k: 1.2 };
const CONTROLS = { x: 36, y: 292, w: 56, k: 1.2 };

export const Dashboard3D = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const camera = revealCamera(frame);
  const world = { ...revealWorld(frame, camera), selected: t > I.clickBay2 ? 'bay-2' : null };
  const at = (b: string, up = 3.1) => {
    const r = LAYOUT.bays.find((x) => x.id === b)!;
    const p = project(camera, [r.x + r.w / 2, up, r.y + r.l / 2]);
    return { x: p.x + SHIFT.x, y: p.y + SHIFT.y };
  };

  // bay 2 flips to "In Repair" when the status menu item is picked
  const repaired = t > I.pick + 0.15;
  const panelName = t < I.clickBay2 + 0.1 ? 'panel_bay1' : t < I.pick + 0.15 ? (t > I.menu ? 'panel_menu' : 'panel_bay2') : 'panel_bay2_repair';
  const panelPrev = t < I.clickBay2 + 0.1 ? null : 'panel_bay1';

  // chips
  const chips = [...ARRIVAL, 'bay-7', 'bay-8'].map((id, i) => {
    const b = LAYOUT.bays.find((x) => x.id === id)!;
    const o = OCC[id];
    const lifted = b.equipment.includes('two_post_lift') && b.type !== 'wash' && !!o;
    const pos = at(id, o ? (lifted ? 4.1 : 3.0) : 1.4);
    const pop = sp(frame, R.chips + i * 0.12, { damping: 12, stiffness: 170 });
    const isRepair = id === 'bay-2' && repaired;
    return { id, pos, pop, name: b.name, text: isRepair ? 'In Repair' : o ? o.chip : id === 'bay-7' ? 'Maintenance' : 'Available', color: isRepair ? '#f26a2e' : o ? o.color : id === 'bay-7' ? '#e5482d' : '#1d9d65', selected: id === 'bay-2' && t > I.clickBay2 };
  });

  // cursor path: in from the right, click bay 2 chip, to Update Status, pick In Repair
  const bay2 = at('bay-2', 4.1);
  const upd = { x: PANEL.x + 270, y: PANEL.y + 392 };
  const pick = { x: PANEL.x + 130, y: PANEL.y + 262 };
  const keys: CursorKey[] = [
    { t: I.cursorIn - 0.6, x: 1250, y: 780 },
    { t: I.clickBay2, x: bay2.x + 6, y: bay2.y + 4, click: true },
    { t: I.menu - 0.25, x: upd.x, y: upd.y },
    { t: I.menu, x: upd.x, y: upd.y, click: true },
    { t: I.pick - 0.2, x: pick.x, y: pick.y },
    { t: I.pick, x: pick.x, y: pick.y, click: true },
    { t: I.pick + 0.9, x: 1250, y: 760 },
  ];
  const cursorShow = clamp01((t - (I.cursorIn - 0.6)) / 0.3) * (1 - prog(frame, I.pick + 0.6, I.pick + 1.2));

  // narrated highlights (L5)
  const ringTargets = [
    { at: R.ring[0], to: at('bay-2', 1.6), from: { x: 470, y: 372 }, text: 'Every vehicle' },
    { at: R.ring[1], to: (() => { const p = project(camera, [5.0, 1.2, 7.0]); return { x: p.x + SHIFT.x, y: p.y + SHIFT.y }; })(), from: { x: 360, y: 800 }, text: 'Every technician' },
    { at: R.ring[2], to: at('bay-4', 3.4), from: { x: 1255, y: 740 }, text: 'Every stage' },
  ];
  const wideP = prog(frame, R.ring[3], R.ring[3] + 0.5, eout) * (1 - prog(frame, R.ring[3] + 1.1, R.ring[3] + 1.5));

  const uiAt = R.ui;
  return (
    <AbsoluteFill>
      <Backdrop tone="sky" t={t} />
      <AbsoluteFill style={{ transform: `translate(${SHIFT.x}px, ${SHIFT.y}px)` }}>
        <FilmWorld state={world} />
      </AbsoluteFill>
      {chips.map((c) => <Chip key={c.id} x={c.pos.x} y={c.pos.y} name={c.name} text={c.text} color={c.color} pop={c.pop} selected={c.selected} flash={wideP} />)}

      {/* HUD */}
      <Enter at={uiAt} dy={-40}><Sprite name="topbar" x={40} y={26} w={1246} k={1.1} /></Enter>
      <Enter at={uiAt + 0.1} dy={-30}><Sprite name="greeting" x={40} y={96} w={291} k={1.15} /></Enter>
      <Enter at={uiAt + 0.2} dy={-30}><Sprite name="buttons" x={1884 - 248 * 1.1} y={106} w={248} k={1.1} /></Enter>
      <Kpi at={uiAt + 0.3} x={40} y={176} icon={<ClipboardList size={26} color={C.coral} />} tint="#ffe6d8" value={18} label="Active jobs" trend={{ up: true, n: 2 }} count={[R.count, R.count + 1.0]} />
      <Kpi at={uiAt + 0.4} x={308} y={176} icon={<CircleDollarSign size={26} color={C.amber} />} tint="#ffe9c9" value={4} label="Awaiting approval" sub="₹1,28,000" trend={{ up: false, n: 1 }} count={[R.count + 0.1, R.count + 0.9]} />
      <Kpi at={uiAt + 0.5} x={576} y={176} icon={<CalendarClock size={26} color={C.blue} />} tint="#e4ecff" value={3} label="Due today" trend={{ up: true, n: 2 }} count={[R.count + 0.2, R.count + 0.8]} />
      <Kpi at={uiAt + 0.6} x={844} y={176} icon={<CheckCircle2 size={26} color={C.green} />} tint="#d9f3e5" value={0} label="Completed today" trend={{ up: true, n: 4 }} count={[R.count + 0.3, R.count + 0.9]} />
      <Enter at={uiAt + 0.5} dx={-50} dy={0}><Sprite name="controls" x={CONTROLS.x} y={CONTROLS.y} w={CONTROLS.w} k={CONTROLS.k} /></Enter>
      <Enter at={uiAt + 0.45} dx={80} dy={0}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {panelPrev && <Sprite name={panelPrev} x={PANEL.x} y={PANEL.y} w={PANEL.w} k={PANEL.k} style={{ opacity: 1 - prog(frame, I.clickBay2, I.clickBay2 + 0.25) }} />}
          <Sprite name={panelName} x={PANEL.x} y={PANEL.y} w={PANEL.w} k={PANEL.k} style={{ opacity: panelPrev ? prog(frame, I.clickBay2, I.clickBay2 + 0.25) : 1 }} />
        </div>
      </Enter>
      <Enter at={uiAt + 0.7} dx={80} dy={0}><Sprite name="schedule" x={SCHED.x} y={SCHED.y} w={SCHED.w} k={SCHED.k} /></Enter>
      <Enter at={uiAt + 0.8} dy={70}><Sprite name="bottombar" x={BOTTOM.x} y={BOTTOM.y} w={BOTTOM.w} k={BOTTOM.k} /></Enter>

      {ringTargets.map((r) => <Callout key={r.text} at={r.at} to={r.to} from={r.from} text={r.text} hold={0.85} />)}
      {wideP > 0.01 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 175, display: 'flex', justifyContent: 'center', paddingRight: 300, opacity: wideP, transform: `translateY(${(1 - wideP) * 20}px)` }}>
          <div style={{ background: C.ink, color: '#fff', borderRadius: 20, padding: '12px 28px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: '0 16px 40px rgba(20,20,30,0.4)' }}>At a glance.</div>
        </div>
      )}

      {/* interaction */}
      <Cursor keys={keys} visible={cursorShow} />
      {t > I.oneClick - 0.1 && (
        <div style={{ position: 'absolute', left: 60, bottom: 190, opacity: clamp01((t - I.oneClick) / 0.2) * (1 - prog(frame, I.end - 0.5, I.end - 0.1)) }}>
          <Kinetic size={88} words={[{ text: 'One', at: I.oneClick }, { text: 'click.', at: I.oneClick + 0.18, color: C.coral }]} />
        </div>
      )}
      {t < R.start + 0.2 && <div />}
      <Activity size={0} />
    </AbsoluteFill>
  );
};
