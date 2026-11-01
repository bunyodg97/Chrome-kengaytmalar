let tab = null, kind = 'local', kv = [], dbs = [], cur = null, page = 0, edit = null;
const LIM = 50;
async function run(op, a = {}) { const t = await activeTab(); tab = t; const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: stOp, args: [op, { kind, ...a }] }); return result; }
const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return esc(s.length > 200 ? s.slice(0, 200) + '…' : s); };
async function load() {
  try { $('#org').textContent = await run('origin'); } catch { $('#org').textContent = 'Bu sahifada ishlamaydi'; $('#kv').innerHTML = ''; $('#tree').innerHTML = ''; return; }
  if (kind === 'idb') { dbs = await run('dbs'); drawTree(); if (cur) loadRows(); } else { kv = await run('kv'); drawKv(); }
}
function drawKv() { const q = $('#q').value.toLowerCase(); const a = kv.filter(([k, v]) => !q || k.toLowerCase().includes(q) || v.toLowerCase().includes(q)); $('#cnt').textContent = `${a.length} ta yozuv · ${fmtBytes(kv.reduce((s, [k, v]) => s + (k.length + v.length) * 2, 0))}`;
  $('#kv').innerHTML = a.map(([k, v]) => `<tr data-k="${esc(k)}"><td class="k" title="${esc(k)}">${esc(k)}</td><td title="${esc(v.slice(0, 500))}">${short(v)}</td><td class="x"><button class="ghost x" style="padding:0 5px">✕</button></td></tr>`).join('') || '<tr><td class="muted">Bo\'sh</td></tr>'; }
function drawTree() { $('#tree').innerHTML = dbs.length ? dbs.map(d => `<div class="item" style="cursor:default"><b>🗄 ${esc(d.name)}</b><span class="small muted">v${d.v ?? '?'}</span><button class="ghost x" data-drop="${esc(d.name)}" style="margin-left:auto;padding:0 6px" title="Bazani o'chirish">✕</button></div>` + d.stores.map(s => `<div class="item st ${cur && cur.db === d.name && cur.st === s.name ? 'on' : ''}" data-db="${esc(d.name)}" data-st="${esc(s.name)}">📄 ${esc(s.name)}</div>`).join('')).join('') : '<div class="empty">IndexedDB bazalari yo\'q</div>'; }
async function loadRows() { const d = dbs.find(x => x.name === cur.db), s = d?.stores.find(x => x.name === cur.st); if (!s) { $('#rowsp').hidden = true; return; } cur.kp = s.kp;
  const r = await run('rows', { db: cur.db, st: cur.st, offset: page * LIM, limit: LIM }); cur.rows = r.rows; $('#rowsp').hidden = false; $('#stn').textContent = `${cur.db} › ${cur.st}`;
  $('#kpinfo').textContent = `keyPath: ${JSON.stringify(s.kp)}${s.auto ? ' (auto)' : ''}${s.idx.length ? ' · indekslar: ' + s.idx.join(', ') : ''} · jami ${r.count}`;
  $('#pg').textContent = `${page * LIM + 1}–${Math.min(r.count, (page + 1) * LIM)} / ${r.count}`; $('#pp').disabled = !page; $('#np').disabled = (page + 1) * LIM >= r.count;
  $('#rows').innerHTML = r.rows.map((x, i) => `<tr data-i="${i}"><td class="k">${short(x.k)}</td><td>${short(x.v)}</td><td class="x"><button class="ghost x" style="padding:0 5px">✕</button></td></tr>`).join('') || '<tr><td class="muted">Bo\'sh</td></tr>'; }
function openEd(t, k, v, ctx) { edit = ctx; $('#ed').hidden = false; $('#edt').textContent = t; $('#ek').value = k; $('#ev').value = v; $('#eerr').textContent = ''; $('#ek').disabled = ctx.kind === 'idb' && ctx.kp != null; $('#ev').focus(); $('#ed').scrollIntoView({ behavior: 'smooth' }); }
const pretty = s => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } };
$('#kv').onclick = async e => { const tr = e.target.closest('tr[data-k]'); if (!tr) return; const k = tr.dataset.k;
  if (e.target.closest('.x')) { await run('kvDel', { k }); load(); return; } openEd('Tahrirlash', k, pretty(kv.find(x => x[0] === k)[1]), { kind: 'kv', old: k }); };
$('#add').onclick = () => openEd('Yangi yozuv', '', '', { kind: 'kv' });
$('#rows').onclick = async e => { const tr = e.target.closest('tr[data-i]'); if (!tr) return; const r = cur.rows[+tr.dataset.i];
  if (e.target.closest('.x')) { if (confirm('O\'chirilsinmi?')) { await run('del', { db: cur.db, st: cur.st, k: r.k }); load(); } return; }
  openEd('Yozuv', JSON.stringify(r.k), JSON.stringify(r.v, null, 2), { kind: 'idb', oldKey: r.k, kp: cur.kp }); };
$('#radd').onclick = () => openEd('Yangi yozuv (JSON)', cur.kp != null ? '' : '"kalit"', '{\n  \n}', { kind: 'idb', kp: cur.kp });
$('#tree').onclick = async e => { const dr = e.target.dataset.drop; if (dr) { if (confirm(`«${dr}» bazasi butunlay o'chirilsinmi?`)) { await run('dropDb', { db: dr }); cur = null; $('#rowsp').hidden = true; load(); } return; }
  const it = e.target.closest('[data-st]'); if (it) { cur = { db: it.dataset.db, st: it.dataset.st }; page = 0; drawTree(); loadRows(); } };
$('#pp').onclick = () => { page--; loadRows(); }; $('#np').onclick = () => { page++; loadRows(); };
$('#ecan').onclick = () => $('#ed').hidden = true; $('#efmt').onclick = () => $('#ev').value = pretty($('#ev').value);
$('#esv').onclick = async () => { try {
    if (edit.kind === 'kv') { const k = $('#ek').value; if (!k) throw new Error('Kalit bo\'sh'); await run('kvSet', { k, v: $('#ev').value.trim().startsWith('{') || $('#ev').value.trim().startsWith('[') ? JSON.stringify(JSON.parse($('#ev').value)) : $('#ev').value, old: edit.old }); }
    else { const v = JSON.parse($('#ev').value); const k = edit.kp != null ? undefined : JSON.parse($('#ek').value); await run('put', { db: cur.db, st: cur.st, v, k, oldKey: edit.kp != null ? undefined : edit.oldKey }); }
    $('#ed').hidden = true; load(); toast('Saqlandi'); } catch (e) { $('#eerr').textContent = 'Xato: ' + e.message; } };
$('#q').oninput = drawKv;
$('#exp').onclick = () => download(`${kind}Storage-${new URL($('#org').textContent).hostname}.json`, JSON.stringify(Object.fromEntries(kv), null, 2), 'application/json');
$('#imp').onchange = async e => { try { await run('kvImport', { data: JSON.parse(await e.target.files[0].text()) }); load(); toast('Import qilindi'); } catch { toast('Fayl noto\'g\'ri'); } };
$('#clr').onclick = async () => { if (confirm(`${kind}Storage butunlay tozalansinmi?`)) { await run('kvClear'); load(); } };
$('#sclr').onclick = async () => { if (confirm('Jadval tozalansinmi?')) { await run('clearStore', { db: cur.db, st: cur.st }); load(); } };
$('#dump').onclick = async () => download(`${cur.db}.json`, JSON.stringify(await run('dump', { db: cur.db }), null, 2), 'application/json');
$$('#tb button').forEach(b => b.onclick = () => { kind = b.dataset.t; $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); $('#kvp').hidden = kind === 'idb'; $('#idbp').hidden = kind !== 'idb'; $('#ed').hidden = true; load(); });
$('#ref').onclick = load;
chrome.tabs.onActivated.addListener(() => { cur = null; $('#rowsp').hidden = true; load(); }); chrome.tabs.onUpdated.addListener((id, i) => { if (i.status === 'complete' && id === tab?.id) load(); });
load();
