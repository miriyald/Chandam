import React from 'react';
import { AbsoluteFill, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { getChandamCombinations } from './utils/combinations';
import { calculateDotPositions } from './utils/animations';

const DOT_SIZE = 8; // Small dot for 1 (laghu)
const LINE_WIDTH = 20; // Horizontal line for 2 (guru)
const LINE_HEIGHT = 4;
const SPACING = 2; // Minimal spacing - consistent with other variants
const LAGHU_COLOR = '#3B82F6'; // Blue for laghu (1)
const GURU_COLOR = '#F59E0B'; // Amber/orange for guru (2)

interface DotProps {
  x: number;
  y: number;
  opacity?: number;
}

function TeluguDot({ x, y, opacity = 1 }: DotProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - DOT_SIZE / 2,
        top: y - DOT_SIZE / 2,
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: '50%',
        backgroundColor: LAGHU_COLOR,
        opacity,
      }}
    />
  );
}

interface LineProps {
  x: number;
  y: number;
  opacity?: number;
}

function TeluguLine({ x, y, opacity = 1 }: LineProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - LINE_WIDTH / 2,
        top: y - LINE_HEIGHT / 2,
        width: LINE_WIDTH,
        height: LINE_HEIGHT,
        borderRadius: LINE_WIDTH / 2,
        backgroundColor: GURU_COLOR,
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

  // For Telugu style: small dot (8px) and large line (20px width)
  const positions = calculateDotPositions(
    combination,
    DOT_SIZE,
    LINE_WIDTH,
    SPACING,
    canvasSize
  );

  return (
    <>
      {combination.map((value, index) => {
        if (value === 1) {
          return (
            <TeluguDot
              key={index}
              x={positions[index]}
              y={centerY}
              opacity={opacity}
            />
          );
        } else {
          return (
            <TeluguLine
              key={index}
              x={positions[index]}
              y={centerY}
              opacity={opacity}
            />
          );
        }
      })}
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
    DOT_SIZE,
    LINE_WIDTH,
    SPACING,
    canvasSize
  );

  const toPositions = calculateDotPositions(
    toCombination,
    DOT_SIZE,
    LINE_WIDTH,
    SPACING,
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

  const renderMorphingShapes = () => {
    const shapes = [];
    const mapping = createMapping();

    // Render based on mapping - each source splits/merges into its targets
    for (const { fromIndex, toIndices } of mapping) {
      const fromValue = fromCombination[fromIndex];
      const fromPos = fromPositions[fromIndex];

      if (toIndices.length === 0) {
        // Merging: this shape fades out as it moves toward the merge target
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

        const opacity = interpolate(progress, [0, 1], [1, 0], {
          extrapolateRight: 'clamp',
        });

        if (fromValue === 1) {
          shapes.push(
            <TeluguDot
              key={`merge-${fromIndex}`}
              x={x}
              y={centerY}
              opacity={opacity}
            />
          );
        } else {
          shapes.push(
            <TeluguLine
              key={`merge-${fromIndex}`}
              x={x}
              y={centerY}
              opacity={opacity}
            />
          );
        }
      } else if (toIndices.length === 1) {
        // 1-to-1 morphing
        const toIdx = toIndices[0];
        const toValue = toCombination[toIdx];
        const toPos = toPositions[toIdx];

        const x = interpolate(progress, [0, 1], [fromPos, toPos], {
          extrapolateRight: 'clamp',
        });

        if (fromValue === toValue) {
          // Same type, just moving
          if (fromValue === 1) {
            shapes.push(
              <TeluguDot
                key={`move-${fromIndex}`}
                x={x}
                y={centerY}
                opacity={1}
              />
            );
          } else {
            shapes.push(
              <TeluguLine
                key={`move-${fromIndex}`}
                x={x}
                y={centerY}
                opacity={1}
              />
            );
          }
        } else {
          // Morphing between dot and line
          const fromOpacity = interpolate(progress, [0, 0.5], [1, 0], {
            extrapolateRight: 'clamp',
          });
          const toOpacity = interpolate(progress, [0.5, 1], [0, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          });

          if (fromValue === 1) {
            // Dot → Line
            shapes.push(
              <TeluguDot
                key={`morph-from-${fromIndex}`}
                x={x}
                y={centerY}
                opacity={fromOpacity}
              />,
              <TeluguLine
                key={`morph-to-${toIdx}`}
                x={x}
                y={centerY}
                opacity={toOpacity}
              />
            );
          } else {
            // Line → Dot
            shapes.push(
              <TeluguLine
                key={`morph-from-${fromIndex}`}
                x={x}
                y={centerY}
                opacity={fromOpacity}
              />,
              <TeluguDot
                key={`morph-to-${toIdx}`}
                x={x}
                y={centerY}
                opacity={toOpacity}
              />
            );
          }
        }
      } else {
        // Splitting: one source becomes multiple targets
        for (const toIdx of toIndices) {
          const toValue = toCombination[toIdx];
          const toPos = toPositions[toIdx];

          // Start from source position, move to target position
          const x = interpolate(progress, [0, 1], [fromPos, toPos], {
            extrapolateRight: 'clamp',
          });

          // Fade in during split
          const opacity = interpolate(progress, [0, 1], [0.5, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          });

          if (fromValue !== toValue) {
            // Shape transition during split (e.g., Line → Dot)
            const fromOpacity = interpolate(progress, [0, 0.5], [1, 0], {
              extrapolateRight: 'clamp',
            }) * opacity;
            const toOpacity = interpolate(progress, [0.5, 1], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            }) * opacity;

            if (fromValue === 1) {
              // Dot splitting (shouldn't happen but handle it)
              shapes.push(
                <TeluguDot
                  key={`split-from-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={fromOpacity}
                />,
                <TeluguLine
                  key={`split-to-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={toOpacity}
                />
              );
            } else {
              // Line → Dot (line splitting into dots)
              shapes.push(
                <TeluguLine
                  key={`split-from-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={fromOpacity}
                />,
                <TeluguDot
                  key={`split-to-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={toOpacity}
                />
              );
            }
          } else {
            // Same type (line splits into dots, or dots stay as dots)
            if (toValue === 1) {
              shapes.push(
                <TeluguDot
                  key={`split-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={opacity}
                />
              );
            } else {
              shapes.push(
                <TeluguLine
                  key={`split-${fromIndex}-${toIdx}`}
                  x={x}
                  y={centerY}
                  opacity={opacity}
                />
              );
            }
          }
        }
      }
    }

    return shapes;
  };

  return <>{renderMorphingShapes()}</>;
}

export const ChandamIconTelugu: React.FC = () => {
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
