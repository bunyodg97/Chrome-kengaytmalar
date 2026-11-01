addEventListener('message', e => { if (e.source === window && e.data?.__kx) chrome.runtime.sendMessage({ type: 'err', e: { ...e.data, url: location.href } }).catch(() => {}); });
