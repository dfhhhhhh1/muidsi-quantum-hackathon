/**
 * Visibility windows for the four stages of the journey.
 *
 * Each is a trapezoid: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in
 * scroll progress. <Fade> reads these to cross-fade the stage's materials.
 *
 * They live in this plain module, rather than as constants inside each stage
 * component, so that `scripts/verify-path.mjs` can import the real values
 * instead of a hand-copied duplicate that silently drifts out of date.
 */

/**
 * Fade-in starts before zero so the Earth is already at full opacity on the
 * very first frame. The site must load *looking at* the planet, not fade it in.
 * It holds through the pull-back and only clears once the camera has turned
 * away during the swing.
 */
export const EARTH_WINDOW = [-0.05, -0.01, 0.26, 0.36];

/**
 * Comes in as the camera finishes its turnaround and the satellite swings into
 * frame ahead. Holds until the camera is through the hull.
 */
export const SAT_WINDOW = [0.38, 0.46, 0.6, 0.68];

/**
 * Never fades out: the compute bay is the room the chandelier stands in, so it
 * has to still be there at p = 1 or the final shot floats in empty space.
 */
export const INTERIOR_WINDOW = [0.56, 0.64, 1.01, 1.02];

/** Never fades out either. It is the destination. */
export const CHAND_WINDOW = [0.72, 0.8, 1.01, 1.02];
