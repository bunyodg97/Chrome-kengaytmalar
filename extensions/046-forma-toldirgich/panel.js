let cols = [], rows = [], map = {}, submit = '', cur = 0, status = {}, running = false;
const log = t => { $('#log').textContent = t + '\n' + $('#log').textContent.slice(0, 3000); };
const tab = async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
async function run(func, args = []) { const t = await tab(); const [r] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func, args }); return r?.result; }
$('#file').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true });
  const sh = wb.Sheets[wb.SheetNames[0]]; const data = XLSX.utils.sheet_to_json(sh, { defval: '', raw: false, dateNF: 'dd.mm.yyyy' });
  if (!data.length) return toast('Jadval bo\'sh');
  rows = data; cols = Object.keys(data[0]); cur = 0; status = {}; map = Object.fromEntries(cols.map(c => [c, map[c] || '']));
  $('#finfo').textContent = `${f.name}: ${rows.length} qator, ${cols.length} ustun`; $('#mapBox').hidden = $('#runBox').hidden = false;
  const t = await tab(); const host = new URL(t.url).host; const tpl = (await store.get('tpl', {}))[host];
  if (tpl) { cols.forEach(c => { if (tpl.map[c]) map[c] = tpl.map[c]; }); submit = tpl.submit || ''; log('Bu sayt uchun saqlangan bog\'lanish qo\'llandi'); }
  renderMap(); renderRows();
};
function renderMap() {
  $('#maps').innerHTML = cols.map((c, i) => `<div class="map ${map[c] ? 'ok' : ''}"><div><b class="small">${esc(c)}</b><div class="f">${map[c] ? esc(map[c].label || map[c].sel || map[c]) : 'bog\'lanmagan'}</div></div><div class="row"><button class="ghost" data-pick="${i}">Tanlash</button>${map[c] ? `<button class="ghost" data-x="${i}">✕</button>` : ''}</div></div>`).join('');
  $('#subSel').textContent = submit ? (submit.label || submit.sel) : 'tanlanmagan';
}
const selOf = m => m && (m.sel || m);
function renderRows() {
  const show = cols.slice(0, 5);
  $('#rows').innerHTML = `<tr><th>#</th>${show.map(c => `<th>${esc(c)}</th>`).join('')}</tr>` + rows.map((r, i) => `<tr data-i="${i}" class="${i === cur ? 'cur' : ''} ${status[i] || ''}"><td>${i + 1}</td>${show.map(c => `<td>${esc(String(r[c]).slice(0, 18))}</td>`).join('')}</tr>`).join('');
  $('#pos').textContent = `${cur + 1} / ${rows.length}`; $('#rows').querySelector('.cur')?.scrollIntoView({ block: 'nearest' });
}
$('#rows').onclick = e => { const tr = e.target.closest('[data-i]'); if (tr) { cur = +tr.dataset.i; renderRows(); } };
$('#maps').onclick = async e => {
  const p = e.target.dataset.pick, x = e.target.dataset.x;
  if (x !== undefined) { map[cols[+x]] = ''; renderMap(); return; }
  if (p === undefined) return; e.target.textContent = 'Sahifada bosing…';
  try { const r = await run(pagePick); if (r) map[cols[+p]] = r; } catch { toast('Bu sahifada ishlamaydi'); }
  renderMap();
};
$('#subPick').onclick = async () => { const r = await run(pagePick).catch(() => null); if (r) submit = r; renderMap(); };
$('#subX').onclick = () => { submit = ''; renderMap(); };
$('#auto').onclick = async () => {
  const fields = await run(pageFields).catch(() => []); let n = 0;
  const norm = s => s.toLowerCase().replace(/[^a-zа-я0-9ʻ']/gi, '');
  cols.forEach(c => { if (map[c]) return; const k = norm(c); const f = fields.find(f => norm(f.label) === k) || fields.find(f => k.length > 2 && (norm(f.label).includes(k) || k.includes(norm(f.label)))); if (f) { map[c] = { sel: f.sel, label: f.label }; n++; } });
  renderMap(); toast(n + ' ta ustun bog\'landi');
};
$('#saveTpl').onclick = async () => { const t = await tab(); const all = await store.get('tpl', {}); all[new URL(t.url).host] = { map, submit }; await store.set('tpl', all); toast('Saqlandi'); };
async function fillRow(i, doSubmit) {
  const m = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, selOf(v)]));
  try { const r = await run(pageFill, [m, rows[i], doSubmit ? selOf(submit) : '', true]); status[i] = r.some(x => x.startsWith('✗')) ? 'err' : 'done'; log(`${i + 1}-qator: ${r.length ? r.join('; ') : 'to\'ldirildi'}`); }
  catch (e) { status[i] = 'err'; log(`${i + 1}-qator: xato — ${e.message}`); }
  renderRows();
}
const waitLoad = () => new Promise(async ok => { const t = await tab(); const sec = +$('#wait').value || 0; let done = false;
  const l = (id, ch) => { if (id === t.id && ch.status === 'complete') { done = true; chrome.tabs.onUpdated.removeListener(l); setTimeout(ok, 600); } };
  chrome.tabs.onUpdated.addListener(l); setTimeout(() => { if (!done) { chrome.tabs.onUpdated.removeListener(l); ok(); } }, Math.max(1, sec) * 1000); });
$('#fill').onclick = () => fillRow(cur, false);
$('#fillNext').onclick = async () => { await fillRow(cur, $('#autoSub').checked); if (cur < rows.length - 1) { cur++; renderRows(); } };
$('#prev').onclick = () => { cur = Math.max(0, cur - 1); renderRows(); }; $('#next').onclick = () => { cur = Math.min(rows.length - 1, cur + 1); renderRows(); };
$('#runAll').onclick = async () => {
  if (!Object.values(map).some(Boolean)) return toast('Avval ustunlarni bog\'lang');
  running = true; $('#stop').hidden = false; $('#runAll').disabled = true;
  for (; cur < rows.length && running; cur++) { renderRows(); await fillRow(cur, !!submit); await waitLoad(); }
  cur = Math.min(cur, rows.length - 1); running = false; $('#stop').hidden = true; $('#runAll').disabled = false; renderRows(); log('Tugadi');
};
$('#stop').onclick = () => { running = false; };
