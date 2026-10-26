import { useCurrentFrame } from 'remotion';
import { Clock, PackageSearch, User, Wrench } from 'lucide-react';
import { C, Caps, FPS, Pill, PhoneRig, ReelStage, clamp01, eio, eout, lerp, sp, type CapSpec, type Layer } from './kit';
import { TG } from './targets';

export const R3_DUR = 18.6;

/** hook: a mechanic walking back and forth between the bay and the parts counter */
function Walk() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > 5.4) return null;
  const out = eio(clamp01((t - 4.7) / 0.5));
  const phase = (t * 0.9) % 2;
  const pos = phase < 1 ? phase : 2 - phase; // 0..1..0
  const x = lerp(250, 830, eio(pos));
  const enter = sp(frame, 1.0, { damping: 15, stiffness: 110 });
  const chips: [string, number, string][] = [['Need a part', 3.2, C.coral], ['Walk to the counter', 3.9, '#2f6bff'], ['Wait…', 4.5, '#8a8b90']];
  return (
    <div style={{ position: 'absolute', left: 0, top: 640, width: 1080, opacity: 1 - out, transform: `scale(${enter}) translateY(${out * 500}px)` }}>
      <div style={{ position: 'absolute', left: 90, top: 20, width: 220, height: 220, borderRadius: 44, background: '#fff', boxShadow: '0 18px 44px rgba(60,40,20,0.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 36, fontWeight: 800 }}><Wrench size={78} color={C.coral} /> Bay 3</div>
      <div style={{ position: 'absolute', left: 770, top: 20, width: 220, height: 220, borderRadius: 44, background: '#fff', boxShadow: '0 18px 44px rgba(60,40,20,0.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 36, fontWeight: 800 }}><PackageSearch size={78} color="#2f6bff" /> Parts counter</div>
      <div style={{ position: 'absolute', left: 310, right: 310, top: 128, borderTop: '7px dotted #cdbfae' }} />
      <div style={{ position: 'absolute', left: x - 40, top: 88, width: 80, height: 80, borderRadius: '50%', background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: '0 12px 28px rgba(0,0,0,0.3)' }}><User size={44} /></div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 330, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {chips.map(([txt, at, col]) => {
          const p = sp(frame, at, { damping: 12, stiffness: 150 });
          return <div key={txt} style={{ alignSelf: 'flex-start', opacity: clamp01((t - at) / 0.15), transform: `scale(${lerp(0.7, 1, p)})`, transformOrigin: '0 50%', background: col, color: '#fff', borderRadius: 999, padding: '18px 44px', fontSize: 52, fontWeight: 800, boxShadow: '0 16px 36px rgba(40,25,10,0.22)', display: 'flex', alignItems: 'center', gap: 16 }}>{txt === 'Wait…' && <Clock size={50} />}{txt}</div>;
        })}
      </div>
    </div>
  );
}

const layers: Layer[] = [
  { src: 'r3_jobs', from: 5.5, to: 8.1, view: [[5.5, 330, 1.0], [6.4, 430, 1.2]], taps: [{ t: 7.1, ...TG.r3_continue }] },
  { src: 'r3_job', from: 7.9, to: 9.6, view: [[7.9, 300, 1.05], [8.6, 215, 1.15, 195]], taps: [{ t: 8.9, ...TG.r3_stage }] },
  { src: 'r3_status', from: 9.4, to: 10.6, view: [[9.4, 215, 1.15, 195]] },
  { src: 'r3_parts', from: 10.4, to: 11.7, view: [[10.4, 380, 1.1], [10.9, 470, 1.25, 150]], taps: [{ t: 11.2, ...TG.r3_request }] },
  { src: 'r3_modal', from: 11.5, to: 12.7, view: [[11.5, 640, 1.15, 215], [12.0, 700, 1.2, 215]], taps: [{ t: 12.2, ...TG.r3_send }] },
  { src: 'r3_sent', from: 12.5, to: 13.9, view: [[12.5, 300, 1.2]] },
  { src: 'r3_admin', from: 13.7, to: 16.6, view: [[13.7, 300, 1.2, 195], [16.5, 300, 1.3]] },
];

const caps: CapSpec[] = [
  { from: 0.95, to: 3.1, text: 'Your mechanics, without the *running around.*' },
  { from: 3.15, to: 5.3, text: 'Need a part. Walk. *Wait.*' },
  { from: 5.6, to: 7.8, text: '*My Jobs,* on the phone.' },
  { from: 7.9, to: 10.3, text: 'Update the *status.*' },
  { from: 10.4, to: 13.4, text: 'Request a *part.*' },
  { from: 13.6, to: 16.6, text: 'Store sees it *instantly.*' },
];

export const Reel3 = () => (
  <ReelStage dur={R3_DUR} kicker="Jobs, status & parts. From the phone." sub="Built for Pune garages">
    <Walk />
    <Caps caps={caps} />
    <PhoneRig enter={4.9} layers={layers} />
    <Pill at={9.7} to={10.9} x={560} y={600} tone="green" size={34} rot={3}>Quality Check ✓</Pill>
    <Pill at={12.8} to={13.9} x={60} y={600} tone="coral" size={34} rot={-3}>Request sent</Pill>
    <Pill at={14.0} to={16.6} x={600} y={600} tone="dark" size={34} rot={3}>2 requests waiting</Pill>
  </ReelStage>
);
