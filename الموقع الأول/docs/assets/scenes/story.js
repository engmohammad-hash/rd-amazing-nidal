/* Home page: design → print → foil → deliver. A sheet is sketched and printed between rollers, a business card
   is hot-foil stamped, and the finished cards go into the gift box. */
import { cnv, grainOn, contain, edgeArt, seg, lerp, ease, easeIn, easeOut, sine, clamp, rand } from './common.js';
import { cardKit, rigidBox, lidLogo, CARD } from './kit.js';

export const frames = 200;
export const words = [['صمّم', .03, .27], ['اطبع', .27, .52], ['فخامة', .52, .77], ['استلم', .77, 9]];

export default async function build(stage) {
  const { THREE, rig, glint, mats, colorTex, logo } = stage;

  /* ---------- the sheet: paper, sketch layer, print layer ---------- */
  const PW = 1024, PH = 1448;
  const L = { border: 56, logoCY: 400, logoSize: 560, headY: 872, ruleY: 952, latinY: 1012, bandY: 1130 };
  const BW_ = 1024 - 2 * L.border, BH_ = L.bandY - L.border - 40;
  const paper = cnv(PW, PH);
  {
    const g = paper.getContext('2d');
    g.fillStyle = '#F4ECDF'; g.fillRect(0, 0, PW, PH);
    grainOn(g, PW, PH, 9);
    g.strokeStyle = 'rgba(138,122,102,.07)'; g.lineWidth = 1;
    for (let i = 0; i < 320; i++) {
      const x = rand() * PW, y = rand() * PH, l = 6 + rand() * 22, a = rand() * Math.PI;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  }
  const print = cnv(PW, PH);
  {
    const g = print.getContext('2d');
    g.drawImage(paper, 0, 0);
    g.fillStyle = '#4B0129'; g.fillRect(0, L.bandY, 1024, 1448 - L.bandY);
    g.strokeStyle = '#B99C70'; g.lineWidth = 3; g.strokeRect(L.border, L.border, BW_, BH_);
    g.lineWidth = 1.4; g.strokeRect(L.border + 12, L.border + 12, BW_ - 24, BH_ - 24);
    const d = contain(logo.color, L.logoSize);
    g.drawImage(logo.color, 512 - d.w / 2, L.logoCY - d.h / 2, d.w, d.h);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.direction = 'rtl'; g.fillStyle = '#4B0129'; g.font = '700 132px "Aref Ruqaa", serif';
    g.fillText('نطبع الفخامة', 512, L.headY);
    g.strokeStyle = '#B99C70'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(312, L.ruleY); g.lineTo(496, L.ruleY); g.moveTo(528, L.ruleY); g.lineTo(712, L.ruleY); g.stroke();
    g.save(); g.translate(512, L.ruleY); g.rotate(Math.PI / 4); g.fillStyle = '#B99C70'; g.fillRect(-7, -7, 14, 14); g.restore();
    g.direction = 'rtl'; g.fillStyle = '#6B2A45'; g.font = '600 40px "IBM Plex Sans Arabic", sans-serif';
    g.fillText('مطابع روعة التصاميم', 512, L.latinY);
    g.fillStyle = '#E4D2B2'; g.font = '500 44px "IBM Plex Sans Arabic", sans-serif';
    g.fillText('كروت · علب · دعوات · أكياس', 512, L.bandY + 150);
    g.globalAlpha = .7; g.font = '400 28px "IBM Plex Sans Arabic", sans-serif';
    g.fillText('الدمام · المملكة العربية السعودية', 512, L.bandY + 215); g.globalAlpha = 1;
  }
  const edge = edgeArt(logo.beige, L.logoSize, [75, 1, 41]);
  const edgeD = contain(logo.beige, L.logoSize);

  function drawSketch(g, t) {
    if (t <= 0) return;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const ink = 'rgba(122,98,82,';
    let k = seg(t, 0, .2);
    if (k > 0) {
      g.setLineDash([]); g.strokeStyle = ink + '.6)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(954, 26); g.lineTo(954 - 884 * k, 26); g.moveTo(26, 70); g.lineTo(26, 70 + 1308 * k); g.stroke();
      if (k > .6) {
        g.globalAlpha = seg(k, .6, 1);
        g.font = '500 22px "IBM Plex Sans Arabic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl';
        g.fillStyle = '#F4ECDF'; g.fillRect(452, 12, 120, 28); g.fillStyle = ink + '.95)'; g.fillText('٢١٠ مم', 512, 27);
        g.save(); g.translate(26, 724); g.rotate(-Math.PI / 2);
        g.fillStyle = '#F4ECDF'; g.fillRect(-60, -14, 120, 28); g.fillStyle = ink + '.95)'; g.fillText('٢٩٧ مم', 0, 1);
        g.restore(); g.globalAlpha = 1;
      }
    }
    k = seg(t, .05, .3);
    if (k > 0) {
      const per = 2 * (BW_ + BH_);
      g.strokeStyle = ink + '.65)'; g.lineWidth = 2; g.setLineDash([per * k, per + 20]);
      g.beginPath(); g.moveTo(L.border + BW_, L.border); g.lineTo(L.border, L.border); g.lineTo(L.border, L.border + BH_);
      g.lineTo(L.border + BW_, L.border + BH_); g.closePath(); g.stroke(); g.setLineDash([]);
    }
    k = seg(t, .12, .38);
    if (k > 0) {
      g.setLineDash([8, 10]); g.strokeStyle = 'rgba(150,126,104,' + (.42 * k) + ')'; g.lineWidth = 1.4;
      const span = 1024 - 2 * L.border;
      g.beginPath();
      g.moveTo(512, L.border); g.lineTo(512, L.border + (1448 - 2 * L.border) * k);
      g.moveTo(1024 - L.border, L.logoCY); g.lineTo(1024 - L.border - span * k, L.logoCY);
      g.moveTo(1024 - L.border, L.headY - 38); g.lineTo(1024 - L.border - span * k, L.headY - 38);
      g.stroke(); g.setLineDash([]);
    }
    k = seg(t, .2, .5);
    if (k > 0) {
      g.strokeStyle = 'rgba(150,126,104,.55)'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(512, L.logoCY, 304, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
    }
    k = seg(t, .3, .72);
    if (k > 0) {
      g.save(); g.beginPath(); g.moveTo(512, L.logoCY);
      g.arc(512, L.logoCY, 420, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.closePath(); g.clip();
      g.drawImage(edge, 512 - edgeD.w / 2, L.logoCY - edgeD.h / 2, edgeD.w, edgeD.h);
      g.restore();
    }
    k = seg(t, .58, .84);
    if (k > 0) {
      g.save(); g.beginPath(); g.rect(1024 - 1024 * k, 0, 1024 * k, 1448); g.clip();
      g.font = '700 132px "Aref Ruqaa", serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.direction = 'rtl';
      g.strokeStyle = 'rgba(75,1,41,.75)'; g.lineWidth = 1.6; g.strokeText('نطبع الفخامة', 512, L.headY);
      g.restore();
    }
    k = seg(t, .74, 1);
    if (k > 0) {
      g.strokeStyle = ink + '.6)'; g.lineWidth = 2; g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(1024, L.bandY); g.lineTo(1024 - 1024 * k, L.bandY); g.stroke(); g.setLineDash([]);
      g.globalAlpha = k; g.strokeStyle = 'rgba(185,156,112,.9)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(512 - 200 * k, L.ruleY); g.lineTo(512 + 200 * k, L.ruleY); g.stroke();
      g.font = '500 20px "IBM Plex Sans Arabic", sans-serif'; g.fillStyle = ink + '.9)'; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.direction = 'rtl';
      g.fillText('هامش القص ٣ مم', 1024 - 70, L.bandY - 14);
      g.globalAlpha = 1;
    }
  }
  const sheetCanvas = cnv(PW, PH), sheetCtx = sheetCanvas.getContext('2d');
  const sheetTex = colorTex(sheetCanvas), printTex = colorTex(print);
  function drawSheet(sk) {
    sheetCtx.drawImage(paper, 0, 0); drawSketch(sheetCtx, sk);
    sheetTex.needsUpdate = true;
  }
  const printFrac = { value: 0 };
  const sheetFace = new THREE.MeshStandardMaterial({ map: sheetTex, roughness: .86 });
  sheetFace.onBeforeCompile = sh => {
    sh.uniforms.printMap = { value: printTex };
    sh.uniforms.printFrac = printFrac;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D printMap;\nuniform float printFrac;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 sketchColor = texture2D( map, vMapUv );
          vec4 printedColor = texture2D( printMap, vMapUv );
          float edgeD = printFrac - vMapUv.y;
          float inked = smoothstep( 0.0, 0.003, edgeD );
          vec4 sheetColor = mix( sketchColor, printedColor, inked );
          float wet = inked * ( 1.0 - smoothstep( 0.0, 0.03, edgeD ) ) * step( printFrac, 0.999 );
          sheetColor.rgb *= 1.0 - 0.22 * wet;
          diffuseColor *= sheetColor;
        #endif`);
  };
  const SW = 1.8, SH = SW * Math.SQRT2;
  const paperSide = new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: .9 });
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, .006), [paperSide, paperSide, paperSide, paperSide, sheetFace, paperSide]);

  /* ---------- the press ---------- */
  const R = .26, RL = 2.5;
  const rollerTexC = cnv(1024, 64);
  {
    const g = rollerTexC.getContext('2d');
    g.fillStyle = '#5C0A34'; g.fillRect(0, 0, 1024, 64);
    for (let i = 0; i < 28; i++) { g.fillStyle = 'rgba(230,205,170,' + (i % 4 === 0 ? .16 : .06) + ')'; g.fillRect(i * 1024 / 28, 0, 3, 64); }
  }
  const rollerTex = colorTex(rollerTexC); rollerTex.wrapS = THREE.RepeatWrapping;
  const rollerGeo = new THREE.CylinderGeometry(R, R, RL, 96, 1, false); rollerGeo.rotateZ(Math.PI / 2);
  const shaftGeo = new THREE.CylinderGeometry(.07, .07, RL + .7, 32); shaftGeo.rotateZ(Math.PI / 2);
  const rollers = new THREE.Group();
  const rFront = new THREE.Mesh(rollerGeo, new THREE.MeshPhysicalMaterial({ map: rollerTex, roughness: .3, metalness: .1, clearcoat: 1, clearcoatRoughness: .14 }));
  rFront.position.z = R + .006;
  const rBack = new THREE.Mesh(rollerGeo, mats.steel); rBack.position.z = -(R + .006);
  rFront.add(new THREE.Mesh(shaftGeo, mats.brass)); rBack.add(new THREE.Mesh(shaftGeo, mats.brass));
  rollers.add(rFront, rBack);
  for (const sx of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.45, 1.25), mats.frame);
    plate.position.set(sx * (RL / 2 + .25), 0, 0); rollers.add(plate);
    for (const z of [R + .006, -(R + .006)]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .03, 40), mats.brass);
      bolt.rotation.z = Math.PI / 2; bolt.position.set(sx * (RL / 2 + .315), 0, z); rollers.add(bolt);
    }
  }
  const press = new THREE.Group(); press.add(sheet, rollers); rig.add(press);

  /* ---------- cards and the foil die ---------- */
  const cards = cardKit(stage);
  const foilLive = cards.foilMaterial('maroon', { opacity: 0 });
  const stack = new THREE.Group(); rig.add(stack);
  const STACK = 7;
  for (let i = 0; i < STACK - 1; i++) {
    const c = cards.make('maroon', null);
    c.clear();   // the cards under the top one are not stamped yet
    c.position.set((rand() - .5) * .03, (rand() - .5) * .03, i * CARD.step);
    c.rotation.z = (rand() - .5) * .035; stack.add(c);
  }
  const topZ = (STACK - 1) * CARD.step;
  const topCard = cards.make('maroon', foilLive); stack.add(topCard);
  const dieMat = new THREE.MeshStandardMaterial({ color: 0xc9a97c, metalness: 1, roughness: .3, emissive: 0x000000 });
  const die = new THREE.Group();
  die.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, .82, .26), dieMat));
  { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 1.8, 32), mats.steel); rod.rotation.x = Math.PI / 2; rod.position.z = .13 + .9; die.add(rod); }
  { const col = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .12, 48), mats.brass); col.rotation.x = Math.PI / 2; col.position.z = .19; die.add(col); }
  stack.add(die);
  const contactZ = topZ + CARD.t / 2 + .13 + .002;

  /* ---------- the gift box ---------- */
  const box = rigidBox(stage, { lidArt: lidLogo(stage) });
  rig.add(box.group);
  const boxCards = new THREE.Group(); boxCards.rotation.x = -Math.PI / 2; box.group.add(boxCards);
  for (let i = 0; i < 5; i++) {
    const c = cards.make('maroon');
    c.position.set((rand() - .5) * .025, (rand() - .5) * .025, i * CARD.step);
    c.rotation.z = (rand() - .5) * .03; boxCards.add(c);
  }

  let lastSk = -1;
  const topY = SH / 2 + .1, endY = -SH / 2 - .34;

  function update(p) {
    const t = p * 30, bob = Math.sin(t * .9), bob2 = Math.sin(t * .63 + 1.3);
    const s1 = seg(p, .05, .24), t12 = seg(p, .24, .30), s2 = seg(p, .30, .47);
    const t23a = seg(p, .47, .505), t23b = seg(p, .51, .56), s3 = seg(p, .56, .74);
    const t34 = seg(p, .74, .79), s4 = seg(p, .79, .97);

    let rs = 1;
    rs = lerp(rs, .8, ease(t12)); rs = lerp(rs, 1, ease(t23a)); rs = lerp(rs, 1.12, ease(t23b)); rs = lerp(rs, .96, ease(t34));
    rig.scale.setScalar(rs * stage.frame.s);

    let ry = lerp(-.5, -.22, ease(s1)); ry = lerp(ry, -.36, ease(t12)); ry = lerp(ry, -.16, ease(t23a));
    let rx = lerp(.02, .05, s1); rx = lerp(rx, .2, ease(t12)); rx = lerp(rx, .03, ease(t23a));
    press.rotation.set(rx, ry, 0);

    let sy = bob * .05;
    sy = lerp(sy, topY, ease(t12));
    if (p >= .30) sy = lerp(topY, endY, sine(s2));
    if (p >= .47) sy = lerp(endY, 0, ease(t23a));
    const fly = easeIn(t23b);
    sheet.position.set(9 * fly, sy + 2.4 * fly, -3 * fly);
    sheet.rotation.set(lerp(-.08 + bob2 * .03, 0, ease(t12)) - .3 * fly, lerp(0, .2, ease(t23a)) + 1.3 * fly, lerp(.035, 0, ease(t12)) - .35 * fly);
    sheet.visible = p < .56;
    printFrac.value = p >= .47 ? 1 : p > .30 ? clamp((SH / 2 - sy) / SH) : 0;
    const sk = p >= .24 ? 1 : s1;
    if (sheet.visible && sk !== lastSk) { drawSheet(sk); lastSk = sk; }

    rollers.position.y = lerp(-4.6, 0, easeOut(seg(t12, .25, 1))) + 4.8 * easeIn(t23a);
    rollers.visible = p > .245 && p < .51;
    const spin = (topY - sy) / R + t * .12;
    rFront.rotation.x = -spin; rBack.rotation.x = spin;

    stack.visible = p > .505 && p < .79;
    stack.position.set(0, lerp(-5.4, -.12, easeOut(t23b)) + 6.5 * easeIn(t34), 0);
    stack.rotation.set(-.92, lerp(.55, .3, ease(s3)), .1);
    const dDown = ease(seg(s3, 0, .3)), dUp = easeIn(seg(s3, .42, .6));
    die.position.z = lerp(topZ + 3.4, contactZ, dDown) + 3.6 * dUp;
    die.visible = s3 > 0 && dUp < 1;
    const heat = seg(s3, .27, .33) * (1 - seg(s3, .36, .5));
    dieMat.emissive.setRGB(.6 * heat, .24 * heat, .08 * heat);
    foilLive.opacity = ease(seg(s3, .32, .42));
    const lift = ease(seg(s3, .5, .8));
    topCard.position.z = topZ + lift * 1.05;
    topCard.rotation.set(lift * .86, lerp(-.3, .26, ease(seg(s3, .68, 1))) * lift, -.1 * lift);

    box.group.visible = p > .745;
    box.group.position.set(0, lerp(-5.2, -.5, easeOut(seg(p, .755, .83))) + bob * .05 * seg(s4, .75, 1), 0);
    box.group.rotation.set(lerp(.62, .5, ease(s4)), lerp(-.78, -.32, ease(s4)), 0);
    const cDown = ease(seg(s4, .02, .42));
    boxCards.position.y = lerp(3.6, box.dims.wall + CARD.t / 2, cDown);
    boxCards.visible = cDown > 0;
    const lidDown = ease(seg(s4, .42, .78));
    box.lid.position.y = lerp(4.2, box.closedY, lidDown);
    box.lid.rotation.set(0, lerp(.25, 0, lidDown), lerp(-.18, 0, lidDown));
    box.lid.visible = lidDown > 0;

    let gi = 0, gx = 0, gy = .6, gz = 1.7;
    if (p > .55 && p < .79) {
      const flash = seg(s3, .3, .36) * (1 - seg(s3, .38, .5)), sw = seg(s3, .62, 1);
      gi = 34 * flash + 24 * Math.sin(Math.PI * sw); gx = lerp(-2.3, 2.3, sw);
    } else if (p >= .79) {
      const sw = seg(s4, .74, .98);
      gi = 26 * Math.sin(Math.PI * sw); gx = lerp(-2.5, 2.5, sw); gy = 1.7; gz = 1.3;
    }
    glint.intensity = gi; glint.position.set(gx, gy, gz);
  }

  return { update };
}
