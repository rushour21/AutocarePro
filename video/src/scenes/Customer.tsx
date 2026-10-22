import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Lock } from 'lucide-react';
import { Backdrop } from '../components/Bits';
import { Kinetic } from '../components/Kinetic';
import { Phone, PortalTag } from '../components/Devices';
import { C, FPS, clamp01, cues, eio, eout, lerp, prog, sp, track } from '../theme';
import targets from '../../public/sprites/targets.json';

const U = cues.cust;
const PK = 1.052; // phone screen scale: 390 css px -> 410 px
const PW = 410, PH = 886;
const PHONE = { x: 1220, y: 96 };

type PageName = 'phone_overview' | 'phone_timeline' | 'phone_estimate' | 'phone_estimate_approved';
const HEIGHT: Record<PageName, number> = { phone_overview: 1239, phone_timeline: 871, phone_estimate: 895, phone_estimate_approved: 895 };

function Page({ name, y = 0, x = 0, opacity = 1 }: { name: PageName; y?: number; x?: number; opacity?: number }) {
  return <Img src={staticFile(`sprites/${name}.png`)} style={{ position: 'absolute', left: x, top: -y, width: PW, height: HEIGHT[name] * PK, opacity }} />;
}

function Confetti({ at, x, y }: { at: number; x: number; y: number }) {
  const frame = useCurrentFrame();
  const t = (frame / FPS - at);
  if (t < 0 || t > 1.6) return null;
  return (
    <>
      {Array.from({ length: 34 }).map((_, i) => {
        const a = (i / 34) * Math.PI * 2 + i * 0.7, v = 260 + (i % 7) * 70;
        const px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t * 0.8 + 520 * t * t;
        return <div key={i} style={{ position: 'absolute', left: px, top: py, width: 12, height: i % 2 ? 22 : 12, borderRadius: i % 3 ? 3 : 6, background: [C.coral, C.green, C.blue, '#ffc83d', C.violet][i % 5], transform: `rotate(${i * 40 + t * 520}deg)`, opacity: 1 - clamp01((t - 1.0) / 0.6) }} />;
      })}
    </>
  );
}

export const Customer = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const enter = sp(frame, U.phone, { damping: 15, stiffness: 90 });
  // which page, and how far it has scrolled
  const scroll1 = track(frame, [[U.phone + 0.4, 0], [U.timeline - 0.1, 330]]);
  const toTimeline = prog(frame, U.timeline - 0.2, U.timeline + 0.35);
  const toEstimate = prog(frame, U.estimate - 0.2, U.estimate + 0.35);
  const approved = t > U.approve + 0.12;
  const approveBtn = { x: PHONE.x + 14 + 195 * PK, y: PHONE.y + 14 + targets.approve.y * PK };
  const press = clamp01((t - U.approve) / 0.7);
  const tilt = (1 - enter) * 14;

  // headline phases on the left
  const heads = [
    { from: U.phone + 0.15, to: U.estimate - 0.25, words: ['Follow', 'every', 'step.'], accent: 2 },
    { from: U.estimate - 0.1, to: U.link - 0.2, words: ['Approve', 'in', 'one', 'tap.'], accent: 3 },
    { from: U.link, to: U.noapp - 0.3, words: ['A', 'private', 'link.'], accent: 2 },
    { from: U.noapp - 0.1, to: U.end, words: ['No', 'app.', 'No', 'login.'], accent: 3 },
  ];
  return (
    <AbsoluteFill>
      <Backdrop tone="ivory" t={t} />
      <div style={{ position: 'absolute', left: 110, top: 80 }}><PortalTag text="Customer · Private link" color={C.green} style={{ opacity: clamp01((t - U.start - 0.2) / 0.3) }} /></div>
      {heads.map((h, i) => {
        const o = clamp01((t - h.from) / 0.2) * (1 - clamp01((t - h.to) / 0.25));
        if (o <= 0.001) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: 110, top: 330, width: 1000, opacity: o }}>
            <Kinetic wrap size={i === 3 ? 150 : 128} words={h.words.map((w, k) => ({ text: w, at: h.from + k * 0.16, color: k >= h.accent && i !== 3 ? C.coral : k >= 2 && i === 3 ? C.coral : undefined }))} />
          </div>
        );
      })}

      {/* the private link chip */}
      {t > U.link - 0.1 && (
        <div style={{ position: 'absolute', left: 110, top: 760, opacity: clamp01((t - U.link) / 0.25), transform: `translateY(${(1 - eout(clamp01((t - U.link) / 0.5))) * 24}px)` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 22, padding: '18px 28px', boxShadow: '0 18px 44px rgba(60,40,20,0.16)', fontSize: 30, fontWeight: 600, color: C.ink2 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: '#d9f3e5', display: 'grid', placeItems: 'center' }}><Lock size={24} color={C.green} /></span>
            <span>/track/<b style={{ color: C.ink }}>trk_j1004_</b><span style={{ letterSpacing: 3, color: '#b9b3aa' }}>••••••••••••</span></span>
          </div>
        </div>
      )}

      {/* the phone */}
      <div style={{ position: 'absolute', left: PHONE.x, top: PHONE.y + (1 - enter) * 700, transform: `perspective(1800px) rotateY(${-tilt}deg) rotateX(${tilt * 0.4}deg)`, opacity: clamp01((t - U.phone) / 0.2) }}>
        <Phone w={PW} h={PH}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Page name="phone_overview" y={scroll1} x={-toTimeline * PW} />
            <Page name="phone_timeline" y={0} x={PW - toTimeline * PW - toEstimate * PW} />
            {!approved ? <Page name="phone_estimate" x={PW - toEstimate * PW} /> : <Page name="phone_estimate_approved" x={PW - toEstimate * PW} />}
          </div>
        </Phone>
      </div>

      {/* tap + approval */}
      {t > U.approve - 0.35 && t < U.approve + 0.9 && (
        <div style={{ position: 'absolute', left: approveBtn.x, top: approveBtn.y, width: 0, height: 0 }}>
          <div style={{ position: 'absolute', width: 70, height: 70, left: -35, top: -35, borderRadius: '50%', background: 'rgba(30,30,30,0.28)', border: '3px solid rgba(255,255,255,0.9)', transform: `scale(${t < U.approve ? 1 + (U.approve - t) * 2 : 0.82})`, opacity: t < U.approve ? clamp01((t - (U.approve - 0.35)) / 0.2) : 1 - press }} />
          <div style={{ position: 'absolute', width: 100 + press * 200, height: 100 + press * 200, left: -(50 + press * 100), top: -(50 + press * 100), borderRadius: '50%', border: `4px solid ${C.green}`, opacity: t < U.approve ? 0 : 1 - press }} />
        </div>
      )}
      <Confetti at={U.approve + 0.1} x={approveBtn.x} y={approveBtn.y} />
      {approved && (
        <div style={{ position: 'absolute', left: PHONE.x - 330, top: PHONE.y + 560, transform: `scale(${sp(frame, U.approve + 0.2, { damping: 11, stiffness: 150 })})`, transformOrigin: 'right center', opacity: 1 - prog(frame, U.link + 0.9, U.link + 1.3) }}>
          <div style={{ background: C.green, color: '#fff', borderRadius: 22, padding: '16px 28px', fontSize: 32, fontWeight: 800, boxShadow: '0 18px 44px rgba(29,157,101,0.4)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', color: C.green, display: 'grid', placeItems: 'center', fontSize: 26 }}>✓</span>
            Estimate approved
          </div>
        </div>
      )}
      <span style={{ display: 'none' }}>{lerp(0, 1, eio(0))}</span>
    </AbsoluteFill>
  );
};
