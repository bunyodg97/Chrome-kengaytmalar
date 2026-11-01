importScripts('ru.js', 'about-bg.js');
importScripts('lib/qrcode.js', 'qr.js');
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'link', title: 'Havolani telefonda ochish (QR)', contexts: ['link'] });
  chrome.contextMenus.create({ id: 'img', title: 'Rasmni telefonda ochish (QR)', contexts: ['image'] });
  chrome.contextMenus.create({ id: 'sel', title: 'Matnni telefonga o\'tkazish (QR)', contexts: ['selection'] });
});
chrome.contextMenus.onClicked.addListener((i, tab) => {
  const text = i.menuItemId === 'link' ? i.linkUrl : i.menuItemId === 'img' ? i.srcUrl : i.selectionText;
  if (!text || text.length > 2500) return;
  chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [qrSvg(text), text], func: (svg, text) => {
    document.getElementById('__tq')?.remove();
    const d = document.createElement('div'); d.id = '__tq'; d.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:grid;place-items:center';
    const sh = d.attachShadow({ mode: 'open' });
    sh.innerHTML = `<style>.b{background:#fff;border-radius:14px;padding:18px;text-align:center;font:14px system-ui;max-width:360px;color:#111}.b svg{width:280px;height:280px}.t{font-size:12px;color:#666;word-break:break-all;max-height:60px;overflow:hidden;margin-top:6px}button{margin-top:10px;border:0;background:#1e88e5;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer}</style><div class="b"><b>📱 Telefon kamerasi bilan skanerlang</b><div>${svg}</div><div class="t"></div><button>Yopish</button></div>`;
    sh.querySelector('.t').textContent = text; const close = () => d.remove();
    sh.querySelector('button').onclick = close; d.onclick = e => { if (e.target === d) close(); }; addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });
    document.documentElement.appendChild(d);
  } }).catch(() => {});
});
