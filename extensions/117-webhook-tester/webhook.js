const { $, $$, h } = App;
const API = 'https://webhook.site';
let token = null, reqs = [], selected = null, timer = null, seenIds = new Set();

async function api(path, opts) {
  const r = await fetch(API + path, Object.assign({ headers: { accept: 'application/json', 'content-type': 'application/json' } }, opts || {}));
  if (!r.ok) throw new Error('webhook.site: HTTP ' + r.status);
  return r.status === 204 ? null : r.json().catch(() => null);
}

async function createToken() {
  $('#hook').value = t('creating');
  const j = await api('/token', { method: 'POST', body: JSON.stringify({ default_status: 200, default_content: 'OK', default_content_type: 'text/plain' }) });
  token = j.uuid;
  await App.set('token', token);
  reqs = []; seenIds = new Set(); selected = null;
  showUrl(); renderList(); renderDetail();
}
function hookUrl() { return API + '/' + token; }
function showUrl() { $('#hook').value = hookUrl(); }

async function poll() {
  if (!token) return;
  try {
    const j = await api(`/token/${token}/requests?sorting=newest&per_page=50`);
    const data = (j && j.data) || [];
    const fresh = data.filter(r => !seenIds.has(r.uuid));
    fresh.forEach(r => seenIds.add(r.uuid));
    if (fresh.length || data.length !== reqs.length) {
      reqs = data;
      renderList();
      if (!selected && reqs[0]) select(reqs[0].uuid);
      if (reqs.length && fresh.length && fresh.length < 20 && $('#fwOn').checked) fresh.reverse().forEach(forward);
    }
    $('#live').className = 'badge ok'; $('#live').textContent = '● ' + t('live');
  } catch (e) { $('#live').className = 'badge warn'; $('#live').textContent = e.message; }
}

function hdrs(r) {
  const o = {};
  for (const [k, v] of Object.entries(r.headers || {})) o[k] = Array.isArray(v) ? v.join(', ') : v;
  return o;
}
const SKIP_H = /^(host|content-length|connection|x-forwarded-.*|x-real-ip|cf-.*|cdn-loop|accept-encoding|true-client-ip|php-auth-.*)$/i;

async function forward(r) {
  const url = $('#fwUrl').value.trim();
  if (!url) return;
  const headers = {};
  for (const [k, v] of Object.entries(hdrs(r))) if (!SKIP_H.test(k)) headers[k] = v;
  const q = r.query && Object.keys(r.query).length ? '?' + new URLSearchParams(r.query).toString() : '';
  try {
    const res = await fetch(url + q, { method: r.method, headers, body: ['GET', 'HEAD'].includes(r.method) ? undefined : r.content });
    r.__fw = t('forwarded', { s: res.status });
  } catch (e) { r.__fw = t('forwardErr') + ': ' + e.message; }
  renderList(); if (selected === r.uuid) renderDetail();
}

function renderList() {
  const L = $('#list'); L.innerHTML = '';
  if (!reqs.length) {
    L.append(h('div', { class: 'empty small' }, t('waiting'), h('pre', { class: 'out', style: { textAlign: 'left', marginTop: '8px' }, text: `curl -X POST ${token ? hookUrl() : '…'} \\\n  -H 'Content-Type: application/json' \\\n  -d '{"test": true}'` })));
    return;
  }
  for (const r of reqs) {
    const ct = hdrs(r)['content-type'] || '';
    L.append(h('div', { class: 'wh-it' + (r.uuid === selected ? ' on' : ''), onclick: () => select(r.uuid) },
      h('div', {}, h('span', { class: 'm', text: r.method }), h('span', { class: 'small', text: (r.size || 0) + ' B · ' + ct.split(';')[0] })),
      h('div', { class: 'tm', text: new Date(r.created_at.replace(' ', 'T') + 'Z').toLocaleString() + (r.ip ? ' · ' + r.ip : '') + (r.__fw ? ' · ' + r.__fw : '') })));
  }
}

function select(id) { selected = id; renderList(); renderDetail(); }

function table(o) {
  const tb = h('tbody');
  Object.entries(o || {}).forEach(([k, v]) => tb.append(h('tr', {}, h('td', { text: k }), h('td', { text: typeof v === 'object' ? JSON.stringify(v) : v }))));
  return h('table', { class: 't' }, tb);
}

function renderDetail() {
  const D = $('#detail'); D.innerHTML = '';
  const r = reqs.find(x => x.uuid === selected);
  if (!r) { D.append(h('div', { class: 'empty', text: t('select') })); return; }
  const H = hdrs(r);
  let body = r.content || '';
  const ct = H['content-type'] || '';
  if (/json/.test(ct) || /^\s*[{[]/.test(body)) { try { body = JSON.stringify(JSON.parse(body), null, 2); } catch (e) {} }
  else if (/x-www-form-urlencoded/.test(ct)) { try { body = JSON.stringify(Object.fromEntries(new URLSearchParams(body)), null, 2); } catch (e) {} }
  const curl = () => {
    let c = `curl -X ${r.method} '${$('#fwUrl').value.trim() || hookUrl()}'`;
    for (const [k, v] of Object.entries(H)) if (!SKIP_H.test(k)) c += ` \\\n  -H '${k}: ${String(v).replace(/'/g, "'\\''")}'`;
    if (r.content) c += ` \\\n  --data-raw '${r.content.replace(/'/g, "'\\''")}'`;
    return c;
  };
  D.append(
    h('div', { class: 'row' }, h('b', { class: 'mono', text: r.method + ' ' + (r.url || '') }), h('span', { class: 'grow' }),
      $('#fwOn').checked ? h('button', { class: 'btn ghost small', text: '↻ ' + t('forward'), onclick: () => forward(r) }) : '',
      h('button', { class: 'btn ghost small', text: t('copyCurl'), onclick: () => App.copy(curl()) })),
    h('h4', { text: t('meta') }), table({ time: r.created_at, ip: r.ip, size: r.size + ' B', user_agent: r.user_agent }),
    r.query && Object.keys(r.query).length ? h('div', {}, h('h4', { text: t('query') }), table(r.query)) : '',
    h('h4', { text: t('headers') }), table(H),
    h('div', { class: 'row' }, h('h4', { class: 'grow', text: t('body') }), body ? h('button', { class: 'btn ghost small', text: t('copy'), onclick: () => App.copy(r.content) }) : ''),
    h('pre', { class: 'out', text: body || '—' }));
}

App.onReady(async () => {
  token = await App.get('token', null);
  const fw = await App.get('forward', { on: false, url: '' });
  $('#fwOn').checked = fw.on; $('#fwUrl').value = fw.url;
  const saveFw = async () => {
    if ($('#fwOn').checked && $('#fwUrl').value.trim()) {
      try { await App.requestOrigin($('#fwUrl').value.trim()); } catch (e) { $('#fwOn').checked = false; App.toast(e.message, 'err'); }
    }
    await App.set('forward', { on: $('#fwOn').checked, url: $('#fwUrl').value.trim() });
    renderDetail();
  };
  $('#fwOn').addEventListener('change', saveFw);
  $('#fwUrl').addEventListener('change', saveFw);
  $('#copyHook').addEventListener('click', () => token && App.copy(hookUrl()));
  $('#newUrl').addEventListener('click', () => createToken().catch(e => App.toast(e.message, 'err')));
  $('#clearAll').addEventListener('click', async () => {
    try { await api(`/token/${token}/request`, { method: 'DELETE' }); } catch (e) {}
    reqs = []; selected = null; renderList(); renderDetail();
  });
  try { if (!token) await createToken(); else showUrl(); } catch (e) { App.toast(e.message, 'err'); $('#hook').value = ''; }
  renderList();
  await poll();
  timer = setInterval(() => { if (document.visibilityState === 'visible') poll(); }, 3000);
});
App.onLang(() => { renderList(); renderDetail(); });
