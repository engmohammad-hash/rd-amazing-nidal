/* Incense box: a maroon rigid box with an Islamic star pattern in foil turns to the light, then its hinged lid
   opens on a velvet tray of bakhoor pieces and a small jar, and smoke rises. */
import { cnv, seg, lerp, ease, easeOut, rand } from './common.js';
import { rigidBox, patternLid } from './kit.js';

export const frames = 120;
export const words = [['بخور', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, mats, dataTex } = stage;
  const box = rigidBox(stage, { w: 2.3, d: 1.7, h: .58, lidSkirt: .26, outer: 0x3d0321, inner: 0x4a0a28, lidArt: patternLid(stage), lidArtSize: 1.56, lidArtOffset: [0, 0], ribbon: false });
  rig.add(box.group);
  const { w, d, h, LD, LS } = box.dims;

  // the lid opens on a hinge along its back edge
  const hinge = new THREE.Group();
  box.group.add(hinge);
  box.group.remove(box.lid); hinge.add(box.lid);
  hinge.position.set(0, box.closedY + LS, -LD / 2);
  box.lid.position.set(0, -LS, LD / 2);

  // velvet tray with bakhoor pieces and a jar
  const velvet = new THREE.MeshPhysicalMaterial({ color: 0x3a0520, roughness: .95, sheen: .8, sheenRoughness: .6, sheenColor: new THREE.Color(0x8a3050) });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(w - .14, .3, d - .14), velvet);
  tray.position.y = .17; box.base.add(tray);
  const bakhoor = new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .82, metalness: .02 });
  const chunks = new THREE.Group(); box.base.add(chunks);
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.075 + rand() * .05, 0), bakhoor);
    m.scale.set(1 + rand() * .6, .55 + rand() * .3, 1 + rand() * .4);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.position.set(-.55 + (rand() - .5) * .75, .35, (rand() - .5) * .9);
    chunks.add(m);
  }
  const amber = new THREE.MeshPhysicalMaterial({ color: 0x6a2c10, roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, transmission: .35, thickness: .3 });
  // a low jar, so it fits under the closed lid (tray top .32, lid underside .58)
  const jar = new THREE.Group();
  jar.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .17, 48), amber));
  { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .06, 48), mats.brass); cap.position.y = .115; jar.add(cap); }
  jar.position.set(.6, .41, 0); box.base.add(jar);

  // smoke: soft sprites rising and swaying from the bakhoor
  const SN = 140, sBase = new Float32Array(SN * 4), sPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { sBase[i * 4] = -.55 + (rand() - .5) * .4; sBase[i * 4 + 1] = rand(); sBase[i * 4 + 2] = (rand() - .5) * .4; sBase[i * 4 + 3] = rand() * 6.28; }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const puff = cnv(128, 128);
  { const g = puff.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.5, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const smokeMat = new THREE.PointsMaterial({ size: 1.1, map: dataTex(puff), color: 0xf3e7da, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const smoke = new THREE.Points(sGeo, smokeMat); box.base.add(smoke);
  function puffSmoke(t, amount) {
    smokeMat.opacity = .07 * amount;
    smoke.visible = amount > 0;
    for (let i = 0; i < SN; i++) {
      const life = (sBase[i * 4 + 1] + t * .045) % 1, ph = sBase[i * 4 + 3];
      sPos[i * 3] = sBase[i * 4] + Math.sin(life * 7 + ph) * .18 * life;
      sPos[i * 3 + 1] = .45 + life * 2.4;
      sPos[i * 3 + 2] = sBase[i * 4 + 2] + Math.cos(life * 5 + ph) * .12 * life;
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .64), s3 = seg(p, .66, .96);
    rig.scale.setScalar(stage.frame.s * lerp(.95, 1.05, ease(s2)) * lerp(1, .92, ease(s3)));
    box.group.position.set(0, lerp(-.35, -.45, ease(s3)) + bob, 0);
    // turn in, then lean the lid towards us to show the pattern, then open
    let rx = lerp(.32, .55, ease(s1)), ry = lerp(-.9, -.35, ease(s1));
    rx = lerp(rx, 1.05, ease(s2)); ry = lerp(ry, -.08, ease(s2));
    rx = lerp(rx, .62, ease(s3)); ry = lerp(ry, -.42, ease(s3));
    box.group.rotation.set(rx, ry, 0);
    hinge.rotation.x = -1.95 * easeOut(seg(s3, .05, .7));
    puffSmoke(t, seg(s3, .3, .8));
    const sw = (seg(p, .12, .32) + seg(p, .4, .64)) % 1.0001;
    glint.intensity = p < .66 ? 26 * Math.sin(Math.PI * sw) : 14;
    glint.position.set(lerp(-2.6, 2.6, sw), 1.6, 1.4);
  }

  const stills = [{ look: 'maroon' }, { look: 'cream' }, { look: 'maroon' }, { look: 'ink' }, { look: 'cream' }, { look: 'maroon' }];
  const poses = [
    { rx: .45, ry: -.6, open: 0, smoke: 0, s: 1.2 },
    { rx: .9, ry: -.25, open: 1, smoke: .6, s: 1.15 },
    { rx: 1.2, ry: -.05, open: 0, smoke: 0, s: 1.55 },
    { rx: .55, ry: -.5, open: 1, smoke: 1, s: 1.15 },
    { rx: .5, ry: .5, open: .45, smoke: 0, s: 1.2 },
    { rx: .7, ry: -.9, open: .8, smoke: .5, s: 1.15 },
  ];
  function still(k) {
    const q = poses[k];
    rig.scale.setScalar(q.s);
    box.group.position.set(0, -.3, 0);
    box.group.rotation.set(q.rx, q.ry, 0);
    hinge.rotation.x = -1.95 * q.open;
    puffSmoke(9 + k, q.smoke);
    glint.intensity = 20; glint.position.set(-1, 1.8, 1.8);
  }

  return { update, stills, still };
}
