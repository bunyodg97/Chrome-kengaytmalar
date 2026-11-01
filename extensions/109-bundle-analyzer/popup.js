const { $, h } = App;
let last = null;

function collectScripts() {
  const host = location.hostname.split('.').slice(-2).join('.');
  const map = new Map();
  for (const r of performance.getEntriesByType('resource')) {
    const isJs = r.initiatorType === 'script' || /\.m?js(\?|#|$)/.test(r.name) || (r.initiatorType === 'link' && /\.m?js/.test(r.name));
    if (!isJs) continue;
    map.set(r.name, { url: r.name, transfer: r.transferSize || 0, encoded: r.encodedBodySize || 0, decoded: r.decodedBodySize || 0, time: Math.round(r.duration), cached: r.transferSize === 0 && r.decodedBodySize > 0 });
  }
  for (const s of document.scripts) if (s.src && !map.has(s.src)) map.set(s.src, { url: s.src, transfer: 0, encoded: 0, decoded: 0, time: 0 });
  let inlineBytes = 0, inlineCount = 0;
  for (const s of document.scripts) if (!s.src && s.textContent.trim()) { inlineBytes += s.textContent.length; inlineCount++; }
  const files = Array.from(map.values()).map(f => {
    let d = '';
    try { d = new URL(f.url).hostname; } catch (e) {}
    return Object.assign(f, { domain: d, third: d && !d.endsWith(host) });
  });
  return { files, inlineBytes, inlineCount, page: location.href };
}

function render() {
  if (!last) return;
  const { files, inlineBytes, inlineCount, libs } = last;
  const sum = (arr, k) => arr.reduce((s, f) => s + (f[k] || 0), 0);
  const size = f => f.encoded || f.transfer;
  const total = sum(files, 'encoded') || sum(files, 'transfer');
  const decoded = sum(files, 'decoded') + inlineBytes;
  const thirdBytes = files.filter(f => f.third).reduce((s, f) => s + size(f), 0);
  $('#res').classList.remove('hidden');
  const s = $('#sum'); s.innerHTML = '';
  [[files.length + (inlineCount ? ' +' + inlineCount : ''), t('files')], [App.bytes(total), t('transfer')], [App.bytes(decoded), t('decoded')], [total ? Math.round(thirdBytes / total * 100) + '%' : '—', t('thirdParty')]]
    .forEach(([v, l]) => s.append(h('div', { class: 'stat card' }, h('b', { text: v }), h('span', { text: l }))));

  // domenlar
  const doms = {};
  files.forEach(f => { const d = doms[f.domain] || (doms[f.domain] = { n: 0, b: 0, third: f.third }); d.n++; d.b += size(f); });
  if (inlineBytes) doms['(' + t('inline') + ')'] = { n: inlineCount, b: inlineBytes, third: false };
  const max = Math.max(1, ...Object.values(doms).map(d => d.b));
  const dEl = $('#doms'); dEl.innerHTML = '';
  Object.entries(doms).sort((a, b) => b[1].b - a[1].b).forEach(([d, v]) => dEl.append(
    h('div', { class: 'dom' + (v.third ? ' third' : '') },
      h('div', { class: 'row' }, h('span', { class: 'grow url', text: d }), h('span', { class: 'muted', text: v.n + ' · ' + App.bytes(v.b) }), h('span', { class: 'badge ' + (v.third ? 'warn' : ''), text: v.third ? t('third') : t('first') })),
      h('div', { class: 'bar' }, h('i', { style: { width: (v.b / max * 100) + '%' } })))));

  // kutubxonalar
  const lEl = $('#libs'); lEl.innerHTML = '';
  if (!libs.length) lEl.append(h('span', { class: 'muted', text: t('noLibs') }));
  libs.forEach(l => lEl.append(h('span', { class: 'badge', title: l.source, text: l.name + (l.version ? ' ' + l.version : '') })));

  // takrorlar: bir xil fayl nomi turli URL'larda
  const names = {};
  files.forEach(f => { const n = f.url.split('/').pop().split('?')[0].replace(/[.-][a-f0-9]{8,}/, '').toLowerCase(); if (/jquery|react|vue|lodash|moment|bootstrap|angular/.test(n)) (names[n.replace(/[.-]?\d+\.\d+\.\d+/, '').replace('.min', '')] ||= []).push(f.url); });
  const dups = Object.entries(names).filter(([, v]) => new Set(v).size > 1);
  const dupBox = $('#dupBox'); dupBox.innerHTML = '';
  dups.forEach(([n, v]) => dupBox.append(h('div', { class: 'card small', style: { borderColor: 'var(--warn)' } }, '⚠ ' + t('dup', { n }), h('div', { class: 'muted url', text: v.join('\n') }))));

  // fayllar
  const fEl = $('#files'); fEl.innerHTML = '';
  let hidden = false;
  [...files].sort((a, b) => (b.decoded || size(b)) - (a.decoded || size(a))).forEach(f => {
    const n = f.url.split('/').pop().split('?')[0] || f.url;
    if (!size(f) && !f.decoded) hidden = true;
    fEl.append(h('tr', {},
      h('td', { class: 'f', title: f.url }, h('div', { text: n }), h('div', { class: 'muted small', text: f.domain })),
      h('td', { class: 'num', text: (size(f) ? App.bytes(size(f)) : (f.cached ? 'cache' : '*')) }),
      h('td', { class: 'num muted', text: f.decoded ? App.bytes(f.decoded) : '' }),
      h('td', { class: 'num muted', text: f.time ? f.time + 'ms' : '' })));
  });
  $('#note').textContent = hidden ? t('unknownSize') : '';
}

App.onReady(() => {
  $('#scan').addEventListener('click', async () => {
    try {
      const data = await App.exec(collectScripts);
      data.libs = await App.exec(detectLibs, [], 'MAIN');
      last = data;
      render();
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $('#csv').addEventListener('click', () => {
    if (!last) return;
    const rows = [['url', 'domain', 'third_party', 'transfer', 'encoded', 'decoded', 'ms'].join(',')];
    last.files.forEach(f => rows.push(['"' + f.url + '"', f.domain, f.third, f.transfer, f.encoded, f.decoded, f.time].join(',')));
    App.download('bundle.csv', rows.join('\n'), 'text/csv');
  });
});
App.onLang(render);
