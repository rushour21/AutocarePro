import { Easing, interpolate, spring } from 'remotion';
import cues from './cues.json';
import timing from './timing.json';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const TOTAL_FRAMES = Math.ceil(timing.total * FPS);
export { cues, timing };

export const C = {
  coral: '#f26a2e',
  coralDark: '#e4561b',
  coralSoft: '#ffe6d8',
  ink: '#1c1d20',
  ink2: '#55565a',
  ivory: '#f7efe5',
  ivory2: '#fbf5ec',
  blue: '#2f6bff',
  green: '#1d9d65',
  violet: '#7456f0',
  amber: '#ee8a12',
  steel: '#59616d',
  sky1: '#eef3fa',
  sky2: '#d9e2ef',
};

export const f = (sec: number) => Math.round(sec * FPS);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const eio = Easing.bezier(0.65, 0, 0.35, 1);
export const eout = Easing.bezier(0.16, 1, 0.3, 1);
export const ein = Easing.bezier(0.5, 0, 0.9, 0.4);

/** time-based progress 0..1 between two moments (seconds) */
export const prog = (frame: number, from: number, to: number, ease: (t: number) => number = eio) => ease(clamp01((frame / FPS - from) / Math.max(0.0001, to - from)));

/** a spring that starts at `at` seconds */
export const sp = (frame: number, at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: frame - at * FPS, fps: FPS, config: { damping: 15, stiffness: 120, mass: 0.9, ...cfg } });

/** piecewise-linear keyframes in seconds with easing between each pair */
export function track(frame: number, keys: [number, number][], ease: (t: number) => number = eio) {
  const t = frame / FPS;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return lerp(v0, v1, ease(clamp01((t - t0) / (t1 - t0))));
    }
  }
  return keys[keys.length - 1][1];
}
export { interpolate };
