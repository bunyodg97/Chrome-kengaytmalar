importScripts('url.js');
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== 'lookup' || !tab) return;
  const r = repoOf(tab.url || '');
  if (!r) return;
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(getSelection()).trim() });
  const name = (result || '').match(/[A-Za-z_$][\w$]*/);
  if (!name) return;
  const { mode, newTab } = await chrome.storage.local.get(['mode', 'newTab']);
  const url = defUrl(r.owner, r.repo, name[0], mode);
  if (newTab) chrome.tabs.create({ url, index: tab.index + 1 }); else chrome.tabs.update(tab.id, { url });
});
chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.type === 'open' && sender.tab) {
    if (m.newTab) chrome.tabs.create({ url: m.url, index: sender.tab.index + 1 });
    else chrome.tabs.update(sender.tab.id, { url: m.url });
  }
});
