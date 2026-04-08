export type DotAction =
  | { type: 'stay'; value: number; position: number }
  | { type: 'split'; fromPosition: number; toPositions: [number, number] }
  | { type: 'merge'; fromPositions: [number, number]; toPosition: number }
  | { type: 'fadeOut'; position: number }
  | { type: 'fadeIn'; position: number; value: number };

/**
 * Calculate animation actions needed to transition from one combination to another
 * This is a simplified version that will fade out the old and fade in the new
 */
export function calculateTransition(
  from: number[],
  to: number[]
): { fadeOut: number[]; fadeIn: number[] } {
  return {
    fadeOut: from,
    fadeIn: to,
  };
}

/**
 * Calculate the total width needed for a combination
 * Small dot (1) = 1 unit, Large dot (2) = 2 units, plus spacing
 */
export function calculateCombinationWidth(
  combination: number[],
  smallSize: number,
  largeSize: number,
  spacing: number
): number {
  const totalSize = combination.reduce((sum, val) => {
    return sum + (val === 1 ? smallSize : largeSize);
  }, 0);
  const totalSpacing = (combination.length - 1) * spacing;
  return totalSize + totalSpacing;
}

/**
 * Calculate x positions for each dot in a combination, centered
 */
export function calculateDotPositions(
  combination: number[],
  smallSize: number,
  largeSize: number,
  spacing: number,
  canvasWidth: number
): number[] {
  const totalWidth = calculateCombinationWidth(
    combination,
    smallSize,
    largeSize,
    spacing
  );
  const startX = (canvasWidth - totalWidth) / 2;

  const positions: number[] = [];
  let currentX = startX;

  for (const value of combination) {
    const size = value === 1 ? smallSize : largeSize;
    positions.push(currentX + size / 2); // Center of the dot
    currentX += size + spacing;
  }

  return positions;
}

/**
 * Position with angle for orbital placement
 */
export interface OrbitPosition {
  x: number;
  y: number;
  angle: number; // For tracking during transitions
}

/**
 * Calculate evenly-spaced positions on a circular orbit
 * Dots are distributed evenly by angle around the orbit
 * @param combination - Array of 1s and 2s
 * @param orbitRadius - Distance from center
 * @param centerX - Canvas center X
 * @param centerY - Canvas center Y
 * @returns Array of {x, y, angle} positions
 */
export function calculateOrbitPositions(
  combination: number[],
  orbitRadius: number,
  centerX: number,
  centerY: number
): OrbitPosition[] {
  const numDots = combination.length;
  const angleStep = (2 * Math.PI) / numDots;
  const startAngle = -Math.PI / 2; // Start at top (12 o'clock)

  return combination.map((_, index) => {
    const angle = startAngle + angleStep * index;
    return {
      x: centerX + orbitRadius * Math.cos(angle),
      y: centerY + orbitRadius * Math.sin(angle),
      angle: angle,
    };
  });
}

/**
 * Calculate radius for a given orbit number
 * Spacing ensures large dots (28px diameter) don't overlap between orbits
 * With 20px spacing: orbit 1 at 20px, orbit 6 at 120px (fits in 256x256 canvas)
 * @param orbitNumber - Orbit index (1 = innermost, 6 = outermost)
 * @returns Radius in pixels from center
 */
export function getOrbitRadius(orbitNumber: number): number {
  const ORBIT_SPACING = 20; // Pixels between adjacent orbit centers
  return orbitNumber * ORBIT_SPACING;
}
