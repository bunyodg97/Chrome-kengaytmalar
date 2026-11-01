importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: 'viewer.html' }));
