/**
 * A premium detailing garage drawn in vector, so the hero stays sharp at any screen size: a hexagon LED ceiling,
 * a glossy floor reflecting it, and a car facing the viewer. The room sits to the right to leave the text area calm.
 */
const VP = { x: 1400, y: 470 };
const FOCAL = 900;
const CEILING = -3;
const FLOOR = 2;
const WALL = 7;
const FAR = 15;

const project = (x: number, y: number, z: number) => [VP.x + (x * FOCAL) / z, VP.y + (y * FOCAL) / z] as const;
const pt = (x: number, y: number, z: number) => project(x, y, z).map((n) => n.toFixed(1)).join(',');
const plane = (corners: [number, number, number][]) => corners.map(([x, y, z]) => pt(x, y, z)).join(' ');

/** One path holding every hexagon of the light grid, at height `y`. */
function hexPath(y: number) {
  const R = 1.25;
  const hex = R * 0.86;
  const out: string[] = [];
  for (let row = 0; row < 12; row++) {
    const cz = 1.6 + row * R * 1.5;
    if (cz > FAR - 1) continue;
    for (let col = -6; col <= 6; col++) {
      const cx = col * R * Math.sqrt(3) + (row % 2 ? (R * Math.sqrt(3)) / 2 : 0);
      if (Math.abs(cx) > WALL - 1.2) continue;
      const corners = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        return pt(cx + hex * Math.cos(a), y, cz + hex * Math.sin(a));
      });
      out.push(`M${corners.join(' L')} Z`);
    }
  }
  return out.join(' ');
}

const CEILING_HEX = hexPath(CEILING);
const FLOOR_HEX = hexPath(FLOOR);
const WALL_LIGHTS = [3.4, 5, 7, 9.5, 12.5];
const BODY = 'M-112 -30 L-118 -60 Q-118 -84 -100 -92 L-78 -104 L-62 -158 Q-58 -170 -44 -171 L44 -171 Q58 -170 62 -158 L78 -104 L100 -92 Q118 -84 118 -60 L112 -30 L112 -6 Q112 0 104 0 L84 0 Q76 0 76 -8 L76 -14 L-76 -14 L-76 -8 Q-76 0 -84 0 L-104 0 Q-112 0 -112 -6 Z';

function Car() {
  return (
    <>
      <path d={BODY} fill="url(#gb-body)" stroke="#59606d" strokeWidth="1" />
      <path d="M-58 -106 L-47 -157 L47 -157 L58 -106 Z" fill="url(#gb-glass)" />
      <path d="M-44 -168 Q0 -174 44 -168" fill="none" stroke="#dfe7f2" strokeOpacity=".75" strokeWidth="2" />
      <path d="M-82 -106 L-96 -108 L-98 -100 L-84 -98 Z M82 -106 L96 -108 L98 -100 L84 -98 Z" fill="#14161b" />
      <path d="M-40 -70 L40 -70 L46 -46 L-46 -46 Z" fill="#08090c" stroke="#3a3f4a" strokeWidth="1.5" />
      {[-32, -22, -12, -2, 8, 18, 28].map((x) => <line key={x} x1={x + 2} x2={x * 1.1 + 2} y1="-68" y2="-48" stroke="#2c313a" strokeWidth="2" />)}
      <rect x="-70" y="-34" width="140" height="11" rx="5" fill="#08090c" />
      <path d="M-112 -74 L-58 -68 L-60 -60 L-110 -62 Z M112 -74 L58 -68 L60 -60 L110 -62 Z" fill="#fff" opacity=".3" filter="url(#gb-soft)" />
      <path d="M-110 -72 L-60 -67 L-61 -63 L-109 -66 Z M110 -72 L60 -67 L61 -63 L109 -66 Z" fill="#f4f8ff" />
    </>
  );
}

export function GarageBackdrop() {
  const carScale = FOCAL / 7 / 122;
  const carX = VP.x;
  const carY = project(0, FLOOR, 7)[1];
  return (
    <svg aria-hidden viewBox="0 0 2000 1000" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 h-full w-full max-sm:left-[-80%] max-sm:w-[260%]">
      <defs>
        <linearGradient id="gb-ceiling" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07080b" /><stop offset="1" stopColor="#191c23" /></linearGradient>
        <linearGradient id="gb-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2e37" /><stop offset=".35" stopColor="#14161b" /><stop offset="1" stopColor="#08090c" /></linearGradient>
        <linearGradient id="gb-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#090a0e" /><stop offset="1" stopColor="#20242c" /></linearGradient>
        <linearGradient id="gb-wall-r" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#090a0e" /><stop offset="1" stopColor="#20242c" /></linearGradient>
        <linearGradient id="gb-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c313a" /><stop offset="1" stopColor="#14161b" /></linearGradient>
        <linearGradient id="gb-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a606c" /><stop offset=".3" stopColor="#23262e" /><stop offset="1" stopColor="#0a0b0f" /></linearGradient>
        <linearGradient id="gb-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fa0b8" stopOpacity=".6" /><stop offset="1" stopColor="#10131a" /></linearGradient>
        <linearGradient id="gb-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset=".55" stopColor="#fff" stopOpacity=".12" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id="gb-strip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f8ff" /><stop offset="1" stopColor="#f4f8ff" stopOpacity=".25" /></linearGradient>
        <radialGradient id="gb-pool" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#dfe7f2" stopOpacity=".35" /><stop offset="1" stopColor="#dfe7f2" stopOpacity="0" /></radialGradient>
        <mask id="gb-mirror"><rect width="2000" height="1000" fill="url(#gb-fade)" /></mask>
        <filter id="gb-glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="gb-soft" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>

      <rect width="2000" height="1000" fill="#08090c" />
      <polygon points={plane([[-40, CEILING, 0.7], [WALL, CEILING, 0.7], [WALL, CEILING, FAR], [-WALL, CEILING, FAR]])} fill="url(#gb-ceiling)" />
      <polygon points={plane([[-40, FLOOR, 0.7], [WALL, FLOOR, 0.7], [WALL, FLOOR, FAR], [-WALL, FLOOR, FAR]])} fill="url(#gb-floor)" />
      <polygon points={plane([[-WALL, CEILING, 0.7], [-WALL, CEILING, FAR], [-WALL, FLOOR, FAR], [-WALL, FLOOR, 0.7]])} fill="url(#gb-wall)" />
      <polygon points={plane([[WALL, CEILING, 0.7], [WALL, CEILING, FAR], [WALL, FLOOR, FAR], [WALL, FLOOR, 0.7]])} fill="url(#gb-wall-r)" />

      {/* back wall with slats and a coral light line */}
      <polygon points={plane([[-WALL, CEILING, FAR], [WALL, CEILING, FAR], [WALL, FLOOR, FAR], [-WALL, FLOOR, FAR]])} fill="url(#gb-back)" />
      {Array.from({ length: 21 }, (_, i) => { const x = -WALL + i * 0.7; return <polygon key={i} points={plane([[x, CEILING, FAR], [x + 0.06, CEILING, FAR], [x + 0.06, FLOOR, FAR], [x, FLOOR, FAR]])} fill="#0b0c10" opacity=".6" />; })}
      <polygon points={plane([[-WALL, 0.05, FAR], [WALL, 0.05, FAR], [WALL, 0.15, FAR], [-WALL, 0.15, FAR]])} fill="#e4633f" />
      <polygon points={plane([[-WALL, -0.05, FAR], [WALL, -0.05, FAR], [WALL, 0.25, FAR], [-WALL, 0.25, FAR]])} fill="#e4633f" opacity=".5" filter="url(#gb-soft)" />

      {/* light strips along the side walls */}
      {WALL_LIGHTS.map((z) => [-WALL, WALL].map((x) => (
        <g key={`${x}${z}`}>
          <polygon points={plane([[x, CEILING, z], [x, CEILING, z + 0.28], [x, FLOOR, z + 0.28], [x, FLOOR, z]])} fill="#f4f8ff" opacity=".35" filter="url(#gb-soft)" />
          <polygon points={plane([[x, CEILING, z], [x, CEILING, z + 0.12], [x, FLOOR, z + 0.12], [x, FLOOR, z]])} fill="url(#gb-strip)" />
        </g>
      )))}

      {/* hexagon LED ceiling and its reflection */}
      <path d={CEILING_HEX} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="9" filter="url(#gb-glow)" />
      <path d={CEILING_HEX} fill="none" stroke="#f7faff" strokeWidth="3.5" strokeLinejoin="round" />
      <g mask="url(#gb-mirror)"><path d={FLOOR_HEX} fill="none" stroke="#f7faff" strokeOpacity=".5" strokeWidth="3" /></g>

      {/* car and its reflection */}
      <ellipse cx={carX} cy={carY + 12} rx="330" ry="46" fill="url(#gb-pool)" />
      <g transform={`translate(${carX} ${carY}) scale(${carScale.toFixed(3)} ${(-carScale * 0.7).toFixed(3)})`} opacity=".3"><Car /></g>
      <ellipse cx={carX} cy={carY + 2} rx={150 * carScale} ry="10" fill="#000" opacity=".75" />
      <g transform={`translate(${carX} ${carY}) scale(${carScale.toFixed(3)})`}><Car /></g>
    </svg>
  );
}
