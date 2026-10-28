/* The hero film: the shop's name stamped in gold foil on an embossed maroon wall, printed proof sheets
   (business cards, stickers, a box die-line, an invitation, a cup wrap, a letterhead) hanging in the air
   around it, a slow light passing over the foil, drifting dust and two soft beams.
   Rendered offline by render.html and encoded by tools/render_video.py. Everything moves on one period,
   so the last frame runs straight into the first and the video loops without a seam. */
import * as THREE from 'three';

export const PERIOD = 12, FPS = 30, FRAMES = PERIOD * FPS;
const TAU = Math.PI * 2;
const COL = { maroon: '#4B0129', deep: '#2A0016', beige: '#D6C1A0', light: '#EADCC2', gold: '#C9A97C', paper: '#F6F0E4', ink: '#2B0716' };
const PRINT = { c: '#00A0E3', m: '#E5007E', y: '#FFED00', k: '#1D1D1B' };
const NAME = 'مطابع روعة التصاميم', TAGLINE = 'طباعة شاملة';

// seeded, so every run and every frame places things identically
let seed = 20261029;
const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cnv = (w, h) => Object.assign(document.createElement('canvas'), { width: Math.ceil(w), height: Math.ceil(h) });
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

function grain(g, w, h, amt) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rand() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
// a normal map from a height map held in the red channel
function normalFrom(height, strength, blur) {
  const w = height.width, h = height.height, c = cnv(w, h), g = c.getContext('2d', { willReadFrequently: true });
  g.filter = `blur(${blur}px)`; g.drawImage(height, 0, 0); g.filter = 'none';
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
// the eight-point star lattice, drawn as lines in the current stroke style
function starLattice(g, w, h, cell, lw) {
  g.lineWidth = lw; g.lineJoin = 'round';
  for (let y = -cell; y < h + cell; y += cell) for (let x = -cell; x < w + cell; x += cell) {
    const cx = x + cell / 2, cy = y + cell / 2, r = cell * .42, r2 = cell * .2;
    g.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8 + Math.PI / 16, rr = k % 2 ? r2 : r;
      k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(x, cy); g.lineTo(x + cell, cy); g.moveTo(cx, y); g.lineTo(cx, y + cell); g.stroke();
  }
}
// the logo as a flat shape in one colour
function tinted(img, w, h, color) {
  const c = cnv(w, h), g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, w, h);
  return c;
}

/* ---------- the name plate: emblem, name on two lines, tagline between two rules (white on transparent) ---------- */
function brandArt(logo) {
  const fs = 300, lines = ['مطابع روعة', 'التصاميم'], lineH = fs * 1.34, tagFs = fs * .19;
  const probe = cnv(8, 8).getContext('2d');
  probe.font = `700 ${fs}px "Aref Ruqaa"`;
  const widest = Math.max(...lines.map(l => probe.measureText(l).width));
  const emH = fs * 1.05, emW = emH * logo.width / logo.height;
  const W = widest + fs * .7, H = fs * .2 + emH + fs * .18 + lines.length * lineH + tagFs * 2.4 + fs * .2;
  const c = cnv(W, H), g = c.getContext('2d');
  let y = fs * .2;
  g.drawImage(tinted(logo, emW, emH, '#fff'), (c.width - emW) / 2, y);
  y += emH + fs * .18;
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
  g.font = `700 ${fs}px "Aref Ruqaa"`;
  for (const l of lines) { g.fillText(l, c.width / 2, y + lineH / 2); y += lineH; }
  g.font = `500 ${tagFs}px "IBM Plex Sans Arabic"`;
  const tw = g.measureText(TAGLINE).width, ty = y + tagFs * 1.1, rule = fs * .9, gap = fs * .22;
  g.fillText(TAGLINE, c.width / 2, ty);
  g.fillRect(c.width / 2 - tw / 2 - gap - rule, ty - 3, rule, 6);
  g.fillRect(c.width / 2 + tw / 2 + gap, ty - 3, rule, 6);
  return c;
}

/* ---------- proof sheets, 1024 x 1448 (A4), each with crop marks, registration targets and a colour bar ---------- */
const SW = 1024, SH = 1448, TRIM = { x: 92, y: 92, w: SW - 184, h: SH - 250 };

function paper() {
  const c = cnv(SW, SH), g = c.getContext('2d');
  g.fillStyle = COL.paper; g.fillRect(0, 0, SW, SH);
  grain(g, SW, SH, 7);
  return [c, g];
}
function printMarks(g) {
  const { x, y, w, h } = TRIM, gap = 14, L = 40;
  g.strokeStyle = PRINT.k; g.lineWidth = 2;
  for (const [cx, cy, sx, sy] of [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]]) {
    g.beginPath();
    g.moveTo(cx + sx * gap, cy); g.lineTo(cx + sx * (gap + L), cy);
    g.moveTo(cx, cy + sy * gap); g.lineTo(cx, cy + sy * (gap + L));
    g.stroke();
  }
  for (const [cx, cy] of [[SW / 2, 44], [44, SH / 2 - 60], [SW - 44, SH / 2 - 60]]) {
    g.beginPath(); g.arc(cx, cy, 13, 0, TAU); g.moveTo(cx - 24, cy); g.lineTo(cx + 24, cy); g.moveTo(cx, cy - 24); g.lineTo(cx, cy + 24); g.stroke();
    g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.fillStyle = PRINT.k; g.fill();
  }
  const bar = [PRINT.c, PRINT.m, PRINT.y, PRINT.k, '#7FCFF1', '#F27FBE', '#FFF67F', '#8E8E8D', COL.maroon, COL.beige];
  const s = 34, bx = (SW - bar.length * s) / 2, by = SH - 104;
  bar.forEach((col, i) => { g.fillStyle = col; g.fillRect(bx + i * s, by, s - 2, s); });
  g.fillStyle = '#6b6b6b'; g.font = '400 15px "IBM Plex Sans Arabic"'; g.textAlign = 'center'; g.direction = 'ltr';
  g.fillText('RD AMAZING  ·  PROOF  ·  CMYK', SW / 2, SH - 40);
}
function textBars(g, x, y, w, rows, gapY, col, rtl = true) {
  g.fillStyle = col;
  for (let r = 0; r < rows; r++) {
    const len = w * (r === rows - 1 ? .55 : .78 + rand() * .22);
    const rx = rtl ? x + w - len : x;
    g.beginPath(); g.roundRect(rx, y + r * gapY, len, 12, 6); g.fill();
  }
}
function dieLine(g, draw, color = PRINT.m, dash = [14, 9]) {
  g.save(); g.strokeStyle = color; g.lineWidth = 3; g.setLineDash(dash); g.beginPath(); draw(); g.stroke(); g.restore();
}

const DESIGNS = {
  cards(logo) {
    const [c, g] = paper(), { x, y, w, h } = TRIM, cols = 2, rows = 4, gx = 26, gy = 30;
    const cw = (w - gx) / cols, ch = (h - gy * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const px = x + k * (cw + gx), py = y + r * (ch + gy), back = (r + k) % 2 === 1;
      g.fillStyle = COL.maroon; g.fillRect(px, py, cw, ch);
      g.strokeStyle = 'rgba(214,193,160,.55)'; g.lineWidth = 2; g.strokeRect(px + 12, py + 12, cw - 24, ch - 24);
      if (back) {
        const s = ch * .62; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), px + (cw - s * logo.width / logo.height) / 2, py + (ch - s) / 2);
      } else {
        const s = ch * .42; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), px + cw - s - 34, py + (ch - s) / 2);
        g.fillStyle = COL.light; g.textAlign = 'right'; g.direction = 'rtl';
        g.font = '600 25px "IBM Plex Sans Arabic"'; g.fillText(NAME, px + cw - s - 56, py + ch * .42);
        g.fillStyle = COL.beige; g.font = '400 18px "IBM Plex Sans Arabic"'; g.fillText(TAGLINE + ' · الدمام', px + cw - s - 56, py + ch * .62);
      }
    }
    printMarks(g);
    return c;
  },
  letter(logo) {
    const [c, g] = paper(), { x, y, w, h } = TRIM;
    g.fillStyle = COL.maroon; g.fillRect(x, y, w, 230);
    const s = 150; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), x + w - s - 40, y + 40);
    g.fillStyle = COL.light; g.textAlign = 'right'; g.direction = 'rtl';
    g.font = '600 40px "IBM Plex Sans Arabic"'; g.fillText(NAME, x + w - s - 70, y + 105);
    g.fillStyle = COL.beige; g.font = '400 24px "IBM Plex Sans Arabic"'; g.fillText(TAGLINE + ' · الدمام · المملكة العربية السعودية', x + w - s - 70, y + 152);
    textBars(g, x + 60, y + 320, w - 120, 4, 40, '#cfc6b8');
    textBars(g, x + 60, y + 530, w - 120, 6, 40, '#d8d0c3');
    textBars(g, x + 60, y + 820, w - 120, 5, 40, '#d8d0c3');
    g.fillStyle = COL.gold; g.fillRect(x + 60, y + h - 110, w - 120, 3);
    g.fillStyle = '#8a7d6c'; g.font = '400 20px "IBM Plex Sans Arabic"'; g.textAlign = 'center';
    g.fillText('+966 53 584 3085  ·  printingvip11@gmail.com', x + w / 2, y + h - 64);
    printMarks(g);
    return c;
  },
  stickers(logo) {
    const [c, g] = paper(), { x, y, w, h } = TRIM, cols = 3, rows = 4, r = 118;
    const sx = w / cols, sy = h / rows;
    for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) {
      const cx = x + sx * (k + .5), cy = y + sy * (i + .5), dark = (i + k) % 2 === 0;
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fillStyle = dark ? COL.maroon : COL.beige; g.fill();
      g.beginPath(); g.arc(cx, cy, r - 14, 0, TAU); g.strokeStyle = dark ? 'rgba(214,193,160,.7)' : 'rgba(75,1,41,.55)'; g.lineWidth = 3; g.stroke();
      if (dark) {
        const s = r * 1.15; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), cx - s * logo.width / logo.height / 2, cy - s / 2);
      } else {
        g.fillStyle = COL.maroon; g.textAlign = 'center'; g.direction = 'ltr';
        g.font = '700 74px Alexandria'; g.fillText('RD', cx, cy + 14);
        g.font = '600 19px Alexandria'; g.fillText('A M A Z I N G', cx, cy + 52);
      }
      dieLine(g, () => g.arc(cx, cy, r + 12, 0, TAU));
    }
    printMarks(g);
    return c;
  },
  dieline(logo) {
    const [c, g] = paper(), a = 250, b = 150, flap = 120, glue = 46;   // a box net: two faces, two sides, lids and a glue flap
    const top = 300, left = (SW - (2 * a + 2 * b + glue)) / 2, panels = [[a, 'front'], [b, 'side'], [a, 'back'], [b, 'side']];
    let px = left;
    g.save(); g.fillStyle = COL.maroon;
    for (const [pw] of panels) { g.fillRect(px, top, pw, 560); px += pw; }
    g.fillRect(left, top - b, a, b); g.fillRect(left, top + 560, a, b);   // lid and base
    g.beginPath(); g.moveTo(left, top - b); g.lineTo(left + 30, top - b - flap * .6); g.lineTo(left + a - 30, top - b - flap * .6); g.lineTo(left + a, top - b); g.fill();
    g.restore();
    g.save(); g.beginPath(); g.rect(left, top - b, 2 * a + 2 * b, 560 + 2 * b); g.clip();
    g.strokeStyle = 'rgba(214,193,160,.16)'; starLattice(g, SW, SH, 90, 2); g.restore();
    const s = 190; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), left + (a - s * logo.width / logo.height) / 2, top + 150);
    g.fillStyle = COL.light; g.textAlign = 'center'; g.direction = 'rtl'; g.font = '600 26px "IBM Plex Sans Arabic"';
    g.fillText(NAME, left + a / 2, top + 400);
    g.fillStyle = COL.gold; g.fillRect(left + 50, top + 430, a - 100, 2);
    // cut lines solid magenta, fold lines dashed cyan
    dieLine(g, () => {
      g.moveTo(left, top); g.lineTo(left, top - b); g.lineTo(left + 30, top - b - flap * .6); g.lineTo(left + a - 30, top - b - flap * .6); g.lineTo(left + a, top - b); g.lineTo(left + a, top);
      g.lineTo(left + 2 * a + 2 * b, top); g.lineTo(left + 2 * a + 2 * b + glue, top + 30); g.lineTo(left + 2 * a + 2 * b + glue, top + 530); g.lineTo(left + 2 * a + 2 * b, top + 560);
      g.lineTo(left + a, top + 560); g.lineTo(left + a, top + 560 + b); g.lineTo(left, top + 560 + b); g.closePath();
    }, PRINT.m, []);
    dieLine(g, () => {
      for (const fx of [left + a, left + a + b, left + 2 * a + b, left + 2 * a + 2 * b]) { g.moveTo(fx, top); g.lineTo(fx, top + 560); }
      g.moveTo(left, top); g.lineTo(left + a, top); g.moveTo(left, top + 560); g.lineTo(left + a, top + 560); g.moveTo(left, top - b); g.lineTo(left + a, top - b);
    }, PRINT.c);
    printMarks(g);
    return c;
  },
  invite(logo) {
    const [c, g] = paper(), { x, y, w, h } = TRIM;
    g.strokeStyle = COL.gold; g.lineWidth = 6; g.strokeRect(x + 30, y + 30, w - 60, h - 60);
    g.lineWidth = 2; g.strokeRect(x + 52, y + 52, w - 104, h - 104);
    g.save(); g.strokeStyle = COL.gold;
    for (const [cx, cy] of [[x + 52, y + 52], [x + w - 52, y + 52], [x + 52, y + h - 52], [x + w - 52, y + h - 52]]) {
      g.beginPath();
      for (let k = 0; k < 16; k++) { const ang = k * Math.PI / 8, rr = k % 2 ? 14 : 34; k ? g.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr) : g.moveTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); }
      g.closePath(); g.fillStyle = COL.paper; g.fill(); g.lineWidth = 3; g.stroke();
    }
    g.restore();
    const s = 150; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.gold), x + (w - s * logo.width / logo.height) / 2, y + 170);
    g.fillStyle = COL.maroon; g.textAlign = 'center'; g.direction = 'rtl'; g.textBaseline = 'middle';
    g.font = '700 128px "Aref Ruqaa"'; g.fillText('دعوة زفاف', x + w / 2, y + 470);
    g.fillStyle = COL.gold; g.fillRect(x + w / 2 - 150, y + 580, 300, 3);
    g.textBaseline = 'alphabetic';
    for (let r = 0; r < 5; r++) { const len = [520, 440, 560, 380, 300][r]; g.fillStyle = r === 1 ? '#b8a07e' : '#d9ccb7'; g.beginPath(); g.roundRect(x + (w - len) / 2, y + 660 + r * 52, len, 13, 6.5); g.fill(); }
    printMarks(g);
    return c;
  },
  cup(logo) {
    const [c, g] = paper(), cx = SW / 2, cy = 1830, r1 = 1080, r2 = 1560, a0 = -Math.PI / 2 - .5, a1 = -Math.PI / 2 + .5;
    const band = () => { g.beginPath(); g.arc(cx, cy, r2, a0, a1); g.arc(cx, cy, r1, a1, a0, true); g.closePath(); };
    g.save(); band(); g.fillStyle = COL.maroon; g.fill(); g.clip();
    g.strokeStyle = 'rgba(214,193,160,.2)'; starLattice(g, SW, SH, 96, 2.2);
    g.restore();
    const s = 210; g.drawImage(tinted(logo, s * logo.width / logo.height, s, COL.beige), cx - s * logo.width / logo.height / 2, cy - (r1 + r2) / 2 - s / 2 - 10);
    g.fillStyle = COL.light; g.textAlign = 'center'; g.direction = 'rtl'; g.font = '600 30px "IBM Plex Sans Arabic"';
    g.fillText(NAME, cx, cy - r1 - 60);
    dieLine(g, band, PRINT.m, []);
    dieLine(g, () => { g.arc(cx, cy, r1 + 40, a0 + .02, a1 - .02); }, PRINT.c);
    printMarks(g);
    return c;
  },
};
function backSide() { const [c] = paper(); return c; }

/* ---------- layout: where things sit, as screen positions (-1..1) at a depth ---------- */
const LAYOUT = {
  wide: {
    fov: 30, brand: { nx: -.42, ny: .03, h: .6 },
    // design, nx, ny, z, height, rx, ry, rz, full turns per period
    sheets: [
      ['cards', .6, .5, -1.6, 2.1, -.25, -.55, .18, 0],
      ['dieline', .14, -.66, .2, 1.9, .35, .4, -.3, 0],
      ['stickers', -.94, .78, .6, 1.75, .15, .65, .42, 0],
      ['letter', -.97, -.72, -.6, 1.95, -.3, -.35, -.2, 1],
      ['invite', .92, -.5, 1.1, 1.85, .25, -.7, .25, 0],
      ['cup', .12, .8, -2.2, 1.6, -.2, .3, -.1, -1],
      ['cards', .86, .06, -.5, 1.6, .1, .9, .05, 0],
    ],
    beams: [[.55, 1, -.5], [.25, 1, -.62]],
  },
  tall: {
    fov: 38, brand: { nx: 0, ny: .5, h: .34 },
    sheets: [
      ['cards', -.9, .96, -.8, 1.75, -.25, .55, .3, 0],
      ['stickers', .92, .92, -.2, 1.5, .2, -.6, -.35, 0],
      ['letter', -.92, .02, .4, 1.7, -.3, .45, -.15, 1],
      ['dieline', .95, -.06, -1.2, 1.75, .3, -.4, .25, 0],
      ['invite', -.45, -.64, .8, 1.7, .25, .5, .2, 0],
      ['cup', .5, -.74, -.6, 1.5, -.2, -.3, -.1, -1],
    ],
    beams: [[.5, 1, -.32], [.1, 1, -.4]],
  },
};

export async function createFilm(canvas, { tall, width, height, logoUrl }) {
  const L = tall ? LAYOUT.tall : LAYOUT.wide;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x12000a, 1);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (c, color = true) => { const t = new THREE.CanvasTexture(c); if (color) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

  await Promise.all([
    document.fonts.load('700 200px "Aref Ruqaa"', NAME),
    document.fonts.load('400 30px "IBM Plex Sans Arabic"', NAME), document.fonts.load('500 30px "IBM Plex Sans Arabic"', TAGLINE),
    document.fonts.load('600 30px "IBM Plex Sans Arabic"', NAME), document.fonts.load('600 30px "IBM Plex Sans Arabic"', 'RD'),
    document.fonts.load('700 60px Alexandria', 'RD AMAZING'),
  ]);
  const logo = await loadImg(logoUrl);

  const scene = new THREE.Scene();
  const Z = 12, aspect = width / height, camera = new THREE.PerspectiveCamera(L.fov, aspect, .1, 100);
  const tanH = Math.tan(THREE.MathUtils.degToRad(L.fov / 2));
  const visH = z => 2 * (Z - z) * tanH;
  const at = (nx, ny, z) => [nx * (Z - z) * tanH * aspect, ny * (Z - z) * tanH];

  // reflections for the foil: a dark room with a few warm soft boxes
  {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x14040c);
    const geo = new THREE.PlaneGeometry(1, 1);
    const panel = (hex, k, w, h, x, y, z) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
      m.scale.set(w, h, 1); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(0xfff0dc, 4.5, 9, 3, 0, 7, 3);
    panel(0xffe4c0, 2.6, 2.5, 7, -8, 1, 3);
    panel(0xffd7ae, 2.2, 2.5, 7, 8, .5, -2);
    panel(0x8a2c55, 1.2, 14, 6, 0, -6, 0);
    panel(0xfff6ea, 2.8, 4, 2, 2, 2, 9);
    panel(0xffcf8f, .95, 16, 9, 0, -1, 12);   // a broad warm box behind the camera, so the flat of the foil glows gold
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, .035).texture;
    pmrem.dispose();
  }

  /* ---------- the name plate and the wall it is stamped into ---------- */
  const WALL_Z = -3;
  const art = brandArt(logo), artAspect = art.width / art.height;
  let bh = visH(WALL_Z) * L.brand.h, bw = bh * artAspect;
  const maxW = visH(WALL_Z) * aspect * (tall ? .86 : .44);
  if (bw > maxW) { bw = maxW; bh = bw / artAspect; }
  const [bx, by] = at(L.brand.nx, L.brand.ny, WALL_Z);

  const wallH = visH(WALL_Z) * 1.4, wallW = wallH * aspect;
  const k = 2560 / Math.max(wallW, wallH), WPX = Math.round(wallW * k), WPY = Math.round(wallH * k);
  const plateRect = [(bx - bw / 2 + wallW / 2) * k, (wallH / 2 - (by + bh / 2)) * k, bw * k, bh * k];
  const wallColor = cnv(WPX, WPY);
  {
    const g = wallColor.getContext('2d'), gx = plateRect[0] + plateRect[2] / 2, gy = plateRect[1] + plateRect[3] / 2;
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, Math.max(WPX, WPY) * .7);
    gr.addColorStop(0, '#5C0B35'); gr.addColorStop(.32, '#3D0222'); gr.addColorStop(.7, '#200011'); gr.addColorStop(1, '#12000A');
    g.fillStyle = gr; g.fillRect(0, 0, WPX, WPY);
    grain(g, WPX, WPY, 5);
    // the stamp presses the paper down: a soft dark halo under the name
    g.filter = `blur(${Math.round(k * .05)}px)`; g.globalAlpha = .7;
    g.drawImage(tinted(art, plateRect[2], plateRect[3], '#0c0006'), plateRect[0] - k * .04, plateRect[1] + k * .07, plateRect[2], plateRect[3]);
    g.filter = 'none'; g.globalAlpha = 1;
  }
  const wallRelief = cnv(WPX, WPY);
  {
    const g = wallRelief.getContext('2d');
    g.fillStyle = '#808080'; g.fillRect(0, 0, WPX, WPY);
    g.strokeStyle = '#a8a8a8'; starLattice(g, WPX, WPY, k * 1.3, Math.max(2, k * .012));
    g.filter = `blur(${Math.round(k * .015)}px)`;
    g.drawImage(tinted(art, plateRect[2], plateRect[3], '#202020'), ...plateRect);
    g.filter = 'none';
  }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(wallW, wallH), new THREE.MeshStandardMaterial({
    map: tex(wallColor), normalMap: tex(normalFrom(wallRelief, 2.2, 1.2), false), normalScale: new THREE.Vector2(.8, .8),
    roughness: .8, metalness: 0, envMapIntensity: .3,
  }));
  wall.position.z = WALL_Z;
  scene.add(wall);

  const plate = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshPhysicalMaterial({
    color: 0xE8C68C, metalness: 1, roughness: .28, clearcoat: .5, clearcoatRoughness: .18,
    alphaMap: tex(art, false), normalMap: tex(normalFrom(art, 7, 2.6), false), normalScale: new THREE.Vector2(1, 1),
    transparent: true, depthWrite: false, envMapIntensity: 1.35,
  }));
  plate.position.set(bx, by, WALL_Z + .03);
  scene.add(plate);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x2a0618, .55));
  const key = new THREE.DirectionalLight(0xffe8cc, 2.1);
  key.position.set(6, 7, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8ab6, .9);
  rim.position.set(-7, 3, -2);
  scene.add(rim);
  const sweep = new THREE.PointLight(0xffe6c4, 11, 0, 2);
  scene.add(sweep);

  /* ---------- the sheets ---------- */
  const designs = {};
  const sheetGeo = curl => {
    const geo = new THREE.PlaneGeometry(1, SH / SW, 24, 30), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, curl * (x * x * 1.6 + y * y * .25)); }
    geo.computeVertexNormals();
    return geo;
  };
  const backMat = new THREE.MeshStandardMaterial({ map: tex(backSide()), roughness: .78 });
  const sheets = L.sheets.map(([name, nx, ny, z, h, rx, ry, rz, turns]) => {
    designs[name] ||= tex(DESIGNS[name](logo));
    const geo = sheetGeo((rand() - .5) * .16);
    const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: designs[name], roughness: .6 }));
    const back = new THREE.Mesh(geo, backMat);
    back.rotation.y = Math.PI; back.position.z = -.004;
    const grp = new THREE.Group();
    grp.add(front, back);
    grp.scale.setScalar(h * SW / SH);
    const [x, y] = at(nx, ny, z);
    grp.userData = { x, y, z, rx, ry, rz, turns, ph: [rand() * TAU, rand() * TAU, rand() * TAU, rand() * TAU] };
    scene.add(grp);
    return grp;
  });

  /* ---------- dust and beams ---------- */
  const dot = cnv(64, 64);
  { const g = dot.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const DN = 260, dBase = new Float32Array(DN * 3), dPos = new Float32Array(DN * 3), dR = new Float32Array(DN), dPh = new Float32Array(DN);
  for (let i = 0; i < DN; i++) {
    const z = -2.4 + rand() * 6.4, [x, y] = at(rand() * 2.2 - 1.1, rand() * 2.2 - 1.1, z);
    dBase.set([x, y, z], i * 3); dR[i] = .08 + rand() * .3; dPh[i] = rand() * TAU;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: tall ? .05 : .045, map: tex(dot, false), color: 0xead6b0, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending,
  })));

  const beamC = cnv(256, 1024);
  {
    const g = beamC.getContext('2d'), across = g.createLinearGradient(0, 0, 256, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)'); across.addColorStop(.5, 'rgba(255,255,255,1)'); across.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = across; g.fillRect(0, 0, 256, 1024);
    g.globalCompositeOperation = 'destination-in';
    const down = g.createLinearGradient(0, 0, 0, 1024);
    down.addColorStop(0, 'rgba(0,0,0,1)'); down.addColorStop(.7, 'rgba(0,0,0,.35)'); down.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = down; g.fillRect(0, 0, 256, 1024);
  }
  const beams = L.beams.map(([nx, ny, rz], i) => {
    const z = -1.2 - i * .4, [x, y] = at(nx, ny, z), len = visH(z) * 1.5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len * .16, len), new THREE.MeshBasicMaterial({
      map: tex(beamC, false), color: 0xffe2bc, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    m.rotation.z = rz;
    m.position.set(x - Math.sin(rz) * len * .5, y - Math.cos(rz) * len * .5, z);
    m.userData = { x: m.position.x, ph: rand() * TAU };
    scene.add(m);
    return m;
  });

  /* ---------- one frame at `phase` (0..1 over the period) ---------- */
  function render(phase) {
    const a = TAU * phase;
    camera.position.set(.34 * Math.sin(a), .16 * Math.sin(2 * a + .6), Z);
    camera.lookAt(.1 * Math.sin(a), .05 * Math.sin(2 * a + .6), WALL_Z);
    sweep.position.set(bx + bw * .62 * Math.sin(a - .4), by + bh * .18 * Math.cos(a), WALL_Z + 2.2);
    for (const s of sheets) {
      const u = s.userData, p = u.ph;
      s.position.set(u.x + .07 * Math.cos(a + p[0]), u.y + .16 * Math.sin(a + p[1]), u.z + .1 * Math.sin(a + p[2]));
      s.rotation.set(u.rx + .16 * Math.sin(a + p[2]), u.ry + .32 * Math.sin(a + p[3]) + u.turns * a, u.rz + .1 * Math.sin(a + p[0]));
    }
    for (let i = 0; i < DN; i++) {
      const t = a + dPh[i];
      dPos[i * 3] = dBase[i * 3] + dR[i] * Math.cos(t);
      dPos[i * 3 + 1] = dBase[i * 3 + 1] + dR[i] * 1.6 * Math.sin(t);
      dPos[i * 3 + 2] = dBase[i * 3 + 2];
    }
    dGeo.attributes.position.needsUpdate = true;
    for (const b of beams) {
      b.material.opacity = .085 + .045 * Math.sin(a + b.userData.ph);
      b.position.x = b.userData.x + .25 * Math.sin(a + b.userData.ph);
    }
    renderer.render(scene, camera);
  }

  return { render };
}
