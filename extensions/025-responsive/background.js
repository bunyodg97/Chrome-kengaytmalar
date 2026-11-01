importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(tab => {
  const url = /^https?:/.test(tab.url || '') ? tab.url : '';
  chrome.tabs.create({ url: 'view.html' + (url ? '#' + encodeURIComponent(url) : ''), index: tab.index + 1 });
});
// Ko'rgich tabi ichidagi iframe'lar uchun ramka taqiqlarini olib tashlaymiz
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd !== 'allowFrames' || !s.tab) return;
  const id = 5000 + (s.tab.id % 100000);
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [id],
    addRules: [{ id, priority: 1, condition: { tabIds: [s.tab.id], resourceTypes: ['sub_frame'] },
      action: { type: 'modifyHeaders', responseHeaders: [{ header: 'x-frame-options', operation: 'remove' }, { header: 'content-security-policy', operation: 'remove' }, { header: 'frame-options', operation: 'remove' }] } }]
  }).then(() => reply(1)).catch(e => reply(e.message));
  return true;
});
chrome.tabs.onRemoved.addListener(id => chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [5000 + (id % 100000)] }).catch(() => {}));
