importScripts('core.js');
chrome.runtime.onInstalled.addListener(() => CA.schedule());
chrome.runtime.onStartup.addListener(() => CA.schedule());
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'ca-check') CA.check(); });
chrome.notifications.onClicked.addListener(async id => {
  if (!id.startsWith('ca:')) return;
  const u = await CA.get('ca_n_' + id, null);
  if (u) chrome.tabs.create({ url: u });
  chrome.notifications.clear(id); chrome.storage.local.remove('ca_n_' + id);
});
