importScripts('ru.js', 'about-bg.js');
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'note', title: '📝 Shu yerga stiker qo\'yish', contexts: ['page', 'image', 'link'] });
    chrome.contextMenus.create({ id: 'hl', title: '🖍 Marker bilan belgilash', contexts: ['selection'] });
    for (const [id, name] of [['yellow', 'sariq'], ['green', 'yashil'], ['blue', 'ko\'k'], ['pink', 'pushti']]) {
      chrome.contextMenus.create({ id: 'hl-' + id, parentId: 'hl', title: `🖍 ${name}`, contexts: ['selection'] });
    }
    chrome.contextMenus.create({ id: 'note-sel', title: '📝 Belgilangan matn bilan stiker', contexts: ['selection'] });
  });
});

const send = (tabId, msg) => chrome.tabs.sendMessage(tabId, msg).catch(() => {});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;
  if (info.menuItemId === 'note') send(tab.id, { type: 'addNote' });
  if (info.menuItemId === 'note-sel') send(tab.id, { type: 'addNote', text: info.selectionText });
  if (String(info.menuItemId).startsWith('hl-')) send(tab.id, { type: 'highlight', color: info.menuItemId.slice(3) });
});

chrome.commands.onCommand.addListener(async cmd => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (cmd === 'add-note') send(tab.id, { type: 'addNote', center: true });
  if (cmd === 'highlight') send(tab.id, { type: 'highlight', color: 'yellow' });
});
