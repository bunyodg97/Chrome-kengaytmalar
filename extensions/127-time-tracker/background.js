importScripts('store.js');
chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('tick', { periodInMinutes: 1 }));
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('tick', { periodInMinutes: 1 }); TT.badge(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'tick') TT.badge(); });
chrome.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'toggle') return;
  const d = await TT.load();
  if (d.running) await TT.stop();
  else if (d.lastP || d.projects[0]) await TT.start(d.lastP || d.projects[0].id);
});
