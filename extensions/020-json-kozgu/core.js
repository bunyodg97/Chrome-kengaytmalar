// JSON daraxt chizuvchi (kontent skript va muharrir sahifasi uchun umumiy)
var JK = (() => {
  const CSS = `
  .jk{--bg:#fff;--fg:#1d2330;--mut:#7a8496;--key:#8b2bb9;--str:#0b7a3e;--num:#1556c0;--bool:#c2410c;--null:#9b1c1c;--line:#e5e8ee;--hov:#f1f4f9;--acc:#1f5fd1;
    font:13px/1.55 ui-monospace,Consolas,Menlo,monospace;color:var(--fg);background:var(--bg);min-height:100vh}
  @media (prefers-color-scheme:dark){.jk{--bg:#12161d;--fg:#d6dbe4;--mut:#7d8798;--key:#d19af5;--str:#7ad19c;--num:#7fb0ff;--bool:#ffb07a;--null:#ff8f8f;--line:#262d39;--hov:#1b212b;--acc:#7aa7f5}}
  .jk .bar{position:sticky;top:0;z-index:2;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 12px;background:var(--bg);border-bottom:1px solid var(--line);font-family:system-ui,sans-serif}
  .jk .bar button{font:600 12.5px system-ui,sans-serif;border:1px solid var(--line);background:transparent;color:var(--fg);border-radius:7px;padding:5px 10px;cursor:pointer}
  .jk .bar button.on{border-color:var(--acc);color:var(--acc)}
  .jk .bar input{font:13px system-ui,sans-serif;border:1px solid var(--line);background:transparent;color:var(--fg);border-radius:7px;padding:5px 9px;width:220px}
  .jk .bar .path{font:12px ui-monospace,monospace;color:var(--mut);margin-left:auto;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .jk .tree{padding:10px 14px 60px}
  .jk .n{padding-left:18px;position:relative}
  .jk .n>.r{cursor:default;border-radius:4px;padding:0 4px;margin-left:-4px;white-space:pre-wrap;word-break:break-all}
  .jk .n>.r:hover{background:var(--hov)}
  .jk .tg{position:absolute;left:2px;top:1px;width:14px;text-align:center;color:var(--mut);cursor:pointer;user-select:none}
  .jk .k{color:var(--key)} .jk .s{color:var(--str)} .jk .num{color:var(--num)} .jk .b{color:var(--bool)} .jk .nl{color:var(--null)} .jk .m{color:var(--mut)}
  .jk .s a{color:inherit}
  .jk .hl{background:#ffe58a;color:#000;border-radius:2px}
  .jk .raw{padding:12px 16px;white-space:pre-wrap;word-break:break-all;margin:0}
  .jk .err{padding:12px 16px;color:var(--null);font-family:system-ui}
  `;
  function el(t, c, txt) { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; }
  function val(v) {
    if (v === null) return el('span', 'nl', 'null');
    if (typeof v === 'string') { const s = el('span', 's'); if (/^https?:\/\/\S+$/.test(v)) { const a = el('a', '', JSON.stringify(v)); a.href = v; a.target = '_blank'; s.appendChild(a); } else s.textContent = JSON.stringify(v); return s; }
    if (typeof v === 'number') return el('span', 'num', String(v));
    if (typeof v === 'boolean') return el('span', 'b', String(v));
    return el('span', 'm', String(v));
  }
  const keyPath = (p, k, arr) => arr ? `${p}[${k}]` : /^[A-Za-z_$][\w$]*$/.test(k) ? `${p}.${k}` : `${p}[${JSON.stringify(k)}]`;
  function node(k, v, path, depth, isArrItem, onPath, openDepth) {
    const n = el('div', 'n'), r = el('div', 'r'); n.appendChild(r); n.dataset.path = path;
    if (k !== null) { r.appendChild(el('span', 'k', isArrItem ? k : JSON.stringify(k))); r.appendChild(el('span', 'm', ': ')); }
    r.onclick = e => { if (e.target.tagName !== 'A') onPath(path); };
    if (v && typeof v === 'object') {
      const arr = Array.isArray(v), keys = arr ? v.map((_, i) => i) : Object.keys(v);
      const tg = el('span', 'tg', '▸'); n.appendChild(tg);
      r.appendChild(el('span', 'm', arr ? '[' : '{'));
      const sum = el('span', 'm', ` ${keys.length} ${arr ? 'element' : 'kalit'} ${arr ? ']' : '}'}`); r.appendChild(sum);
      const kids = el('div'); kids.hidden = true; n.appendChild(kids);
      const close = el('div', 'm', arr ? ']' : '}'); close.hidden = true; close.style.paddingLeft = '4px'; n.appendChild(close);
      let built = false;
      n.toggle = (open) => {
        open = open ?? kids.hidden;
        if (open && !built) { built = true; const frag = document.createDocumentFragment(); keys.forEach(kk => frag.appendChild(node(kk, v[kk], keyPath(path, kk, arr), depth + 1, arr, onPath, openDepth))); kids.appendChild(frag); }
        kids.hidden = !open; close.hidden = !open; sum.hidden = open; tg.textContent = open ? '▾' : '▸';
      };
      tg.onclick = e => { e.stopPropagation(); n.toggle(); };
      if (depth < openDepth && keys.length < 400) n.toggle(true);
    } else r.appendChild(val(v));
    return n;
  }
  function mount(container, data, rawText, opts = {}) {
    const root = el('div', 'jk'); const st = el('style', '', CSS);
    container.appendChild(st); container.appendChild(root);
    const bar = el('div', 'bar'), tree = el('div', 'tree'), raw = el('pre', 'raw');
    root.append(bar, tree, raw); raw.hidden = true;
    const mk = (t, f) => { const b = el('button', '', t); b.onclick = f; bar.appendChild(b); return b; };
    const pathEl = el('span', 'path', '$');
    const onPath = p => { pathEl.textContent = p; navigator.clipboard?.writeText(p).catch(() => {}); pathEl.title = 'Nusxalandi: ' + p; };
    let pretty = true;
    const bt = mk('Daraxt', () => { tree.hidden = false; raw.hidden = true; bt.classList.add('on'); br.classList.remove('on'); });
    const br = mk('Xom', () => { tree.hidden = true; raw.hidden = false; br.classList.add('on'); bt.classList.remove('on'); });
    bt.classList.add('on');
    mk('Hammasini ochish', () => { const go = n => { if (n.toggle) { n.toggle(true); [...n.children[2].children].forEach(go); } }; [...tree.children].forEach(go); });
    mk('Yig\'ish', () => tree.querySelectorAll('.n').forEach(n => n.toggle && n.toggle(false)));
    mk('Nusxalash', () => navigator.clipboard?.writeText(JSON.stringify(data, null, 2)));
    const bf = mk('Siqish', () => { pretty = !pretty; raw.textContent = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data); bf.textContent = pretty ? 'Siqish' : 'Formatlash'; br.click(); });
    mk('Yuklab olish', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = (opts.name || 'data') + '.json'; a.click(); });
    const q = el('input'); q.placeholder = 'Kalit yoki qiymat bo\'yicha qidirish'; bar.appendChild(q); bar.appendChild(pathEl);
    raw.textContent = JSON.stringify(data, null, 2);
    tree.appendChild(node(null, data, '$', 0, false, onPath, opts.openDepth ?? 2));
    let qt;
    q.oninput = () => { clearTimeout(qt); qt = setTimeout(() => search(q.value.trim().toLowerCase()), 250); };
    function search(s) {
      tree.querySelectorAll('.hl').forEach(h => h.classList.remove('hl'));
      if (!s) return;
      const hits = [];
      (function walk(v, p) { if (v && typeof v === 'object') { for (const k of Object.keys(v)) { const pp = keyPath(p, Array.isArray(v) ? k : k, Array.isArray(v)); if (String(k).toLowerCase().includes(s) || (typeof v[k] !== 'object' && String(v[k]).toLowerCase().includes(s))) hits.push(pp); walk(v[k], pp); if (hits.length > 300) return; } } })(data, '$');
      hits.forEach(p => {
        // yo'l bo'ylab ochib boramiz
        let cur = tree.firstChild; const parts = p.match(/(\.[^.[\]]+|\[[^\]]+\])/g) || [];
        for (const part of parts) { if (cur.toggle) cur.toggle(true); const target = [...cur.children[2].children].find(c => c.dataset.path.endsWith(part) && c.dataset.path.length === cur.dataset.path.length + part.length); if (!target) return; cur = target; }
        cur.firstChild.classList.add('hl');
      });
      tree.querySelector('.hl')?.scrollIntoView({ block: 'center' });
    }
    return root;
  }
  return { mount };
})();
