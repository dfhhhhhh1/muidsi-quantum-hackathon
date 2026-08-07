import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { makePanelTexture, disposeAll } from './textures.js';
import { LAYOUT } from './path.js';
import { Fade } from './Fade.jsx';
import { SAT_WINDOW } from './windows.js';

/**
 * Phase 2: the orbital platform.
 *
 * Built as a real spacecraft rather than a stack of primitives: an octagonal
 * bus wrapped in gold MLI foil, twin three-panel solar wings on yoke booms, a
 * high-gain dish with a strut-mounted feed horn, radiators, thrusters and an
 * entry hatch the camera flies through.
 *
 * ---------------------------------------------------------------------------
 * GEOMETRY NOTE, worth reading before moving anything
 * ---------------------------------------------------------------------------
 * The bus is a CylinderGeometry with 8 radial segments and thetaStart = -PI/8,
 * rotated +90 degrees about X so its axis runs along Z (the camera's direction
 * of travel). After that rotation a facet whose pre-rotation angle is `t` ends
 * up with world normal (sin t, -cos t, 0), i.e. all facet normals lie in the
 * XY plane. thetaStart = -PI/8 is what puts a facet CENTRE (rather than an
 * edge) at each 45-degree step, which is what lets a decal sit flat on one.
 *
 * FACET_ANGLE below is measured in the XY plane from +X, so:
 *   0 = +X (solar wing), 90 = +Y (dish), 180 = -X (wing), 270 = -Y (radiators)
 * The 45-degree diagonals are free, which is where the logos go.
 */

/**
 * Turns a Y-axis primitive into a Z-axis one. Applied to every part of the
 * hull body, since the whole craft is laid out in a Z-forward frame.
 */
const AXIS_TO_Z = [Math.PI / 2, 0, 0];

const BUS_R = 2.2; // circumradius
const BUS_LEN = 7.6;
/** Distance from the axis to the flat of a facet, where a decal must sit. */
const BUS_INRADIUS = BUS_R * Math.cos(Math.PI / 8);

/**
 * Static presentation yaw about Y, turning the craft into a three-quarter view.
 *
 * Without this the camera looks almost straight down the bus's long axis, which
 * is both a dull silhouette and fatal for the hull decals: every side facet
 * normal lies in the XY plane, so against a view direction that is ~0.88 along
 * Z they can never be more than about 61 degrees off-normal no matter how the
 * craft is rolled. Yawing 40 degrees swings the -X facet to within ~22 degrees
 * of the camera, and spreads the bus and both wings across the frame.
 */
const PRESENTATION_YAW = THREE.MathUtils.degToRad(40);

/** Z offset of the solar wing booms, kept clear of the logo panels forward. */
const BOOM_Z = -1.2;
/** Z centre of the hull decals, on the bare forward hull ahead of the booms. */
const DECAL_Z = 1.9;

export function Satellite() {
  const spin = useRef(null);
  const beacon = useRef(null);

  const panel = useMemo(() => makePanelTexture(512, 512, '#6f7a8a'), []);
  const arrayTex = useMemo(() => makeSolarTexture(), []);
  const foil = useMemo(() => makeFoilTexture(), []);
  useEffect(() => () => disposeAll(panel, arrayTex, foil), [panel, arrayTex, foil]);

  // BASE_URL keeps this correct under the GitHub Pages subpath deploy.
  const logo = useTexture(`${import.meta.env.BASE_URL}tigerLogo.png`);
  useEffect(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 8;
    logo.needsUpdate = true;
  }, [logo]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (spin.current) {
      // A bounded rock, NOT an accumulating tumble. An ever-increasing rotation
      // eventually swings the hull decals away from the camera, and where they
      // end up depends on how long the page has been open, which makes the shot
      // unreproducible. Real comms satellites are three-axis stabilised anyway.
      spin.current.rotation.z = Math.sin(t * 0.11) * 0.06;
      spin.current.rotation.x = Math.sin(t * 0.15) * 0.04;
    }
    if (beacon.current) {
      beacon.current.intensity = 6 + Math.sin(t * 4) * 4;
    }
  });

  return (
    <Fade window={SAT_WINDOW} position={[0, 0, LAYOUT.satelliteZ]}>
      {/* Fill from the camera side. The sun sits behind and to the right of the
          craft through this whole phase, so the face we actually see is the
          shadowed one; without this the white hull renders as dark grey and the
          albedo is wasted. decay={0} makes it a flat art-directed fill rather
          than an inverse-square falloff. Sits outside the rocking group so it
          stays put relative to the camera. */}
      <pointLight position={[-16, 6, 30]} intensity={2.4} decay={0} color="#cfe0f5" />

      {/* Outer group holds the static three-quarter presentation angle; the
          inner one does the live rocking. Nesting them keeps Euler order from
          mattering. */}
      <group rotation={[0, PRESENTATION_YAW, 0]}>
      <group ref={spin}>
        {/* ================= Main bus ====================================
            AXIS_TO_Z is not optional. CylinderGeometry is built around Y, and
            every other part of this craft (hatch at +Z, engine at -Z, wings on
            the BOOM_Z plane, hull decals at DECAL_Z) is placed in a Z-forward
            frame. Drop the rotation and the hull stands vertically while all
            the fittings hang in empty space where the hull should have been. */}
        <mesh rotation={AXIS_TO_Z}>
          <cylinderGeometry args={[BUS_R, BUS_R, BUS_LEN, 8, 1, false, -Math.PI / 8]} />
          <meshStandardMaterial
            map={panel}
            color="#dfe5ec"
            metalness={0.45}
            roughness={0.55}
          />
        </mesh>

        {/* Gold MLI blanket wrapping the aft third of the bus, kept clear of
            the forward hull where the decals sit */}
        <mesh position={[0, 0, -2.5]} rotation={AXIS_TO_Z}>
          <cylinderGeometry
            args={[BUS_R * 1.015, BUS_R * 1.015, 2.4, 8, 1, true, -Math.PI / 8]}
          />
          <meshStandardMaterial
            map={foil}
            color="#eef3f8"
            metalness={0.35}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Retaining bands at each end of the blanket */}
        {[-3.65, -1.35].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={AXIS_TO_Z}>
            <cylinderGeometry args={[BUS_R * 1.03, BUS_R * 1.03, 0.12, 8, 1, true, -Math.PI / 8]} />
            <meshStandardMaterial color="#E8A33D" metalness={1} roughness={0.28} />
          </mesh>
        ))}

        {/* Tiger logo on both side facets, forward of the wing booms */}
        <LogoDecal map={logo} facetAngle={180} />
        <LogoDecal map={logo} facetAngle={0} />

        {/* ================= Solar array truss =========================== */}
        <SolarArrays arrayTex={arrayTex} />

        {/* ================= High-gain dish (+Y) =========================
            The dish axis is local +Y. Nested groups tilt it toward the camera
            (which sits at roughly local -X, +Z once PRESENTATION_YAW is taken
            into account) so it presents as an ellipse rather than the edge-on
            white sliver it defaults to. Nesting avoids depending on Euler
            order; the inner rotation is applied first. */}
        <group position={[0, BUS_INRADIUS + 0.2, -0.6]} rotation={[0, 0, 0.49]}>
        <group rotation={[0.35, 0, 0]}>
          {/* Pedestal and gimbal */}
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.34, 0.44, 0.7, 16]} />
            <meshStandardMaterial color="#8d97a5" metalness={0.92} roughness={0.35} />
          </mesh>
          {/* Reflector */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[1.75, 40, 20, 0, Math.PI * 2, 0, Math.PI / 3.4]} />
            <meshStandardMaterial
              color="#d6dee8"
              metalness={0.5}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Rim */}
          <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.53, 0.05, 8, 44]} />
            <meshStandardMaterial color="#b9c2cf" metalness={0.95} roughness={0.3} />
          </mesh>
          {/* Feed horn on a tripod */}
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.72, 0.42, Math.sin(a) * 0.72]}
                rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}
              >
                <cylinderGeometry args={[0.035, 0.035, 1.5, 6]} />
                <meshStandardMaterial color="#9aa4b2" metalness={0.9} roughness={0.35} />
              </mesh>
            );
          })}
          <mesh position={[0, 1.12, 0]}>
            <cylinderGeometry args={[0.2, 0.1, 0.42, 12]} />
            <meshStandardMaterial color="#E8A33D" metalness={1} roughness={0.25} />
          </mesh>
        </group>
        </group>

        {/* ================= Radiator panels (-Y) ========================
            Thin boxes flush to the facet, not floating DoubleSide planes. A
            zero-thickness plane hovering just off the hull catches the light
            on both faces and reads as a detached white slab from side angles. */}
        {[-1.4, 1.4].map((z) => (
          <group key={z} position={[0, -(BUS_INRADIUS - 0.02), z]}>
            <mesh>
              <boxGeometry args={[1.5, 0.07, 2.3]} />
              <meshStandardMaterial color="#c3ccd6" metalness={0.2} roughness={0.68} />
            </mesh>
            {/* Coolant headers along each edge */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.72, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 2.3, 8]} />
                <meshStandardMaterial color="#8d97a5" metalness={0.9} roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}

        {/* ================= Forward hatch, the camera flies in here ===== */}
        <group position={[0, 0, BUS_LEN / 2]}>
          {/* No rotation: a torus is already a ring around Z, which is what a
              hatch on the +Z face wants. Rotating it stands it on edge. */}
          <mesh>
            <torusGeometry args={[1.2, 0.11, 12, 36]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          {/* Recessed dark aperture */}
          <mesh position={[0, 0, -0.06]}>
            <circleGeometry args={[1.16, 32]} />
            <meshStandardMaterial color="#02060a" emissive="#062a33" emissiveIntensity={0.8} />
          </mesh>
          {/* Guide lights around the hatch */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0.02]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial
                  color="#7DE9FF"
                  emissive="#22D3EE"
                  emissiveIntensity={2.6}
                  toneMapped={false}
                />
              </mesh>
            );
          })}
          <pointLight ref={beacon} position={[0, 0, 1.0]} color="#22D3EE" distance={7} decay={2} />
        </group>

        {/* ================= Engine block (-Z) =========================== */}
        <group position={[0, 0, -(BUS_LEN / 2 + 0.1)]}>
          <mesh>
            <torusGeometry args={[1.45, 0.2, 12, 36]} />
            <meshStandardMaterial color="#b9c2cf" metalness={0.95} roughness={0.3} />
          </mesh>
          {/* Main nozzle */}
          <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.85, 0.42, 1.1, 24, 1, true]} />
            <meshStandardMaterial
              color="#4a4f57"
              metalness={0.9}
              roughness={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Attitude thruster quads */}
          {Array.from({ length: 4 }).map((_, i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 1.45, Math.sin(a) * 1.45, -0.2]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.16, 0.09, 0.34, 10, 1, true]} />
                <meshStandardMaterial
                  color="#6f7a8a"
                  metalness={0.9}
                  roughness={0.4}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </group>

        {/* ================= Greebles ==================================== */}
        {/* Star trackers with sun baffles */}
        {[
          [1.55, 1.55, -2.4],
          [-1.55, 1.55, -2.4],
        ].map((p, i) => (
          <group key={i} position={p} rotation={[0.3, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.42, 0.42, 0.6]} />
              <meshStandardMaterial color="#3a4149" metalness={0.8} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0, 0.45]}>
              <cylinderGeometry args={[0.17, 0.2, 0.5, 12, 1, true]} />
              <meshStandardMaterial
                color="#22262c"
                metalness={0.7}
                roughness={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Equipment boxes and pipework along the hull */}
        {[
          [1.5, -1.5, 1.2, 0.5, 0.4, 1.0],
          [-1.6, -1.4, -0.4, 0.4, 0.5, 1.4],
          [1.62, 1.3, 2.2, 0.35, 0.35, 0.7],
        ].map((g, i) => (
          <mesh key={i} position={[g[0], g[1], g[2]]}>
            <boxGeometry args={[g[3], g[4], g[5]]} />
            <meshStandardMaterial color="#7d8794" metalness={0.88} roughness={0.42} />
          </mesh>
        ))}

        {/* Omni antenna whips */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 1.3, -1.5, -3.0]} rotation={[0.5, 0, s * 0.3]}>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
              <meshStandardMaterial color="#c9d2dd" metalness={0.9} roughness={0.35} />
            </mesh>
            <mesh position={[0, -1.25, 0]}>
              <sphereGeometry args={[0.09, 10, 10]} />
              <meshStandardMaterial color="#E8A33D" metalness={1} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
      </group>
    </Fade>
  );
}

/* ========================================================================== */

/**
 * Tiger logo sitting flat on one bus facet.
 *
 * The decal is authored for the -X facet (a plane rotated -90 degrees about Y
 * faces -X, and its width axis then runs along +Z, the bus's long axis). The
 * wrapping group then yaws it round to whichever facet is wanted, which keeps
 * the orientation maths in exactly one place.
 */
function LogoDecal({ map, facetAngle }) {
  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(facetAngle - 180)]}>
      <mesh position={[-(BUS_INRADIUS + 0.015), 0, DECAL_Z]} rotation={[0, -Math.PI / 2, 0]}>
        {/* 16:9, to match the source PNG. Height stays under the facet's flat
            width of 2 * BUS_R * sin(PI/8) so it does not wrap an edge. */}
        <planeGeometry args={[2.55, 1.43]} />
        <meshStandardMaterial
          map={map}
          transparent
          alphaTest={0.04}
          metalness={0.1}
          roughness={0.55}
          emissiveMap={map}
          emissive="#ffffff"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      </mesh>
    </group>
  );
}

/**
 * ISS-style solar array assembly: a lattice truss across the craft carrying
 * four array pairs, eight arrays in all.
 *
 * The panel faces lie in the XY plane with their normals along Z, which is
 * roughly where the camera sits during this phase, so the arrays present
 * face-on rather than edge-on. Arrays extend along +/-Y from the truss, the
 * same arrangement as the real station.
 */
function SolarArrays({ arrayTex }) {
  // Sized so the whole assembly stays clear of the content column on the
  // left: roughly +/-8.4 in X and +/-6.0 in Y.
  const TRUSS_HALF = 8;        // truss runs +/-X from the bus
  const STATIONS = [3.6, 6.8]; // |x| of each array pair
  const ARRAY_W = 3.2;         // along X
  const ARRAY_L = 5.2;         // along Y
  const ARRAY_INSET = 0.8;     // gap between truss and array root

  return (
    <group position={[0, 0, BOOM_Z]}>
      {/* ---- Lattice truss: four longerons plus cross frames ------------ */}
      {[-1, 1].map((sy) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sy}${sz}`} position={[0, sy * 0.3, sz * 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, TRUSS_HALF * 2, 6]} />
            <meshStandardMaterial color="#d6dde4" metalness={0.7} roughness={0.45} />
          </mesh>
        ))
      )}
      {Array.from({ length: 17 }).map((_, i) => {
        const x = -TRUSS_HALF + i * (TRUSS_HALF / 8);
        return (
          <mesh key={`frame-${i}`} position={[x, 0, 0]}>
            <boxGeometry args={[0.07, 0.68, 0.68]} />
            <meshStandardMaterial color="#c3ccd6" metalness={0.7} roughness={0.5} />
          </mesh>
        );
      })}

      {/* ---- Four array pairs ------------------------------------------- */}
      {[-1, 1].map((sx) =>
        STATIONS.map((sta) =>
          [-1, 1].map((sy) => {
            const x = sx * sta;
            const yRoot = sy * ARRAY_INSET;
            const yCentre = yRoot + sy * (ARRAY_L / 2);
            return (
              <group key={`${sx}-${sta}-${sy}`}>
                {/* Rotary joint at the truss */}
                <mesh position={[x, yRoot, 0]} rotation={[0, 0, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 1, 14]} />
                  <meshStandardMaterial color="#b9c2cf" metalness={0.9} roughness={0.4} />
                </mesh>

                {/* Beta gimbal: the blanket counter-rotates about its own mast
                    by exactly PRESENTATION_YAW, cancelling the hull's yaw so
                    the cells face the camera instead of presenting edge-on
                    white substrate. Real arrays do this to track the sun, so
                    it costs nothing in plausibility, and it lets the hull stay
                    yawed for the sake of the logo decals. */}
                <group position={[x, yCentre, 0]} rotation={[0, -PRESENTATION_YAW, 0]}>
                  {/* Mast running the length of the array */}
                  <mesh position={[0, 0, -0.06]}>
                    <cylinderGeometry args={[0.07, 0.07, ARRAY_L, 6]} />
                    <meshStandardMaterial color="#cfd6df" metalness={0.85} roughness={0.4} />
                  </mesh>
                  {/* Blanket face */}
                  <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[ARRAY_W, ARRAY_L]} />
                    <meshStandardMaterial
                      map={arrayTex}
                      color="#33549e"
                      metalness={0.65}
                      roughness={0.3}
                      emissive="#0a1936"
                      emissiveIntensity={0.45}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  {/* Substrate, so the array has thickness from the side */}
                  <mesh position={[0, 0, -0.02]}>
                    <boxGeometry args={[ARRAY_W, ARRAY_L, 0.06]} />
                    <meshStandardMaterial color="#e2e8ee" metalness={0.4} roughness={0.6} />
                  </mesh>
                  {/* Tip and root battens */}
                  {[-1, 1].map((e) => (
                    <mesh key={e} position={[0, e * (ARRAY_L / 2), 0]}>
                      <boxGeometry args={[ARRAY_W + 0.1, 0.11, 0.15]} />
                      <meshStandardMaterial color="#aeb7c4" metalness={0.85} roughness={0.4} />
                    </mesh>
                  ))}
                </group>
              </group>
            );
          })
        )
      )}
    </group>
  );
}


/* ------------------------------------------------------------- textures --- */

/** Solar-cell grid: cells, busbars, and a faint diagonal sheen. */
function makeSolarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#16305e';
  ctx.fillRect(0, 0, 512, 256);

  const CELL = 32;
  for (let x = 0; x < 512; x += CELL) {
    for (let y = 0; y < 256; y += CELL) {
      ctx.fillStyle = (x / CELL + y / CELL) % 2 === 0 ? '#1d3f7a' : '#1a3970';
      ctx.fillRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3);
      // Busbars across each cell
      ctx.strokeStyle = 'rgba(190, 210, 255, 0.35)';
      ctx.lineWidth = 1;
      for (let b = 1; b <= 2; b++) {
        ctx.beginPath();
        ctx.moveTo(x + (CELL / 3) * b, y + 2);
        ctx.lineTo(x + (CELL / 3) * b, y + CELL - 2);
        ctx.stroke();
      }
    }
  }

  // Cell gaps
  ctx.strokeStyle = 'rgba(8, 16, 40, 0.9)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Diagonal sheen
  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.45, 'rgba(160, 200, 255, 0.10)');
  g.addColorStop(0.55, 'rgba(160, 200, 255, 0.03)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Crinkled gold MLI blanket: creases and facet highlights on a gold ground. */
function makeFoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Neutral grey ground: the material's colour decides the hue, so the same
  // crinkle works for white MLI or gold trim.
  ctx.fillStyle = '#b9c0c8';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 991;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Irregular crinkle facets, alternately catching and losing the light.
  for (let i = 0; i < 260; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const s = 14 + rand() * 70;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      ctx.lineTo(x + (rand() - 0.5) * s, y + (rand() - 0.5) * s);
    }
    ctx.closePath();
    const lift = rand();
    ctx.fillStyle =
      lift > 0.5
        ? `rgba(255, 255, 255, ${0.06 + rand() * 0.18})`
        : `rgba(40, 48, 58, ${0.05 + rand() * 0.14})`;
    ctx.fill();
  }

  // Sharp crease lines
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.07 + rand() * 0.15})`;
    ctx.beginPath();
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 130, y + (rand() - 0.5) * 130);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
