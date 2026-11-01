importScripts('ru.js', 'about-bg.js');
const get = async () => (await chrome.storage.session.get('jobs')).jobs || {};
const put = jobs => chrome.storage.session.set({ jobs });

function pageScript(sec, watch, selector) {
  clearTimeout(window.__ayT); clearInterval(window.__ayI);
  const txt = () => ((selector && document.querySelector(selector)) || document.body)?.innerText || '';
  let left = sec;
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
  if (watch) chrome.runtime.sendMessage({ cmd: 'hash', h: hash(txt()), sample: txt().slice(0, 140) });
  window.__ayI = setInterval(() => { left--; chrome.runtime.sendMessage({ cmd: 'tick', left }).catch(() => {}); }, 1000);
  window.__ayT = setTimeout(() => location.reload(), sec * 1000);
}
async function start(tabId) {
  const jobs = await get(), j = jobs[tabId]; if (!j) return;
  try { await chrome.scripting.executeScript({ target: { tabId }, func: pageScript, args: [j.sec, j.watch, j.sel || ''] }); } catch {}
}
async function stop(tabId) {
  const jobs = await get(); delete jobs[tabId]; await put(jobs);
  chrome.action.setBadgeText({ tabId, text: '' });
  try { await chrome.scripting.executeScript({ target: { tabId }, func: () => { clearTimeout(window.__ayT); clearInterval(window.__ayI); } }); } catch {}
}
chrome.tabs.onUpdated.addListener(async (id, ch) => { if (ch.status === 'complete' && (await get())[id]) start(id); });
chrome.tabs.onRemoved.addListener(async id => { const j = await get(); if (j[id]) { delete j[id]; put(j); } });
chrome.runtime.onMessage.addListener((m, s, reply) => {
  (async () => {
    const jobs = await get();
    if (m.cmd === 'start') { jobs[m.tabId] = { sec: m.sec, watch: m.watch, sel: m.sel, title: m.title, n: 0, last: null }; await put(jobs); await start(m.tabId); chrome.action.setBadgeBackgroundColor({ color: '#00897b' }); reply(1); }
    if (m.cmd === 'stop') { await stop(m.tabId); reply(1); }
    if (m.cmd === 'list') reply(jobs);
    if (m.cmd === 'tick' && s.tab && jobs[s.tab.id]) {
      const l = m.left; chrome.action.setBadgeText({ tabId: s.tab.id, text: l > 99 ? Math.ceil(l / 60) + 'm' : String(Math.max(0, l)) });
    }
    if (m.cmd === 'hash' && s.tab && jobs[s.tab.id]) {
      const j = jobs[s.tab.id]; j.n++;
      if (j.last !== null && j.last !== m.h) {
        chrome.notifications.create('ay' + s.tab.id + Date.now(), { type: 'basic', iconUrl: 'icons/128.png', title: 'Sahifa o\'zgardi: ' + (s.tab.title || '').slice(0, 50), message: m.sample || 'Yangi ma\'lumot paydo bo\'ldi', priority: 2 });
        chrome.storage.session.set({ ['click' + s.tab.id]: 1 });
      }
      j.last = m.h; await put(jobs);
    }
  })();
  return true;
});
chrome.notifications.onClicked.addListener(id => { const t = parseInt(id.slice(2)); if (t) chrome.tabs.update(t, { active: true }).catch(() => {}); });
