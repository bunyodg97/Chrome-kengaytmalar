importScripts('ru.js', 'about-bg.js');
importScripts('defaults.js');
chrome.runtime.onInstalled.addListener(async () => { const { macros } = await chrome.storage.local.get('macros'); if (!macros) chrome.storage.local.set({ macros: KM_DEFAULT }); });
