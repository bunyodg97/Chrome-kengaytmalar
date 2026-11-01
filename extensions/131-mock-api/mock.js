const { $, h } = App;
let routes = [], cur = null;
const EX = { method: 'GET', url: '/api/users', status: 200, delay: 300, on: true, body: JSON.stringify({ data: { __repeat: 5, item: { id: '{{id}}', name: '{{name}}', email: '{{email}}', phone: '{{phone}}', city: '{{city}}', active: '{{bool}}', created: '{{date 90}}' } }, total: 5 }, null, 2) };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const save = () => App.set('routes', routes);

async function sites() {
  const regs = (await chrome.scripting.getRegisteredContentScripts()).filter(r => r.id.startsWith('mk_m_'));
  const S = $('#sites'); S.innerHTML = '';
  if (!regs.length) S.append(h('div', { class: 'small muted', text: t('noSites') }));
  regs.forEach(r => {
    const o = r.matches[0].replace(/\/\*$/, '');
    S.append(h('div', { class: 'row' }, h('span', { class: 'grow mono small', text: o }),
      h('button', { class: 'btn ghost small', text: '✕', onclick: async () => { await chrome.scripting.unregisterContentScripts({ ids: [r.id, r.id.replace('mk_m_', 'mk_b_')] }).catch(() => {}); sites(); } })));
  });
}
async function addSite() {
  let v = $('#site').value.trim();
  if (!v) return;
  if (!/^https?:\/\//.test(v)) v = 'http://' + v;
  try {
    const o = new URL(v).origin;
    await App.requestOrigin(o);
    const key = o.replace(/[^a-z0-9]/gi, '_');
    const matches = [o + '/*'];
    const all = (await chrome.scripting.getRegisteredContentScripts()).map(r => r.id);
    const ids = ['mk_m_' + key, 'mk_b_' + key].filter(x => all.includes(x));
    if (ids.length) await chrome.scripting.unregisterContentScripts({ ids });
    await chrome.scripting.registerContentScripts([
      { id: 'mk_m_' + key, matches, js: ['mockgen.js', 'mock-main.js'], runAt: 'document_start', world: 'MAIN', persistAcrossSessions: true },
      { id: 'mk_b_' + key, matches, js: ['mock-bridge.js'], runAt: 'document_start', persistAcrossSessions: true }
    ]);
    $('#site').value = '';
    sites();
  } catch (e) { App.toast(e.message, 'err'); }
}

function list() {
  const L = $('#routes'); L.innerHTML = '';
  if (!routes.length) L.append(h('div', { class: 'empty small', text: t('none') }));
  routes.forEach(r => {
    const cb = h('input', { type: 'checkbox' }); cb.checked = r.on;
    cb.addEventListener('click', e => e.stopPropagation());
    cb.addEventListener('change', () => { r.on = cb.checked; save(); list(); });
    L.append(h('div', { class: 'ri' + (r.id === cur ? ' on' : '') + (r.on ? '' : ' off'), onclick: () => { cur = r.id; list(); editor(); } },
      cb, h('span', { class: 'm', text: r.method }), h('span', { class: 'u', text: r.url }), h('span', { class: 'badge', text: r.status })));
  });
}

function editor() {
  const E = $('#editor'); E.innerHTML = '';
  const r = routes.find(x => x.id === cur);
  if (!r) { E.append(h('div', { class: 'empty', text: t('none') })); return; }
  const method = h('select', { style: { width: 'auto' } }, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', '*'].map(m => h('option', { value: m }, m)));
  method.value = r.method;
  const url = h('input', { class: 'mono', value: r.url });
  const status = h('input', { type: 'number', value: r.status, style: { width: '80px' } });
  const delay = h('input', { type: 'number', value: r.delay || 0, style: { width: '90px' } });
  const body = h('textarea', { spellcheck: 'false' }); body.value = r.body || '';
  const pv = h('pre', { class: 'out', id: 'pv' });
  const err = h('div', { class: 'small', style: { color: 'var(--bad)' } });
  const preview = () => {
    try { JSON.parse(body.value || 'null'); err.textContent = ''; } catch (e) { err.textContent = t('badJson', { e: e.message }); }
    try { pv.textContent = MockGen.render(body.value, { id: '42' }, 'https://example.com' + r.url.replace(/:(\w+)/g, '42') + '?page=1', { name: 'Test' }); } catch (e) { pv.textContent = e.message; }
  };
  const upd = () => { Object.assign(r, { method: method.value, url: url.value.trim(), status: +status.value || 200, delay: +delay.value || 0, body: body.value }); save(); list(); preview(); };
  [method, url, status, delay].forEach(x => x.addEventListener('change', upd));
  let tm; body.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(upd, 300); });
  body.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); body.setRangeText('  ', body.selectionStart, body.selectionEnd, 'end'); } });
  E.append(
    h('div', { class: 'row' }, h('div', { class: 'field' }, h('label', { text: t('method') }), method), h('div', { class: 'field grow' }, h('label', { text: t('url') }), url),
      h('div', { class: 'field' }, h('label', { text: t('status') }), status), h('div', { class: 'field' }, h('label', { text: t('delay') }), delay)),
    h('div', { class: 'note', text: t('urlHint') }),
    h('div', { class: 'ed-cols' },
      h('div', {}, h('div', { class: 'row' }, h('b', { class: 'grow', text: t('body') }), h('button', { class: 'btn ghost small', text: '{ }', title: 'Format', onclick: () => { try { body.value = JSON.stringify(JSON.parse(body.value), null, 2); upd(); } catch (e) {} } })), body, err),
      h('div', {}, h('div', { class: 'row' }, h('b', { class: 'grow', text: t('preview') }), h('button', { class: 'btn ghost small', text: '↻ ' + t('regenerate'), onclick: preview }), h('button', { class: 'btn ghost small', text: t('copy'), onclick: () => App.copy(pv.textContent) })), pv)),
    h('details', {}, h('summary', { class: 'small', text: t('help') }), h('p', { class: 'small mono', text: t('helpText') })),
    h('div', { class: 'row end' }, h('button', { class: 'btn danger small', text: t('delete'), onclick: () => { routes = routes.filter(x => x !== r); cur = routes[0] && routes[0].id; save(); list(); editor(); } })));
  preview();
}

App.onReady(async () => {
  routes = await App.get('routes', null);
  if (!routes) { routes = [Object.assign({ id: uid() }, EX)]; save(); }
  cur = routes[0] && routes[0].id;
  const m = location.hash.match(/origin=([^&]+)/);
  if (m) $('#site').value = decodeURIComponent(m[1]);
  $('#addSite').addEventListener('click', addSite);
  $('#addRoute').addEventListener('click', () => { const r = Object.assign({ id: uid() }, EX, { url: '/api/new', body: '{\n  "ok": true\n}' }); routes.push(r); cur = r.id; save(); list(); editor(); });
  $('#exp').addEventListener('click', () => App.download('mock-api.json', JSON.stringify(routes, null, 2), 'application/json'));
  $('#imp').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); if (!Array.isArray(j)) throw new Error('format'); routes = j.map(r => Object.assign({ id: uid(), on: true }, r)); save(); cur = routes[0] && routes[0].id; list(); editor(); } catch (er) { App.toast(er.message, 'err'); } });
  list(); editor(); sites();
});
App.onLang(() => { list(); editor(); });
