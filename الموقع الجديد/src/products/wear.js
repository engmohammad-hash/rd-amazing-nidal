/* Cloth: T-shirts, caps, safety vests, tote and cloth bags, garment covers, woven and printed labels, ribbons. */
import { THREE, C, NAME, FONT, rand, starPattern, cnv } from './stage.js';
import { bag, face } from './pack.js';

const DEG = Math.PI / 180;
const lay = (o, x, z, turn = 0, y = 0) => { o.rotation.set(-Math.PI / 2, 0, turn * DEG); o.position.set(x, y, z); return o; };
const put = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };

// woven cloth: a ground colour with a fine weave, for colour and bump
function weave(S, css, W = 1024, H = 1024, k = 26) {
  const c = S.paper(W, H, css, css, k), g = c.getContext('2d');
  g.globalAlpha = .06; g.fillStyle = '#000';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 1, H);
  g.globalAlpha = 1;
  return c;
}
function cloth(S, canvas, { rough = .92, bump = .5, sheen = .12, sheenColor = 0x8a7a70 } = {}) {
  return new THREE.MeshPhysicalMaterial({ map: S.colorTex(canvas), roughness: rough, bumpMap: S.dataTex(canvas), bumpScale: bump, sheen, sheenRoughness: .7, sheenColor });
}
// soft folds in a flat-laid piece of cloth
function wrinkle(geo, amt = .05) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) + amt * (Math.sin(x * 2.3 + y * 1.1) * Math.cos(y * 1.7 - x * .6) + .4 * Math.sin(x * 5.1 - y * 3.3))); }
  geo.computeVertexNormals();
}
function shapeFrom(pts) { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) Array.isArray(pts[i][0]) ? s.quadraticCurveTo(...pts[i][0], ...pts[i][1]) : s.lineTo(...pts[i]); return s; }
// a flat cut of cloth: shape extruded a little, its face printed from the shape's bounds, then given folds
function clothPiece(S, shape, front, depth = .08, folds = .05) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 20 });
  geo.computeBoundingBox();
  const b = geo.boundingBox, pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  geo.translate(0, 0, -depth / 2);
  // subdivide-free folds: displace along z by position
  wrinkle(geo, folds);
  return new THREE.Mesh(geo, front);
}

const TEE = shapeFrom([[-.45, 1.72], [-1.12, 1.52], [-1.78, .98], [-1.42, .52], [-1.02, .78], [-1.04, -1.72], [1.04, -1.72], [1.02, .78], [1.42, .52], [1.78, .98], [1.12, 1.52], [.45, 1.72], [[0, 1.3], [-.45, 1.72]]]);
const VEST = shapeFrom([[-.42, 1.75], [-1.05, 1.62], [-1.0, 1.0], [[-1.38, .55], [-1.32, .2]], [-1.3, -1.7], [1.3, -1.7], [1.32, .2], [[1.38, .55], [1.0, 1.0]], [1.05, 1.62], [.42, 1.75], [0, .7], [-.42, 1.75]]);

export const kinds = {
  async tshirt(S) {
    const { M, rig } = S;
    const art = (css, ink, back) => {
      const c = weave(S, css, 1024, 1024), g = c.getContext('2d');
      if (back) { S.drawLogo(g, S.logoIn(ink), 512, 430, 360); S.text(g, NAME, 512, 690, { size: 56, color: ink, weight: 700 }); S.text(g, 'فريق العمل', 512, 770, { size: 40, color: ink, weight: 500, alpha: .85 }); }
      else { S.drawLogo(g, S.logoIn(ink), 680, 330, 150); S.text(g, 'روعة التصاميم', 680, 440, { size: 30, color: ink, weight: 700 }); }
      return c;
    };
    const rib = (css) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.45, 1.72, .07), new THREE.Vector3(0, .95, .07), new THREE.Vector3(.45, 1.72, .07)), 32, .045, 8), cloth(S, weave(S, css, 128, 128)));
    const tee = (css, ink, back) => { const g = new THREE.Group(); g.add(clothPiece(S, TEE, cloth(S, art(css, ink, back)))); g.add(rib(css)); return g; };
    const a = tee('#4B0129', C.goldBright, false), b = tee('#F4ECDE', C.maroon, true), c = tee('#1E1A1B', C.goldBright, true);
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { lay(a, -1.5, .1, 8, .08); lay(b, 1.6, -.2, -8, .08); c.visible = false; S.view({ pitch: 70, dist: 10.6, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { c.visible = true; [b, a, c].forEach((o, i) => put(o, (i - 1) * 2.2, 0, -Math.abs(i - 1) * .6, (i - 1) * -10)); S.view({ pitch: 4, dist: 11.4, target: [0, 0, 0] }); } },
      { look: 'ink', set() { put(a, 0, 0, 0, -12); b.visible = c.visible = false; S.view({ pitch: 4, dist: 6.2, target: [.2, .6, 0] }); } },
    ];
  },

  async cap(S) {
    const { M, rig } = S;
    const crownArt = (css, ink) => {
      const c = weave(S, css, 1024, 512, 20), g = c.getContext('2d');
      // the front of the crown is at a quarter of the way round
      S.drawLogo(g, S.logoIn(ink), 256, 250, 170);
      g.globalAlpha = .25; g.strokeStyle = '#000'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(k * 1024 / 6, 0); g.lineTo(k * 1024 / 6, 512); g.stroke(); } g.globalAlpha = 1;
      return c;
    };
    const make = (css, brimCss, ink) => {
      const g = new THREE.Group(), art = crownArt(css, ink);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: S.colorTex(art), roughness: .9, bumpMap: S.dataTex(art), bumpScale: 1.2 }));
      crown.scale.set(1, .78, 1.08); g.add(crown);
      const button = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 8), cloth(S, weave(S, css, 64, 64))); button.position.y = .78; g.add(button);
      const brimShape = new THREE.Shape(); brimShape.absellipse(0, 0, 1.0, 1.0, Math.PI, 2 * Math.PI, false); brimShape.absellipse(0, -.05, 1.0, 1.7, 2 * Math.PI, Math.PI, true);
      const bs = new THREE.Shape(); bs.moveTo(-1, 0); bs.quadraticCurveTo(-1, 1.45, 0, 1.55); bs.quadraticCurveTo(1, 1.45, 1, 0); bs.quadraticCurveTo(0, .45, -1, 0);
      const brimGeo = new THREE.ExtrudeGeometry(bs, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 24 });
      const p = brimGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + x * x * .25); } brimGeo.computeVertexNormals();
      const brim = new THREE.Mesh(brimGeo, cloth(S, weave(S, brimCss, 256, 256))); brim.rotation.x = Math.PI / 2 - .12; brim.position.set(0, .02, .55); brim.scale.set(.95, .62, 1); g.add(brim);
      return g;
    };
    const a = make('#4B0129', '#2A0016', C.goldBright), b = make('#F4ECDE', '#4B0129', C.maroon), c = make('#1E1A1B', '#1E1A1B', C.goldBright);
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -1.25, 0, .2, 30); put(b, 1.25, 0, -.4, -30); c.visible = false; S.view({ pitch: 18, dist: 8.4, target: [0, .4, .3] }); } },
      { look: 'ink', set() { c.visible = true; put(a, -1.5, 0, 0, 40); put(c, 0, 0, .5, 0); put(b, 1.6, 0, -.2, -40); S.view({ pitch: 22, dist: 9.4, target: [0, .4, .4] }); } },
    ];
  },

  async vest(S) {
    const { M, rig } = S;
    const art = (css) => {
      const c = weave(S, css, 1024, 1024, 18), g = c.getContext('2d');
      g.fillStyle = '#C9CDD0'; g.fillRect(0, 560, 1024, 70); g.fillRect(0, 760, 1024, 70);
      g.fillRect(210, 0, 70, 560); g.fillRect(744, 0, 70, 560);
      S.drawLogo(g, S.logoIn('#2A0016'), 640, 420, 120);
      S.text(g, 'روعة التصاميم', 640, 505, { size: 26, color: '#2A0016', weight: 700 });
      return c;
    };
    const make = (css) => {
      const g = new THREE.Group(), m = new THREE.MeshPhysicalMaterial({ map: S.colorTex(art(css)), roughness: .85, sheen: .3 });
      g.add(clothPiece(S, VEST, m, .06, .04));
      // the reflective strips, catching the light
      const refl = new THREE.MeshStandardMaterial({ color: 0xd4d6d8, metalness: .9, roughness: .25 });
      for (const y of [-.83, -1.5]) { const s = S.box(2.62, .23, .015, {}, refl); s.position.set(0, y + .52, .06); g.add(s); }
      return g;
    };
    const a = make('#F26A1B'), b = make('#C8E02A'), c = make('#4B0129');
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { lay(a, -1.45, .1, 6, .08); lay(b, 1.5, -.1, -6, .08); c.visible = false; S.view({ pitch: 70, dist: 10.2, target: [0, 0, 0] }); } },
      { look: 'ink', set() { c.visible = false; put(b, -.4, 0, 0, 14); put(a, 1.6, -.05, -.8, -16); S.view({ pitch: 4, dist: 9.6, target: [.4, 0, 0] }); } },
    ];
  },

  async tote(S) {
    const { M, rig } = S;
    const canvasArt = (css, ink, big) => {
      const c = weave(S, css, 900, 1000, 18), g = c.getContext('2d');
      S.drawLogo(g, S.logoIn(ink), 450, big ? 430 : 470, big ? 420 : 300);
      S.text(g, NAME, 450, big ? 760 : 720, { size: 56, color: ink, weight: 700 });
      return c;
    };
    const flat = (css, ink, big) => {
      const g = new THREE.Group(), m = cloth(S, canvasArt(css, ink, big));
      const body = S.box(2, 2.25, .05, { pz: m, nz: m }, cloth(S, weave(S, css, 128, 128)));
      g.add(body);
      const hm = cloth(S, weave(S, css, 128, 512, 12));
      for (const x of [-.45, .45]) {
        const s = S.strip([[x - .1, 1.05, .03], [x - .05, 1.8, .06], [0, 2.25, .08], [-x * .02 + (x > 0 ? .3 : -.3) * 0, 2.25, .08]].slice(0, 3).concat([[x > 0 ? x - .9 : x + .9, 1.05, .03]].map(p => p)), .14, hm, { up: [0, 0, 1] });
        g.add(s); break;
      }
      return g;
    };
    // the handle as one loop from one top corner to the other
    const tote = (css, ink, big) => {
      const g = flat(css, ink, big); g.remove(g.children[1]);
      const hm = cloth(S, weave(S, css, 128, 512, 12));
      for (const z of [.03, -.03]) g.add(S.strip([[-.5, 1.0, z], [-.45, 1.75, z * 2], [0, 2.15, z * 2], [.45, 1.75, z * 2], [.5, 1.0, z]], .14, hm, { up: [0, 0, 1] }));
      return g;
    };
    const a = tote('#EDE3D0', C.maroon, false), b = tote('#4B0129', C.goldBright, true), c = tote('#1E1A1B', C.goldBright, false);
    // a non-woven shopping bag with a gusset, for the cloth bags
    const nw = (css, ink) => bag(S, { w: 2.1, h: 2.4, d: .8, front: face(S, 900, 1000, weave(S, css, 900, 1000, 14), ink, { logo: .45, y: .42 }), side: weave(S, css, 400, 1000, 14), handle: 'flat', handleColor: new THREE.Color(css).getHex() });
    const d = nw('#4B0129', C.goldBright), e = nw('#D6C1A0', C.maroon);
    rig.add(a, b, c, d, e);
    return [
      { look: 'cream', set() { [d, e].forEach(o => o.visible = false); put(a, -1.15, 1.1, 0, 12); put(b, 1.15, 1.1, -.4, -12); c.visible = false; S.view({ pitch: 4, dist: 10, target: [0, 1.4, 0] }); } },
      { look: 'maroon', set() { [d, e].forEach(o => o.visible = false); c.visible = true; [a, b, c].forEach((o, i) => lay(o, (i - 1) * 2.25, (i % 2) * -.3, (i - 1) * -6, .03 + i * .01)); S.view({ pitch: 70, dist: 10.4, target: [0, 0, -.2] }); } },
      { look: 'cream', set() { [a, b, c].forEach(o => o.visible = false); d.visible = e.visible = true; put(d, -1.05, 1.2, 0, 16); put(e, 1.2, 1.2, -.6, -18); S.view({ pitch: 6, dist: 10, target: [0, 1.4, 0] }); } },
    ];
  },

  async garment(S) {
    const { M, rig } = S;
    const SH = shapeFrom([[-1.15, -2.2], [1.15, -2.2], [1.15, 1.35], [[1.1, 1.8], [.45, 1.95]], [.1, 2.1], [-.1, 2.1], [-.45, 1.95], [[-1.1, 1.8], [-1.15, 1.35]], [-1.15, -2.2]]);
    const art = (css, ink) => { const c = weave(S, css, 800, 1500, 12), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(ink), 400, 560, 300); S.text(g, NAME, 400, 820, { size: 50, color: ink, weight: 700 }); S.text(g, 'عبايات فاخرة', 400, 900, { size: 38, color: ink, font: FONT.script, weight: 700 }); g.fillStyle = ink; g.globalAlpha = .5; g.fillRect(398, 1000, 4, 460); g.globalAlpha = 1; return c; };
    const make = (css, ink) => {
      const g = new THREE.Group(); g.add(clothPiece(S, SH, cloth(S, art(css, ink), { sheen: .7 }), .1, .035));
      const hook = new THREE.Mesh(new THREE.TorusGeometry(.22, .03, 12, 32, Math.PI * 1.4), M.silver()); hook.position.set(0, 2.45, 0); hook.rotation.z = -.4; g.add(hook);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .3, 12), M.silver()); stem.position.set(0, 2.15, 0); g.add(stem);
      return g;
    };
    const a = make('#4B0129', C.goldBright), b = make('#E6D7BC', C.maroon), c = make('#1E1A1B', C.goldBright);
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -1.3, 2.2, 0, 10); put(b, 1.3, 2.2, -.5, -10); c.visible = false; S.view({ pitch: 2, dist: 11.4, target: [0, 2.3, 0] }); } },
      { look: 'maroon', set() { c.visible = true; [b, c, a].forEach((o, i) => put(o, (i - 1) * 1.5, 2.2, -Math.abs(i - 1) * .8 + i * .05, (i - 1) * -14)); S.view({ pitch: 2, dist: 11.4, target: [0, 2.3, 0] }); } },
    ];
  },

  async labels(S) {
    const { M, rig } = S;
    const label = (css, ink, k) => {
      const c = weave(S, css, 600, 220, 8), g = c.getContext('2d');
      g.globalAlpha = .12; g.fillStyle = '#000'; for (let y = 0; y < 220; y += 3) g.fillRect(0, y, 600, 1); g.globalAlpha = 1;
      if (k % 2) { S.drawLogo(g, S.logoIn(ink), 120, 110, 120); S.text(g, 'روعة التصاميم', 370, 110, { size: 52, color: ink, font: FONT.script, weight: 700 }); }
      else { S.text(g, 'RD AMAZING', 300, 82, { size: 58, color: ink, dir: 'ltr', weight: 700, font: FONT.head, spacing: 8 }); S.text(g, 'روعة التصاميم', 300, 160, { size: 34, color: ink, weight: 600 }); }
      g.strokeStyle = ink; g.globalAlpha = .5; g.lineWidth = 3; g.strokeRect(10, 10, 580, 200); g.globalAlpha = 1;
      return c;
    };
    const make = (css, ink, k) => { const m = new THREE.MeshPhysicalMaterial({ map: S.colorTex(label(css, ink, k)), roughness: .7, sheen: .15, sheenColor: 0x8a7a70, bumpMap: S.dataTex(label(css, ink, k)), bumpScale: .8 }); const mesh = S.sheet(1.5, .55, m, { curl: .04, seg: 8 }); return mesh; };
    const set = [['#4B0129', C.goldBright], ['#F4ECDE', C.maroon], ['#1E1A1B', C.goldBright], ['#D6C1A0', C.maroon], ['#FFFFFF', C.maroon], ['#4B0129', '#F4ECDE']].map(([a, b], i) => make(a, b, i));
    // a fold of cloth with a label sewn into its neck
    const fabric = S.sheet(4, 2.6, cloth(S, weave(S, '#2A2426', 1024, 1024, 14)), { wave: .08, seg: 48 });
    rig.add(...set, fabric);
    return [
      { look: 'cream', set() { fabric.visible = false; set.forEach((l, i) => lay(l, (i % 2 - .5) * 1.75, (Math.floor(i / 2) - 1) * .78, (rand() - .5) * 14, .01 + i * .005)); S.view({ pitch: 66, dist: 6.4, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { fabric.visible = true; lay(fabric, 0, 0, 0, .01); set.forEach((l, i) => { l.visible = i < 3; }); lay(set[0], -.6, -.4, -4, .09); lay(set[1], .9, .5, 10, .09); lay(set[2], -.9, .7, -14, .09); S.view({ pitch: 60, dist: 6.8, target: [0, 0, .1] }); } },
    ];
  },

  async heatlabel(S) {
    const { M, rig } = S;
    const art = () => {
      const c = weave(S, '#F4ECDE', 1024, 1024, 18), g = c.getContext('2d');
      // printed inside, just under the collar, where a sewn label would be
      S.drawLogo(g, S.logoIn(C.maroon), 512, 175, 64);
      S.text(g, 'روعة التصاميم', 512, 228, { size: 28, color: C.maroon, font: FONT.script, weight: 700 });
      S.text(g, 'M', 512, 268, { size: 30, color: C.maroon, dir: 'ltr', weight: 700 });
      S.text(g, '١٠٠٪ قطن', 512, 302, { size: 17, color: C.maroon, weight: 500, alpha: .85 });
      return c;
    };
    const tee = clothPiece(S, TEE, cloth(S, art()));
    const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.45, 1.72, .07), new THREE.Vector3(0, .95, .07), new THREE.Vector3(.45, 1.72, .07)), 32, .05, 8), cloth(S, weave(S, '#E6D7BC', 128, 128)));
    const g = new THREE.Group(); g.add(tee, rib); rig.add(g);
    return [
      { look: 'maroon', set() { lay(g, 0, 0, 0, .08); S.view({ pitch: 74, dist: 3.4, target: [0, 0, -1.1] }); } },
    ];
  },

  async ribbon(S) {
    const { M, rig } = S;
    const ribArt = (css, ink) => { const c = S.paper(2048, 128, css, css, 6), g = c.getContext('2d'); for (let x = 140; x < 2048; x += 520) { S.text(g, 'روعة التصاميم', x, 66, { size: 62, color: ink, font: FONT.script, weight: 700 }); S.drawLogo(g, S.logoIn(ink), x + 260, 64, 80); } return c; };
    const satin = (c) => new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .32, sheen: 1, sheenColor: 0xffffff, sheenRoughness: .3, clearcoat: .3 });
    const spool = (css, ink) => {
      const g = new THREE.Group(), art = ribArt(css, ink);
      const wound = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, .48, 96, 1, true), satin(art)); wound.material.map.repeat.set(1, 1); g.add(wound);
      for (const s of [1, -1]) { const disc = new THREE.Mesh(new THREE.RingGeometry(.32, .95, 64), M.plain(0xf3ede2, .7)); disc.rotation.x = s * Math.PI / 2; disc.position.y = s * .25; disc.material.side = THREE.DoubleSide; g.add(disc); }
      const end = S.strip([[0, 0, .82], [.6, -.05, 1.3], [1.4, 0, 1.6], [2.2, .02, 1.5]], .44, satin(ribArt(css, ink)), { up: [0, 1, 0], twist: .3, along: 16 });
      // the loose end is seen from its other side: turn its print the right way up
      end.material.map.wrapS = THREE.RepeatWrapping; end.material.map.center.set(.5, .5); end.material.map.rotation = Math.PI; g.add(end);
      return g;
    };
    const a = spool('#4B0129', C.goldBright), b = spool('#F4ECDE', C.maroon), c = spool('#FFFFFF', '#B8914F');
    rig.add(a, b, c);
    return [
      { look: 'cream', set() { put(a, -1.6, .25, 0, 10); put(b, .2, .25, -.6, -30); put(c, 1.7, .25, .3, 60); S.view({ pitch: 30, dist: 9, target: [.3, .3, .3] }); } },
      { look: 'maroon', set() { put(b, -.4, .25, 0, 20); a.visible = c.visible = false; S.view({ pitch: 34, dist: 6, target: [.4, .2, .6] }); } },
    ];
  },
};
