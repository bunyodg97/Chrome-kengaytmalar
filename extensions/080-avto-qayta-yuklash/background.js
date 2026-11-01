importScripts('ru.js', 'about-bg.js');
async function reloadExts(ids, why = 'qo\'lda') {
  const { reloadTab = true, tabPattern = '' } = await chrome.storage.local.get(['reloadTab', 'tabPattern']);
  for (const id of ids) { try { await chrome.management.setEnabled(id, false); await chrome.management.setEnabled(id, true); } catch (e) { console.warn(id, e); } }
  if (reloadTab) { const tabs = tabPattern ? await chrome.tabs.query({ url: tabPattern.split(',').map(s => s.trim()) }).catch(() => []) : await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    for (const t of tabs) if (/^https?:|^file:/.test(t.url || '')) chrome.tabs.reload(t.id); }
  const { log = [] } = await chrome.storage.local.get('log'); chrome.storage.local.set({ log: [{ t: Date.now(), n: ids.length, why }, ...log].slice(0, 30) });
  chrome.action.setBadgeText({ text: '↻' }); chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' }); setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1200);
}
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'reload') { reloadExts(m.ids, m.why).then(() => reply(true)); return true; } });
chrome.commands.onCommand.addListener(async () => { const { sel = [] } = await chrome.storage.local.get('sel'); if (sel.length) reloadExts(sel); });
