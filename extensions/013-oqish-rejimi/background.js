importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(async tab => {
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['lib/Readability.js', 'reader.js'] }); }
  catch { chrome.action.setBadgeText({ tabId: tab.id, text: '✕' }); setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1500); }
});
