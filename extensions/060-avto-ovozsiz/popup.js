let host = '', tab;
async function render() {
  const { on = true, allow = [], bgMute = false } = await chrome.storage.local.get(['on', 'allow', 'bgMute']);
  $('#on').checked = on; $('#bg').checked = bgMute; $('#host').textContent = host || '—';
  $('#allow').textContent = allow.includes(host) ? 'Bu saytda ham to\'xtatish' : 'Bu saytda avtomatik ijroga ruxsat'; $('#allow').disabled = !host;
  $('#list').innerHTML = allow.map(d => `<div class="item"><span class="grow">${esc(d)}</span><button class="ghost" data-d="${esc(d)}">✕</button></div>`).join('') || '<div class="muted small">Yo\'q</div>';
}
$('#on').onchange = e => chrome.storage.local.set({ on: e.target.checked }).then(render);
$('#bg').onchange = e => chrome.storage.local.set({ bgMute: e.target.checked }).then(render);
$('#allow').onclick = async () => { const { allow = [] } = await chrome.storage.local.get('allow'); await chrome.storage.local.set({ allow: allow.includes(host) ? allow.filter(x => x !== host) : [...allow, host] }); render(); setTimeout(() => chrome.tabs.reload(tab.id), 300); };
$('#list').onclick = async e => { const d = e.target.dataset.d; if (!d) return; const { allow = [] } = await chrome.storage.local.get('allow'); await chrome.storage.local.set({ allow: allow.filter(x => x !== d) }); render(); };
(async () => { tab = await activeTab(); try { const u = new URL(tab.url); if (/^https?:/.test(u.protocol)) host = u.hostname.replace(/^www\./, ''); } catch { } render(); })();
