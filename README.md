# MUIDSI Quantum Hackathon Fall Fest

An interactive 3D scrollytelling site for the MUIDSI Quantum Hackathon Fall Fest at the University of Missouri.

Scrolling drives a cinematic camera through four phases (Earth, Satellite, Interior, Quantum Chandelier) while the event information scrolls over the top in glassmorphic panels.

---

## Running it

Node.js v24 is installed at `%LOCALAPPDATA%\Programs\nodejs` as a portable zip install, because winget's package index is broken on this machine. If `node` is not found, open a new terminal so the updated PATH is picked up.

```bash
npm install
```

```bash
npm run dev
```

Vite serves at http://localhost:5173.

To build for production:

```bash
npm run build
```

---

## Stack

| Purpose         | Package                                          |
| --------------- | ------------------------------------------------ |
| UI              | React 18, Tailwind CSS 3                          |
| 3D              | Three.js, React Three Fiber, Drei                 |
| Post-processing | `@react-three/postprocessing` (bloom + vignette)  |
| Scroll          | GSAP ScrollTrigger                                |
| Build           | Vite 5                                            |

Type is IBM Plex (Sans, Sans Condensed, Mono). That is a deliberate choice rather than a default: IBM Plex is the typeface of the quantum computing world these students will be working in, so it matches Qiskit and IBM Quantum documentation.

---

## How the scroll system works

There is exactly one source of truth for scroll position:

```
useScrollDriver()  ──writes──▶  scrollState.progress   (raw, 0 to 1)
CameraRig          ──damps───▶  scrollState.smoothed   (what everything reads)
```

`scrollState` is a plain module-level object, deliberately not React state. The camera samples it every frame inside `useFrame`, and routing that through React would re-render the tree 60 times a second. Components that genuinely need to re-render (the HUD terminal, the progress rail) poll it on `requestAnimationFrame` and only call `setState` when something meaningful changed.

### Files

```
src/
├── App.jsx                  page composition
├── data/content.js          ALL event copy lives here
├── scroll/
│   ├── scrollState.js       the shared progress object + phase boundaries
│   └── useScrollDriver.js   the single ScrollTrigger instance
├── three/
│   ├── Scene.jsx            <Canvas>, lighting, post-processing
│   ├── path.js              WORLD LAYOUT + CAMERA KEYFRAMES
│   ├── CameraRig.jsx        samples the path each frame
│   ├── Fade.jsx             cross-fades a stage over a scroll window
│   ├── textures.js          procedural canvas textures (no image assets)
│   ├── Earth.jsx            phase 1
│   ├── Satellite.jsx        phase 2
│   ├── Interior.jsx         phase 3
│   ├── Chandelier.jsx       phase 4
│   ├── HudTerminal.jsx      the typing terminal, via drei <Html transform>
│   └── Starfield.jsx        camera-locked star backdrop
└── ui/                      the scrolling HTML overlay
```

---

## The camera route

The camera always travels toward negative Z. Earth sits at **positive** Z, behind the departure path, so scrolling reads as leaving the planet rather than flying into it.

| World Z            | What is there                        |
| ------------------ | ------------------------------------ |
| `+60`              | Earth (radius 14), the opening shot   |
| `(486, 99, -158)`  | The sun, and the scene's key light    |
| `-90`              | Orbital satellite                     |
| `-108` to `-190`   | Interior compute bay, server racks    |
| `-196`             | Quantum chandelier and HUD            |

The site opens framing the whole globe. As the camera pulls back the aim arcs round through +X, across the sun, until the camera faces its direction of travel with the satellite ahead of it.

Three things about that turnaround are load-bearing, and each one was a bug first:

**`look` is interpolated as a point, not a direction.** The aim has to swing wide so the interpolated target never passes through the camera position. If it does, `lookAt` goes degenerate and the view snaps.

**Adding keyframes does not slow a pan down.** Total rotation over scroll budget sets the rate; extra keys only redistribute it. The turn keys are generated at evenly spaced azimuths on a constant 220-unit radius, which is what makes an even, glide-paced sweep. Widening the scroll budget is the only way to actually slow it.

**Something has to be in frame the whole way round.** The sun exists largely for this reason: a 172-degree pan between two subjects otherwise crosses seconds of empty starfield. The Milky Way backdrop in `Starfield.jsx` covers the brief handovers.

The sun's azimuth is a three-way compromise between lighting the Earth's camera-facing side, keeping the terminator over the left of the disc where the hero text sits, and being crossed by the pan. Moving it breaks one of the three.

---

## Checking the choreography without a browser

```bash
node scripts/verify-path.mjs
```

Run it after touching `KEYS` in `path.js` or any window in `windows.js`. It imports the real values from `src/`, so it cannot drift out of date, and it builds an actual `PerspectiveCamera` to project each subject to screen space. It fails the build on: the camera reversing, the aim point approaching the camera, the view whipping faster than about 14 degrees per 1% of scroll, subjects framed left under the text column, the chandelier clipping the corridor, and stretches where nothing is framed.

That last check is the one worth keeping honest. An earlier version only asked whether a stage was *faded in*, and cheerfully passed while the camera panned across ten seconds of empty sky with the Earth at full opacity behind its shoulder. Opacity is not framing.

## Tuning the experience

**Camera choreography** lives in `src/three/path.js`. The `KEYS` array is the whole flight plan: each entry is `{ p, pos, look, roll, fov }` where `p` is scroll progress 0 to 1. Keys are deliberately unevenly spaced, which is the pacing. Segments are eased with smoothstep, so you can move a key without introducing a visible kink.

**When each stage appears** is set by a `*_WINDOW` constant in each stage component, a trapezoid `[fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]`. `<Fade>` reads it and scales every material's opacity beneath it. This is what lets the camera fly straight through the satellite hull without visibly clipping: the geometry is gone before the near plane reaches it.

`<Fade>` is fussier than it looks, and the fussiness is load-bearing. It records each material's authored `transparent`, `depthWrite` and `opacity` once, restores them exactly whenever a stage is fully visible, and disables depth writing outright while mid-fade. An earlier version toggled `depthWrite` per frame against the damped opacity, which made the chandelier's ~700 pieces flicker in and out as the value jittered across the threshold, and forced the glass enclosure opaque so it hid everything inside it.

**Content and camera sync** comes from section heights in `App.jsx` and the `<Spacer>` values between them. Lengthen a section and everything after it shifts later relative to the camera. The bottom-left phase readout is a quick way to check alignment while you tune.

**HUD placement**: `HudTerminal` is parented to the chandelier group in `Chandelier.jsx`. Its `position` and `rotation` are tuned against the final camera keyframe so the panel lands right of centre, clear of the content column. If you retune the last camera key, retune these together. Panel size is `distanceFactor` times div width: world width is roughly `pixelWidth * distanceFactor / 400`.

**Terminal log copy** is `TERMINAL_BLOCKS` in `src/data/content.js`. Each block types out, holds, then the next begins, looping forever. Lines containing `WARNING` or `ALERT` are coloured alert-orange automatically, whatever their block's tone.

---

## Replace before launch

- `public/universityLogo.png` is a generated placeholder, swap it for the real mark
- `public/qrCode.png` is a generated pattern and **is not a scannable code**
- `EVENT.registerUrl` in `src/data/content.js` is currently `#register`, point it at the real form

## Phase 5: swapping in real 3D models

The stage components are the seam. Each is a single `<Fade>` wrapping a `<group>`, so you can replace the geometry inside with a loaded GLTF and nothing else in the scene needs to change:

```jsx
const { scene } = useGLTF('/models/satellite.glb');
return (
  <Fade window={SAT_WINDOW} position={[0, 0, LAYOUT.satelliteZ]}>
    <primitive object={scene} />
  </Fade>
);
```

Two caveats:

- `<Fade>` animates `material.opacity`, so imported materials must tolerate `transparent = true`.
- The procedural Earth textures in `textures.js` are drop-in replaceable with real NASA albedo and cloud maps via `useTexture`. Only `Earth.jsx` needs to change.

---

## Accessibility and performance notes

- `prefers-reduced-motion` is honoured: camera damping snaps to near-instant and the idle drift is disabled.
- The canvas is `pointer-events-none`, so it never intercepts scroll, clicks, or keyboard focus.
- DPR is capped at 2. The chandelier's repeated parts (perforations, bolts, coax runs, attenuators, braids) are instanced, so roughly 700 pieces cost about 30 draw calls. The corridor's status LEDs are baked into textures rather than modelled, keeping phase 3 near 70 draw calls.
- The site is not wrapped in `<React.StrictMode>`. Its dev-only double mount runs effect cleanups between passes while preserving `useMemo` results, which would dispose every procedural texture and never recreate it. `src/main.jsx` explains this at the point it matters.
