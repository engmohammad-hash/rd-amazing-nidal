/* What every scene shares: renderer, studio lighting, maroon backdrop with the logo rings and a calligraphic
   watermark word, drifting dust, canvas helpers, and the layout that puts the object where the page copy is not.
   Scenes are rendered offline into frames by src/render.html, and drawn live by static/js/live.js on devices
   fast enough for it. 'three' comes from the page's import map (static/vendor/three.module.min.js, r160). */
import * as THREE from 'three';
export { THREE };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeIn = t => t * t * t;
export const sine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const smooth01 = x => x * x * (3 - 2 * x);
export const windowAmt = (p, a, b, f) => smooth01(clamp((p - a) / f)) * smooth01(clamp((b - p) / f));

// seeded random, so every render of a scene places fibres, cards and dust the same way
let seed = 20261027;
export const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const reseed = s => { seed = s >>> 0; };

export function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
export function grainOn(g, w, h, amt) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
export function contain(img, size) { const s = size / Math.max(img.width, img.height); return { w: img.width * s, h: img.height * s }; }
// white artwork on black, for alpha maps; `draw(g, w, h)` paints it in white
export function maskFrom(w, h, draw) {
  const c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  draw(g, w, h);
  return c;
}
export function whiteMask(img, w, h, size) {
  const c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const m = cnv(w, h), mg = m.getContext('2d'), d = contain(img, size);
  mg.drawImage(img, (w - d.w) / 2, (h - d.h) / 2, d.w, d.h);
  mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#fff'; mg.fillRect(0, 0, w, h);
  g.drawImage(m, 0, 0);
  return c;
}
export function normalFrom(mask, strength) {
  const w = mask.width, h = mask.height, c = cnv(w, h), g = c.getContext('2d');
  g.filter = 'blur(1.6px)'; g.drawImage(mask, 0, 0); g.filter = 'none';
  const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h), o = out.data;
  const H = (x, y) => src[(clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (H(x - 1, y) - H(x + 1, y)) * strength, ny = (H(x, y + 1) - H(x, y - 1)) * strength;
    const len = Math.hypot(nx, ny, 1), j = (y * w + x) * 4;
    o[j] = (nx / len * .5 + .5) * 255; o[j + 1] = (ny / len * .5 + .5) * 255; o[j + 2] = (1 / len * .5 + .5) * 255; o[j + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}
export function edgeArt(img, size, rgb) {
  const d = contain(img, size), w = Math.round(d.w), h = Math.round(d.h);
  const c = cnv(w, h), g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h), o = out.data;
  const A = (x, y) => src[(clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) * 4 + 3] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const m = Math.min(1, Math.hypot(A(x + 1, y) - A(x - 1, y), A(x, y + 1) - A(x, y - 1)) * 1.5), j = (y * w + x) * 4;
    o[j] = rgb[0]; o[j + 1] = rgb[1]; o[j + 2] = rgb[2]; o[j + 3] = m * 235;
  }
  g.putImageData(out, 0, 0);
  return c;
}
// an eight-point star lattice, the classic Islamic geometric pattern, drawn as white lines
export function starPattern(g, w, h, cell, lw) {
  g.lineWidth = lw; g.lineJoin = 'round';
  for (let y = -cell; y < h + cell; y += cell) for (let x = -cell; x < w + cell; x += cell) {
    const cx = x + cell / 2, cy = y + cell / 2, r = cell * .42, r2 = cell * .2;
    g.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8 + Math.PI / 16, rr = k % 2 ? r2 : r;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(x, cy); g.lineTo(x + cell, cy); g.moveTo(cx, y); g.lineTo(cx, y + cell); g.stroke();
  }
}

export const PALETTE = {
  maroon: '#4B0129', maroonDeep: '#2A0016', maroonSoft: '#620E3A',
  beige: '#D6C1A0', beigeLight: '#EADCC2', beigeDeep: '#B99C70', cream: '#F4ECDF', ink: '#2B0716',
};

export async function createStage(canvas, { assets, live = false }) {
  // offline renders read every frame back, so they keep the drawing buffer; a live page never reads it
  const opts = { alpha: false, antialias: true, preserveDrawingBuffer: !live, powerPreference: live ? 'high-performance' : 'default' };
  const context = canvas.getContext('webgl2', opts);
  if (!context) throw new Error('no webgl2');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: !live });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x14000b, 1);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const colorTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
  const dataTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = aniso; return t; };

  await Promise.all([
    document.fonts.load('700 120px "Aref Ruqaa"', 'نطبع الفخامة'),
    document.fonts.load('500 40px "IBM Plex Sans Arabic"', 'كروت علب'),
    document.fonts.load('400 28px "IBM Plex Sans Arabic"', 'المملكة'),
    document.fonts.load('600 40px "Cormorant Garamond"', 'RD Amazing'),
  ]);
  const [logoColor, logoBeige] = await Promise.all([loadImg(assets + 'logo-color.png'), loadImg(assets + 'logo-beige.png')]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.set(0, 0, 10);
  {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x12040b);
    const geo = new THREE.PlaneGeometry(1, 1);
    const panel = (hex, k, w, h, x, y, z) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
      m.scale.set(w, h, 1); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(0xfff0dc, 5, 9, 3, 0, 7, 3);
    panel(0xffe4c0, 3, 2.5, 7, -8, 1, 3);
    panel(0xffd7ae, 2.2, 2.5, 7, 8, .5, -2);
    panel(0x8a2c55, 1.3, 14, 6, 0, -6, 0);
    panel(0xfff6ea, 2.6, 4, 2, 2, 2, 9);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, .035).texture;
    pmrem.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x2a0618, .75));
  const key = new THREE.DirectionalLight(0xffecd6, 2.3); key.position.set(4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8ab6, 1.5); rim.position.set(-6, 2.5, -5); scene.add(rim);

  const rig = new THREE.Group(); scene.add(rig);
  const glint = new THREE.PointLight(0xfff3e2, 0, 0, 2); rig.add(glint);

  const mats = {
    steel: new THREE.MeshStandardMaterial({ color: 0xbdb6ac, metalness: 1, roughness: .28 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a97c, metalness: 1, roughness: .32 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b0519, roughness: .5, metalness: .3 }),
    foilOpts: {
      color: 0xe8d1a8, metalness: 1, roughness: .2, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, clearcoat: .6, clearcoatRoughness: .18,
    },
  };
  // metallic print (hot foil) from a white-on-black mask
  const foil = (mask, extra = {}) => new THREE.MeshPhysicalMaterial({
    ...mats.foilOpts, alphaMap: dataTex(mask), normalMap: dataTex(normalFrom(mask, 5)), normalScale: new THREE.Vector2(.9, .9), ...extra,
  });

  /* ---------- dust ---------- */
  const PN = 150, pBase = new Float32Array(PN * 3), pSpd = new Float32Array(PN), pPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pBase[i * 3] = (rand() - .5) * 14; pBase[i * 3 + 1] = (rand() - .5) * 9.2; pBase[i * 3 + 2] = -3 + rand() * 5; pSpd[i] = .04 + rand() * .1; }
  pPos.set(pBase);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dotC = cnv(64, 64);
  { const g = dotC.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .07, map: dataTex(dotC), color: 0xe8d3ae, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---------- backdrop: gradient, logo rings, big words ---------- */
  const bgC = cnv(16, 16), bgTex = colorTex(bgC);
  scene.background = bgTex;
  function paintBackground(W, H, cx, cy, look) {
    if (live) { W = Math.ceil(W / 2); H = Math.ceil(H / 2); }
    bgC.width = W; bgC.height = H;
    const g = bgC.getContext('2d'), x = cx * W, y = cy * H;
    const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 1.05);
    if (look === 'cream') {
      gr.addColorStop(0, '#FBF6EE'); gr.addColorStop(.45, '#F1E7D7'); gr.addColorStop(1, '#DCCBB0');
    } else if (look === 'ink') {
      gr.addColorStop(0, '#3A2A2E'); gr.addColorStop(.5, '#1E1417'); gr.addColorStop(1, '#0E090A');
    } else {
      gr.addColorStop(0, '#5E0C36'); gr.addColorStop(.24, '#3B0322'); gr.addColorStop(.55, '#22020F'); gr.addColorStop(1, '#14000B');
    }
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grainOn(g, W, H, 4);   // just enough to stop banding without bloating the image files
    bgTex.dispose(); bgTex.needsUpdate = true;
  }
  const ringC = cnv(2048, 2048);
  {
    const g = ringC.getContext('2d'), k = 10.24;
    g.translate(1024, 1024); g.strokeStyle = 'rgba(214,193,160,.5)'; g.lineCap = 'round';
    const arc = (r, lw, from, dash) => {
      g.lineWidth = lw * k; g.beginPath();
      g.arc(0, 0, r * k, from * Math.PI / 180, (from + dash / (2 * Math.PI * r) * 360) * Math.PI / 180); g.stroke();
    };
    arc(96, .9, -140, 470); arc(88, .5, 95, 330); arc(92, .5, -62, 46); arc(92, .5, 58, 46);
  }
  const flatMat = map => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
  const RZ = -2.6, WZ = -2.4;
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flatMat(colorTex(ringC)));
  scene.add(ring);
  let words = [];
  function setWords(defs) {
    words.forEach(m => { scene.remove(m); m.material.map.dispose(); m.material.dispose(); });
    words = defs.map(([text, a, b]) => {
      const fs = 420, c = cnv(8, 8);
      let g = c.getContext('2d');
      g.font = `700 ${fs}px "Aref Ruqaa", serif`; g.direction = 'rtl';
      const wpx = Math.ceil(g.measureText(text).width + fs * .4), hpx = Math.ceil(fs * 1.5);
      c.width = wpx; c.height = hpx; g = c.getContext('2d');
      g.font = `700 ${fs}px "Aref Ruqaa", serif`; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const gr = g.createLinearGradient(0, 0, 0, hpx);
      gr.addColorStop(0, 'rgba(242,228,202,.40)'); gr.addColorStop(.62, 'rgba(214,193,160,.16)'); gr.addColorStop(1, 'rgba(214,193,160,.04)');
      g.fillStyle = gr; g.fillText(text, wpx / 2, hpx / 2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flatMat(colorTex(c)));
      m.material.opacity = 0; m.visible = false;
      m.userData = { a, b, ratio: wpx / hpx, base: 1 };
      scene.add(m);
      return m;
    });
  }

  /* ---------- layout ----------
     film: the object sits left on wide frames and high on tall ones, where the page copy is not.
     still: product photography, object centred, no rings or words. */
  const frame = { x: 0, y: 0, s: 1, mode: 'film' };
  let fontPx = 300, out = { w: 1, h: 1 };
  function resize(outW, outH, cssW, cssH, mode = 'film', look = 'maroon') {
    out = { w: outW, h: outH };
    renderer.setSize(outW, outH, false);
    const aspect = outW / outH, px = outW / cssW;
    camera.aspect = aspect;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    frame.mode = mode;
    if (mode === 'still') {
      camera.position.z = aspect < 1 ? 4.6 / (2 * tanH * aspect) : 8.2;
      frame.x = 0; frame.y = 0; frame.s = 1;
    } else if (aspect < .85) {
      camera.position.z = 4.7 / (2 * tanH * aspect);
      frame.x = 0; frame.y = 2 * camera.position.z * tanH * .17; frame.s = 1;
    } else {
      camera.position.z = 10;
      frame.x = -2 * 10 * tanH * aspect * .16; frame.y = -.08; frame.s = aspect < 1.3 ? .82 : 1;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const v = new THREE.Vector3(frame.x, frame.y, 0).project(camera);
    paintBackground(outW, outH, (v.x + 1) / 2, (1 - v.y) / 2, look);
    const along = z => (camera.position.z - z) / camera.position.z;
    const pxToWorld = (cssPx, z) => cssPx * px / outH * 2 * (camera.position.z - z) * tanH;
    ring.position.set(frame.x * along(RZ), frame.y * along(RZ), RZ);
    ring.scale.setScalar(pxToWorld(Math.min(Math.min(cssW, cssH) * .8, 780, cssW), RZ));
    ring.visible = dust.visible = mode !== 'still';
    fontPx = aspect < .85 ? clamp(.44 * cssW, 136, 240) : clamp(.30 * cssW, 144, 496);
    for (const m of words) {
      m.position.set(frame.x * along(WZ), frame.y * along(WZ), WZ);
      m.userData.base = pxToWorld(fontPx * 1.5, WZ);
    }
  }

  function updateCommon(p) {
    const t = p * 30;
    rig.position.set(frame.x, frame.y, 0);
    ring.rotation.z = -p * 210 * Math.PI / 180;
    for (const m of words) {
      const u = m.userData, k = frame.mode === 'still' ? 0 : windowAmt(p, u.a, u.b, .035), s = u.base * (.9 + .1 * k);
      m.material.opacity = k; m.visible = k > .003;
      m.scale.set(s * u.ratio, s, 1);
    }
    for (let i = 0; i < PN; i++) {
      const y = pBase[i * 3 + 1] + t * pSpd[i];
      pPos[i * 3 + 1] = ((y + 4.6) % 9.2 + 9.2) % 9.2 - 4.6;
    }
    pGeo.attributes.position.needsUpdate = true;
    dust.position.y = -p * 2.2;
  }

  return {
    THREE, renderer, scene, camera, rig, glint, key, rim, mats, foil, frame, colorTex, dataTex,
    logo: { color: logoColor, beige: logoBeige },
    setWords, resize, updateCommon,
    get size() { return out; },
    render() { renderer.render(scene, camera); },
  };
}
