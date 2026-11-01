importScripts('ru.js', 'about-bg.js');
async function register() {
  const { on = true, allow = [], bgMute = false } = await chrome.storage.local.get(['on', 'allow', 'bgMute']);
  try { await chrome.scripting.unregisterContentScripts({ ids: ['ao'] }); } catch { }
  if (on) await chrome.scripting.registerContentScripts([{ id: 'ao', js: ['block.js'], matches: ['<all_urls>'], excludeMatches: allow.flatMap(d => [`*://${d}/*`, `*://*.${d}/*`]), runAt: 'document_start', world: 'MAIN', allFrames: true, persistAcrossSessions: true }]).catch(e => console.warn(e));
  chrome.action.setBadgeText({ text: on ? '' : 'off' }); chrome.action.setBadgeBackgroundColor({ color: '#757575' });
}
async function muteBg() {
  const { bgMute = false } = await chrome.storage.local.get('bgMute'); if (!bgMute) return;
  const tabs = await chrome.tabs.query({}); const act = new Set((await chrome.tabs.query({ active: true })).map(t => t.id));
  for (const t of tabs) { const want = !act.has(t.id); if (t.mutedInfo?.reason === 'user' && !t.mutedInfo.extensionId) continue; if (!!t.mutedInfo?.muted !== want && (t.audible || t.mutedInfo?.muted)) chrome.tabs.update(t.id, { muted: want }); }
}
chrome.runtime.onInstalled.addListener(register); chrome.runtime.onStartup.addListener(register);
chrome.storage.onChanged.addListener(c => { if (c.on || c.allow) register(); if (c.bgMute) muteBg(); });
chrome.tabs.onActivated.addListener(muteBg); chrome.windows.onFocusChanged.addListener(muteBg);
chrome.tabs.onUpdated.addListener((id, ch) => { if (ch.audible !== undefined) muteBg(); });
