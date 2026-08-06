import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { makePanelTexture, makeRackFaceTexture, disposeAll } from './textures.js';
import { LAYOUT } from './path.js';
import { Fade } from './Fade.jsx';
import { INTERIOR_WINDOW } from './windows.js';

/**
 * Phase 3: the compute bay inside the satellite.
 *
 * A corridor of server racks running along -Z, with lit floor strips and
 * ceiling ribs to give the camera a strong sense of forward motion.
 *
 * Every rack's status lights are baked into one of four shared face textures
 * and animated by modulating emissiveIntensity, which keeps the whole corridor
 * under ~70 draw calls instead of several hundred.
 */


const RACK_PAIRS = 12;

// Rack distribution range.
const START = LAYOUT.interiorStartZ; // -80
const END = LAYOUT.interiorEndZ; // -155

// The corridor shell runs wider than the racks at both ends: it must already
// be on screen when the camera punches through the satellite hull (z ≈ -88),
// and must still enclose the chandelier's approach (z ≈ -196).
const SHELL_NEAR = -86;
const SHELL_FAR = -214;
const SHELL_MID = (SHELL_NEAR + SHELL_FAR) / 2;
const SHELL_LEN = Math.abs(SHELL_FAR - SHELL_NEAR);

export function Interior() {
  const panel = useMemo(() => makePanelTexture(512, 512, '#3a4250'), []);
  // Four face variants, cycled across racks, enough variety to hide the reuse.
  const faces = useMemo(() => [1, 2, 3, 4].map((s) => makeRackFaceTexture(s)), []);

  useEffect(() => () => disposeAll(panel, ...faces), [panel, faces]);

  const racks = useMemo(() => {
    const out = [];
    for (let i = 0; i < RACK_PAIRS; i++) {
      const t = i / (RACK_PAIRS - 1);
      const z = START + (END - START) * t;
      out.push({ z, side: -1, seed: i * 3.7 });
      out.push({ z: z - 2.4, side: 1, seed: i * 5.1 + 1.3 });
    }
    return out;
  }, []);

  return (
    <Fade window={INTERIOR_WINDOW}>
      {/* ---- Corridor shell ------------------------------------------------ */}
      <mesh position={[0, -3.4, SHELL_MID]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, SHELL_LEN]} />
        <meshStandardMaterial map={panel} color="#161c26" metalness={0.7} roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.6, SHELL_MID]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, SHELL_LEN]} />
        <meshStandardMaterial color="#0c1119" metalness={0.6} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 9, 0, SHELL_MID]} rotation={[0, -s * (Math.PI / 2), 0]}>
          <planeGeometry args={[SHELL_LEN, 7]} />
          <meshStandardMaterial map={panel} color="#12181f" metalness={0.7} roughness={0.6} />
        </mesh>
      ))}

      {/* Glowing floor guide strips, the strongest speed cue in the shot */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.4, -3.38, SHELL_MID]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, SHELL_LEN - 4]} />
          <meshBasicMaterial color="#22D3EE" toneMapped={false} transparent opacity={0.45} />
        </mesh>
      ))}

      {/* ---- Ceiling light ribs --------------------------------------------- */}
      {Array.from({ length: 22 }).map((_, i) => {
        const z = SHELL_NEAR - 4 - i * 6;
        return (
          <group key={`rib-${i}`} position={[0, 0, z]}>
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[17, 0.3, 0.5]} />
              <meshStandardMaterial color="#1b232f" metalness={0.8} roughness={0.5} />
            </mesh>
            <mesh position={[0, 3.28, 0]}>
              <boxGeometry args={[6.5, 0.06, 0.22]} />
              <meshBasicMaterial color="#7DE9FF" toneMapped={false} transparent opacity={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* ---- Racks ----------------------------------------------------------- */}
      {racks.map((r, i) => (
        <Rack
          key={i}
          z={r.z}
          side={r.side}
          seed={r.seed}
          panel={panel}
          face={faces[i % faces.length]}
        />
      ))}
    </Fade>
  );
}

function Rack({ z, side, seed, panel, face }) {
  const faceMat = useRef(null);

  useFrame((state) => {
    const m = faceMat.current;
    if (!m) return;
    // Two detuned sines make the flicker read as many independent lights
    // rather than one synchronized pulse.
    const t = state.clock.elapsedTime + seed;
    m.emissiveIntensity = 1.6 + Math.sin(t * 2.3) * 0.5 + Math.sin(t * 7.1) * 0.25;
  });

  return (
    <group position={[side * 5.4, -0.4, z]} rotation={[0, side * -0.12, 0]}>
      {/* Cabinet */}
      <mesh>
        <boxGeometry args={[1.8, 6, 3.4]} />
        <meshStandardMaterial map={panel} color="#2b3542" metalness={0.85} roughness={0.42} />
      </mesh>

      {/* Front face. LEDs are baked into `face`, used as both map and emissive */}
      <mesh position={[side * -0.93, 0, 0]} rotation={[0, side * -(Math.PI / 2), 0]}>
        <planeGeometry args={[3.2, 5.7]} />
        <meshStandardMaterial
          ref={faceMat}
          map={face}
          emissiveMap={face}
          emissive="#ffffff"
          emissiveIntensity={1.6}
          metalness={0.3}
          roughness={0.75}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cooling glow underneath */}
      <mesh position={[0, -3.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 3.2]} />
        <meshBasicMaterial color="#0e7490" toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
