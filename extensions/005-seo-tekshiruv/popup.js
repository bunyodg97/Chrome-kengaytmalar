tabsInit();
let data;
function collect() {
  const q = s => document.querySelector(s), meta = n => q(`meta[name="${n}"]`)?.content || q(`meta[property="${n}"]`)?.content || '';
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const res = performance.getEntriesByType('resource');
  const imgs = [...document.images].map(i => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt'), w: i.naturalWidth, dw: i.clientWidth, lazy: i.loading === 'lazy' }));
  const links = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.href, text: (a.innerText || a.title || '').trim().slice(0, 80), nofollow: /nofollow/.test(a.rel) })).filter(l => /^https?:/.test(l.href));
  return {
    url: location.href, host: location.host, title: document.title, desc: meta('description'), robots: meta('robots'),
    canonical: q('link[rel=canonical]')?.href || '', lang: document.documentElement.lang, viewport: meta('viewport'),
    og: { title: meta('og:title'), desc: meta('og:description'), image: meta('og:image') },
    h: ['h1', 'h2', 'h3'].map(t => [...document.querySelectorAll(t)].map(e => e.innerText.trim().slice(0, 90))),
    words: (document.body.innerText.match(/\S+/g) || []).length,
    jsonld: document.querySelectorAll('script[type="application/ld+json"]').length,
    https: location.protocol === 'https:', favicon: !!q('link[rel~=icon]'),
    perf: { ttfb: nav.responseStart - nav.requestStart, dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, size: res.reduce((a, r) => a + (r.transferSize || 0), nav.transferSize || 0), reqs: res.length + 1,
      js: res.filter(r => r.initiatorType === 'script').length, css: res.filter(r => /css/.test(r.name) || r.initiatorType === 'link').length, dom: document.getElementsByTagName('*').length },
    imgs, links
  };
}
const C = (st, name, val, tip) => `<div class="chk"><span class="dot ${st}"></span><div><b>${name}</b><div class="v">${val}${tip ? ' — ' + tip : ''}</div></div></div>`;
function render() {
  const d = data, checks = [];
  const tl = d.title.length; checks.push([tl >= 30 && tl <= 65 ? 'ok' : tl ? 'warn' : 'bad', 'Sarlavha (title)', `${esc(d.title) || 'yo\'q'} (${tl} belgi)`, tl > 65 ? 'qisqartiring (30–65)' : tl < 30 && tl ? 'uzaytiring (30–65)' : '']);
  const dl = d.desc.length; checks.push([dl >= 70 && dl <= 160 ? 'ok' : dl ? 'warn' : 'bad', 'Meta description', `${esc(d.desc) || 'yo\'q'} (${dl} belgi)`, !dl ? 'qo\'shing (70–160 belgi)' : '']);
  checks.push([d.h[0].length === 1 ? 'ok' : d.h[0].length ? 'warn' : 'bad', 'H1 sarlavha', d.h[0].length ? `${d.h[0].length} ta: ${esc(d.h[0][0])}` : 'yo\'q', d.h[0].length > 1 ? 'bitta H1 tavsiya etiladi' : '']);
  checks.push([d.h[1].length ? 'ok' : 'warn', 'H2/H3 tuzilma', `${d.h[1].length} ta H2, ${d.h[2].length} ta H3`]);
  checks.push([d.canonical ? 'ok' : 'warn', 'Canonical', esc(d.canonical) || 'yo\'q']);
  checks.push([/noindex/i.test(d.robots) ? 'bad' : 'ok', 'Robots', esc(d.robots) || 'cheklov yo\'q', /noindex/i.test(d.robots) ? 'sahifa qidiruvdan yashirilgan!' : '']);
  checks.push([d.lang ? 'ok' : 'warn', 'Til (lang)', esc(d.lang) || 'ko\'rsatilmagan']);
  checks.push([d.viewport ? 'ok' : 'bad', 'Mobil viewport', d.viewport ? 'bor' : 'yo\'q']);
  checks.push([d.https ? 'ok' : 'bad', 'HTTPS', d.https ? 'ha' : 'yo\'q']);
  checks.push([d.og.title && d.og.image ? 'ok' : 'warn', 'Open Graph (Telegram ko\'rinishi)', `title: ${d.og.title ? 'bor' : 'yo\'q'}, rasm: ${d.og.image ? 'bor' : 'yo\'q'}`]);
  checks.push([d.jsonld ? 'ok' : 'warn', 'Structured data (JSON-LD)', d.jsonld + ' ta']);
  const noAlt = d.imgs.filter(i => i.alt === null || i.alt === '').length;
  checks.push([noAlt ? 'warn' : 'ok', 'Rasmlarda alt', `${d.imgs.length} ta rasmdan ${noAlt} tasida alt yo'q`]);
  checks.push([d.words >= 300 ? 'ok' : 'warn', 'Matn hajmi', d.words + ' so\'z']);
  checks.push([d.favicon ? 'ok' : 'warn', 'Favicon', d.favicon ? 'bor' : 'yo\'q']);
  const pts = checks.reduce((a, c) => a + (c[0] === 'ok' ? 1 : c[0] === 'warn' ? 0.5 : 0), 0);
  const sc = Math.round(pts / checks.length * 100);
  const col = sc >= 80 ? 'var(--ok)' : sc >= 55 ? 'var(--warn)' : 'var(--bad)';
  $('#score').textContent = sc; $('#score').style.borderColor = col; $('#score').style.color = col;
  $('#title').textContent = d.title || '(sarlavhasiz)'; $('#url').textContent = d.url;
  $('#seo').innerHTML = checks.map(c => C(...c)).join('');
  const p = d.perf, ms = v => v > 0 ? Math.round(v) + ' ms' : '—';
  $('#speed').innerHTML = [
    C(p.ttfb < 600 ? 'ok' : p.ttfb < 1500 ? 'warn' : 'bad', 'Server javobi (TTFB)', ms(p.ttfb)),
    C(p.dcl < 2000 ? 'ok' : p.dcl < 4000 ? 'warn' : 'bad', 'DOM tayyor', ms(p.dcl)),
    C(p.load < 3000 ? 'ok' : p.load < 6000 ? 'warn' : 'bad', 'To\'liq yuklanish', ms(p.load)),
    C(p.size < 2e6 ? 'ok' : p.size < 5e6 ? 'warn' : 'bad', 'Sahifa hajmi', fmtBytes(p.size), 'keshdagi fayllar hisobga olinmaydi'),
    C(p.reqs < 80 ? 'ok' : p.reqs < 150 ? 'warn' : 'bad', 'So\'rovlar soni', `${p.reqs} ta (JS: ${p.js}, CSS: ${p.css})`),
    C(p.dom < 1500 ? 'ok' : p.dom < 3000 ? 'warn' : 'bad', 'DOM elementlari', p.dom + ' ta')
  ].join('');
  const big = d.imgs.filter(i => i.w > i.dw * 2 && i.dw > 0);
  $('#img').innerHTML = (big.length ? `<p class="small">${big.length} ta rasm ko'rsatilganidan 2 baravardan katta yuklanmoqda:</p>` : '<p class="small muted">Haddan tashqari katta rasm topilmadi.</p>') +
    d.imgs.slice(0, 80).map(i => `<div class="chk"><span class="dot ${!i.alt ? 'warn' : i.w > i.dw * 2 && i.dw ? 'warn' : 'ok'}"></span><div class="v" style="flex:1">${esc(i.src.split('/').pop().slice(0, 60))}<br>${i.w}px (ko'rinishi ${i.dw}px) · alt: ${i.alt ? esc(i.alt.slice(0, 40)) : '<b>yo\'q</b>'}${i.lazy ? ' · lazy' : ''}</div></div>`).join('');
  const int = d.links.filter(l => new URL(l.href).host === d.host).length;
  $('#lsum').textContent = `${d.links.length} ta havola: ${int} ichki, ${d.links.length - int} tashqi`;
  $('#links').innerHTML = '';
}
$('#check').onclick = async () => {
  const uniq = [...new Map(data.links.map(l => [l.href.split('#')[0], l])).values()].slice(0, 120);
  $('#check').disabled = true; let bad = 0, done = 0;
  const box = $('#links'); box.innerHTML = '';
  const one = async l => {
    let st;
    try { const r = await fetch(l.href, { method: 'HEAD', redirect: 'follow' }); st = r.status; if (st === 405 || st === 403) st = (await fetch(l.href, { redirect: 'follow' })).status; }
    catch { st = 'xato'; }
    done++; $('#check').textContent = `${done}/${uniq.length}…`;
    if (st === 'xato' || st >= 400) { bad++; box.insertAdjacentHTML('beforeend', `<div class="item"><span class="chip bad">${st}</span><span class="grow small" style="word-break:break-all">${esc(l.href)}<br><span class="muted">${esc(l.text)}</span></span></div>`); }
  };
  const q = [...uniq]; await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) await one(q.shift()); }));
  $('#check').textContent = 'Qayta tekshirish'; $('#check').disabled = false;
  if (!bad) box.innerHTML = `<div class="empty">${uniq.length} ta havola tekshirildi, buzilgani yo'q.</div>`;
};
(async () => {
  const tab = await activeTab();
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collect }); data = r.result; render(); }
  catch { $('.wrap').innerHTML = '<div class="empty">Bu sahifani tekshirib bo\'lmaydi. Oddiy veb-saytni oching.</div>'; }
})();
