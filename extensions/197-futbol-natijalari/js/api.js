// ESPN ochiq API (kalit talab qilinmaydi)
const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const V2 = 'https://site.api.espn.com/apis/v2/sports';

const cache = new Map();

export async function getJSON(url, ttl = 30000) {
  const c = cache.get(url);
  if (c && Date.now() - c.t < ttl) return c.d;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  cache.set(url, { t: Date.now(), d });
  return d;
}

export function ymd(d) {
  const x = new Date(d);
  return `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
}

export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function normTeam(c) {
  if (!c) return { id: null, name: '?', short: '?', logo: '', score: null };
  const t = c.team || {};
  let score = c.score;
  if (score && typeof score === 'object') score = score.displayValue ?? score.value;
  return {
    id: t.id ? String(t.id) : null,
    name: t.displayName || t.name || '?',
    short: t.shortDisplayName || t.displayName || t.abbreviation || '?',
    abbr: t.abbreviation || '',
    logo: t.logo || (t.logos && t.logos[0] && t.logos[0].href) || '',
    score: score == null || score === '' ? null : String(score),
    winner: !!c.winner
  };
}

export function normEvent(e, sport, league) {
  const comp = (e.competitions && e.competitions[0]) || {};
  const st = comp.status || e.status || {};
  const type = st.type || {};
  const cs = comp.competitors || [];
  const home = cs.find(t => t.homeAway === 'home') || cs[0];
  const away = cs.find(t => t.homeAway === 'away') || cs[1];
  const link = (e.links || []).find(l => (l.rel || []).includes('summary')) || (e.links || [])[0];
  return {
    id: String(e.id),
    date: new Date(e.date),
    sport, league,
    state: type.state || 'pre',          // pre | in | post
    status: type.name || '',             // STATUS_SCHEDULED, STATUS_HALFTIME, STATUS_POSTPONED ...
    clock: st.displayClock || '',
    detail: type.shortDetail || type.detail || '',
    home: normTeam(home),
    away: normTeam(away),
    link: link ? link.href : `https://www.espn.com/${sport === 'soccer' ? 'soccer/match/_/gameId' : sport + '/game/_/gameId'}/${e.id}`,
    venue: comp.venue ? comp.venue.fullName : ''
  };
}

// Bitta liga, berilgan kunlar oralig'i
export async function scoreboard(sport, league, from, to, ttl) {
  let q = '';
  if (from) q = `?dates=${ymd(from)}${to ? '-' + ymd(to) : ''}&limit=300`;
  const d = await getJSON(`${SITE}/${sport}/${league}/scoreboard${q}`, ttl);
  return (d.events || []).map(e => normEvent(e, sport, league));
}

export async function teams(sport, league) {
  const d = await getJSON(`${SITE}/${sport}/${league}/teams?limit=500`, 3600e3);
  const arr = (((d.sports || [])[0] || {}).leagues || [])[0];
  return ((arr && arr.teams) || []).map(x => x.team).filter(Boolean);
}

export async function teamSchedule(sport, league, id, fixture) {
  const d = await getJSON(`${SITE}/${sport}/${league}/teams/${id}/schedule${fixture ? '?fixture=true' : ''}`, 60000);
  return (d.events || []).map(e => normEvent(e, sport, league));
}

export async function standings(sport, league) {
  const d = await getJSON(`${V2}/${sport}/${league}/standings`, 300000);
  const groups = [];
  (function walk(n) {
    if (!n) return;
    if (n.standings && n.standings.entries && n.standings.entries.length) {
      groups.push({
        name: n.name || '',
        rows: n.standings.entries.map(en => {
          const s = {};
          (en.stats || []).forEach(x => { s[x.name] = x.displayValue ?? x.value; });
          const t = en.team || {};
          return {
            id: String(t.id), name: t.displayName || t.name, short: t.shortDisplayName || t.displayName,
            logo: (t.logos && t.logos[0] && t.logos[0].href) || '',
            rank: s.rank, gp: s.gamesPlayed, w: s.wins, d: s.ties, l: s.losses,
            diff: s.pointDifferential, pts: s.points
          };
        })
      });
    }
    (n.children || []).forEach(walk);
  })(d);
  groups.forEach(g => g.rows.sort((a, b) => (+a.rank || 999) - (+b.rank || 999)));
  return groups;
}

// Bir vaqtda N tadan so'rov
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const k = i++;
      try { out[k] = await fn(items[k], k); } catch (e) { out[k] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

function involves(m, id) { return m.home.id === String(id) || m.away.id === String(id); }

function dedupe(list) {
  const seen = new Map();
  for (const m of list) if (m && !seen.has(m.id)) seen.set(m.id, m);
  return [...seen.values()];
}

// Jamoaning kelgusi o'yinlari (barcha turnirlari bo'yicha)
export async function teamUpcoming(team) {
  const leagues = team.leagues && team.leagues.length ? team.leagues : [];
  const now = Date.now();
  let res = await pool(leagues, 4, lg => teamSchedule(team.sport, lg, team.id, true));
  let list = dedupe(res.flat().filter(Boolean)).filter(m => m.state !== 'post' && m.date.getTime() > now - 4 * 3600e3);
  if (!list.length) {
    // Zaxira: keyingi 45 kunlik taqvimdan izlash
    const res2 = await pool(leagues, 4, lg => scoreboard(team.sport, lg, new Date(), addDays(new Date(), 45), 300000));
    list = dedupe(res2.flat().filter(Boolean)).filter(m => involves(m, team.id) && m.state !== 'post');
  }
  return list.sort((a, b) => a.date - b.date);
}

// Jamoaning so'nggi natijalari
export async function teamResults(team) {
  const leagues = team.leagues || [];
  const res = await pool(leagues, 4, lg => teamSchedule(team.sport, lg, team.id, false));
  let list = dedupe(res.flat().filter(Boolean)).filter(m => m.state === 'post' && involves(m, team.id));
  if (!list.length) {
    const res2 = await pool(leagues, 4, lg => scoreboard(team.sport, lg, addDays(new Date(), -40), new Date(), 300000));
    list = dedupe(res2.flat().filter(Boolean)).filter(m => involves(m, team.id) && m.state === 'post');
  }
  return list.sort((a, b) => b.date - a.date);
}
