import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  makeEarthTexture,
  makeEarthRoughness,
  makeEarthLights,
  makeCloudTexture,
  disposeAll,
} from './textures.js';
import { LAYOUT } from './path.js';
import { Fade } from './Fade.jsx';
import { EARTH_WINDOW } from './windows.js';

/**
 * Atmospheric scattering shell.
 *
 * An earlier version was a plain Fresnel term at power 3, which produced a
 * hard saturated blue ring around the planet that read as a cartoon outline.
 * Two changes fix that:
 *
 *  1. The rim is built from two Fresnel terms at different exponents, a tight
 *     bright edge over a broad soft haze, instead of one hard band.
 *  2. It is modulated by the sun term, so the glow is strong on the lit limb
 *     and falls away to almost nothing on the night side, the way real
 *     atmospheric scattering does. A ring of even brightness all the way round
 *     an unlit planet is the thing that looks fake.
 *
 * The shell is FrontSide, and that matters. On a BackSide shell you are looking
 * at the far hemisphere, where the surface normal points away from the camera,
 * so dot(normal, viewDir) is negative everywhere and the Fresnel term clamps to
 * a flat 1. That produces a band of perfectly even brightness with no falloff
 * at all, which is exactly what a hand-drawn outline looks like. FrontSide
 * shows the near hemisphere, where the term actually ramps from 0 at the centre
 * of the disc to 1 at the limb.
 */
const atmosphereShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#5AA9FF') },
    uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    uOpacity: { value: 1 },
    uIntensity: { value: 0.8 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uSunDir;
    uniform float uOpacity;
    uniform float uIntensity;
    varying vec3 vNormalW;
    varying vec3 vViewDir;

    void main() {
      vec3 n = normalize(vNormalW);
      float vd = max(dot(n, normalize(vViewDir)), 0.0);

      // Tight bright edge plus a broad soft haze.
      float rim  = pow(1.0 - vd, 4.0);
      float haze = pow(1.0 - vd, 2.0);

      // Day/night falloff, with a little wrap so the terminator glows.
      float sun = dot(n, normalize(uSunDir));
      float lit = smoothstep(-0.35, 0.35, sun);

      float a = (rim * 0.8 + haze * 0.09) * lit * uOpacity;
      gl_FragColor = vec4(uColor * uIntensity, a);
    }
  `,
};


/** World-space direction from the scene toward the sun. */
const SUN_DIR_WORLD = new THREE.Vector3(...LAYOUT.sunPos).normalize();

export function Earth() {
  const earthRef = useRef(null);
  const cloudRef = useRef(null);
  const atmoRef = useRef(null);

  const maps = useMemo(
    () => ({
      color: makeEarthTexture(),
      roughness: makeEarthRoughness(),
      lights: makeEarthLights(),
      clouds: makeCloudTexture(),
    }),
    []
  );

  /**
   * Sun direction in VIEW space, shared with the patched surface shader.
   * The stock material's `normal` is view-space, so the day/night test has to
   * happen there; this gets refreshed every frame as the camera moves.
   */
  const sunDirView = useMemo(() => ({ value: new THREE.Vector3() }), []);

  /**
   * The planet surface.
   *
   * Built imperatively rather than declaratively so it can be patched with
   * onBeforeCompile. The stock MeshStandardMaterial applies an emissive map
   * uniformly, which lit the city lights in broad daylight and made the
   * continents look like they were on fire. This masks emissive to the night
   * side, which is the only place city lights belong.
   */
  const surface = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: maps.color,
      roughnessMap: maps.roughness,
      roughness: 1,
      metalness: 0,
      emissiveMap: maps.lights,
      emissive: new THREE.Color('#ffb85c'),
      emissiveIntensity: 1.1,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirView = sunDirView;
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec3 uSunDirView;\nvoid main() {')
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #include <emissivemap_fragment>
          {
            // 1 on the night side, 0 in daylight, soft across the terminator.
            float sun = dot( normalize( normal ), normalize( uSunDirView ) );
            totalEmissiveRadiance *= smoothstep( -0.06, -0.34, sun );
          }
          `
        );
    };

    return mat;
  }, [maps, sunDirView]);

  useEffect(() => {
    return () => {
      disposeAll(maps.color, maps.roughness, maps.lights, maps.clouds);
      surface.dispose();
    };
  }, [maps, surface]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    // Slow signature rotation; clouds drift slightly faster than the surface.
    if (earthRef.current) earthRef.current.rotation.y += dt * 0.014;
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.019;

    // Refresh the view-space sun direction for the night-lights mask.
    sunDirView.value.copy(SUN_DIR_WORLD).transformDirection(state.camera.matrixWorldInverse);

    // The atmosphere works in world space, so it takes the world direction.
    if (atmoRef.current) atmoRef.current.uniforms.uSunDir.value.copy(SUN_DIR_WORLD);
  });

  const R = LAYOUT.earthRadius;

  return (
    <Fade window={EARTH_WINDOW} position={[0, 0, LAYOUT.earthZ]}>
      {/* Axial tilt, for the sake of looking like a real planet */}
      <group rotation={[0, 0, THREE.MathUtils.degToRad(23.4)]}>
        {/* Surface. Material is built in useMemo so it can be shader-patched. */}
        <mesh ref={earthRef} material={surface}>
          <sphereGeometry args={[R, 128, 128]} />
        </mesh>

        {/* Cloud shell */}
        <mesh ref={cloudRef} renderOrder={1}>
          <sphereGeometry args={[R * 1.014, 96, 96]} />
          <meshStandardMaterial
            map={maps.clouds}
            transparent
            opacity={0.44}
            depthWrite={false}
            roughness={1}
            metalness={0}
          />
        </mesh>

        {/* Atmospheric rim glow */}
        {/* Scale stays close to 1: push the shell out much further and its
            own limb separates from the planet's, drawing a second arc. */}
        <mesh scale={1.025} renderOrder={2}>
          <sphereGeometry args={[R, 64, 64]} />
          {/* <Fade> drives this material's uOpacity uniform by name. */}
          <shaderMaterial
            ref={atmoRef}
            args={[atmosphereShader]}
            transparent
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Fade>
  );
}
