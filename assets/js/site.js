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
    var y = scrollY, show = y > innerHeight * 1.2;
    hdr.classList.toggle('scrolled', y > 40);
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
  var video = doc.querySelector('.hero-video');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (video && !reduce && !saveData) {
    var tall = matchMedia('(max-aspect-ratio: 4/5)'), visible = true, wanted = '';
    var play = function () {
      if (!video.src) return;
      if (!visible || doc.hidden) { video.pause(); return; }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    // The whole film is fetched before it plays: phones often refuse to buffer a video ahead, and on a slow line a
    // film that starts early stops and starts again. Until then the poster, its first frame, is on screen.
    var pick = function () {
      var src = tall.matches ? video.dataset.tall : video.dataset.wide;
      if (src === wanted) return play();
      wanted = src;
      fetch(src).then(function (r) { return r.ok ? r.blob() : Promise.reject(r.status); }).then(function (blob) {
        if (src !== wanted) return;   // the screen turned while it was on its way
        video.classList.remove('playing');
        if (video.src) URL.revokeObjectURL(video.src);
        video.src = URL.createObjectURL(blob);
        play();
      }).catch(function () { if (src === wanted) wanted = ''; });
    };
    video.addEventListener('playing', function () { video.classList.add('playing'); });
    if (tall.addEventListener) tall.addEventListener('change', pick); else tall.addListener(pick);
    if (io) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; play(); }).observe(video.parentNode);
    doc.addEventListener('visibilitychange', play);
    // the poster is already showing; the film starts once the rest of the page has arrived
    if (doc.readyState === 'complete') pick(); else addEventListener('load', pick);
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
