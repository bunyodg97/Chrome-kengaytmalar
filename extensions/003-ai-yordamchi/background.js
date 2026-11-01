importScripts('ru.js', 'about-bg.js');
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
const MENU = {
  aiTr: "O'zbekchaga tarjima qilish",
  aiEx: 'Oddiy tilda tushuntirish',
  aiSum: 'Qisqacha mazmunini chiqarish',
  aiFix: "Matnni tahrirlash (xatolarni tuzatish)"
};
chrome.runtime.onInstalled.addListener(r => {
  chrome.contextMenus.create({ id: 'ai', title: 'AI Yordamchi', contexts: ['selection'] });
  for (const [id, title] of Object.entries(MENU)) chrome.contextMenus.create({ id, parentId: 'ai', title, contexts: ['selection'] });
  if (r.reason === 'install') chrome.runtime.openOptionsPage();
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await chrome.storage.session.set({ pending: { kind: info.menuItemId, text: info.selectionText, t: Date.now() } });
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
});
