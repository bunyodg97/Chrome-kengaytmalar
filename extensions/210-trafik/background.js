// Trafik hisoblagich: har bir tarmoq javobining hajmini u ochilgan saytga yozamiz
const DEFAULTS = { dailyMB: 0, monthlyMB: 0, badge: true, paused: false };
const getS = async () => ({ ...DEFAULTS, ...((await chrome.storage.local.get('settings')).settings || {}) });

const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hostOf = url => { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, '') : null; } catch { return null; } };

// ---------- Tab → sayt ----------
const tabHost = new Map();
async function hostForTab(tabId) {
  if (tabHost.has(tabId)) return tabHost.get(tabId);
  try { const t = await chrome.tabs.get(tabId); const h = hostOf(t.url || t.pendingUrl); if (h) tabHost.set(tabId, h); return h; } catch { return null; }
}
chrome.tabs.onUpdated.addListener((id, ch, tab) => { const h = hostOf(ch.url || tab.url); if (h) tabHost.set(id, h); });
chrome.tabs.onRemoved.addListener(id => tabHost.delete(id));

// ---------- Hisoblash (xotirada yig'ib, har 3 soniyada saqlaymiz) ----------
let pending = {};        // host -> bytes
let flushTimer = null;
function add(host, bytes) {
  if (!host || !(bytes > 0)) return;
  pending[host] = (pending[host] || 0) + bytes;
  if (!flushTimer) flushTimer = setTimeout(flush, 3000);
}

let saving = Promise.resolve();
function flush() {
  flushTimer = null;
  const batch = pending; pending = {};
  if (!Object.keys(batch).length) return saving;
  saving = saving.then(async () => {
    const day = dayKey();
    const { traffic = {} } = await chrome.storage.local.get('traffic');
    const d = traffic[day] || (traffic[day] = {});
    for (const [h, b] of Object.entries(batch)) d[h] = (d[h] || 0) + b;
    // 62 kundan eskisini o'chiramiz
    const keys = Object.keys(traffic).sort();
    while (keys.length > 62) delete traffic[keys.shift()];
    await chrome.storage.local.set({ traffic });
    await afterSave(traffic);
  }).catch(e => console.error(e));
  return saving;
}

function headerSize(headers) {
  let n = 0;
  for (const h of headers || []) n += h.name.length + (h.value || '').length + 4;
  return n;
}

let paused = null;
getS().then(s => { paused = s.paused; });
chrome.webRequest.onCompleted.addListener(async details => {
  if (details.fromCache) return;
  if (paused === null) paused = (await getS()).paused;
  if (paused) return;
  const len = (details.responseHeaders || []).find(h => h.name.toLowerCase() === 'content-length');
  let bytes = len ? parseInt(len.value, 10) || 0 : 0;
  // Hajmi ko'rsatilmagan javoblar (chunked) — kamida sarlavhalar
  bytes += headerSize(details.responseHeaders) + 300;
  let host = details.tabId >= 0 ? await hostForTab(details.tabId) : null;
  if (!host) host = hostOf(details.initiator || details.documentUrl || details.url);
  add(host, bytes);
}, { urls: ['<all_urls>'] }, ['responseHeaders']);

// ---------- Limitlar va belgi ----------
const MB = 1048576;
function sumDay(d) { return Object.values(d || {}).reduce((a, b) => a + b, 0); }
function fmtShort(b) {
  if (b < MB) return `${Math.round(b / 1024)}K`;
  if (b < 1024 * MB) return `${b < 10 * MB ? (b / MB).toFixed(1) : Math.round(b / MB)}M`;
  return `${(b / 1024 / MB).toFixed(1)}G`;
}

async function afterSave(traffic) {
  const S = await getS();
  const day = dayKey();
  const today = sumDay(traffic[day]);
  const month = Object.entries(traffic).filter(([k]) => k.startsWith(day.slice(0, 7))).reduce((a, [, d]) => a + sumDay(d), 0);

  const lim = S.dailyMB ? S.dailyMB * MB : 0;
  const mlim = S.monthlyMB ? S.monthlyMB * MB : 0;
  let color = '#0891b2';
  if ((lim && today >= lim) || (mlim && month >= mlim)) color = '#e5484d';
  else if ((lim && today >= lim * 0.8) || (mlim && month >= mlim * 0.8)) color = '#f5a524';
  await chrome.action.setBadgeText({ text: S.badge ? fmtShort(today) : '' });
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setTitle({ title: `Bugun: ${(today / MB).toFixed(1)} MB · Shu oy: ${(month / MB).toFixed(0)} MB` });

  // Ogohlantirishlar (har biri kuniga/oyiga bir marta)
  const { warned = {} } = await chrome.storage.local.get('warned');
  const warn = async (key, title, msg) => {
    if (warned[key]) return;
    warned[key] = true;
    await chrome.storage.local.set({ warned });
    chrome.notifications.create(key, { type: 'basic', iconUrl: 'icons/icon128.png', title, message: msg, priority: 2 });
  };
  if (lim && today >= lim) await warn(`d100-${day}`, 'Kunlik internet limiti tugadi', `Bugun ${(today / MB).toFixed(0)} MB sarflandi (limit ${S.dailyMB} MB).`);
  else if (lim && today >= lim * 0.8) await warn(`d80-${day}`, 'Kunlik limitning 80% sarflandi', `Bugun ${(today / MB).toFixed(0)} MB / ${S.dailyMB} MB.`);
  const mk = day.slice(0, 7);
  if (mlim && month >= mlim) await warn(`m100-${mk}`, 'Oylik internet limiti tugadi', `Shu oy ${(month / MB).toFixed(0)} MB sarflandi (limit ${S.monthlyMB} MB).`);
  else if (mlim && month >= mlim * 0.8) await warn(`m80-${mk}`, 'Oylik limitning 80% sarflandi', `Shu oy ${(month / MB).toFixed(0)} MB / ${S.monthlyMB} MB.`);
}

// Yangi kun boshlanganda belgini yangilash
chrome.alarms.create('refresh', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(async () => { const { traffic = {} } = await chrome.storage.local.get('traffic'); afterSave(traffic); });
chrome.storage.onChanged.addListener(async (ch, area) => {
  if (area === 'local' && ch.settings) { paused = !!ch.settings.newValue?.paused; const { traffic = {} } = await chrome.storage.local.get('traffic'); afterSave(traffic); }
});
chrome.runtime.onMessage.addListener((msg, s, reply) => {
  if (msg.type === 'flush') { flush().then(() => reply(true)); return true; }
});
