importScripts('blocked.js');

// Har bir tab uchun topilgan videolar: storage.session { v<tabId>: { items:[...], drm:false, page:'' } }
const KEY = id => 'v' + id;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const tabPage = new Map();          // tabId -> sahifa manzili

async function getTab(id) { return (await chrome.storage.session.get(KEY(id)))[KEY(id)] || { items: [], drm: false }; }
let q = Promise.resolve();
function update(tabId, fn) {
  q = q.then(async () => {
    const d = await getTab(tabId);
    fn(d);
    await chrome.storage.session.set({ [KEY(tabId)]: d });
    const n = d.items.length;
    chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#e11d48' }).catch(() => {});
  }).catch(() => {});
  return q;
}

// Bir xil videoning turli bo'laklari (range) bitta bo'lib ko'rinishi uchun
function normUrl(u) {
  try {
    const x = new URL(u);
    for (const k of ['range', 'bytes', 'start', 'end', 'rn', 'rbuf', '_']) x.searchParams.delete(k);
    return x.href;
  } catch { return u; }
}

function addItem(tabId, item) {
  if (tabId < 0) return;
  const page = tabPage.get(tabId) || '';
  if (vyBlockedName(hostOf(page)) || vyBlockedName(hostOf(item.url))) return;     // himoyalangan saytlar — o'tkazamiz
  update(tabId, d => {
    const key = normUrl(item.url);
    const ex = d.items.find(x => x.key === key);
    if (ex) {
      if (item.size > (ex.size || 0)) ex.size = item.size;
      for (const k of ['w', 'h', 'dur', 'title']) if (item[k] && !ex[k]) ex[k] = item[k];
      return;
    }
    // HLS bo'laklari (.ts/.m4s) alohida video emas
    if (/\.(ts|m4s|aac)(\?|$)/i.test(item.url) && item.kind !== 'hls') return;
    d.items.push({ ...item, key, page, t: Date.now() });
    if (d.items.length > 60) d.items.shift();
  });
}

// ---------- Tarmoqdan topish ----------
chrome.webRequest.onHeadersReceived.addListener(det => {
  if (det.tabId < 0 || det.method !== 'GET') return;
  const h = Object.fromEntries((det.responseHeaders || []).map(x => [x.name.toLowerCase(), x.value || '']));
  const ct = (h['content-type'] || '').toLowerCase().split(';')[0];
  const url = det.url;
  let kind = null;
  if (/mpegurl/.test(ct) || /\.m3u8(\?|$)/i.test(url)) kind = 'hls';
  else if (/dash\+xml/.test(ct) || /\.mpd(\?|$)/i.test(url)) kind = 'dash';
  else if (/^video\//.test(ct) || /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(url)) kind = 'file';
  if (!kind) return;
  let size = parseInt(h['content-length'] || '0', 10);
  const cr = h['content-range']; if (cr) { const m = cr.match(/\/(\d+)/); if (m) size = +m[1]; }
  if (kind === 'file' && size && size < 300 * 1024) return;        // mayda reklama/preview fayllar
  addItem(det.tabId, { url, kind, size, mime: ct || null, src: 'net' });
}, { urls: ['<all_urls>'], types: ['media', 'xmlhttprequest', 'other', 'main_frame', 'sub_frame'] }, ['responseHeaders']);

// Sahifa almashsa — ro'yxatni tozalash
chrome.tabs.onUpdated.addListener((id, ch, tab) => {
  if (ch.url) {
    const old = tabPage.get(id);
    tabPage.set(id, ch.url);
    if (!old || hostOf(old) !== hostOf(ch.url) || new URL(old).pathname !== new URL(ch.url).pathname) {
      chrome.storage.session.remove(KEY(id));
      chrome.action.setBadgeText({ tabId: id, text: '' }).catch(() => {});
    }
  } else if (tab.url && !tabPage.has(id)) tabPage.set(id, tab.url);
});
chrome.tabs.onRemoved.addListener(id => { tabPage.delete(id); chrome.storage.session.remove(KEY(id)); });

// ---------- Kontent skriptdan ----------
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  const tabId = sender.tab?.id;
  if (msg.type === 'dom' && tabId != null) {
    if (sender.frameId === 0) tabPage.set(tabId, sender.tab.url);
    if (msg.drm) update(tabId, d => { d.drm = true; });
    for (const v of msg.videos) addItem(tabId, { url: v.url, kind: /\.m3u8/i.test(v.url) ? 'hls' : 'file', size: 0, w: v.w, h: v.h, dur: v.dur, title: msg.title, src: 'dom' });
    if (msg.title) update(tabId, d => { d.title = msg.title; });
  }
  if (msg.type === 'list') { getTab(msg.tabId).then(reply); return true; }
  // Yangi yuklash vazifalari: navbatga qo'shiladi, yuklash sahifasi ularni oladi
  if (msg.type === 'queue') {
    q = q.then(async () => {
      const { queue = [] } = await chrome.storage.session.get('queue');
      queue.push({ ...msg.job, id: Math.random().toString(36).slice(2), status: 'kutmoqda', added: Date.now() });
      await chrome.storage.session.set({ queue });
      await ensureManager();
    }).then(() => { chrome.runtime.sendMessage({ type: 'newJob' }).catch(() => {}); reply(true); });
    return true;
  }
  if (msg.type === 'takeQueue') {
    q = q.then(async () => {
      const { queue = [] } = await chrome.storage.session.get('queue');
      await chrome.storage.session.set({ queue: [] });
      reply(queue);
    });
    return true;
  }
  if (msg.type === 'referer') {
    q = q.then(() => setReferer(msg.urls, msg.referer, msg.rule || 1)).catch(e => console.warn(e)).then(() => reply(true));
    return true;
  }
});

// Yuklash sahifasi — doim bitta
async function ensureManager() {
  const { mgrTab } = await chrome.storage.session.get('mgrTab');
  if (mgrTab) { try { await chrome.tabs.get(mgrTab); return; } catch {} }
  const t = await chrome.tabs.create({ url: chrome.runtime.getURL('yuklash.html'), active: false });
  await chrome.storage.session.set({ mgrTab: t.id });
}

// Ba'zi saytlar videoni faqat o'z sahifasidan so'ralganda beradi — yuklash paytida Referer qo'shamiz
// Har bir yuklash o'z qoida raqamidan foydalanadi (bir-birini o'chirib yubormasligi uchun)
async function setReferer(urls, referer, rule) {
  const domains = [...new Set(urls.map(hostOf).filter(Boolean))];
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [rule] });
  if (!domains.length || !referer) return;
  await chrome.declarativeNetRequest.updateSessionRules({ addRules: [{
    id: rule, priority: 1,
    action: { type: 'modifyHeaders', requestHeaders: [{ header: 'Referer', operation: 'set', value: referer }] },
    condition: { requestDomains: domains, resourceTypes: ['xmlhttprequest', 'other', 'media'] }
  }] });
}
