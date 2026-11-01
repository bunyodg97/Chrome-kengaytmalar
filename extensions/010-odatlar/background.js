importScripts('ru.js', 'about-bg.js');
importScripts('common.js');
async function schedule() {
  const { remind = '21:00', remindOn = true } = await chrome.storage.local.get(['remind', 'remindOn']);
  await chrome.alarms.clear('remind');
  if (!remindOn) return;
  const [h, m] = remind.split(':').map(Number), n = new Date(), t = new Date(); t.setHours(h, m, 0, 0);
  if (t <= n) t.setDate(t.getDate() + 1);
  chrome.alarms.create('remind', { when: t.getTime(), periodInMinutes: 1440 });
}
chrome.runtime.onInstalled.addListener(schedule);
chrome.runtime.onStartup.addListener(schedule);
chrome.storage.onChanged.addListener(c => { if (c.remind || c.remindOn) schedule(); });
chrome.alarms.onAlarm.addListener(async a => {
  if (a.name !== 'remind') return;
  const { habits = [] } = await chrome.storage.local.get('habits');
  const left = habits.filter(h => due(h) && !h.done[dk()]);
  if (left.length) chrome.notifications.create('odat', { type: 'basic', iconUrl: 'icons/128.png', title: 'Odatlar', message: `Bugun hali bajarilmagan: ${left.map(h => h.name).join(', ')}` });
});
chrome.notifications.onClicked.addListener(() => chrome.tabs.create({ url: 'stats.html' }));
async function badge() {
  const { habits = [] } = await chrome.storage.local.get('habits');
  const left = habits.filter(h => due(h) && !h.done[dk()]).length;
  chrome.action.setBadgeText({ text: left ? String(left) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
}
chrome.storage.onChanged.addListener(c => { if (c.habits) badge(); });
chrome.alarms.create('badge', { periodInMinutes: 30 }); chrome.alarms.onAlarm.addListener(a => { if (a.name === 'badge') badge(); });
badge();
