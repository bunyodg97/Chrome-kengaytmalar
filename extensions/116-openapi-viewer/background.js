chrome.action.onClicked.addListener(tab => {
  const u = tab && tab.url || '';
  const looks = /^https?:/.test(u) && /(\.(json|ya?ml)(\?|$))|openapi|swagger|api-docs/i.test(u);
  chrome.tabs.create({ url: 'viewer.html' + (looks ? '#url=' + encodeURIComponent(u) : '') });
});
