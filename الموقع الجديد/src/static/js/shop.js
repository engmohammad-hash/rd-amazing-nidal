/* The store, on every page: favourites, quick view, the cart, and sending the order to WhatsApp.
   The cart and favourites are kept in this browser as product ids and chosen options, so they show in whichever
   language the visitor is reading. On the shop page this also filters, searches and sorts the products. */
(function () {
  'use strict';
  var doc = document, dataEl = doc.getElementById('shop-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent), T = D.t, lang = doc.documentElement.lang;
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var byId = {};
  D.products.forEach(function (p) { byId[p.id] = p; });

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var fill = function (s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return k in o ? o[k] : m; }); };
  var svg = function (body, w) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>'; };
  var ICON = {
    trash: svg('<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.5h9.2L17.5 7M10 10.5v6M14 10.5v6"/>'),
    heart: svg('<path d="M12 20.2s-7.7-4.6-7.7-10.3A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.7 2.7c0 5.7-7.7 10.3-7.7 10.3z"/>'),
    bag: svg('<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>', 1.8),
  };

  /* ---------- what the visitor keeps ---------- */
  function load(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key)); return v || fallback; } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  // a cart line is {id, opts: [the chosen value's index for each choice], qty}
  var cart = (Array.isArray(load('rd-cart', [])) ? load('rd-cart', []) : []).filter(function (l) {
    var p = byId[l && l.id];
    return p && Array.isArray(l.opts) && l.opts.length === p.choices.length && l.qty >= p.min;
  });
  var favs = (Array.isArray(load('rd-favs', [])) ? load('rd-favs', []) : []).filter(function (id) { return byId[id]; });

  function addToCart(id, opts, qty) {
    var p = byId[id];
    var line = { id: id, opts: opts || p.choices.map(function () { return 0; }), qty: qty || p.min };
    var same = cart.filter(function (l) { return l.id === line.id && l.opts.join() === line.opts.join(); })[0];
    if (same) same.qty += line.qty; else cart.push(line);
    save('rd-cart', cart);
    render();
    toast(same ? T.updated : T.added, true);
  }
  function toggleFav(id) {
    var i = favs.indexOf(id), on = i < 0;
    if (on) favs.push(id); else favs.splice(i, 1);
    save('rd-favs', favs);
    render();
    toast(on ? T.fav_added : T.fav_removed);
  }
  function setQty(i, qty) {
    var l = cart[i], p = byId[l.id];
    qty = Math.max(p.min, Math.round((Number(qty) || p.min) / p.step) * p.step);
    l.qty = qty;
    save('rd-cart', cart);
    render();
  }
  var optsText = function (p, opts) {
    return p.choices.map(function (c, k) { return c.name + ': ' + c.values[opts[k]]; }).join(' · ');
  };

  /* ---------- drawing the counts, the cart and the favourites ---------- */
  function emptyState(icon, text) {
    return '<div class="panel-empty"><span class="panel-empty-icon">' + icon + '</span><p>' + esc(text) + '</p>'
      + '<a class="btn btn-line" href="' + esc(D.shop) + '">' + esc(T.go_shop) + '</a></div>';
  }
  function render() {
    var counts = { cart: cart.length, favs: favs.length };
    Object.keys(counts).forEach(function (k) {
      doc.querySelectorAll('[data-count="' + k + '"]').forEach(function (el) { el.textContent = counts[k]; el.hidden = !counts[k]; });
      doc.querySelectorAll('[data-count-text="' + k + '"]').forEach(function (el) { el.textContent = counts[k] ? fill(T.count, { n: counts[k] }) : ''; });
    });
    doc.querySelectorAll('[data-fav]').forEach(function (b) {
      var on = favs.indexOf(b.dataset.fav) >= 0, name = byId[b.dataset.fav].name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? T.fav_remove : T.fav_add) + ': ' + name);
    });

    var list = $('[data-list="cart"]'), foot = $('[data-foot="cart"]');
    foot.hidden = !cart.length;
    list.innerHTML = cart.length ? cart.map(function (l, i) {
      var p = byId[l.id];
      return '<div class="line"><img src="' + esc(p.thumb[0]) + '" alt="" width="96" height="72" loading="lazy">'
        + '<div class="line-info"><b>' + esc(p.name) + '</b><small>' + esc(optsText(p, l.opts)) + '</small>'
        + '<div class="line-qty"><div class="stepper sm"><button type="button" data-line-step="-1" data-i="' + i + '" aria-label="' + esc(T.dec) + '">−</button>'
        + '<input type="number" inputmode="numeric" min="' + p.min + '" step="' + p.step + '" value="' + l.qty + '" data-line-qty data-i="' + i + '" aria-label="' + esc(T.qty) + '">'
        + '<button type="button" data-line-step="1" data-i="' + i + '" aria-label="' + esc(T.inc) + '">+</button></div><small>' + esc(p.unit) + '</small></div></div>'
        + '<button class="icon-btn line-remove" type="button" data-line-remove data-i="' + i + '" aria-label="' + esc(T.remove + ': ' + p.name) + '">' + ICON.trash + '</button></div>';
    }).join('') : emptyState(ICON.bag, T.cart_empty);

    $('[data-list="favs"]').innerHTML = favs.length ? favs.map(function (id) {
      var p = byId[id];
      return '<div class="line"><img src="' + esc(p.thumb[0]) + '" alt="" width="96" height="72" loading="lazy">'
        + '<div class="line-info"><b>' + esc(p.name) + '</b><small>' + esc(D.cats[p.cat]) + '</small>'
        + '<div class="line-actions"><button class="line-btn" type="button" data-qv="' + esc(id) + '">' + ICON.plus + esc(T.add) + '</button></div></div>'
        + '<button class="icon-btn line-remove on" type="button" data-fav="' + esc(id) + '" aria-label="' + esc(T.fav_remove + ': ' + p.name) + '">' + ICON.heart + '</button></div>';
    }).join('') : emptyState(ICON.heart, T.favs_empty);

    if (current) syncQuickFav();
  }

  /* ---------- panels, quick view and the scrim behind them ---------- */
  var scrim = $('#scrim'), qv = $('#qv'), layers = { cart: $('#panel-cart'), favs: $('#panel-favs') };
  var openEl = null, opener = null;
  function openLayer(el) {
    if (openEl === el) return;
    if (openEl) closeLayer(true);
    var drawer = $('#drawer');
    if (drawer && drawer.classList.contains('open')) $('#menu-btn').click();
    opener = doc.activeElement;
    openEl = el;
    el.inert = false;
    el.classList.add('open');
    scrim.classList.add('open');
    doc.body.classList.add('menu-open');
    setTimeout(function () { var f = $('[data-close]', el); if (f) f.focus(); }, 60);
  }
  function closeLayer(quiet) {
    if (!openEl) return;
    var el = openEl;
    openEl = null;
    el.classList.remove('open');
    el.inert = true;
    scrim.classList.remove('open');
    doc.body.classList.remove('menu-open');
    if (el === qv) {
      current = null;
      if (onShop && /[?&]p=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    }
    if (!quiet && opener && opener.focus) opener.focus();
  }
  addEventListener('keydown', function (e) {
    if (!openEl) return;
    if (e.key === 'Escape') { closeLayer(); return; }
    if (e.key !== 'Tab') return;
    // keep the keyboard inside the open panel
    var f = [].filter.call(openEl.querySelectorAll('a[href], button, input, select, textarea'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  var current = null, qvForm = $('#qv-form'), qvMain = $('.qv-main img', qv), qvThumbs = $('.qv-thumbs', qv);
  var qvQty = $('input[name="qty"]', qvForm), qvFav = $('.qv-fav', qv);
  var productUrl = function (id) { return new URL(D.shop + '?p=' + encodeURIComponent(id), location.href).href; };
  function syncQuickFav() {
    var on = favs.indexOf(current.id) >= 0;
    qvFav.classList.toggle('on', on);
    qvFav.setAttribute('aria-pressed', String(on));
    qvFav.setAttribute('aria-label', on ? T.fav_remove : T.fav_add);
  }
  function showImage(i) {
    qvMain.src = current.img[i];
    qvThumbs.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
  }
  function openQuick(id) {
    var p = byId[id];
    if (!p) return;
    current = p;
    $('.qv-cat', qv).textContent = D.cats[p.cat];
    $('#qv-name').textContent = p.name;
    $('.qv-short', qv).textContent = p.short;
    qvMain.alt = p.name;
    qvThumbs.innerHTML = p.thumb.map(function (src, i) {
      return '<button type="button" data-img="' + i + '" aria-label="' + (i + 1) + ' / ' + p.thumb.length + '"><img src="' + esc(src) + '" alt="" width="120" height="90"></button>';
    }).join('');
    showImage(0);
    $('.qv-choices', qv).innerHTML = p.choices.map(function (c, k) {
      return '<fieldset class="qv-choice"><legend>' + esc(c.name) + '</legend><div class="pills">' + c.values.map(function (v, j) {
        return '<label class="pill"><input type="radio" name="c' + k + '" value="' + j + '"' + (j ? '' : ' checked') + '><span>' + esc(v) + '</span></label>';
      }).join('') + '</div></fieldset>';
    }).join('');
    qvQty.min = p.min;
    qvQty.step = p.step;
    qvQty.value = p.min;
    $('.qv-min', qv).textContent = fill(T.min, { min: p.min, unit: p.unit });
    $('.qv-ask', qv).href = 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(fill(T.msg_ask, { name: p.name }) + '\n' + productUrl(id));
    syncQuickFav();
    if (onShop) history.replaceState(null, '', '?p=' + encodeURIComponent(id) + location.hash);
    openLayer(qv);
  }
  qv.addEventListener('click', function (e) { if (e.target === qv) closeLayer(); });   // the dim space around the box
  qvThumbs.addEventListener('click', function (e) { var b = e.target.closest('[data-img]'); if (b) showImage(+b.dataset.img); });
  qvForm.addEventListener('click', function (e) {
    var b = e.target.closest('[data-step]');
    if (!b) return;
    var q = Number(qvQty.value) || current.min;
    qvQty.value = Math.max(current.min, q + Number(b.dataset.step) * current.step);
  });
  qvForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var opts = current.choices.map(function (c, k) { var r = $('input[name="c' + k + '"]:checked', qvForm); return r ? +r.value : 0; });
    var qty = Math.max(current.min, Math.round((Number(qvQty.value) || current.min) / current.step) * current.step);
    var id = current.id;
    closeLayer(true);
    addToCart(id, opts, qty);
  });
  qvFav.addEventListener('click', function () { toggleFav(current.id); });
  $('.qv-share', qv).addEventListener('click', function () {
    var url = productUrl(current.id);
    if (navigator.share) { navigator.share({ title: current.name, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast(T.copied); }, function () {});
  });

  /* ---------- the little notice at the bottom ---------- */
  var toastEl = $('#toast'), toastTimer = 0;
  function toast(text, withCart) {
    $('.toast-text', toastEl).textContent = text;
    $('.toast-action', toastEl).hidden = !withCart;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3400);
  }

  /* ---------- every click the store answers ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open], [data-close], [data-add], [data-fav], [data-qv], [data-clear], [data-line-step], [data-line-remove], #scrim');
    if (!t) return;
    if (t === scrim || t.hasAttribute('data-close')) closeLayer();
    else if (t.hasAttribute('data-open')) { e.preventDefault(); toastEl.classList.remove('show'); openLayer(layers[t.dataset.open]); }
    else if (t.hasAttribute('data-add')) addToCart(t.dataset.add);
    else if (t.hasAttribute('data-fav')) toggleFav(t.dataset.fav);
    else if (t.hasAttribute('data-qv')) { e.preventDefault(); openQuick(t.dataset.qv); }
    else if (t.hasAttribute('data-clear')) { cart = []; save('rd-cart', cart); render(); toast(T.cleared); }
    else if (t.hasAttribute('data-line-step')) { var l = cart[+t.dataset.i]; setQty(+t.dataset.i, l.qty + Number(t.dataset.lineStep) * byId[l.id].step); }
    else if (t.hasAttribute('data-line-remove')) { cart.splice(+t.dataset.i, 1); save('rd-cart', cart); render(); }
  });
  doc.addEventListener('change', function (e) { if (e.target.matches('[data-line-qty]')) setQty(+e.target.dataset.i, e.target.value); });

  /* ---------- the order goes to WhatsApp as a message the shop can read at a glance ---------- */
  var form = $('#order-form'), kept = load('rd-order', {});
  ['name', 'delivery', 'notes'].forEach(function (k) { if (kept[k] && form.elements[k]) form.elements[k].value = kept[k]; });
  form.addEventListener('input', function () {
    save('rd-order', { name: form.elements.name.value, delivery: form.elements.delivery.value, notes: form.elements.notes.value });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cart.length) return;
    var out = [T.msg_head, ''];
    cart.forEach(function (l, i) {
      var p = byId[l.id];
      out.push((i + 1) + ') ' + p.name);
      out.push('   ' + optsText(p, l.opts));
      out.push('   ' + T.msg_qty + ': ' + l.qty + ' ' + p.unit);
      out.push('');
    });
    var f = form.elements;
    if (f.name.value.trim()) out.push(T.msg_name + ': ' + f.name.value.trim());
    out.push(T.msg_delivery + ': ' + f.delivery.value);
    if (f.notes.value.trim()) out.push(T.msg_notes + ': ' + f.notes.value.trim());
    window.open('https://wa.me/' + D.wa + '?text=' + encodeURIComponent(out.join('\n')), '_blank', 'noopener');
  });

  /* ---------- the shop page: categories, search and order ---------- */
  var grid = doc.getElementById('p-grid'), onShop = !!grid;
  if (onShop) {
    var cards = [].slice.call(grid.children), search = $('#shop-search'), sort = $('#shop-sort');
    var countEl = $('#shop-count'), emptyEl = $('#shop-empty'), cat = 'all';
    // Arabic search forgives the usual spelling variants: hamza forms, taa marbuta, alif maqsura, short vowels
    var norm = function (s) {
      return s.toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    };
    cards.forEach(function (c) { c.dataset.text = norm(c.textContent); });
    var apply = function () {
      var q = norm(search.value.trim()), shown = 0;
      cards.forEach(function (c) {
        var ok = (cat === 'all' || c.dataset.cat === cat) && (!q || c.dataset.text.indexOf(q) >= 0);
        c.hidden = !ok;
        if (ok) shown++;
      });
      countEl.textContent = fill(countEl.dataset.template, { n: shown });
      emptyEl.hidden = shown > 0;
    };
    doc.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        cat = chip.dataset.cat;
        doc.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
        apply();
      });
    });
    search.addEventListener('input', apply);
    sort.addEventListener('change', function () {
      cards.sort(sort.value === 'name'
        ? function (a, b) { return a.dataset.name.localeCompare(b.dataset.name, lang); }
        : function (a, b) { return a.dataset.order - b.dataset.order; });
      cards.forEach(function (c) { grid.appendChild(c); });
    });
    var asked = new URLSearchParams(location.search).get('p');
    if (asked && byId[asked]) openQuick(asked);
  }

  render();
})();
