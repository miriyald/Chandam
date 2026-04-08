import { Composition } from 'remotion';
import { ChandamIconCircles } from './ChandamIconCircles';
import { ChandamIconSquares } from './ChandamIconSquares';
import { ChandamIconTelugu } from './ChandamIconTelugu';
import { ChandamIconFavicon } from './ChandamIconFavicon';

// Calculate total duration:
// 13 combinations × (1.5s display + 0.5s transition) = 26 seconds
// Plus one final transition back to start for seamless loop
const FPS = 30;
const DISPLAY_DURATION = 1.5; // seconds
const TRANSITION_DURATION = 0.5; // seconds
const NUM_COMBINATIONS = 13;

// 13 × (display + transition) = seamless loop with transition back to start
const TOTAL_DURATION_SECONDS =
  NUM_COMBINATIONS * (DISPLAY_DURATION + TRANSITION_DURATION);

const TOTAL_FRAMES = Math.ceil(TOTAL_DURATION_SECONDS * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ChandamIconCircles"
        component={ChandamIconCircles}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={128}
        height={128}
        defaultProps={{}}
      />
      <Composition
        id="ChandamIconSquares"
        component={ChandamIconSquares}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={128}
        height={128}
        defaultProps={{}}
      />
      <Composition
        id="ChandamIconTelugu"
        component={ChandamIconTelugu}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={128}
        height={128}
        defaultProps={{}}
      />
      <Composition
        id="ChandamIconFavicon"
        component={ChandamIconFavicon}
        durationInFrames={24}
        fps={12}
        width={32}
        height={32}
        defaultProps={{}}
      />
    </>
  );
};
