'use client';

import { useId } from 'react';
import type { CarKey } from '@/lib/types';

/** Body colours per model, matched to the vehicle photos. */
export const CAR_COLOR: Record<CarKey, string> = {
  bmw3: '#f1f0ee',
  audiq5: '#34363b',
  glc: '#ecebe8',
  fortuner: '#2a2c30',
  bmwx5: '#f3f2f0',
  rangerover: '#9aa0a6',
};

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt >= 0 ? (255 - c) * amt : c * amt))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Gradients + shapes of the top-down car (nose at the bottom). Coordinate box is 0..100 x 0..250. */
export function CarTopShapes({ color = '#f1f0ee', idPrefix }: { color?: string; idPrefix: string }) {
  const id = idPrefix;
  const dark = shade(color, -0.12);
  const light = shade(color, 0.35);
  const roof = shade(color, -0.04);
  return (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dark} />
          <stop offset="0.5" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2e34" />
          <stop offset="1" stopColor="#14161a" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={roof} />
        </linearGradient>
      </defs>
      {[48, 176].flatMap((y) => [
        <rect key={`l${y}`} x="6.5" y={y} width="9" height="34" rx="4" fill="#16181b" />,
        <rect key={`r${y}`} x="84.5" y={y} width="9" height="34" rx="4" fill="#16181b" />,
      ])}
      <path d="M14 146c-5-1-9 0-10 4 0 3 3 5 10 4z" fill={dark} stroke={shade(color, -0.3)} strokeWidth="0.5" />
      <path d="M86 146c5-1 9 0 10 4 0 3-3 5-10 4z" fill={dark} stroke={shade(color, -0.3)} strokeWidth="0.5" />
      <path
        d="M50 2C31 2 21 6 18 16 15 30 14 50 14 70V182C14 207 16 226 22 238 28 247 38 249 50 249S72 247 78 238C84 226 86 207 86 182V70C86 50 85 30 82 16 79 6 69 2 50 2Z"
        fill={`url(#${id}b)`}
        stroke={shade(color, -0.28)}
        strokeWidth="1"
      />
      <path d="M24 12C34 8 66 8 76 12 78 22 78 32 77 40H23C22 32 22 22 24 12Z" fill={light} opacity="0.55" />
      <path d="M26 182H74C76 205 77 222 73 236 66 244 34 244 27 236 23 222 24 205 26 182Z" fill={light} opacity="0.5" />
      <path d="M50 186V240" stroke={shade(color, -0.2)} strokeWidth="0.8" opacity="0.6" />
      <path d="M27 42h46l5 21H22z" fill={`url(#${id}g)`} />
      <path d="M23 63h54v86H23z" fill={`url(#${id}r)`} stroke={shade(color, -0.22)} strokeWidth="0.8" />
      <path d="M30 70h40v72H30z" fill="none" stroke={shade(color, -0.1)} strokeWidth="0.6" opacity="0.7" />
      <path d="M22 149h56l-5 28H27z" fill={`url(#${id}g)`} />
      <path d="M17.5 66 23 63v86l-5.5 4z" fill={`url(#${id}g)`} />
      <path d="M82.5 66 77 63v86l5.5 4z" fill={`url(#${id}g)`} />
      <path d="M19 12c3-3 9-4 13-4l-1 6-12 2z" fill="#d8332b" />
      <path d="M81 12c-3-3-9-4-13-4l1 6 12 2z" fill="#d8332b" />
      <path d="M22 232c3 5 8 8 14 8l1-8z" fill="#fdfcf8" stroke="#bdb8b0" strokeWidth="0.6" />
      <path d="M78 232c-3 5-8 8-14 8l-1-8z" fill="#fdfcf8" stroke="#bdb8b0" strokeWidth="0.6" />
      <rect x="43" y="243" width="14" height="4" rx="1.5" fill="#25272b" />
    </>
  );
}

/** Standalone top-down vehicle (used by the inspection board). */
export function CarTopSvg({ color = '#f1f0ee', className }: { color?: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="-6 -4 112 258" className={className} role="img" aria-label="Vehicle top view">
      <defs>
        <filter id={`${id}s`} x="-30%" y="-10%" width="160%" height="125%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#8a6d4d" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter={`url(#${id}s)`}>
        <CarTopShapes color={color} idPrefix={id} />
      </g>
    </svg>
  );
}
