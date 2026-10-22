import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Grain, Vignette } from './components/Bits';
import { C, FPS, W, H, clamp01, cues, eio, eout, prog } from './theme';
import { Close } from './scenes/Close';
import { Customer } from './scenes/Customer';
import { Dashboard3D } from './scenes/Dashboard3D';
import { Hook } from './scenes/Hook';
import { Logo } from './scenes/Logo';
import { Studio } from './scenes/Studio';
import { Studio3D } from './scenes/Studio3D';
import { Tech } from './scenes/Tech';

const within = (t: number, a: number, b: number) => t >= a && t < b;

/** a coloured panel sweeping across the frame; the screen is fully covered at `at` */
function Wipe({ at, dir, color = C.coral, dur = 0.8 }: { at: number; dir: 'l' | 'r' | 'u' | 'd'; color?: string; dur?: number }) {
  const frame = useCurrentFrame();
  const u = clamp01((frame / FPS - (at - dur / 2)) / dur);
  if (u <= 0 || u >= 1) return null;
  const p = eio(u);
  const sizeX = dir === 'l' || dir === 'r' ? W * 1.25 : W, sizeY = dir === 'u' || dir === 'd' ? H * 1.25 : H;
  const pos = (v: number) => lerp2(-1, 1, v);
  const tx = dir === 'r' ? pos(p) * W * 1.1 : dir === 'l' ? -pos(p) * W * 1.1 : 0;
  const ty = dir === 'd' ? pos(p) * H * 1.1 : dir === 'u' ? -pos(p) * H * 1.1 : 0;
  return (
    <div style={{ position: 'absolute', left: (W - sizeX) / 2 + tx, top: (H - sizeY) / 2 + ty, width: sizeX, height: sizeY, background: color, boxShadow: '0 0 120px rgba(0,0,0,0.25)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.18), transparent 40%)' }} />
    </div>
  );
}
const lerp2 = (a: number, b: number, t: number) => a + (b - a) * t;

/** a circle that grows to cover the frame, then shrinks away from the same centre */
function Iris({ at, color = C.coral, dur = 0.9 }: { at: number; color?: string; dur?: number }) {
  const frame = useCurrentFrame();
  const u = clamp01((frame / FPS - (at - dur / 2)) / dur);
  if (u <= 0 || u >= 1) return null;
  const r = u < 0.5 ? eout(u * 2) * 1400 : (1 - eio((u - 0.5) * 2)) * 1400;
  return <div style={{ position: 'absolute', left: W / 2 - r, top: H / 2 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: color }} />;
}

export const Film = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const L = cues.logo, R = cues.reveal, I = cues.interact, S = cues.studio, T = cues.tech, U = cues.cust, X = cues.close;
  const diveFlash = prog(frame, L.dive + 0.2, L.dive + 0.55) * (1 - prog(frame, R.start + 0.0, R.start + 0.45));
  return (
    <AbsoluteFill style={{ background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {within(t, 0, 7.7) && <Hook />}
      {within(t, 7.2, 10.95) && <Logo />}
      {within(t, 10.6, I.end + 0.1) && <Dashboard3D />}
      {within(t, I.end - 0.05, S.to3d + 0.6) && <Studio />}
      {within(t, S.to3d - 0.15, T.start + 0.2) && <Studio3D />}
      {within(t, T.start - 0.05, U.start + 0.15) && <Tech />}
      {within(t, U.start - 0.05, X.start + 0.15) && <Customer />}
      {t >= X.start - 0.05 && <Close />}

      {/* transitions */}
      <AbsoluteFill style={{ background: '#fff', opacity: diveFlash, pointerEvents: 'none' }} />
      <Wipe at={I.end} dir="r" color={C.coral} />
      <Wipe at={T.start + 0.1} dir="d" color={C.ink} dur={0.75} />
      <Wipe at={U.start + 0.05} dir="l" color={C.coral} dur={0.75} />
      <Iris at={X.start} color={C.coral} />
      <Vignette strength={0.1} />
      <Grain opacity={0.035} />
      <span style={{ display: 'none' }}>{eout(0)}</span>
    </AbsoluteFill>
  );
};
