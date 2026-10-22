import type { CSSProperties, ReactNode } from 'react';
import { C } from '../theme';

/** a modern phone: bezel, island, rounded screen */
export function Phone({ w = 410, h = 886, children, style }: { w?: number; h?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: 'relative', width: w + 28, height: h + 28, borderRadius: 66, background: 'linear-gradient(145deg,#2b2e35,#0e0f12)', padding: 14, boxShadow: '0 50px 110px rgba(30,20,10,0.38), 0 0 0 2px #3a3d45 inset, 0 0 0 1px rgba(255,255,255,0.08)', ...style }}>
      <div style={{ position: 'relative', width: w, height: h, borderRadius: 52, overflow: 'hidden', background: '#f7efe5' }}>{children}</div>
      <div style={{ position: 'absolute', top: 26, left: '50%', width: 108, height: 30, marginLeft: -54, borderRadius: 18, background: '#050506' }} />
    </div>
  );
}

export function Laptop({ w = 880, children, style }: { w?: number; children: ReactNode; style?: CSSProperties }) {
  const h = (w * 9) / 16;
  return (
    <div style={{ position: 'relative', width: w + 40, ...style }}>
      <div style={{ width: w + 40, height: h + 36, borderRadius: 26, background: 'linear-gradient(160deg,#2b2e35,#0e0f12)', padding: 18, boxShadow: '0 50px 100px rgba(30,20,10,0.35), 0 0 0 2px #3a3d45 inset' }}>
        <div style={{ position: 'relative', width: w, height: h, borderRadius: 10, overflow: 'hidden', background: '#eef3fa' }}>{children}</div>
      </div>
      <div style={{ width: w + 120, height: 22, marginLeft: -40, borderRadius: '0 0 22px 22px', background: 'linear-gradient(#cfd3da,#9ba1ab)', boxShadow: '0 18px 36px rgba(30,20,10,0.28)' }} />
    </div>
  );
}

export function Tablet({ w = 560, children, style }: { w?: number; children: ReactNode; style?: CSSProperties }) {
  const h = (w * 3) / 4;
  return (
    <div style={{ width: w + 36, height: h + 36, borderRadius: 40, background: 'linear-gradient(145deg,#2b2e35,#0e0f12)', padding: 18, boxShadow: '0 50px 100px rgba(30,20,10,0.35), 0 0 0 2px #3a3d45 inset', ...style }}>
      <div style={{ position: 'relative', width: w, height: h, borderRadius: 22, overflow: 'hidden', background: '#f7efe5' }}>{children}</div>
    </div>
  );
}

/** a small label pill used to name each portal */
export function PortalTag({ text, color = C.coral, style }: { text: string; color?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 999, padding: '10px 22px 10px 16px', boxShadow: '0 10px 28px rgba(60,40,20,0.16)', fontWeight: 800, fontSize: 24, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink, ...style }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
      {text}
    </div>
  );
}
