'use client';

import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import type { Fixture } from '@/lib/types';
import { signTexture } from './textures';

const BLUE = '#2f55b8';
const DARK = '#2a2f37';

/** small deterministic pseudo-random so shelves look the same on every render */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ per-bay equipment (bay-local frame, Z along the vehicle) */
export function Lift({ w, raised }: { w: number; raised: boolean }) {
  const x = w / 2 - 0.5;
  const arm = raised ? 0.95 : 0.16;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * x, 0, -0.35]}>
          <mesh position={[0, 1.55, 0]} castShadow>
            <boxGeometry args={[0.3, 3.1, 0.42]} />
            <meshStandardMaterial color={BLUE} metalness={0.35} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <boxGeometry args={[0.75, 0.08, 0.9]} />
            <meshStandardMaterial color={DARK} roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.12, 0]}>
            <boxGeometry args={[0.36, 0.1, 0.48]} />
            <meshStandardMaterial color="#1f3d8a" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* carriage + arms swing in towards the vehicle */}
          <mesh position={[0, arm, 0]} castShadow>
            <boxGeometry args={[0.36, 0.22, 0.5]} />
            <meshStandardMaterial color="#e8ecf2" metalness={0.5} roughness={0.35} />
          </mesh>
          {[-1, 1].map((z) => (
            <mesh key={z} position={[-s * 0.5, arm - 0.02, z * 0.95]} castShadow>
              <boxGeometry args={[0.8, 0.1, 0.16]} />
              <meshStandardMaterial color="#e8ecf2" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function ToolCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.8, 1.15, 0.6]} radius={0.03} smoothness={2} position={[0, 0.575, 0]} castShadow>
        <meshStandardMaterial color="#c0392b" metalness={0.3} roughness={0.5} />
      </RoundedBox>
      {[0.25, 0.5, 0.75, 1.0].map((y) => (
        <mesh key={y} position={[0, y, 0.305]}>
          <boxGeometry args={[0.66, 0.02, 0.01]} />
          <meshStandardMaterial color="#2a2f37" />
        </mesh>
      ))}
      <mesh position={[0, 1.17, 0]}>
        <boxGeometry args={[0.84, 0.04, 0.64]} />
        <meshStandardMaterial color="#2a2f37" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

function DiagCart({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.5]} />
        <meshStandardMaterial color="#39414d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 0.06]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.55, 0.38, 0.05]} />
        <meshStandardMaterial color="#11161d" emissive="#2f6bff" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

function TyreMachine({ position, kind }: { position: [number, number, number]; kind: 'balancer' | 'changer' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.8, 0.9, 0.8]} />
        <meshStandardMaterial color={kind === 'balancer' ? '#4a5260' : '#2f55b8'} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.2, 18]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Compressor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.0, 20]} />
        <meshStandardMaterial color="#d9532b" metalness={0.4} roughness={0.45} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.5]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}
    </group>
  );
}

/** the non-lift equipment of a bay, placed in the corners clear of the vehicle */
export function BayEquipment({ equipment, w, l }: { equipment: string[]; w: number; l: number }) {
  const slots: [number, number][] = [
    [-(w / 2 - 0.55), -(l / 2 - 0.7)], [w / 2 - 0.55, -(l / 2 - 0.7)], [-(w / 2 - 0.55), l / 2 - 0.7], [w / 2 - 0.55, l / 2 - 0.7],
  ];
  const items = equipment.filter((e) => e !== 'two_post_lift');
  return (
    <group>
      {items.slice(0, 4).map((e, i) => {
        const [x, z] = slots[i];
        const p: [number, number, number] = [x, 0, z];
        if (e === 'tool_cabinet') return <ToolCabinet key={e} position={p} />;
        if (e === 'diagnostic_tools') return <DiagCart key={e} position={p} />;
        if (e === 'wheel_balancer') return <TyreMachine key={e} position={p} kind="balancer" />;
        if (e === 'tyre_changer') return <TyreMachine key={e} position={p} kind="changer" />;
        if (e === 'air_compressor') return <Compressor key={e} position={p} />;
        return null;
      })}
    </group>
  );
}

/** glass wash booth over a wash bay (bay-local frame) */
export function WashBooth({ w, l }: { w: number; l: number }) {
  const H = 3.4;
  const corners: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <group>
      {corners.map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.1), H / 2, sz * (l / 2 - 0.1)]} castShadow>
          <boxGeometry args={[0.12, H, 0.12]} />
          <meshStandardMaterial color="#c9d6e3" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {/* roof frame with spray rails */}
      {[-1, 1].map((s) => (
        <mesh key={`rx${s}`} position={[s * (w / 2 - 0.1), H, 0]}>
          <boxGeometry args={[0.12, 0.12, l - 0.1]} />
          <meshStandardMaterial color="#c9d6e3" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`rz${s}`} position={[0, H, s * (l / 2 - 0.1)]}>
          <boxGeometry args={[w - 0.1, 0.12, 0.12]} />
          <meshStandardMaterial color="#c9d6e3" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {[-1.6, 0, 1.6].map((z) => (
        <mesh key={z} position={[0, H - 0.1, Math.max(-l / 2 + 0.5, Math.min(l / 2 - 0.5, z))]}>
          <boxGeometry args={[w - 0.5, 0.06, 0.06]} />
          <meshStandardMaterial color="#1fb3d6" emissive="#1fb3d6" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* glass sides */}
      {[-1, 1].map((s) => (
        <mesh key={`gx${s}`} position={[s * (w / 2 - 0.1), H / 2, 0]}>
          <boxGeometry args={[0.02, H - 0.2, l - 0.3]} />
          <meshPhysicalMaterial color="#9be3f5" transparent opacity={0.16} roughness={0.05} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, -(l / 2 - 0.1)]}>
        <boxGeometry args={[w - 0.3, H - 0.2, 0.02]} />
        <meshPhysicalMaterial color="#9be3f5" transparent opacity={0.16} roughness={0.05} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ fixtures (world frame, rect given in metres) */
function Plant({ position, s = 1 }: { position: [number, number, number]; s?: number }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 14]} />
        <meshStandardMaterial color="#59616d" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i * 1.3) * 0.18, 0.85 + (i % 3) * 0.16, Math.cos(i * 1.3) * 0.18]} castShadow>
          <icosahedronGeometry args={[0.3 - (i % 2) * 0.05, 1]} />
          <meshStandardMaterial color={i % 2 ? '#3f8f4f' : '#2f7a44'} roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}
export { Plant };

function PartsStorage({ f }: { f: Fixture }) {
  const rows = Math.max(1, Math.floor(f.h / 1.8));
  const gap = f.h / rows;
  const boxColors = ['#b89968', '#c9a878', '#a98b5e', '#d4b98a', '#8f7a56'];
  return (
    <group position={[f.x + f.w / 2, 0, f.y + f.h / 2]}>
      {Array.from({ length: rows }).map((_, r) => {
        const z = -f.h / 2 + gap * (r + 0.5);
        const W = Math.max(1, f.w - 0.5);
        return (
          <group key={r} position={[0, 0, z]}>
            {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
              <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.04), 1.1, sz * 0.3]} castShadow>
                <boxGeometry args={[0.06, 2.2, 0.06]} />
                <meshStandardMaterial color="#2f4a86" metalness={0.4} roughness={0.5} />
              </mesh>
            )))}
            {[0.25, 0.8, 1.35, 1.9].map((y, li) => (
              <group key={y}>
                <mesh position={[0, y, 0]} receiveShadow castShadow>
                  <boxGeometry args={[W, 0.05, 0.62]} />
                  <meshStandardMaterial color="#c7ccd4" metalness={0.5} roughness={0.45} />
                </mesh>
                {Array.from({ length: Math.max(2, Math.floor(W / 0.7)) }).map((__, bi) => {
                  const k = r * 100 + li * 10 + bi;
                  if (rnd(k) < 0.18) return null;
                  const bh = 0.22 + rnd(k + 1) * 0.22;
                  return (
                    <mesh key={bi} position={[-W / 2 + 0.4 + bi * 0.68, y + 0.03 + bh / 2, 0]} castShadow>
                      <boxGeometry args={[0.52, bh, 0.46]} />
                      <meshStandardMaterial color={boxColors[Math.floor(rnd(k + 2) * boxColors.length)]} roughness={0.85} />
                    </mesh>
                  );
                })}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Reception({ f }: { f: Fixture }) {
  const sign = useMemo(() => signTexture('AutoHub'), []);
  const W = Math.min(f.w - 0.8, 4.4);
  return (
    <group position={[f.x + f.w / 2, 0, f.y + f.h / 2]}>
      <RoundedBox args={[W, 1.1, 0.9]} radius={0.04} smoothness={3} position={[0, 0.55, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#26292f" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[W + 0.1, 0.07, 1.05]} />
        <meshStandardMaterial color="#f1ede4" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.62, 0.456]}>
        <planeGeometry args={[Math.min(W - 0.4, 2.2), 0.55]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.55} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <group key={x} position={[x * (W / 4), 1.17, -0.1]}>
          <mesh position={[0, 0.22, 0]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.55, 0.34, 0.03]} />
            <meshStandardMaterial color="#10141a" emissive="#4a6fa5" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.18, 0.06, 0.14]} />
            <meshStandardMaterial color="#2a2f37" />
          </mesh>
        </group>
      ))}
      {/* stools */}
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x * (W / 3), 0.4, -0.9]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 14]} />
          <meshStandardMaterial color="#8a93a0" />
        </mesh>
      ))}
    </group>
  );
}

function Lounge({ f }: { f: Fixture }) {
  const cx = f.x + f.w / 2, cz = f.y + f.h / 2;
  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[Math.max(1, f.w - 0.6), 0.03, Math.max(1, f.h - 0.6)]} />
        <meshStandardMaterial color="#8d8479" roughness={0.95} />
      </mesh>
      <RoundedBox args={[Math.min(2.6, f.w - 1), 0.5, 0.95]} radius={0.12} smoothness={3} position={[0, 0.28, -Math.max(0.4, f.h / 2 - 1.1)]} castShadow>
        <meshStandardMaterial color="#8c8f96" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[Math.min(2.6, f.w - 1), 0.5, 0.2]} radius={0.08} smoothness={3} position={[0, 0.62, -Math.max(0.4, f.h / 2 - 1.1) - 0.38]} castShadow>
        <meshStandardMaterial color="#8c8f96" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.26, 0.2]} castShadow>
        <boxGeometry args={[1.1, 0.04, 0.7]} />
        <meshStandardMaterial color="#c9a77a" roughness={0.5} />
      </mesh>
      {[[-0.45, 0.2 - 0.28], [0.45, 0.2 - 0.28], [-0.45, 0.2 + 0.28], [0.45, 0.2 + 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]}>
          <boxGeometry args={[0.05, 0.26, 0.05]} />
          <meshStandardMaterial color="#6b5a45" />
        </mesh>
      ))}
      <Plant position={[f.w / 2 - 0.6, 0, -f.h / 2 + 0.6]} s={0.9} />
    </group>
  );
}

function CabinetFixture({ f }: { f: Fixture }) {
  const n = Math.max(1, Math.round(f.w / 0.85));
  return (
    <group position={[f.x, 0, f.y]}>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[(i + 0.5) * (f.w / n), 0, f.h / 2]} scale={[(f.w / n) / 0.8, 1, Math.min(1.4, f.h / 0.6)]}>
          <ToolCabinet position={[0, 0, 0]} />
        </group>
      ))}
    </group>
  );
}

export function FixtureMesh({ f }: { f: Fixture }) {
  if (f.kind === 'parts') return <PartsStorage f={f} />;
  if (f.kind === 'reception') return <Reception f={f} />;
  if (f.kind === 'lounge') return <Lounge f={f} />;
  if (f.kind === 'cabinet') return <CabinetFixture f={f} />;
  return null;
}

