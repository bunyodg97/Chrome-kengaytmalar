// Umumiy holat (keyingi fayllar ham ishlatadi)
const MODS = {};
let S = null;
const FULL = location.pathname.endsWith('full.html');

MODS.calc = (() => {
  const { $, h } = App;
  const { num, fmt } = TR;
  const IDS = ['dep', 'risk', 'entry', 'sl', 'tp', 'lev', 'fee', 'pip', 'pipv'];
  const read = () => { const o = {}; IDS.forEach(i => { o[i] = num($('#c-' + i).value); }); return o; };
  const row = (k, v, cls) => h('div', { class: 'kv' }, h('span', { text: k }), h('b', { class: cls || '', text: v }));
  let last = null;

  function showMode() {
    document.querySelectorAll('#mode button').forEach(b => b.classList.toggle('active', b.dataset.m === S.mode));
    document.querySelectorAll('.only-crypto').forEach(e => { e.style.display = S.mode === 'crypto' ? '' : 'none'; });
    document.querySelectorAll('.only-nofx').forEach(e => { e.style.display = S.mode !== 'forex' ? '' : 'none'; });
    document.querySelectorAll('.only-forex').forEach(e => { e.style.display = S.mode === 'forex' ? '' : 'none'; });
  }

  function compute() {
    const v = read(), out = $('#c-out'); out.innerHTML = ''; $('#c-toj').hidden = true; last = null;
    if (!(v.dep > 0 && v.risk > 0 && v.entry > 0 && v.sl > 0 && v.entry !== v.sl)) { out.append(h('div', { class: 'empty', text: t('fillCalc') })); return; }
    const m = S.mode, long = v.sl < v.entry, dist = Math.abs(v.entry - v.sl), riskAmt = v.dep * v.risk / 100, ff = (v.fee || 0) / 100;
    const tpOk = v.tp > 0 && (long ? v.tp > v.entry : v.tp < v.entry), tpDist = tpOk ? Math.abs(v.tp - v.entry) : 0;
    const rr = tpOk ? tpDist / dist : null;
    const rows = [row(t('direction'), long ? t('long') : t('short'), long ? 'pos' : 'neg'), row(t('riskAmt'), fmt(riskAmt) + ' $')];
    let size, warn = [];
    if (m === 'forex') {
      const pip = v.pip > 0 ? v.pip : 0.0001, pv = v.pipv > 0 ? v.pipv : 10, slPips = dist / pip, lots = riskAmt / (slPips * pv);
      size = lots * 100000;
      rows.push(row(t('slPips'), fmt(slPips, 1)), row(t('lots'), fmt(lots, 2), 'pos'), row(t('size'), fmt(size, 0)));
      if (tpOk) rows.push(row(t('reward'), '+' + fmt(lots * (tpDist / pip) * pv) + ' $', 'pos'));
    } else {
      size = riskAmt / (dist + v.entry * ff * 2);
      const notional = size * v.entry, fees = notional * ff * 2;
      rows.push(row(t('size'), fmt(size, size < 1 ? 6 : 4), 'pos'), row(t('notional'), fmt(notional) + ' $'));
      if (m === 'crypto' && v.lev > 0) {
        rows.push(row(t('margin'), fmt(notional / v.lev) + ' $'));
        if (v.lev > 1) {
          const liq = long ? v.entry * (1 - 1 / v.lev + 0.005) : v.entry * (1 + 1 / v.lev - 0.005);
          rows.push(row(t('liq'), fmt(liq, 6)));
          if (long ? v.sl <= liq : v.sl >= liq) warn.push(t('slBeyondLiq'));
        }
      }
      if (fees > 0) rows.push(row(t('fees'), fmt(fees) + ' $'));
      if (tpOk) rows.push(row(t('reward'), '+' + fmt(size * tpDist - fees) + ' $', 'pos'));
    }
    if (rr != null) { rows.push(row(t('rr'), '1 : ' + fmt(rr, 2), rr >= 2 ? 'pos' : rr < 1 ? 'neg' : '')); if (rr < 1) warn.push(t('rrLow')); }
    rows.forEach(r => out.append(r));
    warn.forEach(w => out.append(h('div', { class: 'banner warn', style: { marginTop: '8px' }, text: w })));
    last = { side: long ? 'long' : 'short', entry: v.entry, size, risk: riskAmt };
    $('#c-toj').hidden = false;
  }

  async function save() {
    const v = read();
    const p = { mode: S.mode };
    [['dep', 'dep'], ['risk', 'riskPct'], ['lev', 'lev'], ['fee', 'fee'], ['pip', 'pip'], ['pipv', 'pipv']].forEach(([a, b]) => { if (isFinite(v[a])) p[b] = v[a]; });
    S = await TR.saveSettings(p);
  }

  function fill() {
    $('#c-dep').value = S.dep; $('#c-risk').value = S.riskPct; $('#c-lev').value = S.lev; $('#c-fee').value = S.fee; $('#c-pip').value = S.pip; $('#c-pipv').value = S.pipv;
    showMode(); compute();
  }

  function init() {
    fill();
    IDS.forEach(i => $('#c-' + i).addEventListener('input', () => { compute(); clearTimeout(init.tm); init.tm = setTimeout(save, 300); }));
    $('#mode').addEventListener('click', async e => { const b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.m; showMode(); compute(); await save(); });
    $('#c-toj').addEventListener('click', () => { if (last) { MODS.journal.prefill(last); document.querySelector('#sub [data-s=journal]').click(); } });
  }
  return { init, fill, render: compute };
})();
