import { Composition } from 'remotion';
import { Film } from './Film';
import { R1_DUR, Reel1 } from './reels/Reel1';
import { R2_DUR, Reel2 } from './reels/Reel2';
import { R3_DUR, Reel3 } from './reels/Reel3';
import { R4_DUR, Reel4 } from './reels/Reel4';
import { R5_DUR, Reel5 } from './reels/Reel5';
import { R6_DUR, Reel6 } from './reels/Reel6';
import { Cover } from './reels/Covers';
import { FPS, H, TOTAL_FRAMES, W } from './theme';

const RW = 1080, RH = 1920;
const frames = (s: number) => Math.round(s * FPS);
const reel = (id: string, component: React.FC, dur: number) => <Composition key={id} id={id} component={component} durationInFrames={frames(dur)} fps={FPS} width={RW} height={RH} />;

export const Root = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    {reel('Reel1', Reel1, R1_DUR)}
    {reel('Reel2', Reel2, R2_DUR)}
    {reel('Reel3', Reel3, R3_DUR)}
    {reel('Reel4', Reel4, R4_DUR)}
    {reel('Reel5', Reel5, R5_DUR)}
    {reel('Reel6', Reel6, R6_DUR)}
    {[1, 2, 3, 4, 5].map((n) => <Composition key={`c${n}`} id={`Cover${n}`} component={() => <Cover n={n} />} durationInFrames={90} fps={FPS} width={RW} height={RH} />)}
  </>
);
