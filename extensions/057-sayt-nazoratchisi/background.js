importScripts('ru.js', 'about-bg.js');
async function probe(s) {
  const t0 = Date.now(), ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), (s.timeout || 15) * 1000);
  try {
    const r = await fetch(s.url + (s.url.includes('?') ? '&' : '?') + '_nz=' + Date.now(), { cache: 'no-store', signal: ctrl.signal, credentials: 'omit', redirect: 'follow' });
    const ms = Date.now() - t0; let ok = r.ok, why = r.ok ? '' : 'HTTP ' + r.status;
    if (ok && s.kw) { const tx = await r.text(); if (!tx.includes(s.kw)) { ok = false; why = `«${s.kw}» matni topilmadi`; } }
    if (ok && s.slow && ms > s.slow) why = `sekin: ${ms} ms`;
    return { t: Date.now(), ok, ms, code: r.status, why };
  } catch (e) { return { t: Date.now(), ok: false, ms: Date.now() - t0, code: 0, why: e.name === 'AbortError' ? 'javob kelmadi (timeout)' : 'ulanib bo\'lmadi' }; }
  finally { clearTimeout(to); }
}
async function tg(text) { const { tg } = await chrome.storage.local.get('tg'); if (!tg?.token || !tg?.chat) return; fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: tg.chat, text }) }).catch(() => {}); }
async function run(force, only) {
  const { sites = [] } = await chrome.storage.local.get('sites');
  await Promise.all(sites.map(async s => {
    if (only && s.id !== only) return; if (s.paused && !only) return;
    if (!force && s.last && Date.now() - s.last.t < s.every * 60e3 - 15e3) return;
    const r = await probe(s); const prev = s.last; s.last = r; s.hist = [...(s.hist || []), { t: r.t, ok: r.ok, ms: r.ms }].slice(-500);
    const name = s.name || new URL(s.url).host;
    if (prev && prev.ok && !r.ok) { s.downSince = r.t; chrome.notifications.create('d' + s.id, { type: 'basic', iconUrl: 'icons/128.png', title: `🔴 ${name} ishlamayapti`, message: r.why, priority: 2, requireInteraction: true }); tg(`🔴 ${name} ishlamayapti: ${r.why}\n${s.url}`); }
    if (prev && !prev.ok && r.ok) { const d = s.downSince ? Math.round((r.t - s.downSince) / 60e3) : null; chrome.notifications.create('u' + s.id, { type: 'basic', iconUrl: 'icons/128.png', title: `🟢 ${name} qayta ishladi`, message: d != null ? `${d} daqiqa ishlamadi` : 'Tiklandi' }); tg(`🟢 ${name} qayta ishladi${d != null ? ` (${d} daqiqa uzilish)` : ''}`); s.downSince = null; }
  }));
  const fresh = (await chrome.storage.local.get('sites')).sites || []; // parallel o'zgarishlarni saqlab qolamiz
  const map = Object.fromEntries(sites.map(s => [s.id, s])); await chrome.storage.local.set({ sites: fresh.map(s => map[s.id] ? { ...s, last: map[s.id].last, hist: map[s.id].hist, downSince: map[s.id].downSince } : s) });
  const down = sites.filter(s => s.last && !s.last.ok && !s.paused).length;
  chrome.action.setBadgeText({ text: down ? String(down) : sites.length ? '✓' : '' }); chrome.action.setBadgeBackgroundColor({ color: down ? '#d32f2f' : '#2e7d32' });
}
chrome.runtime.onInstalled.addListener(() => chrome.alarms.create('t', { periodInMinutes: 1 }));
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('t', { periodInMinutes: 1 }); run(true); });
chrome.alarms.onAlarm.addListener(() => run(false));
chrome.runtime.onMessage.addListener((m, s, r) => { if (m.cmd === 'run') { run(true, m.id).then(() => r(1)); return true; } });
