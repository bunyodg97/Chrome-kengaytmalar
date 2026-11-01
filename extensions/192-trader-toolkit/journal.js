MODS.journal = (() => {
  const { $, h } = App;
  const { num, fmt, sgn } = TR;
  let all = [], editing = null, armed = null;

  const pc = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
  const nowLocal = ts => { const d = new Date(ts || Date.now()); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

  function filtered() {
    const tag = $('#j-ftag').value, f = $('#j-from').value ? new Date($('#j-from').value + 'T00:00').getTime() : 0, to = $('#j-to').value ? new Date($('#j-to').value + 'T23:59:59').getTime() : Infinity;
    return all.filter(x => (!tag || x.tag === tag) && x.t >= f && x.t <= to);
  }

  function chart(curve) {
    const box = $('#j-eq'); box.innerHTML = '';
    if (curve.length < 2) return;
    const W = FULL ? 720 : 356, H = FULL ? 130 : 70, ns = 'http://www.w3.org/2000/svg';
    const ys = [0, ...curve.map(c => c[1])], mn = Math.min(...ys), mx = Math.max(...ys), rg = mx - mn || 1;
    const X = i => 4 + i / (curve.length - 1) * (W - 8), Y = v => H - 6 - (v - mn) / rg * (H - 12);
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', '100%'); svg.setAttribute('height', H);
    const mk = (tag, a) => { const e = document.createElementNS(ns, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
    svg.append(mk('line', { x1: 0, x2: W, y1: Y(0), y2: Y(0), stroke: 'var(--line)', 'stroke-dasharray': '3 3' }));
    const pts = curve.map((c, i) => `${X(i).toFixed(1)},${Y(c[1]).toFixed(1)}`).join(' ');
    const up = curve[curve.length - 1][1] >= 0;
    svg.append(mk('polygon', { points: `${X(0)},${Y(0)} ${pts} ${X(curve.length - 1)},${Y(0)}`, fill: up ? 'var(--ok)' : 'var(--bad)', opacity: .12 }));
    svg.append(mk('polyline', { points: pts, fill: 'none', stroke: up ? 'var(--ok)' : 'var(--bad)', 'stroke-width': 2 }));
    box.append(h('div', { class: 'small muted', text: t('equity') }), svg);
  }

  function render() {
    const list = filtered(), s = TR.stats(list);
    const tile = (k, v, c) => h('div', {}, h('span', { text: t(k) }), h('b', { class: c || '', text: v }));
    const tiles = [tile('stTrades', s.n), tile('stWin', fmt(s.win * 100, 1) + '%'), tile('stPnl', sgn(s.total), pc(s.total)), tile('stPf', s.pf === Infinity ? '∞' : fmt(s.pf, 2)), tile('stExp', sgn(s.exp), pc(s.exp)), tile('stDD', '-' + fmt(s.dd), s.dd ? 'neg' : '')];
    if (FULL) tiles.push(tile('stAvgW', fmt(s.avgW), 'pos'), tile('stAvgL', fmt(s.avgL), 'neg'), tile('stAvgR', s.avgR == null ? '—' : fmt(s.avgR, 2)), tile('stBest', sgn(s.best), 'pos'), tile('stWorst', sgn(s.worst), 'neg'));
    const st = $('#j-stats'); st.innerHTML = ''; st.append(h('div', { class: 'st' }, tiles));
    chart(s.curve);
    // teglar
    const tags = [...new Set(all.map(x => x.tag).filter(Boolean))].sort(), fs = $('#j-ftag'), cur = fs.value;
    fs.innerHTML = ''; fs.append(h('option', { value: '' }, t('allTags'))); tags.forEach(x => fs.append(h('option', { value: x }, x))); fs.value = tags.includes(cur) ? cur : '';
    const dl = $('#j-tags'); dl.innerHTML = ''; tags.forEach(x => dl.append(h('option', { value: x })));
    const L = $('#j-list'); L.innerHTML = '';
    const rows = [...list].sort((a, b) => b.t - a.t).slice(0, FULL ? 1000 : 8);
    if (!rows.length) L.append(h('div', { class: 'empty', text: t('noTrades') }));
    rows.forEach(x => {
      const del = h('button', { class: 'btn ghost small', text: '✕', title: t('delTrade') });
      del.addEventListener('click', async () => {
        if (armed !== x.id) { armed = x.id; del.textContent = '✓?'; del.classList.add('danger'); setTimeout(() => { if (armed === x.id) { armed = null; del.textContent = '✕'; del.classList.remove('danger'); } }, 3000); return; }
        all = all.filter(y => y.id !== x.id); armed = null; await TR.saveTrades(all); render(); MODS.check.render();
      });
      L.append(h('div', { class: 'tr' },
        h('div', { class: 'm' }, h('b', { text: (x.sym || '—') + ' ' }), h('span', { class: 'badge ' + (x.side === 'long' ? 'ok' : 'bad'), text: x.side === 'long' ? 'L' : 'S' }),
          h('small', { text: [new Date(x.t).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }), x.tag, x.r != null ? fmt(x.r, 2) + 'R' : '', x.note].filter(Boolean).join(' · ') })),
        h('div', { class: 'p ' + pc(x.pnl), text: sgn(x.pnl) }),
        h('button', { class: 'btn ghost small', text: '✎', title: t('editTrade'), onclick: () => edit(x) }), del));
    });
  }

  const F = ['sym', 'side', 'entry', 'exit', 'size', 'fee', 'risk', 'pnl', 'tag', 'date', 'note'];
  function clearForm() { F.forEach(i => { $('#j-' + i).value = i === 'side' ? 'long' : ''; }); $('#j-date').value = nowLocal(); editing = null; $('#j-save').textContent = t('save'); $('#j-cancel').hidden = true; }
  function edit(x) {
    editing = x.id; $('#j-form').open = true;
    $('#j-sym').value = x.sym || ''; $('#j-side').value = x.side; $('#j-entry').value = isFinite(x.entry) ? x.entry : ''; $('#j-exit').value = isFinite(x.exit) ? x.exit : '';
    $('#j-size').value = isFinite(x.size) ? x.size : ''; $('#j-fee').value = x.fee || ''; $('#j-risk').value = x.risk || ''; $('#j-pnl').value = x.pnl; $('#j-tag').value = x.tag || ''; $('#j-note').value = x.note || ''; $('#j-date').value = nowLocal(x.t);
    $('#j-save').textContent = t('update'); $('#j-cancel').hidden = false; $('#j-form').scrollIntoView({ block: 'nearest' });
  }
  function prefill(c) { clearForm(); $('#j-form').open = true; $('#j-side').value = c.side; $('#j-entry').value = c.entry; $('#j-size').value = +c.size.toPrecision(6); $('#j-risk').value = +c.risk.toFixed(2); }

  async function save() {
    const entry = num($('#j-entry').value), exit = num($('#j-exit').value), size = num($('#j-size').value), fee = num($('#j-fee').value) || 0, risk = num($('#j-risk').value);
    const side = $('#j-side').value; let pnl = num($('#j-pnl').value);
    if (!isFinite(pnl)) { if (!(entry > 0 && exit > 0 && size > 0)) { App.toast(t('needData'), 'err'); return; } pnl = (exit - entry) * size * (side === 'long' ? 1 : -1) - fee; }
    pnl = Math.round(pnl * 100) / 100;
    const tr = { id: editing || TR.uid(), t: new Date($('#j-date').value || Date.now()).getTime(), sym: $('#j-sym').value.trim().toUpperCase(), side, entry, exit, size, fee, risk: risk > 0 ? risk : null, pnl, r: risk > 0 ? pnl / risk : null, tag: $('#j-tag').value.trim(), note: $('#j-note').value.trim() };
    all = editing ? all.map(x => (x.id === editing ? tr : x)) : [...all, tr];
    await TR.saveTrades(all); clearForm(); $('#j-form').open = false; render(); MODS.check.render(); App.toast(t('saved'), 'ok');
  }

  async function init() {
    all = await TR.trades();
    clearForm();
    $('#j-save').addEventListener('click', save); $('#j-cancel').addEventListener('click', clearForm);
    ['j-ftag', 'j-from', 'j-to'].forEach(id => $('#' + id).addEventListener('change', render));
    $('#j-exp').addEventListener('click', () => App.download(`savdolar-${TR.dayKey(Date.now())}.csv`, TR.toCsv(filtered()), 'text/csv'));
    $('#j-imp').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      const add = TR.fromCsv(await f.text()); all = [...all, ...add]; await TR.saveTrades(all); e.target.value = '';
      render(); MODS.check.render(); App.toast(t('imported', { n: add.length }), 'ok');
    });
    render();
  }
  return { init, render, prefill, reload: async () => { all = await TR.trades(); render(); } };
})();
