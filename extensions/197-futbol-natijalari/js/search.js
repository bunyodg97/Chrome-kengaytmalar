import { allLeagues, getSport } from './data.js';
import { teams, pool } from './api.js';

const TTL = 7 * 24 * 3600e3;
const VERSION = 2;

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', қ: 'k', ғ: 'g', ҳ: 'x', ў: 'u'
};

// O'zbek/rus yozilishlarini lotin nomlarga yaqinlashtiruvchi taxalluslar
const ALIASES = {
  barselona: 'barcelona', barsa: 'barcelona', barca: 'barcelona',
  real: 'real madrid', reaal: 'real madrid',
  yunayted: 'united', yunaytid: 'united', manyunayted: 'manchester united', mu: 'manchester united',
  siti: 'city', mansiti: 'manchester city',
  liverpul: 'liverpool', chelsi: 'chelsea', arsenal: 'arsenal', tottenxem: 'tottenham', tottenhem: 'tottenham',
  bavariya: 'bayern', bavaria: 'bayern', bayern: 'bayern',
  yuventus: 'juventus', yuve: 'juventus', inter: 'internazionale', milan: 'milan',
  psj: 'paris saint germain', pszh: 'paris saint germain', parij: 'paris',
  atletiko: 'atletico', borussiya: 'borussia', dortmund: 'dortmund', ayaks: 'ajax',
  napoli: 'napoli', roma: 'roma', benfika: 'benfica', porto: 'porto', sporting: 'sporting',
  galatasaray: 'galatasaray', fenerbaxche: 'fenerbahce', fenerbache: 'fenerbahce', beshiktosh: 'besiktas', besiktash: 'besiktas',
  zenit: 'zenit', spartak: 'spartak', lokomotiv: 'lokomotiv',
  alnasr: 'al nassr', nasr: 'al nassr', alhilol: 'al hilal', hilol: 'al hilal', alhilal: 'al hilal',
  ozbekiston: 'uzbekistan', uzbekiston: 'uzbekistan', uzbekistan: 'uzbekistan'
};

export function fold(s) {
  s = String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[а-яёқғҳў]/g, ch => CYR[ch] ?? ch);
  s = s.replace(/[ʻʼ'`’‘"]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  return s;
}

function expandQuery(q) {
  const words = fold(q).split(' ').filter(Boolean);
  const joined = words.join('');
  if (ALIASES[joined]) return fold(ALIASES[joined]);
  return words.map(w => ALIASES[w] ? fold(ALIASES[w]) : w).join(' ');
}

const store = {
  async get(k) { try { return (await chrome.storage.local.get(k))[k]; } catch { return null; } },
  async set(k, v) { try { await chrome.storage.local.set({ [k]: v }); } catch {} }
};

export async function getCachedIndex(sportId) {
  const c = await store.get('idx_' + sportId);
  if (c && c.v === VERSION && Date.now() - c.t < TTL && c.teams && c.teams.length) return c.teams;
  return null;
}

export async function buildIndex(sportId, onProgress, force) {
  if (!force) { const c = await getCachedIndex(sportId); if (c) return c; }
  const sp = getSport(sportId);
  const leagues = allLeagues(sportId);
  const map = new Map();
  let done = 0;
  const results = await pool(leagues, 6, async lg => {
    const list = await teams(sp.path, lg.slug);
    done++; onProgress && onProgress(done, leagues.length);
    return { lg, list };
  });
  for (const r of results) {
    if (!r) continue;
    for (const tm of r.list) {
      const id = String(tm.id);
      let e = map.get(id);
      if (!e) {
        e = {
          id, sport: sp.path, sportId,
          name: tm.displayName || tm.name, short: tm.shortDisplayName || tm.displayName,
          abbr: tm.abbreviation || '',
          logo: (tm.logos && tm.logos[0] && tm.logos[0].href) || tm.logo || '',
          leagues: [], key: ''
        };
        map.set(id, e);
      }
      if (!e.leagues.includes(r.lg.slug)) e.leagues.push(r.lg.slug);
    }
  }
  const out = [...map.values()];
  out.forEach(e => { e.key = fold([e.name, e.short, e.abbr, tmLocation(e)].join(' ')); });
  await store.set('idx_' + sportId, { v: VERSION, t: Date.now(), teams: out });
  return out;
}

function tmLocation() { return ''; }

export function searchTeams(index, q, limit = 25) {
  const nq = expandQuery(q);
  if (!nq) return [];
  const words = nq.split(' ');
  const scored = [];
  for (const e of index) {
    const k = e.key;
    if (!words.every(w => k.includes(w))) continue;
    let s = 0;
    if (k === nq) s += 100;
    if (k.startsWith(nq)) s += 50;
    if (fold(e.name) === nq) s += 80;
    for (const w of words) if ((' ' + k).includes(' ' + w)) s += 10;
    s += Math.min(e.leagues.length, 5); // ko'p turnirda o'ynaydigan klublar yuqoriroq
    s -= k.length / 50;
    scored.push([s, e]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => x[1]);
}
