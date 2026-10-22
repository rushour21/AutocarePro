import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CalendarCheck2 } from 'lucide-react';
import { CarTopShapes } from '@/components/features/CarTop';
import { Backdrop, Enter } from '../components/Bits';
import { Kinetic } from '../components/Kinetic';
import { C, FPS, W, H, clamp01, cues, ein, eio, eout, lerp, prog, sp } from '../theme';

const K = cues.hook;

const NOTES = [
  'Bay 3 free?', 'Estimate pending', 'Call Mr. Rao', 'Brake pads?', 'Delivery 4 PM', 'Parts ordered?', 'Tech off today',
  'Invoice due', "Who's on Bay 5?", 'Approval waiting', 'Customer asking…', 'Reorder oil', 'Overdue!', 'Quote ₹32,500?', 'Re-check lift', 'Promised today',
];
const NOTE_COLORS = ['#fff6c9', '#ffffff', '#ffe2d2', '#e6efff', '#fff6c9', '#ffffff'];
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function IconCards() {
  const frame = useCurrentFrame();
  const cards = [
    { at: K.w1, x: 1180, y: 150, rot: -5, body: (
      <svg viewBox="0 0 100 250" width={110} height={275} style={{ transform: 'rotate(90deg)' }}><CarTopShapes color="#f1f0ee" idPrefix="hk1" /></svg>
    ), label: 'Car' },
    { at: K.w2, x: 1370, y: 330, rot: 4, body: (
      <div style={{ position: 'relative', width: 200, height: 250 }}>
        <div style={{ position: 'absolute', inset: 0, border: '7px solid #2f6bff', borderRadius: 16, background: 'rgba(47,107,255,0.1)' }} />
        <div style={{ position: 'absolute', left: 14, top: 14, width: 24, height: 24, background: '#2f55b8', borderRadius: 5 }} />
        <div style={{ position: 'absolute', right: 14, top: 14, width: 24, height: 24, background: '#2f55b8', borderRadius: 5 }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 28, textAlign: 'center', fontSize: 70, fontWeight: 800, fontStyle: 'italic', color: '#2f6bff', letterSpacing: '-0.04em' }}>03</div>
      </div>
    ), label: 'Bay' },
    { at: K.w3, x: 1180, y: 560, rot: -3, body: (
      <div style={{ textAlign: 'center' }}>
        <CalendarCheck2 size={120} color={C.coral} strokeWidth={1.6} />
        <div style={{ fontSize: 44, fontWeight: 800, color: C.ink, marginTop: 6 }}>4:30 PM</div>
      </div>
    ), label: 'Promise' },
  ];
  const out = prog(frame, K.chaos - 0.15, K.chaos + 0.5, ein);
  return (
    <>
      {cards.map((c, i) => {
        const p = sp(frame, c.at, { damping: 13, stiffness: 130 });
        const float = Math.sin(frame / 22 + i * 2) * 6;
        return (
          <div key={i} style={{ position: 'absolute', left: c.x + out * 900, top: c.y + float, width: 330, height: 330, transform: `rotate(${c.rot + out * 18}deg) scale(${lerp(0.5, 1, p)})`, opacity: clamp01((frame / FPS - c.at) / 0.2) * (1 - out), background: '#fff', borderRadius: 40, boxShadow: '0 30px 70px rgba(80,60,40,0.2), inset 0 2px 0 #fff', display: 'grid', placeItems: 'center' }}>
            {c.body}
            <div style={{ position: 'absolute', bottom: 18, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#928e87' }}>{c.label}</div>
          </div>
        );
      })}
    </>
  );
}

/** the pain: notes, questions and promises flying around, then pulled into one point */
function Chaos() {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const suck = prog(frame, K.suck, K.flash, ein);
  return (
    <>
      {NOTES.map((txt, i) => {
        const side = Math.floor(rnd(i, 1) * 4);
        const tx = 120 + rnd(i, 2) * (W - 520), ty = 90 + rnd(i, 3) * (H - 330);
        const sx = side === 0 ? -500 : side === 1 ? W + 300 : tx, sy = side === 2 ? -300 : side === 3 ? H + 300 : ty;
        const arrive = K.chaos + i * 0.13;
        const p = sp(frame, arrive, { damping: 14, stiffness: 70 });
        const jit = Math.sin(t * (1.1 + rnd(i, 4)) + i) * 16, jit2 = Math.cos(t * (0.9 + rnd(i, 5)) + i * 2) * 14;
        let x = lerp(sx, tx, p) + jit, y = lerp(sy, ty, p) + jit2;
        const rot = lerp((rnd(i, 6) - 0.5) * 120, (rnd(i, 7) - 0.5) * 26, p) + Math.sin(t * 1.5 + i) * 4 + suck * 540;
        // pulled to the middle
        x = lerp(x, W / 2 - 110, suck);
        y = lerp(y, H / 2 - 40, suck);
        const scale = lerp(1, 0.2, suck) * lerp(0.7, 1, p);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${scale})`, opacity: clamp01((t - arrive) / 0.12) * (1 - clamp01((suck - 0.9) / 0.1)), background: NOTE_COLORS[i % NOTE_COLORS.length], padding: '18px 26px', borderRadius: 14, fontSize: 30, fontWeight: 700, color: '#3b3c40', boxShadow: '0 16px 34px rgba(60,40,20,0.22)', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
            {txt}
          </div>
        );
      })}
    </>
  );
}

export const Hook = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const fadeText = 1 - prog(frame, K.chaos - 0.2, K.chaos + 0.45, ein);
  const flash = prog(frame, K.flash - 0.15, K.flash + 0.1, eout) * (1 - prog(frame, K.flash + 0.15, K.flash + 0.55));
  const sweep = (at: number) => eout(clamp01((t - at - 0.2) / 0.55));
  const lines = [
    { at: K.w1, words: ['Every', 'car.'], y: 205 },
    { at: K.w2, words: ['Every', 'bay.'], y: 385 },
    { at: K.w3, words: ['Every', 'promise.'], y: 565, color: C.coral },
  ];
  return (
    <AbsoluteFill>
      <Backdrop tone="ivory" t={t} />
      <div style={{ position: 'absolute', left: 110, top: 0, opacity: fadeText, transform: `translateX(${-(1 - fadeText) * 160}px)` }}>
        {lines.map((l) => (
          <div key={l.at} style={{ position: 'absolute', left: 0, top: l.y }}>
            <Kinetic size={172} color={l.color ?? C.ink} words={l.words.map((w, i) => ({ text: w, at: l.at + i * 0.2 }))} />
            <div style={{ height: 8, marginTop: 8, borderRadius: 4, width: 640 * sweep(l.at), background: l.color ?? C.ink, opacity: 0.9 }} />
          </div>
        ))}
      </div>
      <IconCards />
      {t >= K.chaos - 0.1 && <Chaos />}
      {t >= K.chaos + 0.4 && t < K.suck + 0.4 && (
        <div style={{ position: 'absolute', left: 120, bottom: 100, opacity: clamp01((t - K.chaos - 0.4) / 0.3) * (1 - prog(frame, K.suck - 0.2, K.suck + 0.3)) }}>
          <Kinetic size={70} color={C.ink} words={[{ text: 'All', at: K.chaos + 0.4 }, { text: 'of', at: K.chaos + 0.55 }, { text: 'it.', at: K.chaos + 0.7 }, { text: 'In', at: K.chaos + 1.2 }, { text: 'your', at: K.chaos + 1.35 }, { text: 'head.', at: K.chaos + 1.55, color: C.coral }]} />
        </div>
      )}
      <AbsoluteFill style={{ background: C.coral, opacity: flash * 0.9, mixBlendMode: 'normal' }} />
      <AbsoluteFill style={{ background: '#fff', opacity: prog(frame, K.flash, K.flash + 0.12) * (1 - prog(frame, K.flash + 0.12, K.flash + 0.5)) }} />
      <span style={{ display: 'none' }}>{eio(0)}</span>
    </AbsoluteFill>
  );
};
