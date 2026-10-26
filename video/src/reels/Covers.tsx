import { AbsoluteFill } from 'remotion';
import { Backdrop, Grain, Vignette } from '../components/Bits';
import { LogoMark, Wordmark } from '../components/Brand';
import { C, Caps, CardPop, PhoneRig, type CardSpec, type Layer } from './kit';

/** 1080 x 1920 cover frames (render the still at frame 80, once the words have landed) */
type Cover = { text: string; tone: 'ivory' | 'sky'; phone?: { layer: Layer['src']; fy: number; z: number }; card?: CardSpec };
const COVERS: Cover[] = [
  { text: '“Is my car ready?” *20 times* a day.', tone: 'ivory', phone: { layer: 'r1_repair', fy: 560, z: 1.3 } },
  { text: 'Where is *every car* in your workshop?', tone: 'sky', phone: { layer: 'r2_map', fy: 380, z: 1.35 } },
  { text: 'Mechanics, without the *running around.*', tone: 'ivory', card: { name: 'r3_job', from: -3, to: 999, cx: 540, cy: 1060, s: 2.7, rot: -2 } },
  { text: 'Extra work found. *No reply?*', tone: 'ivory', card: { name: 'r4_est', from: -3, to: 999, cx: 540, cy: 1090, s: 2.35, rot: 2 } },
  { text: 'Insurance jobs: *big tickets,* big headaches.', tone: 'ivory', card: { name: 'r5_cust_a', from: -3, to: 999, cx: 540, cy: 1060, s: 2.6, rot: -1 } },
];

export const Cover = ({ n }: { n: number }) => {
  const c = COVERS[n - 1];
  const layers: Layer[] = c.phone ? [{ src: c.phone.layer, from: -2, to: 999, view: [[0, c.phone.fy, c.phone.z, 195]] }] : [];
  return (
    <AbsoluteFill style={{ background: C.ivory, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <Backdrop tone={c.tone} t={1.2} />
      <div style={{ position: 'absolute', left: 70, top: 110, display: 'flex', alignItems: 'center', gap: 18 }}><LogoMark size={64} draw={1} /><Wordmark size={54} /></div>
      <Caps caps={[{ from: -3, to: 999, text: c.text, size: 84, y: 262 }]} />
      {c.phone ? <PhoneRig enter={-3} layers={layers} y={640} /> : c.card ? <CardPop c={c.card} /> : null}
      <Vignette strength={0.08} />
      <Grain opacity={0.03} />
    </AbsoluteFill>
  );
};
