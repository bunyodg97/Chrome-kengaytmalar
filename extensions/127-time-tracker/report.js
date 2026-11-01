const { $, $$, h } = App;
let data;
const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const isoDT = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

function range() {
  const f = new Date($('#from').value + 'T00:00').getTime();
  const tt = new Date($('#to').value + 'T23:59:59').getTime();
  return [f, tt];
}
function filtered() {
  const [f, tt] = range();
  const p = $('#proj').value;
  return data.entries.filter(e => e.s <= tt && e.e >= f && (!p || e.p === p)).sort((a, b) => b.s - a.s);
}
const pr = id => data.projects.find(x => x.id === id) || { name: '?', rate: 0, cur: '' };

function totals(list) {
  const by = {};
  list.forEach(e => { const p = pr(e.p); const b = by[e.p] || (by[e.p] = { p, ms: 0 }); b.ms += e.e - e.s; });
  return Object.values(by);
}

async function render() {
  data = await TT.load();
  const sel = $('#proj'), cur = sel.value;
  sel.innerHTML = ''; sel.append(h('option', { value: '' }, t('all')));
  data.projects.forEach(p => sel.append(h('option', { value: p.id }, p.name)));
  sel.value = cur;
  const eP = $('#eP'), ecur = eP.value; eP.innerHTML = '';
  data.projects.forEach(p => eP.append(h('option', { value: p.id }, p.name))); if (ecur) eP.value = ecur;
  const list = filtered();
  const tot = totals(list);
  const S = $('#sum'); S.innerHTML = '';
  const ms = tot.reduce((a, x) => a + x.ms, 0);
  S.append(h('div', { class: 'stat card' }, h('b', { text: TT.dur(ms) }), h('span', { text: t('total') })));
  tot.forEach(x => S.append(h('div', { class: 'stat card', style: { borderLeft: '4px solid ' + x.p.color } }, h('b', { text: TT.dur(x.ms) }),
    h('span', { text: x.p.name + (x.p.rate ? ' · ' + TT.money(x.ms / 36e5 * x.p.rate, x.p.cur) : '') }))));
  const R = $('#rows'); R.innerHTML = '';
  if (!list.length) R.append(h('tr', {}, h('td', { colspan: 6, class: 'empty', text: t('empty') })));
  for (const e of list) {
    const note = h('input', { value: e.note || '' });
    note.addEventListener('change', async () => { e.note = note.value; await TT.save({ entries: data.entries }); });
    R.append(h('tr', {}, h('td', {}, h('span', { style: { color: pr(e.p).color }, text: '● ' }), pr(e.p).name),
      h('td', { text: new Date(e.s).toLocaleString() }), h('td', { text: new Date(e.e).toLocaleTimeString() }),
      h('td', { class: 'num mono', text: TT.dur(e.e - e.s) }), h('td', {}, note),
      h('td', {}, h('button', { class: 'btn ghost small', text: '✕', onclick: async () => { data.entries = data.entries.filter(x => x.id !== e.id); await TT.save({ entries: data.entries }); render(); } }))));
  }
}

function invoice() {
  const list = filtered();
  const tot = totals(list);
  const curs = [...new Set(tot.map(x => x.p.cur))];
  const rows = tot.map(x => { const hrs = Math.round(x.ms / 36e5 * 100) / 100; return { d: x.p.name, hrs, rate: x.p.rate || 0, cur: x.p.cur, sum: hrs * (x.p.rate || 0) }; });
  const [f, tt] = range();
  const B = $('#invBody'); B.innerHTML = '';
  B.append(h('h2', { text: t('invoiceTitle') + ' ' + t('invNo') + ' ' + $('#invNo').value }),
    h('div', { text: t('date') + ': ' + new Date().toLocaleDateString() + ' · ' + new Date(f).toLocaleDateString() + ' — ' + new Date(tt).toLocaleDateString() }),
    h('div', { class: 'inv-head' }, h('div', {}, h('b', { text: t('provider') }), h('div', { text: $('#provider').value })), h('div', {}, h('b', { text: t('client') }), h('div', { text: $('#client').value }))),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', { text: t('desc') }), h('th', { class: 'n', text: t('qty') }), h('th', { class: 'n', text: t('price') }), h('th', { class: 'n', text: t('sum') }))),
      h('tbody', {}, rows.map(r => h('tr', {}, h('td', { text: r.d }), h('td', { class: 'n', text: r.hrs.toFixed(2) }), h('td', { class: 'n', text: TT.money(r.rate, r.cur) }), h('td', { class: 'n', text: TT.money(r.sum, r.cur) }))),
        curs.map(c => h('tr', { class: 'tot' }, h('td', { text: t('total') }), h('td', { class: 'n', text: rows.filter(r => r.cur === c).reduce((a, r) => a + r.hrs, 0).toFixed(2) }), h('td', {}), h('td', { class: 'n', text: TT.money(rows.filter(r => r.cur === c).reduce((a, r) => a + r.sum, 0), c) }))))));
}

function setMonth(off) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + off);
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  $('#from').value = iso(d); $('#to').value = iso(e); render();
}

App.onReady(async () => {
  setMonth(0);
  const inv = await App.get('inv', { provider: '', client: '', no: 1 });
  $('#provider').value = inv.provider; $('#client').value = inv.client; $('#invNo').value = inv.no;
  ['from', 'to', 'proj'].forEach(id => $('#' + id).addEventListener('change', render));
  $$('[data-q]').forEach(b => b.addEventListener('click', () => setMonth(b.dataset.q === 'last' ? -1 : 0)));
  $('#eS').value = isoDT(Date.now() - 36e5); $('#eE').value = isoDT(Date.now());
  $('#addE').addEventListener('submit', async e => {
    e.preventDefault();
    const s = new Date($('#eS').value).getTime(), en = new Date($('#eE').value).getTime();
    if (!$('#eP').value || !(en > s)) return;
    data.entries.push({ id: TT.uid(), p: $('#eP').value, s, e: en, note: $('#eN').value });
    await TT.save({ entries: data.entries }); $('#eN').value = ''; render();
  });
  $('#csv').addEventListener('click', () => {
    const lines = ['project,start,end,hours,rate,currency,amount,note'];
    filtered().forEach(e => { const p = pr(e.p); const hrs = (e.e - e.s) / 36e5; lines.push(['"' + p.name + '"', new Date(e.s).toISOString(), new Date(e.e).toISOString(), hrs.toFixed(2), p.rate || 0, p.cur, (hrs * (p.rate || 0)).toFixed(2), '"' + (e.note || '').replace(/"/g, '""') + '"'].join(',')); });
    App.download(`vaqt-${$('#from').value}_${$('#to').value}.csv`, '﻿' + lines.join('\n'), 'text/csv');
  });
  $('#inv').addEventListener('click', () => { $('#invoice').classList.remove('hidden'); invoice(); $('#invoice').scrollIntoView(); });
  ['provider', 'client', 'invNo'].forEach(id => $('#' + id).addEventListener('input', () => { App.set('inv', { provider: $('#provider').value, client: $('#client').value, no: $('#invNo').value }); invoice(); }));
  $('#print').addEventListener('click', () => window.print());
  $('#closeInv').addEventListener('click', () => $('#invoice').classList.add('hidden'));
  render();
});
App.onLang(() => { render(); if (!$('#invoice').classList.contains('hidden')) invoice(); });
