importScripts('ru.js', 'about-bg.js');
importScripts('stores.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'find', title: '🔍 "%s" ni do\'konlardan qidirish', contexts: ['selection'] });
  });
});
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'find' && info.selectionText) self.searchAll(info.selectionText.slice(0, 120));
});

// Manzil satrida: d [bo'sh joy] iphone 15 [Enter]
chrome.omnibox.setDefaultSuggestion({ description: 'Do\'konlardan qidirish: %s' });
chrome.omnibox.onInputEntered.addListener(text => self.searchAll(text));

chrome.runtime.onMessage.addListener((msg, s, reply) => {
  if (msg.type === 'search') { self.searchAll(msg.q, msg.ids).then(reply); return true; }
});
