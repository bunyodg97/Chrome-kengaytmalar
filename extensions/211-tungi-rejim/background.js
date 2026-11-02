importScripts('ru.js', 'about-bg.js');
importScripts('common.js');
const { normalize, globalActive, effective, hostOf, modeOf } = self.TR;

const getS = async () => normalize((await chrome.storage.local.get('settings')).settings);
// IP manzil yoki nuqtasiz host (localhost) uchun "www." varianti noto'g'ri naqsh bo'ladi
const patterns = h => (/^[\d.]+$|^\[|^[^.]+$/.test(h) ? [`*://${h}/*`] : [`*://${h}/*`, `*://www.${h}/*`]);
const FILES = { filter: { css: ['dark.css'], allFrames: false }, dynamic: { css: ['dyn.css'], allFrames: true } };

// Qorong'i CSS ni sahifa chizilishidan OLDIN qo'shish uchun ro'yxatdan o'tkazamiz (oq chaqnash bo'lmasligi uchun).
// Standart usul — barcha saytlarga; boshqa usulni tanlagan saytlar — alohida.
async function register() {
  const s = await getS();
  const active = globalActive(s);
  await chrome.storage.local.set({ globalActive: active });

  const off = new Set(Object.keys(s.sites).filter(h => s.sites[h] === false));
  if (s.autoDetect) Object.keys(s.auto).forEach(h => s.sites[h] !== true && off.add(h));
  const otherMode = s.mode === 'dynamic' ? 'filter' : 'dynamic';
  const otherHosts = Object.keys(s.siteMode).filter(h => s.siteMode[h] !== s.mode);

  const plan = {};
  // 1) Standart usul
  if (active) plan[s.mode] = { matches: ['<all_urls>'], exclude: [...off, ...otherHosts].flatMap(patterns) };
  else plan[s.mode] = { matches: Object.keys(s.sites).filter(h => s.sites[h] === true && modeOf(s, h) === s.mode).flatMap(patterns), exclude: [] };
  // 2) Boshqa usulni tanlagan saytlar
  plan[otherMode] = { matches: otherHosts.filter(h => effective(s, h)).flatMap(patterns), exclude: [] };

  const sig = JSON.stringify(plan);
  const { regSig } = await chrome.storage.session.get('regSig');
  if (sig === regSig) return;

  const ids = (await chrome.scripting.getRegisteredContentScripts()).map(x => x.id);
  if (ids.length) await chrome.scripting.unregisterContentScripts({ ids });
  for (const [mode, p] of Object.entries(plan)) {
    if (!p.matches.length) continue;
    try {
      await chrome.scripting.registerContentScripts([{
        id: `css-${mode}`, css: FILES[mode].css, matches: p.matches, excludeMatches: p.exclude,
        runAt: 'document_start', allFrames: FILES[mode].allFrames, persistAcrossSessions: true
      }]);
    } catch (e) { console.warn(`CSS (${mode}) ro'yxatdan o'tmadi`, e); }
  }
  await chrome.storage.session.set({ regSig: sig });
}

let q = Promise.resolve();
const run = fn => (q = q.then(fn).catch(e => console.error(e)));

chrome.runtime.onInstalled.addListener(() => run(async () => {
  await chrome.storage.session.remove('regSig');
  await chrome.alarms.create('schedule', { periodInMinutes: 1 });
  await register();
}));
chrome.runtime.onStartup.addListener(() => run(register));
chrome.alarms.onAlarm.addListener(() => run(register));
chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.settings) run(register); });

// Boshqa domendagi CSS fayllar (sahifa o'zi o'qiy olmaydi) — biz yuklab beramiz
const cssCache = new Map();
async function fetchCss(url) {
  if (cssCache.has(url)) return cssCache.get(url);
  const p = (async () => {
    const r = await fetch(url, { credentials: 'omit' });
    if (!r.ok) throw new Error(r.status);
    const text = await r.text();
    return text.length > 3e6 ? '' : text;
  })();
  cssCache.set(url, p);
  if (cssCache.size > 200) cssCache.delete(cssCache.keys().next().value);
  try { return await p; } catch (e) { cssCache.delete(url); throw e; }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'fetchCss') {
    if (!/^https?:/.test(msg.url || '')) { reply({ error: 'url' }); return; }
    fetchCss(msg.url).then(text => reply({ text })).catch(e => reply({ error: String(e) }));
    return true;
  }
  if (msg.type === 'autoDark' && msg.host) {
    run(async () => {
      const s = await getS();
      if (s.auto[msg.host] || s.sites[msg.host] !== undefined) return;
      s.auto[msg.host] = true;
      await chrome.storage.local.set({ settings: s });
    });
  }
});

// Alt+Shift+D — joriy saytda almashtirish
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== 'toggle-site') return;
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const host = hostOf(tab?.url || '');
  if (!host) return;
  run(async () => {
    const s = await getS();
    s.sites[host] = !effective(s, host);
    await chrome.storage.local.set({ settings: s });
  });
});
