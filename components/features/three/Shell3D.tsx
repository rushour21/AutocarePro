'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Fixture, LayoutPlan } from '@/lib/types';
import { floorTexture } from './textures';

type Wall = 'N' | 'S' | 'W' | 'E';

/** which wall an entrance sits on, and the span it opens along that wall */
function openings(plan: LayoutPlan, fixtures: Fixture[]) {
  const out: Record<Wall, [number, number][]> = { N: [], S: [], W: [], E: [] };
  fixtures.filter((f) => f.kind === 'entrance').forEach((f) => {
    const d: [Wall, number][] = [['W', f.x], ['E', plan.w - (f.x + f.w)], ['N', f.y], ['S', plan.h - (f.y + f.h)]];
    const [wall] = d.sort((a, b) => a[1] - b[1])[0];
    out[wall].push(wall === 'W' || wall === 'E' ? [f.y, f.y + f.h] : [f.x, f.x + f.w]);
  });
  (Object.keys(out) as Wall[]).forEach((k) => out[k].sort((a, b) => a[0] - b[0]));
  return out;
}

/** the solid stretches of a wall of length `len` once the openings are cut out */
function segments(len: number, gaps: [number, number][]) {
  const segs: [number, number][] = [];
  let cur = 0;
  gaps.forEach(([a, b]) => {
    if (a > cur) segs.push([cur, a]);
    cur = Math.max(cur, b);
  });
  if (cur < len) segs.push([cur, len]);
  return segs;
}

const T = 0.3;
const WALL = '#e7e4dd';
const TRIM = '#3a4a6b';

export function Floor({ plan }: { plan: LayoutPlan }) {
  const tex = useMemo(() => {
    const t = floorTexture();
    t.repeat.set(plan.w / 2, plan.h / 2);
    return t;
  }, [plan.w, plan.h]);
  return (
    <group>
      {/* ground the workshop sits on */}
      <mesh position={[plan.w / 2, -0.55, plan.h / 2]} receiveShadow>
        <boxGeometry args={[plan.w + 7, 0.3, plan.h + 7]} />
        <meshStandardMaterial color="#e6ebf2" roughness={0.95} />
      </mesh>
      {/* slab edge */}
      {/* slab top sits just below the floor plane so the two never z-fight */}
      <mesh position={[plan.w / 2, -0.27, plan.h / 2]} receiveShadow>
        <boxGeometry args={[plan.w + 0.6, 0.5, plan.h + 0.6]} />
        <meshStandardMaterial color="#59616d" roughness={0.8} />
      </mesh>
      <mesh position={[plan.w / 2, 0.004, plan.h / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[plan.w, plan.h]} />
        <meshStandardMaterial map={tex} roughness={0.85} metalness={0.02} />
      </mesh>
    </group>
  );
}

function WallRun({ wall, plan, gaps, tall }: { wall: Wall; plan: LayoutPlan; gaps: [number, number][]; tall: boolean }) {
  const H = tall ? plan.wallH : 0.45;
  const horizontal = wall === 'N' || wall === 'S'; // runs along X
  const len = horizontal ? plan.w : plan.h;
  const segs = segments(len, gaps);
  const fixed = wall === 'N' ? -T / 2 : wall === 'S' ? plan.h + T / 2 : wall === 'W' ? -T / 2 : plan.w + T / 2;
  const place = (a: number, b: number, y: number, h: number, thick = T): [[number, number, number], [number, number, number]] => {
    const c = (a + b) / 2, l = b - a;
    return horizontal ? [[c, y, fixed], [l, h, thick]] : [[fixed, y, c], [thick, h, l]];
  };
  const panes = useMemo(() => {
    if (!tall) return [] as [number, number][];
    const out: [number, number][] = [];
    segs.forEach(([a, b]) => {
      const n = Math.floor((b - a - 1) / 4);
      for (let i = 0; i < n; i++) {
        const c = a + (b - a) * ((i + 0.5) / n);
        out.push([c - 1.1, c + 1.1]);
      }
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tall, JSON.stringify(segs)]);
  const inward = wall === 'N' ? 1 : wall === 'S' ? -1 : wall === 'W' ? 1 : -1;
  return (
    <group>
      {segs.map(([a, b], i) => {
        const [pos, size] = place(a, b, H / 2, H);
        const [tpos, tsize] = place(a, b, H + 0.05, 0.1, T + 0.1);
        const [lpos, lsize] = place(a, b, H - 0.35, 0.12, 0.05);
        const lp: [number, number, number] = horizontal ? [lpos[0], lpos[1], lpos[2] + inward * 0.16] : [lpos[0] + inward * 0.16, lpos[1], lpos[2]];
        return (
          <group key={i}>
            <mesh position={pos} castShadow receiveShadow>
              <boxGeometry args={size} />
              <meshStandardMaterial color={WALL} roughness={0.85} />
            </mesh>
            <mesh position={tpos}>
              <boxGeometry args={tsize} />
              <meshStandardMaterial color={TRIM} roughness={0.6} metalness={0.2} />
            </mesh>
            {tall && (
              <mesh position={lp}>
                <boxGeometry args={lsize} />
                <meshStandardMaterial color="#fffbe9" emissive="#fff1c4" emissiveIntensity={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
      {panes.map(([a, b], i) => {
        const [pos, size] = place(a, b, H * 0.55, 1.7, 0.05);
        const p: [number, number, number] = horizontal ? [pos[0], pos[1], pos[2] + inward * 0.17] : [pos[0] + inward * 0.17, pos[1], pos[2]];
        return (
          <mesh key={`w${i}`} position={p}>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#9fb6d6" metalness={0.5} roughness={0.12} transparent opacity={0.55} />
          </mesh>
        );
      })}
      {/* lintel + frame over each opening on a tall wall */}
      {tall && gaps.map(([a, b], i) => {
        const [lpos, lsize] = place(a, b, H - 0.6, 1.2);
        const [f1, s1] = place(a, a + 0.14, 1.6, 3.2, T + 0.1);
        const [f2, s2] = place(b - 0.14, b, 1.6, 3.2, T + 0.1);
        return (
          <group key={`g${i}`}>
            <mesh position={lpos}><boxGeometry args={lsize} /><meshStandardMaterial color={WALL} roughness={0.85} /></mesh>
            <mesh position={f1}><boxGeometry args={s1} /><meshStandardMaterial color={TRIM} /></mesh>
            <mesh position={f2}><boxGeometry args={s2} /><meshStandardMaterial color={TRIM} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

/** far walls (north, west) are full height; the near ones are low so the interior stays visible */
export function Walls({ plan, fixtures }: { plan: LayoutPlan; fixtures: Fixture[] }) {
  const gaps = useMemo(() => openings(plan, fixtures), [plan, fixtures]);
  return (
    <group>
      <WallRun wall="N" plan={plan} gaps={gaps.N} tall />
      <WallRun wall="W" plan={plan} gaps={gaps.W} tall />
      <WallRun wall="S" plan={plan} gaps={gaps.S} tall={false} />
      <WallRun wall="E" plan={plan} gaps={gaps.E} tall={false} />
    </group>
  );
}

/** green floor arrow at each entrance */
export function EntranceMarks({ fixtures }: { fixtures: Fixture[] }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.6, -0.18); s.lineTo(0.1, -0.18); s.lineTo(0.1, -0.5); s.lineTo(0.8, 0); s.lineTo(0.1, 0.5); s.lineTo(0.1, 0.18); s.lineTo(-0.6, 0.18);
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      {fixtures.filter((f) => f.kind === 'entrance').map((f) => (
        <mesh key={f.id} position={[f.x + f.w + 1.2, 0.03, f.y + f.h / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color="#1d9d65" />
        </mesh>
      ))}
    </group>
  );
}
