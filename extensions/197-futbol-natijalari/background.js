// Fon xizmati: sevimli jamoalar o'yinlarini kuzatish, badge va bildirishnomalar
import { scoreboard, pool } from './js/api.js';
import * as sofa from './js/sofa.js';
import { tl } from './js/i18n.js';

const ALARM = 'poll';

function ensureAlarm() {
  chrome.alarms.get(ALARM, a => { if (!a) chrome.alarms.create(ALARM, { periodInMinutes: 1, delayInMinutes: 0.1 }); });
}

chrome.runtime.onInstalled.addListener(() => { ensureAlarm(); poll(); });
chrome.runtime.onStartup.addListener(() => { ensureAlarm(); poll(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARM) poll(); });
chrome.runtime.onMessage.addListener(msg => { if (msg && msg.type === 'poll') poll(); });
chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.favs) poll(); });

chrome.notifications.onClicked.addListener(async id => {
  const { notifLinks = {} } = await chrome.storage.session.get('notifLinks');
  if (notifLinks[id]) chrome.tabs.create({ url: notifLinks[id] });
  chrome.notifications.clear(id);
});

let running = false;

// SofaScore sevimlilari: har bir jamoaning joriy/keyingi o'yini
async function sofaMatches(favs) {
  const out = [];
  const res = await pool(favs, 3, f => sofa.teamNext(f.id, f.sportId));
  res.forEach(list => (list || []).slice(0, 2).forEach(m => out.push(m)));
  return out;
}

// ESPN sevimlilari: ligalarning joriy taqvimi
async function espnMatches(favs) {
  const pairs = new Map();
  for (const f of favs) for (const lg of (f.leagues || [])) pairs.set(f.sport + '|' + lg, { sport: f.sport, league: lg });
  const ids = new Set(favs.map(f => f.id));
  const res = await pool([...pairs.values()], 4, p => scoreboard(p.sport, p.league, null, null, 20000));
  const out = [];
  for (const list of res) for (const m of (list || [])) {
    if (ids.has(m.home.id) || ids.has(m.away.id)) out.push({ ...m, id: 'e' + m.id });
  }
  return out;
}

async function poll() {
  if (running) return;
  running = true;
  try {
    const { favs = [], settings = {} } = await chrome.storage.local.get(['favs', 'settings']);
    const lang = settings.lang || 'uz';
    if (!favs.length) { await chrome.action.setBadgeText({ text: '' }); return; }

    const sofaFavs = favs.filter(f => f.src === 'sofa');
    const espnFavs = favs.filter(f => (f.src || 'espn') === 'espn');
    const [a, b] = await Promise.all([
      sofaFavs.length ? sofaMatches(sofaFavs).catch(() => []) : [],
      espnFavs.length ? espnMatches(espnFavs).catch(() => []) : []
    ]);
    const seen = new Map();
    [...a, ...b].forEach(m => seen.set(m.id, m));

    const { last = {}, notifLinks = {} } = await chrome.storage.session.get(['last', 'notifLinks']);
    // Avval jonli bo'lib, endi ro'yxatdan chiqqan SofaScore o'yinlarining yakuniy natijasi
    for (const [id, p] of Object.entries(last)) {
      if (p.s === 'in' && !seen.has(id) && id.startsWith('s')) {
        const ev = await sofa.event(id, p.sp || 'soccer').catch(() => null);
        if (ev) seen.set(id, ev);
      }
    }
    const matches = [...seen.values()];

    // Badge: birinchi jonli o'yin hisobi
    const live = matches.filter(m => m.state === 'in');
    if (live.length) {
      const m = live[0];
      const txt = `${m.home.score ?? 0}:${m.away.score ?? 0}`;
      await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      await chrome.action.setBadgeText({ text: txt.length <= 4 ? txt : 'LIVE' });
      await chrome.action.setTitle({ title: `${m.home.name} ${txt} ${m.away.name}` });
    } else {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: tl(lang, 'appName') });
    }

    const notifyOn = settings.notify !== false;
    const next = {};
    const now = Date.now();
    for (const m of matches) {
      const prev = last[m.id];
      const cur = { s: m.state, h: m.home.score, a: m.away.score, soon: prev ? prev.soon : false, sp: m.sport };
      const line = `${m.home.name} ${m.home.score ?? 0} : ${m.away.score ?? 0} ${m.away.name}`;
      const vs = `${m.home.name} – ${m.away.name}`;
      if (notifyOn) {
        if (m.state === 'pre' && !cur.soon) {
          const left = +m.date - now;
          if (left > 0 && left <= 15 * 60e3) { cur.soon = true; notify(m, tl(lang, 'soon'), vs, notifLinks); }
        }
        if (prev) {
          if (prev.s === 'pre' && m.state === 'in') notify(m, tl(lang, 'kickoff'), vs, notifLinks);
          else if (prev.s === 'in' && m.state === 'in' && (prev.h !== cur.h || prev.a !== cur.a)) notify(m, '⚽ ' + tl(lang, 'goal'), line, notifLinks);
          if (prev.s === 'in' && m.state === 'post') notify(m, tl(lang, 'fulltime'), line, notifLinks);
        }
      }
      if (m.state !== 'post') next[m.id] = cur;
    }
    await chrome.storage.session.set({ last: next, notifLinks });
  } catch (e) {
    console.warn('poll', e);
  } finally {
    running = false;
  }
}

function notify(m, title, message, links) {
  const id = 'm' + m.id + '_' + Date.now();
  links[id] = m.link;
  const keys = Object.keys(links);
  if (keys.length > 50) keys.slice(0, keys.length - 50).forEach(k => delete links[k]);
  chrome.notifications.create(id, { type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 1 });
}
