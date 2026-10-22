import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop, Enter, Sprite } from '../components/Bits';
import { Cursor } from '../components/Cursor';
import type { CursorKey } from '../components/Cursor';
import { PortalTag } from '../components/Devices';
import { Kinetic } from '../components/Kinetic';
import { C, FPS, clamp01, cues, eio, eout, lerp, prog, sp } from '../theme';
import { FloorPlan } from '@/components/features/layout/FloorPlan';
import type { Bay, WorkshopLayout } from '@/lib/types';
import { LAYOUT } from '../three/world';
import targets from '../../public/sprites/targets.json';

const S = cues.studio;

// layout of the studio screen (1920 x 1080)
export const PLAN_BOX = { x: 410, y: 150, w: 1060, h: 740 };
const K = 1.25;
const TOOLS = { x: 60, y: 405 };
const ACT_RIGHT = 1860;

export const BAY9_FINAL = { x: 6.5, y: 19.5 };
export const BAY9_START = { x: 0, y: 19 };

/** the layout being edited at this moment: the floor lengthens, bay 9 appears, then is dragged into place */
export function studioLayout(frame: number): { layout: WorkshopLayout; bay9?: Bay } {
  const grow = prog(frame, S.addBay + 0.2, S.addBay + 1.0);
  const plan = { ...LAYOUT.plan, h: lerp(20, 28, grow) };
  const t = frame / FPS;
  if (t < S.addBay + 0.2) return { layout: { ...LAYOUT, plan } };
  const pop = sp(frame, S.addBay + 0.25, { damping: 13, stiffness: 150 });
  const d = eio(clamp01((t - S.drag) / 0.75));
  const q = (v: number) => Math.round(v * 10) / 10;
  const x = q(lerp(BAY9_START.x, BAY9_FINAL.x, d)), y = q(lerp(BAY9_START.y, BAY9_FINAL.y, d));
  const w = pop >= 0.995 ? 4.5 : 4.5 * Math.max(0.01, pop), l = pop >= 0.995 ? 7 : 7 * Math.max(0.01, pop);
  const bay9: Bay = { id: 'bay-9', name: 'Bay 9', type: t > S.props ? 'tyre' : 'general', x: x + (4.5 - w) / 2, y: y + (7 - l) / 2, w, l, rot: 0, active: true, state: 'normal', equipment: t > S.equip ? ['two_post_lift'] : [], notes: '' };
  return { layout: { ...LAYOUT, plan, bays: [...LAYOUT.bays, bay9] }, bay9 };
}

/** metres on the plan -> pixels on screen, mirroring how the floor plan fits its viewBox into the box */
export function planToScreen(plan: { w: number; h: number }, mx: number, my: number) {
  const base = { x: -2.4, y: -1.8, w: plan.w + 3.2, h: plan.h + 2.6 };
  const s = Math.min(PLAN_BOX.w / base.w, PLAN_BOX.h / base.h);
  const ox = PLAN_BOX.x + (PLAN_BOX.w - base.w * s) / 2, oy = PLAN_BOX.y + (PLAN_BOX.h - base.h * s) / 2;
  return { x: ox + (mx - base.x) * s, y: oy + (my - base.y) * s };
}

export const Studio = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { layout, bay9 } = studioLayout(frame);
  const selected = bay9 ? 'bay-9' : t > S.hi ? 'bay-2' : null;
  const sel = t > S.hi + 1.6 && !bay9 ? null : selected;

  // cursor
  const addBay = { x: TOOLS.x + targets.addbay.x * K, y: TOOLS.y + targets.addbay.y * K };
  const b9s = planToScreen({ w: 30, h: 28 }, BAY9_START.x + 2.25, BAY9_START.y + 3.5);
  const b9e = planToScreen({ w: 30, h: 28 }, BAY9_FINAL.x + 2.25, BAY9_FINAL.y + 3.5);
  const tag = { x: 1500 + 62 * K, y: 150 + 438 * K };
  const publish = { x: ACT_RIGHT - 629 * K + targets.publish.x * K, y: 40 + targets.publish.y * K };
  const keys: CursorKey[] = [
    { t: S.hi - 0.3, x: 1100, y: 980 },
    { t: S.hi + 0.8, x: 760, y: 420 },
    { t: S.addBay - 0.5, x: addBay.x + 260, y: addBay.y + 40 },
    { t: S.addBay, x: addBay.x, y: addBay.y, click: true },
    { t: S.drag - 0.15, x: b9s.x, y: b9s.y },
    { t: S.drag + 0.75, x: b9e.x, y: b9e.y },
    { t: S.equip - 0.4, x: tag.x + 160, y: tag.y + 90 },
    { t: S.equip, x: tag.x, y: tag.y },
    { t: S.publish - 0.5, x: publish.x - 220, y: publish.y + 120 },
    { t: S.publish, x: publish.x, y: publish.y, click: true },
    { t: S.publish + 0.9, x: publish.x - 50, y: publish.y + 240 },
  ];
  const hide = 1 - prog(frame, S.to3d - 0.05, S.to3d + 0.35);

  // props panel
  const dirty = t > S.addBay;
  const propsName = t > S.props ? 'studio_props_bay9' : 'studio_props_empty';
  const pulse = (a: number, b: number) => Math.sin(clamp01((t - a) / (b - a)) * Math.PI);
  const published = t > S.publish;
  return (
    <AbsoluteFill style={{ opacity: hide, transform: `scale(${1 + (1 - hide) * 0.12})`, filter: `blur(${(1 - hide) * 14}px)` }}>
      <Backdrop tone="ivory" t={t} />
      <Enter at={S.start + 0.1} dy={-30}><div style={{ position: 'absolute', left: 60, top: 28 }}><Sprite name="studio_title" x={60} y={34} w={446} k={K} /></div></Enter>
      <Enter at={S.start + 0.2} dy={-30}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {!dirty && <Sprite name="studio_actions_idle" x={ACT_RIGHT - 521 * K} y={40} w={521} k={K} />}
          {dirty && <Sprite name="studio_actions_dirty" x={ACT_RIGHT - 629 * K} y={40} w={629} k={K} />}
        </div>
      </Enter>
      <Enter at={S.start + 0.3} dx={-70} dy={0}><Sprite name="studio_dims" x={60} y={150} w={240} k={K} /></Enter>
      <Enter at={S.start + 0.4} dx={-70} dy={0}><Sprite name="studio_tools" x={TOOLS.x} y={TOOLS.y} w={240} k={K} /></Enter>
      <Enter at={S.start + 0.35} dy={40} from={0.96}>
        <div style={{ position: 'absolute', left: PLAN_BOX.x - 16, top: PLAN_BOX.y - 16, width: PLAN_BOX.w + 32, height: PLAN_BOX.h + 32, borderRadius: 34, background: 'linear-gradient(145deg,#fffbf7,#f8f0e6)', boxShadow: '0 24px 60px rgba(90,60,30,0.18), inset 0 1px 0 #fff' }}>
          <div style={{ position: 'absolute', left: 16, top: 16, width: PLAN_BOX.w, height: PLAN_BOX.h, display: 'flex', justifyContent: 'center' }}>
            <FloorPlan layout={layout} mode="edit" selectedId={sel} className="!w-auto h-full" />
          </div>
        </div>
      </Enter>
      <Enter at={S.start + 0.5} dx={70} dy={0}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Sprite name={propsName} x={1500} y={150} w={290} k={K} style={{ transform: `scale(${t > S.props ? 1 + pulse(S.props, S.props + 0.5) * 0.02 : 1})`, transformOrigin: 'top left' }} />
        </div>
      </Enter>

      {/* narration-synced title */}
      {t > S.title && t < S.addBay - 0.4 && (
        <div style={{ position: 'absolute', left: 410, bottom: 44, opacity: 1 - prog(frame, S.addBay - 0.8, S.addBay - 0.4) }}>
          <Kinetic size={64} words={[{ text: 'Your', at: S.title }, { text: 'workshop.', at: S.title + 0.2 }, { text: 'Your', at: S.hi + 0.5 }, { text: 'layout.', at: S.hi + 0.7, color: C.coral }]} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 60, top: 920 }}><Enter at={S.start + 0.6} dy={20}><PortalTag text="Admin · Workshop Layout" /></Enter></div>

      {/* equipment highlight */}
      {t > S.equip - 0.05 && t < S.equip + 1.0 && (
        <div style={{ position: 'absolute', left: tag.x - 110, top: tag.y - 22, width: 220, height: 44, borderRadius: 14, border: `4px solid ${C.coral}`, opacity: Math.sin(clamp01((t - S.equip) / 1.0) * Math.PI), transform: `scale(${1 + eout(clamp01((t - S.equip) / 0.6)) * 0.25})` }} />
      )}
      {/* published toast */}
      {t > S.toast && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 118, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - sp(frame, S.toast, { damping: 14, stiffness: 150 })) * -90}px)`, opacity: clamp01((t - S.toast) / 0.15) }}>
          <div style={{ background: C.ink, color: '#fff', borderRadius: 999, padding: '16px 34px 16px 22px', display: 'flex', gap: 16, alignItems: 'center', fontSize: 28, fontWeight: 700, boxShadow: '0 20px 50px rgba(20,20,30,0.35)' }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: C.green, display: 'grid', placeItems: 'center', fontSize: 24 }}>✓</span>
            Layout published. Live on your dashboard.
          </div>
        </div>
      )}
      {published && t < S.publish + 0.6 && <div style={{ position: 'absolute', left: publish.x - 110, top: publish.y - 28, width: 220, height: 56, borderRadius: 16, boxShadow: `0 0 0 ${eout(clamp01((t - S.publish) / 0.6)) * 28}px rgba(242,106,46,${0.5 * (1 - clamp01((t - S.publish) / 0.6))})` }} />}
      <Cursor keys={keys} visible={clamp01((t - (S.hi - 0.3)) / 0.3)} />
    </AbsoluteFill>
  );
};
