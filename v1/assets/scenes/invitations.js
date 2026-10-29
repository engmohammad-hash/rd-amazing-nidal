/* Wedding invitations: a cream envelope sealed with maroon wax opens its flap, and the invitation slides out
   with its calligraphy in foil. */
import { cnv, grainOn, maskFrom, starPattern, normalFrom, whiteMask, seg, lerp, ease, easeOut, easeIn, rand } from './common.js';

export const frames = 120;
export const words = [['دعوة', -1, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, foil, colorTex, dataTex, logo } = stage;
  const EW = 2.3, EH = 1.6, CWd = 2.0, CHt = 1.38;

  /* ---------- the invitation card: printed text in maroon, headline and names in foil ---------- */
  const PX = 2048, PY = Math.round(PX * CHt / CWd);
  const lines = g => {
    g.textAlign = 'center'; g.direction = 'rtl';
    return {
      small(txt, y, size = 52) { g.font = `500 ${size}px "IBM Plex Sans Arabic", sans-serif`; g.fillText(txt, PX / 2, y); },
      callig(txt, y, size) { g.font = `700 ${size}px "Aref Ruqaa", serif`; g.fillText(txt, PX / 2, y); },
    };
  };
  const cardFace = cnv(PX, PY);
  {
    const g = cardFace.getContext('2d');
    const gr = g.createLinearGradient(0, 0, PX, PY); gr.addColorStop(0, '#FBF6EE'); gr.addColorStop(1, '#EFE4D2');
    g.fillStyle = gr; g.fillRect(0, 0, PX, PY); grainOn(g, PX, PY, 7);
    g.strokeStyle = '#7A3550'; g.lineWidth = 3; g.strokeRect(70, 70, PX - 140, PY - 140); g.lineWidth = 1.5; g.strokeRect(92, 92, PX - 184, PY - 184);
    g.fillStyle = '#5A1A35';
    const L = lines(g);
    L.small('بكل الحب والسرور نتشرف بدعوتكم لحضور', 330);
    L.small('الخميس ١٥ رجب ١٤٤٨ هـ  ·  الساعة الثامنة مساءً', PY - 330, 46);
    L.small('قاعة الأفراح  ·  الدمام', PY - 250, 46);
  }
  const cardFoilMask = maskFrom(PX, PY, g => {
    const L = lines(g);
    L.callig('حفل زفاف', 610, 230);
    L.callig('سارة  و  محمد', 860, 130);
    g.lineWidth = 4; g.beginPath(); g.moveTo(PX / 2 - 260, 960); g.lineTo(PX / 2 + 260, 960); g.stroke();
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(PX / 2 + sx * 300, 960, 14, 0, Math.PI * 2); g.fill(); }
  });
  const cardMat = new THREE.MeshStandardMaterial({ map: colorTex(cardFace), roughness: .85 });
  const cardEdge = new THREE.MeshStandardMaterial({ color: 0xf1e7d6, roughness: .9 });
  const card = new THREE.Group();
  card.add(new THREE.Mesh(new THREE.BoxGeometry(CWd, CHt, .03), [cardEdge, cardEdge, cardEdge, cardEdge, cardMat, cardEdge]));
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(CWd, CHt), foil(cardFoilMask, { opacity: 1 })); f.position.z = .0165; card.add(f); }

  /* ---------- the envelope: cream outside, maroon star lining inside the flap ---------- */
  const envTex = cnv(1024, 712);
  { const g = envTex.getContext('2d'); g.fillStyle = '#F2E8D8'; g.fillRect(0, 0, 1024, 712); grainOn(g, 1024, 712, 8); }
  const liningTex = cnv(1024, 1024);
  { const g = liningTex.getContext('2d'); g.fillStyle = '#4B0129'; g.fillRect(0, 0, 1024, 1024); g.strokeStyle = 'rgba(214,193,160,.45)'; starPattern(g, 1024, 1024, 128, 3); }
  const envMat = new THREE.MeshStandardMaterial({ map: colorTex(envTex), roughness: .88 });
  const envelope = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(EW, EH, .03), envMat); envelope.add(body);
  // the flap: a triangle hinged on the top edge, outside cream, inside lined
  const tri = new THREE.Shape(); tri.moveTo(-EW / 2, 0); tri.lineTo(EW / 2, 0); tri.lineTo(0, -EH * .62); tri.closePath();
  const flapGeo = new THREE.ShapeGeometry(tri);
  { const uv = flapGeo.attributes.uv, pos = flapGeo.attributes.position; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + EW / 2) / EW, (pos.getY(i) + EH) / EH); }
  const hinge = new THREE.Group(); hinge.position.set(0, EH / 2, .018); envelope.add(hinge);
  const flapOut = new THREE.Mesh(flapGeo, envMat); hinge.add(flapOut);
  const flapIn = new THREE.Mesh(flapGeo, new THREE.MeshStandardMaterial({ map: colorTex(liningTex), roughness: .8, side: THREE.BackSide })); hinge.add(flapIn);
  // wax seal at the tip of the flap, embossed with the logo
  const sealMask = whiteMask(logo.beige, 512, 512, 330);
  const sealGeo = new THREE.CylinderGeometry(.26, .27, .06, 48, 1);
  { const pos = sealGeo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z); if (r > .2) { const k = 1 + (rand() - .5) * .12; pos.setX(i, x * k); pos.setZ(i, z * k); } } sealGeo.computeVertexNormals(); }
  const waxMat = new THREE.MeshPhysicalMaterial({ color: 0x3a0318, roughness: .38, clearcoat: .6, clearcoatRoughness: .3 });
  const seal = new THREE.Mesh(sealGeo, waxMat); seal.rotation.x = Math.PI / 2; seal.position.set(0, -EH * .58, .04); hinge.add(seal);
  const sealFace = new THREE.Mesh(new THREE.CircleGeometry(.22, 48), new THREE.MeshPhysicalMaterial({ color: 0x46061f, roughness: .4, clearcoat: .6, normalMap: dataTex(normalFrom(sealMask, 6)), normalScale: new THREE.Vector2(1.4, 1.4) }));
  sealFace.position.set(0, -EH * .58, .072); hinge.add(sealFace);

  const all = new THREE.Group(); rig.add(all); all.add(envelope, card);
  const extraCard = card.clone(); rig.add(extraCard);

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .8) * .04;
    const s1 = seg(p, .02, .32), s2 = seg(p, .34, .62), s3 = seg(p, .64, .96);
    rig.scale.setScalar(stage.frame.s * lerp(1.05, 1, ease(s3)));
    all.position.set(0, bob, 0);
    all.rotation.set(lerp(-.3, -.12, ease(s1)), lerp(-.8, -.25, ease(s1)) + lerp(0, .1, ease(s2)), lerp(.12, .03, ease(s1)));
    hinge.rotation.x = Math.PI * .96 * easeOut(seg(s2, 0, .8));
    // the card rises out of the envelope, then turns to face us while the envelope sinks away
    const rise = easeOut(seg(s2, .45, 1)), turn = ease(s3);
    card.position.set(0, lerp(-.1, .95, rise) + lerp(0, -.75, turn), lerp(-.04, -.04, rise) + lerp(0, .9, turn));
    card.rotation.set(lerp(0, .08, turn), lerp(0, .22, turn), 0);
    card.visible = s2 > .4;
    envelope.position.set(0, lerp(0, -1.9, ease(seg(s3, .15, 1))), lerp(0, -.6, turn));
    envelope.rotation.x = lerp(0, -.6, ease(seg(s3, .15, 1)));
    extraCard.visible = false;
    const sw = (seg(p, .12, .32) + seg(p, .74, .98)) % 1.0001;
    glint.intensity = 28 * Math.sin(Math.PI * sw) + 5;
    glint.position.set(lerp(-2.4, 2.4, sw), .6, 1.8);
  }

  const stills = [{ look: 'cream' }, { look: 'maroon' }, { look: 'ink' }, { look: 'cream' }, { look: 'maroon' }, { look: 'cream' }];
  function still(k) {
    rig.scale.setScalar(1.15);
    all.position.set(0, 0, 0); all.rotation.set(0, 0, 0);
    envelope.visible = card.visible = true; extraCard.visible = false;
    envelope.position.set(0, 0, 0); envelope.rotation.set(0, 0, 0);
    hinge.rotation.x = 0;
    glint.intensity = 22; glint.position.set(-1, 1.2, 2);
    if (k === 0) {        // flat lay: open envelope with the card resting on it
      hinge.rotation.x = Math.PI * .96;
      all.rotation.set(-.55, -.2, .08);
      card.position.set(.35, -.2, .12); card.rotation.set(0, 0, -.12);
    } else if (k === 1) { // sealed envelope
      card.visible = false; all.rotation.set(-.25, -.45, .1);
    } else if (k === 2) { // the card alone, close
      envelope.visible = false; rig.scale.setScalar(1.55);
      card.position.set(0, 0, 0); card.rotation.set(-.15, -.35, .04); glint.position.set(.5, .8, 1.6); glint.intensity = 30;
    } else if (k === 3) { // card standing behind the envelope
      hinge.rotation.x = Math.PI * .96;
      envelope.position.set(0, -.55, .4); envelope.rotation.set(-.35, 0, 0);
      card.position.set(0, .45, -.2); card.rotation.set(0, -.15, 0); all.rotation.set(0, -.35, 0);
    } else if (k === 4) { // the wax seal close up
      card.visible = false; rig.scale.setScalar(2.6); all.position.set(0, .95, 0); all.rotation.set(-.35, -.3, 0); glint.position.set(.3, .5, 1.4);
    } else {              // two cards fanned
      envelope.visible = false; extraCard.visible = true;
      card.position.set(.3, -.1, .05); card.rotation.set(-.2, -.25, -.08);
      extraCard.position.set(-.35, .15, -.1); extraCard.rotation.set(-.2, -.25, .12); extraCard.scale.setScalar(1);
    }
  }

  return { update, stills, still };
}
