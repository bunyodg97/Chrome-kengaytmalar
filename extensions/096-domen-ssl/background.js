importScripts('ru.js', 'about-bg.js');
importScripts('lib2.js');
chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('chk', { periodInMinutes: 720, delayInMinutes: 1 }));
chrome.alarms.onAlarm.addListener(async () => {
  const { watch = [], warnDays = 14 } = await chrome.storage.local.get(['watch', 'warnDays']); let bad = 0;
  for (const w of watch) {
    try { const s = await sslInfo(w.host); w.ssl = s?.to || null; } catch {} try { const d = await domainInfo(baseDomain(w.host)); w.dom = d.exp; } catch {}
    w.t = Date.now(); const ds = days(w.ssl), dd = days(w.dom);
    for (const [k, v, lbl] of [['s', ds, 'SSL sertifikati'], ['d', dd, 'Domen']]) if (v != null && v <= warnDays) { bad++; const key = `${w.host}:${k}:${v <= 3 ? 3 : v <= 7 ? 7 : warnDays}`; if (w.nt !== key) { w.nt = key; chrome.notifications.create(key, { type: 'basic', iconUrl: 'icons/128.png', title: `${lbl} tugayapti: ${w.host}`, message: v < 0 ? `Muddati ${-v} kun oldin TUGAGAN!` : `${v} kun qoldi`, priority: 2 }); } }
  }
  await chrome.storage.local.set({ watch }); chrome.action.setBadgeText({ text: bad ? String(bad) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
});
chrome.runtime.onMessage.addListener(m => { if (m.type === 'recheck') chrome.alarms.create('chk', { when: Date.now() + 100, periodInMinutes: 720 }); });
