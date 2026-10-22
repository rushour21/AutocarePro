import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop } from '../components/Bits';
import { LogoMark } from '../components/Brand';
import { C, FPS, clamp01, cues, ein, eout, lerp, prog, sp } from '../theme';

const L = cues.logo;

export const Logo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const draw = prog(frame, L.draw, L.draw + 0.9, eout);
  const word = L.word;
  const dive = prog(frame, L.dive, L.dive + 0.6, ein);
  const ring = eout(clamp01((t - L.draw - 0.7) / 0.9));
  const letters = 'AutoHub'.split('');
  const tag = clamp01((t - L.tag) / 0.5);
  return (
    <AbsoluteFill>
      <Backdrop tone="ivory" t={t} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `scale(${1 + dive * dive * 38})`, transformOrigin: '50% 46%', opacity: 1 - clamp01((dive - 0.7) / 0.3) }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, marginTop: -30 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -60, borderRadius: '50%', border: `3px solid ${C.coral}`, opacity: (1 - ring) * 0.7, transform: `scale(${0.6 + ring * 1.1})` }} />
            <LogoMark size={250} draw={draw} glow={draw > 0.95 ? 0.6 : 0} />
          </div>
          <div style={{ display: 'flex' }}>
            {letters.map((ch, i) => {
              const p = sp(frame, word + i * 0.06, { damping: 14, stiffness: 140 });
              return (
                <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 90}px)`, opacity: clamp01((t - word - i * 0.06) / 0.15), filter: `blur(${(1 - p) * 10}px)`, fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 800, fontSize: 150, letterSpacing: '-0.035em', color: C.ink, lineHeight: 1 }}>
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, color: '#77746f', opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`, letterSpacing: '-0.01em' }}>Everything, in front of you.</div>
        </div>
      </div>
      <span style={{ display: 'none' }}>{lerp(0, 1, 0)}</span>
    </AbsoluteFill>
  );
};
