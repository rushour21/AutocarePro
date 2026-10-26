import { useCurrentFrame } from 'remotion';
import { Phone as PhoneIcon, PhoneMissed } from 'lucide-react';
import { C, Caps, Enter, FPS, Pill, PhoneRig, ReelStage, RH, RW, clamp01, eio, eout, lerp, prog, sp, type CapSpec, type Layer } from './kit';

export const R1_DUR = 18.6;

const CALLS = [
  ['Mr. Gokhale', 'Is my car ready?', '10:02 AM'],
  ['Mrs. Naik', 'Any update on my Fortuner?', '10:14 AM'],
  ['Rekha Bhagat', 'Kitna time lagega?', '10:31 AM'],
  ['Mr. Kulkarni', 'Is my car ready?', '10:47 AM'],
  ['Imran Shaikh', 'When can I pick up?', '11:05 AM'],
];

/** the problem: a call log that keeps filling up */
function CallLog() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > 5.9) return null;
  const out = eio(clamp01((t - 3.55) / 0.5));
  const count = Math.min(20, Math.round(lerp(3, 20, eout(clamp01((t - 1.0) / 2.4)))));
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 640, transform: `translateY(${out * 1500}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 40, fontWeight: 800, color: '#e2453c' }}><PhoneMissed size={46} strokeWidth={2.6} /> Missed calls</div>
        <div style={{ background: '#e2453c', color: '#fff', borderRadius: 999, padding: '8px 28px', fontSize: 52, fontWeight: 800, boxShadow: '0 12px 30px rgba(226,69,60,0.4)', transform: `scale(${1 + 0.06 * Math.sin(t * 14)})` }}>{count}</div>
      </div>
      {CALLS.map(([name, msg, at], i) => {
        const a = 1.0 + i * 0.5;
        const p = sp(frame, a, { damping: 14, stiffness: 150 });
        const shake = t > a && t < a + 0.5 ? Math.sin((t - a) * 60) * (1 - (t - a) / 0.5) * 6 : 0;
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 22, background: '#fff', borderRadius: 30, padding: '24px 28px', marginBottom: 18, boxShadow: '0 16px 40px rgba(60,40,20,0.14)', opacity: clamp01((t - a) / 0.15), transform: `translate(${(1 - p) * 420 + shake}px, 0) scale(${lerp(0.94, 1, p)})` }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#fdeceb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2453c' }}><PhoneIcon size={40} strokeWidth={2.4} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{name}</div>
              <div style={{ fontSize: 33, color: C.ink2, fontWeight: 600 }}>&ldquo;{msg}&rdquo;</div>
            </div>
            <div style={{ fontSize: 30, color: '#8a8b90', fontWeight: 600 }}>{at}</div>
          </div>
        );
      })}
    </div>
  );
}

const T = { insp: 5.7, repair: 8.5, ready: 11.0, end: 16.6 };

// scroll positions (css px in the screenshot) that bring the status stepper into view
const layers: Layer[] = [
  { src: 'r1_insp', from: T.insp, to: T.repair + 0.15, view: [[T.insp, 260, 1.0], [T.insp + 1.6, 520, 1.25], [T.repair, 560, 1.3]] },
  { src: 'r1_repair', from: T.repair, to: T.ready + 0.15, view: [[T.repair, 300, 1.0], [T.repair + 1.2, 560, 1.3], [T.ready, 600, 1.3]] },
  { src: 'r1_ready', from: T.ready, to: T.end + 0.3, view: [[T.ready, 330, 1.0], [T.ready + 1.2, 330, 1.12], [T.end, 330, 1.18]] },
];

const caps: CapSpec[] = [
  { from: 0.95, to: 3.55, text: 'Is my car ready? *20 times* a day.' },
  { from: 3.7, to: 5.55, text: 'What if customers could *just check?*' },
  { from: 5.75, to: 8.3, text: 'A *private link* for every car.' },
  { from: 8.5, to: 10.8, text: 'Status moves *live.*' },
  { from: 11.1, to: 13.2, text: 'Ready for pickup.' },
  { from: 13.4, to: T.end, text: 'Live status. *Zero calls.*' },
];

function StepPills() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const steps = [['Inspection', T.insp], ['Repairing', T.repair], ['Ready for pickup', T.ready]] as const;
  if (t < T.insp || t > 13.3) return null;
  const out = 1 - clamp01((t - 13.0) / 0.3);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 470, display: 'flex', gap: 14, opacity: out * clamp01((t - T.insp) / 0.3) }}>
      {steps.map(([label, at], i) => {
        const active = t >= at && (i === 2 || t < steps[i + 1][1]);
        const done = t >= (i < 2 ? steps[i + 1][1] : 99);
        return (
          <div key={label} style={{ padding: '12px 26px', borderRadius: 999, fontSize: 31, fontWeight: 800, background: active ? C.coral : done ? '#d9f1e6' : '#fff', color: active ? '#fff' : done ? C.green : '#9a9ba0', boxShadow: active ? '0 12px 28px rgba(242,106,46,0.4)' : '0 6px 16px rgba(60,40,20,0.08)', transform: `scale(${active ? 1.06 : 1})`, whiteSpace: 'nowrap' }}>{done ? '✓ ' : ''}{label}</div>
        );
      })}
    </div>
  );
}

export const Reel1 = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const calls = Math.round(lerp(20, 0, eout(clamp01((t - 13.5) / 1.4))));
  return (
    <ReelStage dur={R1_DUR} kicker="Stop answering “is it ready?”" cta="DM “DEMO”" sub="Built for Pune garages">
      <CallLog />
      <Caps caps={caps} />
      <StepPills />
      <PhoneRig enter={4.0} layers={layers} />
      <Pill at={13.5} to={T.end} x={52} y={610} tone="white" size={44} rot={-4}>
        <span style={{ color: '#e2453c', fontSize: 58, fontVariantNumeric: 'tabular-nums' }}>{calls}</span> calls today
      </Pill>
      <Pill at={11.2} to={13.2} x={640} y={620} tone="green" size={40} rot={4}>Car is ready ✓</Pill>
    </ReelStage>
  );
};
