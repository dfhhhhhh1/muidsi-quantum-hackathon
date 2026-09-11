/**
 * A module-level mutable store for scroll progress.
 *
 * Deliberately NOT React state: the camera reads this every frame inside
 * useFrame, and pushing it through React would re-render the whole tree 60x
 * a second. Components that genuinely need to re-render (the HUD terminal
 * switching on, the progress bar) subscribe explicitly and throttle themselves.
 */
export const scrollState = {
  /** Raw ScrollTrigger progress, 0 -> 1. Matches the scrollbar exactly. */
  progress: 0,
  /**
   * `progress` remapped by the pacing curve in ./pacing.js, so the camera
   * slows over content and speeds up between sections. This, not `progress`,
   * is where the camera is being asked to go.
   */
  eased: 0,
  /** Frame-damped `eased`. This is what the camera and 3D stages should read. */
  smoothed: 0,
  /** 0 = in a gap between sections, 1 = a section fully owns the viewport. */
  dwell: 0,
  /** Signed scroll velocity, useful for motion-reactive effects. */
  velocity: 0,
};

const listeners = new Set();

/** Subscribe to coarse phase changes. Returns an unsubscribe function. */
export function subscribeScroll(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitScroll() {
  for (const fn of listeners) fn(scrollState);
}

/** Named scroll windows for the four narrative phases. */
export const PHASES = {
  earth: [0.0, 0.3],
  satellite: [0.3, 0.55],
  interior: [0.55, 0.78],
  chandelier: [0.78, 1.0],
};

export function phaseAt(p) {
  if (p < PHASES.earth[1]) return 'earth';
  if (p < PHASES.satellite[1]) return 'satellite';
  if (p < PHASES.interior[1]) return 'interior';
  return 'chandelier';
}
