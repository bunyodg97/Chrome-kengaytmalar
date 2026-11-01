const { $, h } = App;
let cfg, ws = [], last = {}, hist = {}, open = null;

const save = () => CA.set('ca_list', ws);
const alertText = a => a.type === 'above' ? `≥ ${CA.fmt(a.val)}` : a.type === 'below' ? `≤ ${CA.fmt(a.val)}` : `±${a.val}% / ${t('min', { n: a.win })}`;

function spark(points) {
  const ns = 'http://www.w3.org/2000/svg', W = 330, H = 30, svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', '100%'); svg.setAttribute('height', H);
  if (!points || points.length < 2) return svg;
  const v = points.map(p => p[1]), mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const pl = document.createElementNS(ns, 'polyline');
  pl.setAttribute('points', v.map((y, i) => `${(i / (v.length - 1) * (W - 4) + 2).toFixed(1)},${(H - 3 - (y - mn) / rg * (H - 6)).toFixed(1)}`).join(' '));
  pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', v[v.length - 1] >= v[0] ? 'var(--ok)' : 'var(--bad)'); pl.setAttribute('stroke-width', '1.6');
  svg.append(pl); return svg;
}

function alertForm(w) {
  const type = h('select', {}, h('option', { value: 'above' }, t('aAbove')), h('option', { value: 'below' }, t('aBelow')), h('option', { value: 'pct' }, t('aPct')));
  const val = h('input', { inputmode: 'decimal', placeholder: t('value') });
  const win = h('select', {}, [5, 15, 30, 60, 240].map(n => h('option', { value: n }, t('min', { n }))));
  win.value = 15; win.style.display = 'none';
  const rep = h('input', { type: 'checkbox' });
  type.addEventListener('change', () => { win.style.display = type.value === 'pct' ? '' : 'none'; val.placeholder = type.value === 'pct' ? '3 (%)' : t('value'); });
  const lp = last[CA.key(w)];
  if (lp) val.value = CA.fmt(lp.p).replace(/,/g, '');
  return h('div', { class: 'af' }, type, val, win, h('label', { class: 'small', style: { display: 'flex', gap: '4px', alignItems: 'center' } }, rep, t('repeat')),
    h('button', { class: 'btn small', text: t('save'), onclick: async () => {
      const v = CA.num(val.value); if (!(v > 0)) { App.toast(t('needVal'), 'err'); return; }
      w.alerts.push({ id: CA.uid(), type: type.value, val: v, win: +win.value, repeat: rep.checked, armed: true });
      await save(); open = null; render();
    } }));
}

function render() {
  const L = $('#list'); L.innerHTML = '';
  if (!ws.length) L.append(h('div', { class: 'empty', text: t('empty') }));
  ws.forEach(w => {
    const k = CA.key(w), pr = last[k];
    L.append(h('div', { class: 'card cc' },
      h('div', { class: 'top' }, h('div', {}, h('b', { text: w.sym }), h('div', { class: 'ex', text: w.ex })),
        h('div', { class: 'px' }, h('strong', { text: pr ? CA.fmt(pr.p) : '…' }), pr && pr.chg != null ? h('span', { class: pr.chg >= 0 ? 'pos' : 'neg', text: (pr.chg >= 0 ? '+' : '') + pr.chg.toFixed(2) + '% ' + t('chg24') }) : null),
        h('a', { class: 'btn ghost small', href: CA.url(w), target: '_blank', rel: 'noopener', title: t('open'), text: '↗' }),
        h('button', { class: 'btn ghost small', text: '✕', title: t('del'), onclick: async () => { ws = ws.filter(x => x !== w); await save(); render(); } })),
      spark(hist[k]),
      h('div', { class: 'chips' }, w.alerts.length ? w.alerts.map(a => h('span', { class: 'chip' + (a.done ? ' done' : '') },
        (a.type === 'above' ? '▲ ' : a.type === 'below' ? '▼ ' : '⚡ ') + alertText(a) + (a.repeat ? ' ↻' : ''),
        h('button', { text: '✕', onclick: async () => { w.alerts = w.alerts.filter(x => x !== a); await save(); render(); } }))) : h('span', { class: 'small muted', text: t('noAlerts') })),
      open === k ? alertForm(w) : h('button', { class: 'btn ghost small', text: t('addAlert'), onclick: () => { open = k; render(); } })));
  });
}

async function reload() {
  ws = await CA.list(); last = await CA.get('ca_last', {}); hist = await CA.get('ca_hist', {});
  const lu = Math.max(0, ...Object.values(last).map(x => x.t || 0));
  $('#upd').textContent = lu ? t('lastUpd') + ': ' + new Date(lu).toLocaleTimeString() : '';
  const err = await CA.get('ca_err', ''); $('#err').hidden = !err; $('#err').textContent = err ? t('errNet') + ' (' + err + ')' : '';
  render();
}

async function refresh() {
  const b = $('#refresh'); b.disabled = true;
  await CA.check(); await reload(); b.disabled = false;
}

async function loadSymbols() {
  const dl = $('#symlist'); dl.innerHTML = '';
  try { const l = await CA.symbols($('#ex').value); l.filter(s => /(USDT|USDC|BTC|ETH)$/.test(s)).forEach(s => dl.append(h('option', { value: s }))); } catch (e) {}
}

function fillCfg() {
  const sel = $('#interval'); sel.innerHTML = '';
  [1, 2, 5, 10].forEach(n => sel.append(h('option', { value: n }, t('every', { n })))); sel.value = cfg.interval; $('#defEx').value = cfg.ex;
}

App.onReady(async () => {
  cfg = await CA.cfg(); $('#ex').value = cfg.ex; fillCfg();
  $('#ex').addEventListener('change', loadSymbols); loadSymbols();
  $('#addSym').addEventListener('click', async () => {
    const sym = $('#sym').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), ex = $('#ex').value;
    if (!sym) return;
    try {
      const known = await CA.symbols(ex).catch(() => null);
      if (known && !known.includes(sym)) { App.toast(t('unknown'), 'err'); return; }
    } catch (e) {}
    if (!ws.some(w => w.sym === sym && w.ex === ex)) { ws.push({ id: CA.uid(), sym, ex, alerts: [] }); await save(); }
    $('#sym').value = ''; render(); refresh(); App.toast(t('added'), 'ok');
  });
  $('#sym').addEventListener('keydown', e => { if (e.key === 'Enter') $('#addSym').click(); });
  $('#refresh').addEventListener('click', refresh);
  $('#saveCfg').addEventListener('click', async () => { cfg = { ...cfg, interval: +$('#interval').value, ex: $('#defEx').value }; await CA.set('ca_cfg', cfg); await CA.schedule(); $('#ex').value = cfg.ex; App.toast(t('saved'), 'ok'); });
  await reload(); if (ws.length) refresh();
  setInterval(reload, 15000);
});
App.onLang(() => { if (cfg) { fillCfg(); render(); } });
