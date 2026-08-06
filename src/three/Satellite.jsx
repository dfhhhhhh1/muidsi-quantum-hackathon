import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { makePanelTexture, disposeAll } from './textures.js';
import { LAYOUT } from './path.js';
import { Fade } from './Fade.jsx';
import { SAT_WINDOW } from './windows.js';

/**
 * Phase 2: the orbital platform.
 *
 * Placeholder-grade geometry (boxes, cylinders, a torus) assembled into
 * something that reads as a real satellite at speed. Swap the whole <group>
 * for a loaded GLTF in phase 5; the Fade window and position are all the rest
 * of the scene relies on.
 */


export function Satellite() {
  const spin = useRef(null);
  const beacon = useRef(null);

  const panel = useMemo(() => makePanelTexture(512, 512, '#6f7a8a'), []);
  const arrayTex = useMemo(() => makeSolarTexture(), []);
  useEffect(() => () => disposeAll(panel, arrayTex), [panel, arrayTex]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (spin.current) {
      // Lazy tumble; the camera path is tuned to roughly match this rate as it
      // draws alongside, which sells the "matching rotation" beat.
      spin.current.rotation.z += dt * 0.06;
      spin.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
    }
    if (beacon.current) {
      const t = state.clock.elapsedTime;
      beacon.current.intensity = 2 + Math.sin(t * 4) * 1.8;
    }
  });

  return (
    <Fade window={SAT_WINDOW} position={[0, 0, LAYOUT.satelliteZ]}>
      <group ref={spin}>
        {/* --- Main bus ---------------------------------------------------- */}
        <mesh castShadow>
          <boxGeometry args={[3.2, 3.2, 7]} />
          <meshStandardMaterial
            map={panel}
            color="#cfd6df"
            metalness={0.92}
            roughness={0.32}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Gold thermal blanket wrap, a nod to the chandelier's palette */}
        <mesh position={[0, 0, 1.2]}>
          <boxGeometry args={[3.32, 3.32, 1.6]} />
          <meshStandardMaterial
            color="#E8A33D"
            metalness={1}
            roughness={0.22}
            emissive="#7a4d09"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* --- Solar arrays ------------------------------------------------ */}
        {[-1, 1].map((dir) => (
          <group key={dir} position={[dir * 6.6, 0, 0]}>
            {/* Boom */}
            <mesh position={[-dir * 2.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 3.6, 12]} />
              <meshStandardMaterial color="#9aa4b2" metalness={0.9} roughness={0.35} />
            </mesh>
            {/* Panel */}
            <mesh>
              <boxGeometry args={[8.4, 0.12, 3.4]} />
              <meshStandardMaterial
                map={arrayTex}
                color="#2b4a86"
                metalness={0.75}
                roughness={0.25}
                emissive="#0b1e3f"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}

        {/* --- Dish ---------------------------------------------------------- */}
        <group position={[0, 2.2, -1.6]} rotation={[-0.5, 0, 0]}>
          <mesh>
            <sphereGeometry args={[1.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
            <meshStandardMaterial
              color="#e8ecf2"
              metalness={0.85}
              roughness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />
            <meshStandardMaterial color="#8d97a5" metalness={0.9} roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* --- Thruster ring at the rear ------------------------------------ */}
        <group position={[0, 0, 3.7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.22, 12, 40]} />
            <meshStandardMaterial color="#b9c2cf" metalness={0.95} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.35]}>
            <cylinderGeometry args={[1.05, 1.3, 0.7, 28, 1, true]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={2.2}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* --- Greebles: sensor pods along the hull ------------------------- */}
        {[
          [1.75, 0.7, -2.2],
          [-1.75, -0.6, 0.9],
          [0.7, 1.75, 2.4],
          [-0.5, -1.75, -1.4],
        ].map((p, i) => (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.5, 0.5, 0.9]} />
            <meshStandardMaterial color="#7d8794" metalness={0.9} roughness={0.4} />
          </mesh>
        ))}

        {/* Docking port the camera flies into, ringed in cyan */}
        <group position={[0, 0, -3.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.15, 0.1, 10, 32]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <circleGeometry args={[1.1, 32]} />
            <meshStandardMaterial
              color="#020508"
              emissive="#062a33"
              emissiveIntensity={1}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        <pointLight ref={beacon} position={[0, 2.2, -3.8]} color="#22D3EE" distance={22} />
      </group>
    </Fade>
  );
}

/** Solar-cell grid drawn to a canvas. */
function makeSolarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#16305e';
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#1d3f7a';
  for (let x = 0; x < 256; x += 16) {
    for (let y = 0; y < 128; y += 16) {
      ctx.fillRect(x + 1, y + 1, 14, 14);
    }
  }

  ctx.strokeStyle = 'rgba(140, 180, 255, 0.28)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 256; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, 128);
    ctx.stroke();
  }
  for (let y = 0; y <= 128; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(256, y + 0.5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
