const { $, h } = App;
const S = () => STR[I18N.lang];
const DEF_LINKS = [{ n: 'GitHub', u: 'https://github.com' }, { n: 'MDN', u: 'https://developer.mozilla.org' }, { n: 'Stack Overflow', u: 'https://stackoverflow.com' }, { n: 'npm', u: 'https://www.npmjs.com' }, { n: 'Can I use', u: 'https://caniuse.com' }];

function tick() {
  const d = new Date();
  $('#clock').textContent = d.toLocaleTimeString(I18N.lang === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const s = S();
  $('#date').textContent = `${s.days[d.getDay()]}, ${d.getDate()}${I18N.lang === 'ru' ? ' ' : '-'}${s.months[d.getMonth()]}`;
  const hr = d.getHours();
  $('#greet').textContent = s.greet[hr < 5 ? 0 : hr < 12 ? 1 : hr < 18 ? 2 : 3];
}

function search(e) {
  e.preventDefault();
  let q = $('#s').value.trim();
  if (!q) return;
  const map = { gh: 'https://github.com/search?type=repositories&q=', mdn: 'https://developer.mozilla.org/search?q=', so: 'https://stackoverflow.com/search?q=', npm: 'https://www.npmjs.com/search?q=', yt: 'https://www.youtube.com/results?search_query=' };
  const m = q.match(/^(gh|mdn|so|npm|yt):\s*(.*)$/i);
  let url;
  if (m) url = map[m[1].toLowerCase()] + encodeURIComponent(m[2]);
  else if (/^https?:\/\/\S+$/.test(q) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q)) url = q.startsWith('http') ? q : 'https://' + q;
  else { url = 'https://www.google.com/search?q=' + encodeURIComponent(q); }
  location.href = url;
}

// ---- vazifalar ----
async function todos() {
  const list = await App.get('todos', []);
  const box = $('#todos'); box.innerHTML = '';
  list.forEach((x, i) => {
    const cb = h('input', { type: 'checkbox' }); cb.checked = x.d;
    cb.addEventListener('change', async () => { list[i].d = cb.checked; await App.set('todos', list); todos(); });
    box.append(h('div', { class: 'td' + (x.d ? ' done' : '') }, cb, h('span', { text: x.t }),
      h('button', { text: '✕', onclick: async () => { list.splice(i, 1); await App.set('todos', list); todos(); } })));
  });
}
// ---- havolalar ----
async function links() {
  const list = await App.get('links', DEF_LINKS);
  const box = $('#links'); box.innerHTML = '';
  list.forEach((l, i) => {
    let host = ''; try { host = new URL(l.u).hostname; } catch (e) {}
    box.append(h('a', { href: l.u }, h('img', { src: `https://www.google.com/s2/favicons?domain=${host}&sz=32`, alt: '' }), l.n,
      h('b', { text: '×', onclick: async e => { e.preventDefault(); list.splice(i, 1); await App.set('links', list); links(); } })));
  });
}

// ---- GitHub ----
function item(title, url, meta) { return h('a', { class: 'it', href: url }, h('div', { class: 't', text: title }), h('div', { class: 'm', text: meta })); }
const repoName = u => (u || '').replace('https://api.github.com/repos/', '');
const ago = d => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; };

async function github(force) {
  const user = await App.get('ghUser', '');
  const token = await GH.token();
  $('#setup').classList.toggle('hidden', !!(user && token));
  if (!user) return;
  let cache = await App.get('ghCache', null);
  if (force || !cache || cache.user !== user || Date.now() - cache.t > 10 * 60000) {
    const q = s => GH.api('/search/issues?per_page=15&sort=updated&q=' + encodeURIComponent(s)).then(r => r.items).catch(() => null);
    const [prs, rev, iss, ev] = await Promise.all([
      q(`is:open is:pr author:${user} archived:false`), q(`is:open is:pr review-requested:${user} archived:false`),
      q(`is:open is:issue assignee:${user} archived:false`), GH.api(`/users/${user}/events?per_page=20`).catch(() => null)]);
    cache = { user, t: Date.now(), prs, rev, iss, ev };
    await App.set('ghCache', cache);
  }
  renderGH(cache);
}
function renderGH(c) {
  const s = S();
  const fill = (id, nid, arr) => {
    const box = $('#' + id); box.innerHTML = '';
    $('#' + nid).textContent = arr ? arr.length : '?';
    if (!arr) return;
    if (!arr.length) box.append(h('div', { class: 'empty small', text: s.none }));
    arr.forEach(x => box.append(item(x.title, x.html_url, `${repoName(x.repository_url)} #${x.number} · ${ago(x.updated_at)}${x.draft ? ' · draft' : ''}`)));
  };
  fill('prs', 'nPrs', c.prs); fill('rev', 'nRev', c.rev); fill('iss', 'nIss', c.iss);
  const act = $('#act'); act.innerHTML = '';
  (c.ev || []).slice(0, 15).forEach(e => {
    const p = e.payload || {};
    const title = (p.pull_request && p.pull_request.title) || (p.issue && p.issue.title) || (p.commits && p.commits[0] && p.commits[0].message.split('\n')[0]) || (p.ref || '') || e.repo.name;
    act.append(item(title, 'https://github.com/' + e.repo.name, `${s.ev[e.type] || e.type.replace('Event', '')} · ${e.repo.name} · ${ago(e.created_at)}`));
  });
  $('#upd').textContent = t('updated', { t: new Date(c.t).toLocaleTimeString() });
}

App.onReady(async () => {
  tick(); setInterval(tick, 1000);
  $('#sform').addEventListener('submit', search);
  $('#tform').addEventListener('submit', async e => {
    e.preventDefault();
    const v = $('#tin').value.trim(); if (!v) return;
    const list = await App.get('todos', []); list.unshift({ t: v, d: false }); await App.set('todos', list);
    $('#tin').value = ''; todos();
  });
  $('#clearDone').addEventListener('click', async () => { await App.set('todos', (await App.get('todos', [])).filter(x => !x.d)); todos(); });
  $('#lform').addEventListener('submit', async e => {
    e.preventDefault();
    let u = $('#lu').value.trim(); const n = $('#ln').value.trim() || u;
    if (!u) return; if (!/^https?:/.test(u)) u = 'https://' + u;
    const list = await App.get('links', DEF_LINKS); list.push({ n, u }); await App.set('links', list);
    $('#ln').value = $('#lu').value = ''; links();
  });
  $('#ghUser').value = await App.get('ghUser', '');
  $('#saveUser').addEventListener('click', async () => { await App.set('ghUser', $('#ghUser').value.trim()); App.toast(t('saved'), 'ok'); github(true).catch(e => App.toast(e.message, 'err')); });
  $('#upd').addEventListener('click', () => github(true).catch(e => App.toast(e.message, 'err')));
  todos(); links();
  github(false).catch(e => App.toast(e.message, 'err'));
});
App.onLang(async () => { tick(); const c = await App.get('ghCache', null); if (c) renderGH(c); });
