import type { CSSProperties, ReactNode } from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FPS, clamp01, eout, lerp, sp } from '../theme';

/** counts from `from` to `to` between two moments */
export function useCount(from: number, to: number, start: number, end: number) {
  const frame = useCurrentFrame();
  const p = eout(clamp01((frame / FPS - start) / (end - start)));
  return Math.round(lerp(from, to, p));
}

/** a captured UI sprite, placed in 1920x1080 space. `x`,`y`,`w` are the element's own box (the sprite carries 30px of shadow padding). */
export function Sprite({ name, x, y, w, k = 1.25, pad = 30, style, children }: { name: string; x: number; y: number; w: number; k?: number; pad?: number; style?: CSSProperties; children?: ReactNode }) {
  const natural = (w + pad * 2) * k;
  return (
    <div style={{ position: 'absolute', left: x - pad * k, top: y - pad * k, width: natural, ...style }}>
      <Img src={staticFile(`sprites/${name}.png`)} style={{ width: '100%', display: 'block' }} />
      {children}
    </div>
  );
}

/** spring entrance: slides + scales + fades in. dir: where it comes from */
export function Enter({ at, dx = 0, dy = 40, from = 0.92, children, style, soft = false }: { at: number; dx?: number; dy?: number; from?: number; children: ReactNode; style?: CSSProperties; soft?: boolean }) {
  const frame = useCurrentFrame();
  const p = sp(frame, at, soft ? { damping: 20, stiffness: 90 } : { damping: 15, stiffness: 130 });
  const o = clamp01((frame / FPS - at) / 0.22);
  return <div style={{ opacity: o, transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px) scale(${lerp(from, 1, p)})`, ...style }}>{children}</div>;
}

export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const frame = useCurrentFrame();
  const ox = (frame * 97) % 512, oy = (frame * 61) % 512;
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url(${staticFile('grain.png')})`, backgroundPosition: `${ox}px ${oy}px`, mixBlendMode: 'overlay', opacity }} />;
}

export function Vignette({ strength = 0.28 }: { strength?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,24,20,${strength}) 100%)` }} />;
}

/** soft ivory/coral backdrop with slow drifting light */
export function Backdrop({ tone = 'ivory', t = 0 }: { tone?: 'ivory' | 'sky' | 'dark'; t?: number }) {
  const bg = tone === 'ivory' ? `linear-gradient(160deg, ${C.ivory2}, ${C.ivory})` : tone === 'sky' ? `linear-gradient(180deg, ${C.sky1}, ${C.sky2})` : 'linear-gradient(160deg, #23262d, #14161a)';
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg }}>
      <div style={{ position: 'absolute', left: `${20 + Math.sin(t * 0.4) * 6}%`, top: `${-10 + Math.cos(t * 0.3) * 5}%`, width: 900, height: 900, borderRadius: '50%', background: tone === 'dark' ? 'radial-gradient(circle, rgba(242,106,46,0.25), transparent 65%)' : 'radial-gradient(circle, rgba(255,160,110,0.30), transparent 65%)', filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', right: `${-5 + Math.cos(t * 0.35) * 5}%`, bottom: `${-20 + Math.sin(t * 0.25) * 6}%`, width: 1000, height: 1000, borderRadius: '50%', background: tone === 'dark' ? 'radial-gradient(circle, rgba(47,107,255,0.2), transparent 65%)' : 'radial-gradient(circle, rgba(120,160,255,0.22), transparent 65%)', filter: 'blur(40px)' }} />
    </div>
  );
}
