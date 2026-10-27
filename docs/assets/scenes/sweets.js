/* Sweet box: a maroon sleeve with the logo in foil and a satin pull, its drawer slides out on a grid of
   chocolates and dates in their own compartments. */
import { seg, lerp, ease, easeOut, rand } from './common.js';
import { lidLogo } from './kit.js';

export const frames = 120;
export const words = [['حلوى', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, foil } = stage;
  const W = 2.3, D = 2.3, H = .5, T = .04;
  const sleeveMat = new THREE.MeshPhysicalMaterial({ color: 0x3d0321, roughness: .42, metalness: .05, clearcoat: .45, clearcoatRoughness: .35, sheen: .4, sheenRoughness: .5, sheenColor: new THREE.Color(0xe0c9a6) });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xeee2cf, roughness: .85 });
  const beigeMat = new THREE.MeshStandardMaterial({ color: 0xd2bb94, roughness: .8 });

  const group = new THREE.Group(); rig.add(group);
  // sleeve: top, bottom and two sides, open at the front and back
  const sleeve = new THREE.Group(); group.add(sleeve);
  const slab = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sleeveMat); m.position.set(x, y, z); sleeve.add(m); };
  slab(W, T, D, 0, H - T / 2, 0); slab(W, T, D, 0, T / 2, 0);
  slab(T, H, D, -W / 2 + T / 2, H / 2, 0); slab(T, H, D, W / 2 - T / 2, H / 2, 0);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), foil(lidLogo(stage), { opacity: 1 }));
  art.rotation.x = -Math.PI / 2; art.position.set(0, H + .0015, 0); sleeve.add(art);
  const satin = new THREE.MeshPhysicalMaterial({ color: 0xd8c29e, roughness: .36, metalness: .05, sheen: 1, sheenRoughness: .3, sheenColor: new THREE.Color(0xfff1d8) });

  // drawer: cream tray with beige dividers, and a satin pull on its front
  const drawer = new THREE.Group(); group.add(drawer);
  const dW = W - 2 * T - .02, dD = D - .02, dH = H - 2 * T - .02;
  const tray = (w, h, d, x, y, z, m = creamMat) => { const s = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); s.position.set(x, y, z); drawer.add(s); };
  tray(dW, T, dD, 0, T + T / 2, 0);
  tray(dW, dH, T, 0, T + dH / 2, dD / 2 - T / 2, sleeveMat);
  tray(dW, dH, T, 0, T + dH / 2, -dD / 2 + T / 2);
  tray(T, dH, dD, -dW / 2 + T / 2, T + dH / 2, 0);
  tray(T, dH, dD, dW / 2 - T / 2, T + dH / 2, 0);
  const N = 3, cell = (dW - T) / N;
  for (let i = 1; i < N; i++) {
    tray(T * .6, dH * .7, dD - T, -dW / 2 + T / 2 + i * cell, T + dH * .35, 0, beigeMat);
    tray(dW - T, dH * .7, T * .6, 0, T + dH * .35, -dD / 2 + T / 2 + i * cell, beigeMat);
  }
  const pull = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 12, 32, Math.PI), satin);
  pull.rotation.z = Math.PI; pull.position.set(0, T + dH / 2, dD / 2 + .002); drawer.add(pull);

  // sweets: chocolates in foil, dark truffles and dates, one per compartment
  const foilGold = new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 1, roughness: .28 });
  const choc = new THREE.MeshPhysicalMaterial({ color: 0x3b1d10, roughness: .35, clearcoat: .6, clearcoatRoughness: .3 });
  const date = new THREE.MeshPhysicalMaterial({ color: 0x4a1f0e, roughness: .4, clearcoat: .8, clearcoatRoughness: .25 });
  const cups = new THREE.MeshStandardMaterial({ color: 0x4b0129, roughness: .7 });
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -dW / 2 + T / 2 + cell * (i + .5), z = -dD / 2 + T / 2 + cell * (j + .5), kind = (i + j * 2) % 3;
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(.24, .2, .12, 24, 1, true), cups); paper.position.set(x, T + .1, z); drawer.add(paper);
    let s;
    if (kind === 0) { s = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 20), foilGold); s.scale.set(1, .9, 1); }
    else if (kind === 1) { s = new THREE.Mesh(new THREE.SphereGeometry(.21, 32, 20), choc); s.scale.set(1, .78, 1); }
    else { s = new THREE.Mesh(new THREE.SphereGeometry(.13, 24, 16), date); s.scale.set(1, .75, 1.9); s.rotation.y = rand() * 3; }
    s.position.set(x, T + .22, z); drawer.add(s);
  }

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .64), s3 = seg(p, .66, .96);
    rig.scale.setScalar(stage.frame.s * lerp(.95, 1, ease(s2)));
    group.position.set(0, -.3 + bob, 0);
    let rx = lerp(.35, .62, ease(s1)), ry = lerp(-.9, -.45, ease(s1));
    rx = lerp(rx, .5, ease(s2)); ry = lerp(ry, -.62, ease(s2));
    rx = lerp(rx, .95, ease(s3)); ry = lerp(ry, -.25, ease(s3));
    group.rotation.set(rx, ry, 0);
    drawer.position.z = lerp(0, D * .45, easeOut(s2)) + lerp(0, D * .42, ease(s3));
    sleeve.position.z = -lerp(0, .25, ease(s3));
    const sw = (seg(p, .1, .32) + seg(p, .7, .98)) % 1.0001;
    glint.intensity = 24 * Math.sin(Math.PI * sw) + 6;
    glint.position.set(lerp(-2.4, 2.4, sw), 1.8, 1.2);
  }

  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'cream' }, { look: 'ink' }, { look: 'maroon' }, { look: 'cream' }];
  const poses = [
    { rx: 1.0, ry: -.3, open: .87, s: 1.15 }, { rx: .5, ry: -.75, open: 0, s: 1.2 }, { rx: 1.25, ry: 0, open: .87, s: 1.3 },
    { rx: .6, ry: -.55, open: .5, s: 1.15 }, { rx: .9, ry: .5, open: .87, s: 1.15 }, { rx: .35, ry: -1.1, open: .3, s: 1.2 },
  ];
  function still(k) {
    const q = poses[k];
    rig.scale.setScalar(q.s);
    // an open drawer comes towards the camera: lift and push the box back so all of it stays in frame
    group.position.set(0, -.25 + .55 * q.open * Math.sin(q.rx), -.6 * q.open);
    group.rotation.set(q.rx, q.ry, 0);
    drawer.position.z = D * q.open; sleeve.position.z = 0;
    glint.intensity = 18; glint.position.set(-1.2, 1.8, 1.6);
  }

  return { update, stills, still };
}
