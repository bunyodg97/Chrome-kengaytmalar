importScripts('ru.js', 'about-bg.js');
chrome.action.onClicked.addListener(async tab => {
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: () => [...document.querySelectorAll('video')].filter(v => v.videoWidth && v.getBoundingClientRect().width > 80).length });
    const fr = res.filter(r => r.result > 0).sort((a, b) => (a.frameId ? 1 : 0) - (b.frameId ? 1 : 0))[0];
    if (!fr) { chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { const d = document.createElement('div'); d.textContent = 'Bu sahifada video topilmadi'; d.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#c62828;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px system-ui;z-index:2147483647'; document.documentElement.append(d); setTimeout(() => d.remove(), 2000); } }); return; }
    await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [fr.frameId] }, files: ['frame.js'] });
  } catch (e) { console.warn(e); }
});
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.type === 'shot') { chrome.tabs.captureVisibleTab(s.tab.windowId, { format: 'png' }).then(reply, () => reply(null)); return true; }
  if (m.type === 'save') { chrome.downloads.download({ url: m.url, filename: 'Video kadrlari/' + m.name, saveAs: !!m.ask }); }
});
