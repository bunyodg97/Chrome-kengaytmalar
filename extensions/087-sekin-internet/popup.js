let tab, cur = { p: 'off', cpu: 1 };
const fmt = p => p ? (p.offline ? 'tarmoq yo\'q' : `↓${p.down >= 1000 ? p.down / 1000 + ' Mbit' : p.down + ' kbit'} · ↑${p.up >= 1000 ? p.up / 1000 + ' Mbit' : p.up + ' kbit'} · ${p.lat}ms`) : '';
function render() { $('#list').innerHTML = Object.entries(PROFILES).map(([k, [n, p]]) => `<div class="item p ${cur.p === k ? 'on' : ''}" data-k="${k}"><b>${n}</b><small>${fmt(p)}</small></div>`).join('') + (cur.p === 'custom' ? `<div class="item p on"><b>O'zim belgilagan</b><small>${fmt(cur.custom)}</small></div>` : ''); $('#cpu').value = cur.cpu || 1; $('#cpuv').textContent = (cur.cpu || 1) + 'x'; }
async function go(p, custom) { $('#err').textContent = ''; const r = await chrome.runtime.sendMessage({ type: 'apply', tabId: tab.id, p, cpu: +$('#cpu').value, custom });
  if (r.error) { $('#err').textContent = 'Xato: ' + r.error + (/attach/i.test(r.error) ? ' (DevTools yoki boshqa kengaytma ulangan bo\'lishi mumkin)' : ''); return; }
  cur = { p, cpu: +$('#cpu').value, custom }; store.set('lastCustom', custom || (await store.get('lastCustom', null))); render(); if ($('#rl').checked) chrome.tabs.reload(tab.id); }
$('#list').onclick = e => { const it = e.target.closest('[data-k]'); if (it) go(it.dataset.k); };
$('#capp').onclick = () => go('custom', { down: +$('#cd').value, up: +$('#cu').value, lat: +$('#cl').value });
$('#cpu').oninput = () => $('#cpuv').textContent = $('#cpu').value + 'x'; $('#cpu').onchange = () => go(cur.p, cur.custom);
(async () => { tab = await activeTab(); const T = (await chrome.storage.session.get('tabs')).tabs || {}; if (T[tab.id]) cur = T[tab.id]; const c = await store.get('lastCustom', null); if (c) { $('#cd').value = c.down; $('#cu').value = c.up; $('#cl').value = c.lat; } render(); })();
