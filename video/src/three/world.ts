import { Easing } from 'remotion';
import { createSeed } from '@/lib/seed';
import { STAGE_LABEL, vehicleName, vehicleOf } from '@/lib/format';
import { bayRect, occupantOf } from '@/lib/layout';
import type { Bay, CarKey, Stage, WorkshopLayout } from '@/lib/types';
import { FPS, cues, eio, prog, sp, track } from '../theme';
import type { CameraState, WorldState } from './FilmWorld';

/** the film uses the app's own demo data, so what is on screen is what the product shows */
export const seed = createSeed();
export const LAYOUT: WorkshopLayout = { plan: seed.garage.plan, bays: seed.garage.bays, fixtures: seed.garage.fixtures };

export const STAGE_COLOR: Record<Stage, string> = { pending: '#e5482d', inspection: '#2f6bff', diagnostics: '#7456f0', in_repair: '#f26a2e', quality_check: '#ee8a12', ready: '#1d9d65', delivered: '#1d9d65' };

export interface BayInfo {
  bay: Bay;
  carKey: CarKey;
  title: string;
  chip: string;
  color: string;
  stage: Stage;
  jobId: string;
}
export const OCC: Record<string, BayInfo> = {};
LAYOUT.bays.forEach((b) => {
  const j = occupantOf(seed.jobs, b.id);
  const v = j ? vehicleOf(seed, j.vehicleId) : undefined;
  if (j && v) OCC[b.id] = { bay: b, carKey: v.carKey, title: vehicleName(v), chip: STAGE_LABEL[j.stage], color: STAGE_COLOR[j.stage], stage: j.stage, jobId: j.id };
});
/** far bays arrive first so nobody drives through anybody */
export const ARRIVAL = ['bay-4', 'bay-3', 'bay-2', 'bay-1', 'bay-5', 'bay-6'].filter((id) => OCC[id]);

const AISLE_Z = LAYOUT.plan.h / 2;
const START_X = -5;
const TURN_R = 2.2;

/** the vehicle's pose at `s` (0..1) of its drive from the entrance into its bay: along the aisle, a rounded turn, then into the bay */
export function carPose(bay: Bay, s: number) {
  const r = bayRect(bay);
  const bx = r.x + r.w / 2, bz = r.y + r.h / 2;
  const d = bz < AISLE_Z ? -1 : 1;
  const l1 = bx - TURN_R - START_X;
  const arc = (Math.PI * TURN_R) / 2;
  const l2 = Math.abs(bz - AISLE_Z) - TURN_R;
  const dist = s * (l1 + arc + l2);
  if (dist < l1) return { x: START_X + dist, z: AISLE_Z, yaw: Math.PI / 2 };
  if (dist < l1 + arc) {
    const a = (dist - l1) / TURN_R;
    const cx = bx - TURN_R, cz = AISLE_Z + d * TURN_R;
    return d > 0
      ? { x: cx + TURN_R * Math.sin(a), z: cz - TURN_R * Math.cos(a), yaw: Math.PI / 2 - a }
      : { x: cx + TURN_R * Math.sin(a), z: cz + TURN_R * Math.cos(a), yaw: Math.PI / 2 + a };
  }
  return { x: bx, z: AISLE_Z + d * (TURN_R + (dist - l1 - arc)), yaw: d > 0 ? 0 : Math.PI };
}

const brake = Easing.bezier(0.25, 0.1, 0.15, 1);
const CAR_SECS = 2.1;
const LIFT_BAYS = new Set(LAYOUT.bays.filter((b) => b.equipment.includes('two_post_lift') && b.type !== 'wash').map((b) => b.id));

/** everything about the 3D world's build-up at a given frame of the reveal */
export function revealWorld(frame: number, camera: CameraState, layout: WorkshopLayout = LAYOUT): WorldState {
  const R = cues.reveal;
  const bayPop: Record<string, number> = {};
  layout.bays.forEach((b, i) => { bayPop[b.id] = sp(frame, R.pads + i * 0.11, { damping: 13, stiffness: 150 }); });
  const fixPop: Record<string, number> = {};
  layout.fixtures.forEach((f, i) => { fixPop[f.id] = sp(frame, R.fixtures + i * 0.18, { damping: 12, stiffness: 120 }); });
  const cars: WorldState['cars'] = {};
  const liftRaise: Record<string, number> = {};
  const techs: Record<string, number> = {};
  ARRIVAL.forEach((id, k) => {
    const o = OCC[id];
    const t0 = R.cars + k * R.carGap;
    const s = brake(Math.min(1, Math.max(0, (frame / FPS - t0) / CAR_SECS)));
    const lift = LIFT_BAYS.has(id);
    const up = lift ? prog(frame, t0 + CAR_SECS + 0.15, t0 + CAR_SECS + 1.05) : 0;
    const p = carPose(o.bay, s);
    cars[id] = { carKey: o.carKey, x: p.x, z: p.z, yaw: p.yaw, y: 0.06 + up * 0.89, visible: s > 0 };
    liftRaise[id] = up;
    const working = o.stage === 'in_repair' || o.stage === 'diagnostics' || o.stage === 'inspection';
    techs[id] = working ? sp(frame, R.techs + k * 0.14, { damping: 11, stiffness: 160 }) : 0;
  });
  return {
    layout,
    floor: prog(frame, R.floor, R.floor + 1.1),
    walls: sp(frame, R.walls, { damping: 18, stiffness: 70 }),
    props: sp(frame, R.fixtures + 0.9, { damping: 14, stiffness: 100 }),
    entrance: sp(frame, R.walls + 0.3),
    bayPop, fixPop, liftRaise, cars, techs,
    selected: null,
    camera,
  };
}

/** screen-space shift so the 3D scene sits in the free area between the HUD panels */
export const SHIFT = { x: -150, y: 36 };

/** camera for the reveal + interaction scenes */
export function revealCamera(frame: number): CameraState {
  const R = cues.reveal, I = cues.interact;
  const k = (keys: [number, number][]) => track(frame, keys);
  const dash = { az: 45, el: 35, fov: 11, frame: 37 };
  // bay 2 centre for the push-in
  const bay2: [number, number, number] = [11.5, 1.2, 5];
  const push = (v: number, base: number, near: number) => base + (near - base) * v;
  const focus = prog(frame, I.clickBay2 - 0.15, I.clickBay2 + 1.5) * (1 - prog(frame, I.oneClick + 0.4, I.end));
  return {
    az: push(focus, k([[R.start, 14], [R.cars, 30], [R.ui - 0.4, 42], [R.ui + 1.2, dash.az]]), 52),
    el: push(focus, k([[R.start, 66], [R.cars, 46], [R.ui - 0.4, 38], [R.ui + 1.2, dash.el]]), 30),
    fov: k([[R.start, 36], [R.cars, 30], [R.ui - 0.4, 20], [R.ui + 1.4, dash.fov]]),
    frame: push(focus, k([[R.start, 74], [R.cars, 52], [R.ui - 0.4, 42], [R.ui + 1.4, dash.frame]]), 21),
    target: [push(focus, 15, bay2[0]), push(focus, 0.4, bay2[1]), push(focus, 10, bay2[2])],
  };
}
