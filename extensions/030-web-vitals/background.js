importScripts('ru.js', 'about-bg.js');
importScripts('thresholds.js');
chrome.runtime.onMessage.addListener((msg, s) => {
  if (msg.cmd !== 'vitals' || !s.tab) return;
  const r = ['LCP', 'INP', 'CLS'].map(k => rate(k, msg.m[k]));
  const col = r.includes('poor') ? '#d32f2f' : r.includes('ni') ? '#f9a825' : r.includes('good') ? '#2e7d32' : '#777';
  chrome.action.setBadgeBackgroundColor({ tabId: s.tab.id, color: col });
  chrome.action.setBadgeText({ tabId: s.tab.id, text: msg.m.LCP ? (msg.m.LCP / 1000).toFixed(1) : '' });
});
