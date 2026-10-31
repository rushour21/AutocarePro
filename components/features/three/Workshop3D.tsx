'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SpinningGear } from '@/components/ui/Mechanical';
import { bayType } from '@/lib/layout';
import { FloorPlan } from '@/components/features/layout/FloorPlan';
import type { BayOccupant } from '@/components/features/layout/FloorPlan';
import type { SceneProps } from './WorkshopScene3D';

const Scene = dynamic(() => import('./WorkshopScene3D'), { ssr: false });

const STATUS = ['Laying out the bays', 'Parking the cars', 'Switching on the lights', 'Almost ready'];
/** Longest the loader stays up if the scene never reports back. */
const MAX_WAIT_MS = 8000;

/** Shown over the 3D view until its first frame: a workshop blueprint with the gears turning. */
function SceneLoader({ done }: { done: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STATUS.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-label="Loading 3D view" className={clsx('scene-grid absolute inset-0 z-[5] flex items-center justify-center overflow-hidden transition-opacity duration-500', done && 'pointer-events-none opacity-0')}>
      <div className="grid w-[min(70%,300px)] grid-cols-3 gap-2 opacity-60" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((n) => <span key={n} className="scene-bay h-12 rounded-md border border-dashed border-info/50" style={{ animationDelay: `${n * 140}ms` }} />)}
      </div>
      <div className="glass absolute flex items-center gap-3 rounded-2xl px-4 py-3">
        <div className="relative h-10 w-[46px] shrink-0">
          <SpinningGear teeth={12} seconds={3} className="absolute left-0 top-0 h-7 w-7 text-coral-500" />
          <SpinningGear teeth={8} seconds={2} reverse className="absolute bottom-0 right-0 h-5 w-5 text-ink-500" />
        </div>
        <div className="leading-tight"><p className="text-sm font-bold">Preparing your workshop</p><p className="text-xs text-ink-500">{STATUS[i]}…</p></div>
      </div>
    </div>
  );
}

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class Boundary extends Component<{ fallback: ReactNode; onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    console.warn('3D view failed, showing the 2D plan instead', e);
    this.props.onFail();
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
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => setGl(supportsWebGL()), []);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 500);
    return () => clearTimeout(t);
  }, [ready]);

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
      {gl === null ? null : gl ? <Boundary fallback={flat} onFail={() => setReady(true)}><Scene {...props} onReady={() => setReady(true)} /></Boundary> : flat}
      {gl !== false && !gone && <SceneLoader done={ready} />}
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
