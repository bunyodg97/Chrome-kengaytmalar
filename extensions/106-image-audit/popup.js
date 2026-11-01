const { $, $$, h } = App;
let data = [];
let filter = 'issues';

// Sahifada bajariladi
function collect() {
  const dpr = window.devicePixelRatio || 1;
  const res = {};
  for (const e of performance.getEntriesByType('resource')) res[e.name] = e;
  const out = [];
  const imgs = Array.from(document.images);
  imgs.forEach((img, i) => {
    const src = img.currentSrc || img.src;
    if (!src) return;
    img.dataset.auditIdx = i;
    const r = img.getBoundingClientRect();
    const e = res[src];
    let bytes = e ? (e.encodedBodySize || e.transferSize || 0) : 0;
    let fmt = '';
    const m = src.match(/^data:image\/([a-z+]+)/i);
    if (m) { fmt = m[1]; bytes = Math.round(src.length * 0.75); }
    else {
      try {
        const p = new URL(src).pathname.toLowerCase();
        const ext = (p.match(/\.([a-z0-9]+)$/) || [])[1] || '';
        fmt = { jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', avif: 'avif', svg: 'svg' }[ext] || '';
        if (!fmt && /[?&](fm|format)=(webp|avif|jpg|png)/i.test(src)) fmt = RegExp.$2.toLowerCase();
      } catch (er) {}
    }
    const absTop = r.top + window.scrollY;
    out.push({
      idx: i, src, fmt, bytes,
      nw: img.naturalWidth, nh: img.naturalHeight,
      rw: Math.round(r.width), rh: Math.round(r.height), dpr,
      visible: r.width > 0 && r.height > 0,
      alt: img.hasAttribute('alt'),
      dims: img.hasAttribute('width') && img.hasAttribute('height') || !!(img.style.width && img.style.height) || !!img.style.aspectRatio,
      lazy: img.loading === 'lazy',
      belowFold: absTop > window.innerHeight,
      sameOrigin: (() => { try { return new URL(src, location.href).origin === location.origin; } catch (er) { return false; } })()
    });
  });
  return out;
}

function highlight(idx) {
  const img = document.querySelector(`img[data-audit-idx="${idx}"]`);
  if (!img) return;
  img.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const prev = img.style.outline;
  img.style.outline = '4px solid #ff006e';
  img.style.outlineOffset = '2px';
  setTimeout(() => { img.style.outline = prev; }, 2500);
}

function analyze(it) {
  const issues = [];
  let save = 0;
  if (it.bytes > 500 * 1024) issues.push(['bad', t('veryHeavy', { s: App.bytes(it.bytes) })]);
  else if (it.bytes > 200 * 1024) issues.push(['warn', t('heavy', { s: App.bytes(it.bytes) })]);
  if (it.visible && it.nw && it.fmt !== 'svg') {
    const needW = Math.ceil(it.rw * it.dpr), needH = Math.ceil(it.rh * it.dpr);
    const ratio = (it.nw * it.nh) / Math.max(1, needW * needH);
    if (ratio > 2.25 && it.nw - needW > 150) {
      issues.push(['warn', t('oversized', { n: it.nw + '×' + it.nh, r: needW + '×' + needH })]);
      save += it.bytes * (1 - 1 / ratio);
    }
  }
  if (it.fmt === 'jpg' || it.fmt === 'png') {
    issues.push(['warn', t('format', { f: it.fmt.toUpperCase() })]);
    save += (it.bytes - save) * (it.fmt === 'png' ? 0.45 : 0.3);
  }
  if (it.fmt === 'gif' && it.bytes > 100 * 1024) { issues.push(['warn', t('gif')]); save += it.bytes * 0.6; }
  if (!it.alt) issues.push(['warn', t('noAlt')]);
  if (it.visible && !it.dims) issues.push(['', t('noDims')]);
  if (it.visible && it.belowFold && !it.lazy) issues.push(['', t('notLazy')]);
  if (it.visible && !it.belowFold && it.lazy) issues.push(['warn', t('lazyLcp')]);
  if (!it.bytes && !it.src.startsWith('data:')) issues.push(['', t('unknownSize')]);
  return { issues, save: Math.round(save) };
}

function render() {
  if (!data.length) return;
  const rows = data.map(it => Object.assign(it, analyze(it)));
  const total = rows.reduce((s, r) => s + r.bytes, 0);
  const saving = rows.reduce((s, r) => s + r.save, 0);
  const withIssues = rows.filter(r => r.issues.some(i => i[0])).length;
  const sum = $('#summary');
  sum.classList.remove('hidden');
  sum.innerHTML = '';
  [[rows.length, t('images')], [App.bytes(total), t('total')], [withIssues, t('issues')], [App.bytes(saving), t('savings')]]
    .forEach(([v, l]) => sum.append(h('div', { class: 'stat card' }, h('b', { text: v }), h('span', { text: l }))));
  $('#tools').classList.remove('hidden');
  const list = $('#list');
  list.innerHTML = '';
  const shown = rows.filter(r => filter === 'all' || r.issues.some(i => i[0])).sort((a, b) => b.bytes - a.bytes);
  if (!shown.length) list.append(h('div', { class: 'empty', text: t('empty') }));
  for (const r of shown) {
    const name = r.src.startsWith('data:') ? r.src.slice(0, 40) + '…' : decodeURIComponent(r.src.split('/').pop().split('?')[0] || r.src);
    list.append(h('div', { class: 'img-item', title: r.src, onclick: () => App.exec(highlight, [r.idx]) },
      h('img', { src: r.src, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }),
      h('div', { class: 'meta' },
        h('div', { class: 'name', text: name }),
        h('div', { class: 'small muted', text: `${(r.fmt || '?').toUpperCase()} · ${App.bytes(r.bytes)} · ${r.nw}×${r.nh} → ${r.rw}×${r.rh} ${t('shown')}` }),
        r.issues.length ? h('ul', {}, r.issues.map(([k, m]) => h('li', { class: k, text: m }))) : null)));
  }
}

App.onReady(() => {
  $('#scan').addEventListener('click', async () => {
    try {
      data = await App.exec(collect);
      if (!data.length) { $('#list').innerHTML = ''; $('#list').append(h('div', { class: 'empty', text: t('noImages') })); return; }
      render();
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $$('#tools .seg button').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f;
    $$('#tools .seg button').forEach(x => x.classList.toggle('active', x === b));
    render();
  }));
  $('#csv').addEventListener('click', () => {
    const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    const lines = [['url', 'format', 'bytes', 'natural', 'rendered', 'issues'].join(',')];
    for (const r of data) lines.push([q(r.src), r.fmt, r.bytes, r.nw + 'x' + r.nh, r.rw + 'x' + r.rh, q(r.issues.map(i => i[1]).join('; '))].join(','));
    App.download('rasm-auditi.csv', '﻿' + lines.join('\n'), 'text/csv');
  });
});
App.onLang(render);
