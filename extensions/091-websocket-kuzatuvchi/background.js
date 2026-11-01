importScripts('ru.js', 'about-bg.js');
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
const buf = {}; let Q = Promise.resolve(), saveT = null;
const k = id => 'ws' + id;
async function load(tabId) { if (!buf[tabId]) buf[tabId] = (await chrome.storage.session.get(k(tabId)))[k(tabId)] || { conns: {}, msgs: [] }; return buf[tabId]; }
chrome.runtime.onMessage.addListener((m, s) => { if (m.type !== 'ws' || !s.tab) return; const tabId = s.tab.id;
  Q = Q.then(async () => { const b = await load(tabId), e = m.e;
    if (e.ev === 'new') b.conns[e.id] = { url: e.url, proto: e.proto, st: 'ulanmoqda', t: e.t, in: 0, out: 0, bytes: 0 };
    const c = b.conns[e.id]; if (!c) return;
    if (e.ev === 'open') { c.st = 'ochiq'; c.extra = e.extra; } if (e.ev === 'close') { c.st = 'yopiq'; c.extra = e.extra; } if (e.ev === 'error') c.st = 'xato';
    if (e.ev === 'in' || e.ev === 'out') { c[e.ev]++; c.bytes += e.n || 0; b.msgs.push({ id: e.id, dir: e.ev, d: e.d, n: e.n, k: e.k, t: e.t, x: e.extra }); if (b.msgs.length > 2000) b.msgs.splice(0, b.msgs.length - 2000); }
    else b.msgs.push({ id: e.id, dir: 'sys', d: e.ev + (e.extra ? ' ' + e.extra : ''), t: e.t });
    chrome.runtime.sendMessage({ type: 'upd', tabId }).catch(() => {});
    chrome.action.setBadgeText({ tabId, text: String(Object.values(b.conns).filter(x => x.st === 'ochiq').length || '') }); chrome.action.setBadgeBackgroundColor({ tabId, color: '#00897b' });
    clearTimeout(saveT); saveT = setTimeout(() => Object.entries(buf).forEach(([t, v]) => chrome.storage.session.set({ [k(t)]: { conns: v.conns, msgs: v.msgs.slice(-600) } }).catch(() => {})), 800);
  }).catch(() => {}); });
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'get') { load(m.tabId).then(reply); return true; } if (m.type === 'clear') { buf[m.tabId] = { conns: {}, msgs: [] }; chrome.storage.session.remove(k(m.tabId)); } });
chrome.tabs.onUpdated.addListener((id, i) => { if (i.status === 'loading' && i.url) { buf[id] = { conns: {}, msgs: [] }; chrome.storage.session.remove(k(id)); } });
chrome.tabs.onRemoved.addListener(id => { delete buf[id]; chrome.storage.session.remove(k(id)); });
