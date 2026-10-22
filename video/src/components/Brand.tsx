import { C } from '../theme';

/** AutoHub mark. `draw` 0..1 draws the ring and the chevron like a pen stroke. */
export function LogoMark({ size = 120, draw = 1, glow = 0 }: { size?: number; draw?: number; glow?: number }) {
  const ring = 66 * 1.0;
  const R = 12.2;
  const circ = 2 * Math.PI * R;
  const visible = Math.min(1, draw / 0.75);
  const chev = Math.max(0, (draw - 0.55) / 0.45);
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${glow * 14}px rgba(242,106,46,0.6))` : undefined }}>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a5e" />
          <stop offset="1" stopColor="#ee5416" />
        </linearGradient>
      </defs>
      <circle
        cx="16" cy="16" r={R} fill="none" stroke="url(#lm-g)" strokeWidth="3.2" strokeLinecap="round"
        strokeDasharray={`${(ring / 77) * circ * visible} ${circ * 2}`} transform="rotate(-62 16 16)"
      />
      <path d="M10.8 19.4 16 11.2l5.2 8.2" fill="none" stroke="url(#lm-g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" strokeDashoffset={20 * (1 - chev)} />
    </svg>
  );
}

export function Wordmark({ size = 96, color = C.ink }: { size?: number; color?: string }) {
  return <span style={{ fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 800, fontSize: size, letterSpacing: '-0.035em', color, lineHeight: 1 }}>AutoHub</span>;
}
