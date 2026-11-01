async function vsStart(tabId) {
  const o = await chrome.storage.local.get(['lang', 'editor']);
  const L = o.lang === 'ru' ? 'ru' : 'uz';
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: (s, ed) => { window.__VS_STR = s; window.__VS_EDITOR = ed; }, args: [STR[L].p, o.editor || 'vscode'] });
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', files: ['inspector.js'] });
}
