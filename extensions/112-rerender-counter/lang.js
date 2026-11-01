// ISOLATED: tilni MAIN world panelga yetkazish
chrome.storage.local.get('lang').then(o => { document.documentElement.dataset.rrLang = o.lang || ''; });
