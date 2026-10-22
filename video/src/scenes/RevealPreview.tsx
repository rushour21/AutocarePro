import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop } from '../components/Bits';
import { FilmWorld } from '../three/FilmWorld';
import { revealCamera, revealWorld } from '../three/world';

export const RevealPreview = () => {
  const frame = useCurrentFrame() + Math.round(10.7 * 30);
  return (
    <AbsoluteFill>
      <Backdrop tone="sky" />
      <FilmWorld state={revealWorld(frame, revealCamera(frame))} />
    </AbsoluteFill>
  );
};
