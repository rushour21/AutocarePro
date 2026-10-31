'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import * as THREE from 'three';
import { bayRect, bayType, fixtureRect, overlaps } from '@/lib/layout';
import type { Bay, CarKey, Stage, WorkshopLayout } from '@/lib/types';
import { Car3D } from './Car3D';
import { BayEquipment, FixtureMesh, Lift, Plant, WashBooth } from './Fixtures3D';
import { WallProps, Technician } from './Props3D';
import { EntranceMarks, Floor, Walls } from './Shell3D';
import { hazardTexture, labelTexture } from './textures';

/** what is in a bay right now (derived from jobs by the caller; the scene stores nothing) */
export interface BayLive {
  /** job stage; technicians are shown while a job is being worked on */
  stage?: Stage;
  carKey: CarKey;
  /** e.g. "Audi Q5" */
  title: string;
  /** second line of the chip, e.g. "In Repair" */
  chip: string;
  /** stage colour for the dot */
  color: string;
}
export interface SceneApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  preset: (p: 'iso' | 'top' | 'front') => void;
}
export interface SceneProps {
  layout: WorkshopLayout;
  occupants?: Record<string, BayLive | undefined>;
  /** chip text + dot colour for bays with no vehicle */
  idle?: (bay: Bay) => { text: string; color: string };
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** orbit / pan / zoom with the pointer */
  interactive?: boolean;
  /** left-drag pans instead of rotating */
  panMode?: boolean;
  showLabels?: boolean;
  /** zoom in on one bay (customer tracking view) */
  focusBayId?: string;
  /** px of the canvas covered by overlay panels; the scene is fitted and centred in what is left */
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  apiRef?: React.MutableRefObject<SceneApi | null>;
  className?: string;
}

const EL = (35 * Math.PI) / 180;
const AZ = (45 * Math.PI) / 180;

/* ------------------------------------------------------------------ camera */
function Rig({ layout, interactive, panMode, focusBayId, apiRef, padding }: Pick<SceneProps, 'layout' | 'interactive' | 'panMode' | 'focusBayId' | 'apiRef' | 'padding'>) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);
  const { plan } = layout;

  const focus = useMemo(() => {
    const b = layout.bays.find((x) => x.id === focusBayId);
    if (!b) return undefined;
    const r = bayRect(b);
    return new THREE.Vector3(r.x + r.w / 2, 0.8, r.y + r.h / 2);
  }, [layout.bays, focusBayId]);
  const target = useMemo(() => focus ?? new THREE.Vector3(plan.w / 2, 0.6, plan.h / 2), [focus, plan.w, plan.h]);

  const pt = padding?.top ?? 0, pr = padding?.right ?? 0, pb = padding?.bottom ?? 0, pl = padding?.left ?? 0;
  const baseZoom = useMemo(() => {
    const horiz = (plan.w + plan.h) / Math.SQRT2 + 1.5;
    const vert = ((plan.w + plan.h) / Math.SQRT2) * Math.sin(EL) + plan.wallH * Math.cos(EL) + 2;
    return Math.max(2, Math.min(Math.max(80, size.width - pl - pr) / horiz, Math.max(80, size.height - pt - pb) / vert));
  }, [plan.w, plan.h, plan.wallH, size.width, size.height, pt, pr, pb, pl]);
  const zoom0 = focus ? baseZoom * 2.1 : baseZoom;

  const pose = (az: number, el: number) => {
    const d = 120;
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    camera.position.copy(target).addScaledVector(dir, d);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    if (controls.current) {
      controls.current.target.copy(target);
      controls.current.update();
    }
  };

  useLayoutEffect(() => {
    pose(AZ, EL);
    camera.near = 0.1;
    camera.far = 600;
    camera.zoom = zoom0;
    // centre the scene in the area not covered by overlay panels
    if (pl || pr || pt || pb) camera.setViewOffset(size.width, size.height, -(pl - pr) / 2, -(pt - pb) / 2, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, zoom0, size.width, size.height, pt, pr, pb, pl]);

  useEffect(() => {
    if (!apiRef) return;
    const clamp = (z: number) => Math.min(zoom0 * 6, Math.max(zoom0 * 0.45, z));
    apiRef.current = {
      zoomIn: () => { camera.zoom = clamp(camera.zoom * 1.3); camera.updateProjectionMatrix(); invalidate(); },
      zoomOut: () => { camera.zoom = clamp(camera.zoom / 1.3); camera.updateProjectionMatrix(); invalidate(); },
      reset: () => { pose(AZ, EL); camera.zoom = zoom0; camera.updateProjectionMatrix(); invalidate(); },
      preset: (p) => {
        if (p === 'top') pose(0, (88 * Math.PI) / 180);
        else if (p === 'front') pose(0, (12 * Math.PI) / 180);
        else pose(AZ, EL);
        camera.zoom = zoom0;
        camera.updateProjectionMatrix();
        invalidate();
      },
    };
    return () => { apiRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRef, zoom0, target]);

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enabled={!!interactive}
      enableDamping={false}
      minZoom={zoom0 * 0.45}
      maxZoom={zoom0 * 6}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2.1}
      zoomSpeed={0.8}
      mouseButtons={{ LEFT: panMode ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
    />
  );
}

/* ------------------------------------------------------------------ bay chips (plain DOM, positioned from the camera) */
interface LabelItem {
  id: string;
  pos: [number, number, number];
}
function Projector({ items, els }: { items: LabelItem[]; els: React.MutableRefObject<Record<string, HTMLElement | null>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const it of items) {
      const el = els.current[it.id];
      if (!el) continue;
      v.set(it.pos[0], it.pos[1], it.pos[2]).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = x < -60 || y < -40 || x > size.width + 60 || y > size.height + 40 ? '0' : '1';
    }
  });
  useEffect(() => {
    invalidate();
  }, [items, invalidate]);
  return null;
}

/* ------------------------------------------------------------------ one bay */
/** One bay: painted pad, markings, lift, equipment and (unless `bare`) the vehicle and technicians. Exported for the product film. */
export function BayView({ bay, live, selected, hovered, onSelect, onHover, liftRaise, bare }: {
  bay: Bay;
  live?: BayLive;
  /** 0..1 lift height override (animation) */
  liftRaise?: number;
  /** draw only the bay itself; the caller places the vehicle */
  bare?: boolean;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const r = bayRect(bay);
  const t = bayType(bay.type);
  const muted = !bay.active;
  const lift = bay.equipment.includes('two_post_lift') && bay.type !== 'wash';
  const raised = !!live && lift;
  const hazard = useMemo(() => {
    const h = hazardTexture();
    h.repeat.set(Math.max(2, bay.l / 1.2), 1);
    return h;
  }, [bay.l]);
  const num = useMemo(() => (bay.name.match(/\d+/)?.[0] ?? bay.name.slice(0, 3)).padStart(2, '0'), [bay.name]);
  const stateText = !bay.active ? 'INACTIVE' : bay.state === 'maintenance' ? 'MAINTENANCE' : bay.state === 'reserved' ? 'RESERVED' : undefined;
  const tex = useMemo(() => labelTexture(num, muted ? '#c9ccd2' : '#ffffff', stateText), [num, muted, stateText]);
  const border = muted ? '#9aa0a8' : bay.state === 'maintenance' ? '#c9a24a' : bay.state === 'reserved' ? '#7d86b5' : t.color;
  const bw = selected ? 0.22 : hovered ? 0.17 : 0.12;
  const pad = muted ? '#6f747c' : bay.type === 'wash' ? '#4f7f8c' : '#545c68';
  const rot = bay.rot === 90 ? Math.PI / 2 : 0;

  return (
    <group
      position={[r.x + r.w / 2, 0, r.y + r.h / 2]}
      onClick={(e) => { e.stopPropagation(); onSelect(bay.id); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(bay.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
    >
      <group rotation={[0, rot, 0]}>
        {(selected || hovered) && (
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[bay.w + 0.9, bay.l + 0.9]} />
            <meshBasicMaterial color={border} transparent opacity={selected ? 0.35 : 0.2} depthWrite={false} />
          </mesh>
        )}
        {/* painted pad */}
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <boxGeometry args={[bay.w, 0.06, bay.l]} />
          <meshStandardMaterial color={pad} roughness={0.55} metalness={0.1} />
        </mesh>
        {/* border strips */}
        {([[0, -bay.l / 2, bay.w, bw], [0, bay.l / 2, bay.w, bw], [-bay.w / 2, 0, bw, bay.l], [bay.w / 2, 0, bw, bay.l]] as [number, number, number, number][]).map(([x, z, sx, sz], i) => (
          <mesh key={i} position={[x, 0.07, z]}>
            <boxGeometry args={[sx, 0.03, sz]} />
            {bay.state === 'maintenance' && bay.active ? (
              <meshStandardMaterial map={hazard} roughness={0.7} />
            ) : (
              <meshStandardMaterial color={border} emissive={border} emissiveIntensity={selected ? 0.9 : 0.35} roughness={0.5} />
            )}
          </mesh>
        ))}
        {/* floor number */}
        <mesh position={[0, 0.075, bay.l / 2 - 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.3, 1.15]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} />
        </mesh>

        {bay.type === 'wash' && <WashBooth w={bay.w} l={bay.l} />}
        {lift && <Lift w={bay.w} raised={raised} raise={liftRaise} />}
        <BayEquipment equipment={bay.equipment} w={bay.w} l={bay.l} />
        {live && !bare && (
          <group position={[0, raised ? 0.95 : 0.06, 0]}>
            <Car3D carKey={live.carKey} dim={muted} />
          </group>
        )}
        {live && !bare && (live.stage === 'in_repair' || live.stage === 'diagnostics' || live.stage === 'inspection') && (
          <>
            <Technician position={[bay.w / 2 - 1.0, 0.06, bay.l / 2 - 1.5]} rotation={-Math.PI / 2 - 0.3} stoop={0.12} />
            {live.stage === 'in_repair' && <Technician position={[-(bay.w / 2 - 1.0), 0.06, 0.4]} rotation={Math.PI / 2 + 0.2} shirt="#d84a27" />}
          </>
        )}
      </group>

    </group>
  );
}

/* ------------------------------------------------------------------ scene */
export function WorkshopScene3D({ layout, occupants, idle, selectedId, onSelect, interactive = true, panMode, showLabels = true, focusBayId, padding, apiRef, className }: SceneProps) {
  const [hover, setHover] = useState<string | null>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const { plan, bays, fixtures } = layout;
  const labels = useMemo<(LabelItem & { text: string; color: string; name: string })[]>(
    () =>
      bays.flatMap((b) => {
        const r = bayRect(b);
        const live = occupants?.[b.id];
        const lab = live ? { text: live.chip, color: live.color } : idle?.(b);
        if (!lab) return [];
        const lift = b.equipment.includes('two_post_lift') && b.type !== 'wash';
        return [{ id: b.id, name: b.name, text: lab.text, color: lab.color, pos: [r.x + r.w / 2, live ? (lift ? 4.1 : 3.0) : 1.3, r.y + r.h / 2] as [number, number, number] }];
      }),
    [bays, occupants, idle],
  );

  // decorative plants in the corners, only where nothing stands
  const plants = useMemo(() => {
    const solids = [...bays.map(bayRect), ...fixtures.map(fixtureRect)];
    const spots: [number, number][] = [[0.7, 0.7], [plan.w - 0.7, 0.7], [0.7, plan.h - 0.7], [plan.w - 0.7, plan.h - 0.7], [0.7, plan.h / 2 - 2.4], [0.7, plan.h / 2 + 2.4]];
    return spots.filter(([x, z]) => !solids.some((s) => overlaps({ x: x - 0.5, y: z - 0.5, w: 1, h: 1 }, s)));
  }, [bays, fixtures, plan.w, plan.h]);

  return (
    <div className={clsx('relative h-full w-full', className)}>
      <Canvas
        orthographic
        shadows="percentage"
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [60, 60, 60], zoom: 20, near: 0.1, far: 600 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        onPointerMissed={() => onSelect?.(null)}
        aria-hidden
      >
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.4} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} color="#ffffff" />
          <Lightformer form="rect" intensity={1.3} position={[-14, 5, 2]} rotation-y={Math.PI / 2} scale={[24, 8, 1]} color="#f4f6fa" />
          <Lightformer form="rect" intensity={0.9} position={[14, 4, 6]} rotation-y={-Math.PI / 2} scale={[24, 8, 1]} color="#dbe8ff" />
        </Environment>
        <hemisphereLight args={['#ffffff', '#a9afba', 0.55]} />
        <directionalLight
          position={[plan.w / 2 - 22, 38, plan.h / 2 + 18]}
          target-position={[plan.w / 2, 0, plan.h / 2]}
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
          shadow-camera-far={140}
        />
        <Rig layout={layout} interactive={interactive} panMode={panMode} focusBayId={focusBayId} apiRef={apiRef} padding={padding} />

        <Floor plan={plan} />
        <Walls plan={plan} fixtures={fixtures} />
        <EntranceMarks fixtures={fixtures} />
        <WallProps layout={layout} />
        {fixtures.map((f) => <FixtureMesh key={f.id} f={f} />)}
        {plants.map(([x, z], i) => <Plant key={i} position={[x, 0, z]} s={0.95} />)}
        {bays.map((b) => (
          <BayView
            key={b.id}
            bay={b}
            live={occupants?.[b.id]}
            selected={selectedId === b.id}
            hovered={hover === b.id}
            onSelect={(id) => onSelect?.(id)}
            onHover={setHover}
          />
        ))}
        {showLabels && <Projector items={labels} els={els} />}
      </Canvas>
      {showLabels && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {labels.map((l) => (
            <button
              key={l.id}
              ref={(el) => { els.current[l.id] = el; }}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={(e) => { e.stopPropagation(); onSelect?.(l.id); }}
              onPointerEnter={() => setHover(l.id)}
              onPointerLeave={() => setHover((h) => (h === l.id ? null : h))}
              style={{ position: 'absolute', left: 0, top: 0, transform: 'translate3d(-9999px,-9999px,0)', zIndex: selectedId === l.id ? 20 : 10 }}
              className={clsx('pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/95 px-2 py-1 text-left shadow-[0_4px_12px_rgba(40,50,70,0.25)] ring-1 transition-[box-shadow,background]', selectedId === l.id ? 'ring-2 ring-coral-400' : 'ring-black/5 hover:bg-white')}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: l.color }} />
              <span className="leading-tight">
                <span className="block text-[10.5px] font-bold text-[#25262b]">{l.name}</span>
                <span className="block text-[9.5px] font-medium" style={{ color: l.color }}>{l.text}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkshopScene3D;
