importScripts('ru.js', 'about-bg.js');
importScripts('engines.js');
async function menus() {
  await chrome.contextMenus.removeAll(); const { on = DEF_ON } = await chrome.storage.local.get('on');
  chrome.contextMenus.create({ id: 'all', title: 'Rasmni qidirish: hammasida (' + on.length + ')', contexts: ['image'] });
  chrome.contextMenus.create({ id: 'sep', type: 'separator', contexts: ['image'] });
  for (const [k, [n]] of Object.entries(ENGINES)) chrome.contextMenus.create({ id: k, title: n + ' da qidirish', contexts: ['image'] });
}
chrome.runtime.onInstalled.addListener(menus); chrome.storage.onChanged.addListener(c => c.on && menus());
async function search(url, keys, tab) {
  if (!/^https?:/.test(url)) return false;
  const { bg = false } = await chrome.storage.local.get('bg');
  keys.forEach((k, i) => chrome.tabs.create({ url: ENGINES[k][1](url), active: !bg && i === 0, index: tab ? tab.index + 1 + i : undefined, openerTabId: tab?.id }));
  const { hist = [] } = await chrome.storage.local.get('hist'); chrome.storage.local.set({ hist: [url, ...hist.filter(h => h !== url)].slice(0, 20) }); return true;
}
chrome.contextMenus.onClicked.addListener(async (i, tab) => {
  const { on = DEF_ON } = await chrome.storage.local.get('on');
  const ok = await search(i.srcUrl, i.menuItemId === 'all' ? on : [i.menuItemId], tab);
  if (!ok) chrome.tabs.create({ url: 'popup.html?err=1' });
});
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'search') search(m.url, m.keys).then(reply); return true; });
