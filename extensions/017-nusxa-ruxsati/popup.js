let tab, host = '';
async function render() {
  const { all = false, sites = [] } = await chrome.storage.local.get(['all', 'sites']);
  const on = all || sites.includes(host);
  $('#all').checked = all;
  $('#st').innerHTML = on ? '<span class="chip ok">Cheklovlar olib tashlangan</span>' : '<span class="chip">O\'chirilgan</span>';
  $('#toggle').textContent = sites.includes(host) ? 'Shu saytda o\'chirish' : 'Shu saytda yoqish';
  $('#toggle').disabled = !host || all;
  $('#list').innerHTML = sites.map(s => `<div class="item"><span class="grow">${esc(s)}</span><button class="ghost" data-rm="${esc(s)}">✕</button></div>`).join('') || '<div class="muted small">Bo\'sh</div>';
}
$('#toggle').onclick = async () => {
  const { sites = [] } = await chrome.storage.local.get('sites');
  await chrome.storage.local.set({ sites: sites.includes(host) ? sites.filter(s => s !== host) : [...sites, host] });
  chrome.tabs.reload(tab.id); render();
};
$('#all').onchange = async e => { await chrome.storage.local.set({ all: e.target.checked }); chrome.tabs.reload(tab.id); render(); };
$('#list').onclick = async e => { const s = e.target.dataset.rm; if (!s) return; const { sites = [] } = await chrome.storage.local.get('sites'); await chrome.storage.local.set({ sites: sites.filter(x => x !== s) }); render(); };
(async () => {
  tab = await activeTab();
  try { const u = new URL(tab.url); if (/^https?:|^file:/.test(u.protocol)) host = u.hostname.replace(/^www\./, ''); } catch {}
  $('#host').textContent = host || 'Ichki sahifa'; render();
})();
