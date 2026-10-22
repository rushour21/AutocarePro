import { ThreeCanvas } from '@remotion/three';
import { Environment, Lightformer } from '@react-three/drei';
import { useLayoutEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Car3D } from '@/components/features/three/Car3D';
import { FixtureMesh, Plant } from '@/components/features/three/Fixtures3D';
import { Technician, WallProps } from '@/components/features/three/Props3D';
import { EntranceMarks, Floor, Walls } from '@/components/features/three/Shell3D';
import { BayView } from '@/components/features/three/WorkshopScene3D';
import { bayRect, fixtureRect, overlaps } from '@/lib/layout';
import type { Bay, CarKey, Fixture, WorkshopLayout } from '@/lib/types';
import { H, W } from '../theme';

export interface CameraState {
  /** degrees; 0 looks from +Z, 90 from +X */
  az: number;
  /** degrees above the floor */
  el: number;
  /** field of view in degrees */
  fov: number;
  /** world units visible vertically at the target (keeps framing constant while the fov changes: the dolly zoom) */
  frame: number;
  target: [number, number, number];
  /** degrees */
  roll?: number;
}

export interface CarState {
  carKey: CarKey;
  x: number;
  z: number;
  yaw: number;
  y: number;
  visible: boolean;
}

export interface WorldState {
  layout: WorkshopLayout;
  floor: number;
  walls: number;
  props: number;
  entrance: number;
  /** per bay / fixture pop-in 0..1 (default 1) */
  bayPop: Record<string, number>;
  fixPop: Record<string, number>;
  liftRaise: Record<string, number>;
  cars: Record<string, CarState | undefined>;
  techs: Record<string, number>;
  selected?: string | null;
  camera: CameraState;
}

export function cameraPose(c: CameraState) {
  const az = (c.az * Math.PI) / 180, el = (c.el * Math.PI) / 180;
  const dist = c.frame / (2 * Math.tan((c.fov * Math.PI) / 360));
  const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  const target = new THREE.Vector3(...c.target);
  return { position: target.clone().addScaledVector(dir, dist), target, dist };
}

/** world point -> pixel in the 1920x1080 frame, using exactly the same camera as the 3D render */
export function project(c: CameraState, p: [number, number, number]) {
  const { position, target } = cameraPose(c);
  const cam = new THREE.PerspectiveCamera(c.fov, W / H, 1, 900);
  cam.position.copy(position);
  cam.up.set(0, 1, 0);
  cam.lookAt(target);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, depth: v.z };
}

function Rig({ camera }: { camera: CameraState }) {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const { position, target } = cameraPose(camera);
    cam.position.copy(position);
    cam.up.set(0, 1, 0);
    cam.fov = camera.fov;
    cam.aspect = W / H;
    // a tight depth range around the scene keeps the depth buffer precise (no z-fighting) even at long lenses
    const dist = cameraPose(camera).dist;
    cam.near = Math.max(1, dist - 75);
    cam.far = dist + 95;
    cam.lookAt(target);
    if (camera.roll) cam.rotateZ((camera.roll * Math.PI) / 180);
    cam.updateProjectionMatrix();
  });
  return null;
}

/** scales its children about the point (cx, 0, cz): a pop-in that stays put */
function Pop({ s, cx, cz, children }: { s: number; cx: number; cz: number; children: ReactNode }) {
  if (s <= 0.001) return null;
  return (
    <group position={[cx, 0, cz]} scale={s}>
      <group position={[-cx, 0, -cz]}>{children}</group>
    </group>
  );
}

const sc = (v: number) => Math.max(0.0001, v);

export function FilmWorld({ state }: { state: WorldState }) {
  const { layout } = state;
  const { plan, bays, fixtures } = layout;
  const cx = plan.w / 2, cz = plan.h / 2;

  const plants = useMemo(() => {
    const solids = [...bays.map(bayRect), ...fixtures.map(fixtureRect)];
    const spots: [number, number][] = [[0.7, 0.7], [plan.w - 0.7, 0.7], [0.7, plan.h - 0.7], [plan.w - 0.7, plan.h - 0.7], [0.7, plan.h / 2 - 2.4], [0.7, plan.h / 2 + 2.4]];
    return spots.filter(([x, z]) => !solids.some((s) => overlaps({ x: x - 0.5, y: z - 0.5, w: 1, h: 1 }, s)));
  }, [bays, fixtures, plan.w, plan.h]);

  return (
    <ThreeCanvas width={W} height={H} shadows="percentage" gl={{ antialias: true, alpha: true }} camera={{ position: [60, 60, 60], fov: 30 }} style={{ position: 'absolute', inset: 0 }}>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.3} position={[-14, 5, 2]} rotation-y={Math.PI / 2} scale={[24, 8, 1]} color="#fff4e2" />
        <Lightformer form="rect" intensity={0.9} position={[14, 4, 6]} rotation-y={-Math.PI / 2} scale={[24, 8, 1]} color="#dbe8ff" />
      </Environment>
      <hemisphereLight args={['#ffffff', '#b7a98f', 0.55]} />
      <directionalLight
        position={[cx - 22, 38, cz + 18]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-(plan.w + plan.h) / 2}
        shadow-camera-right={(plan.w + plan.h) / 2}
        shadow-camera-top={(plan.w + plan.h) / 2}
        shadow-camera-bottom={-(plan.w + plan.h) / 2}
        shadow-camera-near={1}
        shadow-camera-far={160}
        target-position={[cx, 0, cz]}
      />
      <Rig camera={state.camera} />

      <Pop s={sc(state.floor)} cx={cx} cz={cz}>
        <Floor plan={plan} />
      </Pop>
      {state.walls > 0.001 && (
        <group scale={[1, sc(state.walls), 1]}>
          <Walls plan={plan} fixtures={fixtures} />
        </group>
      )}
      <Pop s={state.entrance} cx={cx} cz={cz}><EntranceMarks fixtures={fixtures} /></Pop>
      <Pop s={state.props} cx={cx} cz={cz}><WallProps layout={layout} /></Pop>
      {plants.map(([x, z], i) => (
        <Pop key={i} s={state.props} cx={x} cz={z}><Plant position={[x, 0, z]} s={0.95} /></Pop>
      ))}
      {fixtures.map((fx: Fixture) => (
        <Pop key={fx.id} s={state.fixPop[fx.id] ?? 1} cx={fx.x + fx.w / 2} cz={fx.y + fx.h / 2}>
          <FixtureMesh f={fx} />
        </Pop>
      ))}
      {bays.map((b: Bay) => {
        const r = bayRect(b);
        return (
          <Pop key={b.id} s={state.bayPop[b.id] ?? 1} cx={r.x + r.w / 2} cz={r.y + r.h / 2}>
            <BayView bay={b} selected={state.selected === b.id} hovered={false} onSelect={() => {}} onHover={() => {}} bare liftRaise={state.liftRaise[b.id] ?? 0} />
          </Pop>
        );
      })}
      {Object.entries(state.cars).map(([id, c]) =>
        c && c.visible ? (
          <group key={id} position={[c.x, c.y, c.z]} rotation={[0, c.yaw, 0]}>
            <Car3D carKey={c.carKey} />
          </group>
        ) : null,
      )}
      {bays.map((b: Bay) => {
        const s = state.techs[b.id] ?? 0;
        if (s <= 0.001) return null;
        const r = bayRect(b);
        const x = r.x + r.w / 2, z = r.y + r.h / 2;
        return (
          <group key={`t${b.id}`}>
            <group position={[x + b.w / 2 - 1.0, 0.06, z + b.l / 2 - 1.5]} scale={s}>
              <Technician position={[0, 0, 0]} rotation={-Math.PI / 2 - 0.3} stoop={0.12} />
            </group>
          </group>
        );
      })}
    </ThreeCanvas>
  );
}
