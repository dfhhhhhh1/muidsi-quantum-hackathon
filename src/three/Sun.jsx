import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LAYOUT } from './path.js';
import { scrollState } from '../scroll/scrollState.js';
import { envelope } from './fade.js';

/**
 * The sun: a small bright disc inside a large soft halo.
 *
 * It exists for two reasons. It is the light source the whole scene is lit by
 * (Scene.jsx points the key light from LAYOUT.sunPos, so the two agree), and
 * it gives the camera's turnaround something to sweep across. Without it, the
 * pan from Earth to satellite crosses several seconds of empty starfield.
 *
 * Not wrapped in <Fade>: the halo is a sprite whose opacity is driven directly,
 * and sprites do not want their material flags rewritten underneath them.
 */
const SUN_WINDOW = [-0.05, -0.01, 0.58, 0.66];

export function Sun() {
  const group = useRef(null);
  const coreMat = useRef(null);
  const haloMat = useRef(null);
  const flareMat = useRef(null);

  const glow = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glow.dispose(), [glow]);

  useFrame(() => {
    const o = envelope(scrollState.smoothed, SUN_WINDOW);
    const g = group.current;
    if (!g) return;
    g.visible = o > 0.004;
    if (!g.visible) return;
    if (coreMat.current) coreMat.current.opacity = o;
    if (haloMat.current) haloMat.current.opacity = o * 0.85;
    if (flareMat.current) flareMat.current.opacity = o * 0.35;
  });

  const R = LAYOUT.sunRadius;

  return (
    <group ref={group} position={LAYOUT.sunPos}>
      {/* Core disc. toneMapped={false} keeps it clipping-white so bloom grabs it. */}
      <mesh>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#FFF6E2"
          toneMapped={false}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Tight halo */}
      <sprite scale={[R * 9, R * 9, 1]}>
        <spriteMaterial
          ref={haloMat}
          map={glow}
          color="#FFD9A0"
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      {/* Wide, faint outer bloom */}
      <sprite scale={[R * 26, R * 26, 1]}>
        <spriteMaterial
          ref={flareMat}
          map={glow}
          color="#FFB765"
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

/** Soft radial falloff used by both halo sprites. */
function makeGlowTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.08, 'rgba(255,246,226,0.85)');
  g.addColorStop(0.22, 'rgba(255,200,130,0.32)');
  g.addColorStop(0.5, 'rgba(255,160,80,0.08)');
  g.addColorStop(1.0, 'rgba(255,140,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
