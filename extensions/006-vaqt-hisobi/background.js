importScripts('ru.js', 'about-bg.js');
const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const domainOf = url => { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, '') : null; } catch { return null; } };
let busy = Promise.resolve();

function commitAndSet(next) {
  busy = busy.then(async () => {
    const now = Date.now();
    const { cur } = await chrome.storage.session.get('cur');
    if (cur && cur.domain) {
      const ms = Math.min(now - cur.since, 5 * 60 * 1000 + 5000);
      if (ms > 0) {
        const { days = {} } = await chrome.storage.local.get('days');
        const k = dayKey(cur.since); days[k] = days[k] || {}; days[k][cur.domain] = (days[k][cur.domain] || 0) + ms;
        const keys = Object.keys(days).sort(); while (keys.length > 120) delete days[keys.shift()];
        await chrome.storage.local.set({ days });
      }
    }
    await chrome.storage.session.set({ cur: next ? { domain: next, since: now } : null });
  }).catch(() => {});
  return busy;
}
async function current() {
  const st = await chrome.idle.queryState(60);
  if (st !== 'active') return null;
  const win = await chrome.windows.getLastFocused().catch(() => null);
  if (!win || !win.focused) return null;
  const [t] = await chrome.tabs.query({ active: true, windowId: win.id });
  return t ? domainOf(t.url) : null;
}
const refresh = async () => commitAndSet(await current());
chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onUpdated.addListener((id, ch, t) => { if (ch.url && t.active) refresh(); });
chrome.windows.onFocusChanged.addListener(refresh);
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(refresh);
chrome.alarms.create('tick', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(refresh);
chrome.runtime.onStartup.addListener(refresh);
chrome.runtime.onInstalled.addListener(refresh);
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.cmd === 'flush') { refresh().then(() => reply(1)); return true; } });
