importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: 'app.html' }));
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: 'k', title: 'Kodni rasmga aylantirish', contexts: ['selection'] }));
chrome.contextMenus.onClicked.addListener(async (i, tab) => {
  let code = i.selectionText; try { const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [i.frameId || 0] }, func: () => getSelection().toString() }); if (result) code = result; } catch {}
  await chrome.storage.local.set({ incoming: code }); chrome.tabs.create({ url: 'app.html', index: tab.index + 1 });
});
