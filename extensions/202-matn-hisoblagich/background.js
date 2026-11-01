chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'count', title: '🔢 Belgilangan matnni hisoblash', contexts: ['selection'] });
});
// Belgilangan matn bilan kichik oynada hisoblagichni ochamiz
chrome.contextMenus.onClicked.addListener(async info => {
  if (info.menuItemId !== 'count') return;
  await chrome.storage.session.set({ pending: info.selectionText || '' });
  chrome.windows.create({ url: 'popup.html?win=1', type: 'popup', width: 420, height: 640 });
});
