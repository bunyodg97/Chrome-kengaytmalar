importScripts('ru.js', 'about-bg.js');
importScripts('grab.js');
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: 'add', title: 'Xarid ro\'yxatiga qo\'shish', contexts: ['page', 'selection', 'link', 'image'] }));
async function add(tabId, sel) {
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: grabProduct, args: [sel || ''] });
  const { items = [] } = await chrome.storage.local.get('items');
  const ex = items.find(i => i.url === result.url && !i.done);
  if (ex) ex.qty++; else items.unshift({ id: crypto.randomUUID(), ...result, qty: 1, done: false, t: Date.now() });
  await chrome.storage.local.set({ items }); badge(items); return result;
}
function badge(items) { const n = items.filter(i => !i.done).length; chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' }); }
chrome.contextMenus.onClicked.addListener((i, tab) => add(tab.id, i.selectionText).then(r => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: n => { const d = document.createElement('div'); d.textContent = '🛒 Qo\'shildi: ' + n; d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px system-ui;z-index:2147483647;box-shadow:0 4px 16px #0004'; document.documentElement.append(d); setTimeout(() => d.remove(), 2200); }, args: [r.name.slice(0, 60)] })).catch(() => {}));
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'add') { add(m.tabId).then(reply, e => reply({ error: String(e.message || e) })); return true; } });
chrome.storage.onChanged.addListener(c => c.items && badge(c.items.newValue || []));
