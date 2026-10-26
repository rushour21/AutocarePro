import { useCurrentFrame } from 'remotion';
import { Loader, PhoneOff } from 'lucide-react';
import { C, Caps, FPS, Pill, PhoneRig, ReelStage, clamp01, eio, eout, lerp, sp, type CapSpec, type Layer } from './kit';
import { TG } from './targets';

export const R4_DUR = 22.6;

/** hook: unanswered calls, then a car stuck waiting */
function Stuck() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > 4.8) return null;
  const out = eio(clamp01((t - 4.1) / 0.5));
  const calls = [['Mr. Mehta', 1.2], ['Mr. Mehta', 1.75], ['Mr. Mehta', 2.3]] as const;
  const stuck = sp(frame, 3.2, { damping: 12, stiffness: 140 });
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 660, opacity: 1 - out, transform: `translateY(${out * 600}px)` }}>
      {calls.map(([name, at], i) => {
        const p = sp(frame, at, { damping: 13, stiffness: 160 });
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, background: '#fff', borderRadius: 32, padding: '26px 32px', marginBottom: 18, opacity: clamp01((t - at) / 0.12), transform: `translateX(${(1 - p) * 500}px)`, boxShadow: '0 16px 40px rgba(60,40,20,0.14)' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#fdeceb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2453c' }}><PhoneOff size={42} strokeWidth={2.4} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 42, fontWeight: 800 }}>{name}</div><div style={{ fontSize: 32, color: '#8a8b90', fontWeight: 600 }}>Call {i + 1} · No answer</div></div>
          </div>
        );
      })}
      <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 28, background: C.ink, color: '#fff', borderRadius: 40, padding: '32px 44px', transform: `scale(${lerp(0.7, 1, stuck)})`, opacity: clamp01((t - 3.2) / 0.15), boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
        <Loader size={70} color={C.coral} style={{ transform: `rotate(${t * 240}deg)` }} />
        <div><div style={{ fontSize: 50, fontWeight: 800 }}>Bay 3 is blocked</div><div style={{ fontSize: 34, opacity: 0.7, fontWeight: 600 }}>Waiting for approval…</div></div>
      </div>
    </div>
  );
}

const T = { tech: 5.5, est: 7.3, apr: 9.4, conf: 11.3, done: 12.5, pay: 14.0, paid: 15.6, fb: 16.7, star: 17.8, thanks: 18.9 };
const layers: Layer[] = [
  { src: 'r4_tech', from: T.tech, to: T.est + 0.2, view: [[T.tech, 330, 1.0], [T.tech + 1.0, 560, 1.3]] },
  { src: 'r4_est_admin', from: T.est, to: T.apr + 0.2, view: [[T.est, 300, 1.1], [T.est + 0.8, 420, 1.3], [T.apr, 560, 1.3]] },
  { src: 'r4_est', from: T.apr, to: T.conf + 0.2, view: [[T.apr, 330, 1.05], [T.apr + 0.9, 560, 1.15], [T.conf - 0.3, 650, 1.3, 195]], taps: [{ t: T.conf - 0.1, ...TG.r4_approve }] },
  { src: 'r4_confirm', from: T.conf, to: T.done + 0.2, view: [[T.conf, 690, 1.15, 195]], taps: [{ t: T.done - 0.2, ...TG.r4_confirm_btn }] },
  { src: 'r4_approved', from: T.done, to: T.pay + 0.2, view: [[T.done, 300, 1.2]] },
  { src: 'r4_pay', from: T.pay, to: T.paid + 0.2, view: [[T.pay, 520, 1.1, 195], [T.paid - 0.5, 690, 1.15, 215]], taps: [{ t: T.paid - 0.3, ...TG.r4_paybtn }] },
  { src: 'r4_paid', from: T.paid, to: T.fb + 0.2, view: [[T.paid, 600, 1.1, 195]] },
  { src: 'r4_fb', from: T.fb, to: T.star + 0.2, view: [[T.fb, 260, 1.3]], taps: [{ t: T.star - 0.2, ...TG.r4_star5 }] },
  { src: 'r4_fb_stars', from: T.star, to: T.thanks + 0.2, view: [[T.star, 260, 1.3]] },
  { src: 'r4_fb_done', from: T.thanks, to: 20.8, view: [[T.thanks, 260, 1.3]] },
];

const caps: CapSpec[] = [
  { from: 0.95, to: 3.1, text: 'Extra work found… *customer not picking up.*' },
  { from: 3.2, to: 5.0, text: 'Car stuck in the *bay.*' },
  { from: 5.6, to: 7.2, text: 'Mechanic adds the *extra work.*' },
  { from: 7.3, to: 9.3, text: 'Photos. *Price.* Done.' },
  { from: 9.4, to: 12.4, text: 'Customer taps the link. *Approves.*' },
  { from: 12.6, to: 15.7, text: 'Delivery day: *pay online.*' },
  { from: 15.8, to: 18.7, text: 'Then a *5-star review.*' },
  { from: 18.9, to: 20.7, text: 'Faster approvals. Faster payments. *More reviews.*', size: 78 },
];

export const Reel4 = () => (
  <ReelStage dur={R4_DUR} kicker="Faster approvals. Faster payments." cta="DM “DEMO”" sub="Built for Pune garages">
    <Stuck />
    <Caps caps={caps} />
    <PhoneRig enter={4.8} layers={layers} />
    <Pill at={T.tech + 0.6} to={T.est} x={560} y={600} tone="dark" size={34} rot={3}>+ Extra work</Pill>
    <Pill at={T.est + 0.8} to={T.apr} x={60} y={600} tone="coral" size={34} rot={-3}>₹38,350 total</Pill>
    <Pill at={T.done + 0.2} to={T.pay} x={600} y={600} tone="green" size={38} rot={3}>Approved ✓</Pill>
    <Pill at={T.paid + 0.1} to={T.fb} x={600} y={600} tone="green" size={38} rot={3}>Paid ✓</Pill>
    <Pill at={T.thanks + 0.1} to={20.7} x={60} y={600} tone="white" size={38} rot={-3}>★★★★★</Pill>
  </ReelStage>
);
