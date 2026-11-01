importScripts('ru.js', 'about-bg.js');
importScripts('gen.js');
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: 'pu', title: 'Kuchli parol yaratib qo\'yish', contexts: ['editable'] }));
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { opts } = await chrome.storage.local.get('opts');
  const p = generate({ ...DEF, ...(opts || {}) });
  chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [info.frameId] }, args: [p], func: pw => {
    const el = document.activeElement; if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
    if (setter) setter.call(el, pw); else el.value = pw;
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    navigator.clipboard?.writeText(pw).catch(() => {});
  } });
});
