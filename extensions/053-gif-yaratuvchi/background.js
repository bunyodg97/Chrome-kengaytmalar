importScripts('ru.js', 'about-bg.js');
let rec = { state: 'idle' };
const DEF = { fps: 10, width: 640, max: 15, countdown: true, loop: true };
const toOff = m => chrome.runtime.sendMessage({ to: 'off', ...m });
async function offscreen() { if (!(await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'GIF yozish' }); }
const badge = (t, c = '#c2185b') => { chrome.action.setBadgeText({ text: t }); chrome.action.setBadgeBackgroundColor({ color: c }); };
async function finish() { if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'regionEnd' }).catch(() => {}); rec = { state: 'idle' }; badge(''); }
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to === 'off') return;
  (async () => {
    if (m.cmd === 'start') {
      if (rec.state !== 'idle') return reply({ error: 'Yozuv ketmoqda' });
      const tab = m.tab; if (!/^(https?|file):/.test(tab.url || '')) return reply({ error: 'Bu sahifani yozib bo\'lmaydi' });
      const cfg = { ...DEF, ...((await chrome.storage.local.get('cfg')).cfg || {}) };
      await offscreen();
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      const r = await toOff({ cmd: 'prepare', streamId, cfg }); if (r?.error) return reply(r);
      rec = { state: 'selecting', tabId: tab.id };
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['region.js'] });
      await chrome.tabs.sendMessage(tab.id, { cmd: 'regionInit', countdown: cfg.countdown });
      return reply({ ok: true });
    }
    if (m.cmd === 'regionGo') { await toOff({ cmd: 'record', rect: m.rect, vw: m.vw }); rec.state = 'recording'; return reply(1); }
    if (m.cmd === 'regionCancel') { await toOff({ cmd: 'cancel' }).catch(() => {}); await finish(); return reply(1); }
    if (m.cmd === 'stop') { if (rec.state === 'recording') { badge('…', '#757575'); await toOff({ cmd: 'stop' }); } else { await toOff({ cmd: 'cancel' }).catch(() => {}); await finish(); } return reply(1); }
    if (m.cmd === 'pause') return reply({ paused: false });
    if (m.cmd === 'state') return reply(rec);
    if (m.cmd === 'tick') { badge(String(m.sec)); if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'tick', sec: m.sec }).catch(() => {}); return; }
    if (m.cmd === 'encoding') { if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'regionEnd' }).catch(() => {}); badge(m.p + '%', '#757575'); return; }
    if (m.cmd === 'done') { await finish(); chrome.tabs.create({ url: 'save.html#' + m.id }); setTimeout(() => chrome.offscreen.closeDocument().catch(() => {}), 1000); return; }
    if (m.cmd === 'error') { await finish(); await chrome.storage.session.set({ err: m.error }); return; }
  })();
  return true;
});
