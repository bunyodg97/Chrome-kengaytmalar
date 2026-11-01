importScripts('ru.js', 'about-bg.js');
chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true }).catch(() => {});
chrome.action.setBadgeBackgroundColor({ color: '#37474f' });
const host = u => { try { return new URL(u).hostname; } catch { return ''; } };
const base = h => h.split('.').slice(-2).join('.');
const third = {}; // tabId -> {pageBase, domains:{}}

chrome.webRequest.onBeforeRequest.addListener(d => {
  if (d.tabId < 0) return;
  if (d.type === 'main_frame') { third[d.tabId] = { page: base(host(d.url)), domains: {} }; return; }
  const t = third[d.tabId]; if (!t) return;
  const h = host(d.url); if (!h || base(h) === t.page) return;
  t.domains[h] = (t.domains[h] || 0) + 1;
}, { urls: ['<all_urls>'] });
chrome.tabs.onRemoved.addListener(id => delete third[id]);

async function syncAllow() {
  const { allow = [] } = await chrome.storage.local.get('allow');
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id),
    addRules: allow.map((d, i) => ({ id: 100 + i, priority: 10, action: { type: 'allowAllRequests' }, condition: { requestDomains: [d], resourceTypes: ['main_frame'] } })) });
}
async function syncOn() {
  const { on = true } = await chrome.storage.local.get('on');
  await chrome.declarativeNetRequest.updateEnabledRulesets(on ? { enableRulesetIds: ['trackers'] } : { disableRulesetIds: ['trackers'] });
}
chrome.runtime.onInstalled.addListener(() => { syncAllow(); syncOn(); });
chrome.storage.onChanged.addListener(c => { if (c.allow) syncAllow(); if (c.on) syncOn(); });

chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd !== 'info') return;
  (async () => {
    let blocked = [];
    try { blocked = (await chrome.declarativeNetRequest.getMatchedRules({ tabId: m.tabId })).rulesMatchedInfo; } catch {}
    const t = third[m.tabId] || { domains: {} };
    reply({ blocked: blocked.length, third: Object.entries(t.domains).sort((a, b) => b[1] - a[1]) });
  })();
  return true;
});
