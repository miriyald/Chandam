// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (mulberry32 algorithm)
// Produces a deterministic sequence from a numeric seed so that "random"
// rule/ruleset choices are reproducible across test runs on the same day.
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic RNG function seeded with `seed`.
 */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Creates an RNG seeded with today's date (YYYYMMDD).
 * All tests that use `dailyRandom()` will pick the same items throughout a
 * single calendar day, making the suite deterministic within a day.
 */
export function dailyRandom(): () => number {
  const d = new Date();
  const seed =
    d.getFullYear() * 10_000 +
    (d.getMonth() + 1) * 100 +
    d.getDate();
  return seededRandom(seed);
}

/**
 * Picks a random element from `arr` using the provided RNG function.
 */
export function pickRandom<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error('pickRandom called with empty array');
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Picks a random 0-based index within `[0, length)` using `rng`.
 */
export function pickRandomIndex(length: number, rng: () => number): number {
  if (length === 0) throw new Error('pickRandomIndex called with length 0');
  return Math.floor(rng() * length);
}
