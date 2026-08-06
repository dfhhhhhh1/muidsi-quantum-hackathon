import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LAYOUT } from './path.js';
import { Fade } from './Fade.jsx';
import { CHAND_WINDOW } from './windows.js';
import { HudTerminal } from './HudTerminal.jsx';

/**
 * Phase 4: the dilution refrigerator, a.k.a. the "quantum chandelier".
 *
 * Modelled on the real thing. A dilution fridge is a stack of circular plates,
 * each one a colder temperature stage, hung from the plate above on support
 * rods. Coaxial signal lines run down from the top, stepping inward stage by
 * stage, with attenuators bolted on at each plate to strip thermal noise. The
 * QPU itself hangs off the bottom plate at ~10 mK.
 *
 * Draw-call budget: every repeated element (perforations, bolts, coax runs,
 * attenuators, braids) is a single InstancedMesh, so the whole rig is roughly
 * 30 draw calls despite being made of ~700 pieces.
 */


/**
 * The temperature stages, top (warmest) to bottom (coldest).
 * `r` = plate radius, `y` = height, `t` = plate thickness.
 */
const STAGES = [
  { label: '300K', r: 2.6, y: 4.0, t: 0.18 },
  { label: '50K', r: 2.4, y: 2.35, t: 0.16 },
  { label: '4K', r: 2.1, y: 0.8, t: 0.15 },
  { label: 'STILL', r: 1.7, y: -0.7, t: 0.13 },
  { label: 'COLD', r: 1.3, y: -2.0, t: 0.12 },
  { label: 'MXC', r: 0.95, y: -3.2, t: 0.14 },
];

const COAX_COUNT = 40;

/**
 * Radius of the vertical cage of coax running between stage `s` and `s + 1`.
 *
 * Constant for the whole span, sized to the LOWER (smaller) plate. This is what
 * makes the runs perfectly vertical: on the real hardware each stage is a
 * cylindrical cage of parallel lines, and the diameter steps down at each
 * plate. Interpolating the radius between the two plates instead produces a
 * cone, which is the single thing that most makes a fridge look fake.
 *
 * Coax, attenuators and coils all read from this so they stay concentric.
 */
const spanRadius = (s) => STAGES[s + 1].r - 0.32;

export function Chandelier() {
  const spin = useRef(null);
  const core = useRef(null);
  const coreLight = useRef(null);

  /* ------------------------------------------------------------ materials */
  const mats = useMemo(() => {
    const gold = new THREE.MeshStandardMaterial({
      color: '#E0A44A',
      metalness: 1,
      roughness: 0.24,
      emissive: new THREE.Color('#4a2a04'),
      emissiveIntensity: 0.5,
    });
    const goldDark = new THREE.MeshStandardMaterial({
      color: '#B07C2E',
      metalness: 1,
      roughness: 0.4,
    });
    const copper = new THREE.MeshStandardMaterial({
      color: '#C9793E',
      metalness: 1,
      roughness: 0.33,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: '#9BA6B4',
      metalness: 0.95,
      roughness: 0.28,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: '#1A1F27',
      metalness: 0.7,
      roughness: 0.55,
    });
    const shield = new THREE.MeshStandardMaterial({
      color: '#D89B45',
      metalness: 1,
      roughness: 0.3,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });
    // The pale cream bundle that fans out below the mixing chamber.
    const wire = new THREE.MeshStandardMaterial({
      color: '#E6DFCC',
      metalness: 0.25,
      roughness: 0.62,
    });
    return { gold, goldDark, copper, steel, dark, shield, wire };
  }, []);

  /* --------------------------------------------------------------- shared */
  const geos = useMemo(
    () => ({
      perforation: new THREE.CylinderGeometry(0.055, 0.055, 0.3, 8),
      bolt: new THREE.CylinderGeometry(0.05, 0.05, 0.09, 6),
      coax: new THREE.CylinderGeometry(0.028, 0.028, 1, 6),
      attenuator: new THREE.BoxGeometry(0.11, 0.26, 0.11),
      braid: new THREE.CylinderGeometry(0.045, 0.045, 1, 5),
    }),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    if (spin.current) spin.current.rotation.y += dt * 0.05;

    const t = state.clock.elapsedTime;
    if (core.current) {
      const pulse = 3.2 + Math.sin(t * 1.6) * 1.3 + Math.sin(t * 5.3) * 0.35;
      core.current.material.emissiveIntensity = pulse;
    }
    if (coreLight.current) coreLight.current.intensity = 5 + Math.sin(t * 1.6) * 2.5;
  });

  return (
    <Fade window={CHAND_WINDOW} position={LAYOUT.chandelierPos}>
      {/* Everything except the HUD scales together so the rig clears the
          corridor floor and ceiling. The HUD stays outside this group: its
          on-screen size comes from <Html distanceFactor>, not world scale. */}
      <group scale={LAYOUT.chandelierScale}>
        <GlassEnclosure />

        <group ref={spin}>
          {/* ---- Top mounting flange and vacuum feedthrough --------------- */}
          <mesh position={[0, 5.0, 0]} material={mats.steel}>
            <cylinderGeometry args={[2.9, 2.9, 0.22, 56]} />
          </mesh>
          <mesh position={[0, 4.62, 0]} material={mats.goldDark}>
            <cylinderGeometry args={[1.5, 2.75, 0.55, 48]} />
          </mesh>
          {/* Feedthrough ports around the flange */}
          <Ring count={10} radius={2.35} y={5.16} material={mats.steel}>
            <cylinderGeometry args={[0.17, 0.17, 0.26, 12]} />
          </Ring>

          {/* ---- The plate stack ------------------------------------------ */}
          {STAGES.map((s) => (
            <mesh key={s.label} position={[0, s.y, 0]} material={mats.gold}>
              <cylinderGeometry args={[s.r, s.r, s.t, 56]} />
            </mesh>
          ))}

          {/* Plate edge bands, a slightly darker rim reads as machined edge */}
          {STAGES.map((s) => (
            <mesh key={`rim-${s.label}`} position={[0, s.y, 0]} material={mats.goldDark}>
              <cylinderGeometry args={[s.r + 0.012, s.r + 0.012, s.t * 0.45, 56]} />
            </mesh>
          ))}

          {/* Lightening holes punched through every plate */}
          <Perforations geometry={geos.perforation} material={mats.goldDark} />

          {/* Bolt circles on every plate */}
          <Bolts geometry={geos.bolt} material={mats.steel} />

          {/* ---- Radiation shields ----------------------------------------- */}
          {/* 50K gold shield can */}
          <mesh position={[0, 1.6, 0]} material={mats.shield}>
            <cylinderGeometry args={[2.32, 2.32, 1.4, 48, 1, true]} />
          </mesh>
          {/* 4K shield can */}
          <mesh position={[0, 0.05, 0]} material={mats.shield}>
            <cylinderGeometry args={[2.02, 2.02, 1.3, 48, 1, true]} />
          </mesh>

          {/* ---- Structure: support rods between every stage ---------------- */}
          <SupportRods material={mats.steel} />

          {/* ---- Pulse tube cooler: the two fat vertical tubes -------------- */}
          {[0.62, -0.62].map((x) => (
            <group key={x} position={[x, 0, 1.55]}>
              <mesh position={[0, 3.2, 0]} material={mats.steel}>
                <cylinderGeometry args={[0.2, 0.2, 1.6, 20]} />
              </mesh>
              <mesh position={[0, 1.6, 0]} material={mats.copper}>
                <cylinderGeometry args={[0.15, 0.15, 1.6, 16]} />
              </mesh>
              <mesh position={[0, 2.35, 0]} material={mats.goldDark}>
                <cylinderGeometry args={[0.26, 0.26, 0.22, 20]} />
              </mesh>
            </group>
          ))}

          {/* ---- Central threaded shaft down the core ----------------------- */}
          <mesh position={[0, 0.6, 0]} material={mats.steel}>
            <cylinderGeometry args={[0.14, 0.11, 8.2, 20]} />
          </mesh>
          <ColumnThreads material={mats.steel} />

          {/* ---- Signal chain: coax runs + attenuators ---------------------- */}
          <CoaxRuns geometry={geos.coax} material={mats.copper} />
          <Attenuators geometry={geos.attenuator} material={mats.gold} />
          <Coils material={mats.steel} />

          {/* ---- Thermal braids on the lower stages ------------------------- */}
          <Braids geometry={geos.braid} material={mats.copper} />

          {/* ---- Flexible wire bundle down to the sample -------------------- */}
          <WireFan material={mats.wire} />

          {/* ---- Mixing chamber and the QPU package ------------------------- */}
          <mesh position={[0, -3.62, 0]} material={mats.gold}>
            <cylinderGeometry args={[0.66, 0.5, 0.62, 36]} />
          </mesh>
          {/* Magnetic shield can around the package */}
          <mesh position={[0, -4.16, 0]} material={mats.goldDark}>
            <cylinderGeometry args={[0.62, 0.62, 0.5, 32, 1, true]} />
          </mesh>
          {/* Sample holder */}
          <mesh position={[0, -4.3, 0]} material={mats.dark}>
            <boxGeometry args={[0.92, 0.14, 0.92]} />
          </mesh>

          {/* The qubit chip: the glowing heart of the whole scene */}
          <mesh ref={core} position={[0, -4.4, 0]}>
            <boxGeometry args={[0.62, 0.06, 0.62]} />
            <meshStandardMaterial
              color="#8FF0FF"
              emissive="#22D3EE"
              emissiveIntensity={3.2}
              toneMapped={false}
            />
          </mesh>
          {/* Wire bonds fanning off the chip */}
          <Ring count={12} radius={0.38} y={-4.36} material={mats.gold}>
            <boxGeometry args={[0.16, 0.012, 0.012]} />
          </Ring>

          <pointLight ref={coreLight} position={[0, -4.1, 0]} color="#22D3EE" distance={14} />
        </group>

        {/* Key lights inside the enclosure to make the gold sing */}
        <pointLight position={[2.6, 3.2, 3.4]} color="#FFC46B" intensity={30} distance={26} />
        <pointLight position={[-3.2, -1.4, 2.2]} color="#7FB6FF" intensity={5} distance={22} />
        <pointLight position={[0, -3.0, -2.6]} color="#E8A33D" intensity={14} distance={18} />
        <pointLight position={[-2.2, 2.0, -3.0]} color="#FFB347" intensity={12} distance={20} />
      </group>

      {/* ---- The HUD terminal, mounted beside the enclosure ------------------
          Offsets are tuned against the final camera keyframe in path.js: the
          panel lands right of centre on screen, clear of the content column.
          If you retune the camera, retune these two lines together.          */}
      <HudTerminal position={[-0.4, 1.0, 3.2]} rotation={[0.1, -0.5, 0]} />
    </Fade>
  );
}

/* ========================================================================== */
/*  Sub-assemblies                                                            */
/* ========================================================================== */

/**
 * The glass cylinder the whole rig stands in.
 *
 * Deliberately NOT MeshPhysicalMaterial#transmission: transmission forces an
 * extra full-scene render pass per frame, interacts badly with the fade
 * system's opacity animation, and costs far more than it buys at this size.
 * A plain transparent physical material with clearcoat reads the same here.
 */
function GlassEnclosure() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} renderOrder={4}>
        <cylinderGeometry args={[3.4, 3.4, 10.2, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#A8DCEC"
          metalness={0}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.04}
          transparent
          opacity={0.13}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Rims top and bottom */}
      {[5.3, -4.9].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.4, 0.1, 10, 56]} />
          <meshStandardMaterial color="#8FA3B5" metalness={0.95} roughness={0.28} />
        </mesh>
      ))}
      {/* Vertical mullions so the glass reads as a real enclosure */}
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.4, 0.2, Math.sin(a) * 3.4]}>
            <boxGeometry args={[0.07, 10.2, 0.07]} />
            <meshStandardMaterial color="#7E90A2" metalness={0.9} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Generic instanced ring of identical parts. Children supply the geometry. */
function Ring({ count, radius, y, material, children, tilt = 0 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      o.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      o.rotation.set(tilt, -a, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, radius, y, tilt]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      material={material}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  );
}

/** Lightening holes around every plate, two concentric rings per plate. */
function Perforations({ geometry, material }) {
  const ref = useRef(null);
  const count = useMemo(
    () => STAGES.reduce((n, s) => n + (s.r > 1.5 ? 18 + 12 : 12), 0),
    []
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (const s of STAGES) {
      const rings = s.r > 1.5 ? [[18, 0.82], [12, 0.56]] : [[12, 0.7]];
      for (const [n, frac] of rings) {
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + (frac > 0.7 ? 0 : 0.3);
          o.position.set(Math.cos(a) * s.r * frac, s.y, Math.sin(a) * s.r * frac);
          o.rotation.set(0, 0, 0);
          o.scale.set(1, (s.t * 1.8) / 0.3, 1);
          o.updateMatrix();
          mesh.setMatrixAt(i++, o.matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/** Bolt heads sitting proud on the top face of every plate. */
function Bolts({ geometry, material }) {
  const ref = useRef(null);
  const count = STAGES.length * 12;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (const s of STAGES) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + 0.15;
        o.position.set(Math.cos(a) * (s.r - 0.14), s.y + s.t / 2 + 0.04, Math.sin(a) * (s.r - 0.14));
        o.rotation.set(0, a, 0);
        o.scale.setScalar(1);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/** Vertical support rods, one set spanning each gap between plates. */
function SupportRods({ material }) {
  const ref = useRef(null);
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.05, 0.05, 1, 8), []);
  const count = (STAGES.length - 1) * 6 + 6; // plus flange-to-300K

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;

    const spans = [];
    spans.push({ yTop: 4.62, yBot: STAGES[0].y, r: 2.45 });
    for (let s = 0; s < STAGES.length - 1; s++) {
      spans.push({
        yTop: STAGES[s].y,
        yBot: STAGES[s + 1].y,
        r: Math.min(STAGES[s].r, STAGES[s + 1].r) - 0.22,
      });
    }

    for (const span of spans) {
      const h = span.yTop - span.yBot;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + 0.4;
        o.position.set(Math.cos(a) * span.r, span.yBot + h / 2, Math.sin(a) * span.r);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, h, 1);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * Coaxial signal lines: a dense cylindrical cage of parallel vertical runs
 * between each pair of plates, stepping to a smaller diameter at every stage.
 *
 * These are dead vertical, with no rotation and no spiral offset. The cylinder
 * geometry is already Y-aligned, so scaling it on Y and leaving rotation at
 * identity is all that is needed.
 */
function CoaxRuns({ geometry, material }) {
  const ref = useRef(null);
  const count = COAX_COUNT * (STAGES.length - 1);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;

    for (let s = 0; s < STAGES.length - 1; s++) {
      const top = STAGES[s];
      const bot = STAGES[s + 1];
      const r = spanRadius(s);
      const yTop = top.y - top.t / 2;
      const yBot = bot.y + bot.t / 2;
      const h = yTop - yBot;

      for (let c = 0; c < COAX_COUNT; c++) {
        const a = (c / COAX_COUNT) * Math.PI * 2;
        o.position.set(Math.cos(a) * r, yBot + h / 2, Math.sin(a) * r);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, h, 1);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * Attenuator packages bolted onto the coax just below each plate.
 *
 * Sits at spanRadius() so the blocks land ON the vertical lines rather than
 * floating at their own radius.
 */
function Attenuators({ geometry, material }) {
  const ref = useRef(null);
  // Spans below the open top section, where the real hardware is busiest.
  const spans = [1, 2, 3, 4];
  const perSpan = 16;
  const count = spans.length * perSpan;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (const s of spans) {
      const r = spanRadius(s);
      const yTop = STAGES[s].y - STAGES[s].t / 2;
      for (let k = 0; k < perSpan; k++) {
        const a = (k / perSpan) * Math.PI * 2 + s * 0.1;
        o.position.set(Math.cos(a) * r, yTop - 0.24, Math.sin(a) * r);
        o.rotation.set(0, -a, 0);
        o.scale.setScalar(1);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * Thick copper thermal braids linking the two coldest stages. Vertical, and
 * set just outside the coax cage so the two do not intersect.
 */
function Braids({ geometry, material }) {
  const ref = useRef(null);
  const count = 8;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();

    const top = STAGES[STAGES.length - 2];
    const bot = STAGES[STAGES.length - 1];
    const r = bot.r - 0.1;
    const yTop = top.y - top.t / 2;
    const yBot = bot.y + bot.t / 2;
    const h = yTop - yBot;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.2;
      o.position.set(Math.cos(a) * r, yBot + h / 2, Math.sin(a) * r);
      o.rotation.set(0, 0, 0);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * The threaded central shaft running down the core of the stack, and the ring
 * of coiled cable loops at the colder stages. Both are prominent, immediately
 * recognisable features of the real hardware.
 */
function ColumnThreads({ material }) {
  const ref = useRef(null);
  const geometry = useMemo(() => new THREE.TorusGeometry(0.2, 0.03, 6, 18), []);
  const count = 26;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      o.position.set(0, 4.35 - i * 0.13, 0);
      o.rotation.set(Math.PI / 2, 0, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/**
 * The pale wire bundle fanning out below the mixing chamber down to the chip.
 *
 * These DO splay, unlike everything above them, and that is correct: on the
 * real hardware the rigid coax stops at the mixing chamber plate and the last
 * run to the sample is flexible wiring. Keeping the splay confined to below
 * the bottom plate is what makes it read as flexible wire instead of making
 * the coax above look crooked.
 */
function WireFan({ material }) {
  const ref = useRef(null);
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 1, 4), []);
  const count = 40;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const q = new THREE.Quaternion();

    const mxc = STAGES[STAGES.length - 1];
    const yTop = mxc.y - mxc.t / 2;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      // Out at the plate edge, converging on the sample holder below.
      from.set(Math.cos(a) * (mxc.r - 0.1), yTop, Math.sin(a) * (mxc.r - 0.1));
      to.set(Math.cos(a) * 0.3, -4.24, Math.sin(a) * 0.3);

      dir.subVectors(to, from);
      const len = dir.length();
      dir.normalize();

      o.position.copy(from).addScaledVector(dir, len / 2);
      q.setFromUnitVectors(up, dir);
      o.quaternion.copy(q);
      o.scale.set(1, len, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/** Loops of coiled cable, mounted on the coax cage at the two lower spans. */
function Coils({ material }) {
  const ref = useRef(null);
  const geometry = useMemo(() => new THREE.TorusGeometry(0.12, 0.022, 6, 16), []);
  const spans = [2, 3];
  const perSpan = 12;
  const count = spans.length * perSpan;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (const s of spans) {
      const r = spanRadius(s);
      const yMid = (STAGES[s].y + STAGES[s + 1].y) / 2;
      for (let k = 0; k < perSpan; k++) {
        const a = (k / perSpan) * Math.PI * 2 + s * 0.2;
        o.position.set(Math.cos(a) * r, yMid, Math.sin(a) * r);
        // Face the loop outward so it reads as a circle from outside.
        o.rotation.set(0, -a, 0);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}
