import type { CSSProperties, ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FPS, clamp01, eout, lerp, sp } from '../theme';

export const glass: CSSProperties = {
  background: 'rgba(255,255,255,0.86)',
  borderRadius: 26,
  boxShadow: '0 12px 34px rgba(60,75,100,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
  border: '1px solid rgba(255,255,255,0.7)',
};

/** a KPI card in the dashboard's own style, so the number can count up */
export function Kpi({ at, x, y, icon, tint, value, label, sub, trend, count }: { at: number; x: number; y: number; icon: ReactNode; tint: string; value: number; label: string; sub?: string; trend: { up: boolean; n: number }; count: [number, number] }) {
  const frame = useCurrentFrame();
  const p = sp(frame, at, { damping: 15, stiffness: 130 });
  const shown = Math.round(lerp(0, value, eout(clamp01((frame / FPS - count[0]) / (count[1] - count[0])))));
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 252, height: 96, opacity: clamp01((frame / FPS - at) / 0.2), transform: `translateY(${(1 - p) * 50}px) scale(${lerp(0.9, 1, p)})`, ...glass, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
      <div style={{ width: 54, height: 54, borderRadius: '50%', background: tint, display: 'grid', placeItems: 'center', boxShadow: '0 0 0 5px rgba(255,255,255,0.75)', flexShrink: 0 }}>{icon}</div>
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: trend.up ? C.green : '#e5482d' }}>{trend.up ? '↑' : '↓'} {trend.n}</span>
        </div>
        <div style={{ fontSize: 15, color: '#77746f', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: '#e5482d', fontWeight: 600, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/** the bay chip from the 3D view: name + stage, with a coloured dot */
export function Chip({ x, y, name, text, color, pop = 1, selected = false, scale = 1.2, flash = 0 }: { x: number; y: number; name: string; text: string; color: string; pop?: number; selected?: boolean; scale?: number; flash?: number }) {
  if (pop <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${pop * scale})`, transformOrigin: '50% 100%', opacity: clamp01(pop * 1.6), whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', borderRadius: 11, padding: '5px 10px 5px 9px', boxShadow: selected ? '0 0 0 3px #f26a2e, 0 8px 22px rgba(40,50,70,0.3)' : `0 5px 16px rgba(40,50,70,0.28), 0 0 0 ${flash * 5}px rgba(242,106,46,${0.35 * flash})` }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ lineHeight: 1.12 }}>
          <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#26272b' }}>{name}</span>
          <span style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color }}>{text}</span>
        </span>
      </div>
    </div>
  );
}

/** a pill that points at something with a leader line, for narrated highlights */
export function Callout({ at, to, from, text, sub, hold = 1.0 }: { at: number; to: { x: number; y: number }; from: { x: number; y: number }; text: string; sub?: string; hold?: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const inP = eout(clamp01((t - at) / 0.45));
  const outP = clamp01((t - (at + hold)) / 0.35);
  const a = inP * (1 - outP);
  if (a <= 0.001) return null;
  const mx = lerp(from.x, to.x, inP), my = lerp(from.y, to.y, inP);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: a }}>
        <line x1={from.x} y1={from.y} x2={mx} y2={my} stroke={C.coral} strokeWidth={3} strokeLinecap="round" />
        <circle cx={to.x} cy={to.y} r={10 + 26 * (1 - inP)} fill="none" stroke={C.coral} strokeWidth={4} opacity={inP} />
        <circle cx={to.x} cy={to.y} r={6} fill={C.coral} opacity={inP} />
      </svg>
      <div style={{ position: 'absolute', left: from.x, top: from.y, transform: `translate(-50%, -100%) translateY(${(1 - inP) * 18}px) scale(${lerp(0.9, 1, inP)})`, opacity: a, background: C.ink, color: '#fff', borderRadius: 16, padding: '12px 22px', boxShadow: '0 14px 34px rgba(20,20,30,0.35)', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{text}</div>
        {sub && <div style={{ fontSize: 16, color: '#ffb48a', fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      </div>
    </>
  );
}
