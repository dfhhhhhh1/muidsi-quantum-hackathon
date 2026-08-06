import React, { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { scrollState } from '../scroll/scrollState.js';
import { envelope } from './fade.js';

/**
 * Wraps a stage of the journey and cross-fades every material beneath it based
 * on scroll progress. Keeps stage components ignorant of the scroll system.
 *
 * `window` is a trapezoid: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
 *
 * Material state is handled carefully here, because getting it wrong causes
 * flickering that is very hard to trace back:
 *
 *  - Authored `transparent` / `depthWrite` / `opacity` are recorded once and
 *    restored exactly whenever the stage is fully visible. A stage at rest is
 *    therefore rendered exactly as its component authored it, with no leftover
 *    transparency forced on by the fade system.
 *  - While mid-fade, depth writing is disabled outright. Toggling depthWrite
 *    per frame against a damped opacity makes geometry pop in and out as the
 *    value jitters across the threshold.
 *  - The opaque/transparent switch only touches materials on the frame the
 *    stage crosses the threshold, so `needsUpdate` (a shader recompile) fires
 *    twice per stage rather than every frame.
 */
export function Fade({ window: win, children, hideBelow = 0.004, ...props }) {
  const group = useRef(null);
  const settled = useRef(null); // null = unknown, true = at rest, false = fading

  // Record each material's authored state once so we can restore it exactly.
  useLayoutEffect(() => {
    forEachMaterial(group.current, (m) => {
      if (m.userData.fadeBase === undefined) {
        m.userData.fadeBase = {
          opacity: m.opacity ?? 1,
          transparent: m.transparent ?? false,
          depthWrite: m.depthWrite ?? true,
        };
      }
    });
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const o = envelope(scrollState.smoothed, win);

    if (o <= hideBelow) {
      // Cheap early-out: skip the traverse entirely while off screen.
      if (g.visible) g.visible = false;
      return;
    }
    g.visible = true;

    const isSettled = o >= 0.999;

    // --- State transition: only touch material flags when settledness flips ---
    if (isSettled !== settled.current) {
      settled.current = isSettled;
      forEachMaterial(g, (m) => {
        const base = m.userData.fadeBase;
        if (!base) return;
        if (isSettled) {
          m.opacity = base.opacity;
          m.depthWrite = base.depthWrite;
          if (m.transparent !== base.transparent) {
            m.transparent = base.transparent;
            m.needsUpdate = true;
          }
        } else {
          m.depthWrite = false;
          if (!m.transparent) {
            m.transparent = true;
            m.needsUpdate = true;
          }
        }
      });
    }

    // --- Per-frame: opacity only, and only while actually fading ------------
    if (isSettled) return;

    forEachMaterial(g, (m) => {
      const base = m.userData.fadeBase;
      if (!base) return;
      // ShaderMaterials carry their own uOpacity uniform instead.
      if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = base.opacity * o;
      else m.opacity = base.opacity * o;
    });
  });

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  );
}

/** Visits every material under `root`, handling multi-material meshes. */
function forEachMaterial(root, fn) {
  if (!root) return;
  root.traverse((child) => {
    const mat = child.material;
    if (!mat) return;
    if (Array.isArray(mat)) mat.forEach(fn);
    else fn(mat);
  });
}
