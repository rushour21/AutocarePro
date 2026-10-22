import type { CSSProperties, ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FPS, clamp01, eout, sp } from '../theme';

export interface Word {
  text: ReactNode;
  /** seconds when the word lands */
  at: number;
  color?: string;
  style?: CSSProperties;
}

/** word-by-word type: each word springs up from below with a short blur-in, so it can be locked to the voice-over */
export function Kinetic({ words, size = 150, weight = 800, color = C.ink, gap = 0.26, wrap = false, style }: { words: Word[]; size?: number; weight?: number; color?: string; gap?: number; wrap?: boolean; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', whiteSpace: 'nowrap', gap: `0 ${size * gap}px`, fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: weight, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1.02, color, ...style }}>
      {words.map((w, i) => {
        const p = sp(frame, w.at, { damping: 16, stiffness: 150 });
        const o = clamp01((frame / FPS - w.at) / 0.18);
        return (
          <span key={i} style={{ display: 'inline-block', color: w.color, opacity: o, transform: `translateY(${(1 - p) * size * 0.45}px) rotate(${(1 - p) * 2.5}deg)`, filter: `blur(${(1 - eout(clamp01((frame / FPS - w.at) / 0.4))) * 14}px)`, ...w.style }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
