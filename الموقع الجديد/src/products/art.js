/* Print artwork drawn on canvas for the product pictures: covers, letterheads, invoices, certificates, menus,
   flyers and the like, all in the shop's own colours and name. Each returns a canvas. */
import { cnv, grainOn, starPattern, contain, rand, C, NAME, FONT } from './stage.js';

export function art(S) {
  const { text, lines, logoIn, drawLogo, paper, logo } = S;
  const PHONE = '053 584 3085', IG = '@printingsticker2022';

  // a logo and the name, side by side, as on a letterhead
  function header(g, W, y, { ink = C.maroon, accent = C.gold, size = 1 } = {}) {
    drawLogo(g, logoIn(ink), W - W * .1, y, W * .1 * size);
    text(g, NAME, W - W * .17, y - W * .012 * size, { size: W * .036 * size, color: ink, align: 'right', weight: 700 });
    text(g, 'طباعة شاملة · الدمام', W - W * .17, y + W * .03 * size, { size: W * .018 * size, color: ink, align: 'right', weight: 400, font: FONT.body, alpha: .7 });
    g.fillStyle = accent; g.fillRect(W * .06, y + W * .08 * size, W * .88, Math.max(2, W * .003));
  }
  function footer(g, W, H, { ink = C.maroon, accent = C.gold } = {}) {
    g.fillStyle = accent; g.fillRect(W * .06, H - W * .1, W * .88, Math.max(2, W * .002));
    text(g, `${PHONE}   ·   ${IG}   ·   الدمام، المملكة العربية السعودية`, W / 2, H - W * .065, { size: W * .017, color: ink, font: FONT.body, weight: 400, alpha: .75 });
  }

  return {
    letterhead(W = 1240, H = 1754) {
      const c = paper(W, H, '#FDFBF7', '#F6F0E6', 5), g = c.getContext('2d');
      header(g, W, W * .1);
      text(g, 'التاريخ: ١٤٤٨/٠٤/١٥', W * .94, W * .3, { size: W * .02, color: C.maroon, align: 'right', font: FONT.body, weight: 400, alpha: .8 });
      text(g, 'السادة / شركة النخبة للتجارة       المحترمين', W * .94, W * .37, { size: W * .024, color: C.maroon, align: 'right', weight: 600 });
      lines(g, W * .06, W * .44, W * .88, 9, { gap: W * .034, h: W * .008 });
      lines(g, W * .06, W * .8, W * .88, 6, { gap: W * .034, h: W * .008 });
      text(g, 'مع خالص التحية،', W * .94, W * 1.07, { size: W * .022, color: C.maroon, align: 'right', weight: 500 });
      g.globalAlpha = .9; drawLogo(g, logoIn('rgba(75,1,41,.06)'), W / 2, H * .55, W * .62); g.globalAlpha = 1;
      footer(g, W, H);
      return c;
    },
    envelope(W = 1100, H = 520, { bg = C.maroon, ink = C.beigeLight } = {}) {
      const c = paper(W, H, bg, bg, 5), g = c.getContext('2d');
      drawLogo(g, logoIn(ink), W - H * .26, H * .26, H * .3);
      text(g, NAME, W - H * .48, H * .22, { size: H * .07, color: ink, align: 'right', weight: 700 });
      text(g, 'طباعة شاملة', W - H * .48, H * .32, { size: H * .04, color: ink, align: 'right', font: FONT.body, weight: 400, alpha: .75 });
      g.strokeStyle = ink; g.globalAlpha = .25; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(W * .1, H * (.6 + i * .1)); g.lineTo(W * .5, H * (.6 + i * .1)); g.stroke(); }
      g.globalAlpha = 1;
      return c;
    },
    invoice(W = 1240, H = 1754, title = 'فاتورة', { tint = '#FDFBF7', no = '0451' } = {}) {
      const c = paper(W, H, tint, tint, 5), g = c.getContext('2d');
      header(g, W, W * .09);
      g.fillStyle = C.maroon; g.beginPath(); g.roundRect(W * .38, W * .21, W * .24, W * .07, W * .012); g.fill();
      text(g, title, W / 2, W * .245, { size: W * .036, color: C.beigeLight, weight: 700 });
      text(g, 'No. ' + no, W * .08, W * .245, { size: W * .03, color: '#B0182F', align: 'left', dir: 'ltr', weight: 700, font: FONT.body });
      text(g, 'التاريخ: ....../....../......', W * .92, W * .245, { size: W * .02, color: C.maroon, align: 'right', font: FONT.body, weight: 400 });
      text(g, 'السيد / ...........................................................', W * .92, W * .33, { size: W * .022, color: C.maroon, align: 'right', font: FONT.body, weight: 400 });
      // the table: head row in maroon, ruled rows
      const x0 = W * .06, x1 = W * .94, y0 = W * .39, rh = W * .052, rows = 12, cols = [.12, .52, .14, .22];
      g.fillStyle = C.maroon; g.fillRect(x0, y0, x1 - x0, rh);
      const heads = ['م', 'البيان', 'الكمية', 'المبلغ'];
      let cx = x1;
      cols.forEach((f, i) => { const w = (x1 - x0) * f; text(g, heads[i], cx - w / 2, y0 + rh / 2, { size: W * .02, color: C.beigeLight, weight: 600 }); cx -= w; });
      g.strokeStyle = 'rgba(75,1,41,.35)'; g.lineWidth = 2;
      for (let r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(x0, y0 + rh * (r + 1)); g.lineTo(x1, y0 + rh * (r + 1)); g.stroke(); }
      cx = x1;
      cols.forEach(f => { g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y0 + rh * (rows + 1)); g.stroke(); cx -= (x1 - x0) * f; });
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + rh * (rows + 1)); g.stroke();
      const yt = y0 + rh * (rows + 1.6);
      text(g, 'الإجمالي', W * .3, yt, { size: W * .022, color: C.maroon, weight: 700 });
      g.strokeRect(x0, yt - rh / 2, W * .2, rh);
      text(g, 'التوقيع: ....................', W * .92, yt + W * .1, { size: W * .02, color: C.maroon, align: 'right', font: FONT.body, weight: 400 });
      text(g, 'الختم', W * .2, yt + W * .1, { size: W * .02, color: C.maroon, font: FONT.body, weight: 400, alpha: .7 });
      footer(g, W, H);
      return c;
    },
    voucher(W = 1600, H = 900, title = 'سند صرف', { tint = '#FDFBF7', no = '1287', amount = '٥٬٠٠٠' } = {}) {
      const c = paper(W, H, tint, tint, 5), g = c.getContext('2d');
      g.strokeStyle = C.maroon; g.lineWidth = 4; g.strokeRect(W * .03, W * .03, W * .94, H - W * .06);
      drawLogo(g, logoIn(C.maroon), W * .9, H * .17, H * .17);
      text(g, NAME, W * .82, H * .14, { size: H * .045, color: C.maroon, align: 'right', weight: 700 });
      text(g, 'طباعة شاملة · الدمام', W * .82, H * .21, { size: H * .03, color: C.maroon, align: 'right', font: FONT.body, weight: 400, alpha: .7 });
      g.fillStyle = C.maroon; g.beginPath(); g.roundRect(W * .4, H * .1, W * .2, H * .12, H * .03); g.fill();
      text(g, title, W / 2, H * .16, { size: H * .06, color: C.beigeLight, weight: 700 });
      text(g, 'No. ' + no, W * .08, H * .16, { size: H * .055, color: '#B0182F', align: 'left', dir: 'ltr', weight: 700, font: FONT.body });
      g.strokeStyle = C.maroon; g.lineWidth = 3; g.strokeRect(W * .08, H * .27, W * .2, H * .1);
      text(g, amount + ' ريال', W * .18, H * .32, { size: H * .045, color: C.maroon, weight: 700 });
      const rows = title.includes('قبض')
        ? ['استلمنا من السيد / ..................................................................', 'مبلغاً وقدره / ......................................................................', 'وذلك عن / ...........................................................................']
        : ['يصرف للسيد / ........................................................................', 'مبلغاً وقدره / ......................................................................', 'وذلك مقابل / ........................................................................'];
      rows.forEach((r, i) => text(g, r, W * .92, H * (.47 + i * .12), { size: H * .038, color: C.maroon, align: 'right', font: FONT.body, weight: 400 }));
      ['المستلم', 'المحاسب', 'المدير'].forEach((r, i) => text(g, r + ' ..................', W * (.82 - i * .32), H * .86, { size: H * .034, color: C.maroon, font: FONT.body, weight: 400 }));
      return c;
    },
    certificate(W = 1754, H = 1240, { bg = '#FBF6EC', ink = C.maroon, gold = '#B8914F', title = 'شهادة شكر وتقدير' } = {}) {
      const c = paper(W, H, bg, '#F2E8D6', 6), g = c.getContext('2d');
      g.strokeStyle = gold; g.lineWidth = W * .008; g.strokeRect(W * .035, W * .035, W * .93, H - W * .07);
      g.lineWidth = W * .002; g.strokeRect(W * .05, W * .05, W * .9, H - W * .1);
      g.globalAlpha = .12; g.strokeStyle = gold; starPattern(g, W, H * .16, W * .06, 2); g.globalAlpha = 1;
      for (const [x, y] of [[.07, .1], [.93, .1], [.07, .9], [.93, .9]]) { g.save(); g.translate(W * x, H * y); g.rotate(Math.PI / 4); g.fillStyle = gold; g.fillRect(-W * .012, -W * .012, W * .024, W * .024); g.restore(); }
      drawLogo(g, logoIn(ink), W / 2, H * .2, H * .15);
      text(g, title, W / 2, H * .38, { size: H * .1, color: ink, font: FONT.script, weight: 700 });
      text(g, 'تتقدم إدارة المدرسة بخالص الشكر والتقدير إلى', W / 2, H * .5, { size: H * .034, color: ink, font: FONT.body, weight: 400 });
      text(g, 'الطالبة المتميزة / سارة عبدالله', W / 2, H * .6, { size: H * .055, color: gold, weight: 700 });
      text(g, 'تقديراً لتفوقها وتميزها، متمنين لها دوام النجاح والتوفيق', W / 2, H * .69, { size: H * .03, color: ink, font: FONT.body, weight: 400, alpha: .85 });
      ['مديرة المدرسة', 'رائدة النشاط'].forEach((r, i) => {
        const x = W * (i ? .22 : .78);
        text(g, r, x, H * .8, { size: H * .03, color: ink, weight: 600 });
        g.fillStyle = 'rgba(75,1,41,.35)'; g.fillRect(x - W * .08, H * .86, W * .16, 2);
      });
      g.fillStyle = gold; g.beginPath(); g.arc(W / 2, H * .83, H * .065, 0, Math.PI * 2); g.fill();
      g.fillStyle = bg; g.beginPath(); g.arc(W / 2, H * .83, H * .052, 0, Math.PI * 2); g.fill();
      drawLogo(g, logoIn(gold), W / 2, H * .83, H * .07);
      return c;
    },
    // a book or catalogue cover: deep ground, lattice, a gold title block
    cover(W, H, { bg = C.maroon, bg2 = C.maroonDeep, ink = C.goldBright, title = 'كتالوج المنتجات', sub = '٢٠٢٦', script = false, logoAt = .3, pattern = .1, band } = {}) {
      const c = paper(W, H, bg, bg2, 5), g = c.getContext('2d');
      if (pattern) { g.globalAlpha = pattern; g.strokeStyle = ink; starPattern(g, W, H, Math.round(W / 4.5), Math.max(2, W / 500)); g.globalAlpha = 1; }
      if (band) { g.fillStyle = band; g.fillRect(0, H * .62, W, H * .2); }
      drawLogo(g, logoIn(ink), W / 2, H * logoAt, W * .34);
      text(g, title, W / 2, H * (logoAt + .25), { size: W * (script ? .11 : .085), color: band ? C.maroon : ink, font: script ? FONT.script : FONT.head, weight: 700 });
      if (sub) text(g, sub, W / 2, H * (logoAt + .34), { size: W * .045, color: band ? C.maroon : ink, font: FONT.body, weight: 400, alpha: .85 });
      text(g, NAME, W / 2, H * .93, { size: W * .04, color: ink, weight: 500, alpha: .8 });
      return c;
    },
    // a page of a catalogue or brochure: a picture block and text
    page(W, H, { title = 'منتجاتنا', bg = '#FDFBF7', block = C.maroon, n = 2, seed = 0 } = {}) {
      const c = paper(W, H, bg, bg, 4), g = c.getContext('2d');
      text(g, title, W * .9, H * .08, { size: W * .07, color: C.maroon, align: 'right', weight: 700 });
      g.fillStyle = C.gold; g.fillRect(W * .55, H * .12, W * .35, 3);
      for (let i = 0; i < n; i++) {
        const y = H * (.17 + i * .41);
        const gr = g.createLinearGradient(0, y, W, y + H * .22);
        gr.addColorStop(0, i % 2 ? '#7A1B47' : block); gr.addColorStop(1, i % 2 ? C.maroonDeep : '#2A0016');
        g.fillStyle = gr; g.beginPath(); g.roundRect(W * .1, y, W * .8, H * .22, W * .025); g.fill();
        drawLogo(g, logoIn('rgba(234,220,194,.85)'), W / 2, y + H * .11, H * .12);
        lines(g, W * .1, y + H * .25, W * .8, 4, { gap: H * .026, h: H * .007 });
      }
      return c;
    },
    flyer(W = 1240, H = 1754, { bg = C.maroon, bg2 = C.maroonDeep, ink = C.beigeLight, accent = C.goldBright, onAccent = C.maroon, head = 'افتتاح', big = 'خصم ٢٥٪', sub = 'على جميع الطلبات طوال أسبوع الافتتاح' } = {}) {
      const c = paper(W, H, bg, bg2, 5), g = c.getContext('2d');
      g.globalAlpha = .1; g.strokeStyle = ink; starPattern(g, W, H, W / 5, 3); g.globalAlpha = 1;
      drawLogo(g, logoIn(ink), W / 2, H * .12, W * .16);
      text(g, head, W / 2, H * .3, { size: W * .2, color: accent, font: FONT.script, weight: 700 });
      g.fillStyle = accent; g.beginPath(); g.arc(W / 2, H * .53, W * .25, 0, Math.PI * 2); g.fill();
      const words = big.split(' '), top = words.length > 2 ? words.slice(0, 2).join(' ') : words[0], rest = words.slice(top.split(' ').length).join(' ');
      text(g, top, W / 2, H * .49, { size: W * (words.length > 2 ? .075 : .09), color: onAccent, weight: 700 });
      text(g, rest, W / 2, H * .57, { size: W * (rest.length > 6 ? .075 : .11), color: onAccent, weight: 800 });
      text(g, sub, W / 2, H * .74, { size: W * .042, color: ink, weight: 500 });
      g.fillStyle = 'rgba(234,220,194,.18)'; g.fillRect(0, H * .86, W, H * .14);
      text(g, NAME + '   ·   ' + PHONE, W / 2, H * .93, { size: W * .036, color: ink, weight: 500 });
      return c;
    },
    menu(W = 1240, H = 1754, { bg = '#FBF6EC', ink = C.maroon, title = 'قائمة المشروبات', items } = {}) {
      const c = paper(W, H, bg, '#F1E6D2', 5), g = c.getContext('2d');
      g.strokeStyle = C.gold; g.lineWidth = 4; g.strokeRect(W * .05, W * .05, W * .9, H - W * .1);
      drawLogo(g, logoIn(ink), W / 2, H * .1, W * .14);
      text(g, title, W / 2, H * .2, { size: W * .085, color: ink, font: FONT.script, weight: 700 });
      const list = items || [['قهوة عربية', '١٢'], ['لاتيه', '١٨'], ['كابتشينو', '١٧'], ['موكا', '١٩'], ['شاي كرك', '١٠'], ['آيس لاتيه', '٢٠'], ['ماتشا', '٢٢'], ['كيكة التمر', '١٦'], ['تشيز كيك', '٢٤']];
      list.forEach(([n, p], i) => {
        const y = H * (.3 + i * .068);
        text(g, n, W * .86, y, { size: W * .042, color: ink, align: 'right', weight: 600 });
        text(g, p, W * .14, y, { size: W * .042, color: C.gold, align: 'left', weight: 700 });
        g.save(); g.setLineDash([3, 10]); g.strokeStyle = 'rgba(75,1,41,.35)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(W * .2, y + 6); g.lineTo(W * .86 - n.length * W * .028, y + 6); g.stroke(); g.restore();
      });
      return c;
    },
    // a sheet of the logo repeated, for tissue, butter paper and wrapping
    pattern(W, H, { bg = '#FBF8F2', ink = 'rgba(75,1,41,.5)', cell = 220, word = true, rotate = -.35 } = {}) {
      const c = paper(W, H, bg, bg, 4), g = c.getContext('2d'), mark = logoIn(ink);
      g.save(); g.translate(W / 2, H / 2); g.rotate(rotate);
      for (let y = -H; y < H; y += cell) for (let x = -W, k = 0; x < W; x += cell, k++) {
        const ox = (Math.round(y / cell) % 2) * cell / 2;
        if (word && k % 2) text(g, 'روعة التصاميم', x + ox, y, { size: cell * .14, color: ink, font: FONT.script, weight: 700 });
        else drawLogo(g, mark, x + ox, y, cell * .36);
      }
      g.restore();
      return c;
    },
  };
}
