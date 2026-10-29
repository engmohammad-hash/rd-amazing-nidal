/* Packaging: mailer and food boxes, a perfume box, kraft and plastic bags, cold cups, cup carriers, lids,
   a takeaway coffee jug, bottles and jars with their labels, and a raised gold sticker. */
import { THREE, C, NAME, FONT, rand, starPattern, maskFrom, grainOn } from './stage.js';
import { art } from './art.js';

const DEG = Math.PI / 180;
const lay = (o, x, z, turn = 0, y = 0) => { o.rotation.set(-Math.PI / 2, 0, turn * DEG); o.position.set(x, y, z); return o; };
const put = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };

export function kraftCanvas(S, W, H, tone = '#B98A5A') {
  const c = S.paper(W, H, tone, tone, 22), g = c.getContext('2d');
  g.globalAlpha = .08; g.strokeStyle = '#5a3a1a';
  for (let i = 0; i < 400; i++) { const x = rand() * W, y = rand() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - .5) * 40, y + (rand() - .5) * 8); g.stroke(); }
  g.globalAlpha = 1;
  return c;
}
// a printed face: the logo and name over a ground, in one ink
export function face(S, W, H, ground, ink, { logo = .38, y = .42, name = true, sub, size = .075, pattern = 0 } = {}) {
  const c = typeof ground === 'string' ? S.paper(W, H, ground, ground, 6) : ground, g = c.getContext('2d');
  if (pattern) { g.globalAlpha = pattern; g.strokeStyle = ink; starPattern(g, W, H, Math.round(Math.min(W, H) / 5), 3); g.globalAlpha = 1; }
  S.drawLogo(g, S.logoIn(ink), W / 2, H * y, Math.min(W, H) * logo);
  if (name) S.text(g, NAME, W / 2, H * (y + logo * .62 * Math.min(W, H) / H + .07), { size: Math.min(W, H) * size, color: ink, weight: 700 });
  if (sub) S.text(g, sub, W / 2, H * (y + logo * .62 * Math.min(W, H) / H + .14), { size: Math.min(W, H) * size * .55, color: ink, weight: 400, font: FONT.body, alpha: .8 });
  return c;
}

// a carrier bag: printed front and back, plain gussets, a dark open top and two handles
export function bag(S, { w = 2, h = 2.5, d = .9, front, side, inside = 0x2a0a14, handle = 'rope', handleColor = 0xe9dcc4, matOpts = {} }) {
  const { M } = S, g = new THREE.Group();
  const fm = M.print(front, { roughness: .7, ...matOpts }), sm = M.print(side, { roughness: .75, ...matOpts });
  const body = S.box(w, h, d, { pz: fm, nz: fm, px: sm, nx: sm, py: M.plain(inside, .9) }, sm);
  g.add(body);
  const hm = M.plain(handleColor, handle === 'rope' ? .85 : .7);
  for (const z of [d / 2 + .01, -d / 2 - .01]) {
    const pts = [[-w * .22, h / 2 - .12, z], [-w * .2, h / 2 + .45, z], [0, h / 2 + .7, z], [w * .2, h / 2 + .45, z], [w * .22, h / 2 - .12, z]].map(p => new THREE.Vector3(...p));
    const r = handle === 'rope' ? .035 : handle === 'flat' ? .05 : .03;
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 10), hm);
    if (handle === 'flat') t.scale.z = .35;
    g.add(t);
  }
  return g;
}

// a cold cup: clear walls, the drink inside, a dome lid and a straw
function coldCup(S, { drink = 0x8a5a3a, foam = 0xe8d8c0, print, r1 = .62, r0 = .46, h = 1.9 } = {}) {
  const { M } = S, g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 64, 1, true), M.glass(0xffffff, .05));
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(r1 * .93, r0 * .95, h * .82, 48), new THREE.MeshPhysicalMaterial({ color: drink, roughness: .25, clearcoat: .6 }));
  liquid.position.y = -h * .07;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r1 * .92, r1 * .9, h * .1, 48), M.plain(foam, .8)); top.position.y = h * .34;
  for (let i = 0; i < 9; i++) { const ice = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, .22), new THREE.MeshPhysicalMaterial({ color: 0xf2f6fa, roughness: .15, transparent: true, opacity: .55, clearcoat: 1 })); ice.position.set((rand() - .5) * r0, h * (.1 + rand() * .25), (rand() - .5) * r0); ice.rotation.set(rand() * 3, rand() * 3, 0); g.add(ice); }
  g.add(liquid, top, wall);
  if (print) { const decal = new THREE.Mesh(new THREE.CylinderGeometry(r1 * .99 + .003, r0 + .006, h * .6, 64, 1, true, -Math.PI / 2.4, Math.PI / 1.2), new THREE.MeshStandardMaterial({ map: S.colorTex(print), transparent: true, roughness: .4 })); decal.position.y = -h * .02; g.add(decal); }
  const lid = new THREE.Mesh(new THREE.SphereGeometry(r1 * 1.02, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glass(0xffffff, .05)); lid.scale.y = .55; lid.position.y = h / 2; g.add(lid);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r1 + .01, .025, 12, 64), M.glass(0xffffff, .05)); rim.rotation.x = Math.PI / 2; rim.position.y = h / 2; g.add(rim);
  const straw = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, h * 1.15, 16), M.plain(0x4b0129, .4)); straw.position.set(.12, h * .45, 0); straw.rotation.z = -.12; g.add(straw);
  return g;
}

// a paper cup in the first site's print: maroon wrap, a beige band, logos round it
export function paperCup(S, wrap, { r1 = .62, r0 = .46, h = 1.6 } = {}) {
  const { M } = S, g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 96, 1, true), new THREE.MeshPhysicalMaterial({ map: S.colorTex(wrap), roughness: .55, clearcoat: .25 })));
  const ins = new THREE.Mesh(new THREE.CylinderGeometry(r1 - .004, r0 - .004, h, 64, 1, true), M.plain(0xf5efe6, .8)); ins.material.side = THREE.BackSide; g.add(ins);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r1 + .012, .026, 12, 96), M.plain(0xf2ebe1, .6)); rim.rotation.x = Math.PI / 2; rim.position.y = h / 2; g.add(rim);
  const base = new THREE.Mesh(new THREE.CircleGeometry(r0, 48), M.plain(0xf5efe6, .8)); base.rotation.x = -Math.PI / 2; base.position.y = -h / 2 + .05; base.material.side = THREE.DoubleSide; g.add(base);
  return g;
}
export function cupWrap(S) {
  const c = S.paper(2048, 1024, C.maroon, C.maroon, 6), g = c.getContext('2d');
  g.globalAlpha = .1; g.strokeStyle = C.beige; starPattern(g, 2048, 1024, 128, 3); g.globalAlpha = 1;
  g.fillStyle = C.beige; g.fillRect(0, 70, 2048, 14); g.fillRect(0, 940, 2048, 14);
  for (let i = 0; i < 3; i++) S.drawLogo(g, S.logo.beige, 2048 / 3 * (i + .5), 470, 420);
  for (let i = 0; i < 3; i++) S.text(g, NAME, 2048 / 3 * (i + 1), 860, { size: 54, color: C.beigeLight, weight: 600 });
  return c;
}

export const kinds = {
  async mailer(S) {
    const A = art(S), { M, box, rig } = S;
    const W = 2.6, D = 1.9, H = .62;
    const outArt = face(S, 1300, 950, C.maroon, C.goldBright, { logo: .42, y: .4, pattern: .08 });
    const sideArt = S.paper(1300, 300, C.maroon, C.maroon, 5); { const g = sideArt.getContext('2d'); S.text(g, NAME, 650, 150, { size: 70, color: C.goldBright, weight: 700 }); }
    const insideArt = A.pattern(1300, 950, { bg: '#F4ECDE', ink: 'rgba(75,1,41,.35)', cell: 240 });
    const mOut = M.print(outArt, { roughness: .6 }), mSide = M.print(sideArt, { roughness: .6 }), mIn = M.print(insideArt, { roughness: .8 }), edge = M.plain(0x3d0122, .7);
    const make = (open) => {
      const g = new THREE.Group();
      const base = box(W, H, D, { px: mSide, nx: mSide, pz: mSide, nz: mSide, py: mIn }, edge); g.add(base);
      const hinge = new THREE.Group(); hinge.position.set(0, H / 2, -D / 2); g.add(hinge);
      const lid = box(W + .03, .03, D + .03, { py: mOut, ny: mIn }, edge); lid.position.set(0, 0, D / 2); hinge.add(lid);
      const flap = box(W, .03, H * .9, { ny: mIn }, edge); flap.position.set(0, -H * .45, D + .01); flap.rotation.x = Math.PI / 2; hinge.add(flap);
      hinge.rotation.x = open ? -1.95 : 0;
      if (open) {
        const tissue = S.sheet(W * .95, D * .95, new THREE.MeshStandardMaterial({ map: S.colorTex(A.pattern(800, 600, { bg: '#FBF8F2', ink: 'rgba(75,1,41,.35)', cell: 160 })), roughness: .95, side: THREE.DoubleSide }), { wave: .06, seg: 32 });
        tissue.rotation.x = -Math.PI / 2; tissue.position.y = H / 2 - .05; g.add(tissue);
        const seal = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .012, 48), [M.plain(0xc9a97c, .4), M.print(face(S, 300, 300, C.maroon, C.goldBright, { logo: .62, y: .5, name: false })), M.plain(0xc9a97c, .4)]); seal.position.set(.2, H / 2 + .02, .2); g.add(seal);
      }
      return g;
    };
    const a = make(true), b = make(false), c = make(false);
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -.8, H / 2, .2, 18); put(b, 1.55, H / 2, -.9, -22); c.visible = false; S.view({ pitch: 30, dist: 9.4, target: [.2, .6, 0] }); } },
      { look: 'maroon', set() { c.visible = true; put(b, 0, H / 2, 0, 12); put(c, .15, H * 1.5 + .04, .05, -6); a.visible = false; S.view({ pitch: 24, dist: 8, target: [0, .7, 0] }); } },
    ];
  },

  async foodbox(S) {
    const { M, box, rig } = S;
    const W = 2.4, D = 1.6, H = .7;
    const lidArt = S.paper(1200, 800, '#F7EFE2', '#EFE2CC', 6);
    { const g = lidArt.getContext('2d'); g.fillStyle = C.maroon; g.fillRect(0, 0, 1200, 120); g.fillRect(0, 680, 1200, 120); S.text(g, 'لقيمات الديرة', 600, 60, { size: 60, color: C.goldBright, font: FONT.script, weight: 700 }); S.drawLogo(g, S.logoIn(C.goldBright), 1110, 740, 90); S.text(g, 'طازجة يومياً', 600, 740, { size: 40, color: C.beigeLight, weight: 600 }); }
    const winMask = maskFrom(1200, 800, (g) => { g.fillRect(0, 0, 1200, 800); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.roundRect(170, 170, 860, 460, 60); g.fill(); });
    const lidMat = new THREE.MeshStandardMaterial({ map: S.colorTex(lidArt), alphaMap: S.dataTex(winMask), transparent: true, roughness: .6 });
    const sideArt = S.paper(1200, 350, C.maroon, C.maroon, 5); { const g = sideArt.getContext('2d'); S.text(g, NAME, 600, 175, { size: 80, color: C.goldBright, weight: 700 }); }
    const sm = M.print(sideArt, { roughness: .6 });
    const golden = new THREE.MeshPhysicalMaterial({ color: 0xc98a3a, roughness: .35, clearcoat: .8, clearcoatRoughness: .3 });
    const make = (fill) => {
      const g = new THREE.Group();
      const tray = box(W, H, D, { px: sm, nx: sm, pz: sm, nz: sm, py: new THREE.MeshBasicMaterial({ visible: false }) }, sm); g.add(tray);
      const floor = box(W - .04, .02, D - .04, {}, M.plain(0xf3ead9, .9)); floor.position.y = H / 2 - .5; g.add(floor);
      const lid = box(W + .02, .02, D + .02, { py: lidMat }, M.plain(0x3d0122, .6)); lid.position.y = H / 2 + .01; g.add(lid);
      const pet = new THREE.Mesh(new THREE.PlaneGeometry(W * .7, D * .55), M.glass(0xffffff, .03)); pet.rotation.x = -Math.PI / 2; pet.position.y = H / 2 + .03; g.add(pet);
      for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.17 + rand() * .04, 24, 16), fill === 'honey' ? golden : M.plain(0x4a5a2a, .5)); s.position.set((rand() - .5) * W * .62, H / 2 - .3 + rand() * .05, (rand() - .5) * D * .5); s.scale.y = fill === 'honey' ? .9 : .55; if (fill !== 'honey') s.scale.x = 1.7; g.add(s); }
      return g;
    };
    const a = make('honey'), b = make('vine'), c = make('honey');
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -.4, H / 2, .3, 10); put(b, 1.1, H / 2, -1.4, -14); c.visible = false; S.view({ pitch: 42, dist: 8.6, target: [.2, .3, -.3] }); } },
      { look: 'maroon', set() { c.visible = true; put(c, 0, H / 2, 0, -8); put(a, .1, H * 1.5 + .03, .05, 6); b.visible = false; S.view({ pitch: 30, dist: 7.6, target: [0, .7, 0] }); } },
    ];
  },

  async perfume(S) {
    const { M, box, rig, foil } = S;
    const W = 1.1, H = 2.6, D = 1.1;
    const art = face(S, 600, 1400, C.maroon, C.goldBright, { logo: .7, y: .32, name: false, pattern: .1 });
    { const g = art.getContext('2d'); S.text(g, 'عود ملكي', 300, 760, { size: 92, color: C.goldBright, font: FONT.script, weight: 700 }); S.text(g, 'دهن عود · ١٢ مل', 300, 870, { size: 34, color: C.beigeLight, weight: 500 }); }
    const sideArt = S.paper(600, 1400, C.maroonDeep, C.maroonDeep, 5);
    const pm = M.print(art, { roughness: .45 }), sm = M.print(sideArt, { roughness: .5 });
    const boxA = box(W, H, D, { pz: pm, px: sm, nx: sm, nz: pm, py: M.plain(0x2a0016, .5) }, sm);
    const band = box(W + .01, .14, D + .01, {}, M.gold()); band.position.y = -H * .32; boxA.add(band);
    // the bottle: faceted glass with amber oil and a gold cap
    const bottle = new THREE.Group();
    { const glass = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 1.2, 8), M.glass(0xffffff, .02)); bottle.add(glass); const oil = new THREE.Mesh(new THREE.CylinderGeometry(.36, .44, 1.0, 8), new THREE.MeshPhysicalMaterial({ color: 0x9a5512, roughness: .1, clearcoat: 1 })); oil.position.y = -.08; bottle.add(oil); const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .2, 24), M.gold()); neck.position.y = .7; bottle.add(neck); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.2, .26, .5, 8), M.gold()); cap.position.y = 1.02; bottle.add(cap); const knob = new THREE.Mesh(new THREE.SphereGeometry(.13, 24, 12), M.gold()); knob.position.y = 1.32; bottle.add(knob); }
    const boxB = box(W, H, D, { pz: M.print(face(S, 600, 1400, '#F4ECDE', C.maroon, { logo: .7, y: .32, name: false }), { roughness: .45 }) }, M.plain(0xd6c1a0, .5));
    rig.add(boxA, bottle, boxB);
    return [
      { look: 'cream', set() { put(boxA, -.55, H / 2, 0, 24); put(bottle, .75, .6, .4, 0); put(boxB, 1.6, H / 2, -1.2, -28); S.view({ pitch: 10, dist: 8.2, target: [.3, 1.1, 0] }); } },
    ];
  },

  async kraft(S) {
    const { rig } = S;
    const front = kraftCanvas(S, 900, 1100);
    { const g = front.getContext('2d'); S.drawLogo(g, S.logoIn('#3a1608'), 450, 470, 330); S.text(g, NAME, 450, 760, { size: 62, color: '#3a1608', weight: 700 }); S.text(g, 'طباعة شاملة', 450, 840, { size: 34, color: '#3a1608', weight: 400, font: FONT.body, alpha: .8 }); }
    const front2 = kraftCanvas(S, 900, 1100, '#A87545');
    { const g = front2.getContext('2d'); g.fillStyle = C.maroon; g.fillRect(0, 760, 900, 340); S.drawLogo(g, S.logoIn(C.maroon), 450, 420, 360); S.text(g, NAME, 450, 900, { size: 60, color: C.beigeLight, weight: 700 }); }
    const side = kraftCanvas(S, 400, 1100), side2 = kraftCanvas(S, 400, 1100, '#A87545');
    const a = bag(S, { front, side, handle: 'flat', handleColor: 0xa77a4c }), b = bag(S, { w: 1.6, h: 2.1, d: .75, front: front2, side: side2, handle: 'flat', handleColor: 0x8f6338 }), c = bag(S, { w: 1.2, h: 1.5, d: .6, front, side, handle: 'flat', handleColor: 0xa77a4c });
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -.3, 1.25, 0, 14); put(b, 1.6, 1.05, -.6, -18); put(c, -2.0, .75, .6, 30); S.view({ pitch: 8, dist: 10.6, target: [0, 1.3, 0] }); } },
      { look: 'maroon', set() { put(b, -.7, 1.05, 0, 20); put(a, 1.0, 1.25, -.5, -16); c.visible = false; S.view({ pitch: 8, dist: 9.4, target: [.2, 1.4, 0] }); } },
    ];
  },

  async plasticbag(S) {
    const { M, rig } = S;
    const W = 2.2, H = 2.9;
    const shape = (() => { const s = S.roundedRect(W, H, .06); const hole = new THREE.Path(); hole.absellipse(0, H / 2 - .35, .38, .14, 0, Math.PI * 2, true); s.holes.push(hole); return s; })();
    const art = (bg, ink, pat) => { const c = face(S, 880, 1160, bg, ink, { logo: .5, y: .48, pattern: pat }); const g = c.getContext('2d'); g.fillStyle = ink; g.fillRect(0, 1040, 880, 120); S.text(g, '053 584 3085  ·  @printingsticker2022', 440, 1100, { size: 30, color: bg, weight: 500, font: FONT.body }); return c; };
    const mk = (bg, ink, pat) => { const m = new THREE.MeshPhysicalMaterial({ map: S.colorTex(art(bg, ink, pat)), roughness: .25, clearcoat: .8, clearcoatRoughness: .15 }); const g = new THREE.Group(); const f = S.slabShape(shape, .01, m, M.plain(0xffffff, .3)); const b = S.slabShape(shape, .01, m, M.plain(0xffffff, .3)); b.position.z = -.06; b.rotation.y = 0; g.add(f, b); return g; };
    const a = mk('#FFFFFF', C.maroon, 0), b = mk(C.maroon, C.beigeLight, .08), c = mk('#F4ECDE', C.maroon, .06);
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -.8, H / 2, 0, 16); put(b, 1.0, H / 2, -.6, -18); c.visible = false; S.view({ pitch: 6, dist: 9.4, target: [0, 1.5, 0] }); } },
      { look: 'ink', set() { c.visible = true; [a, b, c].forEach((o, i) => lay(o, (i - 1) * 1.7, (i % 2) * -.4, (i - 1) * -10, .02 + i * .02)); S.view({ pitch: 62, dist: 9.6, target: [0, 0, 0] }); } },
    ];
  },

  async plasticcup(S) {
    const { rig } = S;
    const label = cnv => cnv;
    const print = face(S, 1024, 512, 'rgba(0,0,0,0)', C.maroon, { logo: .5, y: .42, name: true, size: .09 });
    { const c = document.createElement('canvas'); }
    const clear = S.paper(1024, 512, '#000', '#000', 0); const g = clear.getContext('2d'); g.clearRect(0, 0, 1024, 512); S.drawLogo(g, S.logoIn(C.maroon), 512, 210, 250); S.text(g, NAME, 512, 410, { size: 60, color: C.maroon, weight: 700 });
    const a = coldCup(S, { print: clear }), b = coldCup(S, { drink: 0xd9a0b0, foam: 0xf4e4ea, print: clear }), c = coldCup(S, { drink: 0x6b8a3a, foam: 0xdfe8c8, print: clear });
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -.2, .95, .3, 0); put(b, 1.4, .95, -.5, 30); put(c, -1.7, .95, -.6, -30); S.view({ pitch: 10, dist: 9, target: [0, 1.1, 0] }); } },
      { look: 'maroon', set() { put(a, 0, .95, 0, 10); b.visible = c.visible = false; S.view({ pitch: 10, dist: 5.4, target: [0, 1.15, 0] }); } },
    ];
  },

  async carrier(S) {
    const { M, box, rig } = S;
    const wrap = cupWrap(S);
    const W = 2.6, D = 2.6, H = .55;
    const kraft = kraftCanvas(S, 1024, 1024);
    { const g = kraft.getContext('2d'); }
    const panelArt = kraftCanvas(S, 1200, 700);
    { const g = panelArt.getContext('2d'); g.fillStyle = C.maroon; g.fillRect(0, 0, 1200, 700); S.drawLogo(g, S.logoIn(C.goldBright), 600, 270, 300); S.text(g, NAME, 600, 560, { size: 64, color: C.goldBright, weight: 700 }); }
    const km = M.print(kraft, { roughness: .9 }), pm = M.print(panelArt, { roughness: .6 });
    const make = (n) => {
      const g = new THREE.Group(), w = n === 4 ? W : W * .55;
      g.add(box(w, H, D, { pz: pm, nz: pm }, km));
      const handle = box(.04, 1.2, D * .8, { px: pm, nx: pm }, km); handle.position.y = H / 2 + .55; g.add(handle);
      const cups = n === 4 ? [[-.62, -.62], [.62, -.62], [-.62, .62], [.62, .62]] : [[0, -.62], [0, .62]];
      cups.forEach(([x, z]) => { const cup = paperCup(S, wrap, { h: 1.7 }); cup.position.set(x * (n === 4 ? 1 : 0), H / 2 + .5, z); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.68, .66, .12, 48), M.plain(0xf4efe7, .4)); lid.position.y = .86; cup.add(lid); g.add(cup); });
      return g;
    };
    const a = make(4), b = make(2);
    rig.add(a, b);
    return [
      { look: 'cream', set() { put(a, -.5, H / 2, 0, 24); put(b, 2.3, H / 2, -1.2, -30); S.view({ pitch: 22, dist: 10, target: [.6, 1, 0] }); } },
      { look: 'ink', set() { put(b, 0, H / 2, 0, 30); a.visible = false; S.view({ pitch: 18, dist: 7, target: [0, 1, 0] }); } },
    ];
  },

  async lids(S) {
    const { M, rig } = S;
    const wrap = cupWrap(S);
    const lidGeo = () => { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.CylinderGeometry(.68, .66, .12, 64), M.plain(0xf4efe7, .35)); const dome = new THREE.Mesh(new THREE.CylinderGeometry(.5, .64, .1, 64), M.plain(0xf4efe7, .35)); dome.position.y = .1; const sip = new THREE.Mesh(new THREE.BoxGeometry(.22, .03, .07), M.plain(0x2a1a14, .5)); sip.position.set(0, .16, .38); g.add(ring, dome, sip); return g; };
    const blackLid = () => { const l = lidGeo(); l.traverse(o => { if (o.isMesh && o.material.color.getHex() === 0xf4efe7) o.material = M.plain(0x1e1a1b, .35); }); return l; };
    const stackW = new THREE.Group(); for (let i = 0; i < 7; i++) { const l = lidGeo(); l.position.y = i * .09; stackW.add(l); }
    const stackB = new THREE.Group(); for (let i = 0; i < 6; i++) { const l = blackLid(); l.position.y = i * .09; stackB.add(l); }
    const cup = paperCup(S, wrap); const top = lidGeo(); top.position.y = .86; cup.add(top);
    const cup2 = paperCup(S, wrap); const top2 = blackLid(); top2.position.y = .86; cup2.add(top2);
    rig.add(stackW, stackB, cup, cup2);
    return [
      { look: 'cream', set() { put(stackW, -1.5, .06, .3, 0, 0, 8); put(stackB, 1.6, .06, -.2); put(cup, 0, .8, -.4, 20); put(cup2, .1, .8, 1.3, -10); cup2.visible = false; S.view({ pitch: 24, dist: 8.4, target: [0, .7, 0] }); } },
    ];
  },

  async jug(S) {
    const { M, box, rig } = S;
    const W = 1.5, D = 1.1, H = 2.0;
    const front = face(S, 750, 1000, C.maroon, C.goldBright, { logo: .5, y: .38, pattern: .08 });
    { const g = front.getContext('2d'); S.text(g, 'قهوة سفري', 375, 760, { size: 70, color: C.goldBright, font: FONT.script, weight: 700 }); S.text(g, 'يكفي ١٠ أكواب', 375, 850, { size: 36, color: C.beigeLight, weight: 500 }); }
    const side = S.paper(550, 1000, C.maroonDeep, C.maroonDeep, 5); { const g = side.getContext('2d'); S.text(g, NAME, 275, 500, { size: 40, color: C.goldBright, weight: 700 }); }
    const fm = M.print(front, { roughness: .55 }), sm = M.print(side, { roughness: .55 });
    const make = () => {
      const g = new THREE.Group();
      g.add(box(W, H, D, { pz: fm, nz: fm, px: sm, nx: sm }, M.plain(0x3d0122, .6)));
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, 1, 4), M.plain(0x3d0122, .6));
      const top1 = box(W, .03, D * .62, {}, M.plain(0x3d0122, .6)); top1.position.set(0, H / 2 + .2, D * .2); top1.rotation.x = .6; g.add(top1);
      const top2 = box(W, .03, D * .62, {}, M.plain(0x3d0122, .6)); top2.position.set(0, H / 2 + .2, -D * .2); top2.rotation.x = -.6; g.add(top2);
      const handle = box(.5, .5, .04, {}, M.plain(0x2a0016, .6)); handle.position.set(0, H / 2 + .55, 0); g.add(handle);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .4, 24), M.plain(0x1e1a1b, .4)); spout.rotation.z = Math.PI / 2; spout.position.set(W / 2 + .1, -H * .3, 0); g.add(spout);
      const tap = box(.2, .14, .14, {}, M.plain(0x1e1a1b, .4)); tap.position.set(W / 2 + .3, -H * .3, 0); g.add(tap);
      return g;
    };
    const a = make();
    // the inner foil bag, shown beside it
    const foilBag = new THREE.Group(); { const pouch = S.sheet(1.2, 1.7, new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: .3, side: THREE.DoubleSide }), { wave: .05, curl: .12, seg: 32 }); foilBag.add(pouch); const sp = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 24), M.plain(0x1e1a1b, .4)); sp.rotation.z = Math.PI / 2; sp.position.set(.65, -.55, .05); foilBag.add(sp); }
    const wrap = cupWrap(S), cups = [0, 1].map(() => paperCup(S, wrap, { h: 1.3, r1: .5, r0: .38 }));
    rig.add(a, foilBag, ...cups);
    return [
      { look: 'cream', set() { put(a, 0, H / 2, 0, -24); foilBag.visible = false; put(cups[0], 1.6, .65, .5); put(cups[1], -1.6, .65, .6); S.view({ pitch: 12, dist: 8.6, target: [0, 1.2, 0] }); } },
      { look: 'maroon', set() { put(a, -.7, H / 2, 0, 20); foilBag.visible = true; put(foilBag, 1.1, 1.05, .2, -20, 0, 6); cups.forEach(c => c.visible = false); S.view({ pitch: 12, dist: 8, target: [.2, 1.2, 0] }); } },
    ];
  },

  async bottles(S) {
    const { M, rig } = S;
    const label = (bg, ink, word) => { const c = S.paper(1024, 300, bg, bg, 4), g = c.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = ink; starPattern(g, 1024, 300, 90, 2); g.globalAlpha = 1; S.drawLogo(g, S.logoIn(ink), 860, 150, 170); S.text(g, word, 470, 120, { size: 74, color: ink, font: FONT.script, weight: 700 }); S.text(g, NAME, 470, 220, { size: 34, color: ink, weight: 600 }); return c; };
    const water = () => {
      const g = new THREE.Group();
      const prof = [[0, -1.3], [.42, -1.3], [.46, -1.2], [.46, .55], [.3, 1.0], [.17, 1.15], [.17, 1.35]].map(p => new THREE.Vector2(...p));
      const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), M.glass(0xeaf4ff, .03)); g.add(body);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.43, .43, 1.9, 48), new THREE.MeshPhysicalMaterial({ color: 0xcfe2f2, roughness: .05, transparent: true, opacity: .45, clearcoat: 1 })); w.position.y = -.33; g.add(w);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .2, 32), M.plain(0x4b0129, .35)); cap.position.y = 1.43; g.add(cap);
      const lab = new THREE.Mesh(new THREE.CylinderGeometry(.47, .47, .7, 64, 1, true), new THREE.MeshPhysicalMaterial({ map: S.colorTex(label('#FBF6EC', C.maroon, 'مياه نقية')), roughness: .3, clearcoat: .6 })); lab.position.y = -.35; g.add(lab);
      return g;
    };
    const jar = () => {
      const g = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 1.3, 64), M.glass(0xffffff, .02)); g.add(glass);
      const honey = new THREE.Mesh(new THREE.CylinderGeometry(.58, .58, 1.18, 48), new THREE.MeshPhysicalMaterial({ color: 0xc77a12, roughness: .1, clearcoat: 1, emissive: 0x3a1a00 })); honey.position.y = -.04; g.add(honey);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(.66, .66, .26, 64), M.gold()); lid.position.y = .78; g.add(lid);
      const lab = new THREE.Mesh(new THREE.CylinderGeometry(.635, .635, .55, 64, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshPhysicalMaterial({ map: S.colorTex(label(C.maroon, C.goldBright, 'عسل سدر')), roughness: .35, clearcoat: .5 })); lab.position.y = -.05; g.add(lab);
      return g;
    };
    const ws = [water(), water(), water()], js = [jar(), jar()];
    // a roll of round stickers beside the jars
    const roll = new THREE.Group();
    { const band = S.paper(1600, 260, '#FFFFFF', '#F4F4F2', 3), bg = band.getContext('2d'); for (let i = 0; i < 10; i++) { bg.fillStyle = C.maroon; bg.beginPath(); bg.arc(80 + i * 160, 130, 100, 0, Math.PI * 2); bg.fill(); S.drawLogo(bg, S.logoIn(C.goldBright), 80 + i * 160, 130, 120); } const core = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .5, 64, 1, true), M.print(band, { roughness: .3 })); core.rotation.x = Math.PI / 2; roll.add(core); const side = new THREE.Mesh(new THREE.RingGeometry(.35, .75, 64), M.plain(0xf3ede2, .8)); side.position.z = .25; roll.add(side); const inner = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .5, 48, 1, true), M.plain(0x9a7a50, .8)); inner.rotation.x = Math.PI / 2; roll.add(inner); }
    rig.add(...ws, ...js, roll);
    return [
      { look: 'cream', set() { js.forEach(j => j.visible = false); roll.visible = false; ws.forEach((w, i) => put(w, (i - 1) * 1.15, 1.3, -Math.abs(i - 1) * .4, (i - 1) * 20)); S.view({ pitch: 8, dist: 8.4, target: [0, 1.2, 0] }); } },
      { look: 'maroon', set() { ws.forEach(w => w.visible = false); js.forEach(j => j.visible = true); roll.visible = true; put(js[0], -.75, .65, 0, 10); put(js[1], .6, .65, -.6, -20); put(roll, 1.9, .75, .5, -75); S.view({ pitch: 12, dist: 7.6, target: [.3, .7, 0] }); } },
    ];
  },

  async raised(S) {
    const { M, box, rig, foil } = S;
    const W = 3, H = 2.1;
    const ground = (hex) => { const c = S.paper(1200, 840, hex, hex, 10); return new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .55, clearcoat: .3 }); };
    const mask = maskFrom(1200, 840, (g, w, h) => { S.drawLogo(g, S.logoIn('#fff'), w / 2, h * .4, h * .5); g.textAlign = 'center'; g.direction = 'rtl'; g.textBaseline = 'middle'; g.font = `700 ${h * .1}px ${FONT.head}`; g.fillText(NAME, w / 2, h * .8); });
    // raised print: the same foil, stacked a few hairs high so its edge catches the light
    const raisedFoil = (silver) => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask, silver ? { color: 0xe6e6e6 } : {})); f.position.z = .012 + i * .004; g.add(f); } return g; };
    const a = new THREE.Group(); a.add(box(W, H, .5, { pz: ground('#4B0129') }, M.plain(0x3d0122, .55)), raisedFoil(false)); a.children[1].position.z = .25;
    const b = new THREE.Group(); b.add(box(W, H, .5, { pz: ground('#231C1E') }, M.plain(0x1e1a1b, .55)), raisedFoil(true)); b.children[1].position.z = .25;
    rig.add(a, b);
    return [
      { look: 'cream', set() { lay(a, -.2, .2, -8, .25); lay(b, 1.4, -1.0, 12, .25); S.view({ yaw: -10, pitch: 48, dist: 7.4, target: [.3, 0, -.2] }); } },
    ];
  },
};
