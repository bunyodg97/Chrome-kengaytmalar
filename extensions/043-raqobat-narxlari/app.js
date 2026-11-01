let products = [], sel = null, editing = null, STORES = [];
const SM = id => STORES.find(s => s.id === id) || { name: id, color: '#777' };
const badge = id => `<span class="src" style="background:${SM(id).color}">${esc(SM(id).name)}</span>`;
// eski formatdagi natijalarni yangisiga moslaymiz
function up(L) { if (L && !L.by) { L.by = { uzum: L.su || { n: 0 }, olx: L.so || { n: 0 } }; L.rawBy = { uzum: L.rawUz || 0, olx: L.rawOlx || 0 }; } return L; }
const pct = v => (v > 0 ? '+' : '') + v + '%';
function status(p) {
  const s = p.last?.stats; if (!s?.n) return ['', 'tekshirilmagan'];
  if (!p.myPrice) return ['acc', `${s.n} ta · min ${som(s.min)}`];
  if (p.myPrice <= s.min) return ['ok', 'Eng arzon siz'];
  if (p.myPrice <= s.med) return ['warn', `${s.rank}-o'rin / ${s.n}`];
  return ['bad', `Medianadan ${pct(s.vsMed)}`];
}
function side() {
  $('#list').innerHTML = products.map(p => { const [c, t] = status(p); return `<div class="pi ${p.id === sel ? 'on' : ''}" data-id="${p.id}"><b>${esc(p.name)}</b><div class="s"><span>${p.myPrice ? som(p.myPrice) : 'narx kiritilmagan'}</span><span class="chip ${c}">${esc(t)}</span></div></div>`; }).join('') || '<div class="empty">Hali mahsulot yo\'q</div>';
}
function strip(items, my) {
  if (!items.length) return '';
  const vals = items.map(i => i.uzs), lo = Math.min(...vals, my || Infinity), hi = Math.max(...vals, my || 0), span = hi - lo || 1, x = v => ((v - lo) / span * 100).toFixed(2) + '%';
  return `<div class="strip"><div class="ax"></div>${items.map(i => `<i style="left:${x(i.uzs)};background:${SM(i.src).color}" title="${esc(SM(i.src).name)}: ${esc(i.title)} — ${som(i.uzs)}"></i>`).join('')}
    ${my ? `<div class="me" style="left:${x(my)}"><span>Siz</span></div>` : ''}<span class="lb" style="left:0;transform:none">${som(lo)}</span><span class="lb" style="left:100%;transform:translateX(-100%)">${som(hi)}</span></div>`;
}
function histChart(p) {
  const h = (p.history || []).filter(x => x.n); const cv = $('#hist'); if (!cv) return;
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = 180; cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const css = getComputedStyle(document.body), mut = css.getPropertyValue('--muted'), line = css.getPropertyValue('--line');
  if (h.length < 2) { c.fillStyle = mut; c.font = '13px sans-serif'; c.fillText('Tarix grafigi kamida 2 ta tekshiruvdan keyin chiqadi', 10, 90); return; }
  const all = h.flatMap(x => [x.min, x.med, x.my || x.min]), lo = Math.min(...all) * 0.97, hi = Math.max(...all) * 1.03, L = 70, R = W - 10, T = 10, B = H - 24;
  const X = i => L + (R - L) * i / (h.length - 1), Y = v => B - (v - lo) / (hi - lo) * (B - T);
  c.strokeStyle = line; c.fillStyle = mut; c.font = '11px sans-serif';
  for (let k = 0; k <= 3; k++) { const v = lo + (hi - lo) * k / 3, y = Y(v); c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke(); c.fillText(Math.round(v / 1000).toLocaleString('ru-RU') + 'k', 4, y + 4); }
  const ser = (k, col, dash) => { c.strokeStyle = col; c.lineWidth = 2; c.setLineDash(dash || []); c.beginPath(); h.forEach((x, i) => { const v = x[k]; if (!v) return; i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)); }); c.stroke(); c.setLineDash([]); };
  ser('med', '#1f5fd1'); ser('min', '#2e7d32'); ser('my', '#c62828', [5, 4]);
  c.fillStyle = mut; [0, h.length - 1].forEach(i => c.fillText(new Date(h[i].t).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }), Math.min(X(i), R - 40), H - 6));
}
function show() {
  const p = products.find(x => x.id === sel); side();
  if (!p) { $('#main').innerHTML = '<div class="empty">Chapdan mahsulot tanlang yoki «+ Qo\'shish» bosing.</div>'; return; }
  const L = up(p.last), s = L?.stats || {};
  const rawTxt = L ? Object.entries(L.rawBy || {}).map(([k, v]) => `${SM(k).name} ${v}`).join(', ') : '';
  const head = `<div class="row between"><div><h1>${esc(p.name)}</h1><div class="muted small">Qidiruv: «${esc(p.query)}»${p.exclude ? ' · istisno: ' + esc(p.exclude) : ''}${L ? ' · tekshirildi: ' + new Date(L.t).toLocaleString('uz-UZ') : ''}</div></div>
    <div class="row"><button id="chk">↻ Tekshirish</button><button class="ghost" id="edit">Sozlash</button>${L ? '<button class="ghost" id="csv">Excel (CSV)</button>' : ''}</div></div>`;
  if (!L) { $('#main').innerHTML = head + '<div class="empty">Hali tekshirilmagan. «Tekshirish» tugmasini bosing.</div>'; bind(p); return; }
  if (!s.n) { $('#main').innerHTML = head + `<div class="card"><b>Mos e'lon topilmadi</b><div class="muted small">Topilgan: ${esc(rawTxt)} — lekin filtrdan o'tmadi. Qidiruv so'zlarini qisqartiring yoki «Sarlavhada barcha so'zlar bo'lsin» ni o'chiring.</div>${L.errs.length ? `<div class="small" style="color:var(--bad)">${esc(L.errs.join('; '))}</div>` : ''}</div>`; bind(p); return; }
  const verdict = !p.myPrice ? '' : p.myPrice <= s.min ? `<span class="chip ok">Siz eng arzonsiz</span> Keyingi raqobatchidan ${som(s.min - p.myPrice)} arzon.`
    : `<span class="chip ${p.myPrice <= s.med ? 'warn' : 'bad'}">${s.rank}-o'rin</span> ${s.n} ta raqobatchidan <b>${s.cheaper}</b> tasi sizdan arzon. Eng arzondan ${pct(s.vsMin)}, medianadan ${pct(s.vsMed)}.`;
  const rows = L.items.map(i => `<tr><td>${badge(i.src)}</td><td><a href="${esc(i.url)}" target="_blank">${esc(i.title)}</a><div class="muted small">${[i.orders ? i.orders + ' buyurtma' : '', i.rating ? '★ ' + i.rating : '', i.loc, i.neg ? 'kelishiladi' : '', i.top ? 'TOP' : '', i.cur === 'USD' ? `$${i.price.toLocaleString('ru-RU')}` : ''].filter(Boolean).map(esc).join(' · ')}</div></td>
    <td class="n"><b>${som(i.uzs)}</b></td><td class="n ${p.myPrice ? (i.uzs < p.myPrice ? 'bad' : 'ok') : ''}" style="color:${p.myPrice ? (i.uzs < p.myPrice ? 'var(--bad)' : 'var(--ok)') : ''}">${p.myPrice ? pct(Math.round((i.uzs / p.myPrice - 1) * 1000) / 10) : ''}</td><td><button class="hide" data-hide="${esc(i.url)}" title="Bu e'lonni hisobga olmaslik">✕</button></td></tr>`).join('');
  $('#main').innerHTML = head + `
    <div class="tiles">
      <div class="tile me"><span>Mening narxim</span><b>${som(p.myPrice)}</b></div><div class="tile"><span>Eng arzon</span><b>${som(s.min)}</b></div>
      <div class="tile"><span>25% chegara</span><b>${som(s.p25)}</b></div><div class="tile"><span>Mediana</span><b>${som(s.med)}</b></div>
      <div class="tile"><span>O'rtacha</span><b>${som(s.avg)}</b></div><div class="tile"><span>Eng qimmat</span><b>${som(s.max)}</b></div></div>
    <div class="card"><div>${verdict}</div><div class="muted small">${s.n} ta mos e'lon (${Object.entries(L.by).map(([k, v]) => `${esc(SM(k).name)}: ${v.n || 0}`).join(', ')})${s.outliers ? `, ${s.outliers} ta haddan tashqari narx chiqarildi` : ''}. Topilgan jami: ${L.raw}. 1$ = ${som(L.rate)}.</div>
      ${strip(L.items, p.myPrice)}<div class="small muted">${Object.keys(L.by).map(badge).join(' ')} — har bir chiziq bitta e'lon, qizil — sizning narxingiz.</div></div>
    ${p.myPrice ? `<div class="sug"><div data-v="${s.sugCheapest}"><span>Eng arzon bo'lish uchun</span><b>${som(s.sugCheapest)}</b><span>eng arzondan 1% past</span></div>
      <div data-v="${s.sugCompetitive}"><span>Raqobatbardosh (arzon chorakda)</span><b>${som(s.sugCompetitive)}</b><span>25% sotuvchidan arzon</span></div>
      <div data-v="${s.sugMarket}"><span>Bozor narxi</span><b>${som(s.sugMarket)}</b><span>mediana</span></div></div>` : ''}
    <div class="bysrc">${Object.entries(L.by).map(([k, v]) => `<div class="card" style="border-left:4px solid ${SM(k).color}"><b class="small">${esc(SM(k).name)}</b><div class="small">${v.n ? `${v.n} ta · min ${som(v.min)} · mediana ${som(v.med)}` : `mos e'lon yo'q (o'qildi: ${L.rawBy?.[k] ?? 0})`}</div></div>`).join('')}</div>
    <div class="card"><b class="small">Narxlar tarixi</b><canvas id="hist"></canvas><div class="small muted"><span style="color:#2e7d32">━ eng arzon</span> · <span style="color:#1f5fd1">━ mediana</span> · <span style="color:#c62828">╍ sizning narxingiz</span></div></div>
    ${L.errs.length ? `<div class="small" style="color:var(--bad)">${esc(L.errs.join('; '))}</div>` : ''}
    <div class="card" style="overflow-x:auto"><table><tr><th>Manba</th><th>E'lon</th><th style="text-align:right">Narx</th><th style="text-align:right">Sizga nisbatan</th><th></th></tr>${rows}</table>
      ${(p.hidden || []).length ? `<button class="ghost" id="unhide" style="align-self:flex-start">Yashirilgan ${p.hidden.length} ta e'lonni qaytarish</button>` : ''}</div>`;
  bind(p); histChart(p);
}
function bind(p) {
  $('#chk').onclick = () => run(p.id);
  $('#edit').onclick = () => openDlg(p);
  $('#csv') && ($('#csv').onclick = () => download(`${p.name}-raqobat.csv`, '﻿' + [['Manba', 'Nomi', 'Narx (so\'m)', 'Asl narx', 'Valyuta', 'Havola'], ...p.last.items.map(i => [i.src, i.title.replace(/;/g, ','), i.uzs, i.price, i.cur, i.url])].map(r => r.join(';')).join('\n'), 'text/csv'));
  $$('.sug [data-v]').forEach(d => d.onclick = () => copyText(String(d.dataset.v)));
  $$('[data-hide]').forEach(b => b.onclick = async () => { p.hidden = [...(p.hidden || []), b.dataset.hide]; p.last.items = p.last.items.filter(i => i.url !== b.dataset.hide); p.last.stats = stats(p.last.items, p.myPrice, p.trim !== false); up(p.last); Object.keys(p.last.by).forEach(k => p.last.by[k] = stats(p.last.items.filter(i => i.src === k), p.myPrice, p.trim !== false)); await save(); show(); });
  $('#unhide') && ($('#unhide').onclick = async () => { p.hidden = []; await save(); run(p.id); });
}
const save = () => store.set('products', products);
async function run(id) {
  $('#prog').hidden = false; $('#prog').textContent = 'Do\'konlar tekshirilmoqda… (fon tablari ochilib-yopiladi, 20–60 soniya)';
  const r = await chrome.runtime.sendMessage({ cmd: 'check', id });
  $('#prog').hidden = true; if (r?.error) toast('Xato: ' + r.error);
  products = await store.get('products', []); show();
}
function openDlg(p) {
  editing = p || null; $('#dlgT').textContent = p ? 'Mahsulotni sozlash' : 'Mahsulot qo\'shish'; $('#fDel').hidden = !p;
  const v = p || {}; $('#fName').value = v.name || ''; $('#fQuery').value = v.query || ''; $('#fMy').value = v.myPrice || ''; $('#fEx').value = v.exclude || '';
  $('#fMin').value = v.minP || ''; $('#fMax').value = v.maxP || ''; $('#fStrict').checked = v.strict !== false; $('#fTrim').checked = v.trim !== false;
  $('#fSrc').innerHTML = STORES.map(st => `<label class="inline"><input type="checkbox" data-st="${st.id}" ${storeOn(v, st.id, st) ? 'checked' : ''}> <span style="color:${st.color};font-weight:700">●</span> ${esc(st.name)}</label>`).join('');
  $('#dlg').showModal();
}
$('#fName').oninput = e => { if (!editing && !$('#fQuery').dataset.touched) $('#fQuery').value = e.target.value.toLowerCase(); };
$('#fQuery').oninput = e => e.target.dataset.touched = 1;
$('#f').onsubmit = async e => {
  if (e.submitter?.value !== 'ok') return;
  const d = { name: $('#fName').value.trim(), query: $('#fQuery').value.trim(), myPrice: +$('#fMy').value || 0, exclude: $('#fEx').value.trim(), minP: +$('#fMin').value || 0, maxP: +$('#fMax').value || 0,
    src: Object.fromEntries($$('#fSrc [data-st]').map(c => [c.dataset.st, c.checked])), strict: $('#fStrict').checked, trim: $('#fTrim').checked };
  if (editing) Object.assign(editing, d); else { const p = { id: Date.now(), ...d, hidden: [], history: [] }; products.unshift(p); editing = p; }
  sel = editing.id; await save(); show(); run(sel);
};
let delArm = false;
$('#fDel').onclick = async () => { if (!delArm) { delArm = true; $('#fDel').textContent = 'Tasdiqlang'; return; } products = products.filter(x => x !== editing); sel = products[0]?.id; delArm = false; $('#fDel').textContent = 'O\'chirish'; await save(); $('#dlg').close(); show(); };
$('#add').onclick = () => openDlg();
$('#list').onclick = e => { const it = e.target.closest('[data-id]'); if (it) { sel = +it.dataset.id; show(); } };
$('#all').onclick = async () => { $('#prog').hidden = false; $('#prog').textContent = 'Barcha mahsulotlar tekshirilmoqda…'; await chrome.runtime.sendMessage({ cmd: 'checkAll' }); $('#prog').hidden = true; products = await store.get('products', []); show(); };
$('#every').onchange = e => store.set('every', +e.target.value);
$('#rate').onchange = e => store.set('rateManual', +e.target.value || 0).then(initRate);
async function initRate() { const o = await chrome.storage.local.get(['rateManual']); $('#rate').value = Math.round(await usdRate()); $('#rateSrc').textContent = o.rateManual ? '(qo\'lda)' : '(MB kursi)'; }
chrome.storage.session.onChanged.addListener(c => { if (c.progress?.newValue) { $('#prog').hidden = false; $('#prog').textContent = `Tekshirilmoqda: ${c.progress.newValue.name}…`; } });
addEventListener('resize', () => { const p = products.find(x => x.id === sel); if (p) histChart(p); });
(async () => {
  STORES = await getStores();
  products = await store.get('products', []); $('#every').value = await store.get('every', 0); initRate();
  const { prefill } = await chrome.storage.session.get('prefill');
  sel = products[0]?.id; show();
  if (location.hash === '#add' || prefill) { openDlg(); if (prefill) { $('#fName').value = prefill.name; $('#fQuery').value = prefill.query; $('#fQuery').dataset.touched = 1; $('#fMy').value = prefill.price || ''; chrome.storage.session.remove('prefill'); } }
})();

// --- Do'konlar sozlamasi ---
function renderStores() {
  $('#stList').innerHTML = STORES.map((st, i) => `<div class="card" data-i="${i}" style="border-left:4px solid ${st.color}">
    <div class="row between"><label class="inline"><input type="checkbox" data-k="on" ${st.on ? 'checked' : ''}> <b>${esc(st.name)}</b></label>
      <div class="row"><button type="button" class="ghost" data-a="test">Sinash</button>${DEFAULT_STORES.some(d => d.id === st.id) ? '<button type="button" class="ghost" data-a="reset">Asl holi</button>' : '<button type="button" class="danger" data-a="del">O\'chirish</button>'}</div></div>
    <label>Qidiruv manzili ({q} — qidiruv so'zi)<input data-k="search" value="${esc(st.search)}" class="mono"></label>
    <label>Mahsulot havolasida uchraydigan bo'lak (vergul bilan)<input data-k="links" value="${esc(st.links)}" class="mono" ${st.kind === 'olx' ? 'disabled' : ''}></label>
    <div class="small" data-res></div></div>`).join('');
}
const saveStores = () => store.set('stores', STORES);
$('#stBtn').onclick = () => { renderStores(); $('#stDlg').showModal(); };
$('#stClose').onclick = () => { $('#stDlg').close(); show(); };
$('#stList').addEventListener('input', e => { const c = e.target.closest('[data-i]'), k = e.target.dataset.k; if (!c || !k) return; STORES[+c.dataset.i][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; saveStores(); });
$('#stList').addEventListener('click', async e => {
  const a = e.target.dataset.a; if (!a) return; const c = e.target.closest('[data-i]'), i = +c.dataset.i, st = STORES[i];
  if (a === 'del') { STORES.splice(i, 1); saveStores(); renderStores(); return; }
  if (a === 'reset') { STORES[i] = { ...DEFAULT_STORES.find(d => d.id === st.id) }; saveStores(); renderStores(); return; }
  if (a === 'test') {
    const q = $('#stQ').value.trim() || 'iphone 13', out = c.querySelector('[data-res]'); out.textContent = `«${q}» qidirilmoqda…`;
    const r = await chrome.runtime.sendMessage({ cmd: 'testStore', store: st, query: q });
    out.innerHTML = r.error ? `<span style="color:var(--bad)">Xato: ${esc(r.error)}</span>` : r.n ? `<span style="color:var(--ok)">✓ ${r.n} ta mahsulot o'qildi.</span> Masalan: ${r.sample.slice(0, 3).map(x => `${esc(x.title.slice(0, 40))} — ${som(x.price)}${x.cur === 'USD' ? ' $' : ''}`).join('; ')}`
      : `<span style="color:var(--bad)">0 ta o'qildi.</span> Qidiruv manzilini brauzerda ochib tekshiring va mahsulot havolasidan bir bo'lagini (masalan «/product/») yuqoriga yozing.`;
  }
});
$('#stAdd').onclick = async () => {
  let u; try { u = new URL($('#stUrl').value.trim().replace('{q}', 'x')); } catch { return toast('To\'liq qidiruv manzilini kiriting, masalan https://sayt.uz/search?q={q}'); }
  if (!$('#stUrl').value.includes('{q}')) return toast('Manzilda {q} bo\'lishi kerak');
  const ok = await chrome.permissions.request({ origins: [u.origin + '/*'] }).catch(() => false);
  if (!ok) return toast('Saytga ruxsat berilmadi');
  STORES.push({ id: 'c' + Date.now(), name: $('#stName').value.trim() || u.hostname, color: '#' + Math.floor(Math.random() * 0xaaaaaa).toString(16).padStart(6, '0'), on: true, kind: 'shop', search: $('#stUrl').value.trim(), links: $('#stLinks').value.trim() || '/product' });
  saveStores(); renderStores(); $('#stName').value = $('#stUrl').value = $('#stLinks').value = '';
};
