importScripts('ru.js', 'about-bg.js');
importScripts('common.js');
async function schedule() {
  const { days = {}, before = 10 } = await chrome.storage.local.get(['days', 'before']);
  const all = await chrome.alarms.getAll(); for (const a of all) if (a.name.startsWith('t:')) await chrome.alarms.clear(a.name);
  const now = Date.now();
  for (const k of [dk(), dk(now + 864e5)]) for (const t of (days[k]?.tasks || [])) {
    if (!t.time || t.done) continue;
    const when = new Date(`${k}T${t.time}`).getTime() - before * 6e4;
    if (when > now) chrome.alarms.create(`t:${k}:${t.id}`, { when });
  }
  const left = (days[dk()]?.tasks || []).filter(t => !t.done).length;
  chrome.action.setBadgeText({ text: left ? String(left) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#0277bd' });
}
chrome.storage.onChanged.addListener(c => { if (c.days || c.before) schedule(); });
chrome.runtime.onInstalled.addListener(schedule); chrome.runtime.onStartup.addListener(schedule);
chrome.alarms.create('midnight', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async a => {
  if (a.name === 'midnight') return schedule();
  const [, k, id] = a.name.split(':');
  const { days = {}, before = 10 } = await chrome.storage.local.get(['days', 'before']);
  const t = days[k]?.tasks.find(x => String(x.id) === id); if (!t || t.done) return;
  chrome.notifications.create(a.name, { type: 'basic', iconUrl: 'icons/128.png', title: `${t.time} — ${before} daqiqadan keyin`, message: t.t, priority: 2, requireInteraction: t.pri === 3 });
});
