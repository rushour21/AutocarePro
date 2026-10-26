import { useCurrentFrame } from 'remotion';
import { Car, ShieldCheck, User, Wrench } from 'lucide-react';
import { LogoMark, Wordmark } from '../components/Brand';
import { Kinetic } from '../components/Kinetic';
import { C, CardPop, Caps, FPS, Pill, ReelStage, clamp01, eio, eout, lerp, sp, words, type CardSpec, type CapSpec } from './kit';
import data from './reel6.json';
import timing from './timing6.json';

export const R6_DUR = data.dur;

const LN = Object.fromEntries(timing.lines.map((l) => [l.key, l]));
const A = (k: string, f: number) => LN[k].start + f * LN[k].dur;
const CAPS = data.caps as CapSpec[];
const CARDS = data.cards as unknown as CardSpec[];

/** hook: cars, mechanics, customers and insurers, being juggled */
function Juggle() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = data.caps[0].to;
  if (t > end + 0.4) return null;
  const out = eio(clamp01((t - (end - 0.3)) / 0.4));
  const items = [
    { Icon: Car, label: 'Cars', at: A('hook', 0.5), col: C.coral },
    { Icon: Wrench, label: 'Mechanics', at: A('hook', 0.62), col: '#2f6bff' },
    { Icon: User, label: 'Customers', at: A('hook', 0.76), col: C.green },
    { Icon: ShieldCheck, label: 'Insurers', at: A('hook', 0.9), col: C.violet },
  ];
  return (
    <>
      {items.map(({ Icon, label, at, col }, i) => {
        if (t < at - 0.05) return null;
        const p = sp(frame, at, { damping: 11, stiffness: 150 });
        const ph = t * 2.1 + i * 1.57;
        const x = 540 + Math.sin(ph * 0.5 + i) * 330 + (i - 1.5) * 20;
        const y = 1000 - Math.abs(Math.sin(ph)) * 330;
        return (
          <div key={label} style={{ position: 'absolute', left: x - 90, top: y - 90, width: 180, opacity: (1 - out) * clamp01((t - at) / 0.12), transform: `scale(${lerp(0.4, 1, p)}) rotate(${Math.sin(ph) * 14}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 24px 50px ${col}66` }}><Icon size={78} color="#fff" strokeWidth={2.2} /></div>
            <div style={{ background: '#fff', borderRadius: 999, padding: '6px 22px', fontSize: 34, fontWeight: 800, boxShadow: '0 10px 24px rgba(60,40,20,0.15)' }}>{label}</div>
          </div>
        );
      })}
    </>
  );
}

/** "one platform": the logo draws before the three portals appear */
function OneIntro() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const a = LN.one.start - 0.2, b = A('one', 0.5);
  if (t < a || t > b + 0.4) return null;
  const draw = clamp01((t - a - 0.1) / 0.6);
  const out = eio(clamp01((t - (b - 0.3)) / 0.4));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: 1 - out, transform: `translateY(${out * 600}px) scale(${lerp(0.85, 1, eout(clamp01((t - a) / 0.5)))})` }}>
      <LogoMark size={260} draw={eout(draw)} glow={draw} />
      <Wordmark size={150} />
    </div>
  );
}

/** the closing statement under the last line of narration */
function Closer() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const a = data.closeAt;
  if (t < a || t > data.outro + 0.4) return null;
  const draw = clamp01((t - a - 0.1) / 0.7);
  const out = eio(clamp01((t - (data.outro - 0.3)) / 0.4));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, opacity: 1 - out, transform: `translateY(${out * 500}px)` }}>
      <LogoMark size={230} draw={eout(draw)} glow={draw} />
      <Wordmark size={130} />
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Kinetic size={96} gap={0.2} words={words('Every car.', A('close', 0.15))} />
        <Kinetic size={96} gap={0.2} words={words('Every bay.', A('close', 0.4))} />
        <Kinetic size={96} gap={0.2} words={[{ text: 'Every', at: A('close', 0.62) }, { text: 'claim.', at: A('close', 0.7), color: C.coral }]} />
      </div>
    </div>
  );
}

export const Reel6 = () => (
  <ReelStage dur={R6_DUR} kicker="Every claim, under control" sub="Built for Pune garages">
    <Juggle />
    <OneIntro />
    <Caps caps={CAPS} />
    {CARDS.map((c, i) => <CardPop key={i} c={c} />)}
    {data.pills.map((p, i) => (
      <Pill key={i} at={p.at} to={p.to} x={p.x} y={p.y} tone={p.tone as 'dark'} size={p.size} rot={p.rot}>{p.text}</Pill>
    ))}
    <Closer />
  </ReelStage>
);
