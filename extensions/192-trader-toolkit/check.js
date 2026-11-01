MODS.check = (() => {
  const { $, h } = App;
  const { num, fmt, sgn } = TR;
  const DEFAULT = ['stop', 'risk', 'rr', 'news', 'trend', 'calm'];
  let ck = null;

  const text = it => it.txt || t('ck_' + it.k);
  async function load() {
    ck = await TR.get('tr_check', null);
    if (!ck) ck = { items: DEFAULT.map(k => ({ id: k, k })), done: {} };
  }
  const save = () => TR.set('tr_check', ck);

  async function renderLimit() {
    const L = await TR.limit(), box = $('#k-lim'); box.innerHTML = '';
    const cls = L.stop || L.stopTr ? 'bad' : L.warn ? 'warn' : 'ok';
    box.append(h('div', { class: 'banner ' + cls },
      h('div', { text: L.stop ? t('stopMsg') : L.stopTr ? t('stopTr') : L.warn ? t('limWarn') : t('limOk') }),
      h('div', { class: 'small', style: { marginTop: '4px' }, text: `${t('todayPnl')}: ${sgn(L.pnl)} · ${t('todayTr')}: ${L.count}${S.maxTr > 0 ? ' / ' + S.maxTr : ''} · ${t('limVal')}: ${fmt(L.lim)}` }),
      h('div', { class: 'prog' }, h('i', { style: { width: Math.min(100, L.used * 100) + '%', background: L.stop ? 'var(--bad)' : L.warn ? 'var(--warn)' : 'var(--ok)' } }))));
    const b = $('#tCheckBtn'); b.textContent = (L.stop || L.stopTr ? '⛔ ' : '') + t('tCheck');
  }

  function render() {
    if (!ck) return;
    renderLimit();
    const box = $('#k-items'); box.innerHTML = '';
    ck.items.forEach(it => {
      const cb = h('input', { type: 'checkbox' }); cb.checked = !!ck.done[it.id];
      cb.addEventListener('change', async () => { ck.done[it.id] = cb.checked; await save(); renderResult(); });
      box.append(h('div', { class: 'ck' }, cb, h('span', { text: text(it) }),
        h('button', { class: 'btn ghost small', text: '✕', onclick: async () => { ck.items = ck.items.filter(x => x.id !== it.id); delete ck.done[it.id]; await save(); render(); } })));
    });
    renderResult();
  }
  function renderResult() {
    const left = ck.items.filter(i => !ck.done[i.id]).length, r = $('#k-res');
    r.className = 'banner ' + (left ? 'warn' : 'ok'); r.textContent = ck.items.length && !left ? t('ckAllOk') : t('ckLeft', { n: left });
  }

  async function saveLimit() {
    S = await TR.saveSettings({ dep: num($('#k-dep').value) || S.dep, limType: $('#k-type').value, limVal: num($('#k-val').value) || 0, maxTr: Math.max(0, parseInt($('#k-max').value) || 0) });
    TR.updateBadge(); renderLimit(); MODS.calc.fill();
  }
  function fillLimit() { $('#k-dep').value = S.dep; $('#k-type').value = S.limType; $('#k-val').value = S.limVal; $('#k-max').value = S.maxTr; }

  async function init() {
    await load(); fillLimit();
    ['k-dep', 'k-val', 'k-max'].forEach(id => $('#' + id).addEventListener('input', saveLimit)); $('#k-type').addEventListener('change', saveLimit);
    $('#k-add').addEventListener('click', async () => { const v = $('#k-new').value.trim(); if (!v) return; ck.items.push({ id: TR.uid(), txt: v }); $('#k-new').value = ''; await save(); render(); });
    $('#k-new').addEventListener('keydown', e => { if (e.key === 'Enter') $('#k-add').click(); });
    $('#k-reset').addEventListener('click', async () => { ck.done = {}; await save(); render(); });
    render();
  }
  return { init, render, fillLimit };
})();
