importScripts('ru.js', 'about-bg.js');
const DEFAULTS = {
  enabled: true,
  minutes: 30,                 // necha daqiqa ishlatilmasa uxlatish
  skipPinned: true,
  skipAudible: true,
  skipForms: true,
  markTitle: true,             // uxlagan tab nomiga 💤 qo'shish
  whitelist: ['web.telegram.org', 'web.whatsapp.com', 'meet.google.com', 'zoom.us', 'mail.google.com', 'music.youtube.com']
};
const MB_PER_TAB = 70;         // bitta uxlagan tab tejaydigan taxminiy xotira

const getS = async () => ({ ...DEFAULTS, ...((await chrome.storage.local.get('settings')).settings || {}) });
const hostOf = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
const inList = (host, list) => list.some(d => host === d || host.endsWith('.' + d));

async function dirtyTabs() { return (await chrome.storage.session.get('dirty')).dirty || {}; }

// Bu tabni uxlatish mumkinmi? Sabab qaytaradi (null — mumkin)
async function blocker(tab, s, dirty) {
  if (tab.active) return 'faol';
  if (tab.discarded) return 'uxlagan';
  if (!/^https?:|^file:/.test(tab.url || '')) return 'ichki';
  if (s.skipPinned && tab.pinned) return 'mahkamlangan';
  if (s.skipAudible && tab.audible) return 'ovoz';
  if (s.skipForms && dirty[tab.id]) return 'forma';
  if (inList(hostOf(tab.url), s.whitelist)) return 'istisno';
  return null;
}

async function sleepTab(tab, s) {
  try {
    if (s.markTitle) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { if (!document.title.startsWith('💤')) document.title = '💤 ' + document.title; }
      }).catch(() => {});
    }
    const res = await chrome.tabs.discard(tab.id);
    if (!res) return false;
    const { stats = { total: 0, day: '', today: 0 } } = await chrome.storage.local.get('stats');
    const day = new Date().toDateString();
    if (stats.day !== day) { stats.day = day; stats.today = 0; }
    stats.total++; stats.today++;
    await chrome.storage.local.set({ stats });
    return true;
  } catch { return false; }
}

async function autoSleep() {
  const s = await getS();
  if (!s.enabled) return;
  const dirty = await dirtyTabs();
  const limit = Date.now() - s.minutes * 60e3;
  for (const tab of await chrome.tabs.query({})) {
    if (!tab.lastAccessed || tab.lastAccessed > limit) continue;
    if (await blocker(tab, s, dirty)) continue;
    await sleepTab(tab, s);
  }
}

async function sleepMany(filter) {
  const s = await getS();
  const dirty = await dirtyTabs();
  let n = 0;
  for (const tab of await chrome.tabs.query(filter)) {
    if (await blocker(tab, s, dirty)) continue;
    if (await sleepTab(tab, s)) n++;
  }
  return n;
}

// ---------- Hodisalar ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('check', { periodInMinutes: 1 });
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'others', title: '💤 Boshqa tablarni uxlatish', contexts: ['page', 'action'] });
    chrome.contextMenus.create({ id: 'never', title: '🚫 Bu saytni hech qachon uxlatmaslik', contexts: ['page'] });
  });
});
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('check', { periodInMinutes: 1 }));
chrome.alarms.onAlarm.addListener(a => a.name === 'check' && autoSleep());

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'others') sleepMany({ windowId: tab.windowId });
  if (info.menuItemId === 'never') {
    const s = await getS(); const h = hostOf(tab.url);
    if (h && !s.whitelist.includes(h)) { s.whitelist.push(h); await chrome.storage.local.set({ settings: s }); }
  }
});
chrome.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'sleep-others') return;
  const win = await chrome.windows.getLastFocused();
  sleepMany({ windowId: win.id });
});

// Forma kuzatuvchisi
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if ((msg.type === 'dirty' || msg.type === 'clean') && sender.tab) {
    dirtyTabs().then(d => {
      if (msg.type === 'dirty') d[sender.tab.id] = true; else delete d[sender.tab.id];
      chrome.storage.session.set({ dirty: d });
    });
    return;
  }
  if (msg.type === 'sleepOthers') { sleepMany({ windowId: msg.windowId }).then(n => reply(n)); return true; }
  if (msg.type === 'sleepAll') { sleepMany({}).then(n => reply(n)); return true; }
  if (msg.type === 'status') {
    (async () => {
      const s = await getS(); const dirty = await dirtyTabs();
      const tabs = await chrome.tabs.query({});
      const list = [];
      for (const t of tabs) list.push({ id: t.id, title: t.title, url: t.url, fav: t.favIconUrl, discarded: t.discarded, last: t.lastAccessed, why: await blocker(t, s, dirty), windowId: t.windowId, active: t.active });
      reply({ list, MB_PER_TAB });
    })();
    return true;
  }
});
// Sahifa qayta yuklansa — forma belgisini tozalash
chrome.tabs.onUpdated.addListener((id, ch) => { if (ch.status === 'loading') dirtyTabs().then(d => { if (d[id]) { delete d[id]; chrome.storage.session.set({ dirty: d }); } }); });
chrome.tabs.onRemoved.addListener(id => dirtyTabs().then(d => { if (d[id]) { delete d[id]; chrome.storage.session.set({ dirty: d }); } }));
