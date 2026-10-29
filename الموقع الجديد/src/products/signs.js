/* Big things: shopfront and window vinyl, cut lettering, a branded van, site hoardings and banners, exhibition
   stands, conference stages, party backdrops, flags, roll-ups, lit signs, steel letters, cladding, gypsum
   ceilings, and Forex and foam boards. */
import { THREE, C, NAME, FONT, rand, starPattern, maskFrom } from './stage.js';
import { face } from './pack.js';

const DEG = Math.PI / 180;
const put = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };
const PHONE = '053 584 3085';

// a clear canvas to paint decals on
function clearCanvas(S, W, H) { const c = S.paper(W, H, '#000', '#000', 0); c.getContext('2d').clearRect(0, 0, W, H); return c; }
// letters with depth: the artwork's mask stacked in thin layers, sides in one material, the face in another
function solidArt(S, mask, w, h, depth, side, front, layers = 14) {
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(w, h), alpha = S.dataTex(mask);
  for (let i = 0; i < layers; i++) {
    const m = (i === layers - 1 ? front : side).clone(); m.alphaMap = alpha; m.alphaTest = .5; m.transparent = false; m.side = THREE.DoubleSide;
    const p = new THREE.Mesh(geo, m); p.position.z = depth * i / (layers - 1); g.add(p);
  }
  return g;
}
// a soft halo of light behind lit letters
function halo(S, mask, w, h, color, strength = 1) {
  const c = S.paper(mask.width, mask.height, '#000', '#000', 0), g = c.getContext('2d');
  g.filter = 'blur(28px)'; g.drawImage(mask, 0, 0); g.filter = 'blur(10px)'; g.drawImage(mask, 0, 0); g.filter = 'none';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.15, h * 1.3), new THREE.MeshBasicMaterial({ map: S.dataTex(c), color, transparent: true, opacity: strength, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  return m;
}
function nameMask(S, W, H, { logo = true, size = .28, script = false, text = NAME } = {}) {
  return maskFrom(W, H, (g, w, h) => {
    if (logo) S.drawLogo(g, S.logoIn('#fff'), w * .9, h / 2, h * .85);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
    g.font = `700 ${h * size * (script ? 1.25 : 1)}px ${script ? FONT.script : FONT.head}`;
    g.fillText(text, logo ? w * .4 : w / 2, h * .52);
  });
}
// an A-frame easel holding a board
function easel(S, board, bw, bh) {
  const { M, box } = S, g = new THREE.Group(), wood = M.plain(0x6b4426, .6);
  for (const x of [-bw * .4, bw * .4]) { const leg = box(.07, bh + 1.6, .07, {}, wood); leg.position.set(x, (bh + 1.6) / 2, .1); leg.rotation.x = -.1; g.add(leg); }
  const back = box(.07, bh + 1.4, .07, {}, wood); back.position.set(0, (bh + 1.4) / 2, -.55); back.rotation.x = .28; g.add(back);
  const ledge = box(bw * 1.05, .07, .25, {}, wood); ledge.position.set(0, 1.1, .2); g.add(ledge);
  board.position.set(0, 1.15 + bh / 2, .12); board.rotation.x = -.1; g.add(board);
  return g;
}
function rollup(S, art, { w = .85, h = 2.1 } = {}) {
  const { M, box } = S, g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CapsuleGeometry(.09, w, 6, 16), M.silver()); base.rotation.z = Math.PI / 2; base.position.y = .09; g.add(base);
  for (const x of [-w * .45, w * .45]) { const foot = box(.05, .03, .5, {}, M.silver()); foot.position.set(x, .015, 0); g.add(foot); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, h, 12), M.silver()); pole.position.set(0, h / 2 + .1, -.05); g.add(pole);
  const banner = box(w, h, .008, { pz: M.print(art, { roughness: .55 }) }, M.plain(0xf3ede2, .6)); banner.position.set(0, h / 2 + .16, 0); g.add(banner);
  const bar = box(w + .02, .04, .03, {}, M.silver()); bar.position.set(0, h + .17, 0); g.add(bar);
  return g;
}
function rollArt(S, { bg = C.maroon, bg2 = C.maroonDeep, ink = C.goldBright, title = 'نطبع فخامتك', sub = 'طباعة · تغليف · لوحات' } = {}) {
  const c = S.paper(500, 1240, bg, bg2, 5), g = c.getContext('2d');
  g.globalAlpha = .1; g.strokeStyle = ink; starPattern(g, 500, 1240, 110, 2); g.globalAlpha = 1;
  S.drawLogo(g, S.logoIn(ink), 250, 230, 230);
  S.text(g, NAME, 250, 420, { size: 38, color: ink, weight: 700 });
  S.text(g, title, 250, 640, { size: 64, color: ink, font: FONT.script, weight: 700 });
  S.text(g, sub, 250, 740, { size: 30, color: ink, weight: 500, alpha: .85 });
  g.fillStyle = ink; g.fillRect(0, 1080, 500, 160);
  S.text(g, PHONE, 250, 1160, { size: 40, color: bg, weight: 700, dir: 'ltr' });
  return c;
}

const raw = {
  async window(S) {
    const { M, box, rig } = S;
    const W = 4.2, H = 3.2;
    // the shop seen through the glass: a warm back wall with lit shelves
    const inside = S.paper(1024, 780, '#F2E3C9', '#C9AE86', 6);
    { const g = inside.getContext('2d'); for (let r = 0; r < 3; r++) { g.fillStyle = 'rgba(75,1,41,.55)'; g.fillRect(80, 180 + r * 190, 860, 12); for (let k = 0; k < 9; k++) { g.fillStyle = ['#4B0129', '#D6C1A0', '#7A1B47', '#F4ECDE'][(k + r) % 4]; g.fillRect(100 + k * 92, 100 + r * 190, 70, 80); } } }
    const vinyl = clearCanvas(S, 1400, 1066);
    {
      const g = vinyl.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 470, 1400, 260);
      g.globalCompositeOperation = 'destination-out'; S.text(g, NAME, 700, 600, { size: 120, color: '#000', weight: 800 }); g.globalCompositeOperation = 'source-over';
      S.drawLogo(g, S.logoIn(C.maroon), 700, 250, 300);
      S.text(g, 'مفتوح', 1150, 920, { size: 70, color: C.goldBright, font: FONT.script, weight: 700 });
      S.text(g, 'يومياً ٩ص - ٩م', 1150, 1000, { size: 34, color: '#fff', weight: 600 });
      S.text(g, 'طباعة · تغليف · هدايا · لوحات', 450, 860, { size: 54, color: C.maroon, weight: 700 });
    }
    const make = () => {
      const g = new THREE.Group();
      const back = box(W, H, .05, { pz: M.print(inside, { roughness: .8, emissive: 0x5a3a1a, emissiveIntensity: .25 }) }, M.plain(0x2a2224, .6)); back.position.z = -1.2; g.add(back);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshPhysicalMaterial({ color: 0xdfe8ec, roughness: .02, metalness: 0, transparent: true, opacity: .18, clearcoat: 1, envMapIntensity: 1.6 })); g.add(glass);
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: S.colorTex(vinyl), transparent: true, roughness: .4 })); decal.position.z = .006; g.add(decal);
      const frameM = M.plain(0x1e1a1b, .35, .6);
      for (const [w, h, x, y] of [[W + .3, .15, 0, H / 2 + .07], [W + .3, .15, 0, -H / 2 - .07], [.15, H + .3, -W / 2 - .07, 0], [.15, H + .3, W / 2 + .07, 0], [.08, H, W * .18, 0]]) { const b = box(w, h, .2, {}, frameM); b.position.set(x, y, -.05); g.add(b); }
      const fascia = box(W + .6, .8, .3, { pz: M.print(face(S, 1600, 300, C.maroon, C.goldBright, { logo: .7, y: .5, name: false }), { roughness: .4 }) }, frameM); fascia.position.set(0, H / 2 + .55, 0); g.add(fascia);
      const wallL = box(1, H + 1.2, .4, {}, M.plain(0x2a2426, .5)); wallL.position.set(-W / 2 - .65, .3, -.1); g.add(wallL);
      const wallR = wallL.clone(); wallR.position.x = W / 2 + .65; g.add(wallR);
      g.position.y = H / 2;
      return g;
    };
    const a = make();
    rig.add(a);
    return [
      { look: 'cream', set() { put(a, 0, H / 2 + .1, 0, -18); S.view({ pitch: 4, dist: 11.5, target: [0, 2.0, 0] }); } },
      { look: 'maroon', set() { put(a, -.6, H / 2 + .1, 0, 32); S.view({ pitch: 8, dist: 7.6, target: [-.3, 1.7, 0] }); } },
    ];
  },

  async cutvinyl(S) {
    const { M, box, rig } = S;
    const wallArt = S.paper(1600, 1000, '#EFE6D8', '#E3D6C2', 14);
    const decal = clearCanvas(S, 1600, 1000);
    { const g = decal.getContext('2d'); S.drawLogo(g, S.logoIn(C.maroon), 800, 330, 380); S.text(g, NAME, 800, 640, { size: 110, color: C.maroon, weight: 800 }); S.text(g, 'أهلاً وسهلاً', 800, 800, { size: 80, color: C.gold, font: FONT.script, weight: 700 }); }
    const wall = box(6, 3.75, .2, { pz: M.print(wallArt, { roughness: .9 }) }, M.plain(0xd8cbb6, .9));
    const d = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.75), new THREE.MeshStandardMaterial({ map: S.colorTex(decal), transparent: true, roughness: .35, metalness: .1 })); d.position.z = .102; wall.add(d);
    const bench = box(2.6, .45, .7, {}, M.plain(0x4b0129, .5)); const legs = box(2.4, .3, .5, {}, M.plain(0x1e1a1b, .5));
    rig.add(wall, bench, legs);
    return [
      { look: 'cream', set() { put(wall, 0, 1.875, 0, -10); put(bench, .4, .45, 1.0, -10); put(legs, .4, .15, 1.0, -10); S.view({ pitch: 4, dist: 10, target: [0, 1.7, 0] }); } },
    ];
  },

  async car(S) {
    const { M, box, rig } = S;
    const prof = new THREE.Shape(); prof.moveTo(-2.4, .62); prof.lineTo(2.35, .62); prof.quadraticCurveTo(2.5, .64, 2.5, .9); prof.lineTo(2.45, 1.15); prof.quadraticCurveTo(2.35, 1.4, 1.9, 1.5); prof.lineTo(1.35, 2.25); prof.quadraticCurveTo(1.25, 2.38, 1.0, 2.38); prof.lineTo(-2.3, 2.38); prof.quadraticCurveTo(-2.45, 2.38, -2.45, 2.2); prof.lineTo(-2.45, .74); prof.quadraticCurveTo(-2.45, .62, -2.4, .62);
    const wrap = (flip) => {
      const c = S.paper(1600, 640, '#FBF8F2', '#EFE6D8', 3), g = c.getContext('2d');
      g.fillStyle = C.maroon; g.beginPath(); g.moveTo(0, 640); g.lineTo(0, 300); g.bezierCurveTo(500, 200, 900, 520, 1600, 260); g.lineTo(1600, 640); g.closePath(); g.fill();
      g.fillStyle = C.gold; g.beginPath(); g.moveTo(0, 300); g.bezierCurveTo(500, 200, 900, 520, 1600, 260); g.lineTo(1600, 285); g.bezierCurveTo(900, 545, 500, 225, 0, 325); g.closePath(); g.fill();
      const cx = flip ? 1600 - 560 : 560;
      S.drawLogo(g, S.logoIn(C.maroon), cx - 330, 180, 200);
      S.text(g, NAME, cx + 60, 140, { size: 80, color: C.maroon, weight: 800 });
      S.text(g, 'طباعة · تغليف · هدايا · لوحات', cx + 60, 230, { size: 40, color: C.maroon, weight: 600 });
      S.text(g, PHONE, 1600 - cx, 520, { size: 64, color: C.beigeLight, weight: 700, dir: 'ltr' });
      return c;
    };
    const paint = new THREE.MeshPhysicalMaterial({ color: 0xf1ebe1, roughness: .4, clearcoat: .6, clearcoatRoughness: .2 });
    const sideA = new THREE.MeshPhysicalMaterial({ map: S.colorTex(wrap(false)), roughness: .25, clearcoat: 1, clearcoatRoughness: .08 });
    const sideB = new THREE.MeshPhysicalMaterial({ map: S.colorTex(wrap(true)), roughness: .25, clearcoat: 1, clearcoatRoughness: .08 });
    const van = new THREE.Group();
    { const body = S.slabShape(prof, 1.9, sideA, paint, { bevel: .08, back: sideB }); van.add(body); }
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0x1a1c20, roughness: .05, metalness: .2, clearcoat: 1 });
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.0), glassM); ws.position.set(1.66, 1.88, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-.62); van.add(ws);
    for (const z of [1.0, -1.0]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(.95, .62), glassM); sw.position.set(1.15, 1.85, z); if (z < 0) sw.rotation.y = Math.PI; van.add(sw); }
    const tyre = M.plain(0x151515, .7), rimM = M.silver();
    for (const x of [1.55, -1.55]) for (const z of [1.0, -1.0]) { const w = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 32), tyre); t.rotation.x = Math.PI / 2; const r = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .32, 24), rimM); r.rotation.x = Math.PI / 2; w.add(t, r); w.position.set(x, .42, z); van.add(w); }
    for (const z of [.65, -.65]) { const hl = box(.06, .18, .35, {}, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 1.2 })); hl.position.set(2.5, 1.0, z); van.add(hl); }
    const bumper = box(.2, .25, 1.9, {}, M.plain(0x2a2426, .4)); bumper.position.set(2.45, .5, 0); van.add(bumper);
    van.children[0].position.z = 0;
    rig.add(van);
    return [
      { look: 'cream', set() { S.glint.intensity = 0; van.position.z = -.95; put(van, 0, 0, 0, -28); S.view({ pitch: 6, dist: 11, target: [0, 1.3, 0] }); } },
      { look: 'maroon', set() { S.glint.intensity = 0; put(van, 0, 0, 0, 0); S.view({ pitch: 4, dist: 10, target: [0, 1.4, 0] }); } },
      { look: 'ink', set() { S.glint.intensity = 0; put(van, 0, 0, 0, 205); S.view({ pitch: 6, dist: 11, target: [0, 1.3, 0] }); } },
    ];
  },

  async hoarding(S) {
    const { M, box, rig } = S;
    const N = 6, PW = 2, PH = 2.4;
    const art = (() => {
      const c = S.paper(N * 400, 480, '#F4ECDE', '#E6D7BC', 5), g = c.getContext('2d');
      g.fillStyle = C.maroon; g.fillRect(0, 0, N * 400, 480);
      // a skyline in gold, the project's name, the logo
      g.fillStyle = 'rgba(228,198,144,.25)'; let x = 0; while (x < N * 400) { const w = 60 + rand() * 120, h = 120 + rand() * 260; g.fillRect(x, 480 - h, w, h); x += w + 10; }
      S.text(g, 'مشروع برج الريان', N * 400 * .62, 170, { size: 120, color: C.goldBright, font: FONT.script, weight: 700 });
      S.text(g, 'قريباً · شقق ومكاتب فاخرة', N * 400 * .62, 300, { size: 54, color: C.beigeLight, weight: 600 });
      S.drawLogo(g, S.logoIn(C.goldBright), 260, 200, 220);
      S.text(g, 'تنفيذ: ' + NAME, 260, 380, { size: 34, color: C.beigeLight, weight: 600 });
      return c;
    })();
    const make = (plain) => {
      const g = new THREE.Group(), steel = M.plain(0x2a2426, .45, .5), concrete = M.plain(0x9a958c, .9);
      for (let i = 0; i < N; i++) {
        const c = document.createElement('canvas'); c.width = 400; c.height = 480; c.getContext('2d').drawImage(art, i * 400, 0, 400, 480, 0, 0, 400, 480);
        let pm;
        if (plain) { const pc = S.paper(400, 480, '#E8E2D8', '#DCD5CA', 6), pg = pc.getContext('2d'); if (i % 2 === 0) { pg.fillStyle = '#F2C12E'; pg.beginPath(); pg.moveTo(200, 120); pg.lineTo(320, 330); pg.lineTo(80, 330); pg.closePath(); pg.fill(); pg.strokeStyle = '#111'; pg.lineWidth = 12; pg.stroke(); S.text(pg, '!', 200, 260, { size: 120, color: '#111', weight: 800 }); S.text(pg, 'منطقة عمل', 200, 400, { size: 44, color: '#B0182F', weight: 800 }); } else { pg.fillStyle = '#B0182F'; pg.beginPath(); pg.arc(200, 220, 110, 0, Math.PI * 2); pg.fill(); pg.fillStyle = '#fff'; pg.fillRect(120, 200, 160, 40); S.text(pg, 'ممنوع الدخول', 200, 400, { size: 42, color: '#B0182F', weight: 800 }); } pm = M.print(pc, { roughness: .5 }); }
        else pm = M.print(c, { roughness: .5 });
        const p = box(PW, PH, .03, { pz: pm }, M.plain(0xd8d2c8, .6)); p.position.set((i - (N - 1) / 2) * PW, PH / 2 + .3, 0); g.add(p);
      }
      for (let i = 0; i <= N; i++) { const post = box(.12, PH + .4, .12, {}, steel); post.position.set((i - N / 2) * PW, (PH + .4) / 2, -.1); g.add(post); const foot = box(.5, .3, .5, {}, concrete); foot.position.set((i - N / 2) * PW, .15, -.15); g.add(foot); const brace = box(.08, .08, 1.4, {}, steel); brace.position.set((i - N / 2) * PW, .9, -.7); brace.rotation.x = -.7; g.add(brace); }
      const rail = box(N * PW, .1, .1, {}, steel); rail.position.set(0, PH + .3, -.08); g.add(rail);
      return g;
    };
    const a = make(false), b = make(true);
    rig.add(a, b);
    return [
      { look: 'cream', set() { b.visible = false; put(a, 0, 0, 0, -26); S.view({ pitch: 6, dist: 15.5, target: [0, 1.4, 0] }); } },
      { look: 'maroon', set() { b.visible = false; put(a, 1.5, 0, 0, 42); S.view({ pitch: 6, dist: 11, target: [0, 1.5, 0] }); } },
      { look: 'cream', set() { a.visible = false; b.visible = true; put(b, 0, 0, 0, -20); S.view({ pitch: 4, dist: 9.6, target: [-1, 1.5, 0] }); } },
    ];
  },

  async banner(S) {
    const { M, box, rig } = S;
    const art = (() => { const c = S.paper(1600, 600, C.maroon, C.maroonDeep, 5), g = c.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = C.goldBright; starPattern(g, 1600, 600, 120, 3); g.globalAlpha = 1; S.drawLogo(g, S.logoIn(C.goldBright), 1370, 300, 330); S.text(g, 'افتتاح قريباً', 640, 230, { size: 170, color: C.goldBright, font: FONT.script, weight: 700 }); S.text(g, NAME + '  ·  ' + PHONE, 640, 450, { size: 54, color: C.beigeLight, weight: 600 }); return c; })();
    const W = 5, H = 1.9;
    const flex = S.sheet(W, H, new THREE.MeshStandardMaterial({ map: S.colorTex(art), roughness: .6, side: THREE.DoubleSide }), { wave: .03, seg: 40 });
    const g = new THREE.Group(); g.add(flex);
    for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1], [0, 1], [0, -1]]) { const e = new THREE.Mesh(new THREE.TorusGeometry(.05, .015, 8, 20), M.silver()); e.position.set(x * (W / 2 - .12), y * (H / 2 - .12), .02); g.add(e); }
    // the fence it is tied to
    const fence = new THREE.Group(), steel = M.plain(0x3a3436, .4, .6);
    for (const x of [-3.2, 0, 3.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 16), steel); p.position.set(x, 1.6, -.2); fence.add(p); }
    for (const y of [.4, 2.9]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 6.6, 12), steel); r.rotation.z = Math.PI / 2; r.position.set(0, y, -.2); fence.add(r); }
    for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(x * (W / 2 - .12), y * (H / 2 - .12) + 1.65, .02), new THREE.Vector3(x * 3.15, y > 0 ? 2.85 : .45, -.2)), 4, .015, 6), M.plain(0xe8e0d0, .9)); fence.add(rope); }
    g.position.y = 1.65; rig.add(g, fence);
    return [
      { look: 'cream', set() { rig.rotation.y = -22 * DEG; S.view({ pitch: 6, dist: 11, target: [0, 1.6, 0] }); } },
    ];
  },

  async booth(S) {
    const { M, box, rig } = S;
    const back = (() => { const c = S.paper(2400, 1040, C.maroon, C.maroonDeep, 5), g = c.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = C.goldBright; starPattern(g, 2400, 1040, 140, 3); g.globalAlpha = 1; S.drawLogo(g, S.logoIn(C.goldBright), 1200, 330, 380); S.text(g, NAME, 1200, 620, { size: 110, color: C.goldBright, weight: 800 }); S.text(g, 'طباعة · تغليف · هدايا · لوحات', 1200, 760, { size: 58, color: C.beigeLight, weight: 600 }); g.fillStyle = C.goldBright; g.fillRect(0, 940, 2400, 100); return c; })();
    const R = 4.2, ARC = 1.1, H = 2.6;
    const popTex = S.colorTex(back); popTex.wrapS = THREE.RepeatWrapping; popTex.repeat.x = -1;   // seen from inside its curve, so its print runs the other way
    const pop = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true, Math.PI - ARC / 2, ARC), new THREE.MeshStandardMaterial({ map: popTex, roughness: .55, side: THREE.DoubleSide }));
    pop.position.set(0, H / 2, R - .2);
    const counterArt = (() => { const c = S.paper(1000, 600, '#F4ECDE', '#E6D7BC', 5), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(C.maroon), 500, 230, 260); S.text(g, NAME, 500, 470, { size: 64, color: C.maroon, weight: 800 }); return c; })();
    const counter = new THREE.Group(); { const body = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 1.1, 48, 1, false, -Math.PI / 2, Math.PI), [M.print(counterArt, { roughness: .5 }), M.plain(0x1e1a1b, .4), M.plain(0x1e1a1b, .4)]); body.position.y = .55; counter.add(body); const top = new THREE.Mesh(new THREE.CylinderGeometry(.88, .88, .06, 48, 1, false, -Math.PI / 2, Math.PI), M.plain(0x1e1a1b, .3)); top.position.y = 1.13; counter.add(top); }
    const carpet = box(7, .04, 4.4, {}, M.plain(0x3a0120, .95)); carpet.position.y = .02;
    const r1 = rollup(S, rollArt(S)), r2 = rollup(S, rollArt(S, { bg: '#F4ECDE', bg2: '#E6D7BC', ink: C.maroon, title: 'هدايا دعائية' }));
    rig.add(pop, counter, carpet, r1, r2);
    return [
      { look: 'cream', set() { counter.position.set(.3, .04, 1.1); counter.rotation.y = 0; r1.position.set(-2.6, .04, .6); r1.rotation.y = .4; r2.position.set(2.7, .04, .6); r2.rotation.y = -.4; rig.rotation.y = -14 * DEG; S.view({ pitch: 12, dist: 9.4, target: [0, 1.3, .3] }); } },
      { look: 'ink', set() { rig.rotation.y = 30 * DEG; S.view({ pitch: 14, dist: 10, target: [0, 1.2, .3] }); } },
    ];
  },

  async stage(S) {
    const { M, box, rig } = S;
    const wallArt = (() => { const c = S.paper(2800, 1000, C.maroon, C.maroonDeep, 5), g = c.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = C.goldBright; starPattern(g, 2800, 1000, 140, 3); g.globalAlpha = 1; S.text(g, 'ملتقى الدمام للأعمال', 1400, 380, { size: 190, color: C.goldBright, font: FONT.script, weight: 700 }); S.text(g, '٢٠٢٦', 1400, 570, { size: 90, color: C.beigeLight, weight: 700 }); S.drawLogo(g, S.logoIn(C.beigeLight), 320, 500, 300); S.drawLogo(g, S.logoIn(C.beigeLight), 2480, 500, 300); S.text(g, 'تجهيز وطباعة: ' + NAME, 1400, 860, { size: 46, color: C.beigeLight, weight: 600, alpha: .85 }); return c; })();
    const wall = box(7.6, 2.7, .12, { pz: M.print(wallArt, { roughness: .55 }) }, M.plain(0x1e1a1b, .5)); wall.position.set(0, 1.95, -.9);
    const platform = box(8, .5, 2.6, { pz: M.print(face(S, 2000, 160, C.maroonDeep, C.gold, { logo: .8, y: .5, name: false }), { roughness: .5 }) }, M.plain(0x1e1a1b, .45)); platform.position.set(0, .25, 0);
    const lectern = new THREE.Group(); { const body = box(.9, 1.2, .55, { pz: M.print(face(S, 600, 800, C.maroon, C.goldBright, { logo: .55, y: .4, name: true }), { roughness: .4 }) }, M.plain(0x2a0016, .4)); body.position.y = .6; lectern.add(body); const top = box(1.0, .06, .7, {}, M.plain(0x2a0016, .3)); top.position.set(0, 1.23, -.05); top.rotation.x = .2; lectern.add(top); const mic = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .45, 8), M.silver()); mic.position.set(0, 1.45, .05); mic.rotation.x = -.4; lectern.add(mic); }
    lectern.position.set(2.4, .5, .4);
    const r1 = rollup(S, rollArt(S, { title: 'ملتقى الأعمال' })), r2 = rollup(S, rollArt(S, { title: 'ملتقى الأعمال' }));
    r1.position.set(-4.6, 0, .9); r2.position.set(4.6, 0, .9);
    rig.add(wall, platform, lectern, r1, r2);
    return [
      { look: 'ink', set() { rig.rotation.y = 0; S.view({ pitch: 6, dist: 14, target: [0, 1.6, 0] }); } },
      { look: 'cream', set() { rig.rotation.y = -28 * DEG; S.view({ pitch: 10, dist: 12, target: [0, 1.5, 0] }); } },
    ];
  },

  async party(S) {
    const { M, box, rig } = S;
    const art = (() => { const c = S.paper(2000, 1300, '#F7F0E3', '#EADCC2', 5), g = c.getContext('2d'); g.globalAlpha = .12; g.strokeStyle = C.gold; starPattern(g, 2000, 1300, 160, 3); g.globalAlpha = 1; g.strokeStyle = C.gold; g.lineWidth = 14; g.strokeRect(60, 60, 1880, 1180); S.text(g, 'حفل تخرج', 1000, 420, { size: 260, color: C.maroon, font: FONT.script, weight: 700 }); S.text(g, 'الدفعة ٢٠٢٦', 1000, 680, { size: 110, color: C.gold, weight: 700 }); S.text(g, 'مبارك التخرج', 1000, 880, { size: 80, color: C.maroon, weight: 600 }); return c; })();
    const back = box(5, 3.25, .1, { pz: M.print(art, { roughness: .5 }) }, M.plain(0xd6c1a0, .5)); back.position.set(0, 1.62 + .05, 0);
    const balloons = new THREE.Group();
    const bm = [new THREE.MeshPhysicalMaterial({ color: 0x4b0129, roughness: .2, clearcoat: 1 }), new THREE.MeshStandardMaterial({ color: 0xd9b77e, metalness: 1, roughness: .2 }), new THREE.MeshPhysicalMaterial({ color: 0xf4ecde, roughness: .2, clearcoat: 1 })];
    for (let i = 0; i < 46; i++) { const t = i / 46, a = Math.PI * t; const r = .25 + rand() * .2; const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), bm[i % 3]); s.scale.y = 1.12; s.position.set(-2.7 * Math.cos(a) + (rand() - .5) * .3, 3.5 * Math.sin(a) * .95 + (rand() - .5) * .3, .3 + rand() * .3); balloons.add(s); }
    const board = box(1.4, 1.9, .05, { pz: M.print((() => { const c = S.paper(560, 760, C.maroon, C.maroonDeep, 5), g = c.getContext('2d'); g.strokeStyle = C.goldBright; g.lineWidth = 6; g.strokeRect(24, 24, 512, 712); S.text(g, 'أهلاً بكم', 280, 250, { size: 90, color: C.goldBright, font: FONT.script, weight: 700 }); S.text(g, 'في حفل تخرج', 280, 380, { size: 44, color: C.beigeLight, weight: 600 }); S.text(g, 'الدفعة ٢٠٢٦', 280, 460, { size: 44, color: C.beigeLight, weight: 600 }); S.drawLogo(g, S.logoIn(C.goldBright), 280, 620, 120); return c; })(), { roughness: .5 }) }, M.plain(0x2a0016, .5));
    const stand = easel(S, board, 1.4, 1.9);
    rig.add(back, balloons, stand);
    return [
      { look: 'maroon', set() { stand.visible = true; stand.position.set(2.9, 0, 1.2); stand.rotation.y = -.5; rig.rotation.y = -8 * DEG; S.view({ pitch: 6, dist: 12, target: [.3, 1.8, 0] }); } },
      { look: 'cream', set() { back.visible = balloons.visible = false; stand.position.set(0, 0, 0); stand.rotation.y = -.3; S.view({ pitch: 6, dist: 7.8, target: [0, 2.0, 0] }); } },
    ];
  },

  async flags(S) {
    const { M, box, rig } = S;
    // feather flags: a sail on a bent pole, printed both sides
    const sail = (bg, ink, word) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 3.6); sh.quadraticCurveTo(.2, 4.2, .9, 4.1); sh.quadraticCurveTo(1.3, 3.0, 1.1, 0); sh.lineTo(0, 0);
      const c = S.paper(400, 1300, bg, bg, 4), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(ink), 170, 300, 220); g.save(); g.translate(170, 800); g.rotate(-Math.PI / 2); S.text(g, word, 0, 0, { size: 110, color: ink, font: FONT.script, weight: 700 }); g.restore();
      const m = new THREE.MeshStandardMaterial({ map: S.colorTex(c), roughness: .7, side: THREE.DoubleSide });
      const geo = new THREE.ShapeGeometry(sh, 24); geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) { uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y)); p.setZ(i, Math.sin(p.getY(i) * 1.3) * .08 * p.getX(i)); }
      geo.computeVertexNormals();
      const g2 = new THREE.Group(); const s = new THREE.Mesh(geo, m); s.position.y = .5; g2.add(s);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 4.6, 12), M.silver()); pole.position.y = 2.3; g2.add(pole);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.35, .4, .12, 32), M.plain(0x1e1a1b, .4)); base.position.y = .06; g2.add(base);
      return g2;
    };
    const fs = [sail(C.maroon, C.goldBright, 'روعة التصاميم'), sail('#F4ECDE', C.maroon, 'مباراة الختام'), sail(C.maroon, C.goldBright, 'روعة التصاميم')];
    // pitch-side boards on grass
    const grass = box(12, .05, 5, {}, new THREE.MeshStandardMaterial({ map: S.colorTex(S.paper(512, 512, '#2F6B3A', '#285C32', 30), [4, 2]), roughness: .95 }));
    const boards = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = face(S, 1600, 300, i % 2 ? '#F4ECDE' : C.maroon, i % 2 ? C.maroon : C.goldBright, { logo: .8, y: .5, name: false }); const g = a.getContext('2d'); S.text(g, NAME, 900, 150, { size: 110, color: i % 2 ? C.maroon : C.goldBright, weight: 800 }); const bd = box(3.2, .6, .05, { pz: M.print(a, { roughness: .4 }) }, M.plain(0x1e1a1b, .5)); bd.position.set((i - 1) * 3.25, .35, 0); bd.rotation.x = -.15; boards.add(bd); }
    rig.add(...fs, grass, boards);
    return [
      { look: 'cream', set() { grass.visible = boards.visible = false; fs.forEach((f, i) => put(f, (i - 1) * 1.8, 0, -Math.abs(i - 1) * .4, (i - 1) * -16)); S.view({ pitch: 4, dist: 11, target: [0, 2.4, 0] }); } },
      { look: 'ink', set() { grass.visible = boards.visible = true; grass.position.set(0, -.02, -.5); boards.position.set(0, 0, .8); fs.forEach((f, i) => put(f, (i - 1) * 3.3, 0, -1.4, -10)); S.view({ pitch: 10, dist: 12.5, target: [0, 1.6, 0] }); } },
    ];
  },

  async rollup(S) {
    const { M, box, rig } = S;
    const r1 = rollup(S, rollArt(S, { title: 'ورشة التصميم' })), r2 = rollup(S, rollArt(S, { bg: '#F4ECDE', bg2: '#E6D7BC', ink: C.maroon, title: 'ملتقى الطلاب' })), r3 = rollup(S, rollArt(S, { bg: C.charcoal, bg2: '#141012', title: 'جامعة الإمام' }));
    // desk flags on a table
    const table = box(3.2, .08, 1.3, {}, M.plain(0xf4ecde, .5)); const legs = box(3, .9, 1.1, {}, M.plain(0x1e1a1b, .5));
    const deskFlag = (bg, ink) => { const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .05, 32), M.silver()); g.add(base); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .9, 8), M.silver()); pole.position.y = .45; g.add(pole); const fl = S.sheet(.55, .36, new THREE.MeshStandardMaterial({ map: S.colorTex(face(S, 440, 288, bg, ink, { logo: .6, y: .5, name: false })), roughness: .6, side: THREE.DoubleSide }), { wave: .03, seg: 12 }); fl.position.set(.29, .7, 0); g.add(fl); return g; };
    const dfs = [deskFlag(C.maroon, C.goldBright), deskFlag('#F4ECDE', C.maroon), deskFlag(C.maroon, C.goldBright)];
    rig.add(r1, r2, r3, table, legs, ...dfs);
    return [
      { look: 'cream', set() { [table, legs, ...dfs].forEach(o => o.visible = false); put(r1, -1.05, 0, 0, 16); put(r2, 0, 0, -.5, 0); put(r3, 1.05, 0, 0, -16); S.view({ pitch: 4, dist: 7.6, target: [0, 1.25, 0] }); } },
      { look: 'maroon', set() { r3.visible = false; [table, legs, ...dfs].forEach(o => o.visible = true); put(table, 0, .94, .9, 0); put(legs, 0, .45, .9, 0); dfs.forEach((d, i) => put(d, (i - 1) * 1.0, .98, .9, -20)); put(r1, -1.6, 0, -.6, 12); put(r2, 1.6, 0, -.6, -12); S.view({ pitch: 8, dist: 8, target: [0, 1.25, 0] }); } },
    ];
  },

  async lightsign(S) {
    const { M, box, rig } = S;
    const W = 6, H = 1.4;
    const mask = nameMask(S, 2400, 560, {});
    const fasciaArt = S.paper(1024, 256, '#1E1A1B', '#141012', 8);
    const make = (sideMat, faceColor, glow) => {
      const g = new THREE.Group();
      const lit = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: faceColor, emissiveIntensity: 2.2 });
      g.add(solidArt(S, mask, W, H, .22, sideMat, lit, 16));
      const h = halo(S, mask, W, H, glow, .9); h.position.z = -.04; g.add(h);
      return g;
    };
    const a = make(M.plain(0xf4f0e8, .4), 0xfff4e0, 0xffe2b0), b = make(M.gold(), 0xffe8c0, 0xffc870);
    // a round logo light box on a bracket
    const box2 = new THREE.Group(); { const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .35, 64), [M.plain(0x4b0129, .3, .3), new THREE.MeshStandardMaterial({ map: S.colorTex(face(S, 512, 512, '#F7F0E3', C.maroon, { logo: .6, y: .42, name: true, size: .07 })), emissive: 0xffffff, emissiveMap: S.colorTex(face(S, 512, 512, '#F7F0E3', C.maroon, { logo: .6, y: .42, name: true, size: .07 })), emissiveIntensity: .9 }), M.plain(0x4b0129, .3, .3)]); ring.rotation.x = Math.PI / 2; box2.add(ring); const arm = box(1.6, .1, .1, {}, M.plain(0x1e1a1b, .4)); arm.position.set(-1.6, .9, -.1); box2.add(arm); }
    const wall = box(9, 5, .2, {}, new THREE.MeshStandardMaterial({ map: S.colorTex(S.paper(512, 512, '#2a2426', '#1e1a1b', 18)), roughness: .8 }));
    rig.add(a, b, box2, wall);
    return [
      { look: 'ink', set() { b.visible = box2.visible = false; wall.visible = true; wall.position.set(0, 2.4, -.5); put(a, 0, 3.0, 0, -12); S.glint.intensity = 0; S.key.intensity = .9; S.hemi.intensity = .35; S.view({ pitch: 6, dist: 12, target: [0, 2.9, 0] }); } },
      { look: 'ink', set() { a.visible = false; b.visible = true; box2.visible = false; wall.position.set(0, 2.4, -.5); put(b, 0, 3.0, 0, -8); S.glint.intensity = 0; S.key.intensity = 1.2; S.hemi.intensity = .4; S.view({ pitch: 6, dist: 12, target: [0, 2.9, 0] }); } },
      { look: 'maroon', set() { a.visible = b.visible = false; box2.visible = true; wall.visible = false; put(box2, .4, 2.2, 0, -30); S.glint.intensity = 0; S.view({ pitch: 6, dist: 6.4, target: [0, 2.2, 0] }); } },
    ];
  },

  async steelsign(S) {
    const { M, box, rig } = S;
    const mask = nameMask(S, 2400, 560, {});
    const wallA = box(9, 4, .2, { pz: new THREE.MeshStandardMaterial({ map: S.colorTex(S.paper(1024, 512, '#5a1036', '#3b0322', 16)), roughness: .7 }) }, M.plain(0x2a0016, .6));
    const wallB = box(9, 4, .2, { pz: new THREE.MeshStandardMaterial({ map: S.colorTex(S.paper(1024, 512, '#EFE6D8', '#E0D2BC', 14)), roughness: .85 }) }, M.plain(0xd8cbb6, .8));
    // brushed faces: a mirror face would only show the dark studio behind the camera
    const gold = solidArt(S, mask, 6, 1.4, .18, M.gold(), new THREE.MeshStandardMaterial({ color: 0xd9b77e, metalness: .55, roughness: .32, emissive: 0x3a2a10, emissiveIntensity: .4 }), 14);
    const silver = solidArt(S, mask, 6, 1.4, .18, M.silver(), new THREE.MeshStandardMaterial({ color: 0xcfcfd2, metalness: .55, roughness: .3, emissive: 0x2a2a2c, emissiveIntensity: .4 }), 14);
    rig.add(wallA, wallB, gold, silver);
    return [
      { look: 'ink', set() { wallB.visible = silver.visible = false; put(wallA, 0, 2, -.3, -14); put(gold, 0, 2.2, -.18, -14); S.view({ pitch: 4, dist: 10.5, target: [0, 2.1, 0] }); } },
      { look: 'cream', set() { wallA.visible = gold.visible = false; wallB.visible = silver.visible = true; put(wallB, 0, 2, -.3, 20); put(silver, 0, 2.2, -.18, 20); S.view({ pitch: 4, dist: 10.5, target: [0, 2.1, 0] }); } },
    ];
  },

  async cladding(S) {
    const { M, box, rig } = S;
    const W = 7, H = 4.6;
    const panelM = (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: .3, metalness: .45, clearcoat: .6 });
    const make = (hex, accent) => {
      const g = new THREE.Group(), pm = panelM(hex), groove = M.plain(0x0e0a0c, .8);
      // panels in a grid with dark grooves between them
      const cols = 6, rows = 2, top = H - 1.6;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const p = box(W / cols - .04, .8 - .04, .12, {}, pm); p.position.set(-W / 2 + (c + .5) * W / cols, top + (r + .5) * .8, 0); g.add(p); }
      const back = box(W, 1.6, .05, {}, groove); back.position.set(0, top + .8, -.07); g.add(back);
      for (const x of [-W / 2 - .4, W / 2 + .4]) { const col = box(.8, H, .3, {}, pm); col.position.set(x, H / 2, 0); g.add(col); }
      // the lit name on the cladding
      const mask = nameMask(S, 2400, 560, {});
      const letters = solidArt(S, mask, 5, 1.15, .12, M.plain(0xf4f0e8, .4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: accent, emissiveIntensity: 1.4 }), 10); letters.position.set(0, top + .8, .08); g.add(letters);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, top), new THREE.MeshPhysicalMaterial({ color: 0x2a3236, roughness: .05, metalness: .3, clearcoat: 1, envMapIntensity: 1.4 })); glass.position.set(0, top / 2, -.02); g.add(glass);
      for (const x of [-W / 6, W / 6]) { const mull = box(.08, top, .12, {}, M.plain(0x1e1a1b, .4, .5)); mull.position.set(x, top / 2, 0); g.add(mull); }
      return g;
    };
    const a = make(0x4b0129, 0xfff0d8), b = make(0x2b2426, 0xffd890);
    rig.add(a, b);
    return [
      { look: 'cream', set() { b.visible = false; put(a, 0, 0, 0, -16); S.view({ pitch: 4, dist: 13, target: [0, 2.3, 0] }); } },
      { look: 'maroon', set() { a.visible = false; b.visible = true; put(b, 0, 0, 0, 34); S.view({ pitch: 10, dist: 10, target: [.4, 3.2, 0] }); } },
    ];
  },

  async gypsum(S) {
    const { M, box, rig } = S;
    const white = M.plain(0xf6f2ea, .85), warm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 1.6 });
    const room = new THREE.Group();
    { const floor = box(8, .1, 6, {}, new THREE.MeshPhysicalMaterial({ map: S.colorTex(S.paper(512, 512, '#D9CDBA', '#CDBFA8', 10), [3, 3]), roughness: .25, clearcoat: .5 })); floor.position.y = -.05; room.add(floor);
      const backWall = box(8, 3.4, .12, {}, white); backWall.position.set(0, 1.7, -3); room.add(backWall);
      const sideWall = box(.12, 3.4, 6, {}, white); sideWall.position.set(-4, 1.7, 0); room.add(sideWall);
      // a dropped gypsum ceiling with a recessed cove of hidden light round its edge
      const ceil = box(8, .1, 6, {}, white); ceil.position.y = 3.45; room.add(ceil);
      const drop = box(5.6, .25, 3.8, {}, white); drop.position.set(.4, 3.1, -.6); room.add(drop);
      const cove = box(5.9, .03, 4.1, {}, warm); cove.position.set(.4, 3.22, -.6); room.add(cove);
      for (let i = 0; i < 4; i++) { const spot = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .02, 16), warm); spot.position.set(-1.6 + i * 1.3, 2.97, -.6); room.add(spot); }
      // a feature wall with a niche, shelves and the logo
      const niche = box(2.6, 2.2, .1, { pz: M.print(face(S, 1040, 880, '#4B0129', C.goldBright, { logo: .45, y: .4, pattern: .08 }), { roughness: .6 }) }, white); niche.position.set(.6, 1.5, -2.9); room.add(niche);
      const nicheLight = box(2.6, .03, .2, {}, warm); nicheLight.position.set(.6, 2.62, -2.85); room.add(nicheLight);
      for (const y of [.9, 1.6]) { const shelf = box(1.6, .06, .35, {}, white); shelf.position.set(2.9, y, -2.8); room.add(shelf); }
      const counter = box(2.2, 1.0, .7, { pz: M.plain(0x2a2426, .4) }, M.plain(0x2a2426, .4)); counter.position.set(.6, .5, -1.0); room.add(counter);
    }
    rig.add(room);
    return [
      { look: 'ink', set() { S.key.intensity = 1.4; S.glint.intensity = 0; S.hemi.intensity = .9; S.hemi.groundColor.set(0xd8d0c4); S.view({ yaw: 24, pitch: 6, dist: 9.4, target: [0, 1.7, -1] }); } },
      { look: 'cream', set() { S.key.intensity = 1.6; S.glint.intensity = 0; S.hemi.groundColor.set(0xd8d0c4); S.view({ yaw: -10, pitch: 14, dist: 7.2, target: [.6, 2.1, -2] }); } },
    ];
  },

  async forex(S) {
    const { M, box, rig } = S;
    const board = (art, w, h, t = .05) => box(w, h, t, { pz: M.print(art, { roughness: .5 }) }, M.plain(0xf7f7f5, .6));
    const sign = (word, sub, bg, ink) => { const c = S.paper(1000, 700, bg, bg, 3), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(ink), 850, 140, 160); S.text(g, word, 500, 340, { size: 150, color: ink, weight: 800 }); S.text(g, sub, 500, 520, { size: 56, color: ink, weight: 500, alpha: .85 }); g.fillStyle = ink; g.beginPath(); g.moveTo(140, 620); g.lineTo(280, 560); g.lineTo(280, 680); g.closePath(); g.fill(); g.fillRect(280, 600, 140, 40); return c; };
    const a = board(sign('الاستقبال', 'Reception', '#FFFFFF', C.maroon), 2.4, 1.68), b = board(sign('قاعة الورش', 'الدور الأول', C.maroon, C.beigeLight), 2.4, 1.68), c = board(sign('المخرج', 'Exit', '#FFFFFF', '#1F6B3A'), 2.4, 1.68);
    // cut shapes in white forex: the logo ring and big numbers
    const ringMask = maskFrom(800, 800, (g, w, h) => S.drawLogo(g, S.logoIn('#fff'), w / 2, h / 2, w * .95));
    const logoCut = solidArt(S, ringMask, 2, 2, .1, M.plain(0xf4f2ee, .6), M.plain(0xffffff, .5), 8);
    const numMask = maskFrom(1200, 600, (g, w, h) => { g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${h * .8}px ${FONT.head}`; g.direction = 'rtl'; g.fillText('٢٠٢٦', w / 2, h * .55); });
    const nums = solidArt(S, numMask, 3, 1.5, .1, M.plain(0xf4f2ee, .6), M.plain(0xffffff, .5), 8);
    const st = easel(S, b, 2.4, 1.68);
    rig.add(a, c, logoCut, nums, st);
    return [
      { look: 'maroon', set() { a.visible = c.visible = st.visible = false; put(logoCut, -1.6, 1.0, 0, 18); put(nums, 1.3, .75, .3, -14); S.view({ pitch: 6, dist: 8.4, target: [0, 1.0, 0] }); } },
      { look: 'cream', set() { logoCut.visible = nums.visible = false; a.visible = c.visible = st.visible = true; put(st, -1.6, 0, 0, 18); put(a, 1.3, 2.0, -.6, -16); put(c, 1.7, .84, .6, -24); S.view({ pitch: 6, dist: 10, target: [0, 1.7, 0] }); } },
    ];
  },

  async foam(S) {
    const { M, box, rig } = S;
    // foam board: a white core between two paper faces, so its cut edge shows three layers
    const foamBoard = (art, w, h) => { const g = new THREE.Group(); g.add(box(w, h, .1, {}, M.plain(0xfdfdfb, .95))); const f = box(w, h, .01, { pz: M.print(art, { roughness: .55 }) }, M.plain(0xf2f2f0, .5)); f.position.z = .055; g.add(f); const bk = box(w, h, .01, {}, M.plain(0xf2f2f0, .5)); bk.position.z = -.055; g.add(bk); return g; };
    const poster = (() => { const c = S.paper(900, 1200, '#F4ECDE', '#E6D7BC', 5), g = c.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = C.maroon; starPattern(g, 900, 1200, 140, 3); g.globalAlpha = 1; S.drawLogo(g, S.logoIn(C.maroon), 450, 230, 260); S.text(g, 'معرض العلوم', 450, 520, { size: 120, color: C.maroon, font: FONT.script, weight: 700 }); S.text(g, 'مدرسة الرواد الأهلية', 450, 680, { size: 56, color: C.maroon, weight: 600 }); S.text(g, 'الأحد ١٥ جمادى الأولى', 450, 790, { size: 44, color: C.gold, weight: 600 }); g.fillStyle = C.maroon; g.fillRect(0, 1060, 900, 140); S.text(g, NAME, 450, 1130, { size: 44, color: C.beigeLight, weight: 600 }); return c; })();
    const pb = foamBoard(poster, 1.8, 2.4);
    const st = easel(S, pb, 1.8, 2.4);
    const wordMask = maskFrom(1600, 600, (g, w, h) => { g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.font = `700 ${h * .62}px ${FONT.script}`; g.fillText('مبروك التخرج', w / 2, h * .55); });
    const word = solidArt(S, wordMask, 4.2, 1.6, .16, M.plain(0xfdfdfb, .9), M.print((() => { const c = S.paper(1600, 600, '#E4C690', '#C9A97C', 6); return c; })(), { roughness: .3, metalness: .5 }), 10);
    rig.add(st, word);
    return [
      { look: 'maroon', set() { st.visible = false; put(word, 0, .9, 0, -14); S.view({ pitch: 6, dist: 7.4, target: [0, .9, 0] }); } },
      { look: 'cream', set() { st.visible = true; word.visible = false; put(st, 0, 0, 0, -16); S.view({ pitch: 6, dist: 8.4, target: [0, 1.9, 0] }); } },
    ];
  },
};

export const kinds = {};
for (const [name, build] of Object.entries(raw)) kinds[name] = async S => { const shots = await build(S); S.glint.intensity = 0; return shots; };
