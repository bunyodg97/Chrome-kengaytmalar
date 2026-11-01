importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(t => chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['pick.js'] }).catch(() => {}));
chrome.runtime.onMessage.addListener(async (m, s) => { if (m.type === 'result') { await chrome.storage.local.set({ result: m.r }); chrome.tabs.create({ url: 'result.html', index: s.tab.index + 1 }); } });
