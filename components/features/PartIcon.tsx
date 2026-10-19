import { Package } from 'lucide-react';
import type { Part } from '@/lib/types';

export function PartIcon({ part, size = 30 }: { part: Pick<Part, 'icon'>; size?: number }) {
  return part.icon ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/assets/parts/${part.icon}.png`} alt="" className="blend-multiply object-contain" style={{ width: size, height: size }} />
  ) : (
    <span className="flex items-center justify-center rounded-lg bg-coral-100 text-coral-500" style={{ width: size, height: size }}>
      <Package className="h-4 w-4" />
    </span>
  );
}
