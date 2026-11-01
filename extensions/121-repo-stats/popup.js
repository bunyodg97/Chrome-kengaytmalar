const { $, h } = App;
const LC = { JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', PHP: '#4F5D95', 'C#': '#178600', 'C++': '#f34b7d', C: '#555555', Ruby: '#701516', Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', Vue: '#41b883', Svelte: '#ff3e00', Shell: '#89e051', Dockerfile: '#384d54', Lua: '#000080', Elixir: '#6e4a7e', Scala: '#c22d40' };
let data = null;

const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n);
const days = d => Math.floor((Date.now() - new Date(d)) / 864e5);
const ago = d => { const n = days(d); return n <= 0 ? t('today') : t('ago', { n }); };

async function load(owner, repo) {
  $('#out').innerHTML = ''; $('#out').append(h('div', { class: 'empty', text: t('loading') }));
  const base = `/repos/${owner}/${repo}`;
  const [info, langs, contrib, rel, prs] = await Promise.all([
    GH.api(base), GH.api(base + '/languages'), GH.api(base + '/contributors?per_page=10').catch(() => []),
    GH.api(base + '/releases/latest').catch(() => null),
    GH.api(`/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} is:pr is:open`)}&per_page=1`).catch(() => null)
  ]);
  let act = await GH.api(base + '/stats/commit_activity', { allow202: true }).catch(() => null);
  data = { info, langs, contrib: contrib || [], rel, prs: prs ? prs.total_count : null, act };
  render();
  if (act && act.pending) setTimeout(async () => {
    data.act = await GH.api(base + '/stats/commit_activity', { allow202: true }).catch(() => null);
    render();
  }, 3000);
}

function render() {
  if (!data) return;
  const { info, langs, contrib, rel, prs, act } = data;
  const O = $('#out'); O.innerHTML = '';
  const openIssues = prs != null ? Math.max(0, info.open_issues_count - prs) : info.open_issues_count;
  O.append(h('div', {},
    h('div', { class: 'rs-title' }, h('a', { href: info.html_url, target: '_blank', text: info.full_name })),
    info.description ? h('div', { class: 'small muted', text: info.description }) : '',
    h('div', { class: 'row', style: { marginTop: '4px' } }, info.archived ? h('span', { class: 'badge warn', text: t('archived') }) : '',
      info.fork && info.parent ? h('span', { class: 'badge', text: t('fork', { s: info.parent.full_name }) }) : '',
      ...(info.topics || []).slice(0, 6).map(x => h('span', { class: 'badge', text: x })))));
  const st = h('div', { class: 'stats' });
  [[fmtN(info.stargazers_count), t('stars')], [fmtN(info.forks_count), t('forks')], [fmtN(openIssues), t('issues')], [prs == null ? '—' : fmtN(prs), t('prs')], [fmtN(info.subscribers_count || 0), t('watchers')], [App.bytes(info.size * 1024), t('size')]]
    .forEach(([v, l]) => st.append(h('div', { class: 'stat card' }, h('b', { text: v }), h('span', { text: l }))));
  O.append(st);
  // tillar
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total) {
    const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
    const col = n => LC[n] || `hsl(${[...n].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360} 55% 55%)`;
    O.append(h('div', {}, h('div', { class: 'set-title', text: t('languages') }),
      h('div', { class: 'langbar' }, entries.map(([n, v]) => h('i', { title: n, style: { width: (v / total * 100) + '%', background: col(n) } }))),
      h('div', { class: 'lang-leg' }, entries.slice(0, 8).map(([n, v]) => h('span', {}, h('i', { style: { background: col(n) } }), n + ' ' + (v / total * 100).toFixed(1) + '%')))));
  }
  // faollik
  const box = h('div', {}, h('div', { class: 'set-title', text: t('activity') }));
  if (Array.isArray(act) && act.length) {
    const max = Math.max(1, ...act.map(w => w.total));
    const W = 352, H = 50, bw = W / act.length;
    const svg = `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${act.map((w, i) => `<rect x="${(i * bw).toFixed(1)}" y="${(H - Math.max(1, w.total / max * H)).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${Math.max(1, w.total / max * H).toFixed(1)}" rx="1"><title>${new Date(w.week * 1000).toLocaleDateString()}: ${w.total}</title></rect>`).join('')}</svg>`;
    box.append(h('div', { html: svg }), h('div', { class: 'small muted', text: t('commitsYear', { n: act.reduce((a, w) => a + w.total, 0) }) }));
  } else box.append(h('div', { class: 'small muted', text: t('computing') }));
  O.append(box);
  if (contrib.length) O.append(h('div', {}, h('div', { class: 'set-title', text: t('contributors') }),
    h('div', { class: 'contrib' }, contrib.filter(c => c.type !== 'Bot').map(c => h('a', { href: c.html_url, target: '_blank', title: c.contributions + ' commits' }, h('img', { src: c.avatar_url + '&s=68', alt: '' }), h('span', { text: c.login }), h('b', { text: fmtN(c.contributions) }))))));
  const pushedDays = days(info.pushed_at);
  O.append(h('div', { class: 'kv' },
    h('span', { text: t('created') }), h('span', { text: new Date(info.created_at).toLocaleDateString() }),
    h('span', { text: t('pushed') }), h('span', { text: ago(info.pushed_at), style: { color: pushedDays > 365 ? 'var(--bad)' : pushedDays > 90 ? 'var(--warn)' : 'var(--ok)' } }),
    h('span', { text: t('release') }), rel ? h('a', { href: rel.html_url, target: '_blank', text: rel.tag_name + ' · ' + ago(rel.published_at) }) : h('span', { text: t('none') }),
    h('span', { text: t('license') }), h('span', { text: info.license ? info.license.spdx_id : t('none') })));
}

App.onReady(async () => {
  const tab = await App.tab();
  const r = GH.parse(tab && tab.url || '');
  const go = async (o, rp) => { try { await load(o, rp); } catch (e) { $('#out').innerHTML = ''; App.toast(e.message, 'err'); $('#ask').classList.remove('hidden'); } };
  $('#go').addEventListener('click', () => { const m = $('#repoIn').value.trim().match(/([\w.-]+)\/([\w.-]+)/); if (m) go(m[1], m[2]); });
  $('#repoIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('#go').click(); });
  if (r) go(r.owner, r.repo); else $('#ask').classList.remove('hidden');
});
App.onLang(render);
