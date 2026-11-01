importScripts('ru.js', 'about-bg.js');
importScripts('profiles.js');
const st = () => chrome.storage.session.get('tabs').then(o => o.tabs || {});
async function apply(tabId, p, cpu, custom) {
  const T = await st(); const prof = p === 'custom' ? custom : PROFILES[p]?.[1];
  const target = { tabId };
  if (!prof && (!cpu || cpu === 1)) { try { await chrome.debugger.detach(target); } catch {} delete T[tabId]; await chrome.storage.session.set({ tabs: T }); badge(tabId, null); return; }
  if (!T[tabId]) { try { await chrome.debugger.attach(target, '1.3'); } catch (e) { if (!/already attached/i.test(e.message)) throw e; } }
  await chrome.debugger.sendCommand(target, 'Network.enable');
  await chrome.debugger.sendCommand(target, 'Network.emulateNetworkConditions', prof ? { offline: !!prof.offline, latency: prof.lat || 0, downloadThroughput: prof.offline ? 0 : prof.down * 1024 / 8, uploadThroughput: prof.offline ? 0 : prof.up * 1024 / 8 } : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await chrome.debugger.sendCommand(target, 'Emulation.setCPUThrottlingRate', { rate: cpu || 1 });
  T[tabId] = { p, cpu, custom }; await chrome.storage.session.set({ tabs: T }); badge(tabId, p, cpu);
}
function badge(tabId, p, cpu) { chrome.action.setBadgeText({ tabId, text: !p || p === 'off' ? (cpu > 1 ? cpu + 'x' : '') : p === 'offline' ? 'OFF' : { g2: '2G', g3s: '3G-', g3: '3G', g4s: '4G-', g4: '4G', wifi: 'WiFi', custom: '⚙' }[p] }); chrome.action.setBadgeBackgroundColor({ tabId, color: p === 'offline' ? '#c62828' : '#6d4c41' }); }
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'apply') { apply(m.tabId, m.p, m.cpu, m.custom).then(() => reply({ ok: true }), e => reply({ error: e.message })); return true; } });
chrome.debugger.onDetach.addListener(async (src) => { const T = await st(); if (T[src.tabId]) { delete T[src.tabId]; chrome.storage.session.set({ tabs: T }); badge(src.tabId, null); } });
chrome.tabs.onUpdated.addListener(async (id, i) => { if (i.status === 'loading') { const t = (await st())[id]; if (t) badge(id, t.p, t.cpu); } });
