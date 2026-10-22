import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop, Enter, Sprite } from '../components/Bits';
import { Cursor } from '../components/Cursor';
import type { CursorKey } from '../components/Cursor';
import { PortalTag } from '../components/Devices';
import { C, FPS, clamp01, cues, eout, prog, sp } from '../theme';
import targets from '../../public/sprites/targets.json';

const T = cues.tech;
const CAR = { x: 110, y: 190, k: 1.2 };
const RIGHT = { x: 1060, k: 1.05 };

export const Tech = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const marker = { x: CAR.x + targets.bumper.x * CAR.k, y: CAR.y + targets.bumper.y * CAR.k };
  const scanY = CAR.y + 40 + (560 * CAR.k - 80) * eout(clamp01((t - T.scan) / 0.8));
  const scan = t > T.scan && t < T.scan + 0.95 ? Math.sin(clamp01((t - T.scan) / 0.95) * Math.PI) : 0;
  const keys: CursorKey[] = [
    { t: T.scan, x: 760, y: 980 },
    { t: T.tap - 0.45, x: marker.x + 220, y: marker.y + 120 },
    { t: T.tap, x: marker.x, y: marker.y, click: true },
    { t: T.tap + 1.0, x: marker.x + 130, y: marker.y - 160 },
  ];
  const tip = sp(frame, T.tip, { damping: 12, stiffness: 170 });
  const tapP = clamp01((t - T.tap) / 0.8);
  return (
    <AbsoluteFill>
      <Backdrop tone="ivory" t={t} />
      <Enter at={T.start + 0.1} dx={-120} dy={20} from={0.95}><Sprite name="insp0" x={CAR.x} y={CAR.y} w={760} k={CAR.k} /></Enter>
      <Enter at={T.start + 0.35} dx={110} dy={0}><Sprite name="insp1" x={RIGHT.x} y={210} w={760} k={RIGHT.k} /></Enter>
      <Enter at={T.start + 0.5} dx={110} dy={0}><Sprite name="insp2" x={RIGHT.x} y={470} w={760} k={RIGHT.k} /></Enter>
      <Enter at={T.start + 0.65} dx={110} dy={0}><Sprite name="insp3" x={RIGHT.x} y={605} w={760} k={RIGHT.k} /></Enter>
      <div style={{ position: 'absolute', left: 110, top: 80 }}><Enter at={T.start + 0.2} dy={-20}><PortalTag text="Technician · Inspection" color={C.blue} /></Enter></div>

      {/* scan sweep across the car */}
      {scan > 0 && (
        <div style={{ position: 'absolute', left: CAR.x + 30, top: scanY, width: 760 * CAR.k - 60, height: 6, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${C.coral}, transparent)`, boxShadow: `0 0 30px 8px rgba(242,106,46,${0.5 * scan})`, opacity: scan }} />
      )}
      {/* tap feedback + tooltip */}
      {t > T.tap && (
        <>
          <div style={{ position: 'absolute', left: marker.x - 36, top: marker.y - 36, width: 72, height: 72, borderRadius: '50%', border: `5px solid ${C.coral}`, opacity: 1 - tapP, transform: `scale(${1 + eout(tapP) * 2.2})` }} />
          <div style={{ position: 'absolute', left: marker.x - 16, top: marker.y - 16, width: 32, height: 32, borderRadius: '50%', background: '#ef4d2f', boxShadow: '0 0 0 6px rgba(239,77,47,0.28)' }} />
        </>
      )}
      {t > T.tip && (
        <div style={{ position: 'absolute', left: marker.x + 80, top: marker.y - 120, transform: `scale(${tip}) translateY(${(1 - tip) * 20}px)`, transformOrigin: '0% 100%', opacity: clamp01((t - T.tip) / 0.15) }}>
          <div style={{ background: C.ink, color: '#fff', borderRadius: 18, padding: '14px 24px', boxShadow: '0 18px 44px rgba(20,20,30,0.38)' }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>Front Bumper</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <span style={{ background: '#ef4d2f', borderRadius: 8, padding: '3px 12px', fontSize: 20, fontWeight: 700 }}>Scratch</span>
              <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 8, padding: '3px 12px', fontSize: 20, fontWeight: 700 }}>Major</span>
              <span style={{ background: 'rgba(255,255,255,0.16)', borderRadius: 8, padding: '3px 12px', fontSize: 20, fontWeight: 700 }}>3 photos</span>
            </div>
          </div>
        </div>
      )}
      <Cursor keys={keys} visible={clamp01((t - T.scan) / 0.3) * (1 - prog(frame, T.end - 0.5, T.end - 0.1))} />
      <span style={{ display: 'none' }}>{prog(frame, 0, 1)}</span>
    </AbsoluteFill>
  );
};
