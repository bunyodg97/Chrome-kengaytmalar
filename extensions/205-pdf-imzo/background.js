// Belgi bosilganda: joriy tab PDF bo'lsa — uni ochamiz, aks holda bo'sh imzolash oynasi
chrome.action.onClicked.addListener(tab => {
  const isPdf = /\.pdf(\?|#|$)/i.test(tab?.url || '');
  chrome.tabs.create({ url: 'sign.html' + (isPdf ? '?src=' + encodeURIComponent(tab.url) : ''), index: (tab?.index ?? 0) + 1 });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'link', title: '✍️ Bu PDF ni imzolash', contexts: ['link'], targetUrlPatterns: ['*://*/*.pdf', '*://*/*.pdf?*', 'file:///*.pdf'] });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'link') chrome.tabs.create({ url: 'sign.html?src=' + encodeURIComponent(info.linkUrl), index: (tab?.index ?? 0) + 1 });
});
