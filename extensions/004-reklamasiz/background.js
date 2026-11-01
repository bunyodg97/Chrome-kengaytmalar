importScripts('ru.js', 'about-bg.js');
chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true }).catch(() => {});
chrome.action.setBadgeBackgroundColor({ color: '#c62828' });

async function syncAllow() {
  const { allow = [] } = await chrome.storage.local.get('allow');
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map(r => r.id),
    addRules: allow.map((d, i) => ({ id: 1000 + i, priority: 100, action: { type: 'allowAllRequests' },
      condition: { requestDomains: [d], resourceTypes: ['main_frame', 'sub_frame'] } }))
  });
}
async function syncOn() {
  const { on = true } = await chrome.storage.local.get('on');
  await chrome.declarativeNetRequest.updateEnabledRulesets(on ? { enableRulesetIds: ['ads'] } : { disableRulesetIds: ['ads'] });
}
chrome.runtime.onInstalled.addListener(() => { syncAllow(); syncOn(); });
chrome.runtime.onStartup.addListener(() => { syncAllow(); syncOn(); });
chrome.storage.onChanged.addListener(c => { if (c.allow) syncAllow(); if (c.on) syncOn(); });

chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd === 'count') {
    chrome.declarativeNetRequest.getMatchedRules({ tabId: m.tabId }).then(r => reply(r.rulesMatchedInfo.length)).catch(() => reply(null));
    return true;
  }
  if (m.cmd === 'cosmetic') { chrome.storage.local.get('cosm').then(o => { const c = (o.cosm || 0) + m.n; chrome.storage.local.set({ cosm: c }); }); }
});
