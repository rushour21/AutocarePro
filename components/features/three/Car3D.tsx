'use client';

import { RoundedBox, useGLTF } from '@react-three/drei';
import { Component, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import * as THREE from 'three';
import { CAR_COLOR } from '@/components/features/CarTop';
import type { CarKey } from '@/lib/types';
import { useCarModel } from './models';
import type { ModelEntry } from './models';
import { blobTexture } from './textures';

type Style = 'sedan' | 'suv' | 'large';
const STYLE: Record<CarKey, Style> = { bmw3: 'sedan', audiq5: 'suv', glc: 'suv', fortuner: 'large', bmwx5: 'suv', rangerover: 'large' };
const DIM: Record<Style, { L: number; W: number; H: number; cabLb: number; cabLt: number; cabH: number; cabZ: number; ride: number; wheel: number; hood: number }> = {
  sedan: { L: 4.7, W: 1.85, H: 0.6, cabLb: 2.55, cabLt: 1.45, cabH: 0.52, cabZ: -0.3, ride: 0.2, wheel: 0.34, hood: 1.25 },
  suv: { L: 4.7, W: 1.95, H: 0.78, cabLb: 3.1, cabLt: 2.25, cabH: 0.62, cabZ: -0.25, ride: 0.28, wheel: 0.38, hood: 1.0 },
  large: { L: 4.95, W: 2.02, H: 0.9, cabLb: 3.3, cabLt: 2.5, cabH: 0.7, cabZ: -0.3, ride: 0.34, wheel: 0.42, hood: 0.95 },
};

/** side profile (z along the car, y up) swept across the width: gives a sloped hood and tail instead of a plain box */
function bodyGeometry(d: (typeof DIM)[Style]) {
  const { L, H, hood } = d;
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0.02);
  s.lineTo(-L / 2, H * 0.72);
  s.quadraticCurveTo(-L / 2, H, -L / 2 + 0.45, H);
  s.lineTo(L / 2 - hood, H);
  s.quadraticCurveTo(L / 2 - 0.25, H * 0.98, L / 2, H * 0.62);
  s.lineTo(L / 2, 0.02);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d.W - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 10 });
  g.rotateY(-Math.PI / 2);
  g.translate((d.W - 0.16) / 2, 0, 0);
  return g;
}

/** tapered glasshouse: wide at the belt line, narrower at the roof, so windscreens slope */
function cabinGeometry(d: (typeof DIM)[Style]) {
  const zb0 = d.cabZ - d.cabLb / 2, zb1 = d.cabZ + d.cabLb / 2;
  const zt0 = d.cabZ - d.cabLt / 2 - 0.1, zt1 = d.cabZ + d.cabLt / 2 + 0.05;
  const s = new THREE.Shape();
  s.moveTo(zb0, 0);
  s.lineTo(zb1, 0);
  s.lineTo(zt1, d.cabH);
  s.lineTo(zt0, d.cabH);
  s.closePath();
  const w = d.W * 0.84;
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(w / 2, 0, 0);
  return { geo: g, zt0, zt1 };
}

/** footprint (length x width) of the procedural vehicle for a model, in metres */
export const carSize = (k: CarKey) => ({ L: DIM[STYLE[k]].L, W: DIM[STYLE[k]].W });

/**
 * A stylised vehicle built from primitives. Local frame: nose points to +Z, width along X, up is +Y.
 * It is deliberately generic: a licensed .glb model can replace this component without touching the scene.
 */
function ProceduralCar({ carKey, dim }: { carKey: CarKey; dim?: boolean }) {
  const d = DIM[STYLE[carKey]];
  const paint = CAR_COLOR[carKey];
  const blob = useMemo(() => blobTexture(), []);
  const body = useMemo(() => bodyGeometry(d), [d]);
  const cabin = useMemo(() => cabinGeometry(d), [d]);
  const wheelPos: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const top = d.ride + d.H + 0.04;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <planeGeometry args={[d.W * 1.9, d.L * 1.25]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={dim ? 0.5 : 0.9} />
      </mesh>
      {/* underbody */}
      <mesh position={[0, d.ride + 0.08, 0]} castShadow>
        <boxGeometry args={[d.W * 0.9, 0.16, d.L * 0.9]} />
        <meshStandardMaterial color="#15171a" roughness={0.9} />
      </mesh>
      {/* body shell */}
      <mesh geometry={body} position={[0, d.ride + 0.06, 0]} castShadow>
        <meshStandardMaterial color={paint} metalness={0.55} roughness={0.3} envMapIntensity={1.1} transparent={dim} opacity={dim ? 0.7 : 1} />
      </mesh>
      {/* glasshouse + roof */}
      <mesh geometry={cabin.geo} position={[0, top - 0.02, 0]} castShadow>
        <meshStandardMaterial color="#0f141b" metalness={0.85} roughness={0.06} envMapIntensity={1.7} />
      </mesh>
      <RoundedBox args={[d.W * 0.82, 0.07, cabin.zt1 - cabin.zt0 + 0.08]} radius={0.03} smoothness={3} position={[0, top + d.cabH - 0.02, (cabin.zt0 + cabin.zt1) / 2]} castShadow>
        <meshStandardMaterial color={paint} metalness={0.55} roughness={0.3} envMapIntensity={1.1} />
      </RoundedBox>
      {/* wheels */}
      {wheelPos.map(([sx, sz]) => (
        <group key={`${sx}${sz}`} position={[sx * (d.W / 2 - 0.1), d.wheel, sz * d.L * 0.31]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[d.wheel, d.wheel, 0.27, 20]} />
            <meshStandardMaterial color="#15171a" roughness={0.9} />
          </mesh>
          <mesh position={[0, sx * 0.14, 0]}>
            <cylinderGeometry args={[d.wheel * 0.62, d.wheel * 0.62, 0.02, 16]} />
            <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {/* lights */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * d.W * 0.34, d.ride + d.H * 0.62, d.L / 2 - 0.01]}>
            <boxGeometry args={[0.38, 0.11, 0.06]} />
            <meshStandardMaterial color="#fffbe8" emissive="#fff2c4" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[s * d.W * 0.36, d.ride + d.H * 0.74, -d.L / 2 + 0.01]}>
            <boxGeometry args={[0.4, 0.1, 0.06]} />
            <meshStandardMaterial color="#d42a2a" emissive="#ff3030" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, d.ride + d.H * 0.36, d.L / 2 - 0.0]}>
        <boxGeometry args={[d.W * 0.46, 0.2, 0.04]} />
        <meshStandardMaterial color="#0c0d0f" roughness={0.6} />
      </mesh>
      {/* mirrors */}
      {[-1, 1].map((s) => (
        <mesh key={`m${s}`} position={[s * (d.W / 2 + 0.05), top + 0.1, d.cabZ + d.cabLb * 0.3]}>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color={paint} metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** a licensed .glb from public/models, fitted to a real car's length and sat on the floor */
function ModelCar({ entry, carKey, dim }: { entry: ModelEntry; carKey: CarKey; dim?: boolean }) {
  const gltf = useGLTF(entry.url);
  const fit = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.rotation.y = ((entry.rotY ?? 0) * Math.PI) / 180;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = (carSize(carKey).L / Math.max(size.z, 0.001)) * (entry.scale ?? 1);
    const c = box.getCenter(new THREE.Vector3());
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return { root, k, offset: new THREE.Vector3(-c.x * k, -box.min.y * k, -c.z * k) };
  }, [gltf, entry, carKey]);
  const blob = useMemo(() => blobTexture(), []);
  const { L, W } = carSize(carKey);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <planeGeometry args={[W * 1.9, L * 1.25]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} opacity={dim ? 0.5 : 0.9} />
      </mesh>
      <group position={fit.offset} scale={fit.k}>
        <primitive object={fit.root} />
      </group>
    </group>
  );
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('3D vehicle model could not be loaded, using the built-in car', e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The vehicle in a bay: the manifest's .glb when there is one, otherwise the built-in stylised car. */
export function Car3D({ carKey, dim }: { carKey: CarKey; dim?: boolean }) {
  const entry = useCarModel(carKey);
  const fallback = <ProceduralCar carKey={carKey} dim={dim} />;
  if (!entry) return fallback;
  return (
    <ModelBoundary key={entry.url} fallback={fallback}>
      <Suspense fallback={fallback}>
        <ModelCar entry={entry} carKey={carKey} dim={dim} />
      </Suspense>
    </ModelBoundary>
  );
}

export type { Style as CarStyle };
