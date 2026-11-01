importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('app.html'); const [t] = await chrome.tabs.query({ url });
  if (t) { chrome.tabs.update(t.id, { active: true }); chrome.windows.update(t.windowId, { focused: true }); } else chrome.tabs.create({ url });
});
