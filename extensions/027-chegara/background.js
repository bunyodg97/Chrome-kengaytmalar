importScripts('ru.js', 'about-bg.js');
importScripts('modes.js');
chrome.commands.onCommand.addListener(async c => {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [r] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: () => !!document.getElementById('__chegara_outline') });
  await chrome.scripting.executeScript({ target: { tabId: t.id }, func: css => { window.__chCSS = css; }, args: [CSS] });
  chrome.scripting.executeScript({ target: { tabId: t.id }, func: pageTool, args: ['outline', !r.result] });
});
