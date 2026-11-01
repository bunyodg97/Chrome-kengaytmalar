importScripts('ru.js', 'about-bg.js');
importScripts('common.js');
const set = () => chrome.alarms.create('check', { when: Date.now() + 2000, periodInMinutes: 60 });
chrome.runtime.onInstalled.addListener(set); chrome.runtime.onStartup.addListener(set);
chrome.alarms.onAlarm.addListener(async () => {
  const { people = [], before = [3, 1], notified = {}, hour = 9 } = await chrome.storage.local.get(['people', 'before', 'notified', 'hour']);
  const now = new Date(); if (now.getHours() < hour) return badge(people);
  const today = now.toISOString().slice(0, 10);
  for (const p of people) {
    const n = nextDate(p); const key = `${p.id}:${n.date.getFullYear()}:${n.days}`;
    if (notified[key]) continue;
    if (n.days === 0) chrome.notifications.create('p:' + p.id + ':' + today, { type: 'basic', iconUrl: 'icons/128.png', title: `🎂 Bugun ${p.name}ning tug'ilgan kuni!`, message: (n.age ? `${n.age} yosh. ` : '') + 'Tabrik matnini olish uchun bosing.', priority: 2, requireInteraction: true });
    else if (before.includes(n.days)) chrome.notifications.create('p:' + p.id + ':' + today + n.days, { type: 'basic', iconUrl: 'icons/128.png', title: `${n.days} kundan keyin: ${p.name}`, message: `${fmtD(p)}` + (n.age ? ` — ${n.age} yosh` : '') + (p.note ? `. ${p.note}` : ''), priority: 1 });
    else continue;
    notified[key] = today;
  }
  for (const k in notified) if (notified[k] < new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10)) delete notified[k];
  await chrome.storage.local.set({ notified }); badge(people);
});
function badge(people) { const n = people.filter(p => nextDate(p).days === 0).length; chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#ef6c00' }); }
chrome.notifications.onClicked.addListener(id => { if (id.startsWith('p:')) chrome.tabs.create({ url: 'popup.html?full=1&wish=' + id.split(':')[1] }); });
chrome.storage.onChanged.addListener(c => c.people && badge(c.people.newValue || []));
