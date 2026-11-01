const { $, h } = App;
const { store } = FT;
let cfg, from = null, to = null, mode = 'month', cityCache = {};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const hm = m => t('hm', { h: Math.floor(m / 60), m: m % 60 });
const errText = e => e.message === 'token' ? t('errToken') : e.message === 'rate' ? t('errRate') : t('errNet') + String(e.message).replace(/^net:/, '');
const fmtDate = s => s ? s.slice(0, 10).split('-').reverse().join('.') + (s.length > 10 ? ' ' + s.slice(11, 16) : '') : '';

// --- shahar/aeroport tanlash (autocomplete) ---
function picker(input, box, onPick) {
  let tm = 0, seq = 0;
  const hide = () => { box.style.display = 'none'; };
  input.addEventListener('input', () => {
    onPick(null);
    clearTimeout(tm);
    tm = setTimeout(async () => {
      const my = ++seq;
      try {
        const lang = (await store.lang());
        const list = await FT.places(input.value, lang);
        if (my !== seq) return;
        box.innerHTML = '';
        list.forEach(p => box.append(h('div', { onmousedown: e => { e.preventDefault(); input.value = p.label; onPick(p); hide(); } }, p.label, h('small', { text: p.country + (p.type === 'airport' ? ' ✈' : '') }))));
        box.style.display = list.length ? 'block' : 'none';
      } catch (e) { hide(); }
    }, 250);
  });
  input.addEventListener('blur', () => setTimeout(hide, 120));
}

async function cityName(code) {
  if (cityCache[code]) return cityCache[code];
  try {
    const l = await FT.places(code, await store.lang());
    const m = l.find(x => x.code === code) || l[0];
    return (cityCache[code] = m ? m.name : code);
  } catch (e) { return code; }
}

function ticketRow(tk, q) {
  const dest = h('b', { text: tk.to });
  if (!q.to) cityName(tk.to).then(n => { dest.textContent = n === tk.to ? n : `${n} (${tk.to})`; });
  const card = h('div', { class: 'card tk' },
    h('div', { class: 'pr', text: FT.money(tk.price, q.currency) }),
    h('div', { class: 'mid' }, h('div', {}, h('b', { text: tk.from + ' → ' }), dest),
      h('div', { class: 'muted', text: [fmtDate(tk.dep), tk.airline, tk.transfers ? t('stops', { n: tk.transfers }) : t('nonstop'), tk.dur ? hm(tk.dur) : ''].filter(Boolean).join(' · ') })),
    h('div', { class: 'acts' },
      tk.link ? h('a', { class: 'btn small', href: tk.link, target: '_blank', rel: 'noopener', text: t('buy') }) : null,
      h('button', { class: 'btn ghost small', text: t('watch'), onclick: () => toggleWatchForm(card, tk, q) })));
  return card;
}

function toggleWatchForm(card, tk, q) {
  const nx = card.nextElementSibling;
  if (nx && nx.classList.contains('wf')) { nx.remove(); return; }
  const inp = h('input', { type: 'number', min: 1, value: Math.max(1, Math.floor(tk.price * 0.9)) });
  const row = h('div', { class: 'card wf' }, h('span', { class: 'small', text: t('target') + ' (' + q.currency.toUpperCase() + ')' }), inp,
    h('button', { class: 'btn small', text: t('saveWatch'), onclick: async () => {
      await addWatch(q, tk, +inp.value); row.remove(); App.toast(t('watchAdded'), 'ok');
    } }));
  card.after(row);
}

async function addWatch(q, tk, target) {
  const ws = await store.watches();
  const key = [q.from.code, q.to && q.to.code, q.date, q.ret, q.direct, q.currency].join('|');
  let w = ws.find(x => [x.from.code, x.to && x.to.code, x.date, x.ret, x.direct, x.currency].join('|') === key);
  if (!w) { w = { id: FT.uid(), from: q.from, to: q.to, date: q.date, ret: q.ret, direct: q.direct, currency: q.currency, hist: [], created: Date.now() }; ws.unshift(w); }
  w.target = target; w.notified = null;
  w.last = { price: tk.price, airline: tk.airline, dep: tk.dep, to: tk.to, link: tk.link, transfers: tk.transfers };
  w.hist = (w.hist || []).concat([[Date.now(), tk.price]]).slice(-90); w.checked = Date.now();
  await store.saveWatches(ws); await FT.badge(ws); renderTabs();
}

async function doSearch() {
  const R = $('#res'); R.innerHTML = '';
  if (!from) { App.toast(t('pickFrom'), 'err'); return; }
  if ($('#to').value.trim() && !to) { App.toast(t('pickList'), 'err'); return; }
  const dep = $('#dep').value || addDays(30);
  const q = { from, to, date: mode === 'month' ? dep.slice(0, 7) : dep, ret: $('#ret').value ? ($('#ret').value.slice(0, mode === 'month' ? 7 : 10)) : '', direct: $('#direct').checked, currency: $('#cur').value };
  const qq = { ...q, from: from.code, to: to && to.code };
  if (!cfg.token) {
    R.append(h('div', { class: 'banner' }, t('noToken')),
      h('div', { class: 'links' }, FT.deep({ ...qq, to: qq.to || 'IST' }).map(l => h('a', { class: 'btn ghost small', href: l.url, target: '_blank', rel: 'noopener', text: l.name + ' ↗' }))),
      h('div', { style: { marginTop: '8px' } }, h('button', { class: 'btn small', text: t('goSettings'), onclick: () => document.querySelector('button[data-tab=settings]').click() })));
    return;
  }
  R.append(h('div', { class: 'empty', text: t('searching') }));
  $('#go').disabled = true;
  try {
    const r = await FT.prices(qq, cfg.token);
    R.innerHTML = '';
    if (r.demo) R.append(h('div', { class: 'banner', text: t('demoBanner') }));
    if (!r.list.length) R.append(h('div', { class: 'empty', text: t('noResults') }));
    r.list.forEach(tk => R.append(ticketRow(tk, q)));
  } catch (e) { R.innerHTML = ''; R.append(h('div', { class: 'banner', text: errText(e) })); }
  $('#go').disabled = false;
}

// --- kuzatuv ---
function spark(hist) {
  const ns = 'http://www.w3.org/2000/svg', W = 84, H = 26;
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  if (!hist || hist.length < 2) return svg;
  const v = hist.map(x => x[1]), mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const pts = v.map((y, i) => `${(i / (v.length - 1) * (W - 4) + 2).toFixed(1)},${(H - 3 - (y - mn) / rg * (H - 6)).toFixed(1)}`).join(' ');
  const pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'var(--accent)'); pl.setAttribute('stroke-width', '1.6');
  svg.append(pl); return svg;
}

async function renderWatch() {
  const ws = await store.watches(), L = $('#wl'); L.innerHTML = '';
  $('#subWatch').textContent = t('tabWatch') + (ws.length ? ` (${ws.length})` : '');
  if (!ws.length) L.append(h('div', { class: 'empty', text: t('watchEmpty') }));
  const last = Math.max(0, ...ws.map(w => w.checked || 0));
  $('#chkInfo').textContent = last ? t('lastCheck') + ': ' + new Date(last).toLocaleString() : '';
  for (const w of ws) {
    const hit = w.last && w.last.price <= w.target;
    const dest = h('b', { text: `${w.from.code} → ${w.to ? w.to.code : t('anywhere')}` });
    const tg = h('input', { class: 'tg', type: 'number', min: 1, value: w.target });
    tg.addEventListener('change', async () => {
      const cur = await store.watches(), x = cur.find(y => y.id === w.id); if (!x) return;
      x.target = Math.max(1, +tg.value || 1); x.notified = null; await store.saveWatches(cur); await FT.badge(cur); renderWatch();
    });
    L.append(h('div', { class: 'card wc' + (hit ? ' hit' : '') },
      h('div', { class: 'top' }, dest, hit ? h('span', { class: 'badge ok', text: t('reached') }) : null,
        w.last && w.last.link ? h('a', { class: 'btn ghost small', href: w.last.link, target: '_blank', rel: 'noopener', text: t('buy') }) : null,
        h('button', { class: 'btn ghost small', title: t('del'), text: '✕', onclick: async () => { const cur = (await store.watches()).filter(y => y.id !== w.id); await store.saveWatches(cur); await FT.badge(cur); renderWatch(); } })),
      h('div', { class: 'small muted', text: [w.date, w.ret ? '↩ ' + w.ret : t('oneWay'), w.direct ? t('nonstop') : ''].filter(Boolean).join(' · ') }),
      h('div', { class: 'nums' },
        h('div', {}, h('span', { text: t('now') }), h('strong', { text: w.last ? FT.money(w.last.price, w.currency) : '—' })),
        h('div', {}, h('span', { text: t('targetShort') + ' (' + w.currency.toUpperCase() + ')' }), tg), spark(w.hist)),
      w.err ? h('div', { class: 'small', style: { color: 'var(--bad)' }, text: errText({ message: w.err }) }) : (!w.last && w.checked ? h('div', { class: 'small muted', text: t('noData') }) : null)));
  }
}

async function renderTabs() { await renderWatch(); }

function setSub(s) {
  document.querySelectorAll('#sub button').forEach(b => b.classList.toggle('active', b.dataset.s === s));
  $('#v-search').hidden = s !== 'search'; $('#v-watch').hidden = s !== 'watch';
  if (s === 'watch') renderWatch();
}

function fillSettings() {
  $('#token').value = cfg.token; $('#defCur').value = cfg.currency;
  const sel = $('#interval'); sel.innerHTML = '';
  [60, 180, 360, 720].forEach(m => sel.append(h('option', { value: m }, t('every', { n: m / 60 })))); sel.value = cfg.interval;
  $('#home').value = cfg.home ? cfg.home.label : '';
}

App.onReady(async () => {
  cfg = await store.cfg();
  $('#dep').value = addDays(30); $('#dep').min = today(); $('#ret').min = today();
  $('#cur').value = cfg.currency;
  if (cfg.home) { from = cfg.home; $('#from').value = cfg.home.label; }
  picker($('#from'), $('#acFrom'), p => { from = p; });
  picker($('#to'), $('#acTo'), p => { to = p; });
  let home = cfg.home; picker($('#home'), $('#acHome'), p => { home = p; });
  $('#swap').addEventListener('click', () => { const a = $('#from').value; $('#from').value = $('#to').value; $('#to').value = a; [from, to] = [to, from]; });
  $('#mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; document.querySelectorAll('#mode button').forEach(x => x.classList.toggle('active', x === b)); });
  $('#sub').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSub(b.dataset.s); });
  $('#go').addEventListener('click', doSearch);
  ['from', 'to', 'dep', 'ret'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); }));
  $('#chk').addEventListener('click', async () => {
    const b = $('#chk'); b.disabled = true; b.textContent = t('checking');
    const r = await FT.checkAll();
    b.disabled = false; b.textContent = t('checkNow');
    if (r.error) App.toast(errText({ message: r.error }), 'err'); else App.toast(t('checked'), 'ok');
    cfg = await store.cfg(); renderWatch();
  });
  fillSettings();
  $('#saveCfg').addEventListener('click', async () => {
    const hv = $('#home').value.trim();
    cfg = await store.saveCfg({ token: $('#token').value.trim(), interval: +$('#interval').value, currency: $('#defCur').value, home: hv ? home : null });
    await FT.schedule(); $('#cur').value = cfg.currency; App.toast(t('saved'), 'ok');
  });
  renderWatch();
});
App.onLang(() => { if (cfg) { fillSettings(); renderWatch(); $('#res').innerHTML = ''; } });
