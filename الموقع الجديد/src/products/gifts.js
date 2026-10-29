/* Gifts and desk pieces: crystal, acrylic and wood awards, mugs, pens, keyrings, self-inking stamps, acrylic
   counter stands and cut acrylic pieces. */
import { THREE, C, NAME, FONT, rand, starPattern, maskFrom } from './stage.js';
import { face } from './pack.js';

const DEG = Math.PI / 180;
const lay = (o, x, z, turn = 0, y = 0) => { o.rotation.set(-Math.PI / 2, 0, turn * DEG); o.position.set(x, y, z); return o; };
const put = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };

// engraving on clear material: frosted white artwork that floats just inside the face
function engraving(S, w, h, draw, z, opacity = .85) {
  const c = S.paper(1024, Math.round(1024 * h / w), '#000', '#000', 0), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  draw(g, c.width, c.height);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: S.colorTex(c), transparent: true, opacity, roughness: .9, depthWrite: false }));
  m.position.z = z;
  return m;
}
function awardText(S, ink = '#fff') {
  return (g, w, h) => {
    S.drawLogo(g, S.logoIn(ink), w / 2, h * .2, w * .26);
    S.text(g, 'درع تكريم', w / 2, h * .42, { size: w * .1, color: ink, font: FONT.script, weight: 700 });
    S.text(g, 'تقديراً لجهودكم المتميزة', w / 2, h * .54, { size: w * .05, color: ink, weight: 500 });
    S.text(g, 'م. فيصل الدوسري', w / 2, h * .64, { size: w * .065, color: ink, weight: 700 });
    S.text(g, '٢٠٢٦', w / 2, h * .76, { size: w * .05, color: ink, weight: 500, alpha: .8 });
  };
}

export const kinds = {
  async award(S) {
    const { M, box, rig, foil } = S;
    // crystal: a thick clear slab with a pointed top on a black base, engraved
    const crystal = new THREE.Group();
    {
      const sh = new THREE.Shape(); sh.moveTo(-.8, -1.2); sh.lineTo(.8, -1.2); sh.lineTo(.8, .9); sh.lineTo(0, 1.5); sh.lineTo(-.8, .9); sh.lineTo(-.8, -1.2);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: .35, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 3 }); geo.translate(0, 0, -.175);
      crystal.add(new THREE.Mesh(geo, M.acrylic(0xeef6ff)));
      crystal.add(engraving(S, 1.5, 2.5, awardText(S), .218, .8));   // on the face: a clear body hides what lies inside it
      const base = box(2.1, .45, .9, {}, M.plain(0x111012, .25, .3)); base.position.y = -1.45; crystal.add(base);
      const plate = box(1.2, .2, .01, {}, M.gold()); plate.position.set(0, -1.45, .455); crystal.add(plate);
    }
    // wood: a walnut plaque with a gold plate
    const wood = new THREE.Group();
    {
      const grain = S.paper(512, 768, '#5a3420', '#3e2214', 18), g = grain.getContext('2d'); g.globalAlpha = .18; g.strokeStyle = '#1e0e06'; for (let i = 0; i < 60; i++) { g.lineWidth = 1 + rand() * 3; g.beginPath(); const x = rand() * 512; g.moveTo(x, 0); g.bezierCurveTo(x + 30, 250, x - 30, 500, x + 10, 768); g.stroke(); } g.globalAlpha = 1;
      const wm = new THREE.MeshPhysicalMaterial({ map: S.colorTex(grain), roughness: .35, clearcoat: .8 });
      wood.add(box(2, 2.6, .18, {}, wm));
      const plate = box(1.6, 2.1, .02, { pz: new THREE.MeshStandardMaterial({ map: S.colorTex(face(S, 640, 840, '#C9A97C', '#2A0016', { logo: .3, y: .25, name: false })), metalness: .85, roughness: .28 }) }, M.gold());
      plate.position.z = .1; wood.add(plate);
      const txt = engraving(S, 1.5, 2, (g2, w, h) => { awardText(S, '#2A0016')(g2, w, h); }, .112, .95); wood.add(txt);
    }
    // acrylic: a clear standing disc with a gold printed face
    const acr = new THREE.Group();
    {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .2, 96), M.acrylic(0xffffff)); disc.rotation.x = Math.PI / 2; acr.add(disc);
      const mask = maskFrom(1024, 1024, (g, w, h) => awardText(S, '#fff')(g, w, h));
      const f = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), foil(mask)); f.position.z = .101; acr.add(f);
      const base = box(1.5, .3, .6, {}, M.plain(0x4b0129, .35, .2)); base.position.y = -1.2; acr.add(base);
    }
    rig.add(crystal, wood, acr);
    return [
      { look: 'ink', set() { put(crystal, 0, 1.68, 0, -14); wood.visible = acr.visible = false; S.glint.intensity = 0; S.view({ pitch: 6, dist: 7.2, target: [0, 1.5, 0] }); } },
      { look: 'cream', set() { wood.visible = acr.visible = true; put(wood, -1.4, 1.3, -.3, 18, -8); put(acr, 1.3, 1.35, .2, -20); crystal.visible = false; S.view({ pitch: 8, dist: 8.4, target: [0, 1.3, 0] }); } },
    ];
  },

  async mug(S) {
    const { M, rig } = S;
    const wrapArt = (css, ink) => { const c = S.paper(2048, 800, css, css, 3), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(ink), 512, 340, 380); S.text(g, NAME, 512, 640, { size: 64, color: ink, weight: 700 }); S.drawLogo(g, S.logoIn(ink), 1536, 340, 380); S.text(g, 'روعة التصاميم', 1536, 640, { size: 80, color: ink, font: FONT.script, weight: 700 }); return c; };
    const mug = (css, ink, { glossy = true, inner = 0xf7f5f0 } = {}) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.75, 96, 1, true), new THREE.MeshPhysicalMaterial({ map: S.colorTex(wrapArt(css, ink)), roughness: glossy ? .15 : .6, clearcoat: glossy ? 1 : .2 }));
      body.rotation.y = -Math.PI / 2; g.add(body);
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 1.7, 64, 1, true), M.plain(inner, .2)); ins.material.side = THREE.BackSide; g.add(ins);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(.725, .03, 12, 96), M.plain(inner, .2)); lip.rotation.x = Math.PI / 2; lip.position.y = .875; g.add(lip);
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(.72, 64), M.plain(inner, .2)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -.8; g.add(bottom);
      const coffee = new THREE.Mesh(new THREE.CircleGeometry(.7, 64), M.plain(0x2a140a, .15)); coffee.rotation.x = -Math.PI / 2; coffee.position.y = .7; g.add(coffee);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(.42, .09, 16, 48, Math.PI * 1.1), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(css), roughness: glossy ? .15 : .6, clearcoat: glossy ? 1 : .2 }));
      handle.rotation.z = -Math.PI * .55; handle.position.set(.78, .02, 0); g.add(handle);
      return g;
    };
    const white = mug('#FBFAF6', C.maroon), maroon = mug('#4B0129', C.goldBright), black = mug('#151314', '#151314', { glossy: false });
    // a heat mug half way through its change: black above, the print showing below
    const half = mug('#F4ECDE', C.maroon, { glossy: false });
    { const cover = new THREE.Mesh(new THREE.CylinderGeometry(.752, .752, .9, 96, 1, true), M.plain(0x151314, .55)); cover.position.y = .42; half.add(cover); }
    rig.add(white, maroon, black, half);
    return [
      { look: 'cream', set() { put(white, -1.0, .88, 0, 20); put(maroon, 1.0, .88, -.5, -20); black.visible = half.visible = false; S.view({ pitch: 12, dist: 7.6, target: [0, .9, 0] }); } },
      { look: 'ink', set() { white.visible = maroon.visible = false; black.visible = half.visible = true; put(black, -1.0, .88, -.3, 30); put(half, 1.0, .88, 0, -10); S.view({ pitch: 12, dist: 7.6, target: [0, .9, 0] }); } },
      { look: 'maroon', set() { black.visible = half.visible = false; white.visible = maroon.visible = true; put(maroon, -.6, .88, -.4, 40); put(white, .9, .88, .3, -30); S.view({ pitch: 22, dist: 7, target: [0, .8, 0] }); } },
    ];
  },

  async pens(S) {
    const { M, box, rig } = S;
    const pen = (barrel, metal = 'gold') => {
      const g = new THREE.Group(), trim = metal === 'gold' ? M.gold() : M.silver();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.08, .075, 2.6, 48), new THREE.MeshPhysicalMaterial({ color: barrel, roughness: .2, metalness: .3, clearcoat: 1 })); g.add(body);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(.075, .3, 48), trim); tip.position.y = -1.45; tip.rotation.x = Math.PI; g.add(tip);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .08, 48), trim); ring.position.y = .5; g.add(ring);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .14, 48), trim); top.position.y = 1.36; g.add(top);
      const clip = box(.05, .9, .04, {}, trim); clip.position.set(0, .9, .1); g.add(clip);
      // the logo printed along the barrel
      const c = S.paper(1024, 128, '#000', '#000', 0), cg = c.getContext('2d'); cg.clearRect(0, 0, 1024, 128); S.text(cg, 'روعة التصاميم', 512, 64, { size: 70, color: metal === 'gold' ? '#E4C690' : '#EDEDED', font: FONT.script, weight: 700 });
      const label = new THREE.Mesh(new THREE.CylinderGeometry(.0805, .0805, 1.0, 48, 1, true, -.6, 1.2), new THREE.MeshStandardMaterial({ map: S.colorTex(c), transparent: true, metalness: .6, roughness: .3 }));
      label.position.y = -.2; label.rotation.y = Math.PI / 2; g.add(label);
      return g;
    };
    const ps = [pen(0x4b0129), pen(0x151314), pen(0x1f3a5f, 'silver'), pen(0xf3ede2), pen(0x4b0129, 'silver')];
    // a gift box with a velvet bed
    const gift = new THREE.Group();
    { const base = box(3.4, .35, 1.3, { py: M.plain(0x2a0016, .95) }, M.plain(0x4b0129, .4)); gift.add(base); const lid = box(3.45, .1, 1.35, { py: M.print(face(S, 1200, 460, C.maroon, C.goldBright, { logo: .5, y: .45, name: true, size: .1 })) }, M.plain(0x4b0129, .4)); lid.position.set(0, .7, -.72); lid.rotation.x = -1.2; gift.add(lid); }
    rig.add(...ps, gift);
    return [
      { look: 'cream', set() { gift.visible = false; ps.forEach((p, i) => { p.rotation.set(0, (i - 2) * .12, Math.PI / 2 + (i - 2) * .05); p.position.set((i - 2) * .02, .1, (i - 2) * .38); }); S.view({ pitch: 58, dist: 5.6, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { gift.visible = true; gift.position.set(0, .17, 0); ps.forEach((p, i) => { p.visible = i < 2; p.rotation.set(0, 0, Math.PI / 2); p.position.set(0, .45, (i - .5) * .45); }); S.view({ pitch: 40, dist: 6.4, target: [0, .3, 0] }); } },
    ];
  },

  async keyring(S) {
    const { M, box, rig, foil } = S;
    const ring = () => new THREE.Mesh(new THREE.TorusGeometry(.32, .035, 12, 48), M.silver());
    const chain = (n = 3) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(.07, .018, 8, 20), M.silver()); l.position.y = i * .12; l.rotation.y = i % 2 ? Math.PI / 2 : 0; g.add(l); } return g; };
    const assemble = (tag, tagTop) => { const g = new THREE.Group(); g.add(tag); const ch = chain(); ch.position.y = tagTop + .06; g.add(ch); const r = ring(); r.position.y = tagTop + .7; g.add(r); return g; };
    // metal: a gold-rimmed disc with the logo in enamel
    const metal = (() => { const d = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .08, 64), [M.gold(), M.print(face(S, 512, 512, C.maroon, C.goldBright, { logo: .65, y: .5, name: false })), M.gold()]); d.rotation.x = Math.PI / 2; return assemble(d, .6); })();
    // leather: a stitched tab with a debossed logo
    const leather = (() => { const c = S.paper(400, 900, '#4B0129', '#3a0120', 26); const g = c.getContext('2d'); g.setLineDash([10, 8]); g.strokeStyle = '#D6C1A0'; g.lineWidth = 4; g.strokeRect(24, 24, 352, 852); S.drawLogo(g, S.logoIn('#2a0016'), 200, 460, 220); const m = new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .6, bumpMap: S.dataTex(c), bumpScale: .6, clearcoat: .2 }); const t = S.slabShape(S.roundedRect(.7, 1.5, .3), .08, m, M.plain(0x2a0016, .6)); return assemble(t, .75); })();
    // acrylic: a clear shape with a printed face
    const acr = (() => { const t = S.slabShape(S.roundedRect(1.1, 1.1, .2), .1, M.acrylic(0xffffff), M.acrylic(0xffffff)); const pr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshStandardMaterial({ map: S.colorTex(face(S, 512, 512, '#F4ECDE', C.maroon, { logo: .55, y: .42, name: true, size: .08 })), roughness: .4 })); pr.position.z = -.02; t.add(pr); return assemble(t, .55); })();
    rig.add(metal, leather, acr);
    return [
      { look: 'cream', set() { [metal, leather, acr].forEach((k, i) => lay(k, (i - 1) * 1.5, (i % 2) * .4, (i - 1) * -12, .06)); S.view({ pitch: 64, dist: 6.6, target: [0, 0, -.3] }); } },
      { look: 'ink', set() { put(metal, -1.1, 1, 0, 20); put(leather, 0, .9, -.4, 0); put(acr, 1.15, 1.05, 0, -20); S.view({ pitch: 4, dist: 6.6, target: [0, 1.2, 0] }); } },
    ];
  },

  async stamp(S) {
    const { M, box, rig } = S;
    const stamp = (body, ink) => {
      const g = new THREE.Group();
      const frame = box(1.5, 1.2, .85, {}, new THREE.MeshPhysicalMaterial({ color: body, roughness: .3, clearcoat: .6 })); frame.position.y = .9; g.add(frame);
      const win = box(.9, .5, .02, { pz: M.print(face(S, 600, 330, '#fff', ink, { logo: .5, y: .45, name: false })) }, M.plain(0xffffff, .3)); win.position.set(0, .95, .43); g.add(win);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .55, 48), new THREE.MeshPhysicalMaterial({ color: body, roughness: .3, clearcoat: .6 })); knob.position.y = 1.65; g.add(knob);
      const capTop = new THREE.Mesh(new THREE.SphereGeometry(.42, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: body, roughness: .3, clearcoat: .6 })); capTop.position.y = 1.92; capTop.scale.y = .4; g.add(capTop);
      const pad = box(1.4, .25, .75, {}, M.plain(0x222022, .5)); pad.position.y = .2; g.add(pad);
      return g;
    };
    // the impression it leaves on paper
    const impression = S.paper(1200, 900, '#FBF8F2', '#F4EEE3', 5);
    { const g = impression.getContext('2d'); S.lines(g, 120, 140, 960, 6, { gap: 46, h: 10 }); g.save(); g.translate(760, 600); g.rotate(-.12); g.globalAlpha = .85; g.strokeStyle = '#1F3A8F'; g.fillStyle = '#1F3A8F'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 170, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 140, 0, Math.PI * 2); g.stroke(); S.drawLogo(g, S.logoIn('rgba(31,58,143,.9)'), 0, -20, 140); g.textAlign = 'center'; g.direction = 'rtl'; g.font = `700 34px ${FONT.head}`; g.fillText(NAME, 0, 100); g.restore(); }
    const paper = box(3.4, 2.55, .006, { pz: M.print(impression, { roughness: .85 }) }, M.paper(0xf3ede2));
    const a = stamp(0x4b0129, C.maroon), b = stamp(0x151314, '#1F3A8F');
    rig.add(paper, a, b);
    return [
      { look: 'cream', set() { lay(paper, 0, 0, 0, .004); put(a, -1.2, 0, -.4, 20); put(b, 1.85, 0, .2, -30); b.visible = false; S.view({ pitch: 40, dist: 8, target: [0, .4, 0] }); } },
      { look: 'maroon', set() { paper.visible = true; lay(paper, .6, .3, -10, .004); b.visible = true; put(a, -1.3, 0, -.4, 24); put(b, -.1, 0, -1.1, -10); S.view({ pitch: 30, dist: 8, target: [0, .6, 0] }); } },
    ];
  },

  async stand(S) {
    const { M, box, rig } = S;
    // an L-shaped clear stand holding a printed card: a menu, a QR code
    const qrCard = (() => {
      const c = S.paper(600, 850, '#FBF6EC', '#FBF6EC', 4), g = c.getContext('2d');
      S.drawLogo(g, S.logoIn(C.maroon), 300, 110, 120);
      S.text(g, 'امسح الكود', 300, 230, { size: 50, color: C.maroon, weight: 700 });
      g.fillStyle = C.maroon; const s = 300, x0 = 150, y0 = 290;
      for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) { const corner = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17); if (corner ? ((x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5) || (x > 19 && x < 23 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 19 && y < 23) || x === 24 || y === 24) && !(x > 6 && x < 18) && !(y > 6 && y < 18)) : rand() > .5) g.fillRect(x0 + x * s / 25, y0 + y * s / 25, s / 25 + .5, s / 25 + .5); }
      S.text(g, 'لتصفح المنيو', 300, 690, { size: 40, color: C.maroon, weight: 600 });
      S.text(g, NAME, 300, 780, { size: 28, color: C.gold, weight: 600 });
      return c;
    })();
    const menuCard = (() => { const c = S.paper(600, 850, C.maroon, C.maroonDeep, 5), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(C.goldBright), 300, 110, 110); S.text(g, 'قائمة اليوم', 300, 220, { size: 56, color: C.goldBright, font: FONT.script, weight: 700 }); [['لاتيه', '١٨'], ['موكا', '١٩'], ['كرك', '١٠'], ['ماتشا', '٢٢'], ['تشيز كيك', '٢٤']].forEach(([n, p], i) => { S.text(g, n, 500, 330 + i * 90, { size: 38, color: C.beigeLight, align: 'right', weight: 600 }); S.text(g, p, 100, 330 + i * 90, { size: 38, color: C.goldBright, align: 'left', weight: 700 }); }); return c; })();
    const make = (card) => {
      const g = new THREE.Group();
      const back = box(1.3, 1.8, .06, {}, M.acrylic()); back.position.set(0, .95, -.04); back.rotation.x = -.12; g.add(back);
      const base = box(1.3, .06, .8, {}, M.acrylic()); base.position.set(0, .03, .25); g.add(base);
      const front = box(1.25, 1.75, .01, { pz: M.print(card, { roughness: .4 }) }, M.paper(0xffffff)); front.position.set(0, .95, .0); front.rotation.x = -.12; g.add(front);
      const lip = box(1.3, .25, .05, {}, M.acrylic()); lip.position.set(0, .14, .1); g.add(lip);
      return g;
    };
    const a = make(qrCard), b = make(menuCard);
    rig.add(a, b);
    return [
      { look: 'maroon', set() { put(a, -.8, 0, 0, 18); put(b, .85, 0, -.4, -18); S.view({ pitch: 10, dist: 5.8, target: [0, .9, 0] }); } },
      { look: 'cream', set() { put(b, -.8, 0, -.3, 22); put(a, .8, 0, 0, -16); S.view({ pitch: 14, dist: 5.8, target: [0, .9, 0] }); } },
    ];
  },

  async acrylic(S) {
    const { M, box, rig, foil } = S;
    // cut shapes: an eight-point star, a circle and a name, in clear and coloured acrylic
    const star = (() => { const s = new THREE.Shape(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8 + Math.PI / 16, r = k % 2 ? .62 : 1.1; const x = Math.cos(a) * r, y = Math.sin(a) * r; k ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath(); return s; })();
    const disc = (() => { const s = new THREE.Shape(); s.absarc(0, 0, 1, 0, Math.PI * 2); return s; })();
    const clear = M.acrylic(0xffffff), tinted = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .08, transmission: .7, thickness: .3, ior: 1.49, clearcoat: 1 });
    const solid = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: .12, clearcoat: 1 });
    const cut = (shape, mat, d = .12) => { const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2, curveSegments: 48 }); g.translate(0, 0, -d / 2); return new THREE.Mesh(g, mat); };
    const pieces = [cut(star, solid(0x4b0129)), cut(disc, clear), cut(star, tinted(0xd6a960)), cut(disc, solid(0xf4ecde))];
    // engraved: a clear plaque with frosted lettering
    const plaque = new THREE.Group();
    { plaque.add(box(2.6, 1.8, .15, {}, clear)); const c = S.paper(1300, 900, '#000', '#000', 0), g = c.getContext('2d'); g.clearRect(0, 0, 1300, 900); S.drawLogo(g, S.logoIn('#fff'), 650, 300, 330); S.text(g, NAME, 650, 610, { size: 78, color: '#fff', weight: 700 }); S.text(g, 'حفر ليزر', 650, 720, { size: 50, color: '#fff', font: FONT.script, weight: 700 }); const e = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.73), new THREE.MeshStandardMaterial({ map: S.colorTex(c), transparent: true, opacity: .9, roughness: 1, depthWrite: false })); e.position.z = .078; plaque.add(e); for (const [x, y] of [[-1.1, .7], [1.1, .7], [-1.1, -.7], [1.1, -.7]]) { const sd = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 24), M.silver()); sd.rotation.x = Math.PI / 2; sd.position.set(x, y, -.05); plaque.add(sd); } }
    // printed: an acrylic panel faced with a glossy print
    const printed = new THREE.Group();
    { printed.add(box(2.6, 1.8, .12, { pz: M.gloss(face(S, 1300, 900, C.maroon, C.goldBright, { logo: .42, y: .4, pattern: .1 }), { roughness: .1, clearcoat: 1 }) }, clear)); const front = box(2.6, 1.8, .06, {}, clear); front.position.z = .09; printed.add(front); }
    rig.add(...pieces, plaque, printed);
    return [
      { look: 'cream', set() { plaque.visible = printed.visible = false; S.glint.intensity = 2; pieces.forEach((p, i) => { p.position.set((i - 1.5) * 1.75, 1.1, (i % 2) * -.6); p.rotation.set(-.1, (i - 1.5) * -.25, 0); p.scale.setScalar(.85); }); S.view({ pitch: 8, dist: 11, target: [0, 1.1, 0] }); } },
      { look: 'maroon', set() { plaque.visible = printed.visible = false; S.glint.intensity = 2; pieces.forEach((p, i) => { lay(p, (i - 1.5) * 1.6, (i % 2) * .8 - .4, i * 20, .07); p.scale.setScalar(.8); }); S.view({ pitch: 60, dist: 10, target: [0, 0, 0] }); } },
      { look: 'ink', set() { pieces.forEach(p => p.visible = false); plaque.visible = true; S.glint.intensity = 0; put(plaque, 0, .95, 0, -16, -4); S.view({ pitch: 4, dist: 5.6, target: [0, .95, 0] }); } },
      { look: 'cream', set() { plaque.visible = false; printed.visible = true; put(printed, 0, .95, 0, 18, -4); S.view({ pitch: 4, dist: 5.6, target: [0, .95, 0] }); } },
    ];
  },
};
