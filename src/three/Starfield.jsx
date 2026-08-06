import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { makeGalaxyTexture } from './textures.js';

/**
 * A deep-space backdrop that follows the camera, so stars never get "passed"
 * during the ~210 units of forward travel. Two layers: fine white points plus
 * a handful of larger, warmer stars for depth.
 */
export function Starfield({ count = 3800, radius = 260 }) {
  const group = useRef(null);
  const material = useRef(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Uniform distribution on a sphere shell.
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = radius * (0.65 + Math.random() * 0.35);
      const s = Math.sqrt(1 - u * u);

      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * s * Math.sin(theta);
      positions[i * 3 + 2] = r * u;

      // Mostly cool white, occasionally gold or ice blue.
      const roll = Math.random();
      if (roll > 0.94) c.setHSL(0.11, 0.7, 0.72);
      else if (roll > 0.86) c.setHSL(0.55, 0.55, 0.78);
      else c.setHSL(0.6, 0.08, 0.72 + Math.random() * 0.28);

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() > 0.97 ? 2.4 : 0.6 + Math.random() * 0.9;
    }
    return { positions, colors, sizes };
  }, [count, radius]);

  // Round, soft point sprite, because square points read as cheap.
  const sprite = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const galaxy = useMemo(() => makeGalaxyTexture(), []);

  useEffect(() => {
    return () => {
      sprite.dispose();
      galaxy.dispose();
    };
  }, [sprite, galaxy]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Lock to the camera so the field reads as infinitely distant.
    group.current.position.copy(state.camera.position);
    group.current.rotation.y += Math.min(delta, 1 / 20) * 0.004;
  });

  return (
    <group ref={group}>
      {/* Milky Way, on the inside of a sphere further out than the stars.
          Rendered first with depth writing off so it sits behind everything. */}
      <mesh renderOrder={-10} rotation={[0.5, 0.9, 0.3]}>
        <sphereGeometry args={[radius * 1.7, 32, 32]} />
        <meshBasicMaterial
          map={galaxy}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          ref={material}
          size={1.5}
          sizeAttenuation
          vertexColors
          map={sprite}
          alphaMap={sprite}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
