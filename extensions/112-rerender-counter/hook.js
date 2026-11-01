// MAIN world, document_start: React commit'larini kuzatib, komponent render'larini sanaydi.
(function () {
  if (window.__rrInstalled) return;
  window.__rrInstalled = true;
  const COMP = new Set([0, 1, 2, 11, 14, 15]);
  const PerformedWork = 1;
  const counts = new Map(); // name -> {n, last, mounts}
  let flash = false, dirty = false, total = 0;

  let hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    let id = 0;
    hook = {
      renderers: new Map(), supportsFiber: true, isDisabled: false,
      inject(r) { const i = ++id; this.renderers.set(i, r); return i; },
      onCommitFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, onScheduleFiberRoot() {}, checkDCE() {},
      sub() { return () => {}; }, emit() {}, on() {}, off() {}
    };
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
  }

  const nameOf = t => !t || typeof t === 'string' ? null : t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || (t.type && nameOf(t.type)) || null;
  const didRender = f => ((f.flags !== undefined ? f.flags : f.effectTag) & PerformedWork) === PerformedWork;
  const pending = [];

  function record(f, mount) {
    const n = nameOf(f.type) || nameOf(f.elementType);
    if (!n) return;
    let c = counts.get(n);
    if (!c) counts.set(n, c = { n: 0, mounts: 0, last: 0 });
    if (mount) c.mounts++; else c.n++;
    c.last = performance.now();
    total++;
    dirty = true;
    if (flash && !mount) pending.push(f);
  }
  function mountTree(f) {
    for (; f; f = f.sibling) {
      if (COMP.has(f.tag)) record(f, true);
      if (f.child) mountTree(f.child);
    }
  }
  function updateTree(next, prev) {
    if (COMP.has(next.tag) && next !== prev && didRender(next)) record(next, false);
    if (next.child === prev.child) return; // pastki daraxt o'zgarmagan
    for (let c = next.child; c; c = c.sibling) {
      if (c.alternate) updateTree(c, c.alternate);
      else { if (COMP.has(c.tag)) record(c, true); if (c.child) mountTree(c.child); }
    }
  }

  const orig = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = function (id, root) {
    try {
      const cur = root.current, prev = cur.alternate;
      if (!prev || !prev.memoizedState || !prev.child) mountTree(cur.child);
      else updateTree(cur, prev);
      if (pending.length) doFlash();
      schedule();
    } catch (e) { /* jim */ }
    return orig && orig.apply(this, arguments);
  };

  function hostNode(f) {
    let c = f.child;
    while (c) { if (c.tag === 5 && c.stateNode && c.stateNode.getBoundingClientRect) return c.stateNode; c = c.child; }
    return null;
  }
  function doFlash() {
    const items = pending.splice(0, 200);
    if (!ui) return;
    for (const f of items) {
      const el = hostNode(f);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border:2px solid #f03e3e;border-radius:3px;pointer-events:none;transition:opacity .6s;opacity:1`;
      ui.layer.appendChild(d);
      setTimeout(() => { d.style.opacity = '0'; }, 300);
      setTimeout(() => d.remove(), 950);
    }
  }

  // Panel
  let ui = null, timer = 0;
  function L() {
    const l = document.documentElement.dataset.rrLang || (navigator.language.startsWith('ru') ? 'ru' : 'uz');
    return l === 'ru'
      ? { title: 'Ререндеры', reset: 'Сброс', flash: 'Подсветка', total: 'всего', mounts: 'монт.', none: 'Ждём рендеров React…' }
      : { title: 'Re-render', reset: 'Nolga', flash: 'Ramka', total: 'jami', mounts: 'mount', none: 'React render’lari kutilmoqda…' };
  }
  function build() {
    if (ui || !document.body) return;
    const host = document.createElement('div');
    host.style.cssText = 'all:initial;position:fixed;left:10px;bottom:10px;z-index:2147483647';
    const root = host.attachShadow({ mode: 'open' });
    const s = L();
    root.innerHTML = `<style>
      .p{width:300px;max-height:360px;display:flex;flex-direction:column;background:#1e1b2e;color:#ece9f5;font:12px/1.4 system-ui,sans-serif;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden}
      .h{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#2a2540}
      .h b{flex:1}button{background:#3b3458;color:#ece9f5;border:0;border-radius:5px;padding:3px 7px;font:11px system-ui;cursor:pointer}button.on{background:#7048e8}
      .l{overflow:auto;padding:4px 0}.r{display:grid;grid-template-columns:1fr 46px 40px;gap:6px;padding:2px 10px}
      .r span:nth-child(2){text-align:right;font-weight:700;font-variant-numeric:tabular-nums}.r span:nth-child(3){text-align:right;color:#9a93b8;font-size:11px}
      .r.hot span:nth-child(2){color:#ff8787}.r.new{background:rgba(112,72,232,.25)}
      .e{padding:12px;color:#9a93b8;text-align:center}.min .l{display:none}
      .f{padding:4px 10px;color:#9a93b8;font-size:11px;border-top:1px solid #322c4a}
    </style><div class="p"><div class="h"><b>↻ ${s.title}</b><button data-a="flash">${s.flash}</button><button data-a="reset">${s.reset}</button><button data-a="min">_</button></div><div class="l"></div><div class="f"></div></div>`;
    const layer = document.createElement('div');
    layer.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646';
    document.documentElement.append(layer, host);
    root.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (a === 'reset') { counts.clear(); total = 0; render(); }
      if (a === 'flash') { flash = !flash; e.target.classList.toggle('on', flash); }
      if (a === 'min') root.querySelector('.p').classList.toggle('min');
    });
    ui = { root, layer, list: root.querySelector('.l'), foot: root.querySelector('.f') };
    render();
  }
  function schedule() { if (!timer) timer = setTimeout(() => { timer = 0; build(); if (dirty) render(); }, 250); }
  function render() {
    if (!ui) return;
    dirty = false;
    const s = L();
    const now = performance.now();
    const rows = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].mounts - a[1].mounts).slice(0, 40);
    const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    ui.list.innerHTML = rows.length ? rows.map(([n, c]) => `<div class="r${c.n > 20 ? ' hot' : ''}${now - c.last < 1000 ? ' new' : ''}"><span>${esc(n)}</span><span>${c.n}</span><span>${c.mounts}</span></div>`).join('') : `<div class="e">${s.none}</div>`;
    ui.foot.textContent = `${counts.size} · ${s.total} ${total} · ${s.mounts}`;
  }
  document.addEventListener('DOMContentLoaded', schedule);
  setInterval(() => { if (ui) render(); }, 1500);
})();
