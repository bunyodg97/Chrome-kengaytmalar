importScripts('extract.js');

async function make(tab) {
  if (!tab?.id || !/^https?:|^file:/.test(tab.url || '')) {
    chrome.tabs.create({ url: 'reader.html#error' });
    return;
  }
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: tozaPdfExtract });
    const id = crypto.randomUUID();
    await chrome.storage.session.set({ [id]: res.result });
    chrome.tabs.create({ url: `reader.html#${id}`, index: tab.index + 1 });
  } catch (e) {
    chrome.tabs.create({ url: 'reader.html#error' });
  }
}

chrome.action.onClicked.addListener(make);
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'pdf', title: '📄 Toza PDF qilib saqlash', contexts: ['page'] });
});
chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === 'pdf') make(tab); });
