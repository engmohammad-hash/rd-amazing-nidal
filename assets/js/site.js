/* The new site's behaviour: the theme switch, the menu, the header shadow and back-to-top button, the section the
   reader is in, the hero film, things rising into view, and the gallery lightbox. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, T = window.__T || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rtl = doc.dir === 'rtl';

  /* ---------- theme ---------- */
  function labelThemeButtons() {
    var dark = root.getAttribute('data-theme') === 'dark';
    doc.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', dark ? b.dataset.labelLight : b.dataset.labelDark);
    });
  }
  doc.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      labelThemeButtons();
    });
  });
  labelThemeButtons();

  /* ---------- menu ---------- */
  var hdr = doc.getElementById('hdr'), menuBtn = doc.getElementById('menu-btn'), drawer = doc.getElementById('drawer');
  function setMenu(open) {
    if (open) root.style.setProperty('--drawer-top', Math.max(0, hdr.getBoundingClientRect().bottom) + 'px');
    drawer.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    doc.body.classList.toggle('menu-open', open);
  }
  menuBtn.addEventListener('click', function () { setMenu(!drawer.classList.contains('open')); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- header shadow and back-to-top ---------- */
  var toTop = doc.getElementById('to-top'), ticking = false;
  var waFloat = doc.querySelector('.wa-float'), hero = doc.querySelector('.hero');
  function onScroll() {
    ticking = false;
    var y = scrollY, show = y > innerHeight * 1.2, end = root.scrollHeight - innerHeight;
    hdr.classList.toggle('scrolled', y > 40);
    toTop.style.setProperty('--p', end > 0 ? Math.min(1, y / end).toFixed(4) : 0);
    if (hero) waFloat.classList.toggle('away', y < hero.offsetTop + hero.offsetHeight * .6);
    if (show !== toTop.classList.contains('show')) {
      toTop.classList.toggle('show', show);
      toTop.tabIndex = show ? 0 : -1;
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  var io = 'IntersectionObserver' in window;

  /* ---------- the section the reader is in, marked in the header ---------- */
  var links = {};
  doc.querySelectorAll('.nav a[data-section]').forEach(function (a) { links[a.dataset.section] = a; });
  if (io && Object.keys(links).length) {
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (current) current.classList.remove('active');
        current = links[en.target.id] || null;
        if (current) current.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top'].concat(Object.keys(links)).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- the hero film: the wide or the tall cut, playing only while the hero is on screen ---------- */
  // The client wants the film moving for every visitor, so it plays even where the device asks for less motion or
  // less data. The page itself starts it (see home.html) and the poster drifts gently until then; here it only
  // pauses while off screen and resumes when back.
  var video = doc.querySelector('.hero-video');
  if (video) {
    var visible = true;
    var play = function () {
      if (video.preload !== 'auto') return;   // not started yet: the page starts it once its first frame is in
      if (!visible || doc.hidden) { video.pause(); return; }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (!video.paused) video.classList.add('playing');
    if (io) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; play(); }).observe(video.parentNode);
    doc.addEventListener('visibilitychange', play);
    // a phone in power-saving mode may refuse to start a film by itself; the first touch starts it
    doc.addEventListener('touchstart', play, { once: true, passive: true });
    if (video.readyState >= 2) play();
  }

  /* ---------- things rise into place as they come into view ---------- */
  var risers = doc.querySelectorAll('.rv');
  if (io && !reduce) {
    var rise = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        rise.unobserve(el);
        el.classList.add('in');
        // once settled, hand the element back to its own hover transitions
        setTimeout(function () { el.classList.remove('rv', 'in'); }, 1400);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    risers.forEach(function (el) { rise.observe(el); });
  } else {
    risers.forEach(function (el) { el.classList.remove('rv'); });
  }

  /* ---------- a warm light follows the pointer across the section cards ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    doc.querySelectorAll('.svc').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      card.addEventListener('pointerleave', function () { card.style.removeProperty('--my'); });
    });
  }

  /* ---------- the figures count up from nothing when they come into view ---------- */
  // like the film, for every visitor; never while the opening screen still covers the page
  var counters = doc.querySelectorAll('[data-countup]');
  if (io && counters.length) {
    var countUp = function (el) {
      var to = Number(el.dataset.countup), t0 = 0, dur = 1900;
      var stepFn = function (now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(stepFn);
        else el.parentNode.classList.add('done');
      };
      requestAnimationFrame(stepFn);
    };
    var whenOpen = function (fn) {
      if (!root.classList.contains('intro-on')) fn();
      else doc.addEventListener('rd:intro', fn, { once: true });
    };
    counters.forEach(function (el) { el.textContent = '0'; });
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        counter.unobserve(en.target);
        whenOpen(function () { countUp(en.target); });
      });
    }, { threshold: .6 });
    counters.forEach(function (el) { counter.observe(el); });
  }

  /* ---------- design your order: the ticket fills in as they choose, and the order goes out on WhatsApp ---------- */
  var bf = doc.getElementById('builder-form');
  if (bf) {
    var BD = JSON.parse(doc.getElementById('builder-data').textContent);
    var ticket = bf.querySelector('.ticket'), lastProduct = '';
    var put = function (k, v) { bf.querySelector('[data-b="' + k + '"]').textContent = v; };
    var checked = function (name) { return [].map.call(bf.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; }); };
    var read = function () {
      var sel = bf.elements.product, opt = sel.options[sel.selectedIndex];
      var q = checked('qty')[0] || '', other = q === 'other';
      return {
        product: sel.value ? opt.text : '', section: sel.value ? opt.getAttribute('data-section') : '', other: other,
        qty: other ? bf.elements.qty_other.value.trim() : q, finish: checked('finish'), when: checked('when')[0] || '',
        notes: bf.elements.notes.value.trim(), name: bf.elements.name.value.trim()
      };
    };
    var paint = function () {
      var s = read();
      bf.elements.qty_other.hidden = !s.other;
      ticket.classList.toggle('empty', !s.product);
      put('product', s.product || BD.empty);
      put('section', s.section);
      put('qty', s.qty || '—');
      put('finish', s.finish.length ? s.finish.join(BD.sep) : BD.none);
      put('when', s.when);
      if (s.product && s.product !== lastProduct) {
        var el = bf.querySelector('[data-b="product"]');
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
        bf.querySelector('[data-b="err"]').hidden = true;
      }
      lastProduct = s.product;
    };
    bf.addEventListener('input', paint);
    bf.addEventListener('change', paint);
    bf.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = read();
      if (!s.product) {
        bf.querySelector('[data-b="err"]').hidden = false;
        bf.elements.product.focus();
        return;
      }
      var lines = [BD.head, '',
        '▫️ ' + BD.product + ': ' + s.product,
        '▫️ ' + BD.section + ': ' + s.section,
        '▫️ ' + BD.qty + ': ' + (s.qty || '—'),
        '▫️ ' + BD.finish + ': ' + (s.finish.length ? s.finish.join(BD.sep) : BD.none),
        '▫️ ' + BD.when + ': ' + s.when];
      if (s.notes) lines.push('▫️ ' + BD.notes + ': ' + s.notes);
      if (s.name) lines.push('▫️ ' + BD.name + ': ' + s.name);
      lines.push('', BD.end);
      window.open('https://wa.me/' + bf.getAttribute('data-wa') + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    paint();
  }

  /* ---------- opening hours: today's row, and whether the shop is open now, always by the shop's own clock in Dammam ---------- */
  var hoursBox = doc.querySelector('.hours');
  if (hoursBox) {
    var HD = JSON.parse(hoursBox.querySelector('.hours-data').textContent), HT = HD.t;
    var nowBox = hoursBox.querySelector('.hours-now'), DAY_MIN = 1440;
    var toMin = function (s) { return parseInt(s.slice(0, 2), 10) * 60 + parseInt(s.slice(3), 10); };
    var timeText = function (mins) {
      var h = Math.floor(mins / 60) % 24, m = mins % 60;
      var txt = String(h % 12 || 12) + (m ? ':' + (m < 10 ? '0' : '') + m : '');
      if (HD.lang === 'ar') txt = txt.replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
      return txt + ' ' + (h >= 12 ? HT.pm : HT.am);
    };
    var shopNow = function () {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), mins: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    };
    var spansOf = function (d) { return HD.week[String((d + 7) % 7)] || []; };
    var paintHours = function () {
      var now = shopNow(), openUntil = -1;
      // a span that runs past midnight still counts from the day it began
      spansOf(now.day).forEach(function (s) {
        var a = toMin(s[0]), b = toMin(s[1]); if (b <= a) b += DAY_MIN;
        if (now.mins >= a && now.mins < b) openUntil = b;
      });
      spansOf(now.day - 1).forEach(function (s) {
        var a = toMin(s[0]), b = toMin(s[1]);
        if (b <= a && now.mins < b) openUntil = b;
      });
      var cls = 'closed', head = HT.closed_now, sub = '';
      if (openUntil >= 0) {
        var soon = openUntil - now.mins <= 60;
        cls = soon ? 'soon' : 'open'; head = HT.open_now;
        sub = (soon ? HT.closes_soon : HT.closes_at).replace('{time}', timeText(openUntil % DAY_MIN));
      } else {
        // the next opening: later today, or the next day that opens at all
        for (var n = 0; n < 8 && !sub; n++) {
          var spans = spansOf(now.day + n).map(function (s) { return toMin(s[0]); }).filter(function (a) { return n > 0 || a > now.mins; }).sort(function (x, y) { return x - y; });
          if (spans.length) sub = HT.opens_at.replace('{day}', n === 0 ? HT.today : n === 1 ? HT.tomorrow : HT.days[(now.day + n) % 7]).replace('{time}', timeText(spans[0]));
        }
      }
      nowBox.className = 'hours-now ' + cls;
      nowBox.querySelector('b').textContent = head;
      nowBox.querySelector('small').textContent = sub;
      nowBox.hidden = false;
      hoursBox.querySelectorAll('li[data-day]').forEach(function (li) { li.classList.toggle('is-today', Number(li.dataset.day) === now.day); });
    };
    paintHours();
    setInterval(paintHours, 60000);
  }

  /* ---------- lightbox for our work ---------- */
  var items = [].slice.call(doc.querySelectorAll('[data-lightbox]'));
  if (items.length) {
    var lb = doc.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', T.lightbox || '');
    lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>'
      + '<button class="lb-close" type="button">×</button><button class="lb-prev" type="button"></button><button class="lb-next" type="button"></button>';
    doc.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    var closeBtn = lb.querySelector('.lb-close'), prevBtn = lb.querySelector('.lb-prev'), nextBtn = lb.querySelector('.lb-next');
    var at = 0, opener = null;
    closeBtn.setAttribute('aria-label', T.close || '');
    prevBtn.setAttribute('aria-label', T.prev || '');
    nextBtn.setAttribute('aria-label', T.next || '');
    prevBtn.textContent = rtl ? '›' : '‹';
    nextBtn.textContent = rtl ? '‹' : '›';
    var show = function (i) {
      at = (i + items.length) % items.length;
      var a = items[at];
      img.src = a.getAttribute('href');
      img.alt = a.dataset.caption;
      cap.textContent = a.dataset.caption;
    };
    var open = function (i) {
      opener = doc.activeElement;
      show(i);
      lb.classList.add('open');
      doc.body.classList.add('menu-open');
      closeBtn.focus();
    };
    var close = function () {
      lb.classList.remove('open');
      doc.body.classList.remove('menu-open');
      if (opener) opener.focus();
    };
    items.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(at - 1); });
    nextBtn.addEventListener('click', function () { show(at + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(at + (rtl ? 1 : -1));
      else if (e.key === 'ArrowRight') show(at + (rtl ? -1 : 1));
    });
  }
})();
