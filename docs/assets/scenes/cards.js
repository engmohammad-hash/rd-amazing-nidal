/* Business cards: a card lifts off the stack and turns to the light, flips to show its back,
   then a fan of four designs opens. */
import { seg, lerp, ease, easeIn, easeOut, rand } from './common.js';
import { cardKit, CARD } from './kit.js';

export const frames = 120;
export const words = [['كروت', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint } = stage;
  const kit = cardKit(stage);

  const stack = new THREE.Group(); rig.add(stack);
  for (let i = 0; i < 7; i++) {
    const c = kit.make('maroon');
    c.position.set((rand() - .5) * .03, (rand() - .5) * .03, i * CARD.step);
    c.rotation.z = (rand() - .5) * .035; stack.add(c);
  }
  const hero = kit.make('maroon'); rig.add(hero);
  const others = ['charcoal', 'cream', 'pattern'].map(n => { const c = kit.make(n); rig.add(c); return c; });

  // fan: cards hang from a pivot below them, like cards held in a hand
  const PIVOT = -1.55, RADIUS = CARD.h / 2 + 1.05;
  const slot = (deg, z) => {
    const a = deg * Math.PI / 180;
    return { x: -Math.sin(a) * RADIUS, y: PIVOT + Math.cos(a) * RADIUS, z, rz: a };
  };
  const SLOTS = [slot(22, .00), slot(-22, .03), slot(8, .06), slot(-7, .09)];   // others..., hero last (in front)

  const lyingY = -.62, lying = { x: 0, y: lyingY + .06, z: .12, rx: -.92, ry: .4, rz: .1 };
  const facing = { x: 0, y: .12, z: .6, rx: -.06, ry: -.25, rz: -.05 };
  const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t) });
  const place = (o, s) => { o.position.set(s.x, s.y, s.z); o.rotation.set(s.rx, s.ry, s.rz); };

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .03;
    const s1 = seg(p, .04, .3), s2 = seg(p, .34, .64), out = seg(p, .56, .7), s3 = seg(p, .68, .94);
    rig.scale.setScalar(stage.frame.s * lerp(1.12, 1, ease(s3)));

    stack.visible = out < 1;
    stack.position.set(0, lyingY - 5.5 * easeIn(out), 0);
    stack.rotation.set(-.92, .4, .1);

    // act 1 and 2: the hero card lifts, turns, flips over and back
    let h = mix(lying, facing, ease(s1));
    h.y += bob * s1;
    h.ry += lerp(0, .45, ease(seg(p, .2, .34))) + Math.PI * Math.sin(Math.PI * ease(s2));
    // act 3: it joins the fan in front
    const fanH = { ...SLOTS[3], rx: -.16, ry: .2 };
    h = mix(h, fanH, ease(s3));
    place(hero, h);

    others.forEach((c, i) => {
      const s = SLOTS[i];
      const behind = { ...fanH, z: fanH.z - .04 * (i + 1) };
      const target = { x: s.x, y: s.y + bob * .5, z: s.z, rx: -.16, ry: .2, rz: s.rz };
      c.visible = s3 > 0;
      place(c, mix(behind, target, ease(seg(s3, i * .08, .7 + i * .1))));
    });

    // a soft light sweeps across the foil in every act
    const sw = (seg(p, .14, .34) + seg(p, .42, .62) + seg(p, .76, .98)) % 1.0001;
    glint.intensity = 26 * Math.sin(Math.PI * sw);
    glint.position.set(lerp(-2.6, 2.6, sw), .7, 1.8);
  }

  /* gallery stills */
  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'ink' }, { look: 'cream' }, { look: 'maroon' }, { look: 'cream' }];
  function still(k) {
    rig.scale.setScalar(1.15);
    stack.visible = false; others.forEach(c => { c.visible = false; }); hero.visible = true;
    glint.intensity = 22; glint.position.set(-1.2, 1.2, 2.2);
    if (k === 0) {         // the fan of designs
      others.forEach((c, i) => { c.visible = true; place(c, { ...SLOTS[i], y: SLOTS[i].y + .55, rx: -.12, ry: .12 }); });
      place(hero, { ...SLOTS[3], y: SLOTS[3].y + .55, rx: -.12, ry: .12 });
    } else if (k === 1) {  // the foil close up
      rig.scale.setScalar(1.6);
      place(hero, { x: 0, y: 0, z: 0, rx: -.35, ry: -.45, rz: .08 });
      glint.position.set(.6, 1.4, 1.6); glint.intensity = 30;
    } else if (k === 2) {  // charcoal over maroon
      others[0].visible = true;
      place(others[0], { x: .45, y: .2, z: .05, rx: -.3, ry: .25, rz: -.18 });
      place(hero, { x: -.5, y: -.25, z: -.05, rx: -.3, ry: .25, rz: .12 });
    } else if (k === 3) {  // the stack, top card lifting
      stack.visible = true; stack.position.set(0, -.35, 0); stack.rotation.set(-1.0, .5, .1);
      place(hero, { x: .1, y: .25, z: .55, rx: -.6, ry: .3, rz: .06 });
    } else if (k === 4) {  // front and back
      others[1].visible = true;
      place(others[1], { x: .85, y: .05, z: 0, rx: -.12, ry: -.3, rz: -.06 });
      place(hero, { x: -.95, y: -.05, z: .1, rx: -.12, ry: Math.PI - .3, rz: .06 });
    } else {               // the star pattern card
      others[2].visible = true; hero.visible = false;
      rig.scale.setScalar(1.5);
      place(others[2], { x: 0, y: 0, z: 0, rx: -.4, ry: .4, rz: -.1 });
    }
  }

  return { update, stills, still };
}
