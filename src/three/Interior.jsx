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

      {/* ---- Zero-g clutter --------------------------------------------------- */}
      <DustMotes />
      {DRIFTERS.map((d) => (
        <Drifter key={d.z} position={[d.x, d.y, d.z]} seed={d.seed}>
          {d.kind === 'datapad' && <Datapad />}
          {d.kind === 'cup' && <DrinkPouch />}
          {d.kind === 'stylus' && <Stylus />}
          {d.kind === 'spanner' && <Spanner />}
          {d.kind === 'clipboard' && <Clipboard />}
        </Drifter>
      ))}
    </Fade>
  );
}

/* ========================================================================== */
/*  Zero-g clutter                                                            */
/* ========================================================================== */

/**
 * Loose objects tumbling in the bay.
 *
 * Nothing sells weightlessness like an object that is obviously unsupported,
 * so these are the cheapest possible way to make the corridor read as being in
 * orbit rather than a basement server room.
 *
 * Placement rule: the camera runs the length of the bay inside |x| < 1, and the
 * racks start at |x| = 4.5. Everything here lives in the clear band between,
 * with enough margin that the drift below can never carry one into the lens.
 */
const DRIFTERS = [
  { kind: 'datapad', x: -3.0, y: 1.5, z: -102, seed: 0.0 },
  { kind: 'cup', x: 2.8, y: -1.4, z: -119, seed: 1.3 },
  { kind: 'stylus', x: -2.6, y: -1.9, z: -134, seed: 2.1 },
  { kind: 'clipboard', x: 3.2, y: 1.9, z: -151, seed: 3.4 },
  { kind: 'spanner', x: -3.3, y: 0.6, z: -168, seed: 4.7 },
  { kind: 'datapad', x: 2.7, y: 2.2, z: -181, seed: 5.9 },
];

/**
 * Tumble plus a bounded drift.
 *
 * The drift is sinusoidal rather than linear on purpose: real linear motion
 * would carry these out of the bay within a minute of page load, and where
 * they ended up would depend on how long the tab had been open.
 */
function Drifter({ position, seed, children }) {
  const ref = useRef(null);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + seed * 9;
    g.rotation.set(t * 0.13 + seed, t * 0.19 + seed * 2, t * 0.08);
    g.position.set(
      position[0] + Math.sin(t * 0.17 + seed) * 0.45,
      position[1] + Math.sin(t * 0.13 + seed * 1.7) * 0.38,
      position[2] + Math.sin(t * 0.11 + seed * 2.3) * 0.6
    );
  });

  return <group ref={ref}>{children}</group>;
}

/** A tablet, screen still lit. */
function Datapad() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.46, 0.66, 0.035]} />
        <meshStandardMaterial color="#20262f" metalness={0.7} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[0.4, 0.58]} />
        <meshBasicMaterial color="#22D3EE" toneMapped={false} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

/** Drink pouch, in school colours. A nod to the coffee hour on the schedule. */
function DrinkPouch() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.15, 0.13, 0.33, 14]} />
        <meshStandardMaterial color="#f0f3f7" metalness={0.15} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.153, 0.153, 0.1, 14]} />
        <meshStandardMaterial color="#E8A33D" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Straw */}
      <mesh position={[0.05, 0.26, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
        <meshStandardMaterial color="#cfd6df" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Stylus with a gold band. */
function Stylus() {
  return (
    <group rotation={[0, 0, 0.4]}>
      <mesh>
        <cylinderGeometry args={[0.022, 0.022, 0.5, 8]} />
        <meshStandardMaterial color="#aeb7c4" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.06, 8]} />
        <meshStandardMaterial color="#E8A33D" metalness={1} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <coneGeometry args={[0.022, 0.07, 8]} />
        <meshStandardMaterial color="#4a5058" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Ring spanner, left over from an install. */
function Spanner() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.07, 0.44, 0.035]} />
        <meshStandardMaterial color="#b9c2cf" metalness={0.92} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.1, 0.028, 8, 16]} />
        <meshStandardMaterial color="#b9c2cf" metalness={0.92} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <torusGeometry args={[0.075, 0.026, 8, 14]} />
        <meshStandardMaterial color="#b9c2cf" metalness={0.92} roughness={0.32} />
      </mesh>
    </group>
  );
}

/** Clipboard with a sheet still attached. */
function Clipboard() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.42, 0.56, 0.025]} />
        <meshStandardMaterial color="#5a4a32" metalness={0.2} roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.02, 0.02]}>
        <planeGeometry args={[0.36, 0.46]} />
        <meshStandardMaterial color="#e9ecef" metalness={0} roughness={0.9} />
      </mesh>
      {/* Clip */}
      <mesh position={[0, 0.26, 0.03]}>
        <boxGeometry args={[0.16, 0.07, 0.03]} />
        <meshStandardMaterial color="#9aa4b2" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Dust hanging in the air, drifting as a body.
 *
 * Individual particle motion would mean rewriting the whole position buffer
 * every frame; because the motes are randomly scattered to begin with, easing
 * the entire cloud around on a few slow sines is indistinguishable and costs
 * one matrix update.
 */
function DustMotes({ count = 900 }) {
  const ref = useRef(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let s = 20260806;
    const rand = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 15;
      arr[i * 3 + 1] = (rand() - 0.5) * 6.4;
      arr[i * 3 + 2] = SHELL_NEAR - rand() * SHELL_LEN;
    }
    return arr;
  }, [count]);

  const sprite = useMemo(() => {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,246,230,0.5)');
    g.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => sprite.dispose(), [sprite]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.set(Math.sin(t * 0.07) * 0.9, Math.sin(t * 0.05) * 0.6, Math.sin(t * 0.04) * 1.2);
  });

  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          map={sprite}
          color="#ffe9c8"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
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
