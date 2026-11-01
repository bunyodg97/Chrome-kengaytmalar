// Popup va background umumiy: panelni yoqish/o'chirish
async function netlogToggle(tabId, open) {
  const { lang } = await chrome.storage.local.get('lang');
  const L = (lang === 'ru' ? 'ru' : 'uz');
  if (open === undefined) {
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: () => !!window.__netlogUI });
    open = !result;
  }
  if (!open) {
    await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: () => window.__netlogUI && window.__netlogUI.close() });
    return false;
  }
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', func: (s) => { window.__NETLOG_STR = s; }, args: [NETLOG_STR[L]] });
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', files: ['netlog.js'] });
  return true;
}
