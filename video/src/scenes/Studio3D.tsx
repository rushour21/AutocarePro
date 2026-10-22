import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop } from '../components/Bits';
import { Callout, Chip } from '../components/Hud';
import { C, FPS, clamp01, cues, eout, lerp, prog, sp, track } from '../theme';
import { FilmWorld, project } from '../three/FilmWorld';
import type { WorldState } from '../three/FilmWorld';
import { ARRIVAL, LAYOUT, OCC, SHIFT, carPose } from '../three/world';
import { BAY9_FINAL } from './Studio';
import type { Bay } from '@/lib/types';
import { bayRect } from '@/lib/layout';

const S = cues.studio;

export const BAY9: Bay = { id: 'bay-9', name: 'Bay 9', type: 'tyre', x: BAY9_FINAL.x, y: BAY9_FINAL.y, w: 4.5, l: 7, rot: 0, active: true, state: 'normal', equipment: ['two_post_lift'], notes: '' };
export const LAYOUT9 = { plan: { ...LAYOUT.plan, h: 28 }, bays: [...LAYOUT.bays, BAY9], fixtures: LAYOUT.fixtures };

/** the finished workshop: everything parked and working, optionally with the new bay still popping in */
export function parkedWorld(camera: WorldState['camera'], bay9Pop = 1, bay9Lift = 1): WorldState {
  const cars: WorldState['cars'] = {}, liftRaise: Record<string, number> = {}, techs: Record<string, number> = {};
  ARRIVAL.forEach((id) => {
    const o = OCC[id];
    const p = carPose(o.bay, 1);
    const lift = o.bay.equipment.includes('two_post_lift') && o.bay.type !== 'wash';
    cars[id] = { carKey: o.carKey, x: p.x, z: p.z, yaw: p.yaw, y: 0.06 + (lift ? 0.89 : 0), visible: true };
    liftRaise[id] = lift ? 1 : 0;
    techs[id] = o.stage === 'in_repair' || o.stage === 'diagnostics' || o.stage === 'inspection' ? 1 : 0;
  });
  liftRaise['bay-9'] = bay9Lift;
  return { layout: LAYOUT9, floor: 1, walls: 1, props: 1, entrance: 1, bayPop: { 'bay-9': bay9Pop }, fixPop: {}, liftRaise, cars, techs, selected: bay9Pop > 0.05 ? 'bay-9' : null, camera };
}

export const Studio3D = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const camera = {
    az: track(frame, [[S.to3d, 28], [S.end, 64]]),
    el: track(frame, [[S.to3d, 40], [S.end, 33]]),
    fov: 14,
    frame: track(frame, [[S.to3d, 52], [S.end, 44]]),
    target: [15, 0.4, track(frame, [[S.to3d, 15], [S.end, 17]])] as [number, number, number],
  };
  const pop = sp(frame, S.to3d + 0.2, { damping: 11, stiffness: 120 });
  const lift = prog(frame, S.to3d + 0.7, S.to3d + 1.6);
  const world = parkedWorld(camera, pop, lift);
  const proj = (id: string, up: number) => {
    const b = LAYOUT9.bays.find((x) => x.id === id)!;
    const r = bayRect(b);
    const p = project(camera, [r.x + r.w / 2, up, r.y + r.h / 2]);
    return { x: p.x + SHIFT.x * 0.4, y: p.y + SHIFT.y * 0.4 };
  };
  const enter = eout(clamp01((t - S.to3d + 0.05) / 0.5));
  const outA = 1 - prog(frame, S.end - 0.15, S.end + 0.2);
  const chipIds = [...ARRIVAL, 'bay-7', 'bay-8', 'bay-9'];
  const b9 = proj('bay-9', 3.4);
  return (
    <AbsoluteFill style={{ opacity: enter * outA }}>
      <Backdrop tone="sky" t={t} />
      <AbsoluteFill style={{ transform: `translate(${SHIFT.x * 0.4}px, ${SHIFT.y * 0.4}px) scale(${lerp(1.12, 1, enter)})` }}>
        <FilmWorld state={world} />
      </AbsoluteFill>
      {chipIds.map((id, i) => {
        const o = OCC[id];
        const b = LAYOUT9.bays.find((x) => x.id === id)!;
        const lifted = b.equipment.includes('two_post_lift') && b.type !== 'wash' && (!!o || id === 'bay-9');
        const p = proj(id, o ? (lifted ? 4.1 : 3.0) : id === 'bay-9' ? 2.4 : 1.4);
        const ap = id === 'bay-9' ? sp(frame, S.to3d + 0.9, { damping: 12, stiffness: 170 }) : 1;
        return <Chip key={id} x={p.x} y={p.y} name={b.name} text={o ? o.chip : id === 'bay-7' ? 'Maintenance' : 'Available'} color={o ? o.color : id === 'bay-7' ? '#e5482d' : '#1d9d65'} pop={ap} selected={id === 'bay-9'} scale={1.15} />;
      })}
      <Callout at={S.to3d + 1.1} to={{ x: b9.x, y: b9.y + 60 }} from={{ x: b9.x + 380, y: b9.y + 150 }} text="New bay. Live." sub="Published a moment ago" hold={1.3} />
      <div style={{ position: 'absolute', left: 60, bottom: 80, opacity: clamp01((t - S.to3d - 0.5) / 0.3) }}>
        <div style={{ background: C.ink, color: '#fff', borderRadius: 20, padding: '14px 28px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: '0 16px 40px rgba(20,20,30,0.35)' }}>Instantly on the floor.</div>
      </div>
    </AbsoluteFill>
  );
};
