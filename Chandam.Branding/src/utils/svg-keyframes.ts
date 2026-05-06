import { getChandamCombinations } from './combinations';
import { calculateDotPositions } from './animations';

export interface ShapeConfig {
  variant: 'circles' | 'squares' | 'telugu';
  laghu: { width: number; height: number; type: 'circle' | 'rect'; rx?: number };
  guru: { width: number; height: number; type: 'circle' | 'rect'; rx?: number };
  spacing: number;
  laghuColor: string;
  guruColor: string;
}

export interface ActorState {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rx?: number;
}

export interface KeyframePoint {
  percent: number;
  actors: ActorState[];
}

const CANVAS_SIZE = 128;
const CENTER_Y = 64;
const HOLD_DURATION = 1.5;
const TRANSITION_DURATION = 0.5;
const TOTAL_DURATION = 26;
const NUM_ACTORS = 6; // Max dots visible at once is 6

function springValue(t: number): number {
  const damping = 20, mass = 1, stiffness = 60;
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const sqrtTerm = Math.sqrt(zeta * zeta - 1);
  const s1 = -omega0 * (zeta + sqrtTerm);
  const s2 = -omega0 * (zeta - sqrtTerm);
  const A = s2 / (s2 - s1);
  const B = -s1 / (s2 - s1);
  return 1 - A * Math.exp(s1 * t) - B * Math.exp(s2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getShape(value: number, config: ShapeConfig) {
  return value === 1
    ? { width: config.laghu.width, height: config.laghu.height, color: config.laghuColor, rx: config.laghu.rx }
    : { width: config.guru.width, height: config.guru.height, color: config.guruColor, rx: config.guru.rx };
}

function getPositions(combination: number[], config: ShapeConfig): number[] {
  return calculateDotPositions(combination, config.laghu.width, config.guru.width, config.spacing, CANVAS_SIZE);
}

function hidden(): ActorState {
  return { x: CANVAS_SIZE / 2, y: CENTER_Y, width: 0, height: 0, color: '#3B82F6', opacity: 0 };
}

/**
 * Simplified approach: Use 6 actors that map directly to combination elements.
 * During transitions, use crossfade of ENTIRE states rather than per-element morphing.
 *
 * Actually, let's implement the proper morphing but with a simple cross-dissolve
 * for the color changes. Each actor smoothly moves from its "from" position to its
 * "to" position. When an element disappears (merge), it fades out. When one appears
 * (split), it fades in.
 *
 * The mapping tells us: from-element i → to-element(s). We traverse the mapping
 * and assign each from-element to actor[fromIndex]. During transitions, that actor
 * moves toward its target. If it has no target (merge), it fades out. If one from-element
 * maps to multiple targets, actor[fromIndex] goes to the FIRST target, and the additional
 * targets fade in at their positions.
 *
 * For the NEXT hold, actors are reassigned to toCombo positions. The transition's LAST
 * frame must match this reassignment. We handle this by computing the "to-hold" state
 * separately and using that as the final keyframe.
 */

function createMapping(from: number[], to: number[]): Array<{ fromIndex: number; toIndices: number[] }> {
  const mapping: Array<{ fromIndex: number; toIndices: number[] }> = [];
  let fromCumSum = 0, toCumSum = 0, fromIdx = 0, toIdx = 0;
  while (fromIdx < from.length) {
    fromCumSum += from[fromIdx];
    const toIndices: number[] = [];
    while (toIdx < to.length && toCumSum < fromCumSum) {
      toIndices.push(toIdx);
      toCumSum += to[toIdx];
      toIdx++;
    }
    mapping.push({ fromIndex: fromIdx, toIndices });
    fromIdx++;
  }
  return mapping;
}

/**
 * Compute actor states for a hold (static display of one combination).
 * Actor i = combination element i. Unused actors are hidden.
 */
function computeHold(combo: number[], config: ShapeConfig): ActorState[] {
  const positions = getPositions(combo, config);
  const actors: ActorState[] = [];
  for (let i = 0; i < NUM_ACTORS; i++) {
    if (i < combo.length) {
      const shape = getShape(combo[i], config);
      actors.push({ x: positions[i], y: CENTER_Y, width: shape.width, height: shape.height, color: shape.color, opacity: 1, rx: shape.rx });
    } else {
      actors.push(hidden());
    }
  }
  return actors;
}

/**
 * Compute actor states for a mid-transition frame.
 * Uses a two-layer approach:
 * Layer 1 (actors 0-5): The FROM combination elements, each animating toward their target
 * Layer 2 is NOT used — instead, color crossfade happens within a single actor by
 * splitting the transition into two halves: first half shows old color fading, second shows new.
 *
 * Actually simplest approach: skip color crossfade entirely, just interpolate position/size
 * and switch color at the midpoint. This is visually acceptable and avoids needing 12 actors.
 */
function computeTransition(
  fromCombo: number[],
  toCombo: number[],
  progress: number,
  config: ShapeConfig
): ActorState[] {
  const fromPositions = getPositions(fromCombo, config);
  const toPositions = getPositions(toCombo, config);
  const mapping = createMapping(fromCombo, toCombo);

  const actors: ActorState[] = Array.from({ length: NUM_ACTORS }, () => hidden());

  // Build reverse mapping: which toIndex maps to which actor slot
  // Actor slot = fromIndex (preserves identity with the preceding hold)
  let actorIdx = 0;

  for (const { fromIndex, toIndices } of mapping) {
    const fromShape = getShape(fromCombo[fromIndex], config);
    const fromPos = fromPositions[fromIndex];

    if (toIndices.length === 0) {
      // Merge: this element fades out
      let targetPos = fromPos;
      for (let fi = fromIndex - 1; fi >= 0; fi--) {
        const prev = mapping[fi];
        if (prev.toIndices.length > 0) {
          targetPos = toPositions[prev.toIndices[prev.toIndices.length - 1]];
          break;
        }
      }

      actors[actorIdx] = {
        x: lerp(fromPos, targetPos, progress),
        y: CENTER_Y,
        width: lerp(fromShape.width, fromShape.width * 0.5, progress),
        height: lerp(fromShape.height, fromShape.height * 0.5, progress),
        color: fromShape.color,
        opacity: lerp(1, 0, progress),
        rx: fromShape.rx,
      };
      actorIdx++;
    } else if (toIndices.length === 1) {
      // 1-to-1: move, resize, color switch at midpoint
      const toIdx = toIndices[0];
      const toShape = getShape(toCombo[toIdx], config);
      const toPos = toPositions[toIdx];

      const x = lerp(fromPos, toPos, progress);
      const w = lerp(fromShape.width, toShape.width, progress);
      const h = lerp(fromShape.height, toShape.height, progress);
      // Color: blend by switching at progress=0.5 with opacity dip
      const color = progress < 0.5 ? fromShape.color : toShape.color;
      const colorTransitionDip = (fromShape.color !== toShape.color)
        ? 1 - 0.3 * Math.sin(progress * Math.PI) // Slight opacity dip during color change
        : 1;

      actors[actorIdx] = { x, y: CENTER_Y, width: w, height: h, color, opacity: colorTransitionDip, rx: progress < 0.5 ? fromShape.rx : toShape.rx };
      actorIdx++;
    } else {
      // Split: first target takes this slot, rest are new elements fading in
      const firstToIdx = toIndices[0];
      const firstToShape = getShape(toCombo[firstToIdx], config);
      const firstToPos = toPositions[firstToIdx];

      const x = lerp(fromPos, firstToPos, progress);
      const w = lerp(fromShape.width, firstToShape.width, progress);
      const h = lerp(fromShape.height, firstToShape.height, progress);
      const color = progress < 0.5 ? fromShape.color : firstToShape.color;
      const colorDip = (fromShape.color !== firstToShape.color)
        ? 1 - 0.3 * Math.sin(progress * Math.PI)
        : 1;

      actors[actorIdx] = { x, y: CENTER_Y, width: w, height: h, color, opacity: colorDip, rx: progress < 0.5 ? fromShape.rx : firstToShape.rx };
      actorIdx++;

      // Additional split targets fade in
      for (let ti = 1; ti < toIndices.length; ti++) {
        const toIdx = toIndices[ti];
        const toShape = getShape(toCombo[toIdx], config);
        const toPos = toPositions[toIdx];

        const sx = lerp(fromPos, toPos, progress);
        const sw = lerp(fromShape.width, toShape.width, progress);
        const sh = lerp(fromShape.height, toShape.height, progress);
        const sColor = progress < 0.5 ? fromShape.color : toShape.color;

        if (actorIdx < NUM_ACTORS) {
          actors[actorIdx] = { x: sx, y: CENTER_Y, width: sw, height: sh, color: sColor, opacity: progress, rx: progress < 0.5 ? fromShape.rx : toShape.rx };
          actorIdx++;
        }
      }
    }
  }

  return actors;
}

export function computeKeyframes(config: ShapeConfig): KeyframePoint[] {
  const combinations = getChandamCombinations();
  const keyframes: KeyframePoint[] = [];
  const numCombos = combinations.length;
  const springSamples = 5;

  for (let i = 0; i < numCombos; i++) {
    const holdStartTime = i * (HOLD_DURATION + TRANSITION_DURATION);
    const holdEndTime = holdStartTime + HOLD_DURATION;
    const nextCombo = combinations[(i + 1) % numCombos];

    // Hold: two keyframes (start and end) with same state
    const holdPercent1 = (holdStartTime / TOTAL_DURATION) * 100;
    const holdPercent2 = (holdEndTime / TOTAL_DURATION) * 100;
    const holdState = computeHold(combinations[i], config);

    keyframes.push({ percent: holdPercent1, actors: holdState });
    keyframes.push({ percent: holdPercent2, actors: holdState });

    // Transition: intermediate samples using spring easing
    for (let s = 1; s <= springSamples; s++) {
      const fraction = s / springSamples;
      const sampleTime = holdEndTime + fraction * TRANSITION_DURATION;
      const samplePercent = (sampleTime / TOTAL_DURATION) * 100;

      if (s === springSamples) {
        // Final frame must exactly match next hold for seamless boundary
        const nextHold = computeHold(nextCombo, config);
        keyframes.push({ percent: samplePercent, actors: nextHold });
      } else {
        const progress = clamp(springValue(fraction * TRANSITION_DURATION), 0, 1);
        const transState = computeTransition(combinations[i], nextCombo, progress, config);
        keyframes.push({ percent: samplePercent, actors: transState });
      }
    }
  }

  // Remove duplicate percentage entries (keep the last one at each percent)
  const deduped: KeyframePoint[] = [];
  for (let i = 0; i < keyframes.length; i++) {
    if (i < keyframes.length - 1 && Math.abs(keyframes[i].percent - keyframes[i + 1].percent) < 0.001) {
      continue;
    }
    deduped.push(keyframes[i]);
  }

  return deduped;
}

export const CIRCLES_CONFIG: ShapeConfig = {
  variant: 'circles',
  laghu: { width: 14, height: 14, type: 'circle' },
  guru: { width: 28, height: 28, type: 'circle' },
  spacing: 2,
  laghuColor: '#3B82F6',
  guruColor: '#F59E0B',
};

export const SQUARES_CONFIG: ShapeConfig = {
  variant: 'squares',
  laghu: { width: 14, height: 14, type: 'rect', rx: 4 },
  guru: { width: 28, height: 28, type: 'rect', rx: 4 },
  spacing: 2,
  laghuColor: '#3B82F6',
  guruColor: '#F59E0B',
};

export const TELUGU_CONFIG: ShapeConfig = {
  variant: 'telugu',
  laghu: { width: 12, height: 12, type: 'circle' },
  guru: { width: 28, height: 6, type: 'rect', rx: 3 },
  spacing: 2,
  laghuColor: '#3B82F6',
  guruColor: '#F59E0B',
};
