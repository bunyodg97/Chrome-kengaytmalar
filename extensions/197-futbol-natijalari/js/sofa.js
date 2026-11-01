// SofaScore ochiq API — dunyodagi deyarli barcha liga va o'yinlar (O'zbekiston Superligasi ham)
const BASES = ['https://api.sofascore.com/api/v1', 'https://www.sofascore.com/api/v1'];
export const SPORT = { soccer: 'football', basketball: 'basketball', hockey: 'ice-hockey' };
export const IMG = {
  team: id => `https://img.sofascore.com/api/v1/team/${id}/image`,
  ut: id => `https://img.sofascore.com/api/v1/unique-tournament/${id}/image`
};

const cache = new Map();
let baseIdx = 0;

export async function get(path, ttl = 30000) {
  const c = cache.get(path);
  if (c && Date.now() - c.t < ttl) return c.d;
  let lastErr;
  for (let k = 0; k < BASES.length; k++) {
    const i = (baseIdx + k) % BASES.length;
    try {
      const r = await fetch(BASES[i] + path, { cache: 'no-store', credentials: 'omit' });
      if (r.status === 404) { const d = {}; cache.set(path, { t: Date.now(), d }); baseIdx = i; return d; } // ma'lumot yo'q
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      cache.set(path, { t: Date.now(), d });
      baseIdx = i;
      return d;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('sofascore');
}

const pad = n => String(n).padStart(2, '0');
export const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ---- qit'alar ----
const CONT = {
  europe: 'AL AD AM AT AZ BY BE BA BG HR CY CZ DK EE FO FI FR GE DE GI GR HU IS IE IL IT KZ XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB',
  asia: 'AF BH BD BT BN KH CN HK IN ID IR IQ JP JO KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TM AE UZ VN YE AU GU',
  america: 'AR BO BR CL CO EC PY PE UY VE US CA MX CR SV GT HN PA JM TT HT DO CU PR BZ GY SR BB BM CW',
  africa: 'DZ AO BJ BW BF BI CM CV CF TD KM CG CD CI DJ EG GQ ER ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SL SO ZA SS SD TZ TG TN UG ZM ZW',
  oceania: 'NZ FJ PG SB VU NC TO WS'
};
const A2CONT = {};
for (const [k, v] of Object.entries(CONT)) v.split(' ').forEach(a => { A2CONT[a] = k; });

const SPECIAL = {
  england: { cont: 'europe', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', uz: 'Angliya', ru: 'Англия' },
  scotland: { cont: 'europe', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', uz: 'Shotlandiya', ru: 'Шотландия' },
  wales: { cont: 'europe', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', uz: 'Uels', ru: 'Уэльс' },
  'northern ireland': { cont: 'europe', flag: '🇬🇧', uz: 'Shimoliy Irlandiya', ru: 'Северная Ирландия' },
  europe: { cont: 'europe', intl: true, flag: '🇪🇺', uz: 'Yevropa turnirlari', ru: 'Еврокубки' },
  asia: { cont: 'asia', intl: true, flag: '🌏', uz: 'Osiyo turnirlari', ru: 'Турниры Азии' },
  africa: { cont: 'africa', intl: true, flag: '🌍', uz: 'Afrika turnirlari', ru: 'Турниры Африки' },
  'south america': { cont: 'america', intl: true, flag: '🌎', uz: 'Janubiy Amerika turnirlari', ru: 'Турниры Южной Америки' },
  'north & central america': { cont: 'america', intl: true, flag: '🌎', uz: 'Shimoliy Amerika turnirlari', ru: 'Турниры КОНКАКАФ' },
  oceania: { cont: 'oceania', intl: true, flag: '🌏', uz: 'Okeaniya turnirlari', ru: 'Турниры Океании' },
  world: { cont: 'world', intl: true, flag: '🏆', uz: 'Jahon turnirlari', ru: 'Мировые турниры' },
  international: { cont: 'world', intl: true, flag: '🏆', uz: 'Xalqaro', ru: 'Международные' }
};

function emojiFlag(a2) {
  if (!/^[A-Z]{2}$/.test(a2 || '')) return '🏳️';
  return String.fromCodePoint(...[...a2].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// Chrome'da o'zbek tili ICU ma'lumotlari bo'lmasligi mumkin — asosiy mamlakatlar qo'lda
const UZ_NAMES = {
  UZ: "O'zbekiston", KZ: "Qozog'iston", KG: "Qirg'iziston", TJ: 'Tojikiston', TM: 'Turkmaniston', AF: "Afg'oniston",
  RU: 'Rossiya', UA: 'Ukraina', BY: 'Belarus', AZ: 'Ozarbayjon', GE: 'Gruziya', AM: 'Armaniston', TR: 'Turkiya',
  ES: 'Ispaniya', IT: 'Italiya', DE: 'Germaniya', FR: 'Fransiya', PT: 'Portugaliya', NL: 'Niderlandiya', BE: 'Belgiya',
  CH: 'Shveysariya', AT: 'Avstriya', PL: 'Polsha', CZ: 'Chexiya', SK: 'Slovakiya', HU: 'Vengriya', RO: 'Ruminiya',
  BG: 'Bolgariya', GR: 'Gretsiya', RS: 'Serbiya', HR: 'Xorvatiya', SI: 'Sloveniya', BA: 'Bosniya va Gertsegovina',
  ME: 'Chernogoriya', MK: 'Shimoliy Makedoniya', AL: 'Albaniya', DK: 'Daniya', SE: 'Shvetsiya', NO: 'Norvegiya',
  FI: 'Finlyandiya', IS: 'Islandiya', IE: 'Irlandiya', CY: 'Kipr', IL: 'Isroil', LT: 'Litva', LV: 'Latviya',
  EE: 'Estoniya', MD: 'Moldova', LU: 'Lyuksemburg', MT: 'Malta', XK: 'Kosovo', FO: 'Farer orollari', GB: 'Buyuk Britaniya',
  SA: 'Saudiya Arabistoni', AE: 'BAA', QA: 'Qatar', IR: 'Eron', IQ: 'Iroq', JO: 'Iordaniya', KW: 'Quvayt', BH: 'Bahrayn',
  OM: 'Ummon', SY: 'Suriya', LB: 'Livan', PS: 'Falastin', YE: 'Yaman', JP: 'Yaponiya', KR: 'Janubiy Koreya',
  KP: 'Shimoliy Koreya', CN: 'Xitoy', HK: 'Gonkong', IN: 'Hindiston', PK: 'Pokiston', BD: 'Bangladesh', TH: 'Tailand',
  VN: 'Vyetnam', ID: 'Indoneziya', MY: 'Malayziya', SG: 'Singapur', PH: 'Filippin', AU: 'Avstraliya', NZ: 'Yangi Zelandiya',
  MN: "Mo'g'uliston", US: 'AQSh', CA: 'Kanada', MX: 'Meksika', BR: 'Braziliya', AR: 'Argentina', CL: 'Chili',
  CO: 'Kolumbiya', UY: 'Urugvay', PY: 'Paragvay', PE: 'Peru', EC: 'Ekvador', BO: 'Boliviya', VE: 'Venesuela',
  CR: 'Kosta-Rika', EG: 'Misr', MA: 'Marokash', DZ: 'Jazoir', TN: 'Tunis', NG: 'Nigeriya', ZA: 'Janubiy Afrika',
  GH: 'Gana', SN: 'Senegal', CM: 'Kamerun', CI: "Kot-d'Ivuar", KE: 'Keniya', LY: 'Liviya'
};

let LANG = 'uz';
let DN = null;
export function setSofaLang(l) {
  LANG = l;
  try {
    DN = new Intl.DisplayNames([l], { type: 'region', fallback: 'none' });
    if (!DN.resolvedOptions().locale.startsWith(l)) DN = null; // til qo'llab-quvvatlanmasa
  } catch { DN = null; }
}
setSofaLang('uz');

// SofaScore kategoriyasidan mamlakat ma'lumoti
export function countryInfo(cat) {
  cat = cat || {};
  const nm = (cat.name || '').toLowerCase();
  const sp = SPECIAL[nm];
  const a2 = (cat.alpha2 || '').toUpperCase();
  if (sp) return { id: String(cat.id), cont: sp.cont, intl: !!sp.intl, flag: sp.flag, name: LANG === 'ru' ? sp.ru : sp.uz, alpha2: a2, prio: cat.priority || 0 };
  let name = cat.name || '';
  if (/^[A-Z]{2}$/.test(a2)) {
    if (LANG === 'uz' && UZ_NAMES[a2]) name = UZ_NAMES[a2];
    else if (DN) { try { name = DN.of(a2) || name; } catch {} }
  }
  return { id: String(cat.id), cont: A2CONT[a2] || 'other', intl: false, flag: emojiFlag(a2), name, alpha2: a2, prio: cat.priority || 0 };
}

// ---- o'yinni umumiy ko'rinishga keltirish ----
function minute(e, now) {
  const code = e.status && e.status.code;
  const cps = e.time && e.time.currentPeriodStartTimestamp;
  if (!cps) return null;
  const el = Math.max(0, Math.floor((now / 1000 - cps) / 60)) + 1;
  const base = { 6: 0, 7: 45, 41: 90, 42: 105 }[code];
  if (base == null) return null;
  const cap = { 6: 45, 7: 90, 41: 105, 42: 120 }[code];
  const m = base + el;
  return m > cap ? `${cap}+${m - cap}'` : `${m}'`;
}

export function normEvent(e, sportId) {
  const st = e.status || {};
  const type = st.type || 'notstarted';
  const tour = e.tournament || {};
  const ut = tour.uniqueTournament || {};
  const ci = countryInfo(tour.category);
  let state = 'pre', status = 'STATUS_SCHEDULED';
  if (type === 'inprogress' || type === 'interrupted') { state = 'in'; status = st.code === 31 ? 'STATUS_HALFTIME' : 'STATUS_IN_PROGRESS'; }
  else if (type === 'finished') { state = 'post'; status = 'STATUS_FINAL'; }
  else if (type === 'postponed') { state = 'pre'; status = 'STATUS_POSTPONED'; }
  else if (type === 'canceled' || type === 'cancelled') { state = 'post'; status = 'STATUS_CANCELED'; }
  const now = Date.now();
  let clock = '';
  if (state === 'in') clock = (sportId === 'soccer' && minute(e, now)) || st.description || '';
  const sc = s => (s && s.current != null ? String(s.current) : (s && s.display != null ? String(s.display) : null));
  const team = (t, s, win) => ({
    id: t && t.id != null ? String(t.id) : null,
    name: (t && t.name) || '?',
    short: (t && (t.shortName || t.name)) || '?',
    logo: t && t.id ? IMG.team(t.id) : '',
    score: state === 'pre' ? null : sc(s),
    winner: win
  });
  return {
    id: 's' + e.id, rawId: e.id, src: 'sofa', sport: sportId,
    date: new Date((e.startTimestamp || 0) * 1000),
    state, status, clock, detail: st.description || '',
    home: team(e.homeTeam, e.homeScore, e.winnerCode === 1),
    away: team(e.awayTeam, e.awayScore, e.winnerCode === 2),
    link: e.slug && e.customId ? `https://www.sofascore.com/${e.slug}/${e.customId}#id:${e.id}` : `https://www.sofascore.com/event/${e.id}`,
    venue: (e.venue && (e.venue.stadium?.name || e.venue.name)) || '',
    league: 'sofa:' + (ut.id || 't' + tour.id),
    lg: {
      key: 'sofa:' + (ut.id || 't' + tour.id), src: 'sofa', utId: ut.id || null,
      name: ut.name || tour.name || '', country: ci.name, flag: ci.flag, alpha2: ci.alpha2, intl: ci.intl,
      prio: (tour.priority || 0) * 1000 + (ut.userCount ? Math.log10(ut.userCount + 1) * 10 : 0)
    }
  };
}

const evs = (d, sportId) => ((d && d.events) || []).map(e => normEvent(e, sportId));

// Mahalliy kun: SofaScore UTC kunlari bilan ishlaydi, shuning uchun qo'shni kunni ham olamiz
export async function day(sportId, date) {
  const off = -new Date(date).getTimezoneOffset();
  const days = [new Date(date)];
  if (off > 0) days.unshift(new Date(+date - 86400e3));
  if (off < 0) days.push(new Date(+date + 86400e3));
  const res = await Promise.all(days.map(d => get(`/sport/${SPORT[sportId]}/scheduled-events/${isoDay(d)}`, 45000)));
  const start = +date, end = start + 86400e3;
  const map = new Map();
  res.forEach(r => evs(r, sportId).forEach(m => { if (+m.date >= start && +m.date < end) map.set(m.id, m); }));
  return [...map.values()];
}

export async function live(sportId) {
  return evs(await get(`/sport/${SPORT[sportId]}/events/live`, 20000), sportId);
}

export async function event(id, sportId) {
  const d = await get(`/event/${String(id).replace(/^s/, '')}`, 10000);
  return d && d.event ? normEvent(d.event, sportId) : null;
}

export async function searchTeams(sportId, q) {
  const enc = encodeURIComponent(q);
  let d = await get(`/search/all?q=${enc}&page=0`, 300000);
  let items = (d.results || []).filter(r => r.type === 'team').map(r => r.entity);
  if (!items.length) {
    d = await get(`/search/teams?q=${enc}&page=0`, 300000).catch(() => ({}));
    items = (d.results || []).map(r => r.entity || r);
  }
  return items
    .filter(t => t && t.id && (!t.sport || t.sport.slug === SPORT[sportId]))
    .map(t => {
      const ci = countryInfo(t.category || (t.country && { name: t.country.name, alpha2: t.country.alpha2 }));
      return {
        id: String(t.id), src: 'sofa', sportId, name: t.name, short: t.shortName || t.name,
        logo: IMG.team(t.id), sub: `${ci.flag} ${ci.name}${t.national ? '' : ''}`, gender: t.gender
      };
    })
    .filter(t => t.gender !== 'F' || /women|жен|ayol/i.test(q));
}

export async function teamNext(id, sportId) {
  return evs(await get(`/team/${id}/events/next/0`, 60000), sportId).sort((a, b) => a.date - b.date);
}
export async function teamLast(id, sportId) {
  return evs(await get(`/team/${id}/events/last/0`, 120000), sportId).filter(m => m.state === 'post').sort((a, b) => b.date - a.date);
}
export async function teamInfo(id) {
  const d = await get(`/team/${id}`, 3600e3);
  return d.team || null;
}

// ---- ligalar daraxti ----
export async function categories(sportId) {
  const d = await get(`/sport/${SPORT[sportId]}/categories`, 24 * 3600e3);
  return (d.categories || []).map(c => ({ ...countryInfo(c), raw: c }));
}

export async function tournaments(catId) {
  const d = await get(`/category/${catId}/unique-tournaments`, 24 * 3600e3);
  const out = [];
  (d.groups || []).forEach(g => (g.uniqueTournaments || []).forEach(u => out.push(u)));
  if (!out.length && d.uniqueTournaments) out.push(...d.uniqueTournaments);
  const seen = new Set();
  return out.filter(u => !seen.has(u.id) && seen.add(u.id))
    .map(u => ({ id: u.id, name: u.name, users: u.userCount || 0 }));
}

async function currentSeason(utId) {
  const d = await get(`/unique-tournament/${utId}/seasons`, 6 * 3600e3);
  return d.seasons && d.seasons[0] ? d.seasons[0].id : null;
}

export async function leagueEvents(utId, sportId) {
  const sid = await currentSeason(utId);
  if (!sid) return [];
  const [last, next] = await Promise.all([
    get(`/unique-tournament/${utId}/season/${sid}/events/last/0`, 60000).catch(() => ({})),
    get(`/unique-tournament/${utId}/season/${sid}/events/next/0`, 60000).catch(() => ({}))
  ]);
  const map = new Map();
  [...evs(last, sportId), ...evs(next, sportId)].forEach(m => map.set(m.id, m));
  return [...map.values()].sort((a, b) => a.date - b.date);
}

export async function standings(utId) {
  const sid = await currentSeason(utId);
  if (!sid) return [];
  const d = await get(`/unique-tournament/${utId}/season/${sid}/standings/total`, 300000);
  return (d.standings || []).map(g => ({
    name: g.name || '',
    rows: (g.rows || []).map(r => ({
      id: String(r.team.id), name: r.team.name, short: r.team.shortName || r.team.name, logo: IMG.team(r.team.id),
      rank: r.position, gp: r.matches, w: r.wins, d: r.draws, l: r.losses,
      diff: r.scoresFor != null ? (r.scoresFor - r.scoresAgainst > 0 ? '+' : '') + (r.scoresFor - r.scoresAgainst) : '',
      pts: r.points, src: 'sofa'
    }))
  }));
}
