import { useCurrentFrame } from 'remotion';
import { Car, HelpCircle, User } from 'lucide-react';
import { C, Caps, FPS, Pill, PhoneRig, ReelStage, clamp01, eio, eout, lerp, sp, type CapSpec, type Layer } from './kit';
import { TG } from './targets';

export const R2_DUR = 18.6;

/** hook: question bubbles floating around */
function Questions() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > 5.8) return null;
  const out = eio(clamp01((t - 4.9) / 0.5));
  const qs: [string, number, number, number, number][] = [
    ['Which car is in Bay 3?', 70, 700, 3.35, -3], ['Who is on the Creta?', 330, 880, 4.0, 3], ['Is the Fortuner done?', 90, 1060, 4.5, -2],
  ];
  return (
    <>
      {[...Array(7)].map((_, i) => {
        const a = 1.0 + i * 0.22;
        const p = sp(frame, a, { damping: 11, stiffness: 140 });
        const x = [110, 760, 420, 900, 230, 640, 60][i], y = [700, 760, 1180, 1100, 1300, 560, 1020][i];
        return <HelpCircle key={i} size={[110, 90, 130, 80, 100, 74, 120][i]} color={i % 2 ? C.coral : '#c9bfb2'} strokeWidth={2.4} style={{ position: 'absolute', left: x, top: y + Math.sin(t * 1.6 + i) * 14, transform: `scale(${p}) rotate(${(i - 3) * 6}deg)`, opacity: (1 - out) * 0.9 }} />;
      })}
      {qs.map(([text, x, y, at, rot]) => {
        const p = sp(frame, at, { damping: 12, stiffness: 150 });
        return (
          <div key={text} style={{ position: 'absolute', left: x, top: y, opacity: clamp01((t - at) / 0.15) * (1 - out), transform: `scale(${lerp(0.7, 1, p)}) rotate(${rot}deg) translateY(${out * 600}px)`, background: '#fff', borderRadius: 38, padding: '26px 38px', fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: '0 20px 50px rgba(60,40,20,0.2)' }}>{text}</div>
        );
      })}
    </>
  );
}

const home = [330, 1.0] as const;
const layers: Layer[] = [
  { src: 'r2_home', from: 5.5, to: 7.7, view: [[5.5, 330, 1.0], [7.2, 430, 1.2]] },
  { src: 'r2_map', from: 7.5, to: 10.3, view: [[7.5, 360, 1.1], [9.2, 367, 1.55, 226]], taps: [{ t: 9.6, ...TG.r2_bay3 }] },
  { src: 'r2_bay', from: 10.1, to: 11.7, view: [[10.1, 420, 1.15], [11.6, 560, 1.2]] },
  { src: 'r2_bay_detail', from: 11.5, to: 13.2, view: [[11.5, 320, 1.3], [12.3, 330, 1.4, 120]], taps: [{ t: 12.7, ...TG.r2_viewjob }] },
  { src: 'r2_job', from: 13.0, to: 15.2, view: [[13.0, 300, 1.1], [15.0, 420, 1.1]] },
  { src: 'r2_map', from: 15.0, to: 16.9, view: [[15.0, 360, 1.0], [16.8, 380, 1.08]] },
];
void home;

const caps: CapSpec[] = [
  { from: 0.95, to: 3.3, text: 'Where is *every car* in your workshop right now?' },
  { from: 3.4, to: 5.3, text: 'Which car in *Bay 3?* Who’s on the Creta?' },
  { from: 5.6, to: 9.0, text: '' },
  { from: 9.1, to: 12.0, text: 'Tap any *bay.*' },
  { from: 12.1, to: 14.9, text: 'See the *job card.*' },
  { from: 15.0, to: 16.6, text: 'Your whole workshop. *One screen.*' },
];

export const Reel2 = () => (
  <ReelStage dur={R2_DUR} kicker="See your whole floor live" sub="Built for Pune garages" tone="sky">
    <Questions />
    <Caps caps={caps} />
    <PhoneRig enter={4.9} layers={layers} />
    <Pill at={9.9} to={11.8} x={560} y={600} tone="dark" size={36} rot={3}><Car size={36} /> Bay 3 · Honda City</Pill>
    <Pill at={10.9} to={12.6} x={90} y={650} tone="coral" size={34} rot={-3}><User size={34} /> Priya Singh is on it</Pill>
    <Pill at={13.4} to={15.0} x={600} y={620} tone="white" size={36} rot={3}>Inspection · 15%</Pill>
  </ReelStage>
);
