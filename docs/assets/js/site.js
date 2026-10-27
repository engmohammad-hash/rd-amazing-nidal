/* مطابع روعة التصاميم — page behaviour: the scroll film, header, menu, gallery lightbox, opening hours, quote form.
   The film is the 3D story pre-rendered to frames (src/render.html); no 3D runs in the visitor's browser. */
(function () {
  var doc = document.documentElement, body = document.body;
  var ROOT = body.getAttribute('data-root') || '';
  var hdr = document.getElementById('hdr');
  var hero = document.querySelector('[data-hero]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = window.__story = { p: 0, target: 0, t: 0, reduce: reduce };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- menu ---------- */
  var menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.drawer a').forEach(function (a) { a.addEventListener('click', function () { body.classList.remove('menu-open'); }); });
  }

  /* ---------- the story: scroll progress, copy, dots, cue ---------- */
  var story = document.getElementById('story');
  var film = document.getElementById('film');
  var cue = document.getElementById('cue');
  var dotsEl = document.getElementById('dots');
  var dots = dotsEl ? Array.prototype.slice.call(dotsEl.querySelectorAll('button')) : [];
  var copies = Array.prototype.slice.call(document.querySelectorAll('[data-copy]')).map(function (el) {
    return { el: el, a: +el.dataset.a, b: +el.dataset.b, k: -1 };
  });
  function smooth(x) { return x * x * (3 - 2 * x); }
  function windowAmt(p, a, b, f) { return smooth(clamp((p - a) / f, 0, 1)) * smooth(clamp((b - p) / f, 0, 1)); }
  function travel() { return Math.max(1, story.offsetHeight - window.innerHeight); }
  var dotStarts = story ? (story.dataset.starts || '').split(',').map(Number) : [];
  var dotEnds = dotStarts.slice(1).map(function (v, i) { return (v + dotStarts[i]) / 2 + .02; });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () {
      window.scrollTo({ top: story.offsetTop + travel() * dotStarts[i], behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- the film ----------
     Two layers of the same frames. The small layer is four sheets of tiles (sheet n holds frames n, n+4, n+8 ...),
     fetched first: the first ~100 KB already moves the whole story, so the picture never waits on the network.
     The sharp layer is one JPEG per frame, fetched around the reader and decoded off the main thread, each
     replacing its tile once ready. Measured on a 2011 laptop over a slow VPN (tools/bench.js): the picture never
     trails the scroll by more than a frame, with no long tasks. */
  var FRAMES = 0, BASE = '', set = '';
  var SIZES = { desktop: [1600, 900], mobile: [810, 1620] };
  var TILES = { desktop: [288, 162], mobile: [162, 324] }, COLS = 10, SHEETS = 4, SHEET_ORDER = [0, 2, 1, 3];
  var BEHIND = 10, AHEAD = 22, DECODERS = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 1)), FETCHERS = 12;
  var sheets = [], sheetRequested = [], sharp = [], sharpQueue = [], fetching = 0, fetched = 0, arrived = 0;
  var decoded = new Map(), decoding = new Set(), drawnKey = '', dir = 1, lastC = 0, fctx = null;

  function pad(i) { return ('00' + i).slice(-3); }
  function current() { return Math.round(S.p * (FRAMES - 1)); }
  function coarseToFine() {
    var order = [], seen = new Uint8Array(FRAMES);
    [32, 16, 8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < FRAMES; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); } });
    return order;
  }
  function chooseSet() {
    var next = window.innerWidth / window.innerHeight < 0.85 ? 'mobile' : 'desktop';
    if (next === set) return;
    set = next;
    decoded.forEach(function (b) { if (b.close) b.close(); });
    sheets.forEach(function (b) { if (b && b.close) b.close(); });
    decoded = new Map(); decoding = new Set(); sheets = new Array(SHEETS); sheetRequested = new Array(SHEETS);
    sharp = new Array(FRAMES); sharpQueue = coarseToFine();
    fetching = 0; fetched = 0; arrived = 0; drawnKey = '';
    film.width = SIZES[set][0]; film.height = SIZES[set][1];
    pump();
  }
  function toBitmap(blob) {
    if (window.createImageBitmap) return createImageBitmap(blob);
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); (im.decode ? im.decode() : Promise.resolve()).then(function () { resolve(im); }, function () { resolve(im); }); };
      im.onerror = function () { URL.revokeObjectURL(url); reject(); };
      im.src = url;
    });
  }
  function get(url, onBlob, priority) {
    var forSet = set;
    fetching++;
    fetch(url, { priority: priority || 'auto' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (blob) { if (forSet === set) onBlob(blob); }, function () {})
      .then(function () { if (forSet === set) { fetching--; pump(); } });
  }
  function loadSheet(n) {
    var forSet = set;
    sheetRequested[n] = true;
    get(BASE + set + '-small-' + n + '.jpg', function (blob) {
      toBitmap(blob).then(function (bmp) {
        if (forSet !== set) { if (bmp.close) bmp.close(); return; }
        sheets[n] = bmp; arrived++; S.filmSmall = (S.filmSmall || 0) + Math.ceil(FRAMES / SHEETS);
        body.classList.remove('no-film');
      });
    }, 'high');
  }
  function loadSharp(i) {
    sharp[i] = null;
    get(BASE + set + '/' + pad(i) + '.jpg', function (blob) {
      sharp[i] = blob; fetched++; arrived++; S.filmFetched = fetched;
      body.classList.remove('no-film');
    });
  }
  function pump() {
    if (!FRAMES) return;
    var c = current(), d, i;
    for (d = 0; d <= 2 && fetching < FETCHERS; d++) { i = c + d * dir; if (i >= 0 && i < FRAMES && sharp[i] === undefined) loadSharp(i); }
    SHEET_ORDER.forEach(function (n) { if (!sheetRequested[n]) loadSheet(n); });
    // on a slow line the sheets must not share it with sharp frames: wait until all have landed
    for (i = 0; i < SHEETS; i++) if (!sheets[i]) { decodeAround(c); return; }
    for (d = 0; d <= AHEAD && fetching < FETCHERS; d++) {
      var a = c + d * dir, b = c - d * dir;
      if (a >= 0 && a < FRAMES && sharp[a] === undefined) loadSharp(a);
      if (d <= BEHIND && b >= 0 && b < FRAMES && sharp[b] === undefined && fetching < FETCHERS) loadSharp(b);
    }
    while (fetching < FETCHERS && sharpQueue.length) { i = sharpQueue.shift(); if (sharp[i] === undefined) loadSharp(i); }
    decodeAround(c);
  }
  function decodeAround(c) {
    var lo = c - (dir > 0 ? BEHIND : AHEAD), hi = c + (dir > 0 ? AHEAD : BEHIND);
    decoded.forEach(function (b, i) { if (i < lo - 4 || i > hi + 4) { if (b.close) b.close(); decoded.delete(i); } });
    for (var k = 0; k <= AHEAD && decoding.size < DECODERS; k++) {
      [c + k * dir, c - k * dir].forEach(function (i) {
        if (decoding.size >= DECODERS || i < lo || i > hi || decoded.has(i) || decoding.has(i) || !sharp[i]) return;
        var forSet = set;
        decoding.add(i);
        toBitmap(sharp[i]).then(function (bmp) {
          decoding.delete(i);
          if (forSet !== set) { if (bmp.close) bmp.close(); return; }
          decoded.set(i, bmp);
        }, function () { decoding.delete(i); });
      });
    }
  }
  function sourceFor(i) {
    if (i < 0 || i >= FRAMES) return null;
    var bmp = decoded.get(i);
    if (bmp) return { key: i + 's', bmp: bmp, sharp: true };
    var sheet = sheets[i % SHEETS];
    if (!sheet) return null;
    var t = TILES[set], k = Math.floor(i / SHEETS);
    return { key: i + 't', bmp: sheet, sharp: false, sx: (k % COLS) * t[0], sy: Math.floor(k / COLS) * t[1], sw: t[0], sh: t[1] };
  }
  function drawFilm() {
    var c = current(), src = null, gap;
    if (c !== lastC) { dir = c > lastC ? 1 : -1; lastC = c; }
    for (gap = 0; gap <= AHEAD; gap++) { src = sourceFor(c - gap) || sourceFor(c + gap); if (src) break; }
    S.filmGap = src ? gap : FRAMES;
    if (!src) return;
    S.filmSharp = src.sharp;
    if (src.key === drawnKey) return;
    if (src.sharp) fctx.drawImage(src.bmp, 0, 0, film.width, film.height);
    else fctx.drawImage(src.bmp, src.sx, src.sy, src.sw, src.sh, 0, 0, film.width, film.height);
    drawnKey = src.key; S.filmShown = (S.filmShown || 0) + 1;
    if (!film.classList.contains('ready')) film.classList.add('ready');
  }
  function startFilm() {
    FRAMES = +story.dataset.frames; BASE = ROOT + 'frames/' + story.dataset.scene + '/';
    fctx = film.getContext('2d', { alpha: false });
    fctx.imageSmoothingQuality = 'high';
    chooseSet();
    window.addEventListener('resize', chooseSet);
    S.filmSet = set;
    setTimeout(function () { if (!arrived) body.classList.add('no-film'); }, 10000);
  }
  if (story && film) {
    if (location.hash === '#bench') {
      // the speed test loads before the film so it does not queue behind the frame requests
      var bench = document.createElement('script');
      bench.src = ROOT + 'assets/js/bench.js';
      bench.onload = bench.onerror = startFilm;
      body.appendChild(bench);
    } else startFilm();
  }

  /* ---------- per-frame work ---------- */
  var last = performance.now(), activeDot = -1, lastCue = '', lastDots = '';
  function tick(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now; S.t += dt;
    if (hero) hdr.classList.toggle('light', hero.getBoundingClientRect().bottom < 70);
    if (story) {
      var rect = story.getBoundingClientRect();
      S.target = clamp(-rect.top / travel(), 0, 1);
      S.p += (S.target - S.p) * (1 - Math.exp(-dt * (S.reduce ? 40 : 12)));
      if (Math.abs(S.target - S.p) < 1e-5) S.p = S.target;
      var p = S.p;
      copies.forEach(function (c) {
        var k = windowAmt(p, c.a, c.b, 0.022);
        if (Math.abs(k - c.k) < 0.002) return;
        c.k = k;
        c.el.style.opacity = k.toFixed(3);
        c.el.style.transform = 'translateY(' + ((1 - k) * 26).toFixed(1) + 'px)';
        c.el.style.visibility = k < 0.02 ? 'hidden' : 'visible';
      });
      if (cue) { var cueO = (1 - clamp(p / 0.03, 0, 1)).toFixed(2); if (cueO !== lastCue) { cue.style.opacity = cueO; lastCue = cueO; } }
      if (dotsEl) {
        var dotsO = p > 0.035 && p < 0.995 ? '1' : '0';
        if (dotsO !== lastDots) { dotsEl.style.opacity = dotsO; lastDots = dotsO; }
        var a = 0; dotEnds.forEach(function (e, i) { if (p >= e) a = i + 1; });
        if (a !== activeDot) { activeDot = a; dots.forEach(function (d, i) { d.classList.toggle('on', i === a); d.setAttribute('aria-current', i === a ? 'step' : 'false'); }); }
      }
      if (FRAMES && rect.bottom > 0) drawFilm();
      if (FRAMES) pump();
    }
    if (S.hud) S.hud();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- opening hours, in Saudi time ---------- */
  var statusEls = document.querySelectorAll('[data-status]');
  if (statusEls.length) {
    var openAt = 9 * 60, closeAt = 21 * 60, closedDay = 5;   // Friday
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var get_ = function (t) { return (parts.filter(function (x) { return x.type === t; })[0] || {}).value; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get_('weekday'));
    var mins = (+get_('hour')) * 60 + (+get_('minute'));
    var open = day !== closedDay && mins >= openAt && mins < closeAt;
    statusEls.forEach(function (el) { el.classList.add(open ? 'open' : 'closed'); el.textContent = open ? 'مفتوح الآن' : 'مغلق الآن'; });
    var row = document.querySelector('.hours tr[data-day="' + day + '"]');
    if (row) row.classList.add('today');
  }

  /* ---------- gallery: filters and lightbox ---------- */
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var filterBtns = document.querySelectorAll('.filters button');
    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filter;
        filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        gallery.querySelectorAll('li').forEach(function (li) { li.hidden = f !== 'all' && li.dataset.cat !== f; });
      });
    });
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'عرض الصورة');
    lb.innerHTML = '<figure style="margin:0;display:grid;justify-items:center"><img alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-close" type="button" aria-label="إغلاق">×</button><button class="lb-prev" type="button" aria-label="السابقة">›</button><button class="lb-next" type="button" aria-label="التالية">‹</button>';
    body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), items = [], at = 0, opener = null;
    function visibleItems() { return Array.prototype.slice.call(gallery.querySelectorAll('li:not([hidden]) button')); }
    function show(i) { items = visibleItems(); at = (i + items.length) % items.length; var b = items[at]; lbImg.src = b.dataset.full; lbImg.alt = b.dataset.cap || ''; lbCap.textContent = b.dataset.cap || ''; }
    function close() { lb.classList.remove('open'); if (opener) opener.focus(); }
    gallery.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      opener = b; show(visibleItems().indexOf(b)); lb.classList.add('open'); lb.querySelector('.lb-close').focus();
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(at - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(at + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(at + 1);
      if (e.key === 'ArrowRight') show(at - 1);
    });
  }

  /* ---------- quote form: compose a WhatsApp message ---------- */
  var form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), lines = ['مرحباً، أود طلب عرض سعر:'];
      [['product', 'المنتج'], ['qty', 'الكمية'], ['size', 'المقاس'], ['finish', 'التشطيب'], ['name', 'الاسم'], ['notes', 'ملاحظات']].forEach(function (k) {
        var v = (f.get(k[0]) || '').toString().trim(); if (v) lines.push(k[1] + ': ' + v);
      });
      window.open('https://wa.me/' + form.dataset.wa + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------- #debug: frame rate and film arrival ---------- */
  if (location.hash === '#debug') {
    var hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,.78);color:#fff;font:12px/1.5 Consolas,monospace;direction:ltr;text-align:left;pointer-events:none;white-space:pre';
    body.appendChild(hud);
    var hf = 0, hs = performance.now();
    S.hud = function () {
      hf++; var n = performance.now(); if (n - hs < 500) return;
      hud.textContent = 'FPS ' + Math.round(hf * 1000 / (n - hs)) + '\nsmall ' + (S.filmSmall || 0) + ' · sharp ' + fetched + '/' + FRAMES + ' (' + set + ')';
      hf = 0; hs = n;
    };
  }
})();
