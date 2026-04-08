import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// Optimized for 32x32 favicon display
const SMALL_DOT_SIZE = 6; // Two small dots (laghu)
const LARGE_DOT_SIZE = 14; // One large dot (guru)
const LAGHU_COLOR = '#3B82F6'; // Blue for laghu (1)
const GURU_COLOR = '#F59E0B'; // Amber/orange for guru (2)

interface DotProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity?: number;
}

function Dot({ x, y, size, color, opacity = 1 }: DotProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

/**
 * Simple favicon animation: 2 blue dots (Laghu) → 1 orange dot (Guru) → 2 blue dots
 * Represents the fundamental Chandam meter principle: 2 Laghus = 1 Guru
 *
 * Total: 24 frames at 12 FPS = 2 second loop
 * - Frames 0-3: Two blue dots (static)
 * - Frames 4-9: Merge animation (move closer, blend color, grow)
 * - Frames 10-13: One orange dot (static)
 * - Frames 14-19: Split animation (shrink, color shift, divide)
 * - Frames 20-23: Two blue dots (static, ready to loop)
 */
export const ChandamIconFavicon: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;

  // Animation phases
  const PHASE_1_START = 0;   // Two dots static
  const PHASE_1_END = 3;
  const PHASE_2_START = 4;   // Merge animation
  const PHASE_2_END = 9;
  const PHASE_3_START = 10;  // One dot static
  const PHASE_3_END = 13;
  const PHASE_4_START = 14;  // Split animation
  const PHASE_4_END = 19;
  const PHASE_5_START = 20;  // Two dots static (loop prep)
  const PHASE_5_END = 23;

  // Calculate animation progress
  const mergeProgress = interpolate(
    frame,
    [PHASE_2_START, PHASE_2_END],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const splitProgress = interpolate(
    frame,
    [PHASE_4_START, PHASE_4_END],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Determine which phase we're in
  const isPhase1 = frame >= PHASE_1_START && frame <= PHASE_1_END;
  const isPhase2 = frame >= PHASE_2_START && frame <= PHASE_2_END;
  const isPhase3 = frame >= PHASE_3_START && frame <= PHASE_3_END;
  const isPhase4 = frame >= PHASE_4_START && frame <= PHASE_4_END;
  const isPhase5 = frame >= PHASE_5_START && frame <= PHASE_5_END;

  // Phase 1 & 5: Two blue dots (static)
  if (isPhase1 || isPhase5) {
    const dot1X = centerX - 5; // 4px apart (5px from center)
    const dot2X = centerX + 5;

    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        <Dot x={dot1X} y={centerY} size={SMALL_DOT_SIZE} color={LAGHU_COLOR} />
        <Dot x={dot2X} y={centerY} size={SMALL_DOT_SIZE} color={LAGHU_COLOR} />
      </AbsoluteFill>
    );
  }

  // Phase 2: Merge animation (2 blue dots → 1 orange dot)
  if (isPhase2) {
    const startX1 = centerX - 5;
    const startX2 = centerX + 5;

    // Dots move toward center
    const dot1X = interpolate(mergeProgress, [0, 1], [startX1, centerX]);
    const dot2X = interpolate(mergeProgress, [0, 1], [startX2, centerX]);

    // Size grows from small to large
    const size = interpolate(mergeProgress, [0, 1], [SMALL_DOT_SIZE, LARGE_DOT_SIZE]);

    // Color transition: blue → orange (crossfade)
    const blueOpacity = interpolate(mergeProgress, [0, 0.5], [1, 0], {
      extrapolateRight: 'clamp',
    });
    const orangeOpacity = interpolate(mergeProgress, [0.5, 1], [0, 1], {
      extrapolateLeft: 'clamp',
    });

    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        {/* Two blue dots merging */}
        <Dot x={dot1X} y={centerY} size={size} color={LAGHU_COLOR} opacity={blueOpacity} />
        <Dot x={dot2X} y={centerY} size={size} color={LAGHU_COLOR} opacity={blueOpacity} />

        {/* Emerging orange dot */}
        <Dot x={centerX} y={centerY} size={size} color={GURU_COLOR} opacity={orangeOpacity} />
      </AbsoluteFill>
    );
  }

  // Phase 3: One orange dot (static)
  if (isPhase3) {
    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        <Dot x={centerX} y={centerY} size={LARGE_DOT_SIZE} color={GURU_COLOR} />
      </AbsoluteFill>
    );
  }

  // Phase 4: Split animation (1 orange dot → 2 blue dots)
  if (isPhase4) {
    const endX1 = centerX - 5;
    const endX2 = centerX + 5;

    // Dots move away from center
    const dot1X = interpolate(splitProgress, [0, 1], [centerX, endX1]);
    const dot2X = interpolate(splitProgress, [0, 1], [centerX, endX2]);

    // Size shrinks from large to small
    const size = interpolate(splitProgress, [0, 1], [LARGE_DOT_SIZE, SMALL_DOT_SIZE]);

    // Color transition: orange → blue (crossfade)
    const orangeOpacity = interpolate(splitProgress, [0, 0.5], [1, 0], {
      extrapolateRight: 'clamp',
    });
    const blueOpacity = interpolate(splitProgress, [0.5, 1], [0, 1], {
      extrapolateLeft: 'clamp',
    });

    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        {/* Fading orange dot */}
        <Dot x={centerX} y={centerY} size={size} color={GURU_COLOR} opacity={orangeOpacity} />

        {/* Emerging blue dots */}
        <Dot x={dot1X} y={centerY} size={size} color={LAGHU_COLOR} opacity={blueOpacity} />
        <Dot x={dot2X} y={centerY} size={size} color={LAGHU_COLOR} opacity={blueOpacity} />
      </AbsoluteFill>
    );
  }

  // Fallback (should never reach here)
  return <AbsoluteFill style={{ backgroundColor: 'transparent' }} />;
};
