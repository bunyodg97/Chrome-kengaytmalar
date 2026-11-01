importScripts('ru.js', 'about-bg.js');
function selectRect() {
  return new Promise(ok => {
    const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.25)';
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;border:2px solid #fff;outline:2px solid #283593;background:rgba(255,255,255,.08);display:none;z-index:2147483647;pointer-events:none';
    const tip = document.createElement('div'); tip.textContent = 'Matnli qismni sichqoncha bilan belgilang (Esc — bekor)'; tip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#283593;color:#fff;font:600 13px system-ui;padding:7px 12px;border-radius:8px;pointer-events:none';
    document.documentElement.append(ov, box, tip); let s = null;
    const end = r => { ov.remove(); box.remove(); tip.remove(); removeEventListener('keydown', kd, true); requestAnimationFrame(() => requestAnimationFrame(() => ok(r))); };
    const kd = e => { if (e.key === 'Escape') end(null); };
    ov.onpointerdown = e => { s = { x: e.clientX, y: e.clientY }; ov.setPointerCapture(e.pointerId); box.style.display = 'block'; };
    ov.onpointermove = e => { if (!s) return; const x = Math.min(s.x, e.clientX), y = Math.min(s.y, e.clientY), w = Math.abs(e.clientX - s.x), h = Math.abs(e.clientY - s.y); Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); };
    ov.onpointerup = e => { const r = { x: Math.min(s.x, e.clientX), y: Math.min(s.y, e.clientY), w: Math.abs(e.clientX - s.x), h: Math.abs(e.clientY - s.y), dpr: devicePixelRatio, vw: innerWidth }; end(r.w > 8 && r.h > 8 ? r : null); };
    addEventListener('keydown', kd, true);
  });
}
chrome.action.onClicked.addListener(async tab => {
  try {
    const [{ result: r }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: selectRect });
    if (!r) return;
    const img = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    await chrome.storage.local.set({ shot: { img, r, t: Date.now(), title: tab.title } });
    chrome.tabs.create({ url: 'ocr.html', index: tab.index + 1 });
  } catch { chrome.tabs.create({ url: 'ocr.html#bosh' }); }
});
