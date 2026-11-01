importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(t => chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['viz.js'] }).catch(() => {}));
