importScripts('ru.js', 'about-bg.js');
const DEF = { mode: 'region', mic: false, sysAudio: true, fmt: 'mp4', quality: 'high', fps: 30, nameMode: 'ask', countdown: true };
let rec = { state: 'idle' }; // idle | selecting | recording | paused
const cfg = async () => ({ ...DEF, ...((await chrome.storage.local.get('cfg')).cfg || {}) });
async function offscreen() {
  if ((await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length) return;
  await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA', 'DISPLAY_MEDIA'], justification: 'Ekranni videoga yozish' });
}
const toOff = m => chrome.runtime.sendMessage({ to: 'off', ...m });
function badge(text, color = '#d32f2f') { chrome.action.setBadgeText({ text }); chrome.action.setBadgeBackgroundColor({ color }); }
async function setState(s) { rec = { ...rec, ...s }; await chrome.storage.session.set({ rec }); }

async function start(mode, tab) {
  const c = await cfg();
  if (rec.state !== 'idle') return { error: 'Yozuv allaqachon ketmoqda' };
  await offscreen();
  if (mode === 'screen') {
    const streamId = await new Promise(ok => chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab', 'audio'], id => ok(id)));
    if (!streamId) return { error: 'Bekor qilindi' };
    const r = await toOff({ cmd: 'start', kind: 'desktop', streamId, cfg: c });
    if (r?.error) return r;
    await setState({ state: 'recording', mode, tabId: null, t0: Date.now() });
    return { ok: true };
  }
  if (!tab || !/^(https?|file):/.test(tab.url || '')) return { error: 'Bu sahifani yozib bo\'lmaydi. Oddiy veb-saytni oching yoki «Butun ekran» rejimini tanlang.' };
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  const r = await toOff({ cmd: 'prepare', kind: 'tab', streamId, cfg: c });
  if (r?.error) return r;
  if (mode === 'tab') {
    const [{ result: vp }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => ({ w: innerWidth, h: innerHeight }) });
    await toOff({ cmd: 'record', rect: { x: 0, y: 0, w: vp.w, h: vp.h }, vw: vp.w });
    await setState({ state: 'recording', mode, tabId: tab.id, t0: Date.now() });
    return { ok: true };
  }
  await setState({ state: 'selecting', mode, tabId: tab.id });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['region.js'] });
  await chrome.tabs.sendMessage(tab.id, { cmd: 'regionInit', countdown: c.countdown });
  return { ok: true };
}
async function stop() {
  if (rec.state === 'idle') return;
  if (rec.state === 'selecting') { await toOff({ cmd: 'cancel' }).catch(() => {}); await finish(); return; }
  await toOff({ cmd: 'stop' }).catch(() => finish());
}
async function finish() {
  if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'regionEnd' }).catch(() => {});
  await setState({ state: 'idle', mode: null, tabId: null }); badge('');
}

chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to === 'off') return;
  (async () => {
    if (m.cmd === 'start') return reply(await start(m.mode, m.tab).catch(e => ({ error: e.message })));
    if (m.cmd === 'stop') { await stop(); return reply(1); }
    if (m.cmd === 'pause') { const r = await toOff({ cmd: rec.state === 'paused' ? 'resume' : 'pause' }); await setState({ state: r.paused ? 'paused' : 'recording' }); if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'paused', v: r.paused }).catch(() => {}); return reply(r); }
    if (m.cmd === 'state') return reply(rec);
    // hudud tanlandi
    if (m.cmd === 'regionGo') { await toOff({ cmd: 'record', rect: m.rect, vw: m.vw }); await setState({ state: 'recording', t0: Date.now() }); return reply(1); }
    if (m.cmd === 'regionCancel') { await toOff({ cmd: 'cancel' }).catch(() => {}); await finish(); return reply(1); }
    // offscreen xabarlari
    if (m.cmd === 'tick') { const s = m.sec; badge(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, rec.state === 'paused' ? '#f9a825' : '#d32f2f'); if (rec.tabId) chrome.tabs.sendMessage(rec.tabId, { cmd: 'tick', sec: s }).catch(() => {}); return; }
    if (m.cmd === 'done') {
      await finish();
      if (m.id) chrome.tabs.create({ url: `save.html#${m.id}` });
      const ctx = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] }); if (ctx.length) setTimeout(() => chrome.offscreen.closeDocument().catch(() => {}), 1500);
      return;
    }
    if (m.cmd === 'error') { await finish(); await chrome.storage.session.set({ lastErr: m.error }); badge('!', '#757575'); return; }
  })();
  return true;
});
chrome.commands.onCommand.addListener(async c => {
  if (c !== 'toggle') return;
  if (rec.state !== 'idle') return stop();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  start((await cfg()).mode, tab);
});
chrome.tabs.onRemoved.addListener(id => { if (rec.tabId === id && rec.state !== 'idle') stop(); });
chrome.runtime.onStartup.addListener(() => setState({ state: 'idle' }));
chrome.storage.session.get('rec').then(o => { if (o.rec) rec = o.rec; });
