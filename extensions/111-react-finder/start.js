async function rfStart(tabId) {
  const o = await chrome.storage.local.get(['lang', 'editor']);
  const L = o.lang === 'ru' ? 'ru' : 'uz';
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: (s, ed) => { window.__RF_STR = s; window.__RF_EDITOR = ed; }, args: [STR[L].p, o.editor || 'vscode'] });
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', files: ['finder.js'] });
}
