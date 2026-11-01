(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  $('#open').textContent = tabs.length + ' ta ochiq';
  const g = await store.get('groups', []);
  $('#saved').textContent = `Saqlangan: ${g.length} guruh, ${g.reduce((a, x) => a + x.tabs.length, 0)} ta havola.`;
})();
$$('button[data-c]').forEach(b => b.onclick = async () => { await chrome.runtime.sendMessage({ cmd: b.dataset.c }); window.close(); });
