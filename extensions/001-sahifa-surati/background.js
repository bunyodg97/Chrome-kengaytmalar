importScripts('ru.js', 'about-bg.js');
let lastShot = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(tabId, func, args = []) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return r && r.result;
}

async function capture(mode, tabId, windowId) {
  const tab = await chrome.tabs.get(tabId);
  if (!/^https?:|^file:/.test(tab.url || '')) throw new Error('Bu sahifani rasmga olib bo\'lmaydi (brauzerning ichki sahifasi).');
  if (mode === 'visible') {
    const url = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
    const info = await run(tabId, () => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, title: document.title }));
    lastShot = { parts: [{ url, y: 0 }], ...info, total: info.h };
    return;
  }
  const info = await run(tabId, () => {
    const el = document.scrollingElement || document.documentElement;
    const st = { x: scrollX, y: scrollY, behavior: el.style.scrollBehavior };
    el.style.scrollBehavior = 'auto';
    window.__ssState = st;
    return { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, total: Math.min(el.scrollHeight, 30000), title: document.title };
  });
  const parts = [];
  for (let y = 0, i = 0; y < info.total; y += info.h, i++) {
    const real = await run(tabId, (yy, first) => {
      scrollTo(0, yy);
      if (!first) {
        // 2-qismdan boshlab yopishqoq (fixed/sticky) elementlarni yashiramiz
        for (const e of document.querySelectorAll('body *')) {
          const p = getComputedStyle(e).position;
          if ((p === 'fixed' || p === 'sticky') && !e.dataset.ssHid) { e.dataset.ssHid = e.style.visibility || '-'; e.style.visibility = 'hidden'; }
        }
      }
      return scrollY;
    }, [y, i === 0]);
    await sleep(i === 0 ? 350 : 600); // captureVisibleTab chegarasi: soniyasiga 2 marta
    parts.push({ url: await chrome.tabs.captureVisibleTab(windowId, { format: 'png' }), y: real });
    if (real + info.h >= info.total) break;
  }
  await run(tabId, () => {
    for (const e of document.querySelectorAll('[data-ss-hid]')) { e.style.visibility = e.dataset.ssHid === '-' ? '' : e.dataset.ssHid; delete e.dataset.ssHid; }
    const st = window.__ssState; if (st) { scrollTo(st.x, st.y); (document.scrollingElement || document.documentElement).style.scrollBehavior = st.behavior; }
  });
  lastShot = { parts, ...info };
}

chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd === 'capture') {
    capture(m.mode, m.tabId, m.windowId)
      .then(() => chrome.tabs.create({ url: 'editor.html' }))
      .then(() => reply({ ok: true }))
      .catch(e => reply({ error: e.message }));
    return true;
  }
  if (m.cmd === 'getShot') { reply(lastShot); return false; }
});

chrome.commands.onCommand.addListener(async c => {
  if (c !== 'full') return;
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  capture('full', t.id, t.windowId).then(() => chrome.tabs.create({ url: 'editor.html' })).catch(() => {});
});
