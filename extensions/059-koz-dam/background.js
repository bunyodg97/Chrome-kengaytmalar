importScripts('ru.js', 'about-bg.js');
const DEF = { every: 20, style: 'note', sound: true, on: true };
const cfg = async () => ({ ...DEF, ...((await chrome.storage.local.get('cfg')).cfg || {}) });
const today = () => new Date().toISOString().slice(0, 10);
async function plan(min) { const c = await cfg(); await chrome.alarms.clear('eye'); if (!c.on) return chrome.action.setBadgeText({ text: '' }); chrome.alarms.create('eye', { delayInMinutes: min ?? c.every }); }
chrome.runtime.onInstalled.addListener(() => plan()); chrome.runtime.onStartup.addListener(() => plan());
chrome.idle.setDetectionInterval(300);
chrome.idle.onStateChanged.addListener(s => { if (s === 'active') plan(); else chrome.alarms.clear('eye'); });
chrome.alarms.onAlarm.addListener(async a => {
  if (a.name === 'resume') return plan();
  if (a.name !== 'eye') return;
  if ((await chrome.idle.queryState(120)) !== 'active') return plan();
  const c = await cfg();
  if (c.style === 'page') chrome.windows.create({ url: 'break.html', type: 'popup', width: 520, height: 460, focused: true });
  else chrome.notifications.create('eye', { type: 'basic', iconUrl: 'icons/128.png', title: '👀 Ko\'zlarga dam bering', message: '20 soniya davomida 6 metr uzoqlikdagi narsaga qarang.', buttons: [{ title: 'Bajardim ✓' }, { title: '5 daqiqadan keyin' }], requireInteraction: true, silent: !c.sound });
  plan();
});
async function done() { const { stats = {} } = await chrome.storage.local.get('stats'); stats[today()] = (stats[today()] || 0) + 1; await chrome.storage.local.set({ stats }); }
chrome.notifications.onButtonClicked.addListener((id, b) => { chrome.notifications.clear(id); if (b === 0) done(); else plan(5); });
chrome.notifications.onClicked.addListener(id => { chrome.notifications.clear(id); done(); });
chrome.runtime.onMessage.addListener((m, s, r) => {
  if (m.cmd === 'done') done();
  if (m.cmd === 'plan') plan();
  if (m.cmd === 'pause') { chrome.alarms.clear('eye'); chrome.alarms.create('resume', { delayInMinutes: m.min }); }
  if (m.cmd === 'now') { chrome.windows.create({ url: 'break.html', type: 'popup', width: 520, height: 460, focused: true }); plan(); }
});
chrome.storage.onChanged.addListener(c => { if (c.cfg) plan(); });
