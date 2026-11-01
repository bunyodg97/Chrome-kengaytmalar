importScripts('core.js');
const run = () => EC.tick();
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('ec-tick', { periodInMinutes: 1 }); run(); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('ec-tick', { periodInMinutes: 1 }); run(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'ec-tick') run(); });
