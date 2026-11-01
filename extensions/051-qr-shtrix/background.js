importScripts('ru.js', 'about-bg.js');
chrome.runtime.onInstalled.addListener(() => { chrome.contextMenus.create({ id: 'qr', title: 'QR-kod yaratish', contexts: ['link', 'selection', 'page', 'image'] }); });
chrome.contextMenus.onClicked.addListener((i, t) => { const v = i.linkUrl || i.srcUrl || i.selectionText || t.url; chrome.windows.create({ url: 'popup.html?t=' + encodeURIComponent(v), type: 'popup', width: 420, height: 640 }); });
