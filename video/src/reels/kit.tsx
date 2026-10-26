import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Backdrop, Enter, Grain, Vignette } from '../components/Bits';
import { LogoMark, Wordmark } from '../components/Brand';
import { Kinetic, type Word } from '../components/Kinetic';
import { Phone } from '../components/Devices';
import { C, FPS, clamp01, eio, eout, lerp, prog, sp, track } from '../theme';
import meta from '../../public/reels/meta.json';
import cards from '../../public/cards/cards.json';

/** Instagram reel: 1080 x 1920. Keep text/UI inside y 250..1570 (top ~250 and bottom ~350 are covered by the app). */
export const RW = 1080;
export const RH = 1920;
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 1570;

/* ---------------------------------------------------------------- phone with real screenshots */
export const SCREEN_W = 660;
export const SCREEN_H = 1428;
export const PHONE_X = (RW - (SCREEN_W + 28)) / 2;
export const PHONE_Y = 540;
const K = SCREEN_W / 390;
/** where the focused point of a screenshot sits inside the phone screen */
const CX = SCREEN_W / 2;
const CY = 500;

interface Geo { k: number; cx: number; cy: number }
const PHONE_GEO: Geo = { k: K, cx: CX, cy: CY };
/** frameless card: the app screen shown directly, no device around it */
export const CARD_W = 960;
export const CARD_H = 1010;
export const CARD_X = (RW - CARD_W) / 2;
export const CARD_Y = 560;
const CARD_GEO: Geo = { k: CARD_W / 390, cx: CARD_W / 2, cy: CARD_H / 2 };

/** keyframe: [seconds, focus y in css px of the screenshot, zoom, focus x] */
export type ViewKey = [number, number, number, number?];
export interface Tap { t: number; x: number; y: number }
export interface Layer {
  /** file name in public/reels (without .png), also the key into meta.json */
  src: keyof typeof meta;
  from: number;
  to: number;
  view: ViewKey[];
  taps?: Tap[];
}

function viewAt(frame: number, keys: ViewKey[]) {
  const fy = track(frame, keys.map((k) => [k[0], k[1]] as [number, number]));
  const z = track(frame, keys.map((k) => [k[0], k[2]] as [number, number]));
  const fx = track(frame, keys.map((k) => [k[0], k[3] ?? 195] as [number, number]));
  return { fx, fy, z };
}

export function TapMark({ at, x, y, k = 1 }: { at: number; x: number; y: number; k?: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS - at;
  if (t < -0.4 || t > 0.7) return null;
  const press = clamp01((t + 0.4) / 0.4);
  const ring = clamp01(t / 0.55);
  return (
    <>
      {t > 0 && <div style={{ position: 'absolute', left: x - 40 * k, top: y - 40 * k, width: 80 * k, height: 80 * k, borderRadius: '50%', border: '4px solid rgba(242,106,46,0.9)', opacity: 1 - ring, transform: `scale(${0.3 + ring * 1.1})` }} />}
      <div style={{ position: 'absolute', left: x - 17 * k, top: y - 17 * k, width: 34 * k, height: 34 * k, borderRadius: '50%', background: 'rgba(28,29,32,0.55)', boxShadow: '0 0 0 4px rgba(255,255,255,0.85), 0 6px 14px rgba(0,0,0,0.3)', opacity: t < 0 ? eio(press) : 1 - clamp01(t / 0.6), transform: `scale(${t < 0 ? 1.5 - 0.5 * eio(press) : 0.9})` }} />
    </>
  );
}

function ShotLayer({ layer, geo = PHONE_GEO }: { layer: Layer; geo?: Geo }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const fade = 0.28;
  const o = Math.min(clamp01((t - layer.from) / fade), 1 - clamp01((t - (layer.to - fade)) / fade));
  if (o <= 0) return null;
  const m = meta[layer.src];
  const { fx, fy, z } = viewAt(frame, layer.view);
  const s = geo.k * z;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: m.h, transformOrigin: '0 0', transform: `translate(${geo.cx - fx * s}px, ${geo.cy - fy * s}px) scale(${s})`, opacity: o }}>
      <Img src={staticFile(`reels/${layer.src}.png`)} style={{ width: 390, height: m.h, display: 'block' }} />
      {(layer.taps ?? []).map((tp, i) => <TapMark key={i} at={tp.t} x={tp.x} y={tp.y} />)}
    </div>
  );
}

export function PhoneRig({ enter, layers, leave, y = PHONE_Y, style }: { enter: number; layers: Layer[]; leave?: number; y?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = sp(frame, enter, { damping: 17, stiffness: 95 });
  const out = leave === undefined ? 0 : eio(clamp01((frame / FPS - leave) / 0.5));
  const dy = (1 - p) * 1500 + out * 1500;
  return (
    <div style={{ position: 'absolute', left: PHONE_X, top: y, transform: `translateY(${dy}px) rotate(${(1 - p) * 4}deg)`, ...style }}>
      <Phone w={SCREEN_W} h={SCREEN_H} style={{ boxShadow: '0 50px 120px rgba(30,20,10,0.42), 0 0 0 2px #3a3d45 inset' }}>
        {layers.map((l, i) => <ShotLayer key={i} layer={l} />)}
      </Phone>
    </div>
  );
}

/** the app screen as a large rounded card (no phone frame) */
export function ScreenRig({ enter, layers, leave, y = CARD_Y, style }: { enter: number; layers: Layer[]; leave?: number; y?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = sp(frame, enter, { damping: 17, stiffness: 100 });
  const out = leave === undefined ? 0 : eio(clamp01((frame / FPS - leave) / 0.5));
  const dy = (1 - p) * 1400 + out * 1400;
  return (
    <div style={{ position: 'absolute', left: CARD_X, top: y, width: CARD_W, height: CARD_H, transform: `translateY(${dy}px) scale(${lerp(0.94, 1, p)})`, borderRadius: 48, overflow: 'hidden', background: '#f7efe5', boxShadow: '0 40px 100px rgba(40,25,10,0.34), 0 0 0 6px rgba(255,255,255,0.92)', ...style }}>
      {layers.map((l, i) => <ShotLayer key={i} layer={l} geo={CARD_GEO} />)}
    </div>
  );
}

/* ---------------------------------------------------------------- pop-out UI cards */
export type CardName = keyof typeof cards;
export interface CardSpec {
  name: CardName;
  from: number;
  to: number;
  /** centre of the element in the 1080x1920 frame, and its scale (screen px per css px) */
  cx: number;
  cy: number;
  s: number;
  rot?: number;
  dir?: 'up' | 'down' | 'left' | 'right';
  /** crossfade in place (a state change) instead of flying in */
  swap?: boolean;
  /** modal sheets are clipped to a rounded card */
  dialog?: boolean;
  taps?: { t: number; key: string }[];
  /** taps at raw css positions inside the element */
  rawTaps?: { t: number; x: number; y: number }[];
}

export function CardPop({ c }: { c: CardSpec }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < c.from - 0.03 || t > c.to + 0.45) return null;
  const m = cards[c.name] as { w: number; h: number; pad: number; taps: Record<string, { x: number; y: number }> };
  const s = c.s;
  const W_ = m.w * s, H_ = m.h * s, pad = m.pad * s;
  const p = c.swap ? 1 : sp(frame, c.from, { damping: 14, stiffness: 130 });
  const fadeIn = clamp01((t - c.from) / (c.swap ? 0.22 : 0.16));
  const q = eio(clamp01((t - (c.to - 0.28)) / 0.3));
  const d = c.dir ?? 'up';
  const off = (1 - p) * 760;
  const tx = d === 'left' ? -off : d === 'right' ? off : 0;
  const ty = d === 'up' ? off : d === 'down' ? -off : 0;
  const rot = (c.rot ?? 0) * (c.swap ? 1 : lerp(2.2, 1, p));
  const float = c.swap ? 0 : Math.sin(t * 1.3 + c.cx * 0.01) * 5;
  const left = c.cx - W_ / 2, top = c.cy - H_ / 2;
  const img = <Img src={staticFile(`cards/${c.name}.png`)} style={{ position: 'absolute', left: -pad, top: -pad, width: W_ + pad * 2, height: H_ + pad * 2, maxWidth: 'none' }} />;
  return (
    <div style={{ position: 'absolute', left, top, width: W_, height: H_, opacity: fadeIn * (1 - q), transform: `translate(${tx}px, ${ty + float + q * 36}px) scale(${lerp(0.86, 1, p) * (1 - q * 0.04)}) rotate(${rot}deg)`, filter: c.dialog ? undefined : 'drop-shadow(0 34px 38px rgba(40,25,10,0.26))' }}>
      {c.dialog ? <div style={{ position: 'absolute', inset: 0, borderRadius: 24 * s, overflow: 'hidden', boxShadow: '0 40px 90px rgba(40,25,10,0.34), 0 0 0 5px rgba(255,255,255,0.9)' }}>{img}</div> : img}
      {(c.taps ?? []).map((tp, i) => { const pt = m.taps[tp.key]; return pt ? <TapMark key={i} at={tp.t} x={pt.x * s} y={pt.y * s} k={1.25} /> : null; })}
      {(c.rawTaps ?? []).map((tp, i) => <TapMark key={`r${i}`} at={tp.t} x={tp.x * s} y={tp.y * s} k={1.25} />)}
    </div>
  );
}

export function Cards({ list }: { list: CardSpec[] }) {
  return <>{list.map((c, i) => <CardPop key={i} c={c} />)}</>;
}

/* ---------------------------------------------------------------- captions */
/** "Open *your workshop*." -> words, `*` marks coral words; words appear `step` seconds apart from `at` */
export function words(text: string, at: number, step = 0.17): Word[] {
  return text.split(/\s+/).map((raw, i) => {
    const hot = raw.startsWith('*') || raw.endsWith('*');
    return { text: raw.replace(/\*/g, ''), at: at + i * step, color: hot ? C.coral : undefined };
  });
}

export interface CapSpec { from: number; to: number; text: string; size?: number; y?: number; color?: string; align?: 'left' | 'center' }

export function Caps({ caps }: { caps: CapSpec[] }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      {caps.map((c, i) => {
        if (t < c.from - 0.02 || t > c.to + 0.01) return null;
        const out = 1 - clamp01((t - (c.to - 0.28)) / 0.28);
        return (
          <div key={i} style={{ position: 'absolute', left: 70, right: 70, top: c.y ?? 262, opacity: out, transform: `translateY(${(1 - out) * -22}px)`, display: 'flex', justifyContent: c.align === 'center' ? 'center' : 'flex-start', textAlign: c.align === 'center' ? 'center' : 'left' }}>
            <Kinetic wrap size={c.size ?? 84} gap={0.2} color={c.color ?? C.ink} words={words(c.text, c.from + 0.05)} style={{ justifyContent: c.align === 'center' ? 'center' : 'flex-start', width: RW - 140, rowGap: 4 }} />
          </div>
        );
      })}
    </>
  );
}

/** a small floating label that pops in */
export function Pill({ at, to, x, y, children, tone = 'dark', size = 38, rot = 0 }: { at: number; to?: number; x: number; y: number; children: ReactNode; tone?: 'dark' | 'green' | 'coral' | 'white' | 'red'; size?: number; rot?: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at - 0.05 || (to !== undefined && t > to + 0.4)) return null;
  const p = sp(frame, at, { damping: 12, stiffness: 170 });
  const out = to === undefined ? 1 : 1 - clamp01((t - to) / 0.3);
  const bg = { dark: C.ink, green: C.green, coral: C.coral, white: '#fff', red: '#e2453c' }[tone];
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${lerp(0.6, 1, p)}) rotate(${rot}deg)`, opacity: clamp01((t - at) / 0.15) * out, transformOrigin: '0 50%' }}>
      <div style={{ background: bg, color: tone === 'white' ? C.ink : '#fff', borderRadius: 999, padding: `${size * 0.32}px ${size * 0.62}px`, fontSize: size, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: '0 18px 40px rgba(40,25,10,0.28)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: size * 0.3 }}>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- intro / outro / stage */
function Intro({ dur = 0.95 }: { dur?: number }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t > dur + 0.05) return null;
  const draw = prog(frame, 0.05, 0.55, eout);
  const word = clamp01((t - 0.3) / 0.25);
  const out = eio(clamp01((t - (dur - 0.3)) / 0.3));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.ivory2}, ${C.ivory})`, transform: `translateY(${-out * RH}px)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: `scale(${lerp(0.9, 1, eout(clamp01(t / 0.5)))})` }}>
        <LogoMark size={190} draw={draw} glow={draw} />
        <div style={{ opacity: word, transform: `translateY(${(1 - word) * 20}px)` }}><Wordmark size={118} /></div>
      </div>
    </AbsoluteFill>
  );
}

function Outro({ dur, kicker, cta, sub }: { dur: number; kicker: string; cta?: string; sub?: string }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const start = dur - 1.85;
  if (t < start - 0.05) return null;
  const inn = eio(clamp01((t - start) / 0.35));
  const p = sp(frame, start + 0.25, { damping: 13, stiffness: 120 });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #23262d, #14161a)', clipPath: `circle(${inn * 1800}px at 50% 55%)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, height: 1000, background: 'radial-gradient(circle at 50% 40%, rgba(242,106,46,0.32), transparent 62%)' }} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, textAlign: 'center' }}>
        <LogoMark size={150} draw={1} glow={0.6} />
        <Wordmark size={96} color="#fff" />
        <p style={{ margin: '40px 0 0', color: '#fff', fontWeight: 800, fontSize: 70, lineHeight: 1.05, letterSpacing: '-0.035em', fontFamily: 'Inter Display, Inter, sans-serif', opacity: clamp01((t - start - 0.2) / 0.25) }}>{kicker}</p>
        {cta && <div style={{ transform: `scale(${lerp(0.7, 1, p)})`, opacity: clamp01((t - start - 0.35) / 0.2), background: `linear-gradient(180deg, #ff8a4a, ${C.coralDark})`, color: '#fff', borderRadius: 999, padding: '26px 64px', fontSize: 66, fontWeight: 800, letterSpacing: '-0.02em', boxShadow: '0 20px 50px rgba(242,106,46,0.45)' }}>{cta}</div>}
        {sub && <p style={{ margin: cta ? 0 : '6px 0 0', color: 'rgba(255,255,255,0.62)', fontSize: 38, fontWeight: 600, opacity: clamp01((t - start - 0.4) / 0.25) }}>{sub}</p>}
      </div>
    </AbsoluteFill>
  );
}

export function ReelStage({ dur, kicker, cta, sub, children, tone = 'ivory' }: { dur: number; kicker: string; cta?: string; sub?: string; children: ReactNode; tone?: 'ivory' | 'sky' }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: C.ivory, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      <Backdrop tone={tone} t={t} />
      {children}
      <Vignette strength={0.1} />
      <Grain opacity={0.03} />
      <Outro dur={dur} kicker={kicker} cta={cta} sub={sub} />
      <Intro />
    </AbsoluteFill>
  );
}

export { Enter, C, FPS, clamp01, eio, eout, lerp, prog, sp, track };
