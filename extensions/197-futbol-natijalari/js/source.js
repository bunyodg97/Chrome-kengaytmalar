// Ma'lumot manbalari: SofaScore (asosiy, to'liq) → ESPN (zaxira)
import * as sofa from './sofa.js';
import * as espn from './api.js';
import { getSport, allLeagues, topLeagues, findLeague, L } from './data.js';
import { buildIndex, getCachedIndex, searchTeams as espnSearch } from './search.js';

let MODE = 'auto';           // auto | sofa | espn
let sofaDownUntil = 0;
export let lastSrc = 'sofa';
export function setMode(m) { MODE = ['auto', 'sofa', 'espn'].includes(m) ? m : 'auto'; sofaDownUntil = 0; }

async function pick(sofaFn, espnFn) {
  if (MODE === 'sofa' || (MODE === 'auto' && Date.now() > sofaDownUntil)) {
    try { const r = await sofaFn(); lastSrc = 'sofa'; return r; }
    catch (e) {
      console.warn('SofaScore ishlamadi, ESPN ga o\'tilmoqda:', e);
      if (MODE === 'sofa') throw e;
      sofaDownUntil = Date.now() + 5 * 60e3;
    }
  }
  const r = await espnFn(); lastSrc = 'espn'; return r;
}

// ---------- ESPN ma'lumotini umumiy ko'rinishga keltirish ----------
export function espnLg(slug, sportId) {
  const lg = findLeague(slug, sportId) || findLeague(slug);
  if (!lg) return { key: 'espn:' + slug, src: 'espn', slug, name: slug, country: '', flag: '🏳️', prio: 0 };
  const top = topLeagues(lg.sportId).findIndex(x => x.slug === slug);
  return { key: 'espn:' + slug, src: 'espn', slug, name: L(lg.name), country: L(lg.country.name), flag: lg.country.flag, intl: !!lg.country.intl, prio: top >= 0 ? 1e6 - top : 0 };
}
function fixEspn(m, sportId) {
  if (!m) return m;
  if (!String(m.id).startsWith('e')) m.id = 'e' + m.id;
  m.src = 'espn';
  m.lg = espnLg(m.league, sportId);
  return m;
}
const fixAll = (list, sportId) => (list || []).filter(Boolean).map(m => fixEspn(m, sportId));

// ---------- Kun bo'yicha o'yinlar ----------
export function dayMatches(sportId, date) {
  return pick(
    () => sofa.day(sportId, date),
    async () => {
      const sp = getSport(sportId);
      const res = await espn.pool(topLeagues(sportId), 6, lg => espn.scoreboard(sp.path, lg.slug, espn.addDays(date, -1), espn.addDays(date, 1), 30000));
      if (res.every(r => r === null)) throw new Error('espn');
      const s = +date, e = s + 86400e3;
      return fixAll(res.flat(), sportId).filter(m => +m.date >= s && +m.date < e);
    }
  );
}

export function liveMatches(sportId) {
  return pick(
    () => sofa.live(sportId),
    async () => {
      const sp = getSport(sportId);
      const res = await espn.pool(allLeagues(sportId), 8, lg => espn.scoreboard(sp.path, lg.slug, null, null, 25000));
      if (res.every(r => r === null)) throw new Error('espn');
      const seen = new Set();
      return fixAll(res.flat(), sportId).filter(m => m.state === 'in' && !seen.has(m.id) && seen.add(m.id));
    }
  );
}

// ---------- Qidiruv ----------
export function searchTeams(sportId, q, onProgress) {
  return pick(
    async () => {
      const r = await sofa.searchTeams(sportId, q);
      return r;
    },
    async () => {
      let idx = await getCachedIndex(sportId);
      if (!idx) idx = await buildIndex(sportId, onProgress);
      return espnSearch(idx, q).map(t => {
        const lg = espnLg(t.leagues[0], sportId);
        return { ...t, src: 'espn', sportId, sub: `${lg.flag} ${lg.name}${t.leagues.length > 1 ? ' · +' + (t.leagues.length - 1) : ''}` };
      });
    }
  );
}

// ESPN jamoasini SofaScore'dagi mosiga o'tkazish (sevimlilar uchun)
export async function toSofaTeam(team) {
  if (team.src === 'sofa' || MODE === 'espn') return null;
  try {
    const found = await sofa.searchTeams(team.sportId, team.name);
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return found.find(f => norm(f.name) === norm(team.name)) || found[0] || null;
  } catch { return null; }
}

// ---------- Jamoa ----------
async function espnTeamLeagues(team) {
  if (team.leagues && team.leagues.length) return team;
  const idx = await getCachedIndex(team.sportId);
  const f = idx && idx.find(x => x.id === String(team.id));
  return { ...team, leagues: f ? f.leagues : [] };
}

export async function teamUpcoming(team) {
  if (team.src === 'sofa') return sofa.teamNext(team.id, team.sportId);
  const tm = await espnTeamLeagues(team);
  return fixAll(await espn.teamUpcoming({ ...tm, sport: getSport(tm.sportId).path }), tm.sportId);
}

export async function teamResults(team) {
  if (team.src === 'sofa') return sofa.teamLast(team.id, team.sportId);
  const tm = await espnTeamLeagues(team);
  return fixAll(await espn.teamResults({ ...tm, sport: getSport(tm.sportId).path }), tm.sportId);
}

// ---------- Ligalar daraxti ----------
export const REGIONS = [
  { id: 'europe', icon: '🌍', name: ['Yevropa', 'Европа'] },
  { id: 'asia', icon: '🌏', name: ['Osiyo', 'Азия'] },
  { id: 'america', icon: '🌎', name: ['Amerika', 'Америка'] },
  { id: 'africa', icon: '🌍', name: ['Afrika', 'Африка'] },
  { id: 'oceania', icon: '🏝️', name: ['Okeaniya', 'Океания'] },
  { id: 'world', icon: '🏆', name: ['Jahon', 'Мир'] },
  { id: 'other', icon: '🗺️', name: ['Boshqalar', 'Другие'] }
];

export function leagueTree(sportId) {
  return pick(
    async () => {
      const cats = await sofa.categories(sportId);
      if (!cats.length) throw new Error('empty');
      return REGIONS.map(r => ({
        ...r, name: L(r.name),
        countries: cats.filter(c => c.cont === r.id)
          .sort((a, b) => (b.intl - a.intl) || (b.prio - a.prio) || a.name.localeCompare(b.name))
          .map(c => ({ id: c.id, src: 'sofa', flag: c.flag, name: c.name }))
      })).filter(r => r.countries.length);
    },
    async () => getSport(sportId).regions.map(r => ({
      id: r.id, icon: r.icon, name: L(r.name),
      countries: r.countries.map(c => ({
        id: c.id, src: 'espn', flag: c.flag, name: L(c.name),
        leagues: c.leagues.map(l => espnLg(l[0], sportId))
      }))
    }))
  );
}

export async function countryLeagues(country, sportId) {
  if (country.leagues) return country.leagues;
  const list = await sofa.tournaments(country.id);
  return list.sort((a, b) => b.users - a.users).map(u => ({
    key: 'sofa:' + u.id, src: 'sofa', utId: u.id, name: u.name, country: country.name, flag: country.flag, prio: u.users
  }));
}

export async function leagueMatches(lg, sportId) {
  if (lg.src === 'sofa') return sofa.leagueEvents(lg.utId, sportId);
  const today = espn.startOfDay(new Date());
  return fixAll(await espn.scoreboard(getSport(sportId).path, lg.slug, espn.addDays(today, -7), espn.addDays(today, 14), 30000), sportId);
}

export async function leagueTable(lg, sportId) {
  if (lg.src === 'sofa') return sofa.standings(lg.utId);
  const g = await espn.standings(getSport(sportId).path, lg.slug);
  g.forEach(x => x.rows.forEach(r => { r.src = 'espn'; }));
  return g;
}

// "Asosiy" lentadagi tartib: eng mashhur turnirlar tepada
const TOP_UT = [7, 679, 17015, 16, 17, 8, 23, 35, 34, 955, 357, 1, 133, 270, 37, 238, 52, 203];
export function leagueWeight(lg, homeCountry) {
  if (lg.src === 'espn') return lg.prio;
  const i = TOP_UT.indexOf(lg.utId);
  if (i >= 0) return 1e9 - i * 1e6;
  if (homeCountry && lg.alpha2 === homeCountry) return 9e8;
  return lg.prio || 0;
}

export { sofa };
