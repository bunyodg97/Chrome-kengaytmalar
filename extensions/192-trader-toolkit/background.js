importScripts('core.js');
const tick = () => { TR.sessionAlerts(); TR.updateBadge(); };
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('tr-tick', { periodInMinutes: 1 }); tick(); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('tr-tick', { periodInMinutes: 1 }); tick(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'tr-tick') tick(); });
