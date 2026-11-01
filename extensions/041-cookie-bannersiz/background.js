importScripts('ru.js', 'about-bg.js');
chrome.runtime.onMessage.addListener(async (m, s) => {
  if (m.cmd !== 'hit' || !s.tab) return;
  const { n = 0, r = 0 } = await chrome.storage.local.get(['n', 'r']);
  await chrome.storage.local.set({ n: n + 1, r: r + (m.rejected ? 1 : 0) });
  chrome.action.setBadgeText({ tabId: s.tab.id, text: '✓' }); chrome.action.setBadgeBackgroundColor({ tabId: s.tab.id, color: '#558b2f' });
});
