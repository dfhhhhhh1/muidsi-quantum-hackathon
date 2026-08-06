import * as THREE from 'three';

/**
 * Procedural texture generation.
 *
 * Everything here is drawn to a canvas at runtime, so the site ships with zero
 * image assets and still gets a detailed Earth. When you swap in real NASA
 * texture maps (phase 5), replace the calls in Earth.jsx. The rest of the
 * scene does not care where the textures come from.
 */

/* ------------------------------------------------------------------ noise */

function hash2(x, y, seed) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + seed * 69069;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const fade = (t) => t * t * (3 - 2 * t);

/**
 * Value noise on a lattice that wraps horizontally at `period`, so the texture
 * tiles seamlessly around the sphere's equator (no visible longitude seam).
 */
function valueNoise(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const wrap = (v) => ((v % period) + period) % period;
  const x0 = wrap(xi);
  const x1 = wrap(xi + 1);

  const a = hash2(x0, yi, seed);
  const b = hash2(x1, yi, seed);
  const c = hash2(x0, yi + 1, seed);
  const d = hash2(x1, yi + 1, seed);

  const u = fade(xf);
  const v = fade(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Fractal Brownian motion, layered value noise, seam-safe in x. */
function fbm(u, v, { octaves = 5, basePeriod = 8, seed = 1, gain = 0.5, lacunarity = 2 } = {}) {
  let amp = 1;
  let sum = 0;
  let norm = 0;
  let period = basePeriod;

  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(u * period, v * period, period, seed + i * 101);
    norm += amp;
    amp *= gain;
    period *= lacunarity;
  }
  return sum / norm;
}

/* --------------------------------------------------------------- helpers */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function finish(canvas, { srgb = true, aniso = 8 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = aniso;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ----------------------------------------------------------------- earth */

/**
 * Land/ocean albedo map. Continents come from an fbm threshold.
 *
 * Rendered at 2048x1024 because the opening shot has the planet filling the
 * frame at ~58 degrees, where a 1024-wide map is visibly soft.
 */
export function makeEarthTexture(w = 2048, h = 1024) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const v = y / h;
    // Latitude: 0 at the equator, 1 at the poles.
    const lat = Math.abs(v - 0.5) * 2;
    // Squash noise sampling toward the poles so continents don't smear.
    const latSquash = Math.cos((v - 0.5) * Math.PI);

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const n = fbm(u, v * 0.5 + 0.25, { octaves: 6, basePeriod: 6, seed: 7 });
      const detail = fbm(u, v * 0.5 + 0.25, { octaves: 4, basePeriod: 26, seed: 31 });
      const elevation = n * 0.78 + detail * 0.22 - lat * 0.06 * (1 - latSquash);

      let r;
      let g;
      let b;

      if (elevation < 0.5) {
        // Ocean. Deep and saturated, brightening over the continental shelf.
        // Keeping the deeps genuinely dark is what gives the continents
        // something to stand out against.
        const t = smooth(0.26, 0.5, elevation);
        r = lerp(2, 12, t);
        g = lerp(12, 68, t);
        b = lerp(46, 124, t);
      } else {
        // Land. Saturated greens in the lowlands running through arid tan to
        // bare rock and snow.
        //
        // The contrast here is doing real work. An earlier pass used muted,
        // closely-spaced colours, and at any distance the continents dissolved
        // into the ocean and the whole planet read as grey murk. Land has to
        // be clearly lighter and warmer than water to register at all.
        const coast = smooth(0.5, 0.517, elevation);
        const t = smooth(0.54, 0.76, elevation);
        const arid = smooth(0.34, 0.7, detail);
        const alpine = smooth(0.72, 0.86, elevation);

        // Lowland green -> arid tan, then upward into rock.
        r = lerp(lerp(38, 172, arid), 148, t);
        g = lerp(lerp(116, 146, arid), 132, t);
        b = lerp(lerp(46, 78, arid), 118, t);

        // Snow on the highest ground.
        r = lerp(r, 236, alpine);
        g = lerp(g, 242, alpine);
        b = lerp(b, 248, alpine);

        // Narrow band of bright shallows right at the shoreline.
        r = lerp(30, r, coast);
        g = lerp(120, g, coast);
        b = lerp(168, b, coast);
      }

      // Polar ice, with a noisy edge so the caps aren't perfect circles.
      const iceEdge = 0.86 + fbm(u, v, { octaves: 3, basePeriod: 12, seed: 55 }) * 0.09;
      const ice = smooth(iceEdge, iceEdge + 0.09, lat);
      r = lerp(r, 236, ice);
      g = lerp(g, 244, ice);
      b = lerp(b, 252, ice);

      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return finish(canvas);
}

/** Roughness map: oceans are glossy, land is matte. Drives the specular glint. */
export function makeEarthRoughness(w = 512, h = 256) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const n = fbm(u, v * 0.5 + 0.25, { octaves: 6, basePeriod: 6, seed: 7 });
      const detail = fbm(u, v * 0.5 + 0.25, { octaves: 4, basePeriod: 26, seed: 31 });
      const elevation = n * 0.78 + detail * 0.22;
      // Water is glossy but NOT a mirror, and it has to be rougher than
      // instinct suggests. The ocean albedo is very dark, so even a dielectric's
      // 4% specular competes with it: at low roughness the sun becomes a
      // blown-out dot, and at middling roughness it becomes a broad pale sheen
      // that drowns the continents. High roughness spreads it thin enough to
      // read as sheen rather than glare.
      const g = elevation < 0.5 ? 200 : 242;
      const i = (y * w + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = g;
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return finish(canvas, { srgb: false });
}

/** Night-side city lights, clustered on land. Used as the emissive map. */
export function makeEarthLights(w = 1024, h = 512) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  let seed = 12345;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < 2600; i++) {
    const u = rand();
    const v = 0.12 + rand() * 0.76; // keep lights off the ice caps
    const n = fbm(u, v * 0.5 + 0.25, { octaves: 6, basePeriod: 6, seed: 7 });
    const detail = fbm(u, v * 0.5 + 0.25, { octaves: 4, basePeriod: 26, seed: 31 });
    const elevation = n * 0.78 + detail * 0.22;
    if (elevation < 0.54) continue; // land only, inset from the coast

    const x = u * w;
    const y = v * h;
    const r = 1 + rand() * 3.2;
    const a = 0.28 + rand() * 0.6;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grad.addColorStop(0, `rgba(255, 214, 150, ${a})`);
    grad.addColorStop(0.4, `rgba(255, 176, 92, ${a * 0.35})`);
    grad.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  return finish(canvas);
}

/**
 * Cloud shell: white RGB with fbm-driven alpha.
 *
 * The alpha ramp is deliberately wide and the peak deliberately short of
 * opaque. A narrow ramp up to full alpha turns the noise field into hard
 * detached white blobs that read as paint splatter rather than weather.
 */
export function makeCloudTexture(w = 2048, h = 1024) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const lat = Math.abs(v - 0.5) * 2;
    // Real cloud cover peaks at the equator and the mid-latitude storm belts,
    // and thins over the subtropics. Two lobes, gently.
    const band =
      0.62 +
      0.3 * Math.exp(-Math.pow((lat - 0.05) / 0.22, 2)) +
      0.34 * Math.exp(-Math.pow((lat - 0.6) / 0.24, 2)) -
      0.18 * Math.exp(-Math.pow((lat - 0.32) / 0.14, 2));

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const base = fbm(u, v * 0.5 + 0.25, {
        octaves: 7,
        basePeriod: 4,
        seed: 91,
        gain: 0.56,
      });
      const wisp = fbm(u, v * 0.5 + 0.25, { octaves: 5, basePeriod: 20, seed: 143 });
      const swirl = fbm(u, v * 0.5 + 0.25, { octaves: 3, basePeriod: 9, seed: 205 });

      // Wide ramp, and the result is scaled rather than pushed to 1.0.
      const coverage = base * 0.6 + wisp * 0.22 + swirl * 0.18;
      const density = smooth(0.36, 0.82, coverage) * band;

      const i = (y * w + x) * 4;
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = Math.round(Math.min(1, density) * 210);
    }
  }

  ctx.putImageData(img, 0, 0);
  return finish(canvas);
}

/* ---------------------------------------------------------------- sky --- */

/**
 * Milky Way band for the sky sphere, as an equirectangular map.
 *
 * Space that is only a scatter of point stars reads as empty, and the camera's
 * turnaround spends a while pointed at nothing else. A dust band gives those
 * moments something to be, and gives the whole scene a sense of depth that
 * points alone never manage.
 */
export function makeGalaxyTexture(w = 2048, h = 1024) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;

      // Centre line of the band, tilted and gently waved so it does not read
      // as a straight stripe wrapped round the sphere.
      const centre = 0.5 + 0.17 * Math.sin(u * Math.PI * 2) + 0.05 * Math.sin(u * Math.PI * 6 + 1.2);
      const dist = Math.abs(v - centre);

      // Broad glow plus a tighter, brighter core.
      const glow = Math.exp(-Math.pow(dist / 0.15, 2));
      const core = Math.exp(-Math.pow(dist / 0.055, 2));

      // Clumpy structure, and dark dust lanes cutting through it.
      const clump = fbm(u, v, { octaves: 6, basePeriod: 7, seed: 313, gain: 0.55 });
      const lane = fbm(u, v, { octaves: 4, basePeriod: 11, seed: 577 });
      const dust = smooth(0.38, 0.72, lane);

      let intensity = (glow * 0.55 + core * 0.85) * (0.35 + clump * 0.95);
      intensity *= 0.35 + dust * 0.75;
      intensity = Math.min(1, intensity);

      // Warm in the core, cooler out at the edges.
      const warm = core * 0.8;
      const r = intensity * lerp(96, 168, warm);
      const g = intensity * lerp(104, 150, warm * 0.6);
      const b = intensity * lerp(150, 132, warm * 0.3);

      const i = (y * w + x) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);

  // A dusting of unresolved stars concentrated along the band.
  let seed = 8821;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5000; i++) {
    const u = rand();
    const centre = 0.5 + 0.17 * Math.sin(u * Math.PI * 2) + 0.05 * Math.sin(u * Math.PI * 6 + 1.2);
    const v = centre + (rand() - 0.5) * 0.34;
    if (v < 0 || v > 1) continue;
    const a = 0.12 + rand() * 0.4;
    ctx.fillStyle = `rgba(210, 225, 255, ${a})`;
    ctx.fillRect(u * w, v * h, 1.2, 1.2);
  }
  ctx.globalCompositeOperation = 'source-over';

  return finish(canvas);
}

/* ------------------------------------------------------- hardware panels */

/** Tech panel texture for the satellite hull and server racks. */
export function makePanelTexture(w = 512, h = 512, tint = '#7a8596') {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  let seed = 4242;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Irregular panel plating.
  for (let i = 0; i < 90; i++) {
    const pw = 24 + rand() * 120;
    const ph = 24 + rand() * 120;
    const x = rand() * w;
    const y = rand() * h;
    const shade = 0.82 + rand() * 0.3;
    ctx.fillStyle = `rgba(${Math.round(122 * shade)}, ${Math.round(133 * shade)}, ${Math.round(
      150 * shade
    )}, 0.55)`;
    ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, pw, ph);
  }

  // Fine seam grid.
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= w; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i + 0.5, 0);
    ctx.lineTo(i + 0.5, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i + 0.5);
    ctx.lineTo(w, i + 0.5);
    ctx.stroke();
  }

  // Occasional indicator lights.
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(34,211,238,0.8)' : 'rgba(241,184,45,0.7)';
    ctx.fillRect(rand() * w, rand() * h, 3, 3);
  }

  const tex = finish(canvas);
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Server-rack front face: blade slots with rows of status LEDs.
 *
 * Baking the LEDs into one texture instead of one mesh per light is the
 * difference between ~60 draw calls in the corridor and ~700. Flicker is then
 * animated by modulating the material's emissiveIntensity per rack.
 */
export function makeRackFaceTexture(seedValue = 1, w = 256, h = 512) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#05080d';
  ctx.fillRect(0, 0, w, h);

  let s = Math.floor(seedValue * 9973) || 7;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const rows = 16;
  const rowH = h / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;

    // Blade chassis
    ctx.fillStyle = r % 2 === 0 ? '#11161f' : '#0d121a';
    ctx.fillRect(6, y + 2, w - 12, rowH - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, y + 2.5, w - 13, rowH - 5);

    // Vent grille
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (let v = 0; v < 10; v++) {
      ctx.fillRect(70 + v * 12, y + 6, 6, rowH - 12);
    }

    // Status LEDs, left edge
    for (let k = 0; k < 4; k++) {
      const on = rand();
      if (on < 0.2) continue;
      const gold = rand() > 0.76;
      const color = gold ? '241,184,45' : '34,211,238';
      const a = 0.55 + rand() * 0.45;
      const lx = 16 + k * 11;
      const ly = y + rowH / 2;

      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 9);
      grad.addColorStop(0, `rgba(${color},${a})`);
      grad.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(lx - 9, ly - 9, 18, 18);

      ctx.fillStyle = `rgba(${color},${Math.min(1, a + 0.3)})`;
      ctx.fillRect(lx - 2, ly - 2, 4, 4);
    }

    // Occasional activity bar on the right
    if (rand() > 0.55) {
      const bw = 10 + rand() * 46;
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      ctx.fillRect(w - 24 - bw, y + rowH / 2 - 1.5, bw, 3);
    }
  }

  return finish(canvas);
}

/** Disposes a batch of textures. Call from the owning component's cleanup. */
export function disposeAll(...textures) {
  for (const t of textures) t?.dispose?.();
}
