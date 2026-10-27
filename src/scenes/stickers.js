/* Stickers: a roll of round labels unwinds, one label peels off and lands on a glass jar.
   The stills add a sheet of die-cut stickers. */
import { cnv, grainOn, contain, seg, lerp, ease, easeOut, easeIn } from './common.js';

export const frames = 120;
export const words = [['ملصق', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, colorTex, logo, mats } = stage;

  // one round label: maroon disc, beige ring, beige logo
  const labelArt = (px = 512) => {
    const c = cnv(px, px), g = c.getContext('2d'), r = px / 2;
    g.fillStyle = '#4B0129'; g.beginPath(); g.arc(r, r, r * .96, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#D6C1A0'; g.lineWidth = px * .02; g.beginPath(); g.arc(r, r, r * .84, 0, Math.PI * 2); g.stroke();
    const d = contain(logo.beige, px * .6); g.drawImage(logo.beige, r - d.w / 2, r - d.h / 2, d.w, d.h);
    return c;
  };
  const label = labelArt();
  const PITCH = .62, SW = .74;
  const stripC = cnv(512, 430);
  { const g = stripC.getContext('2d'); g.fillStyle = '#F3ECDF'; g.fillRect(0, 0, 512, 430); grainOn(g, 512, 430, 5); g.drawImage(label, 256 - 190, 215 - 190, 380, 380); }
  const stripTex = colorTex(stripC); stripTex.wrapT = THREE.RepeatWrapping;
  const rollC = cnv(2048, 512);
  { const g = rollC.getContext('2d'); g.fillStyle = '#F3ECDF'; g.fillRect(0, 0, 2048, 512); grainOn(g, 2048, 512, 5); for (let i = 0; i < 6; i++) g.drawImage(label, i * 2048 / 6 + 341 / 2 - 190, 256 - 190, 380, 380); }
  const rollTex = colorTex(rollC);

  const roll = new THREE.Group(); rig.add(roll);
  const R = .62, L = SW + .04;
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 96, 1, true), new THREE.MeshStandardMaterial({ map: rollTex, roughness: .6 })); m.rotation.z = Math.PI / 2; roll.add(m); }
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xe9e0d0, roughness: .9 });
  for (const sx of [-1, 1]) {
    const ringGeo = new THREE.RingGeometry(.26, R, 96);
    const side = new THREE.Mesh(ringGeo, sideMat); side.rotation.y = sx * Math.PI / 2; side.position.x = sx * L / 2; roll.add(side);
  }
  { const core = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, L + .02, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x9c7a55, roughness: .9, side: THREE.DoubleSide })); core.rotation.z = Math.PI / 2; roll.add(core); }
  const spinner = roll.children[0];

  // the unwound strip leaves the bottom of the roll towards us
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(SW, 1, 1, 1), new THREE.MeshStandardMaterial({ map: stripTex, roughness: .6, side: THREE.DoubleSide }));
  rig.add(strip);
  // lay the strip from the bottom of the roll along the roll's facing direction; set the roll's pose first
  const setStrip = len => {
    const ry = roll.rotation.y;
    strip.scale.y = Math.max(.001, len);
    stripTex.repeat.set(1, len / PITCH); stripTex.offset.y = -len / PITCH;
    strip.rotation.set(-Math.PI / 2, 0, ry);
    strip.position.set(roll.position.x + Math.sin(ry) * len / 2, roll.position.y - R, roll.position.z + Math.cos(ry) * len / 2);
  };

  const flyMat = new THREE.MeshPhysicalMaterial({ map: colorTex(label), transparent: true, roughness: .4, clearcoat: .7, side: THREE.DoubleSide });
  const flying = new THREE.Mesh(new THREE.CircleGeometry(.27, 64), flyMat);
  // circle UVs already map the square art onto the disc
  rig.add(flying);

  // the jar, with the label already curved onto its front
  const jar = new THREE.Group(); rig.add(jar);
  const JR = .62, JH = 1.35;
  // clear glass over dark date paste
  jar.add(new THREE.Mesh(new THREE.CylinderGeometry(JR, JR, JH, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: .96, thickness: .25, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0 })));
  { const fill = new THREE.Mesh(new THREE.CylinderGeometry(JR - .05, JR - .05, JH * .78, 96), new THREE.MeshPhysicalMaterial({ color: 0x3e1a08, roughness: .25, clearcoat: .9 })); fill.position.y = -JH * .1; jar.add(fill); }
  { const cap = new THREE.Mesh(new THREE.CylinderGeometry(JR + .03, JR + .03, .26, 96), new THREE.MeshPhysicalMaterial({ color: 0x4b0129, roughness: .35, clearcoat: .6 })); cap.position.y = JH / 2 + .12; jar.add(cap); }
  const arc = .54 / (JR + .006);
  const jarLabel = new THREE.Mesh(new THREE.CylinderGeometry(JR + .006, JR + .006, .54, 48, 1, true, -arc / 2, arc), new THREE.MeshPhysicalMaterial({ map: colorTex(label), transparent: true, roughness: .4, clearcoat: .7 }));
  jarLabel.position.y = -.05; jar.add(jarLabel);
  const jar2 = jar.clone(); rig.add(jar2);

  // a sheet of die-cut stickers, for the stills
  const sheetC = cnv(1240, 1754);
  {
    const g = sheetC.getContext('2d'); g.fillStyle = '#F7F1E7'; g.fillRect(0, 0, 1240, 1754); grainOn(g, 1240, 1754, 5);
    const art = labelArt(300);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const x = 120 + c * 380, y = 140 + r * 400;
      if ((r + c) % 3 === 1) {
        g.fillStyle = '#D6C1A0'; g.beginPath(); g.roundRect(x - 20, y + 20, 340, 220, 40); g.fill();
        g.fillStyle = '#4B0129'; g.font = '700 74px "Aref Ruqaa", serif'; g.textAlign = 'center'; g.direction = 'rtl'; g.fillText('شكراً لك', x + 150, y + 150);
      } else g.drawImage(art, x, y, 300, 300);
    }
  }
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, .01), [sideMat, sideMat, sideMat, sideMat, new THREE.MeshStandardMaterial({ map: colorTex(sheetC), roughness: .55 }), sideMat]);
  rig.add(sheet);

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .64), s3 = seg(p, .66, .96);
    rig.scale.setScalar(stage.frame.s * lerp(1.1, .95, ease(s3)));
    sheet.visible = false; jar2.visible = false;
    const tilt = lerp(.55, .4, ease(s1));
    roll.position.set(lerp(0, -.7, ease(s3)), .55 + bob, -.6);
    roll.rotation.set(0, lerp(-.7, -.35, ease(s1)), 0);
    const len = 2.1 * easeOut(s1);
    spinner.rotation.x = -len / R;
    setStrip(len);
    rig.rotation.x = tilt * .5;
    // the label at the end of the strip peels up and floats, then lands on the jar
    const peel = ease(s2), land = ease(s3), ry = roll.rotation.y;
    const back = len - PITCH * .5;
    const endX = roll.position.x + Math.sin(ry) * back, endZ = roll.position.z + Math.cos(ry) * back;
    flying.visible = s2 > 0 && land < 1;
    const fx = lerp(endX, .3, peel), fy = lerp(roll.position.y - R + .01, .2, peel), fz = lerp(endZ, 1.2, peel);
    flying.position.set(lerp(fx, 1.05, land), lerp(fy, -.3, land), lerp(fz, JR + .35, land));
    flying.rotation.set(lerp(-Math.PI / 2, -.15, peel) + lerp(0, .15, land), lerp(0, -.3, peel) + lerp(0, .25, land), lerp(0, .4, peel) - lerp(0, .4, land));
    jar.visible = s3 > 0;
    jar.position.set(lerp(3.5, 1.05, easeOut(seg(s3, 0, .6))), -.25, 0);
    jar.rotation.set(.12, 0, 0);
    jarLabel.visible = land >= 1;
    const sw = (seg(p, .36, .62) + seg(p, .78, .98)) % 1.0001;
    glint.intensity = 24 * Math.sin(Math.PI * sw) + 6;
    glint.position.set(lerp(-2.4, 2.4, sw), .8, 1.9);
  }

  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'cream' }, { look: 'ink' }, { look: 'maroon' }, { look: 'cream' }];
  function still(k) {
    rig.scale.setScalar(1); rig.rotation.set(0, 0, 0);
    roll.visible = strip.visible = flying.visible = jar.visible = jar2.visible = sheet.visible = false;
    jarLabel.visible = true;
    glint.intensity = 18; glint.position.set(-1, 1.2, 2);
    if (k === 0) {        // the roll and its strip
      roll.visible = strip.visible = true; rig.rotation.x = .3;
      roll.position.set(0, .45, -.6); roll.rotation.set(0, -.5, 0); setStrip(1.8);
    } else if (k === 1) { // two labelled jars
      jar.visible = jar2.visible = true; jar.position.set(-.75, -.2, 0); jar2.position.set(.8, -.2, -.4); jar.rotation.set(.12, .2, 0); jar2.rotation.set(.12, -.3, 0);
    } else if (k === 2) { // the sticker sheet
      sheet.visible = true; rig.scale.setScalar(1.1); sheet.position.set(0, 0, 0); sheet.rotation.set(-.35, -.25, .08);
    } else if (k === 3) { // a label close up
      flying.visible = true; rig.scale.setScalar(2.8); flying.position.set(0, 0, 0); flying.rotation.set(-.3, -.4, .2); glint.position.set(.3, .4, 1.2); glint.intensity = 26;
    } else if (k === 4) { // one jar close up
      jar.visible = true; rig.scale.setScalar(1.45); jar.position.set(0, -.1, 0); jar.rotation.set(.18, -.15, 0);
    } else {              // roll next to a labelled jar
      roll.visible = strip.visible = jar.visible = true; rig.rotation.x = .2;
      roll.position.set(-.8, .4, -.5); roll.rotation.set(0, -.4, 0); setStrip(1.2);
      jar.position.set(1, -.2, 0); jar.rotation.set(.12, -.2, 0);
    }
  }

  return { update, stills, still };
}
