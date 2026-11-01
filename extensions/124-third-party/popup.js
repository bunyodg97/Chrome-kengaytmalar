const { $, $$, h } = App;
let rows = null, filter = 'all';

function gather() {
  const site = location.hostname.replace(/^www\./, '');
  const root = site.split('.').slice(-2).join('.');
  const list = [];
  for (const r of performance.getEntriesByType('resource')) {
    let u;
    try { u = new URL(r.name); } catch (e) { continue; }
    if (!/^https?:$/.test(u.protocol)) continue;
    if (u.hostname === site || u.hostname.endsWith('.' + root) || u.hostname === root) continue;
    list.push({ url: r.name, host: u.hostname, type: r.initiatorType, size: r.transferSize || r.encodedBodySize || 0 });
  }
  for (const s of document.querySelectorAll('script[src], iframe[src]')) {
    try { const u = new URL(s.src); if (!u.hostname.endsWith(root)) list.push({ url: s.src, host: u.hostname, type: s.tagName.toLowerCase(), size: 0, dom: true }); } catch (e) {}
  }
  return list;
}

function build(list) {
  const by = {};
  for (const r of list) {
    const d = by[r.host] || (by[r.host] = { host: r.host, n: 0, size: 0, types: new Set(), sends: false, url: r.url });
    if (!r.dom) d.n++;
    d.size += r.size;
    d.types.add(r.type);
    if (['beacon', 'xmlhttprequest', 'fetch', 'ping'].includes(r.type) || (r.type === 'img' && r.size < 1200 && /[?&]/.test(r.url))) d.sends = true;
  }
  return Object.values(by).map(d => {
    const s = lookupService(d.host, d.url);
    return Object.assign(d, { service: s ? s[0] : null, cat: s ? s[1] : 'other', tracker: s ? TRACKER_TYPES.has(s[1]) : false, types: [...d.types] });
  }).sort((a, b) => (b.tracker - a.tracker) || (b.n - a.n));
}

function render() {
  if (!rows) return;
  const cat = k => (STR[I18N.lang].cat || {})[k] || k;
  const trackers = rows.filter(r => r.tracker);
  const sum = $('#sum'); sum.classList.remove('hidden'); sum.innerHTML = '';
  [[rows.length, t('domains')], [new Set(trackers.map(r => r.service)).size, t('trackers')], [rows.reduce((a, r) => a + r.n, 0), t('requests')], [rows.filter(r => r.sends).length, t('sends')]]
    .forEach(([v, l]) => sum.append(h('div', { class: 'stat card' }, h('b', { text: v }), h('span', { text: l }))));
  const cats = {};
  rows.forEach(r => { cats[r.cat] = (cats[r.cat] || 0) + 1; });
  const ce = $('#cats'); ce.innerHTML = '';
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => ce.append(h('span', { class: 'badge c-' + k, text: cat(k) + ' ' + n })));
  $('#tools').classList.remove('hidden');
  const L = $('#list'); L.innerHTML = '';
  const shown = rows.filter(r => filter === 'all' || r.tracker);
  if (!shown.length) L.append(h('div', { class: 'empty', text: t('empty') }));
  for (const r of shown) L.append(h('div', { class: 'tp' },
    h('div', { class: 'top' }, h('span', { class: 'nm', text: r.service || t('unknown') }), h('span', { class: 'badge c-' + r.cat, text: cat(r.cat) })),
    h('div', { class: 'dm', text: r.host }),
    h('div', { class: 'small muted' }, `${r.n} · ${App.bytes(r.size)} · ${r.types.join(', ')}`, r.sends ? h('span', { class: 'send', title: t('sendsHint'), text: ' · ⇡ ' + t('sends') }) : '')));
}

App.onReady(() => {
  $('#scan').addEventListener('click', async () => {
    try {
      rows = build(await App.exec(gather));
      const tab = await App.tab();
      const n = new Set(rows.filter(r => r.tracker).map(r => r.service)).size;
      chrome.action.setBadgeText({ tabId: tab.id, text: String(n) });
      chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: n ? '#862e9c' : '#2b8a3e' });
      render();
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $$('#tools .seg button').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; $$('#tools .seg button').forEach(x => x.classList.toggle('active', x === b)); render(); }));
  $('#csv').addEventListener('click', () => {
    const lines = ['domain,service,category,tracker,requests,bytes,sends_data'];
    rows.forEach(r => lines.push([r.host, '"' + (r.service || '') + '"', r.cat, r.tracker, r.n, r.size, r.sends].join(',')));
    App.download('tashqi-xizmatlar.csv', lines.join('\n'), 'text/csv');
  });
  $('#csp').addEventListener('click', () => {
    const scr = rows.filter(r => r.types.includes('script')).map(r => 'https://' + r.host);
    const con = rows.filter(r => r.sends).map(r => 'https://' + r.host);
    const img = rows.filter(r => r.types.includes('img')).map(r => 'https://' + r.host);
    App.copy(`script-src 'self' ${[...new Set(scr)].join(' ')};\nconnect-src 'self' ${[...new Set(con)].join(' ')};\nimg-src 'self' data: ${[...new Set(img)].join(' ')};`);
  });
});
App.onLang(render);
