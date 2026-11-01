importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(tab => chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['draw.js'] }).catch(() => {}));
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.type === 'shot') { chrome.tabs.captureVisibleTab(s.tab.windowId, { format: 'png' }).then(reply, e => reply(null)); return true; }
  if (m.type === 'save') { chrome.downloads.download({ url: m.url, filename: 'Chizmalar/chizma-' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.png', saveAs: false }); }
});
