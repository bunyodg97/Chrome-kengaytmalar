importScripts('ru.js', 'about-bg.js');
importScripts('mail.js');
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('poll', { periodInMinutes: 1 });
  chrome.contextMenus.create({ id: 'vp', title: 'Vaqtinchalik email manzilni qo\'yish', contexts: ['editable'] });
});
chrome.alarms.onAlarm.addListener(async () => {
  const box = await getBox(); if (!box) return;
  try {
    const ms = await messages(box); const { seen = [] } = await chrome.storage.local.get('seen');
    const fresh = ms.filter(m => !seen.includes(m.id));
    fresh.slice(0, 3).forEach(m => chrome.notifications.create('vp' + m.id, { type: 'basic', iconUrl: 'icons/128.png', title: 'Yangi xat: ' + (m.from?.name || m.from?.address || ''), message: m.subject || '(mavzusiz)' }));
    if (fresh.length) await chrome.storage.local.set({ seen: [...seen, ...fresh.map(m => m.id)].slice(-300) });
    const unread = ms.filter(m => !m.seen).length;
    chrome.action.setBadgeText({ text: unread ? String(unread) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#00897b' });
  } catch { }
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let box = await getBox(); if (!box) box = await createAccount().catch(() => null); if (!box) return;
  chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [info.frameId] }, args: [box.address], func: a => {
    const el = document.activeElement; if (!el) return; const set = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
    set ? set.call(el, a) : (el.value = a); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  } });
});
chrome.notifications.onClicked.addListener(() => chrome.action.openPopup?.().catch(() => {}));
