/**
 * Headless sanity check for the camera choreography.
 *
 * The 3D scene can only be eyeballed in a browser, but most of what makes the
 * sequence work or break is pure math, and that can be checked here in a
 * second. Run it after touching KEYS in path.js or any window in windows.js:
 *
 *   node scripts/verify-path.mjs
 *
 * It imports the real values from src/, so it cannot drift out of date.
 *
 * What it catches:
 *  - the camera reversing direction mid-scroll
 *  - the aim point drifting close to the camera, which makes lookAt degenerate
 *    and snaps the view (the classic failure when interpolating look *points*)
 *  - the view whipping round faster than the eye can follow
 *  - scroll positions where nothing is actually on screen
 *  - subjects framed on the left, behind the content column
 *  - the chandelier clipping through the corridor floor or ceiling
 *
 * That fourth check is the whole reason this file earns its keep. An earlier
 * version only asked whether a stage was *faded in*, which it happily reported
 * as fine while the camera panned across ten seconds of empty starfield with
 * the Earth fully opaque behind its shoulder. Opacity is not framing. This
 * version builds a real PerspectiveCamera and projects each subject to screen
 * space, which is the only way to answer "is it actually visible".
 */
import * as THREE from 'three';
import { samplePath, KEYS, LAYOUT } from '../src/three/path.js';
import { envelope } from '../src/three/fade.js';
import {
  EARTH_WINDOW,
  SAT_WINDOW,
  INTERIOR_WINDOW,
  CHAND_WINDOW,
} from '../src/three/windows.js';

const WINDOWS = {
  earth: EARTH_WINDOW,
  sat: SAT_WINDOW,
  int: INTERIOR_WINDOW,
  chand: CHAND_WINDOW,
};

// Corridor bounds from Interior.jsx.
const FLOOR_Y = -3.4;
const CEILING_Y = 3.6;

const SAMPLES = 400;
const ASPECT = 16 / 9;

const pos = new THREE.Vector3();
const look = new THREE.Vector3();
const prev = new THREE.Vector3();
const fwd = new THREE.Vector3();
const prevFwd = new THREE.Vector3();

// A real camera, so framing questions get real answers.
const cam = new THREE.PerspectiveCamera(50, ASPECT, 0.1, 2000);
const projected = new THREE.Vector3();

/**
 * The things the camera is meant to be looking at, with the scroll window over
 * which each is supposed to be carrying the shot.
 * `radius` is a rough bounding radius used to work out apparent size.
 */
const SUBJECTS = [
  { name: 'Earth', pos: [0, 0, LAYOUT.earthZ], radius: LAYOUT.earthRadius, from: 0.0, to: 0.22 },
  { name: 'Sun', pos: LAYOUT.sunPos, radius: LAYOUT.sunRadius * 13, from: 0.30, to: 0.42 },
  { name: 'Satellite', pos: [0, 0, LAYOUT.satelliteZ], radius: 11, from: 0.46, to: 0.6 },
  { name: 'Chandelier', pos: LAYOUT.chandelierPos, radius: 2.2, from: 0.82, to: 1.0 },
];

/**
 * Projects a world point through the camera at progress `p`.
 * Returns normalised device coords (x and y in -1..1, x positive = right),
 * apparent angular size in degrees, and whether any of it is on screen.
 */
function frame(p, subject) {
  const { roll, fov } = samplePath(p, pos, look);
  cam.position.copy(pos);
  cam.fov = fov;
  cam.up.set(0, 1, 0);
  cam.lookAt(look);
  if (roll) cam.rotateZ(roll);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);

  projected.set(...subject.pos);
  const dist = projected.distanceTo(pos);
  const angular = (2 * Math.atan(subject.radius / Math.max(dist, 0.001)) * 180) / Math.PI;

  projected.project(cam);
  const behind = projected.z > 1;
  // Half-extent of the subject in NDC-y terms, used to allow for its size.
  const halfY = angular / fov;
  const halfX = halfY / ASPECT;
  const onScreen =
    !behind &&
    Math.abs(projected.x) - halfX < 1 &&
    Math.abs(projected.y) - halfY < 1;

  return { x: projected.x, y: projected.y, angular, dist, onScreen, behind };
}

let monotonic = true;
let minAim = Infinity;
let minAimAt = 0;
let maxTurn = 0;
let maxTurnAt = 0;
const rows = [];

for (let i = 0; i <= SAMPLES; i++) {
  const p = i / SAMPLES;
  samplePath(p, pos, look);

  if (i > 0 && pos.z > prev.z + 1e-6) monotonic = false;

  const aim = pos.distanceTo(look);
  if (aim < minAim) {
    minAim = aim;
    minAimAt = p;
  }

  fwd.subVectors(look, pos).normalize();
  if (i > 0) {
    const dot = Math.min(1, Math.max(-1, fwd.dot(prevFwd)));
    // Degrees of view rotation per 1% of scroll.
    const deg = THREE.MathUtils.radToDeg(Math.acos(dot)) * (SAMPLES / 100);
    if (deg > maxTurn) {
      maxTurn = deg;
      maxTurnAt = p;
    }
  }
  prevFwd.copy(fwd);
  prev.copy(pos);

  const env = Object.fromEntries(
    Object.entries(WINDOWS).map(([k, w]) => [k, envelope(p, w)])
  );

  if (i % 20 === 0) {
    rows.push({
      p: p.toFixed(2),
      camZ: pos.z.toFixed(1),
      aimDist: aim.toFixed(1),
      ...Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v.toFixed(2)])),
    });
  }
}

console.table(rows);

/* -------------------------------------------------------------- framing --- */

// Is SOMETHING on screen at every scroll position? The corridor encloses the
// camera, so treat that stretch as inherently covered.
const emptyAt = [];
const corridorFrom = 0.6;
for (let i = 0; i <= SAMPLES; i++) {
  const p = i / SAMPLES;
  if (p >= corridorFrom) continue;
  const anything = SUBJECTS.some((s) => {
    const f = frame(p, s);
    return f.onScreen && envelope(p, windowFor(s.name)) > 0.2 && f.angular > 1.5;
  });
  if (!anything) emptyAt.push(p.toFixed(3));
}

function windowFor(name) {
  if (name === 'Earth') return EARTH_WINDOW;
  if (name === 'Satellite') return SAT_WINDOW;
  if (name === 'Chandelier') return CHAND_WINDOW;
  return [-1, -1, 2, 2]; // the sun is not on the fade system
}

console.log('\nFraming (x: -1 = left edge, +1 = right edge):');
const framingRows = [];
const leftFramed = [];
for (const s of SUBJECTS) {
  for (const p of [s.from, (s.from + s.to) / 2, s.to]) {
    const f = frame(p, s);
    framingRows.push({
      subject: s.name,
      p: p.toFixed(2),
      screenX: f.x.toFixed(2),
      screenY: f.y.toFixed(2),
      sizeDeg: f.angular.toFixed(0),
      onScreen: f.onScreen ? 'yes' : 'NO',
    });
    // Content sits in the left column on desktop, so a hero subject centred
    // left of about -0.15 is competing with the text. Only checked at the end
    // of a subject's window, where it should have settled: a subject sweeping
    // in from the left mid-transit is expected, not a fault.
    if (p === s.to && f.onScreen && f.x < -0.15 && f.angular < 60) {
      leftFramed.push(`${s.name} at p=${p.toFixed(2)} (x=${f.x.toFixed(2)})`);
    }
  }
}
console.table(framingRows);

// The chandelier's tallest and lowest parts, in its own local space.
const RIG_TOP = 5.3;
const RIG_BOTTOM = -4.9;
const s = LAYOUT.chandelierScale;
const top = RIG_TOP * s + LAYOUT.chandelierPos[1];
const bottom = RIG_BOTTOM * s + LAYOUT.chandelierPos[1];
const fits = bottom > FLOOR_Y && top < CEILING_Y;

const problems = [];
if (!monotonic) problems.push('camera reverses direction');
if (minAim <= 5) problems.push(`aim point comes within ${minAim.toFixed(2)} of the camera`);
if (maxTurn > 14) problems.push(`view whips at ${maxTurn.toFixed(1)} deg per 1% scroll`);
// A brief handover between subjects is a beat, not a fault. A long one is a
// hole. 10 samples is 2.5% of the scroll, roughly a second of travel.
const EMPTY_TOLERANCE = 10;
if (emptyAt.length > EMPTY_TOLERANCE)
  problems.push(
    `${emptyAt.length} scroll positions have nothing framed (${emptyAt[0]} to ${
      emptyAt[emptyAt.length - 1]
    })`
  );
if (leftFramed.length) problems.push(`subject framed under the text column: ${leftFramed.join(', ')}`);
if (!fits) problems.push('chandelier clips the corridor');

console.log('\nChecks:');
console.log('  keyframes                ', KEYS.length);
console.log('  camera z monotonic       ', monotonic ? 'yes' : 'NO');
console.log('  min camera-to-aim dist   ', minAim.toFixed(2), `(p=${minAimAt.toFixed(2)})`);
console.log('  peak turn rate           ', maxTurn.toFixed(1), `deg per 1% (p=${maxTurnAt.toFixed(2)})`);
console.log(
  '  chandelier in corridor   ',
  `y ${bottom.toFixed(2)} to ${top.toFixed(2)} vs ${FLOOR_Y}/${CEILING_Y} ->`,
  fits ? 'fits' : 'CLIPS'
);

if (problems.length) {
  console.error('\nFAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('\nAll checks passed.');
