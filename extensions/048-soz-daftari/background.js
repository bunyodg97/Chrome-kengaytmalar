importScripts('ru.js', 'about-bg.js');
importScripts('tr.js');
chrome.runtime.onInstalled.addListener(() => { chrome.contextMenus.create({ id: 'add', title: "«%s» ni lug'atga qo'shish", contexts: ['selection'] }); chrome.alarms.create('remind', { periodInMinutes: 240 }); });
chrome.contextMenus.onClicked.addListener(async info => {
  const r = await addWord(info.selectionText);
  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: r?.dup ? 'Bu so\'z lug\'atda bor' : `Qo'shildi: ${r?.w}`, message: r?.dup ? info.selectionText : (r?.tr || 'tarjima topilmadi') });
});
chrome.alarms.onAlarm.addListener(async () => {
  const { words = [], remind = true } = await chrome.storage.local.get(['words', 'remind']); const n = words.filter(due).length;
  chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#5e35b1' });
  if (remind && n >= 5) chrome.notifications.create('rem', { type: 'basic', iconUrl: 'icons/128.png', title: 'Takrorlash vaqti', message: `${n} ta so'z sizni kutmoqda. Kengaytma tugmasini bosing.` });
});
