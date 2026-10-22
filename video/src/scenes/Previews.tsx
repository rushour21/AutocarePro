import { AbsoluteFill, Sequence } from 'remotion';
import { Dashboard3D } from './Dashboard3D';
import { FPS } from '../theme';

/** previews run from a given time by shifting the frame: the scene itself always uses absolute film time */
export const Dashboard3DPreview = () => (
  <AbsoluteFill>
    <Sequence from={-Math.round(10.7 * FPS)} layout="none">
      <Dashboard3D />
    </Sequence>
  </AbsoluteFill>
);
