/* مطابع روعة التصاميم — page behaviour: the scroll film, header, menu, gallery lightbox, opening hours, quote form.
   The film is the 3D story pre-rendered to frames (src/render.html), which plays on every device. Devices that
   prove fast enough then switch to the same scene drawn live (live.js): sharp at any screen size, and smooth
   at 120 Hz instead of stepping between frames. */
(function () {
  var doc = document.documentElement, body = document.body;
  var ROOT = body.getAttribute('data-root') || '';
  var hdr = document.getElementById('hdr');
  var hero = document.querySelector('[data-hero]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = window.__story = { p: 0, target: 0, t: 0, reduce: reduce };
  var T = window.__T || {}, rtl = doc.dir === 'rtl';   // the page's words for script-made text, from base.html
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------- light and dark theme (set before paint by base.html; this only switches and remembers it) ---------- */
  var themeBtns = document.querySelectorAll('[data-theme-toggle]');
  function labelThemeButtons() {
    var dark = doc.getAttribute('data-theme') === 'dark';
    themeBtns.forEach(function (b) { b.setAttribute('aria-label', dark ? b.dataset.labelLight : b.dataset.labelDark); });
  }
  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      labelThemeButtons();
    });
  });
  labelThemeButtons();

  /* ---------- back to top: shown once the reader is a screen down ---------- */
  var toTop = document.getElementById('to-top'), topShown = false;
  if (toTop) {
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () {
      var show = window.scrollY > window.innerHeight * 1.2;
      if (show === topShown) return;
      topShown = show;
      toTop.classList.toggle('show', show);
      toTop.tabIndex = show ? 0 : -1;
    }, { passive: true });
  }

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
     trails the scroll by more than a frame, with no long tasks.
     The sheets also time the line. On a slow one only a few sharp frames are fetched at once, the frame on screen
     first: twelve at once split ~100 KB/s twelve ways, and the frame a reader stopped on took seconds to sharpen. */
  var FRAMES = 0, BASE = '', set = '';
  var SIZES = { desktop: [1600, 900], mobile: [810, 1620] };
  var TILES = { desktop: [288, 162], mobile: [162, 324] }, COLS = 10, SHEETS = 4, SHEET_ORDER = [0, 2, 1, 3];
  var BEHIND = 10, AHEAD = 22, DECODERS = Math.max(2, Math.min(4, (navigator.hardwareConcurrency || 4) - 1)), FETCHERS = 12, sheetBytes = 0, sheetsIn = 0, sheetsFrom = 0;
  var sheets = [], sheetRequested = [], sharp = [], sharpQueue = [], fetching = 0, fetched = 0, arrived = 0;
  var decoded = new Map(), decoding = new Set(), inflight = new Map(), drawnKey = '', dir = 1, lastC = 0, movedAt = 0, fctx = null;

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
    inflight.forEach(function (ctrl) { ctrl.abort(); });
    decoded = new Map(); decoding = new Set(); inflight = new Map(); sheets = new Array(SHEETS); sheetRequested = new Array(SHEETS);
    sharp = new Array(FRAMES); sharpQueue = coarseToFine();
    fetching = 0; fetched = 0; arrived = 0; drawnKey = ''; sheetBytes = 0; sheetsIn = 0; sheetsFrom = performance.now();
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
  function get(url, onBlob, priority, ctrl, onAbort) {
    var forSet = set;
    fetching++;
    fetch(url, { priority: priority || 'auto', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(function (blob) { if (forSet === set) onBlob(blob); }, function (e) { if (forSet === set && onAbort && e && e.name === 'AbortError') onAbort(); })
      .then(function () { if (forSet === set) { fetching--; pump(); } });
  }
  function loadSheet(n) {
    var forSet = set;
    sheetRequested[n] = true;
    get(BASE + set + '-small-' + n + '.jpg', function (blob) {
      sheetBytes += blob.size;
      if (++sheetsIn === SHEETS) {
        // the last sheet: bytes per millisecond is KB/s
        var rate = sheetBytes / Math.max(1, performance.now() - sheetsFrom);
        FETCHERS = rate > 800 ? 12 : rate > 300 ? 6 : 3; S.lineKBps = Math.round(rate);
      }
      toBitmap(blob).then(function (bmp) {
        if (forSet !== set) { if (bmp.close) bmp.close(); return; }
        sheets[n] = bmp; arrived++; S.filmSmall = (S.filmSmall || 0) + Math.ceil(FRAMES / SHEETS);
        body.classList.remove('no-film');
      });
    }, 'high');
  }
  function loadSharp(i, priority) {
    sharp[i] = null;
    var ctrl = window.AbortController ? new AbortController() : null;
    if (ctrl) inflight.set(i, ctrl);
    get(BASE + set + '/' + pad(i) + '.jpg', function (blob) {
      inflight.delete(i);
      sharp[i] = blob; fetched++; arrived++; S.filmFetched = fetched;
      body.classList.remove('no-film');
    }, priority || 'low', ctrl, function () {
      inflight.delete(i); sharp[i] = undefined; sharpQueue.push(i);
    });
  }
  function pump() {
    if (!FRAMES || S.live) return;
    var c = current(), d, i;
    // the frame on screen may take one slot beyond the cap, never more: while scrolling, every tick has a new one
    if (sharp[c] === undefined && fetching <= FETCHERS) loadSharp(c, 'high');
    SHEET_ORDER.forEach(function (n) { if (!sheetRequested[n]) loadSheet(n); });
    // on a slow line the sheets must not share it with sharp frames: wait until all have landed
    for (i = 0; i < SHEETS; i++) if (!sheets[i]) { decodeAround(c); return; }
    // while the live scene is on trial, save the line: the sheets and the frame on screen are enough to show
    if (S.liveTrying) { decodeAround(c); return; }
    // a reader who has stopped on a blurry frame gets the whole line: downloads away from them are dropped
    // (and queued again), and nothing else is asked for until their frame is here
    if (!sharp[c] && performance.now() - movedAt > 300) {
      inflight.forEach(function (ctrl, k) { if (Math.abs(k - c) > 1) ctrl.abort(); });
      decodeAround(c);
      return;
    }
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
    if (c !== lastC) { dir = c > lastC ? 1 : -1; lastC = c; movedAt = performance.now(); }
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
    // for tools/bench.js: what the frame on screen is waiting for
    S.state = function () {
      var c = current(), sc = sharp[c];
      return { c: c, sharp: sc === undefined ? 'not asked' : sc === null ? 'in flight' : 'here', decoded: decoded.has(c),
        decoding: decoding.size, fetching: fetching, fetchers: FETCHERS };
    };
    setTimeout(function () { if (!arrived && !S.live) body.classList.add('no-film'); }, 10000);
    tryLive();
  }

  /* ---------- live 3D, for devices that can draw it ---------- */
  function liveCandidate() {
    var nav = navigator, why = '';
    if (reduce) why = 'reduced motion';
    else if (location.hash === '#frames' || /[?&]frames\b/.test(location.search)) why = 'asked for frames';
    else if (/[?&]live\b/.test(location.search)) S.liveForced = /[?&]live=force\b/.test(location.search);   // testing: ?live tries, ?live=force skips the speed check
    else if (nav.connection && nav.connection.saveData) why = 'data saver';
    else if (!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('importmap'))) why = 'no import maps';
    else if ((nav.hardwareConcurrency || 4) < 4) why = 'few cores';
    else if (nav.deviceMemory && nav.deviceMemory < 4) why = 'little memory';
    else {
      var c = document.createElement('canvas'), gl = c.getContext('webgl2'), r = '';
      if (!gl) why = 'no webgl2';
      else {
        var info = gl.getExtension('WEBGL_debug_renderer_info');
        r = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
        S.gpu = r;
        // software drawing, Intel graphics from before 2017, and entry-level phone GPUs keep the frames
        if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render|\bHD Graphics|GMA|Mali-(T|4|G31|G51|G52|G57)\b|Adreno \(TM\) [2-5]\d\d\b|PowerVR (SGX|Rogue GE)/i.test(r)) why = 'weak gpu';
      }
    }
    S.liveSkip = why;
    return !why;
  }
  function tryLive() {
    if (!story || !liveCandidate()) return;
    S.liveTrying = true;
    var giveUp = setTimeout(function () { S.liveTrying = false; }, 9000);   // never hold the frames back for long
    import(new URL(ROOT + 'assets/js/live.js', document.baseURI).href).then(function (m) {
      return m.start({
        stageEl: document.getElementById('stage'), storyEl: story, sceneId: story.dataset.scene, root: ROOT, S: S,
        onLive: function () {
          clearTimeout(giveUp);
          S.live = true; S.liveTrying = false;
          inflight.forEach(function (ctrl) { ctrl.abort(); });
          body.classList.remove('no-film');
          setTimeout(function () { if (S.live) body.classList.add('live-on'); }, 700);
        },
        onFail: function (why) {
          clearTimeout(giveUp);
          S.live = false; S.liveTrying = false; S.liveFail = why; drawnKey = '';
          body.classList.remove('live-on');
        },
      });
    }).catch(function (e) { clearTimeout(giveUp); S.liveTrying = false; S.liveFail = 'load: ' + (e && e.message); });
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
      if (FRAMES && !S.live && rect.bottom > 0) drawFilm();
      if (FRAMES && !S.live) pump();
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
    statusEls.forEach(function (el) { el.classList.add(open ? 'open' : 'closed'); el.textContent = open ? T.open : T.closed; });
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
    // previous sits at the reading start (right in Arabic, left in English), its arrow pointing that way
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', T.lightbox);
    lb.innerHTML = '<figure style="margin:0;display:grid;justify-items:center"><img alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-close" type="button" aria-label="' + T.close + '">×</button><button class="lb-prev" type="button" aria-label="' + T.prev + '">' + (rtl ? '›' : '‹') +
      '</button><button class="lb-next" type="button" aria-label="' + T.next + '">' + (rtl ? '‹' : '›') + '</button>';
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
      if (e.key === 'ArrowLeft') show(at + (rtl ? 1 : -1));
      if (e.key === 'ArrowRight') show(at + (rtl ? -1 : 1));
    });
  }

  /* ---------- quote form: compose a WhatsApp message ---------- */
  var form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), lines = [T.quote_intro];
      ['product', 'qty', 'size', 'finish', 'name', 'notes'].forEach(function (k) {
        var v = (f.get(k) || '').toString().trim(); if (v) lines.push(T.fields[k] + ': ' + v);
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
      hud.textContent = 'FPS ' + Math.round(hf * 1000 / (n - hs)) + '\n' + (S.live ? 'LIVE 3D · ' + S.liveMs + ' ms/frame'
        : 'frames · small ' + (S.filmSmall || 0) + ' · sharp ' + fetched + '/' + FRAMES + ' (' + set + ')' +
          (S.liveTrying ? '\ntrying live…' : S.liveSkip ? '\nno live: ' + S.liveSkip : S.liveFail ? '\nno live: ' + S.liveFail : ''));
      hf = 0; hs = n;
    };
  }
})();
