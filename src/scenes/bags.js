/* Luxury bags: a maroon paper bag with rope handles and the logo in foil turns to the light,
   tissue paper rises out of it, and a cream bag and a charcoal bag join it. */
import { cnv, grainOn, seg, lerp, ease, easeOut, rand } from './common.js';
import { lidLogo } from './kit.js';

export const frames = 120;
export const words = [['أكياس', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, foil, colorTex, logo } = stage;
  const BW = 1.5, BH = 1.85, BD = .62, T = .012;

  const paperTex = (top, bottom) => {
    const c = cnv(512, 640), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 640);
    gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 512, 640); grainOn(g, 512, 640, 6);
    return colorTex(c);
  };
  const logoFoil = foil(lidLogo(stage), { opacity: 1 });
  const logoInk = new THREE.MeshStandardMaterial({ map: colorTex((() => { const c = cnv(1024, 1024), g = c.getContext('2d'); const s = 900 / Math.max(logo.color.width, logo.color.height); g.drawImage(logo.color, 512 - logo.color.width * s / 2, 512 - logo.color.height * s / 2, logo.color.width * s, logo.color.height * s); return c; })()), transparent: true, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2 });

  function makeBag({ top, bottom, rope, art }) {
    const bag = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ map: paperTex(top, bottom), roughness: .78 });
    const inside = new THREE.MeshStandardMaterial({ color: new THREE.Color(bottom).multiplyScalar(.6), roughness: .9, side: THREE.BackSide });
    const panel = (w, h, d, x, y, z) => { const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m, m, m, m, m, m]); s.position.set(x, y, z); bag.add(s); };
    panel(BW, BH, T, 0, BH / 2, BD / 2); panel(BW, BH, T, 0, BH / 2, -BD / 2);
    panel(T, BH, BD, -BW / 2, BH / 2, 0); panel(T, BH, BD, BW / 2, BH / 2, 0);
    panel(BW, T, BD, 0, T / 2, 0);
    const shade = new THREE.Mesh(new THREE.BoxGeometry(BW - .03, BH - .02, BD - .03), inside); shade.position.y = BH / 2; bag.add(shade);
    // the fold line of the side gusset
    for (const sx of [-1, 1]) {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(.004, BH * .96, .004), new THREE.MeshStandardMaterial({ color: new THREE.Color(bottom).multiplyScalar(.7) }));
      crease.position.set(sx * (BW / 2 + .007), BH / 2, 0); bag.add(crease);
    }
    const a = new THREE.Mesh(new THREE.PlaneGeometry(.95, .95), art); a.position.set(0, BH * .55, BD / 2 + T / 2 + .002); bag.add(a);
    const ropeMat = new THREE.MeshStandardMaterial({ color: rope, roughness: .9 });
    for (const sz of [1, -1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.32, BH - .12, sz * BD / 2), new THREE.Vector3(-.3, BH + .45, sz * BD / 2 * .6),
        new THREE.Vector3(0, BH + .68, 0), new THREE.Vector3(.3, BH + .45, sz * BD / 2 * .6), new THREE.Vector3(.32, BH - .12, sz * BD / 2),
      ]);
      bag.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .028, 12, false), ropeMat));
    }
    return bag;
  }

  const hero = makeBag({ top: '#4B0329', bottom: '#2E0018', rope: 0xd6c1a0, art: logoFoil }); rig.add(hero);
  const cream = makeBag({ top: '#F4ECDF', bottom: '#E4D6BF', rope: 0x4b0129, art: logoInk }); rig.add(cream);
  const charcoal = makeBag({ top: '#2A2426', bottom: '#151113', rope: 0xd6c1a0, art: logoFoil }); rig.add(charcoal);

  // tissue paper: crumpled beige sheets in the mouth of the bag
  const tissue = new THREE.Group(); hero.add(tissue);
  const tissueMat = new THREE.MeshStandardMaterial({ color: 0xeadcc2, roughness: .95, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.PlaneGeometry(1.1, 1.1, 14, 14), pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) pos.setZ(v, (rand() - .5) * .14 + Math.sin(pos.getX(v) * 6 + i) * .05);
    geo.computeVertexNormals();
    const s = new THREE.Mesh(geo, tissueMat);
    s.rotation.set(-.2 + rand() * .4, i * .8, (rand() - .5) * .6);
    s.position.set((rand() - .5) * .3, 0, (rand() - .5) * .15);
    tissue.add(s);
  }

  const place = (o, x, y, z, rx, ry, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); };

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .64), s3 = seg(p, .66, .96);
    rig.scale.setScalar(stage.frame.s * lerp(.9, 1.02, ease(s2)) * lerp(1, .82, ease(s3)));
    const ry = lerp(-1.1, -.35, ease(s1)) + lerp(0, .3, ease(s2)) + lerp(0, -.15, ease(s3));
    place(hero, lerp(0, .2, ease(s3)), -1.25 + bob, 0, lerp(.12, .05, ease(s2)), ry);
    tissue.position.y = BH - .2 + lerp(0, .5, easeOut(seg(s2, .4, 1)));
    tissue.scale.setScalar(lerp(.4, 1, easeOut(seg(s2, .3, 1))));
    tissue.visible = s2 > .3;
    cream.visible = charcoal.visible = s3 > 0;
    place(cream, lerp(.2, -1.5, ease(seg(s3, 0, .8))), -1.25 + bob * .6, lerp(-.4, -.7, ease(s3)), .08, lerp(-.35, -.05, ease(s3)));
    place(charcoal, lerp(.2, 1.75, ease(seg(s3, .1, .9))), -1.25 + bob * .4, lerp(-.5, -1, ease(s3)), .08, lerp(-.35, -.7, ease(s3)));
    const sw = (seg(p, .12, .32) + seg(p, .4, .62) + seg(p, .78, .98)) % 1.0001;
    glint.intensity = 26 * Math.sin(Math.PI * sw) + 5;
    glint.position.set(lerp(-2.4, 2.4, sw), .9, 1.8);
  }

  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'ink' }, { look: 'cream' }, { look: 'maroon' }, { look: 'cream' }];
  function still(k) {
    rig.scale.setScalar(.95);
    hero.visible = cream.visible = charcoal.visible = false;
    tissue.visible = false;
    glint.intensity = 18; glint.position.set(-1.2, 1, 2);
    const y = -1.1;
    if (k === 0) { hero.visible = cream.visible = charcoal.visible = true; place(cream, -1.45, y, -.4, .06, -.1); place(hero, 0, y, 0, .06, -.4); place(charcoal, 1.5, y, -.5, .06, -.75); }
    else if (k === 1) { hero.visible = true; tissue.visible = true; tissue.position.y = BH + .25; tissue.scale.setScalar(1); place(hero, 0, y, 0, .1, -.5); }
    else if (k === 2) { charcoal.visible = true; place(charcoal, 0, y, 0, .1, -.55); }
    else if (k === 3) { cream.visible = true; place(cream, 0, y, 0, .1, -.45); }
    else if (k === 4) { hero.visible = true; rig.scale.setScalar(1.6); place(hero, 0, -1.6, 0, .25, -.25); glint.position.set(.4, 1, 1.5); glint.intensity = 26; }
    else { hero.visible = cream.visible = true; place(hero, .55, y, .2, .08, -.7); place(cream, -.7, y, -.5, .08, -.2); }
  }

  return { update, stills, still };
}
