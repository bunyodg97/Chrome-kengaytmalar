tabsInit();
let state = { params: [], headers: [] }, env = [], hist = [], saved = [], lastRes = null;
const row = (k = '', v = '', on = true) => ({ k, v, on });
function kv(id) {
  $('#' + id).innerHTML = state[id].map((r, i) => `<div class="kv" data-i="${i}"><input type="checkbox" ${r.on ? 'checked' : ''} data-f="on"><input type="text" value="${esc(r.k)}" data-f="k" placeholder="${id === 'headers' ? 'Content-Type' : 'kalit'}"><input type="text" value="${esc(r.v)}" data-f="v" placeholder="qiymat"><button class="ghost" data-f="x">✕</button></div>`).join('');
}
['params', 'headers'].forEach(id => {
  $('#' + id).addEventListener('input', e => { const i = +e.target.closest('[data-i]').dataset.i, f = e.target.dataset.f; state[id][i][f] = f === 'on' ? e.target.checked : e.target.value; if (id === 'params') syncUrlFromParams(); });
  $('#' + id).addEventListener('click', e => { if (e.target.dataset.f === 'x') { state[id].splice(+e.target.closest('[data-i]').dataset.i, 1); kv(id); if (id === 'params') syncUrlFromParams(); } });
});
$$('[data-add]').forEach(b => b.onclick = () => { state[b.dataset.add].push(row()); kv(b.dataset.add); });
function syncUrlFromParams() { const [base] = $('#url').value.split('?'); const qs = state.params.filter(p => p.on && p.k).map(p => encodeURIComponent(p.k) + '=' + encodeURIComponent(p.v)).join('&'); $('#url').value = base + (qs ? '?' + qs : ''); }
$('#url').addEventListener('input', () => { const q = $('#url').value.split('?')[1]; state.params = q ? q.split('&').filter(Boolean).map(p => { const [k, ...v] = p.split('='); const d = s => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch { return s; } }; return row(d(k), d(v.join('='))); }) : []; kv('params'); });
const sub = s => String(s).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => { const e = env.find(x => x.k === k && x.on); return e ? e.v : m; });
function collect() { return { method: $('#method').value, url: $('#url').value.trim(), headers: state.headers, btype: $('#btype').value, body: $('#body').value, atype: $('#atype').value, atoken: $('#atoken').value, auser: $('#auser').value, apass: $('#apass').value }; }
function load(r) {
  $('#method').value = r.method; $('#url').value = r.url; state.headers = (r.headers || []).map(h => ({ ...h })); $('#btype').value = r.btype || 'none'; $('#body').value = r.body || '';
  $('#atype').value = r.atype || 'none'; $('#atoken').value = r.atoken || ''; $('#auser').value = r.auser || ''; $('#apass').value = r.apass || '';
  kv('headers'); $('#url').dispatchEvent(new Event('input'));
}
function build(r) {
  const h = new Headers(); r.headers.filter(x => x.on && x.k).forEach(x => { try { h.set(sub(x.k), sub(x.v)); } catch { } });
  if (r.atype === 'bearer' && r.atoken) h.set('Authorization', 'Bearer ' + sub(r.atoken));
  if (r.atype === 'basic') h.set('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(sub(r.auser) + ':' + sub(r.apass)))));
  let body; if (!['GET', 'HEAD'].includes(r.method) && r.btype !== 'none') { body = sub(r.body); if (!h.has('content-type')) h.set('content-type', r.btype === 'json' ? 'application/json' : r.btype === 'form' ? 'application/x-www-form-urlencoded' : 'text/plain'); }
  return { url: sub(r.url), init: { method: r.method, headers: h, body } };
}
function hl(json) { return esc(json).replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g, m => { let c = 'jn'; if (/^"/.test(m)) c = /:$/.test(m) ? 'jk' : 'js'; else if (/true|false/.test(m)) c = 'jb'; else if (/null/.test(m)) c = 'jz'; return `<span class="${c}">${m}</span>`; }); }
async function send() {
  const r = collect(); if (!r.url) return toast('Manzil kiriting');
  let { url, init } = build(r); if (!/^https?:\/\//.test(url)) url = 'https://' + url;
  $('#send').disabled = true; $('#status').innerHTML = '<span class="muted">Yuborilmoqda…</span>';
  const t0 = performance.now();
  try {
    const res = await fetch(url, { ...init, credentials: 'omit', cache: 'no-store' });
    const buf = await res.arrayBuffer(), ms = Math.round(performance.now() - t0), txt = new TextDecoder().decode(buf), ct = res.headers.get('content-type') || '';
    lastRes = { txt, ct };
    let pretty = txt; try { if (/json/.test(ct) || /^\s*[\[{]/.test(txt)) pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch { }
    $('#resBody').innerHTML = pretty !== txt || /json/.test(ct) ? hl(pretty) : esc(txt);
    $('#resHead').innerHTML = [...res.headers].map(([k, v]) => `<tr><th>${esc(k)}</th><td class="mono" style="word-break:break-all">${esc(v)}</td></tr>`).join('');
    const cl = res.status < 300 ? 'ok' : res.status < 400 ? 'warn' : 'bad';
    $('#status').innerHTML = `<span class="chip ${cl}">${res.status} ${esc(res.statusText)}</span><span>${ms} ms</span><span>${fmtBytes(buf.byteLength)}</span><span class="muted small">${esc(ct.split(';')[0])}</span>`;
    hist.unshift({ ...r, t: Date.now(), status: res.status }); hist = hist.slice(0, 100); store.set('hist', hist); side();
  } catch (e) { $('#status').innerHTML = `<span class="chip bad">Xato</span><span class="small">${esc(e.message)} — manzil, internet yoki sertifikatni tekshiring</span>`; $('#resBody').textContent = ''; }
  $('#send').disabled = false;
}
function side() {
  const item = (r, i, kind) => `<div class="r" data-k="${kind}" data-i="${i}"><span class="m ${r.method}">${r.method}</span><span class="u" title="${esc(r.url)}">${esc(r.name || r.url.replace(/^https?:\/\//, ''))}</span>${r.status ? `<span class="chip ${r.status < 400 ? 'ok' : 'bad'}">${r.status}</span>` : ''}${kind === 'saved' ? '<button class="ghost" data-del style="padding:0 6px">✕</button>' : ''}</div>`;
  $('#hist').innerHTML = hist.map((r, i) => item(r, i, 'hist')).join('') || '<div class="muted small" style="padding:8px">Tarix bo\'sh</div>';
  $('#saved').innerHTML = saved.map((r, i) => item(r, i, 'saved')).join('') || '<div class="muted small" style="padding:8px">Saqlangan so\'rov yo\'q</div>';
  $('#envList').innerHTML = env.map((e, i) => `<div class="kv" data-i="${i}" style="grid-template-columns:20px 1fr 1fr 26px"><input type="checkbox" data-f="on" ${e.on ? 'checked' : ''}><input type="text" data-f="k" value="${esc(e.k)}" placeholder="base"><input type="text" data-f="v" value="${esc(e.v)}" placeholder="https://…"><button class="ghost" data-f="x">✕</button></div>`).join('');
}
document.querySelector('aside').addEventListener('click', e => {
  const r = e.target.closest('.r'); if (!r) return;
  if (e.target.hasAttribute('data-del')) { saved.splice(+r.dataset.i, 1); store.set('saved', saved); side(); return; }
  load((r.dataset.k === 'hist' ? hist : saved)[+r.dataset.i]);
});
$('#envList').addEventListener('input', e => { const i = +e.target.closest('[data-i]').dataset.i, f = e.target.dataset.f; env[i][f] = f === 'on' ? e.target.checked : e.target.value; store.set('env', env); });
$('#envList').addEventListener('click', e => { if (e.target.dataset.f === 'x') { env.splice(+e.target.closest('[data-i]').dataset.i, 1); store.set('env', env); side(); } });
$('#envAdd').onclick = () => { env.push(row()); side(); };
$('#clearH').onclick = () => { hist = []; store.set('hist', hist); side(); };
$('#send').onclick = send;
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(); });
$('#save').onclick = () => { const r = collect(); if (!r.url) return; const name = (r.url.split('?')[0].split('/').slice(-2).join('/')) || r.url; saved.unshift({ ...r, name }); store.set('saved', saved); side(); toast('Saqlandi'); $$('aside .tabs button')[1].click(); };
$('#fmtBody').onclick = () => { try { $('#body').value = JSON.stringify(JSON.parse($('#body').value), null, 2); } catch { toast('JSON xato'); } };
$('#btype').onchange = e => { if (e.target.value === 'json' && !$('#body').value.trim()) $('#body').value = '{\n  \n}'; };
$('#cpRes').onclick = () => lastRes && copyText(lastRes.txt);
$('#dlRes').onclick = () => lastRes && download(/json/.test(lastRes.ct) ? 'javob.json' : 'javob.txt', lastRes.txt);
// cURL
function toCurl() { const r = collect(), { url, init } = build(r); let s = `curl -X ${init.method} '${url}'`; init.headers.forEach((v, k) => s += ` \\\n  -H '${k}: ${v.replace(/'/g, "'\\''")}'`); if (init.body) s += ` \\\n  --data-raw '${init.body.replace(/'/g, "'\\''")}'`; return s; }
function toFetch() { const r = collect(), { url, init } = build(r); const h = {}; init.headers.forEach((v, k) => h[k] = v); return `const res = await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(init.method)},\n  headers: ${JSON.stringify(h, null, 2).replace(/\n/g, '\n  ')}${init.body ? `,\n  body: ${JSON.stringify(init.body)}` : ''}\n});\nconst data = await res.json();`; }
$('#curlBtn').onclick = () => { $('#curlOut').value = toCurl(); $('#fetchOut').value = toFetch(); $('#curlDlg').showModal(); };
$('#curlClose').onclick = () => $('#curlDlg').close();
$('#curlOut').onclick = e => copyText(e.target.value); $('#fetchOut').onclick = e => copyText(e.target.value);
$('#curlImp').onclick = () => {
  const s = $('#curlIn').value.replace(/\\\r?\n/g, ' ');
  const tok = [...s.matchAll(/'([^']*)'|"((?:\\.|[^"])*)"|(\S+)/g)].map(m => m[1] ?? (m[2] !== undefined ? m[2].replace(/\\"/g, '"') : m[3]));
  const r = { method: 'GET', url: '', headers: [], btype: 'none', body: '' };
  for (let i = 1; i < tok.length; i++) { const t = tok[i];
    if (t === '-X' || t === '--request') r.method = tok[++i].toUpperCase();
    else if (t === '-H' || t === '--header') { const [k, ...v] = tok[++i].split(':'); r.headers.push(row(k.trim(), v.join(':').trim())); }
    else if (/^(-d|--data|--data-raw|--data-binary|--data-urlencode)$/.test(t)) { r.body = tok[++i]; r.btype = /^\s*[\[{]/.test(r.body) ? 'json' : 'form'; if (r.method === 'GET') r.method = 'POST'; }
    else if (t === '-u' || t === '--user') { const [u, p] = tok[++i].split(':'); Object.assign(r, { atype: 'basic', auser: u, apass: p || '' }); }
    else if (/^https?:\/\//.test(t) || (!t.startsWith('-') && !r.url)) r.url = t; }
  r.headers = r.headers.filter(h => !/^content-type$/i.test(h.k) || r.btype === 'none' ? true : true);
  load(r); $('#curlDlg').close(); toast('Import qilindi');
};
(async () => {
  hist = await store.get('hist', []); saved = await store.get('saved', []); env = await store.get('env', [row('base', 'https://jsonplaceholder.typicode.com')]);
  state.headers = [row('Accept', 'application/json')]; kv('headers'); kv('params'); side();
  if (!hist.length) $('#url').value = '{{base}}/todos/1';
})();
