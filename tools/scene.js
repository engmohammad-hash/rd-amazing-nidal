/* The RD Amazing print story in 3D: a sheet is designed and printed, a business card is foil-stamped,
   and the cards are boxed. Used offline by tools/render.html to render the frames the site plays on scroll;
   the site itself never runs this. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const sine = t => -(Math.cos(Math.PI * t) - 1) / 2;
const smooth01 = x => x * x * (3 - 2 * x);
const windowAmt = (p, a, b, f) => smooth01(clamp((p - a) / f)) * smooth01(clamp((b - p) / f));

// seeded random, so every render of the story places fibres, cards and dust the same way
let seed = 20261026;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function grainOn(g, w, h, amt) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
function contain(img, size) { const s = size / Math.max(img.width, img.height); return { w: img.width * s, h: img.height * s }; }
function whiteMask(img, w, h, size) {
  const c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const m = cnv(w, h), mg = m.getContext('2d'), d = contain(img, size);
  mg.drawImage(img, (w - d.w) / 2, (h - d.h) / 2, d.w, d.h);
  mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#fff'; mg.fillRect(0, 0, w, h);
  g.drawImage(m, 0, 0);
  return c;
}
function normalFrom(mask, strength) {
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
function edgeArt(img, size, rgb) {
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

export async function createStory(canvas, { assets = '../demo/assets/' } = {}) {
  const context = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: true });
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: true });
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

  /* ---------- scene, camera, light ---------- */
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

  const steel = new THREE.MeshStandardMaterial({ color: 0xbdb6ac, metalness: 1, roughness: .28 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a97c, metalness: 1, roughness: .32 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b0519, roughness: .5, metalness: .3 });

  /* ---------- the sheet: paper, sketch layer, print layer ---------- */
  const PW = 1024, PH = 1448, K = PW / 1024;
  const L = { border: 56, logoCY: 400, logoSize: 560, headY: 872, ruleY: 952, latinY: 1012, bandY: 1130 };
  const BW_ = 1024 - 2 * L.border, BH_ = L.bandY - L.border - 40;

  const paper = cnv(PW, PH);
  {
    const g = paper.getContext('2d');
    g.fillStyle = '#F4ECDF'; g.fillRect(0, 0, PW, PH);
    grainOn(g, PW, PH, 9);
    g.strokeStyle = 'rgba(138,122,102,.07)'; g.lineWidth = 1;
    for (let i = 0; i < 320; i++) {
      const x = rand() * PW, y = rand() * PH, l = 6 + rand() * 22, a = rand() * Math.PI;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }

  const print = cnv(PW, PH);
  {
    const g = print.getContext('2d');
    g.drawImage(paper, 0, 0);
    g.save(); g.scale(K, K);
    g.fillStyle = '#4B0129'; g.fillRect(0, L.bandY, 1024, 1448 - L.bandY);
    g.strokeStyle = '#B99C70'; g.lineWidth = 3; g.strokeRect(L.border, L.border, BW_, BH_);
    g.lineWidth = 1.4; g.strokeRect(L.border + 12, L.border + 12, BW_ - 24, BH_ - 24);
    const d = contain(logoColor, L.logoSize);
    g.drawImage(logoColor, 512 - d.w / 2, L.logoCY - d.h / 2, d.w, d.h);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.direction = 'rtl'; g.fillStyle = '#4B0129'; g.font = '700 132px "Aref Ruqaa", serif';
    g.fillText('نطبع الفخامة', 512, L.headY);
    g.strokeStyle = '#B99C70'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(312, L.ruleY); g.lineTo(496, L.ruleY); g.moveTo(528, L.ruleY); g.lineTo(712, L.ruleY); g.stroke();
    g.save(); g.translate(512, L.ruleY); g.rotate(Math.PI / 4); g.fillStyle = '#B99C70'; g.fillRect(-7, -7, 14, 14); g.restore();
    g.direction = 'ltr'; g.fillStyle = '#6B2A45'; g.font = '600 30px "Cormorant Garamond", serif';
    if ('letterSpacing' in g) g.letterSpacing = '8px';
    g.fillText('RD AMAZING · PRINTING HOUSE', 512, L.latinY);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.direction = 'rtl'; g.fillStyle = '#E4D2B2'; g.font = '500 44px "IBM Plex Sans Arabic", sans-serif';
    g.fillText('كروت · علب · دعوات · أكياس', 512, L.bandY + 150);
    g.globalAlpha = .7; g.font = '400 28px "IBM Plex Sans Arabic", sans-serif';
    g.fillText('المملكة العربية السعودية', 512, L.bandY + 215); g.globalAlpha = 1;
    g.restore();
  }

  const edge = edgeArt(logoBeige, Math.round(L.logoSize * K), [75, 1, 41]);
  const edgeD = contain(logoBeige, L.logoSize);

  function drawSketch(g, t) {
    if (t <= 0) return;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const ink = 'rgba(122,98,82,';
    let k = seg(t, 0, .2);
    if (k > 0) {
      g.setLineDash([]); g.strokeStyle = ink + '.6)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(954, 26); g.lineTo(954 - 884 * k, 26); g.moveTo(26, 70); g.lineTo(26, 70 + 1308 * k); g.stroke();
      if (k > .6) {
        g.globalAlpha = seg(k, .6, 1);
        g.font = '500 22px "IBM Plex Sans Arabic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
        g.fillStyle = '#F4ECDF'; g.fillRect(452, 12, 120, 28); g.fillStyle = ink + '.95)'; g.fillText('٢١٠ مم', 512, 27);
        g.save(); g.translate(26, 724); g.rotate(-Math.PI / 2);
        g.fillStyle = '#F4ECDF'; g.fillRect(-60, -14, 120, 28); g.fillStyle = ink + '.95)'; g.fillText('٢٩٧ مم', 0, 1);
        g.restore(); g.globalAlpha = 1;
      }
    }
    k = seg(t, .05, .3);
    if (k > 0) {
      const per = 2 * (BW_ + BH_);
      g.strokeStyle = ink + '.65)'; g.lineWidth = 2; g.setLineDash([per * k, per + 20]);
      g.beginPath(); g.moveTo(L.border + BW_, L.border); g.lineTo(L.border, L.border); g.lineTo(L.border, L.border + BH_);
      g.lineTo(L.border + BW_, L.border + BH_); g.closePath(); g.stroke(); g.setLineDash([]);
    }
    k = seg(t, .12, .38);
    if (k > 0) {
      g.setLineDash([8, 10]); g.strokeStyle = 'rgba(150,126,104,' + (.42 * k) + ')'; g.lineWidth = 1.4;
      const span = 1024 - 2 * L.border;
      g.beginPath();
      g.moveTo(512, L.border); g.lineTo(512, L.border + (1448 - 2 * L.border) * k);
      g.moveTo(1024 - L.border, L.logoCY); g.lineTo(1024 - L.border - span * k, L.logoCY);
      g.moveTo(1024 - L.border, L.headY - 38); g.lineTo(1024 - L.border - span * k, L.headY - 38);
      g.stroke(); g.setLineDash([]);
    }
    k = seg(t, .2, .5);
    if (k > 0) {
      g.strokeStyle = 'rgba(150,126,104,.55)'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(512, L.logoCY, 304, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
    }
    k = seg(t, .3, .72);
    if (k > 0) {
      g.save(); g.beginPath(); g.moveTo(512, L.logoCY);
      g.arc(512, L.logoCY, 420, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.closePath(); g.clip();
      g.drawImage(edge, 512 - edgeD.w / 2, L.logoCY - edgeD.h / 2, edgeD.w, edgeD.h);
      g.restore();
    }
    k = seg(t, .58, .84);
    if (k > 0) {
      g.save(); g.beginPath(); g.rect(1024 - 1024 * k, 0, 1024 * k, 1448); g.clip();
      g.font = '700 132px "Aref Ruqaa", serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.direction = 'rtl';
      g.strokeStyle = 'rgba(75,1,41,.75)'; g.lineWidth = 1.6; g.strokeText('نطبع الفخامة', 512, L.headY);
      g.restore();
    }
    k = seg(t, .74, 1);
    if (k > 0) {
      g.strokeStyle = ink + '.6)'; g.lineWidth = 2; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(1024, L.bandY); g.lineTo(1024 - 1024 * k, L.bandY); g.stroke(); g.setLineDash([]);
      g.globalAlpha = k; g.strokeStyle = 'rgba(185,156,112,.9)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(512 - 200 * k, L.ruleY); g.lineTo(512 + 200 * k, L.ruleY); g.stroke();
      g.font = '500 20px "IBM Plex Sans Arabic", sans-serif'; g.fillStyle = ink + '.9)'; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.direction = 'rtl';
      g.fillText('هامش القص ٣ مم', 1024 - 70, L.bandY - 14);
      g.globalAlpha = 1;
    }
  }

  const sheetCanvas = cnv(PW, PH), sheetCtx = sheetCanvas.getContext('2d');
  const sheetTex = colorTex(sheetCanvas), printTex = colorTex(print);
  function drawSheet(sk) {
    sheetCtx.drawImage(paper, 0, 0);
    sheetCtx.save(); sheetCtx.scale(K, K); drawSketch(sheetCtx, sk); sheetCtx.restore();
    sheetTex.needsUpdate = true;
  }
  const printFrac = { value: 0 };
  const sheetFace = new THREE.MeshStandardMaterial({ map: sheetTex, roughness: .86 });
  sheetFace.onBeforeCompile = sh => {
    sh.uniforms.printMap = { value: printTex };
    sh.uniforms.printFrac = printFrac;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D printMap;\nuniform float printFrac;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 sketchColor = texture2D( map, vMapUv );
          vec4 printedColor = texture2D( printMap, vMapUv );
          float edgeD = printFrac - vMapUv.y;
          float inked = smoothstep( 0.0, 0.003, edgeD );
          vec4 sheetColor = mix( sketchColor, printedColor, inked );
          float wet = inked * ( 1.0 - smoothstep( 0.0, 0.03, edgeD ) ) * step( printFrac, 0.999 );
          sheetColor.rgb *= 1.0 - 0.22 * wet;
          diffuseColor *= sheetColor;
        #endif`);
  };
  const SW = 1.8, SH = SW * Math.SQRT2;
  const paperSide = new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: .9 });
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, .006), [paperSide, paperSide, paperSide, paperSide, sheetFace, paperSide]);

  /* ---------- the press ---------- */
  const R = .26, RL = 2.5;
  const rollerTexC = cnv(1024, 64);
  {
    const g = rollerTexC.getContext('2d');
    g.fillStyle = '#5C0A34'; g.fillRect(0, 0, 1024, 64);
    for (let i = 0; i < 28; i++) { g.fillStyle = 'rgba(230,205,170,' + (i % 4 === 0 ? .16 : .06) + ')'; g.fillRect(i * 1024 / 28, 0, 3, 64); }
  }
  const rollerTex = colorTex(rollerTexC); rollerTex.wrapS = THREE.RepeatWrapping;
  const rollerGeo = new THREE.CylinderGeometry(R, R, RL, 96, 1, false); rollerGeo.rotateZ(Math.PI / 2);
  const shaftGeo = new THREE.CylinderGeometry(.07, .07, RL + .7, 32); shaftGeo.rotateZ(Math.PI / 2);
  const rollers = new THREE.Group();
  const rFront = new THREE.Mesh(rollerGeo, new THREE.MeshPhysicalMaterial({ map: rollerTex, roughness: .3, metalness: .1, clearcoat: 1, clearcoatRoughness: .14 }));
  rFront.position.z = R + .006;
  const rBack = new THREE.Mesh(rollerGeo, steel); rBack.position.z = -(R + .006);
  rFront.add(new THREE.Mesh(shaftGeo, brass)); rBack.add(new THREE.Mesh(shaftGeo, brass));
  rollers.add(rFront, rBack);
  for (const sx of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.45, 1.25), frameMat);
    plate.position.set(sx * (RL / 2 + .25), 0, 0); rollers.add(plate);
    for (const z of [R + .006, -(R + .006)]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .03, 40), brass);
      bolt.rotation.z = Math.PI / 2; bolt.position.set(sx * (RL / 2 + .315), 0, z); rollers.add(bolt);
    }
  }
  const press = new THREE.Group(); press.add(sheet, rollers); rig.add(press);

  /* ---------- business cards and the foil die ---------- */
  const CW = 1.9, CH = 1.086, CT = .022;
  const cardFrontC = cnv(1024, 586);
  {
    const g = cardFrontC.getContext('2d'), gr = g.createLinearGradient(0, 0, 1024, 586);
    gr.addColorStop(0, '#4A0428'); gr.addColorStop(1, '#2A0016'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 586);
    grainOn(g, 1024, 586, 7);
  }
  const cardBackC = cnv(1024, 586);
  {
    const g = cardBackC.getContext('2d');
    g.fillStyle = '#F3EBDD'; g.fillRect(0, 0, 1024, 586); grainOn(g, 1024, 586, 6);
    g.textAlign = 'center'; g.fillStyle = '#4B0129';
    g.direction = 'ltr'; g.font = '600 76px "Cormorant Garamond", serif'; g.fillText('RD Amazing', 512, 255);
    g.direction = 'rtl'; g.font = '500 36px "IBM Plex Sans Arabic", sans-serif'; g.fillText('مطبعة المطبوعات الفاخرة', 512, 322);
    g.strokeStyle = '#B99C70'; g.lineWidth = 2; g.beginPath(); g.moveTo(432, 372); g.lineTo(592, 372); g.stroke();
    g.globalAlpha = .75; g.font = '400 26px "IBM Plex Sans Arabic", sans-serif'; g.fillText('تصميم · طباعة · تشطيب · تغليف', 512, 425); g.globalAlpha = 1;
  }
  const cardFoilC = whiteMask(logoBeige, 1024, 586, 470);
  const cardGeo = new THREE.BoxGeometry(CW, CH, CT);
  const cardEdge = new THREE.MeshStandardMaterial({ color: 0xcfb28a, roughness: .42, metalness: .25 });
  const cardMats = [cardEdge, cardEdge, cardEdge, cardEdge,
    new THREE.MeshStandardMaterial({ map: colorTex(cardFrontC), color: 0x8a7d84, roughness: .72, envMapIntensity: .45 }),
    new THREE.MeshStandardMaterial({ map: colorTex(cardBackC), roughness: .8 })];
  const foilOpts = {
    color: 0xe8d1a8, metalness: 1, roughness: .2, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, clearcoat: .6, clearcoatRoughness: .18,
  };
  const cardFoilTex = dataTex(cardFoilC), cardFoilNTex = dataTex(normalFrom(cardFoilC, 5));
  const foilLive = new THREE.MeshPhysicalMaterial({ ...foilOpts, alphaMap: cardFoilTex, normalMap: cardFoilNTex, normalScale: new THREE.Vector2(.9, .9), opacity: 0 });
  const foilDone = new THREE.MeshPhysicalMaterial({ ...foilOpts, alphaMap: cardFoilTex, normalMap: cardFoilNTex, normalScale: new THREE.Vector2(.9, .9), opacity: 1 });
  const foilGeo = new THREE.PlaneGeometry(CW, CH);
  function makeCard(foil) {
    const m = new THREE.Mesh(cardGeo, cardMats);
    if (foil) { const f = new THREE.Mesh(foilGeo, foil); f.position.z = CT / 2 + .0012; m.add(f); }
    return m;
  }

  const stack = new THREE.Group(); rig.add(stack);
  const STACK = 7, step = CT + .003;
  for (let i = 0; i < STACK - 1; i++) {
    const c = makeCard(null);
    c.position.set((rand() - .5) * .03, (rand() - .5) * .03, i * step);
    c.rotation.z = (rand() - .5) * .035; stack.add(c);
  }
  const topZ = (STACK - 1) * step;
  const topCard = makeCard(foilLive); stack.add(topCard);

  const dieMat = new THREE.MeshStandardMaterial({ color: 0xc9a97c, metalness: 1, roughness: .3, emissive: 0x000000 });
  const die = new THREE.Group();
  const dieBlock = new THREE.Mesh(new THREE.BoxGeometry(1.35, .82, .26), dieMat);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 1.8, 32), steel); rod.rotation.x = Math.PI / 2; rod.position.z = .13 + .9;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .12, 48), brass); collar.rotation.x = Math.PI / 2; collar.position.z = .19;
  die.add(dieBlock, rod, collar); stack.add(die);
  const contactZ = topZ + CT / 2 + .13 + .002;

  /* ---------- the gift box ---------- */
  const BW = 2.5, BD = 1.62, BH = .46, T = .045;
  const boxOut = new THREE.MeshPhysicalMaterial({ color: 0x3d0321, roughness: .42, metalness: .05, clearcoat: .45, clearcoatRoughness: .35, sheen: .4, sheenRoughness: .5, sheenColor: new THREE.Color(0xe0c9a6) });
  const boxIn = new THREE.MeshStandardMaterial({ color: 0xd9c5a3, roughness: .9 });
  function wall(w, h, d, inner) { const mats = Array(6).fill(boxOut); mats[inner] = boxIn; return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); }
  const boxG = new THREE.Group(); rig.add(boxG);
  const base = new THREE.Group(); boxG.add(base);
  { const b = wall(BW, T, BD, 2); b.position.y = T / 2; base.add(b); }
  { const w = wall(BW, BH, T, 5); w.position.set(0, BH / 2, BD / 2 - T / 2); base.add(w); }
  { const w = wall(BW, BH, T, 4); w.position.set(0, BH / 2, -BD / 2 + T / 2); base.add(w); }
  { const w = wall(T, BH, BD - 2 * T, 0); w.position.set(-BW / 2 + T / 2, BH / 2, 0); base.add(w); }
  { const w = wall(T, BH, BD - 2 * T, 1); w.position.set(BW / 2 - T / 2, BH / 2, 0); base.add(w); }

  const boxCards = new THREE.Group(); boxCards.rotation.x = -Math.PI / 2; boxG.add(boxCards);
  for (let i = 0; i < 5; i++) {
    const c = makeCard(foilDone);
    c.position.set((rand() - .5) * .025, (rand() - .5) * .025, i * step);
    c.rotation.z = (rand() - .5) * .03; boxCards.add(c);
  }

  const LW = BW + 2 * T + .02, LD = BD + 2 * T + .02, LT = .05, LS = .24;
  const lid = new THREE.Group(); boxG.add(lid);
  { const m = wall(LW, LT, LD, 3); m.position.y = LS - LT / 2; lid.add(m); }
  { const m = wall(LW, LS - LT, T, 5); m.position.set(0, (LS - LT) / 2, LD / 2 - T / 2); lid.add(m); }
  { const m = wall(LW, LS - LT, T, 4); m.position.set(0, (LS - LT) / 2, -LD / 2 + T / 2); lid.add(m); }
  { const m = wall(T, LS - LT, LD - 2 * T, 0); m.position.set(-LW / 2 + T / 2, (LS - LT) / 2, 0); lid.add(m); }
  { const m = wall(T, LS - LT, LD - 2 * T, 1); m.position.set(LW / 2 - T / 2, (LS - LT) / 2, 0); lid.add(m); }
  const lidFoilC = whiteMask(logoBeige, 1024, 1024, 900);
  const lidFoil = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.08), new THREE.MeshPhysicalMaterial({
    ...foilOpts, opacity: 1, alphaMap: dataTex(lidFoilC), normalMap: dataTex(normalFrom(lidFoilC, 5)), normalScale: new THREE.Vector2(.9, .9),
  }));
  lidFoil.rotation.x = -Math.PI / 2; lidFoil.position.set(-.22, LS + .0015, 0); lid.add(lidFoil);
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xd8c29e, roughness: .36, metalness: .05, sheen: 1, sheenRoughness: .3, sheenColor: new THREE.Color(0xfff1d8) });
  { const r = new THREE.Mesh(new THREE.BoxGeometry(.2, .006, LD + .006), satin); r.position.set(.86, LS + .003, 0); lid.add(r); }
  for (const sz of [1, -1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.2, LS, .006), satin); r.position.set(.86, LS / 2, sz * (LD / 2 + .003)); lid.add(r); }
  const lidClosedY = BH - LS + LT;

  /* ---------- drifting dust, placed by time so every frame is reproducible ---------- */
  const PN = 150, pBase = new Float32Array(PN * 3), pSpd = new Float32Array(PN), pPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { pBase[i * 3] = (rand() - .5) * 14; pBase[i * 3 + 1] = (rand() - .5) * 9.2; pBase[i * 3 + 2] = -3 + rand() * 5; pSpd[i] = .04 + rand() * .1; }
  pPos.set(pBase);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dotC = cnv(64, 64);
  { const g = dotC.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .07, map: dataTex(dotC), color: 0xe8d3ae, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---------- backdrop: gradient, logo rings and the big words ---------- */
  const bgC = cnv(16, 16), bgTex = colorTex(bgC);
  scene.background = bgTex;
  function paintBackground(W, H, cx, cy) {
    bgC.width = W; bgC.height = H;
    const g = bgC.getContext('2d'), x = cx * W, y = cy * H;
    const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 1.05);
    gr.addColorStop(0, '#5E0C36'); gr.addColorStop(.24, '#3B0322'); gr.addColorStop(.55, '#22020F'); gr.addColorStop(1, '#14000B');
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
  const words = [['صمّم', .03, .27], ['اطبع', .27, .52], ['فخامة', .52, .77], ['استلم', .77, 9]].map(([text, a, b]) => {
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

  /* ---------- layout for one output size; cssW/cssH is the screen size the frame stands for ---------- */
  const frame = { x: 0, y: 0, s: 1 };
  function resize(outW, outH, cssW, cssH) {
    renderer.setSize(outW, outH, false);
    const aspect = outW / outH, px = outW / cssW;
    camera.aspect = aspect;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (aspect < .85) {
      camera.position.z = 4.7 / (2 * tanH * aspect);
      frame.x = 0; frame.y = 2 * camera.position.z * tanH * .17; frame.s = 1;
    } else {
      camera.position.z = 10;
      const visH = 2 * 10 * tanH;
      frame.x = -visH * aspect * .16; frame.y = -.08; frame.s = aspect < 1.3 ? .82 : 1;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const v = new THREE.Vector3(frame.x, frame.y, 0).project(camera);
    paintBackground(outW, outH, (v.x + 1) / 2, (1 - v.y) / 2);
    const along = z => (camera.position.z - z) / camera.position.z;
    const pxToWorld = (cssPx, z) => cssPx * px / outH * 2 * (camera.position.z - z) * tanH;
    ring.position.set(frame.x * along(RZ), frame.y * along(RZ), RZ);
    ring.scale.setScalar(pxToWorld(Math.min(Math.min(cssW, cssH) * .8, 780, cssW), RZ));
    const fontPx = aspect < .85 ? clamp(.44 * cssW, 136, 240) : clamp(.30 * cssW, 144, 496);
    for (const m of words) {
      m.position.set(frame.x * along(WZ), frame.y * along(WZ), WZ);
      m.userData.base = pxToWorld(fontPx * 1.5, WZ);
    }
    lastSk = -1;
  }

  /* ---------- the timeline: p is scroll progress 0..1, t drives the gentle float ---------- */
  let lastSk = -1;
  const topY = SH / 2 + .1, endY = -SH / 2 - .34;

  function update(p) {
    const t = p * 30;
    const bob = Math.sin(t * .9), bob2 = Math.sin(t * .63 + 1.3);
    const s1 = seg(p, .05, .24), t12 = seg(p, .24, .30), s2 = seg(p, .30, .47);
    const t23a = seg(p, .47, .505), t23b = seg(p, .51, .56), s3 = seg(p, .56, .74);
    const t34 = seg(p, .74, .79), s4 = seg(p, .79, .97);

    let rs = 1;
    rs = lerp(rs, .8, ease(t12)); rs = lerp(rs, 1, ease(t23a)); rs = lerp(rs, 1.12, ease(t23b)); rs = lerp(rs, .96, ease(t34));
    rig.scale.setScalar(rs * frame.s);
    rig.position.set(frame.x, frame.y, 0);

    ring.rotation.z = -p * 210 * Math.PI / 180;
    for (const m of words) {
      const u = m.userData, k = windowAmt(p, u.a, u.b, .035), s = u.base * (.9 + .1 * k);
      m.material.opacity = k; m.visible = k > .003;
      m.scale.set(s * u.ratio, s, 1);
    }

    let ry = lerp(-.5, -.22, ease(s1)); ry = lerp(ry, -.36, ease(t12)); ry = lerp(ry, -.16, ease(t23a));
    let rx = lerp(.02, .05, s1); rx = lerp(rx, .2, ease(t12)); rx = lerp(rx, .03, ease(t23a));
    press.rotation.set(rx, ry, 0);

    let sy = bob * .05;
    sy = lerp(sy, topY, ease(t12));
    if (p >= .30) sy = lerp(topY, endY, sine(s2));
    if (p >= .47) sy = lerp(endY, 0, ease(t23a));
    const fly = easeIn(t23b);
    sheet.position.set(9 * fly, sy + 2.4 * fly, -3 * fly);
    sheet.rotation.set(lerp(-.08 + bob2 * .03, 0, ease(t12)) - .3 * fly, lerp(0, .2, ease(t23a)) + 1.3 * fly, lerp(.035, 0, ease(t12)) - .35 * fly);
    sheet.visible = p < .56;

    printFrac.value = p >= .47 ? 1 : p > .30 ? clamp((SH / 2 - sy) / SH) : 0;
    const sk = p >= .24 ? 1 : s1;
    if (sheet.visible && sk !== lastSk) { drawSheet(sk); lastSk = sk; }

    rollers.position.y = lerp(-4.6, 0, easeOut(seg(t12, .25, 1))) + 4.8 * easeIn(t23a);
    rollers.visible = p > .245 && p < .51;
    const spin = (topY - sy) / R + t * .12;
    rFront.rotation.x = -spin; rBack.rotation.x = spin;

    stack.visible = p > .505 && p < .79;
    stack.position.set(0, lerp(-5.4, -.12, easeOut(t23b)) + 6.5 * easeIn(t34), 0);
    stack.rotation.set(-.92, lerp(.55, .3, ease(s3)), .1);
    const dDown = ease(seg(s3, 0, .3)), dUp = easeIn(seg(s3, .42, .6));
    die.position.z = lerp(topZ + 3.4, contactZ, dDown) + 3.6 * dUp;
    die.visible = s3 > 0 && dUp < 1;
    const heat = seg(s3, .27, .33) * (1 - seg(s3, .36, .5));
    dieMat.emissive.setRGB(.6 * heat, .24 * heat, .08 * heat);
    foilLive.opacity = ease(seg(s3, .32, .42));
    const lift = ease(seg(s3, .5, .8));
    topCard.position.z = topZ + lift * 1.05;
    topCard.rotation.set(lift * .86, lerp(-.3, .26, ease(seg(s3, .68, 1))) * lift, -.1 * lift);

    boxG.visible = p > .745;
    boxG.position.set(0, lerp(-5.2, -.5, easeOut(seg(p, .755, .83))) + bob * .05 * seg(s4, .75, 1), 0);
    boxG.rotation.set(lerp(.62, .5, ease(s4)), lerp(-.78, -.32, ease(s4)), 0);
    const cDown = ease(seg(s4, .02, .42));
    boxCards.position.y = lerp(3.6, T + CT / 2, cDown);
    boxCards.visible = cDown > 0;
    const lidDown = ease(seg(s4, .42, .78));
    lid.position.y = lerp(4.2, lidClosedY, lidDown);
    lid.rotation.set(0, lerp(.25, 0, lidDown), lerp(-.18, 0, lidDown));
    lid.visible = lidDown > 0;

    let gi = 0, gx = 0, gy = .6, gz = 1.7;
    if (p > .55 && p < .79) {
      const flash = seg(s3, .3, .36) * (1 - seg(s3, .38, .5)), sw = seg(s3, .62, 1);
      gi = 34 * flash + 24 * Math.sin(Math.PI * sw); gx = lerp(-2.3, 2.3, sw);
    } else if (p >= .79) {
      const sw = seg(s4, .74, .98);
      gi = 26 * Math.sin(Math.PI * sw); gx = lerp(-2.5, 2.5, sw); gy = 1.7; gz = 1.3;
    }
    glint.intensity = gi; glint.position.set(gx, gy, gz);

    for (let i = 0; i < PN; i++) {
      const y = pBase[i * 3 + 1] + t * pSpd[i];
      pPos[i * 3 + 1] = ((y + 4.6) % 9.2 + 9.2) % 9.2 - 4.6;
    }
    pGeo.attributes.position.needsUpdate = true;
    dust.position.y = -p * 2.2;
  }

  return {
    canvas,
    resize,
    frame(p) { update(p); renderer.render(scene, camera); },
  };
}
