import React from 'react';
import { AbsoluteFill, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { getChandamCombinations } from './utils/combinations';
import { calculateDotPositions } from './utils/animations';

const SMALL_SQUARE_SIZE = 14; // Small square for 1 (laghu)
const LARGE_SQUARE_SIZE = 28; // Large square for 2 (guru) - exactly 2x
const SQUARE_SPACING = 2; // Minimal spacing
const LAGHU_COLOR = '#3B82F6'; // Blue for laghu (1)
const GURU_COLOR = '#F59E0B'; // Amber/orange for guru (2)
const BORDER_RADIUS = 4; // Rounded corners

interface SquareProps {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity?: number;
}

function Square({ x, y, size, color, opacity = 1 }: SquareProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: BORDER_RADIUS,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

interface CombinationDisplayProps {
  combination: number[];
  canvasSize: number;
  opacity?: number;
}

function CombinationDisplay({ combination, canvasSize, opacity = 1 }: CombinationDisplayProps) {
  const centerY = canvasSize / 2;
  const positions = calculateDotPositions(
    combination,
    SMALL_SQUARE_SIZE,
    LARGE_SQUARE_SIZE,
    SQUARE_SPACING,
    canvasSize
  );

  return (
    <>
      {combination.map((value, index) => (
        <Square
          key={index}
          x={positions[index]}
          y={centerY}
          size={value === 1 ? SMALL_SQUARE_SIZE : LARGE_SQUARE_SIZE}
          color={value === 1 ? LAGHU_COLOR : GURU_COLOR}
          opacity={opacity}
        />
      ))}
    </>
  );
}

interface TransitionProps {
  fromCombination: number[];
  toCombination: number[];
  canvasSize: number;
}

function Transition({ fromCombination, toCombination, canvasSize }: TransitionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow, smooth transition - consistent with other variants
  const progress = spring({
    frame,
    fps,
    config: {
      damping: 20, // Slower, smoother
      mass: 1,
      stiffness: 60, // Less stiff = slower
    },
  });

  const centerY = canvasSize / 2;

  const fromPositions = calculateDotPositions(
    fromCombination,
    SMALL_SQUARE_SIZE,
    LARGE_SQUARE_SIZE,
    SQUARE_SPACING,
    canvasSize
  );

  const toPositions = calculateDotPositions(
    toCombination,
    SMALL_SQUARE_SIZE,
    LARGE_SQUARE_SIZE,
    SQUARE_SPACING,
    canvasSize
  );

  // Create mapping based on cumulative sums to handle splitting/merging
  // E.g., [2,2,2] → [1,1,1,1,1,1]: each 2 splits into two 1s
  const createMapping = () => {
    const mapping: Array<{ fromIndex: number; toIndices: number[] }> = [];
    let fromCumSum = 0;
    let toCumSum = 0;
    let fromIdx = 0;
    let toIdx = 0;

    while (fromIdx < fromCombination.length) {
      const fromValue = fromCombination[fromIdx];
      fromCumSum += fromValue;

      const toIndices: number[] = [];
      while (toIdx < toCombination.length && toCumSum < fromCumSum) {
        toIndices.push(toIdx);
        toCumSum += toCombination[toIdx];
        toIdx++;
      }

      mapping.push({ fromIndex: fromIdx, toIndices });
      fromIdx++;
    }

    return mapping;
  };

  const renderMorphingSquares = () => {
    const squares = [];
    const mapping = createMapping();

    // Render based on mapping - each source splits/merges into its targets
    for (const { fromIndex, toIndices } of mapping) {
      const fromValue = fromCombination[fromIndex];
      const fromPos = fromPositions[fromIndex];
      const fromSize = fromValue === 1 ? SMALL_SQUARE_SIZE : LARGE_SQUARE_SIZE;
      const fromColor = fromValue === 1 ? LAGHU_COLOR : GURU_COLOR;

      if (toIndices.length === 0) {
        // Merging: this square fades out as it moves toward the merge target
        let targetIdx = 0;
        if (fromIndex > 0) {
          const prevMapping = mapping[fromIndex - 1];
          if (prevMapping.toIndices.length > 0) {
            targetIdx = prevMapping.toIndices[prevMapping.toIndices.length - 1];
          }
        }

        const targetPos = toPositions[targetIdx];

        const x = interpolate(progress, [0, 1], [fromPos, targetPos], {
          extrapolateRight: 'clamp',
        });

        const size = interpolate(progress, [0, 1], [fromSize, fromSize * 0.5], {
          extrapolateRight: 'clamp',
        });

        const opacity = interpolate(progress, [0, 1], [1, 0], {
          extrapolateRight: 'clamp',
        });

        squares.push(
          <Square
            key={`merge-${fromIndex}`}
            x={x}
            y={centerY}
            size={size}
            color={fromColor}
            opacity={opacity}
          />
        );
      } else if (toIndices.length === 1) {
        // 1-to-1 morphing
        const toIdx = toIndices[0];
        const toValue = toCombination[toIdx];
        const toPos = toPositions[toIdx];
        const toSize = toValue === 1 ? SMALL_SQUARE_SIZE : LARGE_SQUARE_SIZE;
        const toColor = toValue === 1 ? LAGHU_COLOR : GURU_COLOR;

        const x = interpolate(progress, [0, 1], [fromPos, toPos], {
          extrapolateRight: 'clamp',
        });

        const size = interpolate(progress, [0, 1], [fromSize, toSize], {
          extrapolateRight: 'clamp',
        });

        if (fromValue !== toValue) {
          // Color transition
          const fromOpacity = interpolate(progress, [0, 0.5], [1, 0], {
            extrapolateRight: 'clamp',
          });
          const toOpacity = interpolate(progress, [0.5, 1], [0, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          });

          squares.push(
            <Square
              key={`morph-from-${fromIndex}`}
              x={x}
              y={centerY}
              size={size}
              color={fromColor}
              opacity={fromOpacity}
            />,
            <Square
              key={`morph-to-${toIdx}`}
              x={x}
              y={centerY}
              size={size}
              color={toColor}
              opacity={toOpacity}
            />
          );
        } else {
          // Just moving
          squares.push(
            <Square
              key={`move-${fromIndex}`}
              x={x}
              y={centerY}
              size={size}
              color={fromColor}
              opacity={1}
            />
          );
        }
      } else {
        // Splitting: one source becomes multiple targets
        for (const toIdx of toIndices) {
          const toValue = toCombination[toIdx];
          const toPos = toPositions[toIdx];
          const toSize = toValue === 1 ? SMALL_SQUARE_SIZE : LARGE_SQUARE_SIZE;
          const toColor = toValue === 1 ? LAGHU_COLOR : GURU_COLOR;

          // Start from source position, move to target position
          const x = interpolate(progress, [0, 1], [fromPos, toPos], {
            extrapolateRight: 'clamp',
          });

          // Shrink from source size to target size
          const size = interpolate(progress, [0, 1], [fromSize, toSize], {
            extrapolateRight: 'clamp',
          });

          // Fade in during split
          const opacity = interpolate(progress, [0, 1], [0.5, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          });

          if (fromColor !== toColor) {
            // Color transition during split
            const fromOpacity = interpolate(progress, [0, 0.5], [1, 0], {
              extrapolateRight: 'clamp',
            }) * opacity;
            const toOpacity = interpolate(progress, [0.5, 1], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }) * opacity;

            squares.push(
              <Square
                key={`split-from-${fromIndex}-${toIdx}`}
                x={x}
                y={centerY}
                size={size}
                color={fromColor}
                opacity={fromOpacity}
              />,
              <Square
                key={`split-to-${fromIndex}-${toIdx}`}
                x={x}
                y={centerY}
                size={size}
                color={toColor}
                opacity={toOpacity}
              />
            );
          } else {
            squares.push(
              <Square
                key={`split-${fromIndex}-${toIdx}`}
                x={x}
                y={centerY}
                size={size}
                color={toColor}
                opacity={opacity}
              />
            );
          }
        }
      }
    }

    return squares;
  };

  return <>{renderMorphingSquares()}</>;
}

export const ChandamIconSquares: React.FC = () => {
  const { width, fps } = useVideoConfig();
  const combinations = getChandamCombinations();

  const DISPLAY_DURATION = 1.5 * fps; // 1.5 seconds to display each combination
  const TRANSITION_DURATION = 0.5 * fps; // 0.5 seconds for transition

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Series>
        {combinations.map((combo, index) => (
          <React.Fragment key={index}>
            {/* Display the combination */}
            <Series.Sequence durationInFrames={DISPLAY_DURATION}>
              <AbsoluteFill>
                <CombinationDisplay
                  combination={combo}
                  canvasSize={width}
                />
              </AbsoluteFill>
            </Series.Sequence>

            {/* Transition to next - always transition (including last→first for seamless loop) */}
            <Series.Sequence durationInFrames={TRANSITION_DURATION}>
              <AbsoluteFill>
                <Transition
                  fromCombination={combo}
                  toCombination={combinations[(index + 1) % combinations.length]}
                  canvasSize={width}
                />
              </AbsoluteFill>
            </Series.Sequence>
          </React.Fragment>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
