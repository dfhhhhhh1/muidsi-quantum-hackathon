export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smoothstep = (a, b, x) => {
  if (a === b) return x < a ? 0 : 1;
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Trapezoidal visibility envelope.
 * `[a, b, c, d]` -> ramps 0->1 across a..b, holds at 1, ramps 1->0 across c..d.
 */
export const envelope = (p, [a, b, c, d]) => smoothstep(a, b, p) * (1 - smoothstep(c, d, p));

/** Frame-rate independent exponential damping (same curve as THREE.MathUtils.damp). */
export const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Maps p from [a,b] onto [0,1], clamped. */
export const range = (p, a, b) => clamp01((p - a) / (b - a));
