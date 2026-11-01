importScripts('core.js');
chrome.runtime.onInstalled.addListener(() => { FT.schedule(); FT.badge(); });
chrome.runtime.onStartup.addListener(() => { FT.schedule(); FT.badge(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'fcheck') FT.checkAll(); });
chrome.notifications.onClicked.addListener(async id => {
  if (!id.startsWith('w:')) return;
  const w = (await FT.store.watches()).find(x => 'w:' + x.id === id);
  chrome.tabs.create({ url: (w && w.last && w.last.link) || 'https://www.aviasales.com' });
  chrome.notifications.clear(id);
});
