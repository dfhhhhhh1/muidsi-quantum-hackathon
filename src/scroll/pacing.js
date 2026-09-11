import { clamp01, smoothstep } from '../three/fade.js';

/**
 * ============================================================================
 * SCROLL PACING
 * ============================================================================
 * The camera used to advance in lockstep with the scrollbar, so the flight kept
 * moving at full speed while a section sat on screen waiting to be read. This
 * module remaps scroll position -> path position: the camera crawls while a
 * section holds the viewport and makes the time back up in the gaps between
 * them, so the same scroll still covers the same path end to end.
 *
 * The remap is built by integrating a speed profile rather than by writing the
 * curve directly. Three things fall out of that, all of which we want:
 *
 *  - The profile ramps between fast and slow with smoothstep, so its integral
 *    has no kinks. The camera eases into and out of every slowdown instead of
 *    changing pace on a single frame.
 *  - The profile is strictly positive, so the integral is strictly increasing.
 *    Scrolling down can never walk the camera backwards.
 *  - Normalizing by the total integral guarantees the remap still spans 0 -> 1,
 *    so no part of the authored path is lost or clipped.
 *
 * Zones are measured from the DOM, not hardcoded, so editing copy or adding a
 * section re-paces the flight automatically.
 */

/**
 * Camera speed while a section is being read, as a fraction of its speed in the
 * gaps. Lower means a calmer background to read against and a faster run
 * between sections. Below about 0.25 the transit legs start to feel like a
 * lurch, because the speed the gaps have to make up rises as this falls.
 */
const DWELL_SPEED = 0.38;

/**
 * How much of a viewport edge a content block may hang over and still count as
 * being read. 0.1 means the slow zone holds from the moment the block is all
 * but fully on screen until it is all but fully gone.
 */
const MARGIN_VH = 0.22;

/**
 * How much scroll the ease in and ease out take, in viewport heights. This is
 * the "not immediate" part: the speed change is spread over roughly a third of
 * a screen at each end. Where two sections sit close together the ramps overlap
 * and the camera simply never reaches full speed between them, which is the
 * right answer for a pair of sections that read as one block.
 */
const RAMP_VH = 0.3;

/** Lookup table resolution. 1024 samples is ~0.1% of the path per step. */
const STEPS = 1024;

/**
 * Measures the slow zone of every element tagged `data-dwell`, in raw
 * scroll-progress units. Returns null when the page has no scroll range yet,
 * which callers treat as "no pacing, pass scroll straight through".
 *
 * Tag the text block, not the section box. Sections here are tall and mostly
 * empty space, so measuring the box makes the slow zones meet end to end and
 * leaves the gaps no room to speed up in.
 */
export function measureDwellZones() {
  const vh = window.innerHeight;
  const range = document.documentElement.scrollHeight - vh;
  if (!(range > 0) || !(vh > 0)) return null;

  const scrolled = window.scrollY;
  const zones = [];

  for (const el of document.querySelectorAll('[data-dwell]')) {
    const top = el.getBoundingClientRect().top + scrolled;
    const height = el.offsetHeight;
    if (!(height > 0)) continue;

    // Two scroll positions: where the block has just finished arriving, and
    // where it is just about to leave. Which one comes first depends on
    // whether the block is shorter or taller than the viewport, so take them
    // in whichever order they fall. A block taller than the screen therefore
    // stays slow for the whole time it is covering it.
    const arrived = top + height - (1 - MARGIN_VH) * vh;
    const leaving = top - MARGIN_VH * vh;

    zones.push({
      a: Math.min(arrived, leaving) / range,
      b: Math.max(arrived, leaving) / range,
      ramp: (RAMP_VH * vh) / range,
    });
  }

  return zones.length ? zones : null;
}

/**
 * How firmly the page is parked on content at raw progress `u`.
 * 0 = in a gap between sections, 1 = a section fully owns the viewport.
 *
 * Overlapping zones combine with max, not sum, so two sections close together
 * slow the camera the same amount one does instead of stalling it.
 */
export function dwellAt(u, zones) {
  if (!zones) return 0;
  let hold = 0;
  for (const z of zones) {
    const on = smoothstep(z.a - z.ramp, z.a, u) * (1 - smoothstep(z.b, z.b + z.ramp, u));
    if (on > hold) hold = on;
  }
  return hold;
}

/** Camera speed multiplier at raw progress `u`, before normalization. */
function speedAt(u, zones) {
  return 1 - (1 - DWELL_SPEED) * dwellAt(u, zones);
}

/**
 * Integrates the speed profile into a normalized lookup table mapping raw
 * scroll progress to path progress. Built once per layout, sampled per frame.
 */
export function buildPacing(zones) {
  if (!zones) return null;

  const table = new Float64Array(STEPS + 1);
  const du = 1 / STEPS;
  let acc = 0;
  let prev = speedAt(0, zones);

  for (let i = 1; i <= STEPS; i++) {
    const w = speedAt(i * du, zones);
    acc += ((prev + w) / 2) * du; // trapezoid
    table[i] = acc;
    prev = w;
  }

  const total = acc || 1;
  for (let i = 0; i <= STEPS; i++) table[i] /= total;
  table[STEPS] = 1; // kill any floating-point shortfall at the very end

  return table;
}

/** Reads the remapped path progress for raw scroll progress `u`. */
export function samplePacing(table, u) {
  const x = clamp01(u);
  if (!table) return x;
  const f = x * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(f));
  return table[i] + (table[i + 1] - table[i]) * (f - i);
}
