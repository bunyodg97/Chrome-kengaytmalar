importScripts('ru.js', 'about-bg.js');
importScripts('vol.js');
const vols = () => chrome.storage.session.get('vols').then(o => o.vols || {});
async function apply(tabId, v) { try { await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', func: setVol, args: [v] }); } catch {} }
chrome.tabs.onUpdated.addListener(async (id, i) => { if (i.status === 'complete') { const v = (await vols())[id]; if (v != null && v !== 1) apply(id, v); } });
chrome.tabs.onRemoved.addListener(async id => { const v = await vols(); if (id in v) { delete v[id]; chrome.storage.session.set({ vols: v }); } });
chrome.runtime.onMessage.addListener((m, s, reply) => {
  (async () => {
    if (m.type === 'vol') { const v = await vols(); v[m.tabId] = m.v; await chrome.storage.session.set({ vols: v }); await apply(m.tabId, m.v); }
    if (m.type === 'solo') await solo(m.tabId);
    reply(true);
  })(); return true;
});
async function solo(tabId) {
  const tabs = await chrome.tabs.query({});
  const others = tabs.filter(t => t.id !== tabId && (t.audible || !t.mutedInfo?.muted) && t.audible);
  const anyUnmuted = tabs.some(t => t.id !== tabId && t.audible && !t.mutedInfo?.muted);
  for (const t of tabs) if (t.id !== tabId && (anyUnmuted ? t.audible : t.mutedInfo?.muted && t.mutedInfo.reason === 'extension')) chrome.tabs.update(t.id, { muted: anyUnmuted });
  chrome.tabs.update(tabId, { muted: false });
}
chrome.commands.onCommand.addListener(async c => { if (c === 'solo') { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); if (t) solo(t.id); } });
// belgida ovoz chiqarayotgan tablar soni
async function badge() { const n = (await chrome.tabs.query({ audible: true })).length; chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: '#0277bd' }); }
chrome.tabs.onUpdated.addListener((id, i) => 'audible' in i && badge()); chrome.tabs.onRemoved.addListener(badge); chrome.runtime.onStartup.addListener(badge);
