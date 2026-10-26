import { AbsoluteFill } from 'remotion';
import { Backdrop, Grain, Vignette } from '../components/Bits';
import { LogoMark, Wordmark } from '../components/Brand';
import { C, Caps, PhoneRig, type Layer } from './kit';

/** 1080 x 1920 cover frames (render the still at frame 80, once the words have landed) */
const COVERS: { text: string; layer: Layer['src']; fy: number; z: number; fx?: number; tone: 'ivory' | 'sky' }[] = [
  { text: '“Is my car ready?” *20 times* a day.', layer: 'r1_repair', fy: 560, z: 1.3, tone: 'ivory' },
  { text: 'Where is *every car* in your workshop?', layer: 'r2_map', fy: 380, z: 1.35, tone: 'sky' },
  { text: 'Mechanics, without the *running around.*', layer: 'r3_jobs', fy: 420, z: 1.2, tone: 'ivory' },
  { text: 'Extra work found… *customer not picking up?*', layer: 'r4_est', fy: 430, z: 1.15, tone: 'ivory' },
  { text: 'Insurance jobs: *big tickets,* big headaches.', layer: 'r5_cust', fy: 330, z: 1.3, tone: 'ivory' },
];

export const Cover = ({ n }: { n: number }) => {
  const c = COVERS[n - 1];
  const layers: Layer[] = [{ src: c.layer, from: -2, to: 999, view: [[0, c.fy, c.z, c.fx ?? 195]] }];
  return (
    <AbsoluteFill style={{ background: C.ivory, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <Backdrop tone={c.tone} t={1.2} />
      <div style={{ position: 'absolute', left: 70, top: 110, display: 'flex', alignItems: 'center', gap: 18 }}><LogoMark size={64} draw={1} /><Wordmark size={54} /></div>
      <Caps caps={[{ from: -3, to: 999, text: c.text, size: 92, y: 262 }]} />
      <PhoneRig enter={-3} layers={layers} y={640} />
      <Vignette strength={0.08} />
      <Grain opacity={0.03} />
    </AbsoluteFill>
  );
};
