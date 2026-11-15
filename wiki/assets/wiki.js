// Godsworn Wiki client: search, sortable/filterable tables, table of contents,
// theme toggle, spoiler reveal, random page. No dependencies.
(function () {
  'use strict';
  var root = document.body.dataset.root || '';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  // Theme
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('wiki-theme', next);
  });

  // Mobile nav
  var navBtn = document.querySelector('.nav-toggle');
  if (navBtn) navBtn.addEventListener('click', function () { document.body.classList.toggle('nav-open'); });

  // Spoilers: one click reveals; remembered per page.
  var main = document.querySelector('.content.is-spoiler');
  var spoilKey = 'wiki-spoil:' + location.pathname;
  if (main && store.get(spoilKey)) main.classList.add('revealed');
  var reveal = document.querySelector('.spoiler-reveal');
  if (reveal && main) reveal.addEventListener('click', function () { main.classList.add('revealed'); store.set(spoilKey, '1'); });

  // Table of contents from h2s (pages with 3+ sections).
  var body = document.querySelector('.page-body');
  var heads = body ? body.querySelectorAll('h2[id]') : [];
  if (heads.length >= 3) {
    var toc = document.createElement('div');
    toc.className = 'toc';
    var html = '<div class="toc-title">Contents</div><ol>';
    heads.forEach(function (h) { html += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>'; });
    toc.innerHTML = html + '</ol>';
    var first = body.querySelector('h2');
    first.parentNode.insertBefore(toc, first);
  }

  // Sortable tables
  document.querySelectorAll('table.sortable').forEach(function (table) {
    var ths = table.tHead ? table.tHead.rows[0].cells : [];
    Array.prototype.forEach.call(ths, function (th, col) {
      th.addEventListener('click', function () {
        var asc = th.getAttribute('aria-sort') !== 'ascending';
        Array.prototype.forEach.call(ths, function (o) { o.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
        var tbody = table.tBodies[0];
        var rows = Array.prototype.slice.call(tbody.rows);
        var val = function (r) {
          var c = r.cells[col];
          if (!c) return '';
          var v = c.dataset.sort !== undefined ? c.dataset.sort : c.textContent.trim();
          var n = parseFloat(v);
          return v !== '' && !isNaN(n) && /^-?[\d.]+/.test(v) ? n : v.toLowerCase();
        };
        rows.sort(function (a, b) {
          var x = val(a), y = val(b);
          var r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
          return asc ? r : -r;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });
  });

  // Table filters
  document.querySelectorAll('.table-filter').forEach(function (input) {
    var wrap = input.nextElementSibling;
    var table = wrap && wrap.querySelector('table');
    if (!table) return;
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      Array.prototype.forEach.call(table.tBodies[0].rows, function (r) {
        r.hidden = q !== '' && r.textContent.toLowerCase().indexOf(q) < 0;
      });
    });
  });

  // Search (index loaded on first focus)
  var input = document.getElementById('search');
  var list = document.getElementById('search-results');
  var index = null;
  var active = -1;
  function load() {
    if (index) return Promise.resolve(index);
    return fetch(root + 'search-index.json').then(function (r) { return r.json(); }).then(function (d) { index = d; return d; });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function score(e, q, words) {
    var t = e.t.toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    var hay = t + ' ' + (e.k || '').toLowerCase();
    for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) {
      if ((e.s || '').toLowerCase().indexOf(words[i]) < 0) return 0;
      return 10;
    }
    return t.indexOf(q) >= 0 ? 60 : 40;
  }
  function run() {
    var q = input.value.toLowerCase().trim();
    if (!q || !index) { list.hidden = true; return; }
    var words = q.split(/\s+/);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], q, words);
      if (s) hits.push([s - index[i].t.length / 100, index[i]]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    hits = hits.slice(0, 15);
    active = hits.length ? 0 : -1;
    list.innerHTML = hits.length
      ? hits.map(function (h, i) {
          var e = h[1];
          return '<li' + (i === 0 ? ' class="active"' : '') + '><a href="' + root + e.p + '"><span class="r-title">' + esc(e.t) + '</span>' +
            (e.c ? '<span class="r-cat">' + esc(e.c) + '</span>' : '') + (e.x ? ' <span class="r-cat">spoiler</span>' : '') +
            (e.s && !e.x ? '<span class="r-sum">' + esc(e.s) + '</span>' : '') + '</a></li>';
        }).join('')
      : '<li><a>No results</a></li>';
    list.hidden = false;
  }
  if (input) {
    input.addEventListener('focus', function () { load().then(run); });
    input.addEventListener('input', function () { load().then(run); });
    input.addEventListener('keydown', function (ev) {
      var items = list.querySelectorAll('li');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!items.length) return;
        if (items[active]) items[active].classList.remove('active');
        active = (active + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[active].classList.add('active');
      } else if (ev.key === 'Enter') {
        var a = items[active] && items[active].querySelector('a[href]');
        if (a) location.href = a.href;
      } else if (ev.key === 'Escape') { list.hidden = true; input.blur(); }
    });
    document.addEventListener('click', function (ev) { if (!ev.target.closest('.search')) list.hidden = true; });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === '/' && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
        ev.preventDefault();
        input.focus();
      }
    });
  }

  // Random page
  var rnd = document.querySelector('.random-page');
  if (rnd) rnd.addEventListener('click', function (ev) {
    ev.preventDefault();
    load().then(function (d) {
      var pool = d.filter(function (e) { return !e.x; });
      location.href = root + pool[Math.floor(Math.random() * pool.length)].p;
    });
  });
})();
