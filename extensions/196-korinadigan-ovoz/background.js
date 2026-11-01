// Fon xizmati: sessiyani boshqarish, offscreen hujjat, subtitrlarni tabga yetkazish
import { DEFAULTS, DICT } from './js/i18n.js';
import { translate } from './js/translate.js';

const OFFSCREEN = 'offscreen.html';
const MAX_LINES = 3000;

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULTS, ...settings };
}
async function getSession() { return (await chrome.storage.session.get('session')).session || null; }
async function setSession(s) {
  if (s) await chrome.storage.session.set({ session: s }); else await chrome.storage.session.remove('session');
  await chrome.action.setBadgeText({ text: s ? 'CC' : '' });
  if (s) await chrome.action.setBadgeBackgroundColor({ color: s.status === 'error' ? '#dc2626' : '#2563eb' });
}

async function hasOffscreen() {
  const ctx = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  return ctx.length > 0;
}
async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN,
    reasons: ['USER_MEDIA'],
    justification: "Tab ovozini subtitrga aylantirish uchun ushlash / Захват звука вкладки для субтитров"
  });
}
async function closeOffscreen() { if (await hasOffscreen()) await chrome.offscreen.closeDocument().catch(() => {}); }

// Yangi ochilgan offscreen hujjat tinglashga tayyor bo'lguncha qayta urinish
async function sendToOffscreen(msg) {
  for (let i = 0; i < 30; i++) {
    try { const r = await chrome.runtime.sendMessage(msg); if (r && r.ok) return; } catch {}
    await new Promise(res => setTimeout(res, 100));
  }
  throw new Error('offscreen');
}

async function inject(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['js/signs.js', 'content.js'] });
}
function toTab(tabId, msg) { return chrome.tabs.sendMessage(tabId, msg).catch(() => {}); }

// Matn tarixi: { t: vaqt, text, tr: tarjima, vt: video vaqti (soniya), dur, page }
let tq = Promise.resolve();
function appendTranscript(entry) { tq = tq.then(() => doAppend(entry)).catch(() => {}); return tq; }
async function doAppend(entry) {
  if (typeof entry === 'string') entry = { text: entry };
  const text = entry.text;
  const { transcript = [] } = await chrome.storage.session.get('transcript');
  const last = transcript[transcript.length - 1];
  if (last && last.text === text) return;
  transcript.push({ t: Date.now(), ...entry });
  if (transcript.length > MAX_LINES) transcript.splice(0, transcript.length - MAX_LINES);
  await chrome.storage.session.set({ transcript });
}

async function start(tabId, streamId) {
  const old = await getSession();
  if (old) await stop();
  const settings = await getSettings();
  const tab = await chrome.tabs.get(tabId);
  try { await inject(tabId); } catch (e) { throw new Error('cantCapture'); }

  const session = { tabId, title: tab.title || '', engine: settings.engine, status: settings.engine === 'site' ? 'site' : 'loading', progress: 0 };
  await setSession(session);
  await toTab(tabId, { type: 'ovoz-start', mode: settings.engine === 'site' ? 'site' : 'audio' });

  if (settings.engine !== 'site') {
    if (!streamId) streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
    await ensureOffscreen();
    await sendToOffscreen({ target: 'offscreen', type: 'start', streamId, settings });
  }
  return session;
}

async function stop() {
  const s = await getSession();
  await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }).catch(() => {});
  await closeOffscreen();
  if (s) await toTab(s.tabId, { type: 'ovoz-stop' });
  await setSession(null);
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.target === 'offscreen') return; // offscreen uchun
  (async () => {
    const s = await getSession();
    switch (msg.type) {
      case 'start':
        try { reply({ ok: true, session: await start(msg.tabId, msg.streamId) }); }
        catch (e) { await setSession(null); reply({ ok: false, error: String(e.message || e) }); }
        return;
      case 'stop': await stop(); reply({ ok: true }); return;
      case 'state': reply({ session: s }); return;
      case 'restart':
        if (s) { try { await start(s.tabId); } catch {} }
        reply({ ok: true }); return;

      // offscreen → fon
      case 'status':
        if (s) {
          s.status = msg.status; s.progress = msg.progress ?? s.progress; s.error = msg.error || '';
          await setSession(s);
          toTab(s.tabId, { type: 'ovoz-status', status: msg.status, progress: s.progress, error: s.error });
        }
        return;
      case 'caption':
        if (s) toTab(s.tabId, { type: 'ovoz-caption', text: msg.text, sound: msg.sound || '', tags: msg.tags || [], emph: msg.emph || '', tr: msg.tr || null, dur: msg.dur || 0 });
        return;
      case 'level':
        if (s) toTab(s.tabId, { type: 'ovoz-level', level: msg.level, busy: msg.busy });
        return;

      // content → fon: ko'rsatilgan subtitrni tarixga yozish (video vaqti bilan)
      case 'captionLog':
        if (msg.entry && msg.entry.text) appendTranscript({ ...msg.entry, page: sender.tab ? sender.tab.title : '' });
        return;
      case 'translate': {
        const st = await getSettings();
        reply({ tr: await translate(msg.text, msg.from || 'auto', msg.to || st.translateTo, st.googleTranslateKey) });
        return;
      }
      case 'focusTab': {
        const tab = await chrome.tabs.get(msg.tabId).catch(() => null);
        if (tab) { chrome.tabs.update(tab.id, { active: true }); chrome.windows.update(tab.windowId, { focused: true }); }
        return;
      }
      case 'alertNotify': {
        // Kalit so'z aytildi — tab ko'rinmayotgan bo'lsa tizim bildirishnomasi
        const st = await getSettings();
        if (st.notifyAlerts) notify(msg.title || DICT[st.lang || 'uz'].appName, msg.text || '', sender.tab && sender.tab.id);
        return;
      }
      case 'overlayStop': await stop(); return;
    }
  })();
  return true;
});

chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd === 'open-conversation') { chrome.tabs.create({ url: chrome.runtime.getURL('suhbat.html') }); return; }
  if (cmd !== 'toggle-captions') return;
  const s = await getSession();
  if (s) { await stop(); return; }
  const t = tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (t) start(t.id).catch(e => console.warn(e));
});

chrome.tabs.onRemoved.addListener(async tabId => {
  const s = await getSession();
  if (s && s.tabId === tabId) stop();
});

// Sahifa qayta yuklansa — subtitr oynasini qayta joylash (ovoz ushlash davom etadi)
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info.status !== 'complete') return;
  const s = await getSession();
  if (!s || s.tabId !== tabId) return;
  try {
    await inject(tabId);
    await toTab(tabId, { type: 'ovoz-start', mode: s.engine === 'site' ? 'site' : 'audio' });
    await toTab(tabId, { type: 'ovoz-status', status: s.status, progress: s.progress });
  } catch {}
});

chrome.runtime.onStartup.addListener(() => setSession(null));

// ---------- Vizual ogohlantirishlar ----------
function notify(title, message, tabId) {
  const id = 'ovoz_' + Date.now();
  chrome.notifications.create(id, { type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 2 });
  if (tabId) chrome.storage.session.get('notifTabs').then(({ notifTabs = {} }) => { notifTabs[id] = tabId; chrome.storage.session.set({ notifTabs }); });
}
chrome.notifications.onClicked.addListener(async id => {
  const { notifTabs = {} } = await chrome.storage.session.get('notifTabs');
  const tabId = notifTabs[id];
  if (tabId) { const tab = await chrome.tabs.get(tabId).catch(() => null); if (tab) { chrome.tabs.update(tabId, { active: true }); chrome.windows.update(tab.windowId, { focused: true }); } }
  chrome.notifications.clear(id);
});

// Boshqa tabda ovoz chiqsa (masalan, Telegram Web'da xabar) — joriy tabda yonib-o'chuvchi belgi
const lastAudible = new Map();
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.audible !== true) return;
  const st = await getSettings();
  if (!st.alertOtherTabs) return;
  if (Date.now() - (lastAudible.get(tabId) || 0) < 20000) return; // bitta tabdan tez-tez emas
  lastAudible.set(tabId, Date.now());
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const L = DICT[st.lang || 'uz'] || DICT.uz;
  const title = (tab.title || tab.url || '').slice(0, 60);
  if (active && active.id !== tabId && /^(https?|file):/.test(active.url || '')) {
    try {
      await inject(active.id);
      await toTab(active.id, { type: 'ovoz-alert', kind: 'tab', text: L.alertTabSound.replace('{0}', title), tabId });
    } catch {}
  }
  if (st.notifyAlerts && (!active || active.id !== tabId)) notify(L.alertTabSound.replace('{0}', title), L.alertClick, tabId);
});

