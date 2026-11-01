importScripts('ru.js', 'about-bg.js');
const st = () => chrome.storage.session.get('tabs').then(o => o.tabs || {});
async function cmd(t, m, p) { return chrome.debugger.sendCommand(t, m, p); }
async function apply(tabId, c) {
  const T = await st(), target = { tabId };
  if (!c) { try { await chrome.debugger.detach(target); } catch {} delete T[tabId]; await chrome.storage.session.set({ tabs: T }); chrome.action.setBadgeText({ tabId, text: '' }); return; }
  if (!T[tabId]) { try { await chrome.debugger.attach(target, '1.3'); } catch (e) { if (!/already/i.test(e.message)) throw e; } }
  if (c.geo) await cmd(target, 'Emulation.setGeolocationOverride', { latitude: c.lat, longitude: c.lon, accuracy: 30 }); else await cmd(target, 'Emulation.clearGeolocationOverride');
  if (c.geo) await cmd(target, 'Browser.grantPermissions', { permissions: ['geolocation'], origin: c.origin }).catch(() => {});
  await cmd(target, 'Emulation.setTimezoneOverride', { timezoneId: c.tz || '' }).catch(e => { if (!/same/i.test(e.message)) throw e; });
  await cmd(target, 'Emulation.setLocaleOverride', { locale: c.loc || '' }).catch(e => { if (!/same|already/i.test(e.message)) throw e; });
  const ua = (await cmd(target, 'Runtime.evaluate', { expression: 'navigator.userAgent', returnByValue: true })).result.value;
  await cmd(target, 'Network.enable'); await cmd(target, 'Emulation.setUserAgentOverride', { userAgent: ua, acceptLanguage: c.loc ? `${c.loc},${c.loc.split('-')[0]};q=0.9` : '' });
  T[tabId] = c; await chrome.storage.session.set({ tabs: T }); chrome.action.setBadgeText({ tabId, text: (c.name || c.tz || '').slice(0, 3) }); chrome.action.setBadgeBackgroundColor({ tabId, color: '#0277bd' });
}
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.type === 'apply') { apply(m.tabId, m.c).then(() => reply({ ok: 1 }), e => reply({ error: e.message })); return true; } });
chrome.debugger.onDetach.addListener(async s => { const T = await st(); if (T[s.tabId]) { delete T[s.tabId]; chrome.storage.session.set({ tabs: T }); chrome.action.setBadgeText({ tabId: s.tabId, text: '' }); } });
chrome.tabs.onUpdated.addListener(async (id, i) => { if (i.status === 'loading') { const c = (await st())[id]; if (c) { chrome.action.setBadgeText({ tabId: id, text: (c.name || c.tz || '').slice(0, 3) }); } } });
