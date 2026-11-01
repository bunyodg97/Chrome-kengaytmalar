importScripts('ru.js', 'about-bg.js');
importScripts('db.js');
chrome.runtime.onInstalled.addListener(() => { chrome.contextMenus.create({ id: 'page', title: 'Keyinroq o\'qish uchun saqlash', contexts: ['page'] }); chrome.contextMenus.create({ id: 'link', title: 'Havoladagi maqolani saqlash', contexts: ['link'] }); });
async function saveTab(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['lib/Readability.js'] });
  const [{ result: a }] = await chrome.scripting.executeScript({ target: { tabId }, files: ['extract.js'] });
  const all = await DB.all(), ex = all.find(x => x.url === a.url);
  const o = { ...(ex || {}), ...a, id: ex?.id || crypto.randomUUID(), t: ex?.t || Date.now(), tags: ex?.tags || [], pos: ex?.pos || 0, arch: false };
  await DB.put(o); badge(); flash(tabId, ex ? 'Yangilandi ✓' : 'Saqlandi ✓'); return o;
}
function flash(tabId, msg) { chrome.scripting.executeScript({ target: { tabId }, func: m => { const d = document.createElement('div'); d.textContent = '📥 ' + m; d.style.cssText = 'position:fixed;top:16px;right:16px;background:#ef4056;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px system-ui;z-index:2147483647;box-shadow:0 4px 16px #0004'; document.documentElement.append(d); setTimeout(() => d.remove(), 1800); }, args: [msg] }).catch(() => {}); }
async function saveUrl(url) {
  const tab = await chrome.tabs.create({ url, active: false });
  await new Promise(ok => { const l = (id, i) => { if (id === tab.id && i.status === 'complete') { chrome.tabs.onUpdated.removeListener(l); ok(); } }; chrome.tabs.onUpdated.addListener(l); setTimeout(ok, 20000); });
  try { await new Promise(r => setTimeout(r, 800)); return await saveTab(tab.id); } finally { chrome.tabs.remove(tab.id); }
}
async function badge() { const n = (await DB.all()).filter(x => !x.arch).length; chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#ef4056' }); }
chrome.contextMenus.onClicked.addListener((i, tab) => i.menuItemId === 'link' ? saveUrl(i.linkUrl).catch(() => {}) : saveTab(tab.id).catch(() => {}));
chrome.commands.onCommand.addListener(async c => { if (c === 'save') { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); saveTab(t.id).catch(() => {}); } });
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'save') { saveTab(m.tabId).then(reply, e => reply({ error: String(e.message || e) })); return true; } if (m.type === 'badge') badge(); });
chrome.runtime.onStartup.addListener(badge);
