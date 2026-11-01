importScripts('ru.js', 'about-bg.js');
importScripts('presets.js');
const TYPES = ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other'];
const hdrs = c => [{ header: 'user-agent', operation: 'set', value: c.ua }, { header: 'sec-ch-ua-mobile', operation: 'set', value: c.m ? '?1' : '?0' },
  { header: 'sec-ch-ua-platform', operation: 'set', value: `"${c.plat}"` }, ...(/Chrome\//.test(c.ua) ? [] : [{ header: 'sec-ch-ua', operation: 'remove' }])];
const cfgOf = s => s.key === 'custom' ? { ua: s.custom, p: navigator.platform, m: /Mobile|Android|iPhone/.test(s.custom), plat: /Android/.test(s.custom) ? 'Android' : /iPhone|iPad/.test(s.custom) ? 'iOS' : /Mac/.test(s.custom) ? 'macOS' : 'Windows' } : PRESETS[s.key];
async function sync() {
  const { global = null, tabs = {} } = await chrome.storage.local.get(['global']).then(async o => ({ ...o, tabs: (await chrome.storage.session.get('tabs')).tabs || {} }));
  const oldD = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: oldD.map(r => r.id), addRules: global ? [{ id: 1, priority: 1, action: { type: 'modifyHeaders', requestHeaders: hdrs(cfgOf(global)) }, condition: { resourceTypes: TYPES } }] : [] });
  const oldS = await chrome.declarativeNetRequest.getSessionRules();
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: oldS.map(r => r.id), addRules: Object.entries(tabs).map(([id, s]) => ({ id: +id % 1e6 + 10, priority: 2, action: { type: 'modifyHeaders', requestHeaders: hdrs(cfgOf(s)) }, condition: { tabIds: [+id], resourceTypes: TYPES } })) });
  // global preset uchun JS almashtiruvchi skriptni hujjat boshida ishga tushiramiz
  try { await chrome.scripting.unregisterContentScripts({ ids: ['uaG'] }); } catch { }
  if (global && global.key !== 'custom') await chrome.scripting.registerContentScripts([{ id: 'uaG', js: ['ua/' + global.key + '.js'], matches: ['<all_urls>'], runAt: 'document_start', world: 'MAIN', allFrames: true, persistAcrossSessions: true }]).catch(() => {});
  // ikonka nishonchasi
  const all = await chrome.tabs.query({});
  for (const t of all) { const s = tabs[t.id] || global; chrome.action.setBadgeText({ tabId: t.id, text: s ? (s.key === 'custom' ? 'UA' : s.key.slice(0, 3).toUpperCase()) : '' }).catch(() => {}); }
  chrome.action.setBadgeBackgroundColor({ color: '#5e35b1' });
}
chrome.storage.onChanged.addListener(sync); chrome.runtime.onInstalled.addListener(sync); chrome.runtime.onStartup.addListener(sync);
chrome.tabs.onRemoved.addListener(async id => { const t = (await chrome.storage.session.get('tabs')).tabs || {}; if (t[id]) { delete t[id]; chrome.storage.session.set({ tabs: t }); } });
// JavaScript uchun ham navigator.userAgent'ni almashtiramiz
chrome.webNavigation.onCommitted.addListener(async d => {
  const { global = null } = await chrome.storage.local.get('global'); const tabs = (await chrome.storage.session.get('tabs')).tabs || {};
  const s = tabs[d.tabId] || global; if (!s) return;
  if (!tabs[d.tabId] && global && global.key !== 'custom') return; // ro'yxatdan o'tgan skript bajaradi
  const c = cfgOf(s);
  chrome.scripting.executeScript({ target: { tabId: d.tabId, frameIds: [d.frameId] }, world: 'MAIN', injectImmediately: true, args: [c.ua, c.p, c.m, c.plat], func: (ua, p, m, plat) => {
    const def = (o, k, v) => { try { Object.defineProperty(o, k, { get: () => v, configurable: true }); } catch { } };
    def(Navigator.prototype, 'userAgent', ua); def(Navigator.prototype, 'appVersion', ua.replace(/^Mozilla\//, '')); def(Navigator.prototype, 'platform', p);
    def(Navigator.prototype, 'maxTouchPoints', m ? 5 : 0);
    if (navigator.userAgentData) def(Navigator.prototype, 'userAgentData', { mobile: m, platform: plat, brands: navigator.userAgentData.brands, getHighEntropyValues: async () => ({ mobile: m, platform: plat }) });
  } }).catch(() => {});
});
