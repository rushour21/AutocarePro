import raw from '../../public/reels/targets.json';
/** tap targets recorded from the real app by tools/capture_reels.mjs (css px in the screenshot) */
export const TG = raw as Record<string, { x: number; y: number }>;
