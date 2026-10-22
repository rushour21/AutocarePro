'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { bayType } from '@/lib/layout';
import { FloorPlan } from '@/components/features/layout/FloorPlan';
import type { BayOccupant } from '@/components/features/layout/FloorPlan';
import type { SceneProps } from './WorkshopScene3D';

const Scene = dynamic(() => import('./WorkshopScene3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-ink-400" role="status">
      Loading 3D view…
    </div>
  ),
});

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('3D view failed, showing the 2D plan instead', e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Lazy-loaded 3D workshop. Falls back to the 2D floor plan when WebGL is unavailable or the scene throws,
 * and always exposes the bays as a keyboard / screen-reader list (the canvas itself is decorative).
 */
export function Workshop3D(props: SceneProps) {
  const { layout, occupants, idle, selectedId, onSelect } = props;
  const [gl, setGl] = useState<boolean | null>(null);
  useEffect(() => setGl(supportsWebGL()), []);

  const flat = (
    <div className="flex h-full w-full items-center justify-center p-3">
      <FloorPlan
        layout={layout}
        mode="view"
        selectedId={selectedId}
        onSelect={onSelect}
        occupants={Object.fromEntries(Object.entries(occupants ?? {}).map(([k, v]) => [k, v && ({ carKey: v.carKey, title: v.title } as BayOccupant)]))}
        className="max-h-full"
      />
    </div>
  );

  return (
    <div className="relative h-full w-full">
      {gl === null ? null : gl ? <Boundary fallback={flat}><Scene {...props} /></Boundary> : flat}
      <ul className="sr-only" aria-label="Service bays">
        {layout.bays.map((b) => {
          const o = occupants?.[b.id];
          const text = o ? `${o.title}, ${o.chip}` : `empty, ${idle?.(b).text ?? 'available'}`;
          return (
            <li key={b.id}>
              <button type="button" aria-pressed={selectedId === b.id} aria-label={`${b.name}: ${text}`} onClick={() => onSelect?.(b.id)}>
                {b.name} {bayType(b.type).label} {text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
