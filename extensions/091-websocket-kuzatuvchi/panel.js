let tab, D = { conns: {}, msgs: [] }, selId = null, paused = false, open = new Set();
const tm = t => { const d = new Date(t); return d.toLocaleTimeString('uz', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0'); };
const pretty = s => { try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } };
function filt() { const q = $('#q').value, dir = $('#dir').value; let re = null; if (/^\/.+\/$/.test(q)) try { re = new RegExp(q.slice(1, -1), 'i'); } catch {}
  return D.msgs.filter(m => (!selId || m.id === selId) && (!dir || m.dir === dir) && (!q || (re ? re.test(m.d) : m.d.toLowerCase().includes(q.toLowerCase())))); }
function render() {
  const cs = Object.entries(D.conns);
  $('#cl').innerHTML = cs.length ? `<div class="item cn ${!selId ? 'on' : ''}" data-id="">Hammasi (${cs.length})</div>` + cs.map(([id, c]) => `<div class="item cn ${selId === id ? 'on' : ''}" data-id="${esc(id)}"><div class="u">${c.proto === 'sse' ? 'SSE ' : ''}${esc(c.url)}</div><div class="s"><span class="chip ${c.st === 'ochiq' ? 'ok' : c.st === 'xato' ? 'bad' : ''}">${c.st}</span> ↓${c.in} ↑${c.out} · ${fmtBytes(c.bytes)}${c.extra ? ' · ' + esc(c.extra) : ''}</div></div>`).join('') : '';
  const a = filt().slice(-500), box = $('#msgs'), atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 30;
  box.innerHTML = a.map((m, i) => { const key = m.t + m.id + m.dir; return `<div class="m ${m.dir} ${open.has(key) ? 'open' : ''}" data-key="${esc(key)}"><span class="a">${m.dir === 'in' ? '↓' : m.dir === 'out' ? '↑' : '•'}</span><span class="d">${esc(open.has(key) ? pretty(m.d) : m.d)}</span><span class="t">${tm(m.t)}${m.n != null ? ' · ' + fmtBytes(m.n) : ''}</span></div>`; }).join('') || '<div class="empty">Xabar yo\'q</div>';
  if (atBottom) box.scrollTop = box.scrollHeight;
  $('#st').textContent = `${D.msgs.filter(m => m.dir !== 'sys').length} ta xabar${paused ? ' · PAUZA' : ''}`;
}
async function pull() { tab = await activeTab(); if (!tab) return; D = await chrome.runtime.sendMessage({ type: 'get', tabId: tab.id }) || { conns: {}, msgs: [] }; render(); }
chrome.runtime.onMessage.addListener(m => { if (m.type === 'upd' && m.tabId === tab?.id && !paused) { clearTimeout(window._t); window._t = setTimeout(pull, 120); } });
$('#cl').onclick = e => { const c = e.target.closest('.cn'); if (c) { selId = c.dataset.id || null; render(); } };
$('#msgs').onclick = e => { const m = e.target.closest('.m'); if (!m) return; if (e.detail === 2) { const x = D.msgs.find(z => z.t + z.id + z.dir === m.dataset.key); if (x) copyText(pretty(x.d)); return; } const k = m.dataset.key; open.has(k) ? open.delete(k) : open.add(k); render(); };
$('#q').oninput = $('#dir').onchange = render;
$('#pause').onclick = () => { paused = !paused; $('#pause').textContent = paused ? '▶' : '⏸'; if (!paused) pull(); else render(); };
$('#clr').onclick = () => { chrome.runtime.sendMessage({ type: 'clear', tabId: tab.id }); D = { conns: {}, msgs: [] }; render(); };
$('#exp').onclick = () => download(`websocket-${new URL(tab.url).hostname}.json`, JSON.stringify({ url: tab.url, conns: D.conns, msgs: D.msgs.map(m => ({ ...m, time: new Date(m.t).toISOString() })) }, null, 2), 'application/json');
chrome.tabs.onActivated.addListener(() => { selId = null; pull(); }); chrome.tabs.onUpdated.addListener((id, i) => { if (id === tab?.id && i.status) pull(); });
pull();
