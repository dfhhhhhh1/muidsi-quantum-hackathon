import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { scrollState } from '../scroll/scrollState.js';
import { samplePath } from './path.js';
import { damp, smoothstep } from './fade.js';

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _lookSmoothed = new THREE.Vector3();

/**
 * Drives the camera along the keyframed path from scroll progress.
 *
 * Two layers of smoothing:
 *  1. `scrollState.smoothed` damps the raw scroll value, so flick-scrolling
 *     produces a glide rather than a jump. Every 3D stage reads this too, which
 *     keeps fades in lockstep with camera motion.
 *  2. The aim point is damped independently and more slowly than position,
 *     which reads as a camera operator turning to follow the subject.
 */
export function CameraRig({ reducedMotion = false }) {
  const { camera } = useThree();
  const initialized = useRef(false);
  const driftSeed = useRef(Math.random() * 1000);

  useFrame((state, rawDelta) => {
    // Clamp delta so a backgrounded tab doesn't teleport the camera on return.
    const dt = Math.min(rawDelta, 1 / 20);

    // ---- 1. Damp scroll progress ------------------------------------------
    const lambda = reducedMotion ? 30 : 5.5;
    scrollState.smoothed = initialized.current
      ? damp(scrollState.smoothed, scrollState.progress, lambda, dt)
      : scrollState.progress;

    const p = scrollState.smoothed;

    // ---- 2. Sample the path ------------------------------------------------
    const { roll, fov } = samplePath(p, _pos, _look);

    // ---- 3. Idle drift -----------------------------------------------------
    // A slow figure-eight keeps the shot alive when the user stops scrolling.
    // It tapers off in the final phase so the chandelier shot locks steady.
    if (!reducedMotion) {
      const t = state.clock.elapsedTime + driftSeed.current;
      const settle = 1 - smoothstep(0.9, 1.0, p);
      const amp = 0.5 * settle;
      _pos.x += Math.sin(t * 0.31) * amp;
      _pos.y += Math.sin(t * 0.47) * amp * 0.6;
    }

    // ---- 4. Apply ----------------------------------------------------------
    if (!initialized.current) {
      camera.position.copy(_pos);
      _lookSmoothed.copy(_look);
      initialized.current = true;
    } else {
      camera.position.lerp(_pos, 1 - Math.exp(-9 * dt));
      _lookSmoothed.lerp(_look, 1 - Math.exp(-5 * dt));
    }

    camera.up.set(0, 1, 0);
    camera.lookAt(_lookSmoothed);
    if (roll !== 0) camera.rotateZ(roll);

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = damp(camera.fov, fov, 4, dt);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
