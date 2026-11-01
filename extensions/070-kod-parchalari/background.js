importScripts('ru.js', 'about-bg.js');
importScripts('hl.js');
chrome.runtime.onInstalled.addListener(() => { chrome.contextMenus.create({ id: 'save', title: 'Kod parchasi sifatida saqlash', contexts: ['selection'] }); chrome.contextMenus.create({ id: 'ins', title: 'Kod parchasini qo\'yish…', contexts: ['editable'] }); });
async function saveSnip(code, src) {
  const { snips = [] } = await chrome.storage.local.get('snips');
  snips.unshift({ id: crypto.randomUUID(), title: code.trim().split('\n')[0].slice(0, 60), code, lang: guessLang(code), tags: [], src, t: Date.now(), used: 0 });
  await chrome.storage.local.set({ snips });
}
async function palette(tabId) { await chrome.scripting.executeScript({ target: { tabId }, files: ['palette.js'] }); }
chrome.contextMenus.onClicked.addListener(async (i, tab) => {
  if (i.menuItemId === 'save') {
    // tanlangan matnni qatorlarini saqlagan holda olish
    let code = i.selectionText; try { const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [i.frameId || 0] }, func: () => getSelection().toString() }); if (result) code = result; } catch {}
    await saveSnip(code, tab.url); chrome.action.setBadgeText({ text: '✓', tabId: tab.id }); setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 1500);
  } else palette(tab.id).catch(() => {});
});
chrome.commands.onCommand.addListener(async c => { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); if (t) palette(t.id).catch(() => {}); });
