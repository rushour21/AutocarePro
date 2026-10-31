import clsx from 'clsx';

type IconProps = { className?: string };

/** Outline of a gear with `teeth` teeth, centred on (50, 50). */
function gearPath(teeth: number) {
  const outer = 48;
  const root = 38;
  const step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  const points = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return [at(root, a - step * 0.3), at(outer, a - step * 0.17), at(outer, a + step * 0.17), at(root, a + step * 0.3)].join(' L');
  });
  return `M${points.join(' L')} Z`;
}

export function Gear({ teeth = 12, className }: IconProps & { teeth?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className} fill="currentColor">
      <path fillRule="evenodd" d={`${gearPath(teeth)} M50 36a14 14 0 1 0 0 28a14 14 0 1 0 0-28Z`} />
    </svg>
  );
}

export const HexBolt = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
    <path d="M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2z" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

export const Piston = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="2.5" width="12" height="9" rx="1.5" />
    <path d="M6 5.5h12M6 8h12M12 11.5v6" />
    <circle cx="12" cy="19.5" r="2" />
  </svg>
);

export const SparkPlug = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5h4v2h-4zM9.5 4.5h5l.5 6H9zM8 10.5h8v3H8zM9.5 13.5h5v4h-5zM12 17.5v2.5M9.5 21.5h5" />
  </svg>
);

export const Tyre = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5M5.3 5.3l3.5 3.5M15.2 15.2l3.5 3.5M18.7 5.3l-3.5 3.5M8.8 15.2l-3.5 3.5" />
  </svg>
);

/** A gear that turns slowly. Motion stops for people who ask for reduced motion. */
export function SpinningGear({ teeth, seconds = 40, reverse, className }: { teeth?: number; seconds?: number; reverse?: boolean; className?: string }) {
  return <span aria-hidden className={clsx('pointer-events-none block animate-spin motion-reduce:animate-none', className)} style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : undefined }}><Gear teeth={teeth} className="h-full w-full" /></span>;
}

/** Two meshing gears, for loading screens. */
export function GearLoader({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-label={label} className={clsx('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <div className="relative h-[92px] w-[104px]">
        <SpinningGear teeth={12} seconds={3} className="absolute left-0 top-0 h-16 w-16 text-coral-500" />
        <SpinningGear teeth={8} seconds={2} reverse className="absolute bottom-0 right-0 h-11 w-11 text-ink-500" />
      </div>
      <p className="text-sm font-medium text-ink-500">{label}…</p>
    </div>
  );
}
