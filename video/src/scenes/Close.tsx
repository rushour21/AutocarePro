import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Backdrop } from '../components/Bits';
import { LogoMark } from '../components/Brand';
import { Laptop, Phone, PortalTag, Tablet } from '../components/Devices';
import { Kinetic } from '../components/Kinetic';
import { C, FPS, H, W, clamp01, cues, ein, eio, eout, lerp, prog, sp } from '../theme';

const X = cues.close;

const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 91.7 + k * 17.3) * 43758.5453;
  return v - Math.floor(v);
};

export const Close = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const merge = prog(frame, X.merge, X.merge + 0.8, ein);
  const dark = eio(clamp01((t - (X.merge + 0.25)) / 0.9));
  const titleOut = 1 - prog(frame, X.merge - 0.3, X.merge + 0.2);

  const devices = [
    { name: 'Technician', color: C.blue, at: X.devices + 0.25, x: 150, y: 430, rot: 9, node: (
      <Tablet w={520}><Img src={staticFile('stills/tech.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Tablet>
    ) },
    { name: 'Admin', color: C.coral, at: X.devices, x: 520, y: 330, rot: 0, node: (
      <Laptop w={820}><Img src={staticFile('stills/dash.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Laptop>
    ) },
    { name: 'Customer', color: C.green, at: X.devices + 0.5, x: 1480, y: 270, rot: -8, node: (
      <Phone w={300} h={650}><Img src={staticFile('sprites/phone_overview.png')} style={{ width: '100%', display: 'block' }} /></Phone>
    ) },
  ];
  const cx = W / 2, cy = H / 2;
  const logoP = prog(frame, X.logo, X.logo + 1.1, eout);
  const tag = 'Every repair, under control.';
  const typed = Math.floor(clamp01((t - X.tag) / 1.2) * tag.length);
  const breathe = 1 + Math.sin(t * 1.3) * 0.012;

  return (
    <AbsoluteFill>
      <Backdrop tone="ivory" t={t} />
      {/* title */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 58, display: 'flex', justifyContent: 'center', opacity: titleOut }}>
        <Kinetic size={104} gap={0.22} wrap words={[{ text: 'One', at: 47.6 }, { text: 'platform.', at: 47.75 }, { text: 'Three', at: 48.5 }, { text: 'portals.', at: 48.65, color: C.coral }, { text: 'Total', at: 49.55 }, { text: 'clarity.', at: 49.7 }]} style={{ justifyContent: 'center', width: 1400, rowGap: 6 }} />
      </div>
      {/* devices */}
      {devices.map((d, i) => {
        const p = sp(frame, d.at, { damping: 15, stiffness: 90 });
        const float = Math.sin(t * 1.2 + i * 1.7) * 10;
        const gx = lerp(d.x, cx - 200, merge), gy = lerp(d.y + (1 - p) * 700 + float, cy - 200, merge);
        const sc = lerp(1, 0.12, merge);
        return (
          <div key={d.name} style={{ position: 'absolute', left: gx, top: gy, opacity: (1 - merge) * clamp01((t - d.at) / 0.2), transform: `perspective(2200px) rotateY(${d.rot * (1 - merge) * 1.2}deg) scale(${sc})`, transformOrigin: '0 0' }}>
            {d.node}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: -90, display: 'flex', justifyContent: 'center', opacity: clamp01((t - d.at - 0.6) / 0.3) }}><PortalTag text={d.name} color={d.color} /></div>
          </div>
        );
      })}
      {/* dark finale */}
      <AbsoluteFill style={{ clipPath: `circle(${dark * 1500}px at 50% 50%)` }}>
        <Backdrop tone="dark" t={t} />
        {Array.from({ length: 36 }).map((_, i) => {
          const life = (t * 0.12 + rnd(i, 1)) % 1;
          return <div key={i} style={{ position: 'absolute', left: `${rnd(i, 2) * 100}%`, top: `${100 - life * 115}%`, width: 5 + rnd(i, 3) * 7, height: 5 + rnd(i, 3) * 7, borderRadius: '50%', background: i % 3 ? C.coral : '#ffb48a', opacity: Math.sin(life * Math.PI) * 0.55 }} />;
        })}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `scale(${breathe})` }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, marginTop: -40 }}>
            <div style={{ position: 'relative', opacity: logoP }}>
              <div style={{ position: 'absolute', inset: -70, borderRadius: '50%', border: `3px solid ${C.coral}`, opacity: (1 - eout(clamp01((t - X.logo - 0.6) / 1.4))) * 0.8, transform: `scale(${0.7 + eout(clamp01((t - X.logo - 0.6) / 1.4)) * 1.3})` }} />
              <LogoMark size={230} draw={logoP} glow={logoP > 0.95 ? 0.8 : 0} />
            </div>
            <div style={{ fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 800, fontSize: 170, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, opacity: clamp01((t - X.logo - 0.4) / 0.4), transform: `translateY(${(1 - eout(clamp01((t - X.logo - 0.4) / 0.7))) * 40}px)` }}>AutoHub</div>
            <div style={{ fontSize: 48, fontWeight: 600, color: '#ffb48a', letterSpacing: '-0.01em', height: 60 }}>
              {tag.slice(0, typed)}
              <span style={{ opacity: Math.floor(t * 2) % 2 === 0 && typed < tag.length + 6 ? 1 : 0, color: C.coral }}>▍</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
