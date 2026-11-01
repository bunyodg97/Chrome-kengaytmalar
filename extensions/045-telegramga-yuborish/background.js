importScripts('ru.js', 'about-bg.js');
importScripts('tg.js');
async function menus() {
  await chrome.contextMenus.removeAll(); const c = await cfg();
  const add = (id, title, contexts) => {
    if (c.chats.length <= 1) chrome.contextMenus.create({ id: id + '|0', title, contexts });
    else { chrome.contextMenus.create({ id, title, contexts }); c.chats.forEach((ch, i) => chrome.contextMenus.create({ id: id + '|' + i, parentId: id, title: ch.name || ch.id, contexts })); }
  };
  add('page', "Sahifani Telegram'ga yuborish", ['page']); add('text', "Matnni Telegram'ga yuborish", ['selection']);
  add('link', "Havolani Telegram'ga yuborish", ['link']); add('photo', "Rasmni Telegram'ga yuborish", ['image']);
}
chrome.runtime.onInstalled.addListener(r => { menus(); if (r.reason === 'install') chrome.runtime.openOptionsPage(); });
chrome.storage.onChanged.addListener(c => { if (c.cfg) menus(); });
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const [kind, idx] = info.menuItemId.split('|'); const c = await cfg(); const chat = c.chats[+idx]; if (!chat) return chrome.runtime.openOptionsPage();
  const d = { title: tab.title, url: tab.url, text: info.selectionText || info.linkUrl, link: info.linkUrl, src: info.srcUrl, page: tab.url };
  try { await sendTo(chat.id, kind, d); chrome.action.setBadgeText({ tabId: tab.id, text: '✓' }); chrome.action.setBadgeBackgroundColor({ color: '#229ed9' }); setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 2500); }
  catch (e) { chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: 'Yuborilmadi', message: e.message }); }
});
