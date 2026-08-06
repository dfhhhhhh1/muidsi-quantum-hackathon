import * as THREE from 'three';
import { smoothstep } from './fade.js';

/**
 * ============================================================================
 * WORLD LAYOUT
 * ============================================================================
 * The camera always travels toward -Z. Earth sits at POSITIVE Z, behind the
 * departure path, so scrolling reads as leaving the planet rather than diving
 * into it:
 *
 *   z =  +60    Earth (radius 14), where the camera starts, looking back at it
 *   z =  -90    Orbital satellite, revealed ahead as the camera turns around
 *   z = -108 .. -190   Interior compute bay (server racks)
 *   z = -196    Quantum chandelier + HUD
 *
 * The opening shot frames the whole globe, just short of filling the frame. As the camera pulls back the full globe resolves, then the aim point
 * arcs around through +X until the camera is facing its direction of travel
 * and the satellite is ahead of it.
 */
export const LAYOUT = {
  earthZ: 60,
  earthRadius: 14,
  satelliteZ: -90,
  /**
   * The sun. Used for BOTH the visible disc and the scene's key light, so the
   * two can never drift out of agreement (a lit face with the sun visibly in
   * the wrong place is instantly, unfixably wrong-looking).
   *
   * Its azimuth is a three-way compromise, and moving it breaks one of these:
   *  - it has to light the face of the Earth the camera looks at in phase 1
   *  - the terminator wants to fall across the left of the disc, where the
   *    hero text sits, so the type has something dark to read against
   *  - the camera's turnaround has to sweep across it, or the middle of that
   *    pan is empty sky
   * Further round (larger azimuth) brightens the Earth but opens a hole in the
   * pan; nearer, and the planet goes too dark to carry the opening shot.
   */
  sunPos: [486, 99, -158],
  sunRadius: 9,
  // Where racks are distributed. The corridor *shell* runs wider than this
  // (see Interior.jsx) so it meets the satellite hull with no visible gap.
  interiorStartZ: -108,
  interiorEndZ: -190,
  // Sits inside the far end of the corridor, right of the camera's aim.
  chandelierPos: [4.2, 0, -196],
  // The rig is authored at a comfortable scale then shrunk to clear the
  // corridor's floor (y = -3.4) and ceiling (y = 3.6).
  chandelierScale: 0.62,
};

/**
 * Camera keyframes. `p` is scroll progress; `pos` is world position; `look` is
 * the world-space aim point; `roll` banks the camera; `fov` punches in or out.
 *
 * Spacing between keys is deliberately uneven. That is the pacing: a slow
 * drift back from Earth, a banked turn to find the satellite, a fast run at
 * the hull, then a settle in front of the chandelier.
 *
 * IMPORTANT: `look` is interpolated as a point, not a direction. During the
 * turnaround the aim must arc wide through +X so the interpolated target never
 * passes through the camera itself, which would make lookAt degenerate and
 * snap the view. That is why the mid-turn keys sit far out on the X axis.
 */
export const KEYS = [
  // ---- Phase 1: Earth, pulling back ---------------------------------------
  { p: 0.0, pos: [0, 4, 28], look: [0, 0, 60], roll: 0.0, fov: 55 },
  { p: 0.07, pos: [0.4, 4.5, 20], look: [0, 0, 60], roll: 0.0, fov: 54 },
  { p: 0.15, pos: [1, 5, 9], look: [1, -18, 227.8], roll: 0.0, fov: 53 },

  // ---- The turnaround ------------------------------------------------------
  // Two independent channels are moving here:
  //
  //  1. The AIM sweeps right, from +Z (Earth) round through +X to -Z (the
  //     direction of travel), about 172 degrees. It crosses the sun near
  //     p=0.36, which is what stops the middle of the pan being empty sky.
  //  2. The camera POSITION drifts left (-X). Looking down -Z from negative X
  //     puts the station on the RIGHT of frame, clear of the content column
  //     that sits on the left at desktop widths.
  //
  // These look points are generated, not hand-written. Each sits exactly 220
  // units from its camera position, at evenly spaced azimuths. Both details
  // matter: angular velocity is target displacement over distance to target,
  // so a constant radius plus even azimuth spacing is what makes the pan
  // glide instead of whip. Adding keyframes alone does NOT slow a turn down;
  // the total rotation and the scroll budget are what set the rate.
  { p: 0.19, pos: [1.6, 4.9, 0], look: [84, -2.8, 203.9], roll: 0.012, fov: 52 },
  { p: 0.23, pos: [2, 4.7, -8], look: [157.5, 12.4, 147.5], roll: 0.026, fov: 52 },
  { p: 0.27, pos: [2, 4.4, -16], look: [204.9, 27.4, 66], roll: 0.04, fov: 51 },
  { p: 0.31, pos: [1, 4.1, -24], look: [218.3, 38.5, -27.8], roll: 0.05, fov: 50 },
  { p: 0.35, pos: [-2, 3.7, -32], look: [195.3, 45.7, -119.8], roll: 0.045, fov: 50 },
  { p: 0.39, pos: [-6, 3.2, -40], look: [142.6, 33.8, -199.3], roll: 0.03, fov: 49 },
  { p: 0.43, pos: [-12, 2.7, -50], look: [70.3, 14.2, -253.7], roll: 0.015, fov: 48 },
  { p: 0.46, pos: [-15, 2.4, -58], look: [15.6, -5.3, -275.7], roll: 0.005, fov: 48 },

  // ---- Phase 2: Satellite ---------------------------------------------------
  { p: 0.5, pos: [-12, 1.9, -68], look: [6, 0.4, -140], roll: 0.0, fov: 47 },
  // Slow down and draw alongside the hull.
  { p: 0.56, pos: [-7, 1.2, -79], look: [2, 0.2, -150], roll: -0.02, fov: 46 },

  // ---- Phase 3: Through the hull, into the bay ------------------------------
  { p: 0.63, pos: [-1, 0.5, -88], look: [0, 0, -112], roll: 0.0, fov: 50 },
  { p: 0.7, pos: [0.2, 0.1, -106], look: [0, 0, -142], roll: 0.01, fov: 54 },
  { p: 0.78, pos: [0, 0, -130], look: [0.3, 0, -166], roll: 0.0, fov: 56 },
  { p: 0.88, pos: [0.4, 0.1, -168], look: [1.6, 0, -190], roll: -0.01, fov: 54 },

  // ---- Phase 4: Locked on the chandelier ------------------------------------
  { p: 0.95, pos: [0.2, 0.3, -184], look: [3.0, -0.3, -195], roll: 0.0, fov: 50 },
  { p: 1.0, pos: [0.0, 0.35, -187.5], look: [2.9, -0.4, -195.5], roll: 0.0, fov: 48 },
];

// Scratch objects. Allocating inside useFrame would thrash the GC.
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/**
 * Samples the camera path at progress `p`, writing into the supplied vectors.
 * Returns the interpolated roll and fov.
 *
 * Segments are eased with smoothstep so the camera glides between keyframes
 * instead of snapping direction at each one.
 */
export function samplePath(p, outPos, outLook) {
  const t = Math.max(0, Math.min(1, p));

  // Find the bracketing keyframes.
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].p) i++;

  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const span = k1.p - k0.p;
  const localT = span <= 0 ? 0 : (t - k0.p) / span;
  const e = smoothstep(0, 1, Math.max(0, Math.min(1, localT)));

  _a.fromArray(k0.pos);
  _b.fromArray(k1.pos);
  outPos.lerpVectors(_a, _b, e);

  _a.fromArray(k0.look);
  _b.fromArray(k1.look);
  outLook.lerpVectors(_a, _b, e);

  return {
    roll: k0.roll + (k1.roll - k0.roll) * e,
    fov: k0.fov + (k1.fov - k0.fov) * e,
  };
}
