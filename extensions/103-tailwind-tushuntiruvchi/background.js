importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(t => chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['tw.js', 'inspect.js'] }).catch(() => chrome.tabs.create({ url: 'page.html' })));
