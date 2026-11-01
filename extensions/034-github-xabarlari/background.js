importScripts('ru.js', 'about-bg.js');
importScripts('gh.js');
async function poll() {
  try {
    const list = await gh('/notifications?per_page=50');
    const { seen = [], notify = true } = await chrome.storage.local.get(['seen', 'notify']);
    const fresh = list.filter(n => n.unread && !seen.includes(n.id + n.updated_at));
    if (notify && fresh.length && seen.length) fresh.slice(0, 3).forEach(n => chrome.notifications.create('gh' + n.id, { type: 'basic', iconUrl: 'icons/128.png', title: n.repository.full_name, message: n.subject.title, priority: 1 }));
    await chrome.storage.local.set({ notes: list, seen: list.map(n => n.id + n.updated_at).slice(0, 300), err: '', t: Date.now() });
    const c = list.filter(n => n.unread).length;
    chrome.action.setBadgeText({ text: c ? (c > 99 ? '99+' : String(c)) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#1f6feb' });
  } catch (e) {
    await chrome.storage.local.set({ err: e.message === 'NO_TOKEN' ? '' : e.message });
    chrome.action.setBadgeText({ text: e.message === 'NO_TOKEN' ? '' : '!' });
  }
}
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('poll', { periodInMinutes: 2 }); poll(); });
chrome.runtime.onStartup.addListener(poll);
chrome.alarms.onAlarm.addListener(poll);
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.cmd === 'poll') { poll().then(() => reply(1)); return true; } });
chrome.notifications.onClicked.addListener(async id => {
  const { notes = [] } = await chrome.storage.local.get('notes'); const n = notes.find(x => 'gh' + x.id === id);
  if (n) { chrome.tabs.create({ url: htmlUrl(n) }); gh('/notifications/threads/' + n.id, { method: 'PATCH' }).then(poll).catch(() => {}); }
});
chrome.storage.onChanged.addListener(c => { if (c.token) poll(); });
