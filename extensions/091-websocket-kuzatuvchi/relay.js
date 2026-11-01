addEventListener('message', e => { if (e.source === window && e.data?.__wsk) chrome.runtime.sendMessage({ type: 'ws', e: e.data }).catch(() => {}); });
