importScripts('ru.js', 'about-bg.js');
chrome.runtime.onMessage.addListener(m => { if (m.cmd === 'manage') chrome.runtime.openOptionsPage(); });
