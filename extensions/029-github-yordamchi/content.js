(() => {
  const SKIP = new Set(['settings', 'orgs', 'marketplace', 'explore', 'topics', 'trending', 'notifications', 'pulls', 'issues', 'login', 'new', 'search', 'sponsors', 'features', 'codespaces', 'collections', 'about', 'pricing', 'enterprise', 'apps', 'organizations', 'users']);
  let token = '', treeOpen = false, cache = {};
  chrome.storage.local.get(['token', 'treeOpen'], o => { token = o.token || ''; treeOpen = !!o.treeOpen; run(); });
  const H = () => token ? { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' } : { Accept: 'application/vnd.github+json' };
  const api = async p => { const r = await fetch('https://api.github.com' + p, { headers: H() }); if (!r.ok) throw new Error(r.status === 403 ? 'API limiti tugadi — sozlamalarda token kiriting' : 'GitHub API: ' + r.status); return r.json(); };
  const fmt = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  function ctx() {
    const p = location.pathname.split('/').filter(Boolean);
    if (p.length < 2 || SKIP.has(p[0])) return null;
    const c = { owner: p[0], repo: p[1], kind: p[2] || '', rest: p.slice(3) };
    return c;
  }
  async function repoInfo(c) {
    const k = c.owner + '/' + c.repo;
    if (!cache[k]) cache[k] = api(`/repos/${k}`).catch(e => { delete cache[k]; throw e; });
    return cache[k];
  }
  async function tree(c, branch) {
    const k = `${c.owner}/${c.repo}@${branch}`;
    if (!cache[k]) cache[k] = api(`/repos/${c.owner}/${c.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`).catch(e => { delete cache[k]; throw e; });
    return cache[k];
  }
  // tarmoq/yo'lni ajratish: branch nomida '/' bo'lishi mumkin
  function splitRef(rest, branches) {
    const full = rest.join('/');
    const b = branches.sort((a, b) => b.length - a.length).find(x => full === x || full.startsWith(x + '/'));
    if (b) return { branch: b, path: full.slice(b.length + 1) };
    return { branch: rest[0], path: rest.slice(1).join('/') };
  }
  // --- repo hajmi ---
  async function sizeBadge(c) {
    if (document.getElementById('ghy-size')) return;
    const anchor = document.querySelector('#repository-container-header strong[itemprop="name"], [data-testid="repository-name"], #repo-title-component strong');
    if (!anchor) return;
    try {
      const info = await repoInfo(c);
      const s = document.createElement('span'); s.id = 'ghy-size';
      s.style.cssText = 'margin-left:8px;font-size:12px;padding:2px 8px;border:1px solid var(--borderColor-default,#d0d7de);border-radius:2em;color:var(--fgColor-muted,#59636e);font-weight:500;vertical-align:middle';
      s.textContent = fmt(info.size * 1024) + ' · ' + (info.language || '');
      anchor.after(s);
    } catch { }
  }
  // --- fayl daraxti paneli ---
  let panel;
  function buildPanel() {
    panel = document.createElement('div'); panel.id = 'ghy-panel';
    panel.innerHTML = `<style>
      #ghy-panel{position:fixed;top:0;left:0;bottom:0;width:300px;z-index:100;background:var(--bgColor-default,#fff);border-right:1px solid var(--borderColor-default,#d0d7de);display:flex;flex-direction:column;font:13px -apple-system,Segoe UI,sans-serif;transform:translateX(-100%);transition:transform .2s;box-shadow:2px 0 12px rgba(0,0,0,.08)}
      #ghy-panel.open{transform:none}
      #ghy-panel .hd{padding:10px 12px;border-bottom:1px solid var(--borderColor-default,#d0d7de);display:flex;gap:6px;align-items:center}
      #ghy-panel .hd b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #ghy-panel input{width:100%;margin:8px 12px 4px;width:calc(100% - 24px);padding:5px 8px;border:1px solid var(--borderColor-default,#d0d7de);border-radius:6px;background:transparent;color:inherit}
      #ghy-panel .bd{overflow:auto;flex:1;padding:4px 0 20px}
      #ghy-panel .r{display:flex;align-items:center;gap:4px;padding:2px 10px;cursor:pointer;white-space:nowrap;color:var(--fgColor-default,#1f2328);text-decoration:none}
      #ghy-panel .r:hover{background:var(--bgColor-muted,#f6f8fa)}
      #ghy-panel .r.cur{background:var(--bgColor-accent-muted,#ddf4ff)}
      #ghy-panel .r .s{margin-left:auto;color:var(--fgColor-muted,#59636e);font-size:11px;padding-left:8px}
      #ghy-panel .msg{padding:12px;color:var(--fgColor-muted,#59636e)}
      #ghy-tg{position:fixed;left:0;top:45%;z-index:101;writing-mode:vertical-rl;padding:10px 4px;border:1px solid var(--borderColor-default,#d0d7de);border-left:0;border-radius:0 8px 8px 0;background:var(--bgColor-default,#fff);color:var(--fgColor-default,#1f2328);cursor:pointer;font:600 12px -apple-system,sans-serif}
      #ghy-panel.open + #ghy-tg{left:300px}
      #ghy-panel button{border:1px solid var(--borderColor-default,#d0d7de);background:transparent;color:inherit;border-radius:6px;padding:2px 8px;cursor:pointer}
    </style><div class="hd"><b></b><button data-a="close" title="Yopish">✕</button></div><input placeholder="Fayl qidirish…"><div class="bd"></div>`;
    const tg = document.createElement('button'); tg.id = 'ghy-tg'; tg.textContent = '☰ Fayllar';
    document.body.append(panel, tg);
    tg.onclick = () => togglePanel(); panel.querySelector('[data-a=close]').onclick = () => togglePanel(false);
    panel.querySelector('input').oninput = e => renderTree(e.target.value.trim().toLowerCase());
  }
  function togglePanel(v) { treeOpen = v ?? !treeOpen; chrome.storage.local.set({ treeOpen }); panel.classList.toggle('open', treeOpen); if (treeOpen) loadTree(); }
  let curTree = null, curCtx = null, curRef = null, openDirs = new Set();
  async function loadTree() {
    const c = ctx(); if (!c) return;
    const bd = panel.querySelector('.bd'); panel.querySelector('b').textContent = c.owner + '/' + c.repo;
    try {
      const info = await repoInfo(c);
      let ref = { branch: info.default_branch, path: '' };
      if (['tree', 'blob'].includes(c.kind) && c.rest.length) { const br = await api(`/repos/${c.owner}/${c.repo}/branches?per_page=100`).catch(() => []); ref = splitRef(c.rest, br.map(b => b.name)); }
      if (!curTree || curCtx !== c.owner + c.repo + ref.branch) { bd.innerHTML = '<div class="msg">Yuklanmoqda…</div>'; curTree = await tree(c, ref.branch); curCtx = c.owner + c.repo + ref.branch; }
      curRef = { ...ref, c }; ref.path.split('/').reduce((a, p) => { const x = a ? a + '/' + p : p; openDirs.add(x); return x; }, '');
      renderTree('');
    } catch (e) { bd.innerHTML = `<div class="msg">${e.message}</div>`; }
  }
  function renderTree(q) {
    const bd = panel.querySelector('.bd'); if (!curTree) return;
    const items = curTree.tree; const { c, branch, path } = curRef;
    const link = (t, p) => `/${c.owner}/${c.repo}/${t === 'tree' ? 'tree' : 'blob'}/${branch}/${p}`;
    if (q) {
      bd.innerHTML = items.filter(i => i.type === 'blob' && i.path.toLowerCase().includes(q)).slice(0, 300).map(i => `<a class="r" href="${link('blob', i.path)}" title="${i.path}">📄 ${i.path}<span class="s">${fmt(i.size)}</span></a>`).join('') || '<div class="msg">Topilmadi</div>';
      return;
    }
    const kids = {}; items.forEach(i => { const p = i.path.split('/'); const parent = p.slice(0, -1).join('/'); (kids[parent] = kids[parent] || []).push(i); });
    const dirSize = {}; items.forEach(i => { if (i.type === 'blob') { const p = i.path.split('/'); for (let k = 1; k < p.length; k++) { const d = p.slice(0, k).join('/'); dirSize[d] = (dirSize[d] || 0) + i.size; } } });
    const rows = [];
    (function walk(dir, depth) {
      (kids[dir] || []).sort((a, b) => (a.type !== b.type ? (a.type === 'tree' ? -1 : 1) : a.path.localeCompare(b.path))).forEach(i => {
        const name = i.path.split('/').pop(), isDir = i.type === 'tree', open = openDirs.has(i.path);
        rows.push(`<a class="r ${i.path === path ? 'cur' : ''}" href="${link(isDir ? 'tree' : 'blob', i.path)}" data-d="${isDir ? i.path : ''}" style="padding-left:${10 + depth * 14}px">${isDir ? (open ? '📂' : '📁') : '📄'} ${name}<span class="s">${fmt(isDir ? dirSize[i.path] || 0 : i.size)}</span></a>`);
        if (isDir && open) walk(i.path, depth + 1);
      });
    })('', 0);
    bd.innerHTML = rows.join('') + (curTree.truncated ? '<div class="msg">Repo juda katta — daraxt qisqartirildi.</div>' : '');
    bd.onclick = e => { const a = e.target.closest('a[data-d]'); if (a && a.dataset.d && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openDirs.has(a.dataset.d) ? openDirs.delete(a.dataset.d) : openDirs.add(a.dataset.d); renderTree(''); } };
  }
  // --- papkani ZIP qilib yuklab olish ---
  async function folderButton(c) {
    if (c.kind !== 'tree' || document.getElementById('ghy-zip')) return;
    const host = document.querySelector('[data-testid="breadcrumbs"], #repos-header-breadcrumb, nav[aria-label="Breadcrumbs"]')?.parentElement || document.querySelector('#repo-content-pjax-container, #repo-content-turbo-frame, main');
    if (!host) return;
    const b = document.createElement('button'); b.id = 'ghy-zip'; b.className = 'btn btn-sm'; b.textContent = '⬇ Papkani ZIP qilib yuklash';
    b.style.cssText = 'margin:8px 0;padding:4px 12px;border-radius:6px;border:1px solid var(--borderColor-default,#d0d7de);background:var(--bgColor-muted,#f6f8fa);color:var(--fgColor-default,#1f2328);font:600 12px -apple-system,sans-serif;cursor:pointer';
    host.prepend(b);
    b.onclick = async () => {
      try {
        b.disabled = true; b.textContent = 'Fayllar ro\'yxati…';
        const info = await repoInfo(c); const br = await api(`/repos/${c.owner}/${c.repo}/branches?per_page=100`).catch(() => []);
        const { branch, path } = splitRef(c.rest, br.map(x => x.name).concat(info.default_branch));
        const t = await tree(c, branch);
        const files = t.tree.filter(i => i.type === 'blob' && (!path || i.path.startsWith(path + '/')));
        if (files.length > 800) { b.textContent = `Juda ko'p fayl (${files.length}). 800 tagacha ruxsat`; b.disabled = false; return; }
        const zip = new JSZip(); let done = 0;
        const q = [...files];
        await Promise.all(Array.from({ length: 6 }, async () => {
          while (q.length) {
            const f = q.shift(), rel = path ? f.path.slice(path.length + 1) : f.path;
            const url = token ? `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${encodeURI(f.path)}?ref=${encodeURIComponent(branch)}` : `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${encodeURIComponent(branch)}/${encodeURI(f.path)}`;
            const r = await fetch(url, { headers: token ? { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.raw' } : {} });
            zip.file(rel, await r.arrayBuffer()); b.textContent = `Yuklanmoqda ${++done}/${files.length}…`;
          }
        }));
        b.textContent = 'ZIP tayyorlanmoqda…';
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${c.repo}-${(path || branch).split('/').pop()}.zip`; a.click();
        b.textContent = '✓ Yuklandi';
      } catch (e) { b.textContent = 'Xato: ' + e.message; }
      b.disabled = false;
    };
  }
  let last = '';
  function run() {
    if (location.href === last) return; last = location.href;
    const c = ctx(); document.getElementById('ghy-zip')?.remove(); document.getElementById('ghy-size')?.remove();
    if (!c) { panel?.remove(); document.getElementById('ghy-tg')?.remove(); panel = null; return; }
    if (!panel) buildPanel();
    panel.classList.toggle('open', treeOpen); if (treeOpen) loadTree();
    setTimeout(() => { sizeBadge(c); folderButton(c); }, 600);
  }
  document.addEventListener('turbo:load', () => { last = ''; run(); });
  setInterval(run, 800);
})();
