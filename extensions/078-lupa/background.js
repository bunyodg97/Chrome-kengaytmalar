importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(t => chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['lens.js'] }).catch(() => {}));
let last = 0;
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.type !== 'shot') return;
  const wait = Math.max(0, 550 - (Date.now() - last)); // captureVisibleTab cheklovi: ~2/s
  setTimeout(() => { last = Date.now(); chrome.tabs.captureVisibleTab(s.tab.windowId, { format: 'png' }).then(reply, () => reply(null)); }, wait);
  return true;
});
