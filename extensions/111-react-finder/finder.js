// MAIN world: React fiber orqali komponent va manba faylini topish.
(function () {
  if (window.__rfActive) return;
  window.__rfActive = true;
  const S = window.__RF_STR || {};
  const EDITOR = window.__RF_EDITOR || 'vscode';

  function fiberOf(el) {
    while (el && el !== document) {
      for (const k in el) if (k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')) return el[k];
      el = el.parentNode;
    }
    return null;
  }
  function nameOf(type) {
    if (!type) return null;
    if (typeof type === 'string') return null;
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;
    if (type.render) return type.render.displayName || type.render.name || 'ForwardRef';
    if (type.type) return nameOf(type.type);
    return null;
  }
  const COMP_TAGS = new Set([0, 1, 2, 11, 14, 15]);
  function sourceOf(f) {
    if (f._debugSource) return f._debugSource;
    // React 19: _debugStack (Error) — JSX yaratilgan joy
    const st = f._debugStack && f._debugStack.stack;
    if (st) {
      const lines = st.split('\n').slice(1);
      for (const l of lines) {
        if (/node_modules|react-dom|react\.development|jsx-dev-runtime|chunk-|\breact_jsx/i.test(l)) continue;
        const m = l.match(/\(?((?:https?|file|webpack[-\w]*):\/\/[^)\s]+?):(\d+):(\d+)\)?\s*$/);
        if (m) {
          let file = m[1].replace(/^https?:\/\/[^/]+\/?/, '').replace(/^webpack[-\w]*:\/\/[^/]*\//, '').replace(/\?.*$/, '').replace(/^@fs\//, '/');
          return { fileName: file, lineNumber: +m[2], columnNumber: +m[3], approx: true };
        }
      }
    }
    return null;
  }
  function chain(fiber) {
    const out = [];
    let f = fiber;
    while (f) {
      if (COMP_TAGS.has(f.tag)) {
        const n = nameOf(f.type) || nameOf(f.elementType);
        if (n) out.push({ name: n, fiber: f });
      }
      f = f.return;
    }
    return out;
  }
  function editorUrl(src) {
    if (!src || !src.fileName || EDITOR === 'none') return null;
    const p = src.fileName, l = src.lineNumber || 1, c = src.columnNumber || 1;
    if (!p.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(p)) return null;
    if (EDITOR === 'webstorm') return `webstorm://open?file=${encodeURIComponent(p)}&line=${l}&column=${c}`;
    return `${EDITOR}://file/${p.replace(/\\/g, '/')}:${l}:${c}`;
  }

  // UI
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    .box{position:fixed;border:2px solid #149eca;background:rgba(20,158,202,.12);border-radius:3px;transition:all .04s}
    .tip{position:fixed;max-width:460px;background:#20232a;color:#f1f3f5;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;padding:7px 9px;border-radius:7px;box-shadow:0 6px 20px rgba(0,0,0,.35)}
    .n{color:#61dafb;font-weight:700;font-size:13px}.s{color:#c3c7ce;word-break:break-all}.c{color:#9aa0ac;margin-top:3px}.h{color:#777;margin-top:4px;font-family:system-ui,sans-serif;font-size:11px}
    .toast{position:fixed;left:50%;top:14px;transform:translateX(-50%);background:#149eca;color:#fff;padding:6px 12px;border-radius:6px;font:12px system-ui,sans-serif;display:none}
  </style><div class="box"></div><div class="tip"></div><div class="toast"></div>`;
  document.documentElement.appendChild(host);
  const box = root.querySelector('.box'), tip = root.querySelector('.tip'), toast = root.querySelector('.toast');
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let cur = null;

  function show(el, x, y) {
    const r = el.getBoundingClientRect();
    Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', display: 'block' });
    const fb = fiberOf(el);
    const ch = fb ? chain(fb) : [];
    cur = { el, ch };
    if (!ch.length) tip.innerHTML = `<div class="s">&lt;${el.tagName.toLowerCase()}&gt; — ${esc(S.noReact || 'not React')}</div>`;
    else {
      const top = ch[0];
      const src = sourceOf(top.fiber);
      tip.innerHTML = `<div class="n">&lt;${esc(top.name)} /&gt;</div>` +
        (src ? `<div class="s">${esc(src.fileName)}:${src.lineNumber}${src.approx ? ' ~' : ''}</div>` : '') +
        `<div class="c">${ch.slice(0, 8).reverse().map(c => esc(c.name)).join(' › ')}</div>` +
        `<div class="h">click: ${esc(S.props || 'props → $rf')} · ${esc(S.esc || 'Esc')}</div>`;
    }
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let tx = x + 14, ty = y + 16;
    if (tx + tw > innerWidth - 8) tx = innerWidth - tw - 8;
    if (ty + th > innerHeight - 8) ty = y - th - 12;
    Object.assign(tip.style, { left: Math.max(4, tx) + 'px', top: Math.max(4, ty) + 'px', display: 'block' });
  }
  function flash(msg) { toast.textContent = msg; toast.style.display = 'block'; setTimeout(() => { toast.style.display = 'none'; }, 1600); }

  const onMove = e => { const el = e.target; if (el && el !== host) show(el, e.clientX, e.clientY); };
  const onClick = e => {
    e.preventDefault(); e.stopPropagation();
    if (!cur || !cur.ch.length) return;
    const top = cur.ch[0];
    const f = top.fiber;
    const src = sourceOf(f);
    window.$rf = { name: top.name, props: f.memoizedProps, state: f.memoizedState, fiber: f, element: cur.el, source: src };
    console.log('%c⚛ ' + top.name, 'color:#149eca;font-weight:bold', window.$rf);
    if (src) {
      const text = `${src.fileName}:${src.lineNumber}${src.columnNumber ? ':' + src.columnNumber : ''}`;
      navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {});
      flash((S.copied || 'Copied') + ': ' + text);
      const url = editorUrl(src);
      if (url && e.altKey === false) { const a = document.createElement('a'); a.href = url; a.click(); }
    } else flash(top.name + ' → $rf');
    stop();
  };
  const block = e => { e.preventDefault(); e.stopPropagation(); };
  const onKey = e => { if (e.key === 'Escape') stop(); };
  function stop() {
    removeEventListener('mousemove', onMove, true);
    removeEventListener('click', onClick, true);
    removeEventListener('mousedown', block, true);
    removeEventListener('mouseup', block, true);
    removeEventListener('keydown', onKey, true);
    box.style.display = 'none'; tip.style.display = 'none';
    setTimeout(() => host.remove(), 1700);
    window.__rfActive = false;
  }
  addEventListener('mousemove', onMove, true);
  addEventListener('click', onClick, true);
  addEventListener('mousedown', block, true);
  addEventListener('mouseup', block, true);
  addEventListener('keydown', onKey, true);
})();
