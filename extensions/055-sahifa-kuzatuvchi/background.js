importScripts('ru.js', 'about-bg.js');
importScripts('pick.js');
const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
async function offscreen() { if (!(await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['DOM_PARSER'], justification: 'Sahifa HTML\'idan matn olish' }); }
async function readViaFetch(m) {
  const html = await (await fetch(m.url, { credentials: 'include', cache: 'no-store' })).text();
  await offscreen(); return chrome.runtime.sendMessage({ to: 'off', html, sel: m.sel });
}
async function readViaTab(m) {
  const tab = await chrome.tabs.create({ url: m.url, active: false });
  try {
    await new Promise(ok => { const t = setTimeout(ok, 25000); const l = (id, ch) => { if (id === tab.id && ch.status === 'complete') { clearTimeout(t); chrome.tabs.onUpdated.removeListener(l); setTimeout(ok, 2500); } }; chrome.tabs.onUpdated.addListener(l); });
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [m.sel], func: s => document.querySelector(s)?.innerText ?? null });
    return r.result;
  } finally { chrome.tabs.remove(tab.id).catch(() => {}); }
}
async function check(m) {
  let text = null;
  if (m.how !== 'tab') { try { text = await readViaFetch(m); } catch { } }
  if (text == null) { text = await readViaTab(m).catch(() => null); if (text != null && m.how !== 'tab') m.how = 'tab'; }
  m.lastCheck = Date.now();
  if (text == null) { m.err = 'Element topilmadi (sahifa tuzilishi o\'zgargan bo\'lishi mumkin)'; return false; }
  m.err = ''; text = text.slice(0, 5000);
  if (norm(text) !== norm(m.text)) {
    m.changes = [{ t: Date.now(), old: m.text, new: text }, ...(m.changes || [])].slice(0, 15); m.text = text; m.unseen = (m.unseen || 0) + 1;
    chrome.notifications.create('w' + m.id + '-' + Date.now(), { type: 'basic', iconUrl: 'icons/128.png', title: 'O\'zgardi: ' + (m.name || m.title).slice(0, 60), message: norm(text).slice(0, 180) || '(bo\'sh)', priority: 2, requireInteraction: !!m.sticky });
    return true;
  }
  return false;
}
async function tick(force, onlyId) {
  const { mons = [] } = await chrome.storage.local.get('mons'); let changed = false;
  for (const m of mons) { if (m.paused && !onlyId) continue; if (onlyId && m.id !== onlyId) continue; if (!force && m.lastCheck && Date.now() - m.lastCheck < m.every * 60e3 - 20e3) continue; changed = (await check(m)) || changed; }
  await chrome.storage.local.set({ mons });
  const n = mons.reduce((a, m) => a + (m.unseen || 0), 0); chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#d32f2f' });
  return mons;
}
chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('tick', { periodInMinutes: 1 }));
chrome.runtime.onStartup.addListener(() => chrome.alarms.create('tick', { periodInMinutes: 1 }));
chrome.alarms.onAlarm.addListener(() => tick(false));
chrome.runtime.onMessage.addListener((m, s, r) => {
  if (m.cmd === 'check') { tick(true, m.id).then(r); return true; }
  if (m.cmd === 'pick') {
    (async () => {
      try {
        const [{ result: p }] = await chrome.scripting.executeScript({ target: { tabId: m.tabId }, func: pickElement });
        if (!p) return;
        const { mons = [] } = await chrome.storage.local.get('mons');
        mons.unshift({ id: Date.now(), url: p.url, sel: p.sel, title: p.title, name: '', text: p.text, every: m.every, lastCheck: Date.now(), changes: [], how: 'fetch' });
        await chrome.storage.local.set({ mons });
        chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: 'Kuzatuv qo\'shildi', message: (p.text || '').replace(/\s+/g, ' ').slice(0, 150) || p.title });
      } catch { }
    })();
    r(1); return false;
  }
});
chrome.notifications.onClicked.addListener(async id => { const mid = +id.slice(1).split('-')[0]; const { mons = [] } = await chrome.storage.local.get('mons'); const m = mons.find(x => x.id === mid); if (m) chrome.tabs.create({ url: m.url }); });
