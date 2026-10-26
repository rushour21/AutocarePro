import { useCurrentFrame } from 'remotion';
import { AlertTriangle, Clock, FileWarning, Users } from 'lucide-react';
import { C, Caps, FPS, Pill, PhoneRig, ReelStage, clamp01, eio, eout, lerp, sp, type CapSpec, type Layer } from './kit';
import { TG } from './targets';

export const R5_DUR = 26.6;

/** hook: four quick problem flashes */
function Flashes() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > 6.3) return null;
  const items: [string, typeof FileWarning, number][] = [
    ['Missing documents', FileWarning, 3.0], ['Surveyor delays', Clock, 3.75], ['Customer fights at delivery', Users, 4.5], ['Payment pending 45 days', AlertTriangle, 5.25],
  ];
  const out = eio(clamp01((t - 5.9) / 0.4));
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 620, height: 800, opacity: 1 - out }}>
      {items.map(([txt, Icon, at], i) => {
        const active = t >= at && t < at + 0.75;
        const past = t >= at + 0.75;
        const p = sp(frame, at, { damping: 11, stiffness: 190 });
        const rot = [-3, 2.5, -2, 3][i];
        return (
          <div key={txt} style={{ position: 'absolute', left: 0, right: 0, top: i * 196 + (active ? 0 : 0), opacity: clamp01((t - at) / 0.08) * (past ? 0.42 : 1), transform: `scale(${lerp(1.3, 1, p)}) rotate(${rot * (past ? 0.5 : 1)}deg)`, display: 'flex', alignItems: 'center', gap: 28, background: active ? '#e2453c' : '#fff', color: active ? '#fff' : C.ink, borderRadius: 40, padding: '34px 40px', fontSize: 56, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: active ? '0 26px 60px rgba(226,69,60,0.45)' : '0 14px 34px rgba(60,40,20,0.14)' }}>
            <Icon size={72} strokeWidth={2.4} color={active ? '#fff' : '#e2453c'} /> {txt}
          </div>
        );
      })}
    </div>
  );
}

const T = { claim: 7.9, mark: 9.4, gen: 11.8, packLoad: 12.0, pack: 12.9, cust: 14.8, appr: 17.0, recv: 19.5 };
const layers: Layer[] = [
  { src: 'r5_claim', from: T.claim, to: T.mark + 0.15, view: [[T.claim, 330, 1.0], [T.claim + 0.9, 1400, 1.0], [T.claim + 1.4, 1560, 1.2, 195]], taps: [{ t: T.mark, ...TG.r5_mark }] },
  { src: 'r5_docs_ok', from: T.mark, to: T.gen + 0.2, view: [[T.mark, 1560, 1.2, 195], [T.mark + 0.9, 2100, 1.05], [T.mark + 1.5, 2250, 1.05], [T.gen - 0.6, 520, 1.2, 195]], taps: [{ t: T.gen, ...TG.r5_gen }] },
  { src: 'r5_pack_loading', from: T.packLoad, to: T.pack + 0.15, view: [[T.packLoad, 560, 1.15]] },
  { src: 'r5_pack', from: T.pack, to: T.cust + 0.2, view: [[T.pack, 300, 1.12], [T.cust - 0.3, 420, 1.2]] },
  { src: 'r5_cust', from: T.cust, to: T.appr + 0.15, view: [[T.cust, 330, 1.05], [T.cust + 0.9, 330, 1.25, 195], [T.appr - 0.3, 380, 1.3, 170]], taps: [{ t: T.appr - 0.1, ...TG.r5_approve }] },
  { src: 'r5_cust_ok', from: T.appr, to: T.recv + 0.2, view: [[T.appr, 380, 1.3, 170]] },
  { src: 'r5_recv', from: T.recv, to: 22.9, view: [[T.recv, 390, 1.2, 195], [T.recv + 1.6, 520, 1.2, 195], [22.7, 620, 1.2, 195]] },
];

const caps: CapSpec[] = [
  { from: 0.95, to: 2.95, text: 'Insurance jobs: *big tickets,* big headaches.' },
  { from: 6.4, to: 7.8, text: 'What if *one screen* handled it all?' },
  { from: 7.9, to: 11.7, text: 'Documents & photos. *Checked.*' },
  { from: 11.8, to: 14.7, text: 'One tap. *Claim pack* to the surveyor.' },
  { from: 14.8, to: 19.4, text: 'No surprises at *delivery.*' },
  { from: 19.5, to: 22.8, text: '₹3.2L pending. *Followed up.*' },
  { from: 22.9, to: 24.7, text: 'Every claim tracked. *Every rupee* followed up.', size: 76 },
];

export const Reel5 = () => (
  <ReelStage dur={R5_DUR} kicker="Do you handle insurance jobs?" sub="Built for Pune garages">
    <Flashes />
    <Caps caps={caps} />
    <PhoneRig enter={7.3} layers={layers} leave={24.5} />
    <Pill at={T.mark + 0.3} to={T.gen - 0.4} x={560} y={600} tone="green" size={34} rot={3}>All documents ✓</Pill>
    <Pill at={T.appr + 0.3} to={T.recv} x={560} y={600} tone="green" size={36} rot={3}>Approved ✓</Pill>
  </ReelStage>
);
