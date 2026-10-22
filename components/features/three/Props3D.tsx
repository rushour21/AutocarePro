'use client';

import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { bayRect, fixtureRect, overlaps } from '@/lib/layout';
import type { Fixture, WorkshopLayout } from '@/lib/types';
import { ToolCabinet } from './Fixtures3D';
import { signTexture } from './textures';

/** A low-poly technician in a blue uniform. Local frame: faces +Z, feet on y = 0. */
export function Technician({ position, rotation = 0, shirt = '#2f55b8', stoop = 0 }: { position: [number, number, number]; rotation?: number; shirt?: string; stoop?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]} castShadow>
          <boxGeometry args={[0.17, 0.84, 0.2]} />
          <meshStandardMaterial color="#27304a" roughness={0.8} />
        </mesh>
      ))}
      <group rotation={[stoop, 0, 0]} position={[0, 0.84, 0]}>
        <RoundedBox args={[0.5, 0.62, 0.28]} radius={0.06} smoothness={2} position={[0, 0.31, 0]} castShadow>
          <meshStandardMaterial color={shirt} roughness={0.75} />
        </RoundedBox>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.33, 0.3, 0.06]} rotation={[-0.5, 0, s * -0.12]} castShadow>
            <boxGeometry args={[0.14, 0.52, 0.14]} />
            <meshStandardMaterial color={shirt} roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0, 0.78, 0]} castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#d9a77f" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.9, 0.01]} castShadow>
          <sphereGeometry args={[0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f2f2f0" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Workbench({ position, w = 2.2 }: { position: [number, number, number]; w?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.07, 0.75]} />
        <meshStandardMaterial color="#c9a77a" roughness={0.6} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.07), 0.45, sz * 0.3]} castShadow>
          <boxGeometry args={[0.07, 0.9, 0.07]} />
          <meshStandardMaterial color="#59616d" metalness={0.5} roughness={0.5} />
        </mesh>
      )))}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[w - 0.2, 0.05, 0.6]} />
        <meshStandardMaterial color="#59616d" metalness={0.4} roughness={0.55} />
      </mesh>
      {/* pegboard with tools */}
      <mesh position={[0, 1.8, -0.35]}>
        <boxGeometry args={[w - 0.1, 1.2, 0.05]} />
        <meshStandardMaterial color="#8d99ab" roughness={0.7} />
      </mesh>
      {Array.from({ length: Math.max(2, Math.floor(w / 0.45)) }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 0.3 + i * 0.4, 1.8 + ((i % 3) - 1) * 0.25, -0.31]}>
          <boxGeometry args={[0.07, 0.34, 0.03]} />
          <meshStandardMaterial color={['#c0392b', '#f2b01e', '#2f55b8'][i % 3]} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function TyreStack({ position, n = 4 }: { position: [number, number, number]; n?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} position={[0, 0.14 + i * 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.3, 0.13, 10, 20]} />
          <meshStandardMaterial color="#17191c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Barrels({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[[0, 0, '#2f55b8'], [0.62, 0.1, '#c0392b'], [0.3, 0.62, '#2f55b8']].map(([x, z, c], i) => (
        <mesh key={i} position={[x as number, 0.45, z as number]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.9, 16]} />
          <meshStandardMaterial color={c as string} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Decorative equipment along the free strips beside the walls, plus the big wall sign. Everything yields to bays/fixtures. */
export function WallProps({ layout }: { layout: WorkshopLayout }) {
  const { plan, bays, fixtures } = layout;
  const sign = useMemo(() => signTexture('AutoHub'), []);
  const items = useMemo(() => {
    const solids = [...bays.map(bayRect), ...fixtures.filter((f: Fixture) => f.kind !== 'entrance').map(fixtureRect)];
    // walkway in front of entrances stays clear
    const doors = fixtures.filter((f) => f.kind === 'entrance').map((f) => ({ x: f.x - 0.5, y: f.y - 0.4, w: 3.2, h: f.h + 0.8 }));
    const free = (r: { x: number; y: number; w: number; h: number }) => !solids.some((s) => overlaps(r, s, 0.2)) && !doors.some((d) => overlaps(r, d)) && r.x >= 0 && r.y >= 0 && r.x + r.w <= plan.w && r.y + r.h <= plan.h;
    const out: { kind: 'bench' | 'cabinet' | 'tyres' | 'barrels'; x: number; z: number; rot: number }[] = [];
    const northKinds = ['bench', 'cabinet', 'bench', 'tyres', 'barrels'] as const;
    for (let x = 1.4, i = 0; x < plan.w - 2; x += 3.4, i++) {
      const kind = northKinds[i % northKinds.length];
      const w = kind === 'bench' ? 2.4 : 1.1;
      if (free({ x: x - w / 2, y: 0.1, w, h: 1.1 })) out.push({ kind, x, z: 0.55, rot: 0 });
    }
    const westKinds = ['tyres', 'barrels', 'cabinet'] as const;
    for (let z = 2.5, i = 0; z < plan.h - 2; z += 3.2, i++) {
      const kind = westKinds[i % westKinds.length];
      if (free({ x: 0.1, y: z - 0.7, w: 1.0, h: 1.4 })) out.push({ kind, x: 0.55, z, rot: Math.PI / 2 });
    }
    return out;
  }, [bays, fixtures, plan.w, plan.h]);
  return (
    <group>
      <mesh position={[plan.w / 2, Math.min(3.6, plan.wallH - 1), 0.17]}>
        <planeGeometry args={[Math.min(7, plan.w * 0.3), Math.min(7, plan.w * 0.3) / 4]} />
        <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.5} />
      </mesh>
      {items.map((it, i) => {
        const p: [number, number, number] = [it.x, 0, it.z];
        return (
          <group key={i} rotation={[0, it.rot, 0]} position={[it.x, 0, it.z]}>
            {it.kind === 'bench' && <Workbench position={[0, 0, 0]} />}
            {it.kind === 'cabinet' && <ToolCabinet position={[0, 0, 0]} />}
            {it.kind === 'tyres' && <TyreStack position={[0, 0, 0]} />}
            {it.kind === 'barrels' && <Barrels position={[-0.2, 0, -0.2]} />}
            {void p}
          </group>
        );
      })}
    </group>
  );
}
