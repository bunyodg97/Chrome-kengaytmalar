async function go(mode) {
  $('#msg').textContent = 'Olinmoqda… sahifani qimirlatmang.';
  const tab = await activeTab();
  const r = await chrome.runtime.sendMessage({ cmd: 'capture', mode, tabId: tab.id, windowId: tab.windowId });
  if (r && r.error) $('#msg').textContent = r.error; else window.close();
}
$('#full').onclick = () => go('full');
$('#visible').onclick = () => go('visible');
