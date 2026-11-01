chrome.action.onClicked.addListener(tab => {
  const m = (tab && tab.url || '').match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
  chrome.tabs.create({ url: 'graph.html' + (m ? '#' + m[1] + '/' + m[2] : '') });
});
