let host = '';
async function render() {
  const { on = true, yt = true, allow = [] } = await chrome.storage.local.get(['on', 'yt', 'allow']);
  $('#on').checked = on; $('#yt').checked = yt;
  const ok = allow.includes(host);
  $('#allow').textContent = ok ? 'Shu saytda bloklashni qayta yoqish' : 'Shu saytda reklamaga ruxsat berish';
  $('#allow').disabled = !host;
  $('#list').innerHTML = allow.length ? allow.map(d => `<div class="item"><span class="grow">${esc(d)}</span><button class="ghost" data-d="${esc(d)}">Olib tashlash</button></div>`).join('') : '<div class="muted small">Ro\'yxat bo\'sh</div>';
}
(async () => {
  const tab = await activeTab();
  try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch {}
  if (!/^https?:/.test(tab.url || '')) host = '';
  $('#host').textContent = host || 'Ichki sahifa';
  const n = await chrome.runtime.sendMessage({ cmd: 'count', tabId: tab.id });
  $('#cnt').textContent = n == null ? '—' : n;
  render();
})();
$('#on').onchange = e => chrome.storage.local.set({ on: e.target.checked });
$('#yt').onchange = e => chrome.storage.local.set({ yt: e.target.checked });
$('#allow').onclick = async () => {
  const { allow = [] } = await chrome.storage.local.get('allow');
  const next = allow.includes(host) ? allow.filter(d => d !== host) : [...allow, host];
  await chrome.storage.local.set({ allow: next }); render();
  const tab = await activeTab(); setTimeout(() => chrome.tabs.reload(tab.id), 300);
};
$('#list').onclick = async e => {
  const d = e.target.dataset.d; if (!d) return;
  const { allow = [] } = await chrome.storage.local.get('allow');
  await chrome.storage.local.set({ allow: allow.filter(x => x !== d) }); render();
};
