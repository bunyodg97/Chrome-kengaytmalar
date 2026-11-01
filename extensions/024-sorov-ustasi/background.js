importScripts('ru.js', 'about-bg.js');
const ALL = ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other'];
function filterOf(p) { return p.startsWith('/') && p.endsWith('/') && p.length > 2 ? { regexFilter: p.slice(1, -1) } : { urlFilter: p }; }
async function sync() {
  const { rules = [], paused = false } = await chrome.storage.local.get(['rules', 'paused']);
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  const add = [];
  if (!paused) rules.filter(r => r.on && r.type !== 'mock' && r.pattern && (r.type !== 'redirect' || r.to)).forEach((r, i) => {
    const cond = { ...filterOf(r.pattern), resourceTypes: r.type === 'redirect' ? ALL.filter(t => t !== 'main_frame') : ALL };
    if (r.method && r.method !== 'ANY') cond.requestMethods = [r.method.toLowerCase()];
    let action;
    if (r.type === 'block') action = { type: 'block' };
    if (r.type === 'redirect') action = cond.regexFilter && r.to.includes('\\') ? { type: 'redirect', redirect: { regexSubstitution: r.to } } : { type: 'redirect', redirect: { url: r.to } };
    if (r.type === 'header') {
      const h = (r.headers || []).filter(x => x.name);
      action = { type: 'modifyHeaders' };
      const req = h.filter(x => x.where === 'req').map(x => x.op === 'remove' ? { header: x.name, operation: 'remove' } : { header: x.name, operation: 'set', value: x.value || '' });
      const res = h.filter(x => x.where === 'res').map(x => x.op === 'remove' ? { header: x.name, operation: 'remove' } : { header: x.name, operation: 'set', value: x.value || '' });
      if (req.length) action.requestHeaders = req; if (res.length) action.responseHeaders = res;
      if (!req.length && !res.length) return;
    }
    add.push({ id: i + 1, priority: 100 - Math.min(i, 99), action, condition: cond });
  });
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id), addRules: add });
    await chrome.storage.local.set({ syncErr: '' });
  } catch (e) { await chrome.storage.local.set({ syncErr: e.message }); }
  const n = paused ? 0 : rules.filter(r => r.on).length;
  chrome.action.setBadgeText({ text: n ? String(n) : '' }); chrome.action.setBadgeBackgroundColor({ color: paused ? '#999' : '#37474f' });
}
chrome.runtime.onInstalled.addListener(sync); chrome.runtime.onStartup.addListener(sync);
chrome.storage.onChanged.addListener(c => { if (c.rules || c.paused) sync(); });
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd === 'hits') { chrome.declarativeNetRequest.getMatchedRules({ tabId: m.tabId }).then(r => reply(r.rulesMatchedInfo.length)).catch(() => reply(0)); return true; }
});
