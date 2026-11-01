importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: 'app.html' }));
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: 'img', title: 'Bu rasmga logo qo\'yish', contexts: ['image'] }));
chrome.contextMenus.onClicked.addListener(i => chrome.tabs.create({ url: 'app.html?src=' + encodeURIComponent(i.srcUrl) }));
