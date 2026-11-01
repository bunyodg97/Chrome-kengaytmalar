const { $, $$, h } = App;
const COLORS = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599', '#e03131', '#5c940d', '#d6336c', '#3b5bdb'];
const ROW = 30, LANE = 14, PAD = 12;
let state = null; // {owner, repo, branches:[], selected:Set, per, commits:Map}

function parseRepo(v) {
  v = v.trim().replace(/\.git$/, '');
  const m = v.match(/github\.com\/([^/]+)\/([^/#?]+)/) || v.match(/^([\w.-]+)\/([\w.-]+)$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function start() {
  const r = parseRepo($('#repo').value);
  if (!r) return App.toast(t('empty'), 'err');
  $('#info').textContent = t('loading');
  try {
    const info = await GH.api(`/repos/${r.owner}/${r.repo}`);
    const brs = await GH.api(`/repos/${r.owner}/${r.repo}/branches?per_page=100`);
    const def = info.default_branch;
    const names = [def, ...brs.map(b => b.name).filter(n => n !== def)];
    const prevSel = state && state.owner === r.owner && state.repo === r.repo ? state.selected : null;
    state = { owner: r.owner, repo: r.repo, def, branches: brs, names, selected: prevSel || new Set(names.slice(0, 6)), per: +$('#per').value, commits: new Map(), heads: {}, page: 1 };
    brs.forEach(b => { state.heads[b.name] = b.commit.sha; });
    location.hash = r.owner + '/' + r.repo;
    renderBranches();
    await loadCommits();
  } catch (e) { $('#info').textContent = ''; App.toast(e.message, 'err'); }
}

function renderBranches() {
  $('#brBox').classList.remove('hidden');
  $('#brCount').textContent = state.selected.size + '/' + state.names.length;
  const L = $('#brList'); L.innerHTML = '';
  state.names.forEach(n => {
    const cb = h('input', { type: 'checkbox' });
    cb.checked = state.selected.has(n);
    cb.addEventListener('change', () => { cb.checked ? state.selected.add(n) : state.selected.delete(n); $('#brCount').textContent = state.selected.size + '/' + state.names.length; });
    L.append(h('label', { class: 'check small' }, cb, h('span', { class: 'mono', text: n + (n === state.def ? ' ★' : '') })));
  });
}

async function loadCommits() {
  for (const b of state.selected) {
    $('#info').textContent = t('loadingBranch', { b });
    const list = await GH.api(`/repos/${state.owner}/${state.repo}/commits?sha=${encodeURIComponent(b)}&per_page=${state.per}&page=${state.page}`);
    for (const c of list) if (!state.commits.has(c.sha)) state.commits.set(c.sha, c);
  }
  $('#info').textContent = t('commits', { n: state.commits.size });
  draw();
  $('#more').classList.remove('hidden');
}

function order() {
  // Sana bo'yicha, lekin bola har doim ota-onadan oldin (topologik)
  const all = [...state.commits.values()];
  const date = c => new Date(c.commit.committer.date).getTime();
  all.sort((a, b) => date(b) - date(a));
  const pos = new Map(all.map((c, i) => [c.sha, i]));
  const children = new Map();
  all.forEach(c => c.parents.forEach(p => { if (pos.has(p.sha)) (children.get(p.sha) || children.set(p.sha, []).get(p.sha)).push(c.sha); }));
  const done = new Set(), out = [];
  const visit = c => {
    if (done.has(c.sha)) return;
    for (const ch of (children.get(c.sha) || [])) if (!done.has(ch)) return; // bolalari hali chiqmagan
    done.add(c.sha); out.push(c);
  };
  let guard = 0;
  while (out.length < all.length && guard++ < all.length * 3) {
    for (const c of all) { if (!done.has(c.sha)) { const before = out.length; visit(c); if (out.length > before) break; } }
  }
  for (const c of all) if (!done.has(c.sha)) out.push(c);
  return out;
}

function layout(list) {
  const lanes = [];
  const idx = new Map(list.map((c, i) => [c.sha, i]));
  const nodes = [];
  const free = () => { const i = lanes.indexOf(null); return i === -1 ? lanes.push(null) - 1 : i; };
  list.forEach((c, row) => {
    let lane = lanes.indexOf(c.sha);
    if (lane === -1) lane = free();
    for (let i = 0; i < lanes.length; i++) if (i !== lane && lanes[i] === c.sha) lanes[i] = null;
    const parents = c.parents.map(p => p.sha).filter(p => idx.has(p));
    lanes[lane] = parents[0] || null;
    const pl = [lane];
    for (const p of parents.slice(1)) {
      let j = lanes.indexOf(p);
      if (j === -1) { j = free(); lanes[j] = p; }
      pl.push(j);
    }
    nodes.push({ c, row, lane });
    while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
  });
  return nodes;
}

function draw() {
  const list = order();
  const nodes = layout(list);
  const at = new Map(nodes.map(n => [n.c.sha, n]));
  const maxLane = nodes.reduce((m, n) => Math.max(m, n.lane), 0);
  const gw = PAD * 2 + (maxLane + 1) * LANE;
  const G = $('#graph'); G.innerHTML = '';
  const X = l => PAD + l * LANE, Y = r => r * ROW + ROW / 2;
  let paths = '';
  for (const n of nodes) {
    n.c.parents.forEach((p, pi) => {
      const pn = at.get(p.sha);
      if (!pn) { // ota yuklanmagan — pastga qisqa chiziq
        paths += `<path d="M${X(n.lane)} ${Y(n.row)} V${Y(n.row) + ROW / 2}" stroke="${COLORS[n.lane % 10]}" stroke-width="2" fill="none" stroke-dasharray="3 3"/>`;
        return;
      }
      const x1 = X(n.lane), y1 = Y(n.row), x2 = X(pn.lane), y2 = Y(pn.row);
      let d, col;
      if (x1 === x2) { d = `M${x1} ${y1} V${y2}`; col = COLORS[n.lane % 10]; }
      else if (pi === 0) { d = `M${x1} ${y1} V${y2 - ROW} C${x1} ${y2 - ROW / 2} ${x2} ${y2 - ROW / 2} ${x2} ${y2}`; col = COLORS[n.lane % 10]; }
      else { d = `M${x1} ${y1} C${x1} ${y1 + ROW / 2} ${x2} ${y1 + ROW / 2} ${x2} ${y1 + ROW} V${y2}`; col = COLORS[pn.lane % 10]; }
      paths += `<path d="${d}" stroke="${col}" stroke-width="2" fill="none"/>`;
    });
  }
  for (const n of nodes) {
    const merge = n.c.parents.length > 1;
    paths += `<circle cx="${X(n.lane)}" cy="${Y(n.row)}" r="${merge ? 3.5 : 4.5}" fill="${merge ? 'var(--bg)' : COLORS[n.lane % 10]}" stroke="${COLORS[n.lane % 10]}" stroke-width="2"/>`;
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', gw); svg.setAttribute('height', nodes.length * ROW);
  svg.innerHTML = paths;
  G.append(svg);
  const refs = {};
  for (const [b, sha] of Object.entries(state.heads)) if (state.selected.has(b)) (refs[sha] ||= []).push(b);
  const base = `https://github.com/${state.owner}/${state.repo}`;
  for (const n of nodes) {
    const c = n.c;
    const msg = c.commit.message.split('\n')[0];
    G.append(h('div', { class: 'cg-row', style: { paddingLeft: gw + 'px' } },
      h('div', { class: 'msg' }, ...(refs[c.sha] || []).map(r => h('span', { class: 'ref', style: { background: COLORS[n.lane % 10] }, text: r })),
        h('a', { href: base + '/commit/' + c.sha, target: '_blank', title: c.commit.message, text: msg })),
      h('span', { class: 'au', text: (c.author && c.author.login) || c.commit.author.name }),
      h('span', { class: 'dt', text: new Date(c.commit.author.date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) }),
      h('a', { class: 'sha', href: base + '/commit/' + c.sha, target: '_blank', text: c.sha.slice(0, 7) })));
  }
}

App.onReady(() => {
  if (location.hash.length > 1) $('#repo').value = decodeURIComponent(location.hash.slice(1));
  $('#show').addEventListener('click', start);
  $('#repo').addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  $('#more').addEventListener('click', async () => {
    state.page++;
    try { await loadCommits(); } catch (e) { App.toast(e.message, 'err'); }
  });
  if ($('#repo').value) start();
});
