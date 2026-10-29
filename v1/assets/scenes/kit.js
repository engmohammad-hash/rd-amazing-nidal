/* Printed pieces more than one scene uses: business cards in several designs, and a two-piece rigid gift box. */
import { cnv, grainOn, contain, whiteMask, maskFrom, starPattern, PALETTE, rand } from './common.js';

const CW = 1.9, CH = 1.086, CT = .022;
export const CARD = { w: CW, h: CH, t: CT, step: CT + .003 };

/* ---------- business cards ---------- */
// each design: paper colour, what is printed in ink, and what is stamped in foil
export function cardKit(stage) {
  const { THREE, colorTex, foil, logo } = stage;
  const W = 1024, H = 586;
  const paper = (top, bottom, amt = 7) => {
    const c = cnv(W, H), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    grainOn(g, W, H, amt);
    return c;
  };
  const backText = (bg, ink, accent) => {
    const c = paper(bg, bg, 6), g = c.getContext('2d');
    g.textAlign = 'center'; g.fillStyle = ink;
    g.direction = 'rtl'; g.font = '700 70px "Aref Ruqaa", serif'; g.fillText('مطابع روعة التصاميم', W / 2, 230);
    g.font = '500 32px "IBM Plex Sans Arabic", sans-serif'; g.globalAlpha = .8; g.fillText('طباعة شاملة', W / 2, 290); g.globalAlpha = 1;
    g.strokeStyle = accent; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2 - 90, 335); g.lineTo(W / 2 + 90, 335); g.stroke();
    g.direction = 'ltr'; g.font = '500 28px "IBM Plex Sans Arabic", sans-serif'; g.globalAlpha = .75;
    g.fillText('+966 53 584 3085  ·  @printingsticker2022', W / 2, 400); g.globalAlpha = 1;
    return c;
  };
  const logoMask = whiteMask(logo.beige, W, H, 470);
  const designs = {
    maroon: { front: paper('#4A0428', '#2A0016'), tint: 0x8a7d84, back: backText('#F3EBDD', PALETTE.maroon, PALETTE.beigeDeep), foil: logoMask, edge: 0xcfb28a },
    cream: (() => {
      const c = paper('#F6EFE3', '#EADFCC', 6), g = c.getContext('2d'), d = contain(logo.color, 400);
      g.drawImage(logo.color, (W - d.w) / 2, (H - d.h) / 2, d.w, d.h);
      return { front: c, tint: 0xffffff, back: backText('#4B0129', '#EADCC2', '#D6C1A0'), foil: null, edge: 0x4b0129 };
    })(),
    charcoal: { front: paper('#2A2426', '#141012'), tint: 0x9a9396, back: backText('#EFE9E1', '#1E1A1B', '#B99C70'), foil: logoMask, edge: 0xb99c70 },
    pattern: (() => {
      const c = paper('#3A0220', '#22000F'), g = c.getContext('2d');
      g.globalAlpha = .12; g.strokeStyle = '#D6C1A0'; starPattern(g, W, H, 96, 2); g.globalAlpha = 1;
      return { front: c, tint: 0x8a7d84, back: backText('#F3EBDD', PALETTE.maroon, PALETTE.beigeDeep), foil: logoMask, edge: 0xcfb28a };
    })(),
  };
  const geo = new THREE.BoxGeometry(CW, CH, CT);
  const foilGeo = new THREE.PlaneGeometry(CW, CH);
  const built = {};
  for (const [name, d] of Object.entries(designs)) {
    const edge = new THREE.MeshStandardMaterial({ color: d.edge, roughness: .42, metalness: .25 });
    built[name] = {
      mats: [edge, edge, edge, edge,
        new THREE.MeshStandardMaterial({ map: colorTex(d.front), color: d.tint, roughness: .72, envMapIntensity: .45 }),
        new THREE.MeshStandardMaterial({ map: colorTex(d.back), roughness: .8 })],
      foil: d.foil,
    };
  }
  const foilFor = {};
  return {
    // a card; `foilMat` overrides the design's own foil (used to animate the stamping)
    make(name = 'maroon', foilMat) {
      const b = built[name], m = new THREE.Mesh(geo, b.mats);
      const f = foilMat || (b.foil && (foilFor[name] = foilFor[name] || foil(b.foil, { opacity: 1 })));
      if (f) { const fm = new THREE.Mesh(foilGeo, f); fm.position.z = CT / 2 + .0012; m.add(fm); }
      return m;
    },
    foilMaterial(name = 'maroon', extra) { return foil(built[name].foil, extra); },
    logoMask,
  };
}

/* ---------- two-piece rigid box: a base and a lid that drops over it ---------- */
export function rigidBox(stage, {
  w = 2.5, d = 1.62, h = .46, wall = .045, lidSkirt = .24,
  outer = 0x3d0321, inner = 0xd9c5a3, lidArt = null, lidArtSize = 1.08, lidArtOffset = [-.22, 0], ribbon = true,
} = {}) {
  const { THREE, foil } = stage;
  const outMat = new THREE.MeshPhysicalMaterial({ color: outer, roughness: .42, metalness: .05, clearcoat: .45, clearcoatRoughness: .35, sheen: .4, sheenRoughness: .5, sheenColor: new THREE.Color(0xe0c9a6) });
  const inMat = new THREE.MeshStandardMaterial({ color: inner, roughness: .9 });
  const slab = (sw, sh, sd, innerFace) => { const mats = Array(6).fill(outMat); mats[innerFace] = inMat; return new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), mats); };
  const group = new THREE.Group(), base = new THREE.Group(), lid = new THREE.Group();
  group.add(base, lid);
  { const b = slab(w, wall, d, 2); b.position.y = wall / 2; base.add(b); }
  { const s = slab(w, h, wall, 5); s.position.set(0, h / 2, d / 2 - wall / 2); base.add(s); }
  { const s = slab(w, h, wall, 4); s.position.set(0, h / 2, -d / 2 + wall / 2); base.add(s); }
  { const s = slab(wall, h, d - 2 * wall, 0); s.position.set(-w / 2 + wall / 2, h / 2, 0); base.add(s); }
  { const s = slab(wall, h, d - 2 * wall, 1); s.position.set(w / 2 - wall / 2, h / 2, 0); base.add(s); }
  const LW = w + 2 * wall + .02, LD = d + 2 * wall + .02, LT = .05, LS = lidSkirt;
  { const m = slab(LW, LT, LD, 3); m.position.y = LS - LT / 2; lid.add(m); }
  { const m = slab(LW, LS - LT, wall, 5); m.position.set(0, (LS - LT) / 2, LD / 2 - wall / 2); lid.add(m); }
  { const m = slab(LW, LS - LT, wall, 4); m.position.set(0, (LS - LT) / 2, -LD / 2 + wall / 2); lid.add(m); }
  { const m = slab(wall, LS - LT, LD - 2 * wall, 0); m.position.set(-LW / 2 + wall / 2, (LS - LT) / 2, 0); lid.add(m); }
  { const m = slab(wall, LS - LT, LD - 2 * wall, 1); m.position.set(LW / 2 - wall / 2, (LS - LT) / 2, 0); lid.add(m); }
  if (lidArt) {
    const art = new THREE.Mesh(new THREE.PlaneGeometry(lidArtSize * lidArt.width / lidArt.height, lidArtSize), foil(lidArt, { opacity: 1 }));
    art.rotation.x = -Math.PI / 2; art.position.set(lidArtOffset[0], LS + .0015, lidArtOffset[1]); lid.add(art);
  }
  if (ribbon) {
    const satin = new THREE.MeshPhysicalMaterial({ color: 0xd8c29e, roughness: .36, metalness: .05, sheen: 1, sheenRoughness: .3, sheenColor: new THREE.Color(0xfff1d8) });
    const rx = LW / 2 - .44;
    { const r = new THREE.Mesh(new THREE.BoxGeometry(.2, .006, LD + .006), satin); r.position.set(rx, LS + .003, 0); lid.add(r); }
    for (const sz of [1, -1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.2, LS, .006), satin); r.position.set(rx, LS / 2, sz * (LD / 2 + .003)); lid.add(r); }
  }
  return { group, base, lid, outMat, inMat, closedY: h - LS + LT, dims: { w, d, h, wall, LW, LD, LS } };
}

// a beige logo mask sized for a lid
export function lidLogo(stage, px = 1024, size = 900) { return whiteMask(stage.logo.beige, px, px, size); }

// an Islamic star lattice with the logo in a medallion, for lids
export function patternLid(stage, px = 1024) {
  const logoM = whiteMask(stage.logo.beige, px, px, px * .5);
  return maskFrom(px, px, (g, w, h) => {
    g.globalAlpha = .55; starPattern(g, w, h, w / 7, w / 260); g.globalAlpha = 1;
    g.fillStyle = '#000'; g.beginPath(); g.arc(w / 2, h / 2, w * .3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = w / 180; g.beginPath(); g.arc(w / 2, h / 2, w * .3, 0, Math.PI * 2); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.drawImage(logoM, 0, 0); g.globalCompositeOperation = 'source-over';
  });
}

export { rand };
