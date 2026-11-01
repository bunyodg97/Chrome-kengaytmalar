importScripts('ru.js', 'about-bg.js');
// holat: {end, dur, paused:false|remainingMs, label, warn:[minutes]}
const get = () => chrome.storage.local.get('t').then(o => o.t || null);
const set = t => chrome.storage.local.set({ t });
async function beep(kind) {
  const { sound = true } = await chrome.storage.local.get('sound'); if (!sound) return;
  if (!(await chrome.offscreen.hasDocument())) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Taymer signali' });
  chrome.runtime.sendMessage({ to: 'off', kind });
}
async function tick() {
  const t = await get();
  if (!t) { chrome.action.setBadgeText({ text: '' }); return; }
  const left = t.paused != null ? t.paused : t.end - Date.now();
  if (left <= 0 && t.paused == null) {
    await set(null); chrome.alarms.clear('tick'); chrome.action.setBadgeText({ text: '⏰' }); chrome.action.setBadgeBackgroundColor({ color: '#d32f2f' });
    chrome.notifications.create('end', { type: 'basic', iconUrl: 'icons/128.png', title: 'Vaqt tugadi!', message: t.label || 'Taymer tugadi', priority: 2, requireInteraction: true });
    beep('end'); setTimeout(() => chrome.action.setBadgeText({ text: '' }), 60000); return;
  }
  const m = Math.ceil(left / 60000);
  chrome.action.setBadgeText({ text: left < 60000 ? Math.ceil(left / 1000) + 's' : m + '' });
  chrome.action.setBadgeBackgroundColor({ color: t.paused != null ? '#757575' : m <= 1 ? '#d32f2f' : m <= 5 ? '#f57c00' : '#00897b' });
  if (t.paused == null) for (const w of t.warn || []) {
    if (!t.done?.includes(w) && left <= w * 60000 && left > (w * 60000 - 90000)) {
      t.done = [...(t.done || []), w]; await set(t);
      chrome.notifications.create('w' + w, { type: 'basic', iconUrl: 'icons/128.png', title: `${w} daqiqa qoldi`, message: t.label || 'Uchrashuv taymeri', priority: 1 }); beep('warn');
    }
  }
  // oxirgi daqiqada aniq tugashi uchun
  if (t.paused == null && left < 65000) setTimeout(tick, Math.min(left + 50, 1000));
}
chrome.alarms.onAlarm.addListener(a => a.name === 'tick' && tick());
chrome.runtime.onMessage.addListener((m, s, reply) => {
  (async () => {
    let t = await get();
    if (m.cmd === 'start') { t = { end: Date.now() + m.ms, dur: m.ms, label: m.label, warn: m.warn, done: [] }; await set(t); chrome.alarms.create('tick', { periodInMinutes: 0.5 }); chrome.notifications.clear('end'); }
    if (m.cmd === 'pause' && t && t.paused == null) { t.paused = t.end - Date.now(); await set(t); }
    if (m.cmd === 'resume' && t && t.paused != null) { t.end = Date.now() + t.paused; delete t.paused; await set(t); }
    if (m.cmd === 'add' && t) { if (t.paused != null) t.paused += m.ms; else t.end += m.ms; t.dur += m.ms; t.done = (t.done || []).filter(w => (t.paused ?? t.end - Date.now()) <= w * 60000); await set(t); }
    if (m.cmd === 'stop') { await set(null); chrome.alarms.clear('tick'); }
    if (m.cmd === 'test') beep('end');
    await tick(); reply(await get());
  })(); return true;
});
chrome.runtime.onStartup.addListener(tick);
