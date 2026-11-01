chrome.action.onClicked.addListener(tab => {
  const o = /^https?:/.test(tab && tab.url || '') ? new URL(tab.url).origin : '';
  chrome.tabs.create({ url: 'mock.html' + (o ? '#origin=' + encodeURIComponent(o) : '') });
});
