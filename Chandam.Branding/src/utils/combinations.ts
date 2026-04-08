/**
 * Generate all unique combinations of 1s and 2s that sum to a target number
 * @param target The target sum
 * @returns Array of combinations, each combination is an array of 1s and 2s
 */
export function generateCombinations(target: number): number[][] {
  const results: number[][] = [];

  function backtrack(remaining: number, current: number[]): void {
    // Base case: if remaining is 0, we found a valid combination
    if (remaining === 0) {
      results.push([...current]);
      return;
    }

    // If remaining is negative, this path is invalid
    if (remaining < 0) {
      return;
    }

    // Try adding a 2 (guru)
    current.push(2);
    backtrack(remaining - 2, current);
    current.pop();

    // Try adding a 1 (laghu)
    current.push(1);
    backtrack(remaining - 1, current);
    current.pop();
  }

  backtrack(target, []);
  return results;
}

/**
 * Get all 13 combinations that sum to 6
 * Natural progression: 2s appear from both ends and converge to center
 */
export function getChandamCombinations(): number[][] {
  return [
    [1, 1, 1, 1, 1, 1],  // 1. Start: all small dots
    [1, 1, 1, 1, 2],     // 2. First 2 appears at end
    [1, 1, 1, 2, 1],     // 3. First 2 moves left
    [1, 1, 2, 1, 1],     // 4. First 2 continues left
    [1, 2, 1, 1, 1],     // 5. First 2 continues left
    [2, 1, 1, 1, 1],     // 6. First 2 reaches start
    [2, 1, 1, 2],        // 7. Second 2 appears at end (symmetric!)
    [2, 1, 2, 1],        // 8. Second 2 moves inward
    [2, 2, 1, 1],        // 9. Both 2s together at start
    [1, 2, 2, 1],        // 10. Both 2s in middle
    [1, 2, 1, 2],        // 11. Both 2s alternating
    [1, 1, 2, 2],        // 12. Both 2s at end
    [2, 2, 2],           // 13. End: all big dots (three 2s)
  ];
}

/**
 * Get combinations for a specific orbit/sum value
 * Reuses existing generateCombinations() logic
 * Combinations are ordered starting with most 2s (largest dots) to most 1s (smallest dots)
 * @param orbitSum The sum value for this orbit
 * @returns Array of combinations that sum to orbitSum
 */
export function getOrbitCombinations(orbitSum: number): number[][] {
  if (orbitSum === 0 || orbitSum === 1) {
    return [[1]]; // Center is just a single static dot
  }
  return generateCombinations(orbitSum);
}

/**
 * Get all combinations from sum 1 to maxSum
 * Used for batch retrieval across multiple orbits
 * @param maxSum Maximum sum value to generate combinations for
 * @returns Array of arrays, where index i contains combinations for sum i
 */
export function getAllOrbitCombinations(maxSum: number): number[][][] {
  return Array.from({ length: maxSum + 1 }, (_, i) =>
    getOrbitCombinations(i)
  );
}
