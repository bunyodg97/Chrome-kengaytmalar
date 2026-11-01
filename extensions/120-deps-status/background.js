chrome.action.onClicked.addListener(tab => {
  const m = (tab && tab.url || '').match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+\/)?(package\.json|requirements[\w.-]*\.txt)$/);
  const raw = m ? tab.url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/') : '';
  chrome.tabs.create({ url: 'deps.html' + (raw ? '#src=' + encodeURIComponent(raw) : '') });
});
