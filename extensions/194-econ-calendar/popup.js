const { $, h } = App;
let cfg, evs = [], lang = 'uz', timer = 0, stale = false;
const CUR = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'];
const saveCfg = () => EC.set('ec_cfg', cfg);

const startOf = d => { d = new Date(d); d.setHours(0, 0, 0, 0); return d.getTime(); };
function inRange() {
  const t0 = startOf(Date.now()), day = 864e5;
  const [a, b] = { today: [t0, t0 + day], tomorrow: [t0 + day, t0 + 2 * day], week: [t0, t0 + 7 * day], next: [t0 + 7 * day, t0 + 14 * day] }[cfg.range];
  return e => e.ts >= a && e.ts < b;
}
const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? t('inH', { h: Math.floor(m / 60), m: m % 60 }) : t('inM', { m }); };

function renderNext() {
  const now = Date.now(), nx = evs.find(e => e.ts > now && e.impact === 'High' && EC_match(e)), box = $('#next'); box.innerHTML = '';
  if (!nx) { box.append(h('span', { class: 'muted', text: t('nextNone') })); return; }
  box.append(h('span', { class: 'small muted', text: t('nextNews') }), h('b', { text: `${nx.country} · ${nx.title}` }), h('span', { class: 'cd', text: dur(nx.ts - now) }),
    h('span', { class: 'small muted', text: '  ' + new Date(nx.ts).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) }));
}
const EC_match = e => EC.matchCur(cfg, e);

function render() {
  document.querySelectorAll('#range button').forEach(b => b.classList.toggle('on', false) || b.classList.toggle('active', b.dataset.r === cfg.range));
  const ib = $('#imps'); ib.innerHTML = '';
  ['High', 'Medium', 'Low'].forEach(i => ib.append(h('button', { class: 'chipb' + (cfg.imp.includes(i) ? ' on' : ''), text: t(i), onclick: async () => { cfg.imp = cfg.imp.includes(i) ? cfg.imp.filter(x => x !== i) : [...cfg.imp, i]; await saveCfg(); render(); } })));
  const cb = $('#curs'); cb.innerHTML = '';
  CUR.forEach(c => cb.append(h('button', { class: 'chipb' + (cfg.cur.includes(c) ? ' on' : ''), text: c, onclick: async () => { cfg.cur = cfg.cur.includes(c) ? cfg.cur.filter(x => x !== c) : [...cfg.cur, c]; await saveCfg(); render(); } })));
  if (!cfg.cur.length) cb.append(h('span', { class: 'small muted', text: t('allCur') }));
  const rg = inRange(), now = Date.now(), L = $('#list'); L.innerHTML = '';
  const rows = evs.filter(e => rg(e) && (cfg.imp.includes(e.impact) || (e.impact === 'Holiday')) && EC_match(e));
  if (!rows.length) L.append(h('div', { class: 'empty', text: t('empty') }));
  let day = '';
  rows.forEach(e => {
    const d = new Date(e.ts).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    if (d !== day) { day = d; L.append(h('div', { class: 'day', text: d })); }
    const k = EC.evKey(e), g = EC.gloss(e.title, lang), on = !!cfg.bells[k];
    const nums = [e.actual ? `${t('actual')}: ${e.actual}` : '', e.forecast ? `${t('forecast')}: ${e.forecast}` : '', e.previous ? `${t('previous')}: ${e.previous}` : ''].filter(Boolean).join(' · ');
    L.append(h('div', { class: 'ev' + (e.ts < now ? ' past' : '') },
      h('div', { class: 'tm', text: new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),
      h('span', { class: 'dot ' + e.impact }), h('div', { class: 'c', text: e.country }),
      h('div', { class: 'm' }, h('div', { text: e.title }), g ? h('small', { text: g }) : null, nums ? h('div', { class: 'nums muted', text: nums }) : null),
      e.ts > now ? h('button', { class: 'bell' + (on ? ' on' : ''), title: t('bell'), text: '🔔', onclick: async () => { if (on) delete cfg.bells[k]; else cfg.bells[k] = e.ts; await saveCfg(); render(); } }) : null));
  });
  renderNext();
}

async function loadData(force) {
  const r = await EC.load(force);
  evs = EC.all(r.d); stale = !r.ok;
  $('#err').hidden = r.ok; $('#err').textContent = r.ok ? '' : (r.d ? t('stale') : t('errNet'));
  $('#upd').textContent = r.d ? t('upd') + ': ' + new Date(r.d.t).toLocaleTimeString() : '';
  render();
}

App.onReady(async () => {
  cfg = await EC.cfg(); lang = await EC.lang();
  // eskirgan eslatmalarni tozalash
  const now = Date.now(); Object.keys(cfg.bells).forEach(k => { if (cfg.bells[k] < now - 864e5) delete cfg.bells[k]; });
  document.querySelectorAll('#range button').forEach(b => b.addEventListener('click', async () => { cfg.range = b.dataset.r; await saveCfg(); render(); }));
  $('#refresh').addEventListener('click', e => { e.preventDefault(); loadData(true); });
  const sel = $('#remind'); [5, 10, 15, 30, 60].forEach(n => sel.append(h('option', { value: n }, t('min', { n })))); sel.value = cfg.remind; $('#auto').value = cfg.auto;
  $('#saveCfg').addEventListener('click', async () => { cfg.remind = +sel.value; cfg.auto = $('#auto').value; await saveCfg(); EC.tick(); App.toast(t('saved'), 'ok'); });
  await loadData(false); EC.tick();
  timer = setInterval(renderNext, 15000);
});
App.onLang(async () => { if (cfg) { lang = await EC.lang(); const sel = $('#remind'), v = sel.value; sel.innerHTML = ''; [5, 10, 15, 30, 60].forEach(n => sel.append(h('option', { value: n }, t('min', { n })))); sel.value = v; render(); } });
