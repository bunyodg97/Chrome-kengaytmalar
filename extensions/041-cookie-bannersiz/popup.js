let host = '', tab;
async function render() {
  const o = await chrome.storage.local.get(['on', 'allow', 'mode', 'n', 'r']);
  $('#on').checked = o.on !== false; $('#mode').value = o.mode || 'reject'; $('#n').textContent = o.n || 0; $('#r').textContent = o.r || 0;
  $('#allow').textContent = (o.allow || []).includes(host) ? 'Shu saytda qayta yoqish' : 'Shu saytda o\'chirish'; $('#allow').disabled = !host;
}
$('#on').onchange = e => chrome.storage.local.set({ on: e.target.checked });
$('#mode').onchange = e => chrome.storage.local.set({ mode: e.target.value });
$('#allow').onclick = async () => { const { allow = [] } = await chrome.storage.local.get('allow'); await chrome.storage.local.set({ allow: allow.includes(host) ? allow.filter(x => x !== host) : [...allow, host] }); chrome.tabs.reload(tab.id); render(); };
(async () => { tab = await activeTab(); try { const u = new URL(tab.url); if (/^https?:/.test(u.protocol)) host = u.hostname.replace(/^www\./, ''); } catch { } render(); })();
