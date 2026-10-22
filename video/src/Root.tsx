import { Composition } from 'remotion';
import { Film } from './Film';
import { FPS, H, TOTAL_FRAMES, W } from './theme';

export const Root = () => <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />;
