importScripts('ru.js', 'about-bg.js');
async function ensureOffscreen() {
  const has = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (!has.length) await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Tab ovozini kuchaytirish' });
}
const sess = async () => (await chrome.storage.session.get('tabs')).tabs || {};
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'bg') return;
  (async () => {
    const tabs = await sess();
    if (m.cmd === 'start') {
      await ensureOffscreen();
      await chrome.runtime.sendMessage({ to: 'off', cmd: 'start', tabId: m.tabId, streamId: m.streamId, gain: m.gain, bass: m.bass, comp: m.comp });
      tabs[m.tabId] = { gain: m.gain, bass: m.bass, comp: m.comp, title: m.title };
    }
    if (m.cmd === 'set') { await chrome.runtime.sendMessage({ to: 'off', cmd: 'set', tabId: m.tabId, gain: m.gain, bass: m.bass, comp: m.comp }).catch(() => {}); if (tabs[m.tabId]) Object.assign(tabs[m.tabId], { gain: m.gain, bass: m.bass, comp: m.comp }); }
    if (m.cmd === 'stop') { await chrome.runtime.sendMessage({ to: 'off', cmd: 'stop', tabId: m.tabId }).catch(() => {}); delete tabs[m.tabId]; }
    await chrome.storage.session.set({ tabs });
    for (const id of Object.keys(tabs)) chrome.action.setBadgeText({ tabId: +id, text: Math.round(tabs[id].gain * 100) + '' }).catch(() => {});
    if (m.tabId && !tabs[m.tabId]) chrome.action.setBadgeText({ tabId: m.tabId, text: '' }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({ color: '#e65100' });
    if (!Object.keys(tabs).length) { const has = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] }); if (has.length) chrome.offscreen.closeDocument(); }
    reply(tabs);
  })();
  return true;
});
chrome.tabs.onRemoved.addListener(async id => { const t = await sess(); if (t[id]) { delete t[id]; await chrome.storage.session.set({ tabs: t }); chrome.runtime.sendMessage({ to: 'off', cmd: 'stop', tabId: id }).catch(() => {}); } });
