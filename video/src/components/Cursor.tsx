import { useCurrentFrame } from 'remotion';
import { FPS, clamp01, eio, lerp, eout } from '../theme';

export interface CursorKey {
  /** seconds */
  t: number;
  x: number;
  y: number;
  /** a click happens when the cursor arrives at this key */
  click?: boolean;
}

/** position of a scripted cursor at `frame`, easing between keys, with a soft overshoot-free glide */
export function cursorAt(frame: number, keys: CursorKey[]) {
  const t = frame / FPS;
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i];
      const p = eio(clamp01((t - a.t) / (b.t - a.t)));
      // gentle arc so the path never looks ruler-straight
      const arc = Math.sin(p * Math.PI) * Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.06);
      return { x: lerp(a.x, b.x, p) + arc * 0.4, y: lerp(a.y, b.y, p) - arc };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y };
}

/** a visible mouse pointer with click ripples at every key marked `click` */
export function Cursor({ keys, scale = 1, visible = 1 }: { keys: CursorKey[]; scale?: number; visible?: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { x, y } = cursorAt(frame, keys);
  const clicks = keys.filter((k) => k.click);
  const last = [...clicks].reverse().find((k) => t >= k.t);
  const since = last ? t - last.t : 99;
  const press = last && since < 0.16 ? 1 - since / 0.16 : 0;
  return (
    <>
      {clicks.map((k, i) => {
        const d = t - k.t;
        if (d < 0 || d > 0.75) return null;
        const p = eout(clamp01(d / 0.75));
        return (
          <div key={i} style={{ position: 'absolute', left: k.x, top: k.y, width: 0, height: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', width: 120 * p + 20, height: 120 * p + 20, left: -(60 * p + 10), top: -(60 * p + 10), borderRadius: '50%', border: '4px solid rgba(242,106,46,0.8)', opacity: 1 - p }} />
            <div style={{ position: 'absolute', width: 56, height: 56, left: -28, top: -28, borderRadius: '50%', background: 'rgba(242,106,46,0.35)', opacity: (1 - p) * 0.8, transform: `scale(${0.4 + p})` }} />
          </div>
        );
      })}
      <svg width={44 * scale} height={52 * scale} viewBox="0 0 44 52" style={{ position: 'absolute', left: x - 6 * scale, top: y - 4 * scale, opacity: visible, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))', transform: `scale(${1 - press * 0.12})`, transformOrigin: '6px 4px', pointerEvents: 'none' }}>
        <path d="M6 4 L6 40 L15 31 L22 46 L29 43 L22 29 L35 29 Z" fill="#ffffff" stroke="#1c1d20" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </>
  );
}
