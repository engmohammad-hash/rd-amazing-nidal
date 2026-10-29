/* Paper print: letters, invoices, vouchers, certificates, brochures, flyers, menus, folders, catalogues, books,
   planners, notebooks, ID cards, passports, table cards, thank-you cards, tags, tissue, napkins, butter paper,
   placemats and sticker sheets. Each kind builds its pieces once and returns its shots: a backdrop and a set-up. */
import { THREE, C, NAME, FONT, cnv, rand, starPattern, maskFrom, contain } from './stage.js';
import { art } from './art.js';

const DEG = Math.PI / 180;
// lay a piece flat on the floor (its printed face up), at x, z, turned `turn` degrees
const lay = (o, x, z, turn = 0, y = 0) => { o.rotation.set(-Math.PI / 2, 0, turn * DEG); o.position.set(x, y, z); return o; };
const stand = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };

export const kinds = {
  async letterhead(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const sheet = (c, w = 2.1) => box(w, w * 1.414, .006, { pz: M.print(c, { roughness: .8 }) }, M.paper(0xf7f2ea));
    const lh = A.letterhead(), env = A.envelope();
    const a = sheet(lh), b = sheet(A.letterhead()), e = box(2.3, 1.09, .02, { pz: M.print(env) }, M.plain(0x3d0122, .7));
    const card = box(.95, .55, .012, { pz: M.print(S.brandFace(950, 550, { logoSize: .5, nameSize: .085, y: .38 })) }, M.plain(0xcfb28a, .4, .3));
    rig.add(a, b, e, card, shadow(6, 5, -.01, .5));
    return [
      { look: 'cream', set() { lay(a, .35, -.1, -6, .01); lay(b, -.9, -.35, 8); lay(e, -.4, 1.35, 4, .02); lay(card, 1.45, 1.2, -14, .03); S.view({ pitch: 62, dist: 8.2, target: [0, 0, .3] }); } },
      { look: 'maroon', set() { stand(a, .3, 0, 0, -18, -4); stand(b, -.35, -.05, -.4, -18, -4); stand(e, -.9, -1.1, .9, 8, -70); stand(card, 1.25, -1.3, 1.1, -20, -72); S.view({ pitch: 12, dist: 8.6, target: [0, -.2, 0] }); } },
    ];
  },

  async invoice(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const pad = (c, n = 50, tint = 0xf7f2ea) => {
      const g = new THREE.Group(), top = box(2, 2.83, .006, { pz: M.print(c, { roughness: .8 }) }, M.paper(tint));
      const block = box(2, 2.83, .32, {}, M.paper(0xeee6d8, .95)); block.position.z = -.163;
      const bind = box(2.02, .22, .34, {}, M.plain(0x4b0129, .55)); bind.position.set(0, 1.42 - .11, -.16);
      g.add(top, block, bind); return g;
    };
    const p1 = pad(A.invoice()), p2 = pad(A.invoice(1240, 1754, 'فاتورة ضريبية', { tint: '#FFF7E6', no: '0782' }));
    const pen = new THREE.Group();
    { const body = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.9, 32), M.plain(0x2a0016, .3, .4)); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .6, 32), M.gold()); cap.position.y = .7; const tip = new THREE.Mesh(new THREE.ConeGeometry(.045, .16, 32), M.gold()); tip.position.y = -1.03; tip.rotation.x = Math.PI; pen.add(body, cap, tip); }
    rig.add(p1, p2, pen, shadow(6, 5, -.01, .5));
    return [
      { look: 'cream', set() { lay(p1, .55, 0, -8, .33); lay(p2, -1.15, -.2, 10, .33); pen.rotation.set(0, .5, Math.PI / 2); pen.position.set(.9, .39, .75); S.view({ pitch: 58, dist: 8.4, target: [0, 0, .2] }); } },
      { look: 'ink', set() { stand(p1, .2, .15, 0, -24, -10); stand(p2, -1.0, -.1, -.6, 12, -10); pen.position.set(1.4, -1.25, .9); pen.rotation.set(0, .5, Math.PI / 2); S.view({ pitch: 10, dist: 8.4, target: [0, 0, 0] }); } },
    ];
  },

  async voucher(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const book = (c, color) => {
      const g = new THREE.Group(), w = 2.6, h = 1.46;
      const top = box(w, h, .006, { pz: M.print(c, { roughness: .8 }) }, M.paper(0xf7f2ea));
      const block = box(w, h, .22, {}, M.paper(0xeee6d8, .95)); block.position.z = -.113;
      const bind = box(.2, h + .02, .25, {}, M.plain(color, .5)); bind.position.set(w / 2 - .1, 0, -.11);
      g.add(top, block, bind); return g;
    };
    const a = book(A.voucher(1600, 900, 'سند صرف'), 0x4b0129), b = book(A.voucher(1600, 900, 'سند قبض', { tint: '#F1F6FF', no: '3304', amount: '١٢٬٥٠٠' }), 0x1f3a5f);
    const c2 = book(A.voucher(1600, 900, 'سند قبض', { tint: '#FFF6E8', no: '3305', amount: '٨٠٠' }), 0x7a1b47);
    rig.add(a, b, c2, shadow(7, 5, -.01, .5));
    return [
      { look: 'cream', set() { lay(a, .4, .55, -6, .23); lay(b, -.55, -.75, 8, .23); c2.visible = false; S.view({ pitch: 60, dist: 8, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { c2.visible = true; lay(b, -.2, .3, 4, .23); lay(c2, .25, -.2, -10, .48); lay(a, .1, -.5, 6, .73); S.view({ yaw: -18, pitch: 34, dist: 8.2, target: [0, .2, 0] }); } },
    ];
  },

  async certificate(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const make = c => box(3.4, 2.4, .008, { pz: M.print(c, { roughness: .72 }) }, M.paper(0xf7f2ea));
    const a = make(A.certificate()), b = make(A.certificate(1754, 1240, { bg: '#FFFDF8', title: 'شهادة تفوق' }));
    // a gold foil seal on the first
    rig.add(a, b, shadow(7, 5, -.01, .45));
    return [
      { look: 'maroon', set() { stand(a, 0, 0, 0, -10, -6); b.visible = false; S.view({ pitch: 6, dist: 8.2 }); } },
      { look: 'cream', set() { b.visible = true; lay(a, .35, .25, -5, .02); lay(b, -.5, -.45, 7); S.view({ pitch: 58, dist: 8.4, target: [0, 0, 0] }); } },
    ];
  },

  async certcover(S) {
    const A = art(S), { M, box, rig, foil, shadow } = S;
    const leather = (hex) => { const css = '#' + hex.toString(16).padStart(6, '0'), c = S.paper(512, 512, css, css, 26); return new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .55, clearcoat: .35, clearcoatRoughness: .5, bumpMap: S.dataTex(c), bumpScale: .4 }); };
    const W = 3.6, H = 2.6;
    const make = (hex) => {
      const g = new THREE.Group(), lm = leather(hex);
      const left = new THREE.Group(), right = new THREE.Group();
      const lb = box(W, H, .06, {}, lm); lb.position.x = -W / 2; left.add(lb);
      const rb = box(W, H, .06, {}, lm); rb.position.x = W / 2; right.add(rb);
      const cert = box(W * .9, H * .88, .008, { pz: M.print(A.certificate(1754, 1240, { title: 'شهادة شكر وتقدير' }), { roughness: .7 }) }, M.paper(0xf7f2ea));
      cert.position.set(W / 2, 0, .036); right.add(cert);
      const inner = box(W * .92, H * .9, .008, { pz: M.print(S.brandFace(1600, 1150, { bg: '#3a0120', ink: C.goldBright, pattern: .14, logoSize: .34, y: .4, nameSize: .07 })) }, lm);
      inner.position.set(-W / 2, 0, .036); left.add(inner);
      // gold corners on the right page
      for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const k = box(.28, .28, .02, {}, M.gold()); k.rotation.z = Math.PI / 4; k.position.set(W / 2 + x * W * .45, y * H * .44, .04); k.scale.set(1, 1, 1); right.add(k); }
      g.add(left, right); g.userData = { left, right }; return g;
    };
    const a = make(0x3a0120), closed = new THREE.Group();
    {
      const lm = leather(0x2a0016), b = box(W, H, .14, {}, lm); closed.add(b);
      const mask = maskFrom(1200, 860, (g, w, h) => { S.drawLogo(g, S.logoIn('#fff'), w / 2, h * .42, h * .42); g.textAlign = 'center'; g.direction = 'rtl'; g.font = `700 ${h * .08}px ${FONT.head}`; g.fillText('شهادة تقدير', w / 2, h * .78); });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask)); f.position.z = .072; closed.add(f);
    }
    rig.add(a, closed, shadow(9, 6, -1.5, .5));
    return [
      { look: 'ink', set() { closed.visible = false; a.userData.left.rotation.y = -.32; a.userData.right.rotation.y = .32; stand(a, 0, 0, 0, 0, -8); a.scale.setScalar(.82); S.view({ pitch: 8, dist: 9.5 }); } },
      { look: 'cream', set() { closed.visible = true; a.userData.left.rotation.y = -.12; a.userData.right.rotation.y = .12; lay(a, -.3, -.6, 6); a.scale.setScalar(.7); lay(closed, .9, 1.2, -12, .08); closed.scale.setScalar(.7); S.view({ pitch: 58, dist: 9.5, target: [0, 0, .2] }); } },
    ];
  },

  async brochure(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const PW = 1.05, PH = 2.2, Wp = 600, Hp = 1257;
    const out = [A.page(Wp, Hp, { title: 'تواصل معنا', n: 1 }), S.paper(Wp, Hp, '#FDFBF7'), A.cover(Wp, Hp, { title: 'خدماتنا', sub: 'طباعة · تغليف · هدايا', logoAt: .32 })];
    { const g = out[1].getContext('2d'); S.text(g, 'من نحن', Wp * .88, Hp * .08, { size: Wp * .08, color: C.maroon, align: 'right', weight: 700 }); S.lines(g, Wp * .1, Hp * .14, Wp * .78, 14, { gap: Hp * .025, h: Hp * .006 }); g.fillStyle = C.maroon; g.beginPath(); g.roundRect(Wp * .1, Hp * .55, Wp * .8, Hp * .3, 20); g.fill(); S.drawLogo(g, S.logoIn(C.beigeLight), Wp / 2, Hp * .7, Hp * .14); }
    const ins = [A.page(Wp, Hp, { title: 'البوكسات', n: 2 }), A.page(Wp, Hp, { title: 'الأكياس', n: 2, block: '#7A1B47' }), A.page(Wp, Hp, { title: 'الهدايا', n: 2 })];
    const panel = (front, back) => box(PW, PH, .006, { pz: M.print(front, { roughness: .55 }), nz: M.print(back, { roughness: .55 }) }, M.paper(0xf3ede2));
    // an open trifold: three panels hinged at their edges, folded in a gentle zigzag
    const make = () => {
      const g = new THREE.Group(), mid = panel(ins[1], out[1]);
      const l = new THREE.Group(), r = new THREE.Group();
      const lp = panel(ins[0], out[0]); lp.position.x = -PW / 2; l.add(lp); l.position.x = -PW / 2;
      const rp = panel(ins[2], out[2]); rp.position.x = PW / 2; r.add(rp); r.position.x = PW / 2;
      g.add(mid, l, r); g.userData = { l, r }; return g;
    };
    const open = make(), closed = make();
    rig.add(open, closed, shadow(6, 4, -1.12, .5));
    return [
      { look: 'cream', set() { open.userData.l.rotation.y = .42; open.userData.r.rotation.y = -.42; stand(open, -.35, 0, 0, 0); closed.userData.l.rotation.y = 0; closed.userData.r.rotation.y = -Math.PI + .06; stand(closed, 1.75, -.05, .7, -28); closed.userData.l.visible = true; S.view({ pitch: 8, dist: 8.2, target: [.2, 0, 0] }); } },
      { look: 'maroon', set() { open.userData.l.rotation.y = .12; open.userData.r.rotation.y = -.12; lay(open, -.25, .2, 4, -1.1); closed.userData.r.rotation.y = -Math.PI + .03; closed.userData.l.rotation.y = Math.PI - .05; lay(closed, 1.2, -.8, -18, -1.06); S.view({ pitch: 64, dist: 7.6, target: [.2, -1.1, 0] }); } },
    ];
  },

  async flyer(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const f = c => box(1.8, 2.55, .006, { pz: M.print(c, { roughness: .55 }) }, M.paper(0xf3ede2));
    const a = f(A.flyer()), b = f(A.flyer(1240, 1754, { bg: '#F7F0E3', bg2: '#EADCC2', ink: C.maroon, accent: C.maroon, onAccent: C.beigeLight, head: 'عروض', big: 'اطلب ٢ والثالث مجاناً', sub: 'على البوكسات والأكياس حتى نهاية الشهر' })), c = f(A.flyer());
    { const g = b.material[4].map.image.getContext('2d'); }
    rig.add(a, b, c, shadow(7, 5, -.01, .5));
    return [
      { look: 'maroon', set() { lay(c, -1.25, .2, 14, .01); lay(b, 1.05, -.1, -10, .02); lay(a, -.05, .15, 2, .03); S.view({ pitch: 64, dist: 8, target: [0, 0, .1] }); } },
      { look: 'cream', set() { stand(a, -.7, 0, 0, 16, -4); stand(b, .9, -.1, -.6, -18, -4); c.visible = false; S.view({ pitch: 6, dist: 8.2 }); } },
    ];
  },

  async menu(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const m1 = A.menu(), m2 = A.menu(1240, 1754, { bg: C.maroon, ink: C.beigeLight, title: 'قائمة الطعام', items: [['شوربة عدس', '١٥'], ['سلطة فتوش', '١٨'], ['ورق عنب', '٢٢'], ['مشاوي مشكلة', '٦٥'], ['كبسة لحم', '٥٨'], ['مندي دجاج', '٤٢'], ['لقيمات', '١٦'], ['أم علي', '٢٠'], ['كنافة', '٢٤']] });
    const card = (c) => box(1.75, 2.5, .02, { pz: M.print(c, { roughness: .78 }) }, M.plain(0xcfb28a, .5, .2));
    const a = card(m1), b = card(m2);
    // a folded menu standing as a tent
    const tent = new THREE.Group();
    { const p1 = card(m2), p2 = card(m1); p1.position.z = 0; const h1 = new THREE.Group(), h2 = new THREE.Group(); p1.position.y = -1.25; p2.position.y = -1.25; h1.add(p1); h2.add(p2); h1.rotation.x = -.32; h2.rotation.x = .32; h2.rotation.y = Math.PI; tent.add(h1, h2); tent.position.y = 1.2; }
    rig.add(a, b, tent, shadow(7, 5, -1.28, .5));
    return [
      { look: 'cream', set() { tent.visible = false; stand(a, -.95, 0, 0, 18, -4); stand(b, .95, 0, -.3, -18, -4); S.view({ pitch: 6, dist: 8 }); } },
      { look: 'ink', set() { tent.visible = true; a.visible = false; lay(b, 1.4, .7, -18, -1.27); stand(tent, -.3, 0, -.3, -30); S.view({ pitch: 18, dist: 8.2, target: [.2, -.4, 0] }); } },
    ];
  },
};
