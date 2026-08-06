import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { scrollState } from '../scroll/scrollState.js';
import { CameraRig } from './CameraRig.jsx';
import { LAYOUT } from './path.js';
import { Starfield } from './Starfield.jsx';
import { Sun } from './Sun.jsx';
import { Earth } from './Earth.jsx';
import { Satellite } from './Satellite.jsx';
import { Interior } from './Interior.jsx';
import { Chandelier } from './Chandelier.jsx';

/**
 * The fixed 3D layer. Sits behind the scrolling HTML with pointer events
 * disabled so it never intercepts scroll or clicks.
 */
export function Scene({ reducedMotion = false }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [0, 4, 35], fov: 55, near: 0.1, far: 900 }}
        onCreated={({ gl, scene, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          scene.fog = new THREE.FogExp2('#03050a', 0.0026);

          // Dev-only handle for inspecting the scene from the console, e.g.
          // __q.scene.traverse(...) or __q.scroll.smoothed. Stripped in prod.
          if (import.meta.env.DEV) {
            window.__q = { gl, scene, camera, scroll: scrollState };
          }
        }}
      >
        <color attach="background" args={['#03050a']} />

        <Lighting />

        <Suspense fallback={null}>
          <Starfield />
          <Sun />
          <Earth />
          <Satellite />
          <Interior />
          <Chandelier />
          <Preload all />
        </Suspense>

        <CameraRig reducedMotion={reducedMotion} />

        <EffectComposer disableNormalPass multisampling={0}>
          {/* Threshold is high on purpose: bloom is for genuinely emissive
              things (the chip, LEDs, the sun, the HUD), not for lit surfaces.
              Lower it and the Earth's daylit side starts glowing and goes grey. */}
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.22}
            mipmapBlur
            radius={0.6}
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

/** Global lighting rig. Warm key from the sun side, cool fill from space. */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.12} color="#8fb6ff" />

      {/* Key light, positioned at the visible sun so the two agree. A
          directional light travels from its position toward the origin, so
          LAYOUT.sunPos sitting at negative Z is what lights the face of the
          Earth (centred at +60Z) that the camera looks at during phase 1, with
          the terminator falling near the right edge rather than flat-on. */}
      <directionalLight
        position={LAYOUT.sunPos}
        intensity={3.4}
        color="#fff4e0"
        castShadow={false}
      />

      {/* Cool rim from the opposite side so silhouettes never go fully black */}
      <directionalLight position={[-70, -18, 40]} intensity={0.5} color="#3b6fd4" />

      {/* Gentle bounce so the satellite's shadow side stays readable */}
      <hemisphereLight args={['#2a3f66', '#05070c', 0.5]} />
    </>
  );
}
