// ISOLATED: qoidalarni MAIN world'ga yetkazish
(function () {
  const send = routes => window.postMessage({ __mockApiRules: (routes || []).filter(r => r.on) }, location.origin === 'null' ? '*' : location.origin);
  chrome.storage.local.get('routes').then(o => send(o.routes));
  chrome.storage.onChanged.addListener(ch => { if (ch.routes) send(ch.routes.newValue); });
})();
