// MAIN world: Vue 2/3 va Svelte komponentlarini tekshirish.
(function () {
  if (window.__vsActive) return;
  window.__vsActive = true;
  const S = window.__VS_STR || {};
  const EDITOR = window.__VS_EDITOR || 'vscode';

  const base = f => f ? f.split(/[\\/]/).pop().replace(/\.(vue|svelte)$/, '') : '';
  function vue3(el) {
    for (let e = el; e; e = e.parentElement) if (e.__vueParentComponent) return e.__vueParentComponent;
    return null;
  }
  function vue2(el) {
    for (let e = el; e; e = e.parentElement) if (e.__vue__) return e.__vue__;
    return null;
  }
  function svelte(el) {
    for (let e = el; e; e = e.parentElement) if (e.__svelte_meta) return { el: e, meta: e.__svelte_meta };
    return null;
  }
  function info(el) {
    const i3 = vue3(el);
    if (i3) {
      const chain = [];
      for (let c = i3; c; c = c.parent) chain.push(c.type.name || c.type.__name || base(c.type.__file) || 'Anonymous');
      let computed = {};
      const cmp = i3.type.computed;
      if (cmp) for (const k in cmp) { try { computed[k] = i3.proxy[k]; } catch (e) { computed[k] = '⚠ ' + e.message; } }
      return { kind: 'Vue 3', name: chain[0], file: i3.type.__file, chain, props: i3.props, state: i3.setupState, data: i3.data, computed, raw: i3 };
    }
    const vm = vue2(el);
    if (vm) {
      const chain = [];
      for (let c = vm; c; c = c.$parent) chain.push(c.$options.name || c.$options._componentTag || base(c.$options.__file) || 'Anonymous');
      const computed = {};
      if (vm.$options.computed) for (const k in vm.$options.computed) { try { computed[k] = vm[k]; } catch (e) { computed[k] = '⚠'; } }
      return { kind: 'Vue 2', name: chain[0], file: vm.$options.__file, chain, props: vm.$props, data: vm.$data, computed, raw: vm };
    }
    const sv = svelte(el);
    if (sv) {
      const loc = sv.meta.loc || {};
      const chain = [];
      for (let p = sv.meta; p; p = p.parent) { const l = p.loc || p; if (l && l.file) chain.push(base(l.file) + (p.type ? ' (' + p.type + ')' : '')); }
      const attrs = {};
      for (const a of sv.el.attributes) attrs[a.name] = a.value;
      return { kind: 'Svelte', name: base(loc.file) || sv.el.tagName.toLowerCase(), file: loc.file, line: loc.line, column: loc.column, chain: chain.length ? chain : [base(loc.file)], attrs, raw: sv.meta, svelte: true };
    }
    return null;
  }

  function safe(v, depth, seen) {
    seen = seen || new WeakSet();
    if (v === null || typeof v !== 'object') return typeof v === 'function' ? 'ƒ ' + (v.name || '') : v;
    if (v instanceof Node) return '<' + (v.nodeName || '').toLowerCase() + '>';
    if (seen.has(v)) return '[circular]';
    if (depth <= 0) return Array.isArray(v) ? `[Array(${v.length})]` : '{…}';
    seen.add(v);
    try {
      if (v.__v_isRef) return safe(v.value, depth, seen);
      if (Array.isArray(v)) return v.slice(0, 50).map(x => safe(x, depth - 1, seen));
      if (v instanceof Map) return Object.fromEntries([...v.entries()].slice(0, 50).map(([k, x]) => [String(k), safe(x, depth - 1, seen)]));
      if (v instanceof Set) return [...v].slice(0, 50).map(x => safe(x, depth - 1, seen));
      if (v instanceof Date) return v.toISOString();
      const o = {};
      let n = 0;
      for (const k of Object.keys(v)) { if (k.startsWith('__v_') || k.startsWith('_')) continue; if (n++ > 60) { o['…'] = '…'; break; } o[k] = safe(v[k], depth - 1, seen); }
      return o;
    } catch (e) { return '⚠ ' + e.message; }
  }

  function editorUrl(file, line, col) {
    if (!file || EDITOR === 'none') return null;
    if (!file.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(file)) return null;
    line = line || 1; col = col || 1;
    if (EDITOR === 'webstorm') return `webstorm://open?file=${encodeURIComponent(file)}&line=${line}&column=${col}`;
    return `${EDITOR}://file/${file.replace(/\\/g, '/')}:${line}:${col}`;
  }

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    .box{position:fixed;border:2px solid #42b883;background:rgba(66,184,131,.12);border-radius:3px;display:none}
    .tip{position:fixed;background:#1f2a24;color:#eef5f1;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;padding:6px 9px;border-radius:7px;display:none;max-width:420px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
    .tip b{color:#42b883}.tip .k{color:#ff7f50;font-size:10px;margin-left:6px}.tip .f{color:#b6c2bb;word-break:break-all}
    .pnl{position:fixed;top:10px;right:10px;bottom:10px;width:380px;background:#17201b;color:#e7efe9;font:12px/1.45 system-ui,sans-serif;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.4);display:none;flex-direction:column;pointer-events:auto;overflow:hidden}
    .ph{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#22302a}
    .ph b{flex:1;font-size:14px;color:#42b883;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    button{background:#2f4038;color:#e7efe9;border:0;border-radius:5px;padding:4px 8px;font:11px system-ui;cursor:pointer}button:hover{background:#3b5047}
    .pb{overflow:auto;padding:8px 10px;flex:1}
    h4{margin:10px 0 4px;font-size:11px;color:#8fa79a;text-transform:uppercase;letter-spacing:.04em}
    .mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;word-break:break-all}
    details{margin-left:12px}summary{cursor:pointer;margin-left:-12px}
    .kv{margin-left:12px}.key{color:#9cdcfe}.str{color:#ce9178}.num{color:#b5cea8}.bool{color:#569cd6}.nul{color:#808080}
    .muted{color:#8fa79a}
  </style><div class="box"></div><div class="tip"></div>
  <div class="pnl"><div class="ph"><b></b><button data-a="again"></button><button data-a="x">✕</button></div><div class="pb"></div></div>`;
  document.documentElement.appendChild(host);
  const $ = s => root.querySelector(s);
  const box = $('.box'), tip = $('.tip'), pnl = $('.pnl');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('[data-a=again]').textContent = S.again || 'Pick again';

  function tree(v, key) {
    const k = key !== undefined ? `<span class="key">${esc(key)}</span>: ` : '';
    if (v === null || v === undefined) return `<div class="kv mono">${k}<span class="nul">${v}</span></div>`;
    if (typeof v === 'string') return `<div class="kv mono">${k}<span class="str">"${esc(v.length > 300 ? v.slice(0, 300) + '…' : v)}"</span></div>`;
    if (typeof v === 'number') return `<div class="kv mono">${k}<span class="num">${v}</span></div>`;
    if (typeof v === 'boolean') return `<div class="kv mono">${k}<span class="bool">${v}</span></div>`;
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v);
    const label = Array.isArray(v) ? `Array(${v.length})` : `{${entries.length}}`;
    if (!entries.length) return `<div class="kv mono">${k}<span class="nul">${Array.isArray(v) ? '[]' : '{}'}</span></div>`;
    return `<details class="mono"${key === undefined ? ' open' : ''}><summary>${k}<span class="muted">${label}</span></summary>${entries.map(([kk, x]) => tree(x, kk)).join('')}</details>`;
  }
  function section(title, obj) {
    if (!obj || (typeof obj === 'object' && !Object.keys(obj).length)) return '';
    return `<h4>${esc(title)}</h4>${tree(safe(obj, 4))}`;
  }

  let cur = null, picking = true;
  function onMove(e) {
    if (!picking) return;
    const el = e.target;
    if (!el || el === host) return;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    cur = info(el);
    tip.innerHTML = cur ? `<b>&lt;${esc(cur.name)}&gt;</b><span class="k">${cur.kind}</span>${cur.file ? `<div class="f">${esc(cur.file)}${cur.line ? ':' + cur.line : ''}</div>` : ''}` : `<span class="f">${esc(S.none || 'Not a component')}</span>`;
    let x = e.clientX + 14, y = e.clientY + 16;
    tip.style.display = 'block';
    if (x + tip.offsetWidth > innerWidth) x = innerWidth - tip.offsetWidth - 6;
    if (y + tip.offsetHeight > innerHeight) y = e.clientY - tip.offsetHeight - 10;
    Object.assign(tip.style, { left: x + 'px', top: y + 'px' });
  }
  function open(c) {
    picking = false;
    tip.style.display = 'none';
    window.$vs = c.raw;
    $('.ph b').textContent = '<' + c.name + '> · ' + c.kind;
    const url = editorUrl(c.file, c.line, c.column);
    $('.pb').innerHTML =
      (c.file ? `<h4>${esc(S.file || 'File')}</h4><div class="mono">${esc(c.file)}${c.line ? ':' + c.line : ''}</div>` : '') +
      `<div style="display:flex;gap:6px;margin-top:6px"><button data-a="log">${esc(S.toConsole || 'Console')}</button>${url ? `<button data-a="open">${esc(S.open || 'Open')}</button>` : ''}</div>` +
      `<h4>${esc(S.chain || 'Chain')}</h4><div class="mono muted">${c.chain.slice(0, 12).reverse().map(esc).join(' › ')}</div>` +
      (c.svelte ? `<p class="muted">${esc(S.svelteNote || '')}</p>` + section(S.attrs || 'Attrs', c.attrs) :
        section(S.props || 'Props', c.props) + section(S.state || 'State', c.state) + section(S.data || 'Data', c.data) + section(S.computed || 'Computed', c.computed));
    pnl.style.display = 'flex';
    pnl.dataset.url = url || '';
  }
  function onClick(e) {
    if (!picking) return;
    if (e.composedPath().includes(host)) return;
    e.preventDefault(); e.stopPropagation();
    if (cur) open(cur);
  }
  const block = e => { if (picking && !e.composedPath().includes(host)) { e.preventDefault(); e.stopPropagation(); } };
  function onKey(e) { if (e.key === 'Escape') stop(); }
  root.addEventListener('click', e => {
    const a = e.target.dataset.a;
    if (a === 'x') stop();
    if (a === 'again') { pnl.style.display = 'none'; picking = true; }
    if (a === 'log') console.log('%c' + (cur && cur.name), 'color:#42b883;font-weight:bold', window.$vs);
    if (a === 'open' && pnl.dataset.url) { const l = document.createElement('a'); l.href = pnl.dataset.url; l.click(); }
  });
  function stop() {
    removeEventListener('mousemove', onMove, true);
    removeEventListener('click', onClick, true);
    removeEventListener('mousedown', block, true);
    removeEventListener('keydown', onKey, true);
    host.remove();
    window.__vsActive = false;
  }
  addEventListener('mousemove', onMove, true);
  addEventListener('click', onClick, true);
  addEventListener('mousedown', block, true);
  addEventListener('keydown', onKey, true);
})();
