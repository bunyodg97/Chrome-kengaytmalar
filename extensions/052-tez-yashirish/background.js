importScripts('ru.js', 'about-bg.js');
const DEF = { sites: ['youtube.com', 'instagram.com', 'tiktok.com', 'facebook.com', 'x.com', 'twitter.com', 'twitch.tv', 'vk.com', 'ok.ru', 'kinopoisk.ru', 'netflix.com', 'reddit.com', 'pinterest.com', 'web.telegram.org'], work: 'https://mail.google.com', mode: 'close' };
async function toggle() {
  const o = await chrome.storage.local.get(['cfg', 'hidden']); const c = { ...DEF, ...(o.cfg || {}) };
  if (o.hidden?.length) {
    for (const t of o.hidden) await chrome.tabs.create({ url: t.url, windowId: t.win, index: t.index, pinned: t.pinned, active: false }).catch(() => chrome.tabs.create({ url: t.url, active: false }));
    await chrome.storage.local.set({ hidden: [] }); chrome.action.setBadgeText({ text: '' }); return 'restored';
  }
  const tabs = await chrome.tabs.query({}); const match = t => { try { const h = new URL(t.url).hostname; return c.sites.some(s => h === s || h.endsWith('.' + s)); } catch { return false; } };
  const fun = tabs.filter(match);
  await Promise.all(tabs.filter(t => t.audible).map(t => chrome.tabs.update(t.id, { muted: true })));
  const hidden = fun.map(t => ({ url: t.url, win: t.windowId, index: t.index, pinned: t.pinned }));
  await chrome.storage.local.set({ hidden });
  let work = tabs.find(t => c.work && t.url.startsWith(c.work));
  if (work) await chrome.tabs.update(work.id, { active: true }); else if (c.work) work = await chrome.tabs.create({ url: c.work, active: true });
  if (work) await chrome.windows.update(work.windowId, { focused: true });
  if (fun.length) await chrome.tabs.remove(fun.map(t => t.id));
  if (hidden.length) { chrome.action.setBadgeText({ text: String(hidden.length) }); chrome.action.setBadgeBackgroundColor({ color: '#455a64' }); }
  return 'hidden';
}
chrome.commands.onCommand.addListener(c => { if (c === 'panic') toggle(); });
chrome.runtime.onMessage.addListener((m, s, r) => { if (m.cmd === 'toggle') { toggle().then(r); return true; } });
