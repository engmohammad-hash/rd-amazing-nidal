/* The studio every product picture is taken in: a renderer, soft studio lighting with a warm reflection map, a
   painted backdrop in the site's colours (cream, maroon or ink), a soft shadow on the floor, and the brand's own
   artwork drawn on canvas: the logo, the name in Arabic, the eight-point star lattice, and a page of print.
   The light and the backdrops follow the first site's product scenes, so the old pictures and the new sit together.
   'three' comes from the page's import map (src/video/three.module.min.js, r160). */
import * as THREE from 'three';
export { THREE };

let seed = 20261030;
export const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const reseed = s => { seed = s >>> 0; };
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
export function grainOn(g, w, h, amt) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
export function contain(img, size) { const s = size / Math.max(img.width, img.height); return { w: img.width * s, h: img.height * s }; }
// white artwork on black, for alpha and bump maps; `draw(g, w, h)` paints it in white
export function maskFrom(w, h, draw) {
  const c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  draw(g, w, h);
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
// the classic eight-point star lattice, drawn as lines in the current stroke style
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
  }
}

export const C = {
  maroon: '#4B0129', maroonDeep: '#2A0016', maroonSoft: '#620E3A', wine: '#7A1B47',
  beige: '#D6C1A0', beigeLight: '#EADCC2', beigeDeep: '#B99C70', cream: '#F4ECDF', paper: '#FBF7F0',
  gold: '#C9A97C', goldBright: '#E4C690', ink: '#2B0716', kraft: '#B98A5A', charcoal: '#231C1E',
};
export const NAME = 'مطابع روعة التصاميم';
export const FONT = { head: '"Alexandria"', body: '"IBM Plex Sans Arabic"', script: '"Aref Ruqaa"' };

export async function createStage(canvas, { assets }) {
  const context = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: true });
  if (!context) throw new Error('no webgl2');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const colorTex = (c, repeat) => {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  const dataTex = (c, repeat) => {
    const t = new THREE.CanvasTexture(c); t.anisotropy = aniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };

  await Promise.all([
    document.fonts.load(`700 120px ${FONT.script}`, 'روعة التصاميم'),
    document.fonts.load(`700 40px ${FONT.head}`, 'مطابع روعة RD'),
    document.fonts.load(`500 40px ${FONT.head}`, 'مطابع روعة RD'),
    document.fonts.load(`400 28px ${FONT.body}`, 'المملكة RD'),
    document.fonts.load(`600 28px ${FONT.body}`, 'المملكة RD'),
  ]);
  const [logoColor, logoBeige] = await Promise.all([loadImg(assets + 'logo-color.png'), loadImg(assets + 'logo-beige.png')]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 4 / 3, .1, 200);
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
  const hemi = new THREE.HemisphereLight(0xfff1e0, 0x2a0618, .75); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffecd6, 2.3); key.position.set(4, 6, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8ab6, 1.3); rim.position.set(-6, 2.5, -5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff4e8, .5); fill.position.set(-5, 1, 6); scene.add(fill);
  const glint = new THREE.PointLight(0xfff3e2, 10, 0, 2); glint.position.set(-1.5, 1.6, 3); scene.add(glint);

  const rig = new THREE.Group(); scene.add(rig);

  /* ---------- materials everyone uses ---------- */
  const M = {
    gold: () => new THREE.MeshStandardMaterial({ color: 0xd9b77e, metalness: 1, roughness: .26 }),
    silver: () => new THREE.MeshStandardMaterial({ color: 0xd8d6d2, metalness: 1, roughness: .22 }),
    steel: () => new THREE.MeshStandardMaterial({ color: 0xbdb6ac, metalness: 1, roughness: .3 }),
    paper: (color = 0xfbf7f0, rough = .85) => new THREE.MeshStandardMaterial({ color, roughness: rough }),
    plain: (color, rough = .6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }),
    glass: (color = 0xffffff, rough = .04, opacity = .25) => new THREE.MeshPhysicalMaterial({
      color, roughness: rough, metalness: 0, transmission: 1, thickness: .4, ior: 1.5, transparent: true, opacity: 1,
      clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.2, specularIntensity: 1,
    }),
    acrylic: (color = 0xffffff) => new THREE.MeshPhysicalMaterial({
      color, roughness: .06, transmission: .96, thickness: .25, ior: 1.49, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.3,
    }),
    print: (canvas, opts = {}) => new THREE.MeshStandardMaterial({ map: colorTex(canvas), roughness: .62, ...opts }),
    gloss: (canvas, opts = {}) => new THREE.MeshPhysicalMaterial({ map: colorTex(canvas), roughness: .3, clearcoat: .7, clearcoatRoughness: .2, ...opts }),
  };
  // metallic print (hot foil) from a white-on-black mask
  const foil = (mask, extra = {}) => new THREE.MeshPhysicalMaterial({
    color: 0xe8d1a8, metalness: 1, roughness: .2, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, clearcoat: .6, clearcoatRoughness: .18,
    alphaMap: dataTex(mask), normalMap: dataTex(normalFrom(mask, 5)), normalScale: new THREE.Vector2(.9, .9), ...extra,
  });

  /* ---------- the backdrop and the floor shadow ---------- */
  const bgC = cnv(16, 16), bgTex = colorTex(bgC);
  scene.background = bgTex;
  const LOOKS = {
    cream: ['#FBF6EE', '#F1E7D7', '#DCCBB0'],
    sand: ['#F3E6D1', '#E2CDAB', '#C3A47A'],
    maroon: ['#5E0C36', '#3B0322', '#14000B'],
    ink: ['#3A2A2E', '#1E1417', '#0E090A'],
  };
  function paintBackground(W, H, look, cx = .5, cy = .45) {
    bgC.width = W; bgC.height = H;
    const g = bgC.getContext('2d'), stops = LOOKS[look] || LOOKS.cream;
    const gr = g.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, Math.max(W, H) * 1.05);
    gr.addColorStop(0, stops[0]); gr.addColorStop(look === 'maroon' ? .3 : .45, stops[1]); gr.addColorStop(1, stops[2]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grainOn(g, W, H, 4);
    bgTex.needsUpdate = true;
  }
  const blobC = cnv(256, 256);
  {
    const g = blobC.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.45, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  const blobTex = dataTex(blobC);
  // a soft contact shadow under whatever is in the picture: fitted to it after each set-up (see fitShadow), so it
  // always lies at the foot of the pieces, whether they stand or lie flat
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: .8, toneMapped: false, color: 0x000000 }));
  floorShadow.rotation.x = -Math.PI / 2; floorShadow.renderOrder = -1; scene.add(floorShadow);
  const shadow = () => new THREE.Group();   // kinds may still ask for one; the fitted shadow does the work
  function fitShadow(strength = .8) {
    const b = new THREE.Box3(), part = new THREE.Box3();
    rig.updateMatrixWorld(true);
    rig.traverseVisible(o => { if (o.isMesh) { part.setFromObject(o, true); b.union(part); } });
    if (b.isEmpty()) { floorShadow.visible = false; return; }
    const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z;
    floorShadow.visible = strength > 0;
    floorShadow.material.opacity = strength;
    floorShadow.scale.set(Math.max(sx * 1.35, 1.2), Math.max(sz * 1.35, sx * .35, .9), 1);
    floorShadow.position.set((b.min.x + b.max.x) / 2, b.min.y - .003, (b.min.z + b.max.z) / 2 + .05);
  }

  /* ---------- the brand's own artwork ---------- */
  const logo = { color: logoColor, beige: logoBeige };
  // the logo tinted any colour (for print in one ink, or a foil mask in white)
  const tinted = {};
  function logoIn(color) {
    if (tinted[color]) return tinted[color];
    const c = cnv(logoBeige.width, logoBeige.height), g = c.getContext('2d');
    g.drawImage(logoBeige, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return (tinted[color] = c);
  }
  function drawLogo(g, img, cx, cy, size) { const d = contain(img, size); g.drawImage(img, cx - d.w / 2, cy - d.h / 2, d.w, d.h); }
  function text(g, str, x, y, { size = 40, weight = 600, font = FONT.head, color = C.maroon, align = 'center', dir = 'rtl', alpha = 1, spacing } = {}) {
    g.save(); g.globalAlpha = alpha; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.direction = dir;
    g.font = `${weight} ${size}px ${font}, sans-serif`;
    if (spacing) g.letterSpacing = spacing + 'px';
    g.fillText(str, x, y); g.restore();
  }
  // paragraph lines standing in for body text: n bars of varied length
  function lines(g, x, y, w, n, { gap = 22, h = 7, color = 'rgba(75,1,41,.22)', align = 'right' } = {}) {
    g.save(); g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const lw = w * (i === n - 1 ? .55 : .82 + rand() * .18), lx = align === 'right' ? x + w - lw : align === 'center' ? x + (w - lw) / 2 : x;
      g.beginPath(); g.roundRect(lx, y + i * gap, lw, h, h / 2); g.fill();
    }
    g.restore();
  }
  function paper(W, H, top, bottom = top, amt = 6) {
    const c = cnv(W, H), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (amt) grainOn(g, W, H, amt);
    return c;
  }
  // a branded face: ground colour, optional star lattice, the logo, the name and a tagline
  function brandFace(W, H, { bg = C.maroon, bg2, ink = C.beigeLight, logoImg, pattern = .1, name = true, sub = 'طباعة شاملة', logoSize = .42, y = .44, nameSize = .075, border } = {}) {
    const c = paper(W, H, bg, bg2 || bg, 5), g = c.getContext('2d');
    if (pattern) { g.globalAlpha = pattern; g.strokeStyle = ink; starPattern(g, W, H, Math.round(Math.min(W, H) / 6), Math.max(2, W / 600)); g.globalAlpha = 1; }
    if (border) { g.strokeStyle = border; g.lineWidth = W / 140; g.strokeRect(W * .04, H * .04, W * .92, H * .92); }
    drawLogo(g, logoImg || logoIn(ink), W / 2, H * y, Math.min(W, H) * logoSize);
    if (name) text(g, NAME, W / 2, H * (y + logoSize * Math.min(W, H) / H * .62 + .06), { size: Math.min(W, H) * nameSize, color: ink, weight: 700 });
    if (name && sub) text(g, sub, W / 2, H * (y + logoSize * Math.min(W, H) / H * .62 + .06 + nameSize * 1.25 * Math.min(W, H) / H), { size: Math.min(W, H) * nameSize * .5, color: ink, weight: 400, font: FONT.body, alpha: .8 });
    return c;
  }

  /* ---------- shapes ---------- */
  // a box with its own picture on every face: faces = { px, nx, py, ny, pz, nz } of materials (the default is `side`)
  function box(w, h, d, faces, side) {
    const order = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), order.map(k => faces[k] || side));
  }
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // a flat cut piece (card, tag, plaque): `shape` extruded `depth`, its faces mapped from the shape's bounds
  function slabShape(shape, depth, front, sideMat, { bevel = 0, back } = {}) {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
    geo.computeBoundingBox();
    const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
    uv.needsUpdate = true;
    geo.translate(0, 0, -depth / 2);
    // ExtrudeGeometry groups: 0 = the two caps, 1 = the sides; split the back cap off so it can differ
    const mesh = new THREE.Mesh(geo, [front, sideMat]);
    if (back) {
      const b2 = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), back);
      const p2 = b2.geometry.attributes.position, u2 = b2.geometry.attributes.uv;
      for (let i = 0; i < p2.count; i++) u2.setXY(i, (p2.getX(i) - b.min.x) / (b.max.x - b.min.x), (p2.getY(i) - b.min.y) / (b.max.y - b.min.y));   // turned round, so it reads from behind
      b2.rotation.y = Math.PI; b2.position.z = -depth / 2 - bevel - .0008;
      const g = new THREE.Group(); g.add(mesh, b2); return g;
    }
    return mesh;
  }
  // a sheet of paper or cloth, with an optional bow (x curl) and sag (y curl)
  function sheet(w, h, mat, { curl = 0, sag = 0, seg = 32, wave = 0 } = {}) {
    const geo = new THREE.PlaneGeometry(w, h, seg, seg), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2);
      p.setZ(i, curl * x * x + sag * y * y + wave * Math.sin(x * 3.1 + y * 1.7) * .5);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }
  // a stack of n sheets, top one printed, the rest plain edges
  function stack(w, h, n, t, top, edge = 0xf6f1e8) {
    const g = new THREE.Group();
    const em = M.paper(edge, .9);
    const block = box(w, n * t, h, { py: top }, em);
    g.add(block);
    return g;
  }

  function strip(points, width, mat, { up = [0, 0, 1], seg = 120, twist = 0, along = 0 } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const pos = [], uv = [], idx = [], U = new THREE.Vector3(...up).normalize(), side = new THREE.Vector3();
    const len = curve.getLength();
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, p = curve.getPointAt(t), tan = curve.getTangentAt(t);
      side.crossVectors(tan, U).normalize();
      if (twist) side.applyAxisAngle(tan, twist * Math.sin(t * Math.PI));
      pos.push(p.x - side.x * width / 2, p.y - side.y * width / 2, p.z - side.z * width / 2, p.x + side.x * width / 2, p.y + side.y * width / 2, p.z + side.z * width / 2);
      // the texture runs down the strip (v) unless `along` gives its width:height, when it runs along it (u)
      if (along) uv.push(t * len / (width * along), 0, t * len / (width * along), 1); else uv.push(0, t * len / width, 1, t * len / width);
      if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = mat.clone(); m.side = THREE.DoubleSide;
    return new THREE.Mesh(geo, m);
  }

  /* ---------- framing ---------- */
  let out = { w: 1, h: 1 };
  function resize(outW, outH, look) {
    out = { w: outW, h: outH };
    renderer.setSize(outW, outH, false);
    camera.aspect = outW / outH; camera.updateProjectionMatrix();
    paintBackground(outW, outH, look);
  }
  // put the camera at distance `dist` from the target, from a direction given in degrees (yaw round, pitch down)
  function view({ yaw = 0, pitch = 18, dist = 9, target = [0, 0, 0], fov = 32 } = {}) {
    camera.fov = fov; camera.updateProjectionMatrix();
    const a = THREE.MathUtils.degToRad(yaw), b = THREE.MathUtils.degToRad(pitch);
    camera.position.set(target[0] + Math.sin(a) * Math.cos(b) * dist, target[1] + Math.sin(b) * dist, target[2] + Math.cos(a) * Math.cos(b) * dist);
    camera.lookAt(target[0], target[1], target[2]);
  }
  function clear() {
    rig.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture && m[k] !== blobTex) m[k].dispose(); m.dispose(); });
    });
    rig.clear(); rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); rig.scale.setScalar(1);
    key.position.set(4, 6, 7); key.intensity = 2.3; rim.intensity = 1.3; fill.intensity = .5; hemi.intensity = .75;
    glint.intensity = 10; glint.position.set(-1.5, 1.6, 3); hemi.groundColor.set(0x2a0618);
    renderer.toneMappingExposure = 1.05;
  }

  return {
    THREE, renderer, scene, camera, rig, key, rim, fill, hemi, glint, M, foil, colorTex, dataTex, logo, logoIn, drawLogo, text, lines, paper,
    brandFace, box, roundedRect, slabShape, sheet, stack, strip, shadow, fitShadow, resize, view, clear,
    render() { renderer.render(scene, camera); },
    get size() { return out; },
  };
}
