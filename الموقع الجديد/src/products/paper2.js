/* More paper print: folders, catalogues, books, planners, notebooks, ID cards, passports, table cards,
   thank-you cards, tags, tissue, sticker sheets, napkins, butter paper and placemats. */
import { THREE, C, NAME, FONT, rand, starPattern, maskFrom } from './stage.js';
import { art } from './art.js';

const DEG = Math.PI / 180;
const lay = (o, x, z, turn = 0, y = 0) => { o.rotation.set(-Math.PI / 2, 0, turn * DEG); o.position.set(x, y, z); return o; };
const stand = (o, x, y, z, ry = 0, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx * DEG, ry * DEG, rz * DEG); return o; };
const hex = n => '#' + n.toString(16).padStart(6, '0');

// a hard-bound book or catalogue: boards with the cover art, a cream page block, the spine in a colour
function book(S, w, h, t, coverCanvas, spine, { board = .035, pages = 0xf3ecdf } = {}) {
  const { M, box } = S, g = new THREE.Group();
  const cm = M.print(coverCanvas, { roughness: .45 }), sm = M.plain(spine, .5);
  const front = box(w, h, board, { pz: cm }, sm); front.position.z = t / 2 - board / 2;
  const back = box(w, h, board, {}, sm); back.position.z = -t / 2 + board / 2;
  const block = box(w - .06, h - .05, t - board * 2, {}, M.paper(pages, .95)); block.position.x = .03;
  const sp = box(board, h, t, {}, sm); sp.position.x = -w / 2 + board / 2;
  g.add(front, back, block, sp);
  return g;
}

export const kinds = {
  async folder(S) {
    const A = art(S), { M, box, rig, shadow, foil } = S;
    const W = 2.2, H = 3.1;
    const outside = S.brandFace(880, 1240, { bg: C.maroon, bg2: C.maroonDeep, ink: C.beigeLight, pattern: .08, logoSize: .4, y: .4, nameSize: .07 });
    const inside = S.paper(880, 1240, '#F6EEE0', '#EADFCB', 5);
    { const g = inside.getContext('2d'); g.globalAlpha = .1; g.strokeStyle = C.maroon; starPattern(g, 880, 1240, 150, 2); g.globalAlpha = 1; }
    const pocketArt = S.paper(880, 420, C.maroon, C.maroonDeep, 5);
    { const g = pocketArt.getContext('2d'); S.text(g, NAME, 440, 250, { size: 44, color: C.beigeLight, weight: 700 }); S.text(g, 'طباعة شاملة · الدمام', 440, 310, { size: 24, color: C.beigeLight, font: FONT.body, weight: 400, alpha: .75 }); g.fillStyle = C.gold; g.fillRect(0, 0, 880, 10); }
    const open = new THREE.Group();
    {
      const left = box(W, H, .012, { pz: M.print(inside, { roughness: .6 }) }, M.plain(0x3d0122, .6)); left.position.x = -W / 2 - .01;
      const right = box(W, H, .012, { pz: M.print(inside, { roughness: .6 }) }, M.plain(0x3d0122, .6)); right.position.x = W / 2 + .01;
      const letter = box(W * .86, W * .86 * 1.414, .005, { pz: M.print(A.letterhead(), { roughness: .8 }) }, M.paper(0xf7f2ea)); letter.position.set(W / 2 + .03, .14, .012); letter.rotation.z = -.02;
      const pocket = box(W, H * .34, .012, { pz: M.print(pocketArt, { roughness: .55 }) }, M.plain(0x3d0122, .6)); pocket.position.set(W / 2 + .01, -H / 2 + H * .17, .024);
      const card = box(.95, .55, .01, { pz: M.print(S.brandFace(950, 550, { logoSize: .5, nameSize: .085, y: .38 })) }, M.plain(0xcfb28a, .4, .3)); card.position.set(-W / 2 + .1, -H * .3, .02); card.rotation.z = .05;
      const lp = box(W * .92, H * .3, .01, { pz: M.print(pocketArt, { roughness: .55 }) }, M.plain(0x3d0122, .6)); lp.position.set(-W / 2 - .01, -H / 2 + H * .15, .018);
      open.add(left, right, letter, pocket, card, lp);
    }
    const closed = new THREE.Group();
    {
      const b = box(W, H, .03, { pz: M.print(outside, { roughness: .5 }) }, M.plain(0x3d0122, .6)); closed.add(b);
      const mask = maskFrom(880, 1240, (g, w, h) => S.drawLogo(g, S.logoIn('#fff'), w / 2, h * .4, w * .4));
      const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask)); f.position.z = .016; closed.add(f);
    }
    rig.add(open, closed, shadow(9, 6, -.01, .5));
    return [
      { look: 'cream', set() { lay(open, -.6, .15, 4, .01); lay(closed, 2.4, -.5, -12, .03); S.view({ pitch: 62, dist: 10.2, target: [.3, 0, 0] }); } },
      { look: 'maroon', set() { stand(closed, .9, 0, .4, -24, -4); stand(open, -1.4, .1, -1.2, 18, -4); open.scale.setScalar(.8); S.view({ pitch: 8, dist: 9.6, target: [0, 0, 0] }); } },
    ];
  },

  async catalogue(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const W = 2, H = 2.8;
    const covers = [A.cover(800, 1120, { title: 'كتالوج المنتجات' }), A.cover(800, 1120, { bg: '#F4ECDE', bg2: '#E6D7BC', ink: C.maroon, title: 'كتالوج ٢٠٢٦', sub: 'تغليف فاخر' }), A.cover(800, 1120, { bg: C.charcoal, bg2: '#141012', ink: C.goldBright, title: 'منتجاتنا', sub: 'Catalogue' })];
    const cats = covers.map((c, i) => book(S, W, H, .1, c, [0x3d0122, 0xd6c1a0, 0x1e1a1b][i], { board: .012 }));
    // an open catalogue: two page spreads lying in a shallow V
    const open = new THREE.Group();
    {
      const pg = [A.page(800, 1120, { title: 'البوكسات' }), A.page(800, 1120, { title: 'الأكياس', block: '#7A1B47' })];
      for (const k of [0, 1]) {
        const half = new THREE.Group(), s = k ? 1 : -1;
        const pageMat = M.print(pg[k], { roughness: .7 });
        const p = S.sheet(W, H, pageMat, { curl: -.05, seg: 24 }); p.position.set(s * W / 2, 0, .04);
        const blk = box(W, H, .04, {}, M.paper(0xf3ecdf, .95)); blk.position.set(s * W / 2, 0, .015);
        half.add(p, blk); half.rotation.y = s * -.08; open.add(half);
      }
    }
    rig.add(...cats, open, shadow(9, 6, -.01, .5));
    return [
      { look: 'cream', set() { lay(cats[0], 1.9, -.6, -14, .06); lay(cats[1], 2.3, -.4, -4, .17); cats[2].visible = false; lay(open, -.9, .4, 3, .06); S.view({ pitch: 60, dist: 10, target: [.4, 0, 0] }); } },
      { look: 'ink', set() { open.visible = false; cats[2].visible = true; stand(cats[0], -1.2, 0, -.3, 22, -3); stand(cats[1], .1, -.05, 0, 0, -3); stand(cats[2], 1.4, -.1, -.3, -22, -3); S.view({ pitch: 6, dist: 9 }); } },
    ];
  },

  async books(S) {
    const A = art(S), { rig, shadow } = S;
    const defs = [
      [C.maroon, C.maroonDeep, C.goldBright, 'دليل الطالب', 0x3d0122],
      ['#F4ECDE', '#E6D7BC', C.maroon, 'مذكرة الرياضيات', 0xb99c70],
      ['#1F3A5F', '#12243C', '#E4C690', 'قصص وحكايات', 0x16304f],
      ['#2F4A3A', '#1E3227', '#E4C690', 'العلوم', 0x23382c],
    ];
    const bs = defs.map(([bg, bg2, ink, title, sp], i) => book(S, 1.8, 2.5, .22 + i * .03, A.cover(720, 1000, { bg, bg2, ink, title, sub: 'الفصل الدراسي الأول', script: i === 2 }), sp));
    rig.add(...bs, shadow(8, 6, -1.26, .5));
    return [
      { look: 'maroon', set() { lay(bs[0], .4, 0, 8, -1.25 + .11); lay(bs[1], .35, .05, -6, -1.25 + .37); lay(bs[2], .45, 0, 14, -1.25 + .64); stand(bs[3], -1.4, 0, -.2, 28, -4); S.view({ pitch: 14, dist: 8.6, target: [0, -.2, 0] }); } },
      { look: 'cream', set() { [[-1.9, .2, 10], [-.2, -.3, -6], [1.6, .3, 8], [.2, 1.6, -14]].forEach(([x, z, r], i) => lay(bs[i], x, z, r, .12 + i * .01)); S.view({ pitch: 62, dist: 10.4, target: [0, 0, .5] }); } },
    ];
  },

  async planner(S) {
    const { M, box, rig, shadow, foil } = S;
    const leather = css => { const c = S.paper(512, 512, css, css, 28); return new THREE.MeshPhysicalMaterial({ map: S.colorTex(c, [3, 3]), roughness: .58, clearcoat: .3, clearcoatRoughness: .5, bumpMap: S.dataTex(c, [3, 3]), bumpScale: .5 }); };
    const W = 1.9, H = 2.6, T = .28;
    const make = (css, band) => {
      const g = new THREE.Group(), lm = leather(css);
      g.add(box(W, H, T, {}, lm));
      const block = box(W - .08, H - .08, T - .06, {}, M.paper(0xf3ecdf, .95)); block.position.x = .05; block.scale.z = 1.02; g.add(block);
      const mask = maskFrom(760, 1040, (g2, w, h) => { S.drawLogo(g2, S.logoIn('#fff'), w / 2, h * .38, w * .42); g2.textAlign = 'center'; g2.direction = 'rtl'; g2.font = `700 ${w * .075}px ${FONT.head}`; g2.fillText('٢٠٢٦', w / 2, h * .66); });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask)); f.position.z = T / 2 + .002; g.add(f);
      const el = box(.07, H + .01, T + .012, {}, M.plain(band, .6)); el.position.x = W / 2 - .3; g.add(el);
      const rib = S.strip([[-.2, -H / 2 + .05, -T / 2 + .03], [-.15, -H / 2 - .25, -T / 2 + .01], [-.05, -H / 2 - .55, -T / 2 - .06]], .08, M.plain(0xc9a97c, .4, .2), { up: [0, 0, 1] }); g.add(rib);
      for (const [x, y] of [[1, 1], [1, -1]]) { const k = box(.22, .22, T + .02, {}, M.gold()); k.position.set(x * (W / 2 - .07), y * (H / 2 - .07), 0); g.add(k); }
      return g;
    };
    const a = make('#4B0129', 0x2a0016), b = make('#2B2326', 0x141012), c = make('#C9AE86', 0x4b0129);
    const pen = new THREE.Group();
    { const body = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2, 32), M.plain(0x2a0016, .25, .5)); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .65, 32), M.gold()); cap.position.y = .72; const clip = box(.03, .5, .05, {}, M.gold()); clip.position.set(0, .72, .07); pen.add(body, cap, clip); }
    rig.add(a, b, c, pen, shadow(8, 6, -1.36, .5));
    return [
      { look: 'ink', set() { stand(a, -.4, 0, 0, 16, -4); stand(b, .9, -.05, -.6, -14, -4); c.visible = false; pen.position.set(1.4, -1.28, .9); pen.rotation.set(0, .3, Math.PI / 2); S.view({ pitch: 8, dist: 8.6 }); } },
      { look: 'cream', set() { c.visible = true; lay(a, -1.6, .2, 10, .14); lay(b, .3, -.3, -4, .14); lay(c, 2.1, .3, -14, .14); pen.position.set(.4, .34, 1.45); pen.rotation.set(0, -.25, Math.PI / 2); S.view({ pitch: 62, dist: 10, target: [.2, 0, .2] }); } },
    ];
  },

  async notebook(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const W = 1.9, H = 2.6, T = .14;
    const make = (cover, edge) => {
      const g = new THREE.Group();
      const c = box(W, H, .02, { pz: M.print(cover, { roughness: .5 }) }, M.plain(edge, .5)); c.position.z = T / 2; g.add(c);
      const blk = box(W, H - .02, T - .03, {}, M.paper(0xf6f1e7, .95)); g.add(blk);
      const bk = box(W, H, .02, {}, M.plain(edge, .6)); bk.position.z = -T / 2; g.add(bk);
      // the spiral along the top edge
      const wire = M.steel();
      for (let i = 0; i < 22; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.085, .012, 8, 24), wire); r.rotation.y = Math.PI / 2; r.position.set(-W / 2 + .15 + i * (W - .3) / 21, H / 2 - .02, 0); g.add(r); }
      return g;
    };
    const a = make(A.cover(760, 1040, { title: 'دفتر الملاحظات', sub: 'مدرسة الرواد', logoAt: .3 }), 0x3d0122);
    const b = make(A.cover(760, 1040, { bg: '#F4ECDE', bg2: '#E8DCC4', ink: C.maroon, title: 'نوت بوك', sub: 'جمعية البر', logoAt: .3 }), 0xd6c1a0);
    const c = make(A.cover(760, 1040, { bg: '#1F3A5F', bg2: '#12243C', ink: '#E4C690', title: 'دفتر الواجبات', sub: '', logoAt: .3 }), 0x16304f);
    rig.add(a, b, c, shadow(8, 6, -.01, .5));
    return [
      { look: 'cream', set() { lay(a, -1.1, .1, 8, .08); lay(b, 1.0, -.15, -8, .08); c.visible = false; S.view({ pitch: 60, dist: 8.8, target: [0, 0, .1] }); } },
      { look: 'maroon', set() { c.visible = true; stand(a, -1.2, 0, -.2, 22, -4); stand(b, 0, -.05, .2, 0, -4); stand(c, 1.2, -.1, -.2, -22, -4); S.view({ pitch: 6, dist: 9 }); } },
    ];
  },

  async idcard(S) {
    const { M, rig, shadow } = S;
    const W = 1.08, H = 1.7;
    const face = (bg, band, role, name) => {
      const c = S.paper(540, 850, '#FFFDF8', '#F4EEE3', 4), g = c.getContext('2d');
      g.fillStyle = band; g.fillRect(0, 0, 540, 250);
      g.globalAlpha = .12; g.strokeStyle = '#fff'; starPattern(g, 540, 250, 90, 2); g.globalAlpha = 1;
      S.drawLogo(g, S.logoIn(C.beigeLight), 270, 100, 120);
      S.text(g, NAME, 270, 205, { size: 30, color: C.beigeLight, weight: 700 });
      g.fillStyle = '#E8DDCB'; g.beginPath(); g.arc(270, 360, 95, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#BFA98A'; g.beginPath(); g.arc(270, 335, 38, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(270, 425, 62, 40, 0, Math.PI, 0); g.fill();
      g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.arc(270, 360, 95, 0, Math.PI * 2); g.stroke();
      S.text(g, name, 270, 515, { size: 40, color: C.maroon, weight: 700 });
      S.text(g, role, 270, 570, { size: 28, color: C.gold, font: FONT.body, weight: 600 });
      S.text(g, 'رقم الموظف: 1045', 270, 640, { size: 22, color: C.maroon, font: FONT.body, weight: 400, alpha: .7 });
      g.fillStyle = band; g.fillRect(0, 760, 540, 90);
      for (let i = 0; i < 40; i++) { g.fillStyle = '#fff'; g.fillRect(150 + i * 6, 780, rand() > .5 ? 3 : 1.5, 50); }
      return c;
    };
    const card = (bg, band, role, name) => S.slabShape(S.roundedRect(W, H, .08), .02, M.gloss(face(bg, band, role, name), { roughness: .25 }), M.plain(0xf3ede4, .4));
    const strapArt = S.paper(128, 1024, C.maroon, C.maroon, 3);
    { const g = strapArt.getContext('2d'); g.save(); g.translate(64, 512); g.rotate(Math.PI / 2); for (let x = -512; x < 512; x += 330) S.text(g, 'روعة التصاميم', x, 0, { size: 44, color: C.goldBright, weight: 700 }); g.restore(); }
    const strapMat = new THREE.MeshStandardMaterial({ map: S.colorTex(strapArt, [1, 1]), roughness: .7 });
    strapMat.map.wrapT = THREE.RepeatWrapping;
    const hang = (c) => {
      const g = new THREE.Group(); g.add(c);
      const clip = S.box(.12, .22, .04, {}, M.silver()); clip.position.set(0, H / 2 + .12, 0); g.add(clip);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.07, .015, 12, 32), M.silver()); ring.position.set(0, H / 2 + .26, 0); g.add(ring);
      const s = S.strip([[0, H / 2 + .3, 0], [-.35, H / 2 + 1.2, -.05], [-.55, H / 2 + 2.4, -.1], [-.6, H / 2 + 3.6, -.12]], .2, strapMat, { up: [0, 0, 1] });
      const s2 = S.strip([[0, H / 2 + .3, 0], [.35, H / 2 + 1.2, -.08], [.55, H / 2 + 2.4, -.14], [.6, H / 2 + 3.6, -.16]], .2, strapMat, { up: [0, 0, 1] });
      g.add(s, s2); return g;
    };
    const a = hang(card(0, C.maroon, 'مصمم جرافيك', 'أحمد سالم')), b = hang(card(0, '#7A1B47', 'خدمة العملاء', 'ريم خالد'));
    const flat = card(0, C.maroon, 'مدير المبيعات', 'فهد العتيبي');
    rig.add(a, b, flat, shadow(6, 4, -1.2, .4));
    return [
      { look: 'cream', set() { flat.visible = false; stand(a, -.75, -.6, 0, 14, 0, -3); stand(b, .8, -.75, -.4, -16, 0, 4); S.view({ pitch: 4, dist: 8.2, target: [0, .1, 0] }); } },
      { look: 'maroon', set() { flat.visible = false; stand(a, 0, -.5, 0, -22, 0, 2); b.visible = false; S.view({ pitch: 4, dist: 6.6, target: [0, .2, 0] }); } },
      { look: 'ink', set() { a.visible = b.visible = false; flat.visible = true; stand(flat, 0, 0, 0, -26, -8, 6); S.view({ pitch: 6, dist: 5.2 }); } },
    ];
  },

  async passport(S) {
    const { M, box, rig, shadow, foil } = S;
    const W = 1.25, H = 1.76, T = .06;
    const coverC = S.paper(500, 704, C.maroon, C.maroonDeep, 8);
    const mask = maskFrom(500, 704, (g, w, h) => {
      g.textAlign = 'center'; g.direction = 'rtl';
      g.font = `700 ${w * .1}px ${FONT.head}`; g.fillText('جواز سفر', w / 2, h * .16);
      S.drawLogo(g, S.logoIn('#fff'), w / 2, h * .44, w * .44);
      g.font = `700 ${w * .085}px ${FONT.script}`; g.fillText('رحلة الافتتاح', w / 2, h * .72);
      g.font = `500 ${w * .05}px ${FONT.head}`; g.fillText('PASSPORT', w / 2, h * .82);
    });
    const page = (k) => {
      const c = S.paper(500, 704, '#F7F1E4', '#EFE5D2', 6), g = c.getContext('2d');
      g.globalAlpha = .08; g.strokeStyle = C.maroon; starPattern(g, 500, 704, 90, 2); g.globalAlpha = 1;
      const stamps = k ? [['#7A1B47', 'تم'], ['#1F3A5F', 'زيارة ٢'], ['#2F6B3A', 'هدية']] : [['#B0182F', 'افتتاح'], ['#7A1B47', 'زيارة ١']];
      stamps.forEach(([col, word], i) => {
        const x = 150 + (i % 2) * 200 + rand() * 20, y = 170 + Math.floor(i / 2) * 260 + (i % 2) * 110;
        g.save(); g.translate(x, y); g.rotate((rand() - .5) * .6); g.globalAlpha = .82; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 6;
        g.beginPath(); g.arc(0, 0, 78, 0, Math.PI * 2); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 64, 0, Math.PI * 2); g.stroke();
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'; g.font = `700 30px ${FONT.head}`; g.fillText(word, 0, -6);
        g.font = `500 16px ${FONT.body}`; g.fillText('٢٠٢٦/١٠/٣٠', 0, 26); g.restore();
      });
      S.text(g, k ? '٢' : '١', 250, 670, { size: 22, color: C.maroon, font: FONT.body, weight: 400, alpha: .6 });
      return c;
    };
    const closed = new THREE.Group();
    { closed.add(box(W, H, T, { pz: M.print(coverC, { roughness: .6 }) }, M.plain(0xefe6d6, .9))); const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask)); f.position.z = T / 2 + .001; closed.add(f); }
    const open = new THREE.Group();
    for (const k of [0, 1]) {
      const s = k ? 1 : -1, half = new THREE.Group();
      const cv = box(W, H, .012, {}, M.plain(0x3d0122, .6)); cv.position.set(s * W / 2, 0, -.02);
      const pg = S.sheet(W - .04, H - .04, M.print(page(k), { roughness: .8 }), { curl: -.03, seg: 16 }); pg.position.set(s * (W / 2), 0, .012);
      half.add(cv, pg); half.rotation.y = s * -.1; open.add(half);
    }
    rig.add(closed, open, shadow(6, 4, -.01, .5));
    return [
      { look: 'maroon', set() { lay(open, -.55, .25, 6, .02); lay(closed, 1.35, -.4, -16, .04); S.view({ pitch: 60, dist: 6.6, target: [.2, 0, 0] }); } },
      { look: 'cream', set() { stand(closed, .55, 0, .2, -22, -4); stand(open, -.9, .05, -.6, 20, -4); open.scale.setScalar(.92); S.view({ pitch: 6, dist: 6.4 }); } },
    ];
  },

  async tablecard(S) {
    const { M, box, rig, shadow } = S;
    const W = 1.5, H = 1.05;
    const face = (n, bg, ink) => {
      const c = S.paper(750, 525, bg, bg, 5), g = c.getContext('2d');
      g.strokeStyle = C.gold; g.lineWidth = 6; g.strokeRect(22, 22, 706, 481);
      S.drawLogo(g, S.logoIn(ink), 375, 110, 110);
      S.text(g, n, 375, 300, { size: n.length > 3 ? 92 : 170, color: ink, font: n.length > 3 ? FONT.script : FONT.head, weight: 700 });
      S.text(g, NAME, 375, 450, { size: 30, color: ink, weight: 500, alpha: .8 });
      return c;
    };
    const tent = (n, bg, ink) => {
      const g = new THREE.Group(), m = M.print(face(n, bg, ink), { roughness: .45 }), e = M.plain(0xd9c7a8, .6);
      for (const s of [1, -1]) { const h = new THREE.Group(), p = box(W, H, .012, { pz: m }, e); p.position.y = -H / 2; h.add(p); h.rotation.x = -s * .38; if (s < 0) h.rotation.y = Math.PI; g.add(h); }
      g.position.y = H * Math.cos(.38) / 2; return g;
    };
    const a = tent('٧', '#FBF6EC', C.maroon), b = tent('محجوز', C.maroon, C.beigeLight), c = tent('١٢', C.maroon, C.goldBright);
    const holder = new THREE.Group(); [a, b, c].forEach(t => holder.add(t));
    rig.add(holder, shadow(7, 4, -.48, .45));
    return [
      { look: 'cream', set() { holder.position.y = -.48; stand(a, -1.0, a.position.y, 0, 18); stand(b, 1.0, b.position.y, -.3, -20); c.visible = false; S.view({ pitch: 14, dist: 6.4, target: [0, -.1, 0] }); } },
      { look: 'ink', set() { c.visible = true; stand(a, -1.5, a.position.y, .2, 30); stand(c, 0, c.position.y, -.4, 0); stand(b, 1.5, b.position.y, .2, -30); S.view({ pitch: 16, dist: 7.4, target: [0, -.1, 0] }); } },
    ];
  },

  async thanks(S) {
    const { M, box, rig, shadow, foil } = S;
    const W = 1.5, H = 2.1;
    const make = (bg, ink, foilIt) => {
      const g = new THREE.Group(), c = S.paper(600, 840, bg, bg, 6), cg = c.getContext('2d');
      cg.strokeStyle = foilIt ? 'rgba(201,169,124,.6)' : ink; cg.lineWidth = 3; cg.strokeRect(30, 30, 540, 780);
      if (!foilIt) { S.text(cg, 'شكراً لك', 300, 360, { size: 120, color: ink, font: FONT.script, weight: 700 }); S.drawLogo(cg, S.logoIn(ink), 300, 160, 120); }
      S.text(cg, 'نتمنى أن تنال طلبيتك إعجابك', 300, 520, { size: 32, color: foilIt ? C.beigeLight : ink, font: FONT.body, weight: 400, alpha: .85 });
      S.text(cg, NAME, 300, 740, { size: 28, color: foilIt ? C.beigeLight : ink, weight: 600, alpha: .8 });
      g.add(box(W, H, .02, { pz: M.print(c, { roughness: .5 }) }, M.plain(0xe7dcc8, .6)));
      if (foilIt) {
        const mask = maskFrom(600, 840, (g2, w, h) => { S.drawLogo(g2, S.logoIn('#fff'), w / 2, h * .19, w * .2); g2.textAlign = 'center'; g2.direction = 'rtl'; g2.textBaseline = 'middle'; g2.font = `700 120px ${FONT.script}`; g2.fillText('شكراً لك', w / 2, h * .43); });
        const f = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil(mask)); f.position.z = .011; g.add(f);
      }
      return g;
    };
    const a = make(C.maroon, C.beigeLight, true), b = make('#FBF6EC', C.maroon, false);
    const env = box(2.3, 1.6, .03, { pz: M.print(S.brandFace(920, 640, { bg: '#E9DCC6', ink: C.maroon, pattern: .06, name: false, logoSize: .32, y: .5 })) }, M.plain(0xd6c1a0, .7));
    rig.add(a, b, env, shadow(7, 5, -.01, .5));
    return [
      { look: 'cream', set() { lay(env, .9, -.3, -10, .02); lay(a, -.55, .2, 6, .04); lay(b, .65, .55, -4, .06); S.view({ pitch: 62, dist: 7.6, target: [.1, 0, .1] }); } },
      { look: 'maroon', set() { stand(b, -.85, 0, -.2, 20, -4); stand(a, .85, -.05, 0, -16, -4); env.visible = false; S.view({ pitch: 6, dist: 7.2 }); } },
    ];
  },

  async hangtag(S) {
    const { M, rig, shadow, foil } = S;
    const W = .95, H = 1.75;
    const shape = (() => { const s = new THREE.Shape(), w = W / 2, h = H / 2, c = .28; s.moveTo(-w, -h); s.lineTo(w, -h); s.lineTo(w, h - c); s.lineTo(w - c, h); s.lineTo(-w + c, h); s.lineTo(-w, h - c); s.lineTo(-w, -h); const hole = new THREE.Path(); hole.absarc(0, h - .2, .06, 0, Math.PI * 2, true); s.holes.push(hole); return s; })();
    const face = (bg, ink, word) => {
      const c = S.paper(380, 700, bg, bg, 7), g = c.getContext('2d');
      S.drawLogo(g, S.logoIn(ink), 190, 270, 170);
      S.text(g, word, 190, 450, { size: 52, color: ink, font: FONT.script, weight: 700 });
      S.text(g, 'روعة التصاميم', 190, 600, { size: 26, color: ink, weight: 500, alpha: .8 });
      return c;
    };
    const tag = (bg, ink, word) => S.slabShape(shape, .02, M.print(face(bg, ink, word), { roughness: .7 }), M.plain(0xe0d2bb, .8));
    const tags = [tag(C.maroon, C.goldBright, 'عباءة'), tag('#F4ECDE', C.maroon, 'صُنع بحب'), tag(C.charcoal, C.goldBright, 'فاخر')];
    const string = M.plain(0xd6c1a0, .8);
    const strings = tags.map((t, i) => { const s = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, H / 2 - .2, 0], [.1, H / 2 + .2, .02], [.05 * (i - 1), H / 2 + .8, -.02], [.2 * (i - 1), H / 2 + 1.6, 0]].map(p => new THREE.Vector3(...p))), 40, .012, 8), string); t.add(s); return s; });
    rig.add(...tags, shadow(6, 4, -.01, .45));
    return [
      { look: 'cream', set() { tags.forEach((t, i) => lay(t, (i - 1) * 1.05, i === 1 ? -.2 : .1, (i - 1) * -12, .02 + i * .01)); S.view({ pitch: 64, dist: 6.6, target: [0, 0, -.2] }); } },
      { look: 'ink', set() { tags.forEach((t, i) => stand(t, (i - 1) * 1.15, -.35 + (i % 2) * .2, -Math.abs(i - 1) * .3, (i - 1) * -18, 0, (i - 1) * 4)); S.view({ pitch: 4, dist: 6.4, target: [0, .2, 0] }); } },
    ];
  },

  async tissue(S) {
    const A = art(S), { M, rig, shadow } = S;
    const pat = A.pattern(1024, 1024, { bg: '#FBF8F2', ink: 'rgba(75,1,41,.4)', cell: 230 });
    const pat2 = A.pattern(1024, 1024, { bg: '#4B0129', ink: 'rgba(228,198,144,.55)', cell: 230 });
    const mat = (c) => new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .9, sheen: .4, sheenColor: 0xffffff, transmission: .15, thickness: .05, side: THREE.DoubleSide });
    const s1 = S.sheet(3.2, 3.2, mat(pat), { wave: .14, seg: 64 }), s2 = S.sheet(3.2, 3.2, mat(pat2), { wave: .12, seg: 64 });
    // a wrapped parcel tied with a seal sticker
    const parcel = new THREE.Group();
    { const b = S.box(2.2, .5, 1.5, { py: mat(pat) }, mat(pat)); parcel.add(b); const seal = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .01, 48), [M.plain(0xc9a97c, .4, .3), M.print(S.brandFace(400, 400, { bg: C.maroon, ink: C.goldBright, pattern: 0, name: false, logoSize: .6, y: .5 })), M.plain(0xc9a97c, .4, .3)]); seal.position.y = .26; parcel.add(seal); }
    rig.add(s1, s2, parcel, shadow(8, 6, -.02, .4));
    return [
      { look: 'cream', set() { lay(s2, 1.0, -.4, 18, .02); lay(s1, -.8, .3, -10, .06); parcel.visible = false; S.view({ pitch: 64, dist: 8, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { parcel.visible = true; lay(s1, -.2, .2, 10, .01); s2.visible = false; parcel.position.set(.4, .27, .2); parcel.rotation.set(0, -.3, 0); S.view({ pitch: 40, dist: 7.2, target: [.1, .1, 0] }); } },
    ];
  },

  async sheet(S) {
    const { M, box, rig, shadow } = S;
    const W = 2.1, H = 2.97;
    const base = S.paper(840, 1188, '#FFFFFF', '#F6F6F4', 3);
    { const g = base.getContext('2d'); S.text(g, 'روعة التصاميم · استكرات', 420, 1150, { size: 26, color: 'rgba(75,1,41,.5)', weight: 500 }); }
    const sh = box(W, H, .01, { pz: M.print(base, { roughness: .4 }) }, M.paper(0xf2f2f0));
    const stickers = new THREE.Group();
    const art1 = S.brandFace(400, 400, { bg: C.maroon, ink: C.goldBright, pattern: .1, name: false, logoSize: .62, y: .5 });
    const art2 = S.brandFace(400, 400, { bg: '#F4ECDE', ink: C.maroon, pattern: 0, name: false, logoSize: .62, y: .5 });
    const ov = S.paper(500, 300, C.maroon, C.maroon, 3); { const g = ov.getContext('2d'); S.text(g, 'شكراً لك', 250, 150, { size: 110, color: C.goldBright, font: FONT.script, weight: 700 }); }
    const disc = (r, c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .012, 64), [M.plain(0xffffff, .5), M.gloss(c, { roughness: .2 }), M.plain(0xffffff, .5)]); return m; };
    const oval = (c) => { const m = disc(.5, c); m.scale.set(1, 1, .6); return m; };
    const layout = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const d = disc(.38, (r + k) % 2 ? art1 : art2); d.position.set((k - .5) * .9, .012, (r - 1.4) * .82); stickers.add(d); layout.push(d); }
    for (let k = 0; k < 2; k++) { const o = oval(ov); o.position.set((k - .5) * 1.0, .012, 1.12); stickers.add(o); }
    const peeled = disc(.38, art1); peeled.position.set(.62, .25, -1.2); peeled.rotation.set(.6, 0, -.3); stickers.add(peeled); layout[1].visible = false;
    const group = new THREE.Group(); lay(sh, 0, 0, 0, .005); group.add(sh, stickers);
    const sh2 = box(W, H, .01, { pz: M.print(base, { roughness: .4 }) }, M.paper(0xf2f2f0));
    rig.add(group, sh2, shadow(7, 6, -.01, .4));
    return [
      { look: 'cream', set() { group.rotation.y = .12; sh2.visible = false; S.view({ pitch: 58, dist: 7.4, target: [0, 0, .1] }); } },
      { look: 'maroon', set() { group.rotation.y = -.2; group.position.x = .4; sh2.visible = true; lay(sh2, -1.3, -.4, 16, .002); S.view({ yaw: 10, pitch: 50, dist: 8, target: [0, 0, 0] }); } },
    ];
  },

  async napkin(S) {
    const { M, box, rig, shadow } = S;
    const corner = (bg, ink) => { const c = S.paper(512, 512, bg, bg, 10), g = c.getContext('2d'); S.drawLogo(g, S.logoIn(ink), 400, 400, 120); g.strokeStyle = ink; g.globalAlpha = .4; g.lineWidth = 3; g.strokeRect(24, 24, 464, 464); return c; };
    const emboss = c => new THREE.MeshStandardMaterial({ map: S.colorTex(c), roughness: .95, bumpMap: S.dataTex(c), bumpScale: .6 });
    const stackOf = (bg, ink, n = 1) => box(1.6, .3 * n, 1.6, { py: emboss(corner(bg, ink)) }, M.paper(new THREE.Color(bg).getHex(), .95));
    const a = stackOf('#FBF8F2', C.maroon), b = stackOf(C.maroon, C.goldBright), c = stackOf('#F1E4CC', C.maroon);
    const open = S.sheet(2.4, 2.4, new THREE.MeshStandardMaterial({ map: S.colorTex(corner('#FBF8F2', C.maroon)), roughness: .95, side: THREE.DoubleSide }), { wave: .08, seg: 48 });
    rig.add(a, b, c, open, shadow(8, 6, -.01, .45));
    return [
      { look: 'cream', set() { a.position.set(-1.0, .15, -.3); a.rotation.y = .3; b.position.set(.9, .15, -.6); b.rotation.y = -.2; c.position.set(.2, .45, .9); c.rotation.y = .5; c.scale.y = .5; c.position.y = .08; lay(open, -.2, .4, 20, .01); open.visible = false; S.view({ pitch: 36, dist: 7.4, target: [0, 0, 0] }); } },
      { look: 'ink', set() { open.visible = true; lay(open, -.7, .2, 15, .01); c.visible = false; a.position.set(.9, .15, -.3); a.rotation.y = -.2; b.position.set(.95, .45, -.25); b.rotation.y = .1; S.view({ pitch: 52, dist: 7.4, target: [0, 0, 0] }); } },
    ];
  },

  async butter(S) {
    const A = art(S), { M, rig, shadow } = S;
    const pat = A.pattern(1024, 1024, { bg: '#FBF6EA', ink: 'rgba(75,1,41,.55)', cell: 210, word: true });
    const pat2 = A.pattern(1024, 1024, { bg: '#F2E2C4', ink: 'rgba(75,1,41,.55)', cell: 210, word: false, rotate: 0 });
    const mat = c => new THREE.MeshPhysicalMaterial({ map: S.colorTex(c), roughness: .55, transmission: .12, thickness: .02, clearcoat: .2, side: THREE.DoubleSide });
    const s1 = S.sheet(2.6, 2.6, mat(pat), { wave: .05, seg: 48 }), s2 = S.sheet(2.6, 2.6, mat(pat2), { wave: .04, seg: 48 }), s3 = S.sheet(2.6, 2.6, mat(pat), { wave: .06, seg: 48 });
    // one sheet rolled up, as it is handed over the counter
    const wrap = S.sheet(2.6, 1.3, mat(pat2), { curl: .9, seg: 48 });
    rig.add(s1, s2, s3, wrap, shadow(8, 6, -.01, .45));
    return [
      { look: 'cream', set() { lay(s2, 1.0, -.5, 20, .01); lay(s3, -1.1, -.3, -14, .02); lay(s1, 0, .4, 4, .03); wrap.visible = false; S.view({ pitch: 64, dist: 8, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { wrap.visible = true; s3.visible = true; s2.visible = false; lay(s1, -.6, .1, 10, .01); lay(s3, .8, -.4, -16, .02); wrap.position.set(.4, .5, .55); wrap.rotation.set(Math.PI / 2, 0, .4); S.view({ pitch: 46, dist: 7.6, target: [0, .1, 0] }); } },
    ];
  },

  async placemat(S) {
    const A = art(S), { M, box, rig, shadow } = S;
    const matArt = (bg, ink) => {
      const c = S.paper(1400, 1000, bg, bg, 6), g = c.getContext('2d');
      g.strokeStyle = C.gold; g.lineWidth = 8; g.strokeRect(36, 36, 1328, 928);
      g.globalAlpha = .08; g.strokeStyle = ink; starPattern(g, 1400, 1000, 160, 3); g.globalAlpha = 1;
      S.drawLogo(g, S.logoIn(ink), 1180, 150, 140);
      S.text(g, 'مطعم الديرة', 1180, 270, { size: 50, color: ink, font: FONT.script, weight: 700 });
      S.text(g, 'بالهناء والعافية', 1180, 830, { size: 44, color: ink, font: FONT.script, weight: 700 });
      // a band of the lattice down the start side, and the day's dishes beside the plate
      g.fillStyle = ink; g.globalAlpha = .9; g.fillRect(36, 36, 200, 928); g.globalAlpha = 1;
      g.globalAlpha = .25; g.strokeStyle = bg; starPattern(g, 236, 1000, 100, 3); g.globalAlpha = 1;
      [['مشاوي مشكلة', '٦٥'], ['كبسة لحم', '٥٨'], ['ورق عنب', '٢٢'], ['لقيمات', '١٦']].forEach(([n, p], i) => {
        S.text(g, n, 1270, 400 + i * 90, { size: 36, color: ink, align: 'right', weight: 600 });
        S.text(g, p, 1000, 400 + i * 90, { size: 36, color: C.gold, align: 'left', weight: 700 });
      });
      return c;
    };
    const mk = (bg, ink) => box(3.4, 2.4, .006, { pz: M.print(matArt(bg, ink), { roughness: .8 }) }, M.paper(0xf3ede2));
    const a = mk('#FBF6EC', C.maroon), b = mk(C.maroon, C.beigeLight);
    const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xfbfaf7, roughness: .22, clearcoat: 1, side: THREE.DoubleSide });
    const plate = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.75, 0], [.8, .03], [1.0, .1], [1.05, .12]].map(p => new THREE.Vector2(...p)), 64), ceramic);
    const cup = new THREE.Group(); { const body = new THREE.Mesh(new THREE.CylinderGeometry(.3, .24, .55, 48, 1, true), ceramic); const fill = new THREE.Mesh(new THREE.CircleGeometry(.29, 48), M.plain(0x3a1e10, .2)); fill.rotation.x = -Math.PI / 2; fill.position.y = .2; const bot = new THREE.Mesh(new THREE.CircleGeometry(.24, 48), ceramic); bot.rotation.x = -Math.PI / 2; bot.position.y = -.27; const h = new THREE.Mesh(new THREE.TorusGeometry(.14, .03, 12, 32, Math.PI), ceramic); h.position.set(.3, 0, 0); h.rotation.z = -Math.PI / 2; cup.add(body, fill, bot, h); }
    const cutlery = M.plain(0xcfccc6, .32, .55), fork = box(.08, .01, 1.5, {}, cutlery), knife = box(.1, .01, 1.6, {}, cutlery);
    rig.add(a, b, plate, cup, fork, knife, shadow(9, 6, -.01, .4));
    return [
      { look: 'cream', set() { lay(a, 0, 0, 0, .004); b.visible = false; plate.position.set(-.25, .01, .1); cup.position.set(1.15, .29, -.65); fork.position.set(-1.45, .015, .1); knife.position.set(.95, .015, .3); S.view({ pitch: 66, dist: 7.6, target: [0, 0, 0] }); } },
      { look: 'maroon', set() { b.visible = true; lay(b, -.9, .3, 12, .003); lay(a, 1.2, -.6, -10, .006); plate.position.set(-.9, .01, .35); cup.position.set(1.6, .29, -.9); fork.visible = knife.visible = false; S.view({ yaw: 10, pitch: 50, dist: 9.4, target: [0, 0, 0] }); } },
    ];
  },
};
