/* Paper cups: a printed cup lifts out of a stack, turns to show the print all around, then gets its sleeve
   and lid with steam rising, and two smaller sizes join it. */
import { cnv, grainOn, starPattern, contain, seg, lerp, ease, easeOut, easeIn, rand } from './common.js';

export const frames = 120;
export const words = [['أكواب', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, colorTex, dataTex, logo } = stage;
  const RT = .66, RB = .48, HT = 1.55;

  // the wrap print: maroon with a beige band, logos around and the name in Arabic
  const wrap = cnv(2048, 1024);
  {
    const g = wrap.getContext('2d');
    g.fillStyle = '#4B0129'; g.fillRect(0, 0, 2048, 1024); grainOn(g, 2048, 1024, 6);
    g.globalAlpha = .1; g.strokeStyle = '#D6C1A0'; starPattern(g, 2048, 1024, 128, 3); g.globalAlpha = 1;
    g.fillStyle = '#D6C1A0'; g.fillRect(0, 70, 2048, 14); g.fillRect(0, 940, 2048, 14);
    for (let i = 0; i < 3; i++) {
      const cx = 2048 / 3 * (i + .5), d = contain(logo.beige, 420);
      g.drawImage(logo.beige, cx - d.w / 2, 470 - d.h / 2, d.w, d.h);
    }
    g.textAlign = 'center'; g.direction = 'rtl'; g.fillStyle = '#EADCC2'; g.font = '600 54px "IBM Plex Sans Arabic", sans-serif';
    for (let i = 0; i < 3; i++) g.fillText('مطابع روعة التصاميم', 2048 / 3 * (i + 1), 860);
  }
  const sleeveArt = cnv(2048, 512);
  {
    const g = sleeveArt.getContext('2d');
    g.fillStyle = '#C9AE86'; g.fillRect(0, 0, 2048, 512); grainOn(g, 2048, 512, 10);
    for (let i = 0; i < 4; i++) { const d = contain(logo.color, 300); g.drawImage(logo.color, 2048 / 4 * (i + .5) - d.w / 2, 256 - d.h / 2, d.w, d.h); }
  }
  const printMat = new THREE.MeshPhysicalMaterial({ map: colorTex(wrap), roughness: .55, clearcoat: .25, clearcoatRoughness: .5 });
  const insideMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: .8, side: THREE.BackSide });
  const lidMat = new THREE.MeshPhysicalMaterial({ color: 0xf2ebe1, roughness: .35, clearcoat: .5 });
  const sleeveMat = new THREE.MeshStandardMaterial({ map: colorTex(sleeveArt), roughness: .85 });

  function makeCup() {
    const cup = new THREE.Group();
    cup.add(new THREE.Mesh(new THREE.CylinderGeometry(RT, RB, HT, 128, 1, true), printMat));
    cup.add(new THREE.Mesh(new THREE.CylinderGeometry(RT - .004, RB - .004, HT, 128, 1, true), insideMat));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RT + .012, .026, 16, 128), new THREE.MeshStandardMaterial({ color: 0xf2ebe1, roughness: .6 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = HT / 2; cup.add(rim);
    const base = new THREE.Mesh(new THREE.CircleGeometry(RB, 64), insideMat.clone()); base.material.side = THREE.DoubleSide;
    base.rotation.x = -Math.PI / 2; base.position.y = -HT / 2 + .04; cup.add(base);
    return cup;
  }
  const hero = makeCup(); rig.add(hero);
  const stack = new THREE.Group(); rig.add(stack);
  for (let i = 0; i < 4; i++) { const c = makeCup(); c.position.y = i * .22; stack.add(c); }
  const mid = makeCup(); mid.scale.setScalar(.8); rig.add(mid);
  const small = makeCup(); small.scale.setScalar(.62); rig.add(small);

  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(RT * .935 + .012, RT * .72 + .012, .55, 128, 1, true), sleeveMat);
  hero.add(sleeve);
  const lid = new THREE.Group(); hero.add(lid);
  { const ring = new THREE.Mesh(new THREE.CylinderGeometry(RT + .05, RT + .05, .1, 96), lidMat); lid.add(ring); }
  // a low dome sitting on the lid's flat top
  { const dome = new THREE.Mesh(new THREE.SphereGeometry(RT * .95, 64, 16, 0, Math.PI * 2, 0, .45), lidMat); dome.position.y = -.26; dome.scale.y = .55; lid.add(dome); }
  { const sip = new THREE.Mesh(new THREE.BoxGeometry(.18, .02, .06), new THREE.MeshStandardMaterial({ color: 0x2a1a14 })); sip.position.set(0, .06, RT * .62); lid.add(sip); }
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(RT * .96, 64), new THREE.MeshPhysicalMaterial({ color: 0x3a1e10, roughness: .2, clearcoat: 1 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = HT / 2 - .12; hero.add(coffee);

  // steam above the lid
  const SN = 130, sBase = new Float32Array(SN * 4), sPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { sBase[i * 4] = (rand() - .5) * .3; sBase[i * 4 + 1] = rand(); sBase[i * 4 + 2] = (rand() - .5) * .3; sBase[i * 4 + 3] = rand() * 6.28; }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const puff = cnv(128, 128);
  { const g = puff.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const steamMat = new THREE.PointsMaterial({ size: 1, map: dataTex(puff), color: 0xf6eee4, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const steam = new THREE.Points(sGeo, steamMat); hero.add(steam);
  function steamAt(t, amount) {
    steamMat.opacity = .075 * amount; steam.visible = amount > 0;
    for (let i = 0; i < SN; i++) {
      const life = (sBase[i * 4 + 1] + t * .05) % 1, ph = sBase[i * 4 + 3];
      sPos[i * 3] = sBase[i * 4] + Math.sin(life * 6 + ph) * .15 * life;
      sPos[i * 3 + 1] = HT / 2 + .15 + life * 1.8;
      sPos[i * 3 + 2] = sBase[i * 4 + 2] + Math.cos(life * 5 + ph) * .1 * life;
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .64), s3 = seg(p, .66, .96);
    rig.scale.setScalar(stage.frame.s * lerp(1.05, 1, ease(s1)) * lerp(1, .9, ease(s3)));
    stack.visible = s2 < 1;
    stack.position.set(0, -1.05 - 4.5 * easeIn(seg(s2, .2, 1)), 0);
    stack.rotation.set(.12, .3, 0);
    // the top cup lifts, then spins once to show the print, then settles for the sleeve and lid
    const lift = easeOut(s1);
    hero.position.set(lerp(0, .15, ease(s3)), lerp(-1.05 + 4 * .22, .05, lift) + bob, lerp(0, .25, lift));
    hero.rotation.set(lerp(.12, .16, lift), .3 + lerp(0, Math.PI * 2, ease(s2)) + lerp(0, -.4, ease(s3)), 0);
    sleeve.position.y = lerp(-HT * 1.1, -.08, easeOut(seg(s3, 0, .45)));
    sleeve.visible = s3 > 0;
    lid.position.y = lerp(HT * 1.6, HT / 2 + .03, easeOut(seg(s3, .3, .7)));
    lid.visible = s3 > .3;
    coffee.visible = false;
    steamAt(t, seg(s3, .6, .9));
    mid.visible = small.visible = s3 > .4;
    mid.position.set(lerp(-.3, -1.35, ease(seg(s3, .4, 1))), -.2 + bob * .6, -.35); mid.rotation.set(.16, -.3, 0);
    small.position.set(lerp(-.3, -2.3, ease(seg(s3, .5, 1))), -.36 + bob * .4, -.6); small.rotation.set(.16, -.5, 0);
    const sw = (seg(p, .1, .32) + seg(p, .38, .62)) % 1.0001;
    glint.intensity = 22 * Math.sin(Math.PI * sw) + 6;
    glint.position.set(lerp(-2.4, 2.4, sw), .8, 1.8);
  }

  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'ink' }, { look: 'cream' }, { look: 'maroon' }, { look: 'cream' }];
  function still(k) {
    rig.scale.setScalar(1.05);
    stack.visible = mid.visible = small.visible = false;
    hero.visible = true; sleeve.visible = lid.visible = coffee.visible = false; steamAt(4, 0);
    hero.position.set(0, -.1, 0); hero.rotation.set(.14, .2, 0);
    sleeve.position.y = -.08; lid.position.y = HT / 2 + .03;
    glint.intensity = 18; glint.position.set(-1, 1, 2);
    if (k === 0) { mid.visible = small.visible = true; hero.position.set(.9, -.05, 0); mid.position.set(-.35, -.2, -.1); small.position.set(-1.35, -.35, -.2); mid.rotation.set(.14, -.1, 0); small.rotation.set(.14, -.3, 0); }
    else if (k === 1) { sleeve.visible = lid.visible = true; steamAt(6, 1); }
    else if (k === 2) { stack.visible = true; hero.visible = false; stack.position.set(0, -1, 0); stack.rotation.set(.18, .5, 0); }
    else if (k === 3) { rig.scale.setScalar(1.7); hero.rotation.set(.1, 1.2, 0); }
    else if (k === 4) { coffee.visible = true; hero.rotation.set(.55, .3, 0); steamAt(8, .8); }
    else { sleeve.visible = true; mid.visible = true; hero.position.set(.55, -.1, 0); mid.position.set(-.75, -.2, -.2); mid.rotation.set(.14, .9, 0); }
  }

  return { update, stills, still };
}
