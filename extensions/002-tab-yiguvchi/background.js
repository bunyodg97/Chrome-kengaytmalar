importScripts('ru.js', 'about-bg.js');
const LIST = 'list.html';
async function saveTabs(tabs, name) {
  const keep = tabs.filter(t => t.url && !t.url.startsWith(chrome.runtime.getURL('')) && !t.pinned && /^(https?|file|ftp):/.test(t.url));
  if (!keep.length) return 0;
  const groups = (await chrome.storage.local.get('groups')).groups || [];
  groups.unshift({ id: Date.now(), name: name || '', created: Date.now(), locked: false,
    tabs: keep.map(t => ({ url: t.url, title: t.title || t.url, fav: t.favIconUrl && t.favIconUrl.startsWith('http') ? t.favIconUrl : '' })) });
  await chrome.storage.local.set({ groups });
  await openList();
  await chrome.tabs.remove(keep.map(t => t.id));
  return keep.length;
}
async function openList() {
  const url = chrome.runtime.getURL(LIST);
  const [ex] = await chrome.tabs.query({ url });
  if (ex) { await chrome.tabs.update(ex.id, { active: true }); await chrome.tabs.reload(ex.id); }
  else await chrome.tabs.create({ url, pinned: true, index: 0 });
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  (async () => {
    const win = await chrome.windows.getCurrent();
    if (m.cmd === 'all') reply(await saveTabs(await chrome.tabs.query({ windowId: win.id })));
    if (m.cmd === 'others') reply(await saveTabs(await chrome.tabs.query({ windowId: win.id, active: false })));
    if (m.cmd === 'this') reply(await saveTabs(await chrome.tabs.query({ windowId: win.id, active: true })));
    if (m.cmd === 'list') { await openList(); reply(1); }
  })();
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'tyAll', title: "Barcha tablarni yig'ish", contexts: ['action', 'page'] });
});
chrome.contextMenus.onClicked.addListener(async () => {
  const win = await chrome.windows.getCurrent();
  saveTabs(await chrome.tabs.query({ windowId: win.id }));
});
