import { SPORTS, L, setDataLang, getSport } from './js/data.js';
import * as api from './js/api.js';
import * as src from './js/source.js';
import { setSofaLang } from './js/sofa.js';
import { t, setLang, getLang, detectLang, fmtTime, fmtDay, dayLabel, weekday } from './js/i18n.js';
import { buildIndex } from './js/search.js';

const DEV_URL = 'https://www.ali-dasturchi.uz';
const DONATE_URL = 'https://www.ali-dasturchi.uz/#donat';
const OTHER_URL = 'https://www.ali-dasturchi.uz';

const $ = s => document.querySelector(s);
const main = $('#main');
const qInput = $('#q');

const S = {
  sportId: 'soccer',
  tab: 'home',
  date: api.startOfDay(new Date()),
  stack: [],            // ochilgan ichki sahifalar: team / league / settings
  lnav: [],             // Ligalar bo'limidagi yo'l: [regionId, countryId]
  favs: [],
  settings: { notify: true },
  query: '',
  renderId: 0,
  lgMap: {},            // kalit → liga obyekti
  tree: {},             // sport → ligalar daraxti
  expanded: new Set(),  // qo'lda ochilgan guruhlar
  closed: new Set(),    // qo'lda yopilgan guruhlar
  homeCountry: 'UZ'
};

// ---------- yordamchilar ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (src, cls = '') => src ? `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span style="width:20px"></span>`;
const sport = () => getSport(S.sportId);
const isFav = (id, source) => S.favs.some(f => f.id === String(id) && f.sportId === S.sportId && (f.src || 'espn') === (source || 'espn'));

async function save() {
  try { await chrome.storage.local.set({ settings: S.settings, favs: S.favs }); } catch {}
}

function loadingHTML(text) { return `<div class="state"><div class="spinner"></div>${esc(text || t('loading'))}</div>`; }
function errorHTML() { return `<div class="state"><div class="big">⚠️</div>${esc(t('error'))}<br><button class="btn" data-act="retry">${esc(t('retry'))}</button></div>`; }
function emptyHTML(text, icon = '🗓️') { return `<div class="state"><div class="big">${icon}</div>${esc(text)}</div>`; }

function statusInfo(m) {
  if (m.state === 'in') {
    const ht = /HALFTIME/.test(m.status) || /^HT$/i.test(m.detail);
    return { live: true, text: ht ? t('ht') : (m.clock || t('liveShort')) };
  }
  if (/POSTPONED/.test(m.status)) return { text: t('postponed') };
  if (/CANCEL/.test(m.status)) return { text: t('canceled') };
  if (m.state === 'post') return { text: t('ft') };
  return { text: fmtTime(m.date) };
}

function statusHTML(m, withDate) {
  const s = statusInfo(m);
  return `<span class="mtime ${s.live ? 'live' : ''}">${s.live ? '<span class="dot"></span>' : ''}${esc(s.text)}${withDate ? `<span class="dt">${esc(fmtDay(m.date))}</span>` : ''}</span>`;
}

function scoreHTML(m) {
  if (m.state === 'pre' || m.home.score == null) return `<div class="score pre">${esc(t('vs'))}</div>`;
  return `<div class="score ${m.state === 'in' ? 'live' : ''}">${esc(m.home.score)} : ${esc(m.away.score)}</div>`;
}

// "Real Madrid 0 : 1 Barcelona" ko'rinishidagi qator
function matchHTML(m, opts = {}) {
  const hw = m.state === 'post' && m.home.winner, aw = m.state === 'post' && m.away.winner;
  const when = statusHTML(m, opts.showDate);
  const ta = tm => `data-team="${esc(tm.id)}" data-src="${esc(m.src)}" data-tname="${esc(tm.name)}" data-tlogo="${esc(tm.logo)}" data-lg="${esc(m.src === 'espn' ? m.league : '')}" title="${esc(tm.name)}"`;
  return `<div class="match" data-link="${esc(m.link)}">
    ${when}
    <div class="side home"><span class="tname ${hw ? 'win' : ''}" ${ta(m.home)}>${esc(m.home.short)}</span>${img(m.home.logo)}</div>
    ${scoreHTML(m)}
    <div class="side away">${img(m.away.logo)}<span class="tname ${aw ? 'win' : ''}" ${ta(m.away)}>${esc(m.away.short)}</span></div>
  </div>`;
}

function groupHTML(lg, matches, opts = {}) {
  let head = '';
  if (lg) {
    S.lgMap[lg.key] = lg;
    const collapsed = opts.collapsible && !opts.open;
    head = `<div class="ghead"><button class="gname" data-lgkey="${esc(lg.key)}">${esc(lg.flag || '')} ${esc(lg.name)} ${lg.country ? `<span class="sub">· ${esc(lg.country)}</span>` : ''}</button>` +
      (opts.collapsible ? `<button class="gtoggle" data-toggle="${esc(lg.key)}">${matches.length} ${collapsed ? '▾' : '▴'}</button>` : `<button class="gtoggle" data-lgkey="${esc(lg.key)}">›</button>`) + `</div>`;
    if (collapsed) return `<div class="group">${head}</div>`;
  }
  return `<div class="group">${head}${matches.map(m => matchHTML(m, opts)).join('')}</div>`;
}

function groupByLeague(list) {
  const map = new Map();
  for (const m of list) {
    const k = m.lg ? m.lg.key : 'x';
    if (!map.has(k)) map.set(k, { lg: m.lg, matches: [] });
    map.get(k).matches.push(m);
  }
  const groups = [...map.values()];
  groups.forEach(g => sortMatches(g.matches));
  return groups.sort((a, b) => (src.leagueWeight(b.lg, S.homeCountry) - src.leagueWeight(a.lg, S.homeCountry)) || String(a.lg.name).localeCompare(String(b.lg.name)));
}

function sortMatches(list) {
  const rank = { in: 0, pre: 1, post: 2 };
  return list.sort((a, b) => (rank[a.state] - rank[b.state]) || (a.date - b.date));
}

// ---------- shapka ----------
function renderChrome() {
  document.documentElement.lang = getLang();
  $('#appName').textContent = t('appName');
  qInput.placeholder = t('searchPh');
  $('#btnSettings').title = t('settings');
  $('#sports').innerHTML = SPORTS.map(s =>
    `<button data-sport="${s.id}" class="${s.id === S.sportId ? 'on' : ''}" title="${esc(L(s.name))}">${s.icon}${s.id === S.sportId ? ' ' + esc(L(s.name)) : ''}</button>`).join('');
  const names = { home: t('tabHome'), live: t('tabLive'), fav: t('tabFav'), leagues: t('tabLeagues') };
  document.querySelectorAll('#tabs button').forEach(b => {
    const k = b.dataset.tab;
    b.classList.toggle('on', !S.stack.length && !S.query && S.tab === k);
    b.innerHTML = esc(names[k]) + (k === 'live' && S.liveCount ? `<span class="cnt">${S.liveCount}</span>` : '');
  });
}

// ---------- asosiy render ----------
async function render() {
  const id = ++S.renderId;
  renderChrome();
  const top = S.stack[S.stack.length - 1];
  const alive = () => id === S.renderId;
  try {
    if (top && top.type === 'settings') return renderSettings();
    if (top && top.type === 'team') return await renderTeam(top, alive);
    if (top && top.type === 'league') return await renderLeague(top, alive);
    if (S.query) return await renderSearch(alive);
    if (S.tab === 'home') return await renderHome(alive);
    if (S.tab === 'live') return await renderLive(alive);
    if (S.tab === 'fav') return await renderFav(alive);
    if (S.tab === 'leagues') return await renderLeagues(alive);
  } catch (e) {
    console.error(e);
    if (alive()) main.innerHTML = errorHTML();
  }
}

function backbar(crumb) {
  return `<div class="backbar"><button data-act="back">← ${esc(t('back'))}</button><span class="crumbs">${esc(crumb || '')}</span></div>`;
}

// Asosiy: tanlangan kundagi barcha o'yinlar
async function renderHome(alive) {
  const d = S.date;
  const bar = `<div class="datebar">
    <button class="nav" data-act="prevDay" title="←">‹</button>
    <div class="lbl">${esc(dayLabel(d))}<small>${esc(fmtDay(d))}, ${esc(weekday(d))}</small></div>
    <button class="nav" data-act="nextDay" title="→">›</button></div>`;
  if (main.dataset.v !== 'home' + +d) main.innerHTML = bar + loadingHTML();
  main.dataset.v = 'home' + +d;
  const list = await src.dayMatches(S.sportId, d);
  if (!alive()) return;
  let html = bar;
  const favIds = new Set(S.favs.filter(f => f.sportId === S.sportId).map(f => (f.src || 'espn') + f.id));
  const favMatches = list.filter(m => favIds.has(m.src + m.home.id) || favIds.has(m.src + m.away.id));
  if (favMatches.length) html += `<div class="section-title">★ ${esc(t('tabFav'))}</div>` + groupHTML(null, sortMatches(favMatches));
  const groups = groupByLeague(list);
  if (groups.length) html += `<div class="section-title">${esc(t('countMatches', list.length, groups.length))}</div>`;
  groups.forEach((g, i) => {
    const k = g.lg.key;
    const open = S.expanded.has(k) || (!S.closed.has(k) && (i < 10 || g.matches.some(m => m.state === 'in')));
    html += groupHTML(g.lg, g.matches, { collapsible: true, open });
  });
  if (!list.length) html += emptyHTML(t('noMatches'));
  html += srcNote();
  main.innerHTML = html;
}

function srcNote() { return `<div class="foot">${esc(t('source'))}: ${src.lastSrc === 'sofa' ? 'SofaScore' : 'ESPN'}</div>`; }

// Jonli: hozir ketayotgan barcha o'yinlar
async function renderLive(alive) {
  if (main.dataset.v !== 'live') main.innerHTML = loadingHTML(t('liveChecking'));
  main.dataset.v = 'live';
  const list = await src.liveMatches(S.sportId);
  if (!alive()) return;
  S.liveCount = list.length;
  renderChrome();
  main.innerHTML = list.length ? groupByLeague(list).map(g => groupHTML(g.lg, g.matches)).join('') + srcNote() : emptyHTML(t('liveNone'), '📺');
}

// Sevimlilar: har bir jamoaning eng yaqin o'yini
async function renderFav(alive) {
  const favs = S.favs.filter(f => f.sportId === S.sportId);
  if (!favs.length) { main.dataset.v = 'fav'; main.innerHTML = emptyHTML(t('favEmpty'), '⭐'); return; }
  if (main.dataset.v !== 'fav') main.innerHTML = loadingHTML();
  main.dataset.v = 'fav';
  // Eski (ESPN) sevimlilarni SofaScore'dagi mosiga o'tkazish
  let changed = false;
  for (const f of favs) {
    if ((f.src || 'espn') !== 'espn') continue;
    const s2 = await src.toSofaTeam({ ...f, src: 'espn' });
    if (s2 && !S.favs.some(x => x.src === 'sofa' && x.id === s2.id)) { f.id = s2.id; f.src = 'sofa'; f.logo = s2.logo; f.leagues = []; changed = true; }
  }
  if (changed) save();
  const res = await api.pool(favs, 3, tm => src.teamUpcoming({ ...tm, src: tm.src || 'espn' }));
  if (!alive()) return;
  let html = '';
  favs.forEach((tm, i) => {
    const next = (res[i] || [])[0];
    html += `<div class="group">
      <div class="ghead"><button class="gname" data-openteam="${esc((tm.src || 'espn') + ':' + tm.id)}">${img(tm.logo)} ${esc(tm.name)}</button><button class="gtoggle" data-openteam="${esc((tm.src || 'espn') + ':' + tm.id)}">›</button></div>
      ${next ? matchHTML(next, { showDate: true }) + countdownHTML(next, true) : `<div class="state" style="padding:12px">${esc(t('noUpcoming'))}</div>`}
    </div>`;
  });
  main.innerHTML = html;
  tick();
}

function countdownHTML(m, compact) {
  const live = m.state === 'in';
  return `<div class="cd ${live ? 'live' : ''}" data-ts="${+m.date}" data-state="${m.state}" style="${compact ? 'padding:0 10px 10px' : ''}"></div>`;
}

// Ligalar: qit'a → mamlakat → liga
async function renderLeagues(alive) {
  const key = 'leagues' + S.lnav.join('/');
  if (main.dataset.v !== key) main.innerHTML = loadingHTML();
  main.dataset.v = key;
  let tree = S.tree[S.sportId];
  if (!tree) { tree = await src.leagueTree(S.sportId); S.tree[S.sportId] = tree; }
  if (!alive()) return;
  const [rid, cid] = S.lnav;
  const region = tree.find(r => r.id === rid);
  const country = region && region.countries.find(c => c.id === cid);
  let html = '';
  if (!region) {
    if (tree.length === 1) { S.lnav = [tree[0].id]; return renderLeagues(alive); }
    html += `<div class="section-title">${esc(t('chooseRegion'))}</div><div class="list">` +
      tree.map(r => `<button class="row" data-region="${esc(r.id)}"><span class="ico">${r.icon}</span><span class="t">${esc(r.name)}<small>${esc(r.countries.slice(0, 5).map(c => c.name).join(', '))}${r.countries.length > 5 ? ` … (${r.countries.length})` : ''}</small></span><span class="go">›</span></button>`).join('') + '</div>';
  } else if (!country) {
    if (tree.length > 1) html += backbar(region.name);
    html += `<div class="search mini"><input id="cfilter" type="search" placeholder="${esc(t('filterCountry'))}" autocomplete="off"></div>`;
    html += '<div class="list" id="clist">' + region.countries.map(c =>
      `<button class="row" data-country="${esc(c.id)}" data-cname="${esc(c.name.toLowerCase())}"><span class="ico">${c.flag}</span><span class="t">${esc(c.name)}${c.leagues ? `<small>${esc(c.leagues.map(l => l.name).join(' · '))}</small>` : ''}</span><span class="go">›</span></button>`).join('') + '</div>';
  } else {
    html += backbar(`${region.name} › ${country.name}`);
    main.innerHTML = html + loadingHTML();
    const leagues = await src.countryLeagues(country, S.sportId);
    if (!alive()) return;
    leagues.forEach(l => { S.lgMap[l.key] = l; });
    html += leagues.length ? '<div class="list">' + leagues.map(l =>
      `<button class="row" data-lgkey="${esc(l.key)}">${l.utId ? img(src.sofa.IMG.ut(l.utId)) : `<span class="ico">${country.flag}</span>`}<span class="t">${esc(l.name)}</span><span class="go">›</span></button>`).join('') + '</div>'
      : emptyHTML(t('noMatchesLeague'), '🏟️');
  }
  main.innerHTML = html;
}

// Liga sahifasi: o'yinlar va jadval
async function renderLeague(v, alive) {
  const lg = v.lg;
  const head = backbar(`${lg.flag || ''} ${lg.country ? lg.country + ' › ' : ''}${lg.name}`) +
    `<div class="subtabs"><button data-sub="matches" class="${v.sub !== 'table' ? 'on' : ''}">${esc(t('matches'))}</button><button data-sub="table" class="${v.sub === 'table' ? 'on' : ''}">${esc(t('table'))}</button></div>`;
  const key = 'lg' + lg.key + v.sub;
  if (main.dataset.v !== key) main.innerHTML = head + loadingHTML();
  main.dataset.v = key;

  if (v.sub === 'table') {
    const groups = await src.leagueTable(lg, S.sportId);
    if (!alive()) return;
    if (!groups.length) { main.innerHTML = head + emptyHTML(t('noTable'), '📊'); return; }
    main.innerHTML = head + groups.map(g => `<div class="group">${groups.length > 1 ? `<div class="ghead">${esc(g.name)}</div>` : ''}
      <table class="std"><tr><th>#</th><th style="text-align:left">${esc(t('colTeam'))}</th><th>${t('colGp')}</th><th>${t('colW')}</th><th>${t('colD')}</th><th>${t('colL')}</th><th>${t('colDiff')}</th><th>${esc(t('colPts'))}</th></tr>
      ${g.rows.map((r, i) => `<tr><td>${esc(r.rank || i + 1)}</td><td class="tm"><div data-team="${esc(r.id)}" data-src="${esc(r.src)}" data-tname="${esc(r.name)}" data-tlogo="${esc(r.logo)}" data-lg="${esc(lg.slug || '')}">${img(r.logo)}<span class="tname">${esc(r.short)}</span></div></td><td>${esc(r.gp ?? '')}</td><td>${esc(r.w ?? '')}</td><td>${esc(r.d ?? '')}</td><td>${esc(r.l ?? '')}</td><td>${esc(r.diff ?? '')}</td><td class="pts">${esc(r.pts ?? '')}</td></tr>`).join('')}
      </table></div>`).join('');
    return;
  }

  const list = await src.leagueMatches(lg, S.sportId);
  if (!alive()) return;
  if (!list.length) { main.innerHTML = head + emptyHTML(t('noMatchesLeague')); return; }
  const today = api.startOfDay(new Date());
  const byDay = new Map();
  list.sort((a, b) => a.date - b.date).forEach(m => {
    const k = +api.startOfDay(m.date);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(m);
  });
  let html = head, anchor = null;
  for (const [k, ms] of byDay) {
    const d = new Date(k);
    const id = 'd' + k;
    if (!anchor && k >= +today) anchor = id;
    html += `<div class="section-title" id="${id}">${esc(dayLabel(d))} · ${esc(fmtDay(d))}</div>` + groupHTML(null, ms);
  }
  main.innerHTML = html;
  if (anchor && !v.scrolled) { v.scrolled = true; const el = document.getElementById(anchor); if (el) main.scrollTop = el.offsetTop - main.offsetTop - 6; }
}

// Jamoa sahifasi
async function renderTeam(v, alive) {
  const tm = v.team;
  const fav = isFav(tm.id, tm.src);
  let sub = tm.sub || '';
  if (!sub && tm.src === 'espn' && tm.leagues && tm.leagues[0]) { const lg = src.espnLg(tm.leagues[0], S.sportId); sub = `${lg.flag} ${lg.name}`; }
  const head = backbar('') + `<div class="teamhead">${img(tm.logo)}<div><h2>${esc(tm.name)}</h2><small>${esc(sub)}</small></div>
    <button class="star ${fav ? 'on' : ''}" data-act="toggleFav" title="${esc(fav ? t('removeFav') : t('addFav'))}">${fav ? '★' : '☆'}</button></div>`;
  const key = 'team' + tm.src + tm.id;
  if (main.dataset.v !== key) main.innerHTML = head + loadingHTML();
  main.dataset.v = key;
  const [up, past] = await Promise.all([src.teamUpcoming(tm).catch(() => []), src.teamResults(tm).catch(() => [])]);
  if (!alive()) return;
  let html = head;
  const next = up[0];
  if (next) {
    const live = next.state === 'in';
    html += `<div class="next" data-link="${esc(next.link)}">
      <div class="lbl">${live ? '<span class="dot"></span>' + esc(t('started')) : esc(t('nextMatch'))}</div>
      <div class="vs">
        <div class="tm">${img(next.home.logo)}<span>${esc(next.home.name)}</span></div>
        <div class="mid">${live ? `${esc(next.home.score)} : ${esc(next.away.score)}` : esc(fmtTime(next.date))}</div>
        <div class="tm">${img(next.away.logo)}<span>${esc(next.away.name)}</span></div>
      </div>
      <div class="when">${esc(dayLabel(next.date))}, ${esc(fmtDay(next.date))} · ${esc(fmtTime(next.date))}${next.venue ? ' · ' + esc(next.venue) : ''}</div>
      ${live ? '' : countdownHTML(next)}
    </div>`;
  } else {
    html += emptyHTML(t('noUpcoming'), '🗓️');
  }
  if (up.length > 1) html += `<div class="section-title">${esc(t('upcoming'))}</div>` + groupHTML(null, up.slice(1, 6), { showDate: true });
  if (past.length) html += `<div class="section-title">${esc(t('lastResults'))}</div>` + groupHTML(null, past.slice(0, 6), { showDate: true });
  main.innerHTML = html;
  tick();
}

// Qidiruv
async function renderSearch(alive) {
  const q = S.query;
  if (main.dataset.v !== 'search') main.innerHTML = loadingHTML();
  main.dataset.v = 'search';
  const found = await src.searchTeams(S.sportId, q, (d, n) => {
    if (!alive()) return;
    main.innerHTML = `<div class="state"><div class="spinner"></div>${esc(t('indexBuilding', d, n))}<div class="progress"><i style="width:${Math.round(d / n * 100)}%"></i></div></div>`;
  });
  if (!alive() || q !== S.query) return;
  S.lastFound = found;
  if (!found.length) { main.innerHTML = emptyHTML(t('noResults'), '🔍'); return; }
  main.innerHTML = '<div class="list">' + found.map((tm, i) => {
    const on = isFav(tm.id, tm.src);
    return `<div class="row" data-idx="${i}" style="cursor:pointer">${img(tm.logo)}<span class="t">${esc(tm.name)}<small>${esc(tm.sub || '')}</small></span>
      <button class="star ${on ? 'on' : ''}" data-favidx="${i}" title="${esc(t('addFav'))}">${on ? '★' : '☆'}</button><span class="go">›</span></div>`;
  }).join('') + '</div>' + srcNote();
}

// Sozlamalar
function renderSettings() {
  main.dataset.v = 'settings';
  const ver = chrome.runtime.getManifest().version;
  const lang = getLang();
  main.innerHTML = `<div class="settings">${backbar(t('settings'))}
    <div class="card"><h3>${esc(t('language'))}</h3>
      <div class="seg"><button data-lang="uz" class="${lang === 'uz' ? 'on' : ''}">🇺🇿 O'zbekcha</button><button data-lang="ru" class="${lang === 'ru' ? 'on' : ''}">🇷🇺 Русский</button></div></div>
    <div class="card"><h3>${esc(t('source'))}</h3>
      <div class="seg"><button data-srcmode="auto" class="${S.settings.source === 'auto' ? 'on' : ''}">${esc(t('srcAuto'))}</button><button data-srcmode="sofa" class="${S.settings.source === 'sofa' ? 'on' : ''}">SofaScore</button><button data-srcmode="espn" class="${S.settings.source === 'espn' ? 'on' : ''}">ESPN</button></div>
      <small class="hint">${esc(t('srcHint'))}</small></div>
    <div class="card"><h3>${esc(t('notifications'))}</h3>
      <label class="switch"><input type="checkbox" id="optNotify" ${S.settings.notify ? 'checked' : ''}><span>${esc(t('notifications'))}<small>${esc(t('notifyHint'))}</small></span></label></div>
    <div class="card"><h3>${esc(t('shortcuts'))}</h3>
      <div class="kbd-row"><span>${esc(t('scOpen'))}</span><kbd>Alt+Shift+F</kbd></div>
      <div class="kbd-row"><span>${esc(t('scSearch'))}</span><kbd>/</kbd></div>
      <div class="kbd-row"><span>${esc(t('scDays'))}</span><span><kbd>←</kbd> <kbd>→</kbd></span></div>
      <div class="kbd-row"><span>${esc(t('scTabs'))}</span><span><kbd>1</kbd>–<kbd>4</kbd></span></div>
      <div class="kbd-row"><span>${esc(t('scBack'))}</span><kbd>Esc</kbd></div>
      <div class="kbd-row"><span></span><button class="btn ghost" data-act="shortcuts" style="margin:4px 0 0">${esc(t('changeShortcut'))}</button></div></div>
    <div class="card links">
      <a href="${DEV_URL}" target="_blank" rel="noopener">${esc(t('developer'))} <span>Bunyodg97 ↗</span></a>
      <a href="${DONATE_URL}" target="_blank" rel="noopener" class="donate">❤ ${esc(t('donate'))} <span>↗</span></a>
      <a href="${OTHER_URL}" target="_blank" rel="noopener">${esc(t('otherExt'))} <span>↗</span></a>
      <a href="#" data-act="reindex">${esc(t('refreshIndex'))} <span id="reidx">⟳</span></a>
    </div>
    <div class="foot">${esc(t('version'))} ${esc(ver)} · ${esc(t('dataSource'))}</div></div>`;
}

// ---------- teskari sanoq ----------
function tick() {
  document.querySelectorAll('.cd[data-ts]').forEach(el => {
    const ts = +el.dataset.ts;
    let ms = ts - Date.now();
    if (el.dataset.state === 'in' || ms <= 0) {
      el.classList.add('live');
      el.innerHTML = `<span style="min-width:auto;padding:5px 12px">${esc(t('started'))}</span>`;
      return;
    }
    const d = Math.floor(ms / 86400e3); ms -= d * 86400e3;
    const h = Math.floor(ms / 3600e3); ms -= h * 3600e3;
    const m = Math.floor(ms / 60e3); ms -= m * 60e3;
    const s = Math.floor(ms / 1e3);
    const cell = (v, k) => `<span>${String(v).padStart(2, '0')}<small>${esc(t(k))}</small></span>`;
    el.innerHTML = (d ? cell(d, 'd') : '') + cell(h, 'h') + cell(m, 'm') + (d ? '' : cell(s, 's'));
  });
}

// ---------- navigatsiya ----------
function push(v) { S.stack.push(v); main.scrollTop = 0; delete main.dataset.v; render(); }
function back() {
  if (S.stack.length) { S.stack.pop(); delete main.dataset.v; render(); return; }
  if (S.query) { qInput.value = ''; S.query = ''; render(); return; }
  if (S.tab === 'leagues' && S.lnav.length) {
    S.lnav.pop();
    if (S.lnav.length === 1 && (S.tree[S.sportId] || []).length === 1) S.lnav = [];
    render();
  }
}

function openTeam(p) {
  const tm = { id: String(p.id), src: p.src || 'espn', sportId: S.sportId, name: p.name, logo: p.logo, sub: p.sub || '', leagues: p.leagues || [] };
  push({ type: 'team', team: tm });
}

function toggleFav(tm) {
  const s2 = tm.src || 'espn';
  const i = S.favs.findIndex(f => f.id === String(tm.id) && f.sportId === S.sportId && (f.src || 'espn') === s2);
  if (i >= 0) S.favs.splice(i, 1);
  else S.favs.push({ id: String(tm.id), src: s2, name: tm.name, logo: tm.logo, leagues: tm.leagues || [], sport: sport().path, sportId: S.sportId });
  save();
  try { chrome.runtime.sendMessage({ type: 'poll' }); } catch {}
}

function openLink(url) { if (url) chrome.tabs.create({ url }); }

// ---------- hodisalar ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-team], button, [data-link], [data-idx], a[data-act]');
  if (!el) return;
  const ds = el.dataset;

  if (ds.sport) { S.sportId = ds.sport; S.stack = []; S.lnav = []; S.expanded.clear(); S.closed.clear(); S.liveCount = 0; S.settings.sportId = ds.sport; save(); delete main.dataset.v; render(); return; }
  if (ds.tab) { S.tab = ds.tab; S.stack = []; S.settings.tab = ds.tab; save(); if (S.query) { S.query = ''; qInput.value = ''; } delete main.dataset.v; render(); return; }
  if (el.id === 'btnSettings') { if (S.stack.at(-1)?.type !== 'settings') push({ type: 'settings' }); return; }
  if (ds.act === 'back') return back();
  if (ds.act === 'retry') { delete main.dataset.v; return render(); }
  if (ds.act === 'prevDay') { S.date = api.addDays(S.date, -1); return render(); }
  if (ds.act === 'nextDay') { S.date = api.addDays(S.date, 1); return render(); }
  if (ds.act === 'shortcuts') { chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); return; }
  if (ds.act === 'reindex') {
    e.preventDefault();
    const s = document.getElementById('reidx'); if (s) s.textContent = '…';
    buildIndex(S.sportId, (d, n) => { if (s) s.textContent = `${d}/${n}`; }, true).then(() => { if (s) s.textContent = '✓ ' + t('refreshed'); });
    return;
  }
  if (ds.act === 'toggleFav') {
    const v = S.stack.at(-1); toggleFav(v.team);
    const on = isFav(v.team.id, v.team.src); el.classList.toggle('on', on); el.textContent = on ? '★' : '☆';
    return;
  }
  if (ds.lang) { applyLang(ds.lang); S.settings.lang = ds.lang; S.tree = {}; save(); render(); return; }
  if (ds.srcmode) { S.settings.source = ds.srcmode; src.setMode(ds.srcmode); S.tree = {}; S.lnav = []; save(); render(); return; }
  if (ds.toggle) {
    const k = ds.toggle;
    const isOpen = !!el.closest('.group').querySelector('.match');
    if (isOpen) { S.expanded.delete(k); S.closed.add(k); } else { S.closed.delete(k); S.expanded.add(k); }
    const st = main.scrollTop;
    render().then(() => { main.scrollTop = st; });
    return;
  }
  if (ds.lgkey) { const lg = S.lgMap[ds.lgkey]; if (lg) push({ type: 'league', lg, sub: 'matches' }); return; }
  if (ds.sub) { const v = S.stack.at(-1); v.sub = ds.sub; return render(); }
  if (ds.region) { S.lnav = [ds.region]; return render(); }
  if (ds.country) { S.lnav = [S.lnav[0], ds.country]; return render(); }
  if (ds.favidx != null) {
    e.stopPropagation();
    const tm = S.lastFound[+ds.favidx]; toggleFav(tm);
    const on = isFav(tm.id, tm.src); el.classList.toggle('on', on); el.textContent = on ? '★' : '☆';
    return;
  }
  if (ds.openteam) { const [s2, id] = ds.openteam.split(':'); const f = S.favs.find(x => x.id === id && (x.src || 'espn') === s2); if (f) openTeam({ ...f, src: s2 }); return; }
  if (ds.idx != null) { openTeam(S.lastFound[+ds.idx]); return; }
  if (ds.team) {
    e.stopPropagation();
    if (!ds.team || ds.team === 'null') return;
    openTeam({ id: ds.team, src: ds.src, name: ds.tname, logo: ds.tlogo, leagues: ds.lg ? [ds.lg] : [] });
    return;
  }
  if (ds.link) openLink(ds.link);
});

document.addEventListener('change', e => {
  if (e.target.id === 'optNotify') {
    S.settings.notify = e.target.checked; save();
    if (e.target.checked) try { chrome.runtime.sendMessage({ type: 'poll' }); } catch {}
  }
});

document.addEventListener('input', e => {
  if (e.target.id !== 'cfilter') return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#clist .row').forEach(r => { r.style.display = !q || r.dataset.cname.includes(q) ? '' : 'none'; });
});

// Logotip yuklanmasa — bo'sh joy qoldiramiz
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

let qTimer;
qInput.addEventListener('input', () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    S.query = qInput.value.trim();
    S.stack = [];
    delete main.dataset.v;
    render();
  }, 220);
});

document.addEventListener('keydown', e => {
  const inInput = e.target === qInput;
  if (e.target.id === 'cfilter') { if (e.key === 'Escape') back(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (inInput && qInput.value) { qInput.value = ''; S.query = ''; render(); } else back(); return; }
  if (inInput) return;
  if (e.key === '/') { e.preventDefault(); qInput.focus(); qInput.select(); return; }
  const top = S.stack.at(-1);
  if (!top && !S.query && S.tab === 'home') {
    if (e.key === 'ArrowLeft') { S.date = api.addDays(S.date, -1); render(); return; }
    if (e.key === 'ArrowRight') { S.date = api.addDays(S.date, 1); render(); return; }
  }
  const tabs = { 1: 'home', 2: 'live', 3: 'fav', 4: 'leagues' };
  if (tabs[e.key]) { S.tab = tabs[e.key]; S.stack = []; S.query = ''; qInput.value = ''; delete main.dataset.v; render(); }
});

function applyLang(l) { setLang(l); setDataLang(l); setSofaLang(l); }

// ---------- ishga tushirish ----------
(async function init() {
  let st = {};
  try { st = await chrome.storage.local.get(['settings', 'favs']); } catch {}
  S.settings = Object.assign({ notify: true, source: 'auto' }, st.settings || {});
  src.setMode(S.settings.source);
  S.favs = st.favs || [];
  if (!S.settings.lang) { S.settings.lang = detectLang(); save(); } // birinchi ochilishda brauzer tilidan
  applyLang(S.settings.lang);
  if (S.settings.sportId && SPORTS.some(s => s.id === S.settings.sportId)) S.sportId = S.settings.sportId;
  if (S.settings.tab) S.tab = S.settings.tab;
  render();

  setInterval(tick, 1000);
  // Jonli ma'lumotlarni har 30 soniyada yangilash
  setInterval(() => {
    const top = S.stack.at(-1);
    if (top && top.type === 'settings') return;
    if (S.query) return;
    render();
  }, 30000);
})();
