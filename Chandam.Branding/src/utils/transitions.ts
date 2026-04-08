/**
 * Detect if a transition is a merge (two 1s becoming a 2) or split (a 2 becoming two 1s)
 */
export function analyzeTransition(from: number[], to: number[]): {
  type: 'general' | 'merge' | 'split';
  mergeIndices?: [number, number];
  splitIndex?: number;
} {
  // Simple heuristic: if from has more elements than to, it might be a merge
  // if to has more elements than from, it might be a split

  if (from.length > to.length) {
    // Potential merge: look for two adjacent 1s in 'from' that could become a 2 in 'to'
    for (let i = 0; i < from.length - 1; i++) {
      if (from[i] === 1 && from[i + 1] === 1) {
        return { type: 'merge', mergeIndices: [i, i + 1] };
      }
    }
  } else if (to.length > from.length) {
    // Potential split: look for a 2 in 'from' that could become two 1s in 'to'
    for (let i = 0; i < from.length; i++) {
      if (from[i] === 2) {
        return { type: 'split', splitIndex: i };
      }
    }
  }

  return { type: 'general' };
}

/**
 * Calculate position for a merging/splitting animation
 */
export function getMergePosition(
  pos1: number,
  pos2: number,
  progress: number
): number {
  // Move towards center as they merge
  return pos1 + (pos2 - pos1) * progress;
}

export function getSplitPosition(
  centerPos: number,
  targetPos: number,
  progress: number
): number {
  // Move from center to target position
  return centerPos + (targetPos - centerPos) * progress;
}
