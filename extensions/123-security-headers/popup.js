const { $, h } = App;
let result = null;

async function run() {
  const tab = await App.tab();
  if (!/^https?:/.test(tab.url || '')) return App.toast(t('cantRunHere'), 'err');
  try {
    await App.requestOrigin(tab.url);
    const r = await fetch(tab.url, { credentials: 'omit', cache: 'no-store', redirect: 'follow' });
    const all = {};
    r.headers.forEach((v, k) => { all[k] = v; });
    result = { url: tab.url, final: r.url, https: r.url.startsWith('https:'), all, status: r.status };
    render();
  } catch (e) { App.toast(e.message, 'err'); }
}

function render() {
  if (!result) return;
  const { all, https } = result;
  const ru = I18N.lang === 'ru';
  let score = 0, max = 0;
  const rows = CHECKS.map(c => {
    const [st, uz, rus, part] = c.run(all[c.h], https, all);
    if (!(st === 'info' && c.h === 'strict-transport-security' && !https)) max += c.w;
    score += st === 'ok' ? c.w : (part || 0) * c.w;
    return { c, st, text: ru ? rus : uz };
  });
  const leaks = LEAKS.filter(k => all[k] && /\d|php|asp|express|nginx|apache|iis/i.test(all[k]));
  let pct = Math.round(score / max * 100) - leaks.length * 3;
  pct = Math.max(0, Math.min(100, pct));
  const g = grade(pct);
  const col = g.startsWith('A') ? '#2b8a3e' : g === 'B' ? '#5c940d' : g === 'C' ? '#e67700' : '#c92a2a';
  const O = $('#out'); O.innerHTML = '';
  O.append(h('div', { class: 'gr' }, h('div', { class: 'g', style: { background: col }, text: g }),
    h('div', {}, h('b', { text: t('grade') + ': ' + pct + '/100' }), h('div', { class: 'small muted url', text: result.final !== result.url ? t('redirect', { u: result.final }) : 'HTTP ' + result.status }))));
  const icon = { ok: '✓', warn: '!', bad: '✕', info: 'i' };
  const list = h('div');
  rows.forEach(({ c, st, text }) => list.append(h('div', { class: 'hd' }, h('span', { class: 'i ' + st, text: icon[st] }),
    h('div', { class: 'grow' }, h('b', { text: c.h }), h('div', { class: 'small', text }), all[c.h] ? h('div', { class: 'v', title: all[c.h], text: all[c.h] }) : ''))));
  O.append(list);
  if (leaks.length) O.append(h('div', { class: 'card small' }, h('b', { text: t('leaks') }), h('div', { class: 'mono', text: leaks.map(k => k + ': ' + all[k]).join('\n'), style: { whiteSpace: 'pre-wrap' } }), h('div', { class: 'muted', text: t('leakNote') })));
  const sel = h('select', { style: { width: 'auto' } }, Object.keys(SAMPLES).map(k => h('option', { value: k }, k)));
  const pre = h('pre', { class: 'out', text: SAMPLES.Nginx });
  sel.addEventListener('change', () => { pre.textContent = SAMPLES[sel.value]; });
  O.append(h('details', {}, h('summary', { class: 'small', text: t('samples') }), h('div', { class: 'row', style: { margin: '6px 0' } }, sel, h('button', { class: 'btn ghost small', text: t('copy'), onclick: () => App.copy(pre.textContent) })), pre));
  O.append(h('details', {}, h('summary', { class: 'small', text: t('raw') }), h('pre', { class: 'out', text: Object.entries(all).map(([k, v]) => k + ': ' + v).join('\n') })));
  O.append(h('p', { class: 'note', text: t('note') }));
}

App.onReady(async () => {
  const tab = await App.tab();
  $('#site').textContent = tab && tab.url ? new URL(tab.url).host || tab.url : '';
  $('#check').addEventListener('click', run);
});
App.onLang(render);
