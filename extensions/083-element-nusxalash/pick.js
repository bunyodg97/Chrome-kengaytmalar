(() => {
  if (window.__enPick) return; window.__enPick = true;
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;outline:2px solid #0d47a1;background:#0d47a11f;transition:all .05s';
  const lb = document.createElement('div'); lb.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;background:#0d47a1;color:#fff;font:600 11px ui-monospace,monospace;padding:2px 6px;border-radius:3px';
  const tip = document.createElement('div'); tip.textContent = 'Elementni bosing · ↑ ota element · ↓ ichki · Esc — bekor'; tip.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0d47a1;color:#fff;font:600 13px system-ui;padding:7px 12px;border-radius:8px;pointer-events:none';
  document.documentElement.append(ov, lb, tip); let cur = null, stack = [];
  const show = el => { cur = el; const r = el.getBoundingClientRect(); Object.assign(ov.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); lb.textContent = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} · ${Math.round(r.width)}×${Math.round(r.height)} · ${el.querySelectorAll('*').length + 1} element`; lb.style.left = r.left + 'px'; lb.style.top = Math.max(0, r.top - 20) + 'px'; };
  const mv = e => { if (e.target === ov || e.target === lb) return; stack = []; show(e.target); };
  const end = () => { removeEventListener('mousemove', mv, true); removeEventListener('click', ck, true); removeEventListener('keydown', kd, true); ov.remove(); lb.remove(); tip.remove(); window.__enPick = false; };
  const kd = e => { if (e.key === 'Escape') { e.preventDefault(); end(); } else if (e.key === 'ArrowUp' && cur?.parentElement && cur.parentElement !== document.documentElement) { e.preventDefault(); stack.push(cur); show(cur.parentElement); } else if (e.key === 'ArrowDown' && (stack.length || cur?.firstElementChild)) { e.preventDefault(); show(stack.pop() || cur.firstElementChild); } else if (e.key === 'Enter' && cur) { e.preventDefault(); go(); } };
  const ck = e => { e.preventDefault(); e.stopPropagation(); go(); };
  function go() { const el = cur; end(); if (el) chrome.runtime.sendMessage({ type: 'result', r: extract(el) }); }
  addEventListener('mousemove', mv, true); addEventListener('click', ck, true); addEventListener('keydown', kd, true);

  function extract(root) {
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-9999px;width:10px;height:10px'; document.documentElement.append(fr);
    const dd = fr.contentDocument; dd.open(); dd.write('<!DOCTYPE html><html><body></body></html>'); dd.close();
    const defCache = {}; const def = tag => { if (defCache[tag]) return defCache[tag]; const e = dd.createElement(tag); dd.body.append(e); const cs = fr.contentWindow.getComputedStyle(e), o = {}; for (const p of cs) o[p] = cs.getPropertyValue(p); e.remove(); return defCache[tag] = o; };
    const SKIP = /^(border-(start|end)-(start|end)-radius|row-rule|column-rule|-webkit-text-fill-color|outline-color|text-emphasis-color|-webkit-text-stroke-color|-webkit-(?!line-clamp|box-orient|text-fill|background-clip|mask)|transition|animation-|will-change|cursor$|pointer-events|user-select|caret|perspective-origin|transform-origin|inline-size|block-size|min-inline|min-block|max-inline|max-block|border-(block|inline)|margin-(block|inline)|padding-(block|inline)|inset-(block|inline)|overflow-(block|inline)|contain-intrinsic|text-decoration-color|text-emphasis|column-rule-color|outline-color|border-image|app-region|-webkit-locale|counter-|quotes|zoom|tab-size|font-palette|hyphenate|math-|ruby|speak|unicode-bidi|writing-mode|direction|x$|y$|r$|rx|ry|cx|cy|d$)/;
    const INH = /^(color|font|letter-spacing|line-height|text-(align|indent|transform|shadow)|white-space|word-spacing|visibility|list-style)/;
    const rules = [], seen = new Map(); let n = 0, total = 0;
    const abs = u => { try { return new URL(u, location.href).href; } catch { return u; } };
    function diff(el, cs, parentCs, pseudo) {
      const d = def(pseudo ? 'span' : el.tagName.toLowerCase()), out = [];
      for (const p of cs) { if (SKIP.test(p)) continue; let v = cs.getPropertyValue(p); if (!v) continue;
        if (INH.test(p) && parentCs && parentCs.getPropertyValue(p) === v) continue;
        if (!INH.test(p) && d[p] === v) continue; if (INH.test(p) && !parentCs && d[p] === v) continue;
        if (/url\(/.test(v)) v = v.replace(/url\("?([^")]+)"?\)/g, (m, u) => `url("${abs(u)}")`);
        if ((p === 'width' || p === 'height') && cs.display === 'inline') continue;
        if (/^border-(top|right|bottom|left)-color$/.test(p) && parseFloat(cs.getPropertyValue(p.replace('color', 'width'))) === 0) continue;
        if ((p === 'height' || (p === 'width' && el !== root)) && !pseudo && !/^(IMG|SVG|svg|VIDEO|CANVAS|INPUT|IFRAME|TEXTAREA|SELECT|HR)$/.test(el.tagName) && cs.position !== 'absolute') continue;
        out.push(`${p}: ${v}`); }
      if (pseudo) { const c = cs.getPropertyValue('content'); if (c && c !== 'none' && c !== 'normal') out.unshift(`content: ${c}`); else return null; }
      return out;
    }
    function cls(decls) { const k = decls.join(';'); if (seen.has(k)) return seen.get(k); const c = 'c' + (++n); seen.set(k, c); rules.push(`.${c} {\n  ${decls.join(';\n  ')};\n}`); return c; }
    function walk(src, parentCs) {
      if (++total > 2500) return null;
      if (src.nodeType === 3) return document.createTextNode(src.textContent);
      if (src.nodeType !== 1 || /^(SCRIPT|NOSCRIPT|STYLE|LINK|META|TEMPLATE)$/.test(src.tagName)) return null;
      const cs = getComputedStyle(src); if (cs.display === 'none') return null;
      const tag = src instanceof SVGElement ? src.tagName : src.tagName.toLowerCase();
      const out = src instanceof SVGElement ? document.createElementNS(src.namespaceURI, src.tagName) : document.createElement(/-/.test(tag) ? 'div' : tag);
      for (const a of src.attributes) { if (/^(class|style|id|on|data-|jsaction|jscontroller|jsname|aria-(?!label)|tabindex|srcset|sizes|loading|decoding|ping)/i.test(a.name) && !(src instanceof SVGElement && a.name === 'class')) continue; let v = a.value; if (/^(src|href|poster|action)$/.test(a.name)) v = abs(v); try { out.setAttribute(a.name, v); } catch {} }
      if (src.tagName === 'IMG' && src.currentSrc) out.setAttribute('src', src.currentSrc);
      if (src.tagName === 'INPUT' || src.tagName === 'TEXTAREA') out.setAttribute('value', src.value);
      if (!(src instanceof SVGElement) || src.tagName.toLowerCase() === 'svg') { const decls = diff(src, cs, parentCs); if (src === root) { decls.push(`box-sizing: ${cs.boxSizing}`); ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(p => { const i = decls.findIndex(x => x.startsWith(p + ':')); if (i >= 0) decls.splice(i, 1); }); }
        const c = decls.length ? cls(decls) : null; const cb = diff(src, getComputedStyle(src, '::before'), cs, true), ca = diff(src, getComputedStyle(src, '::after'), cs, true);
        let c2 = c; if (cb || ca) { if (!c2) c2 = 'p' + (++n); if (cb) rules.push(`.${c2}::before {\n  ${cb.join(';\n  ')};\n}`); if (ca) rules.push(`.${c2}::after {\n  ${ca.join(';\n  ')};\n}`); }
        if (c2) out.setAttribute('class', c2); }
      if (src.shadowRoot) for (const k of src.shadowRoot.childNodes) { const r = walk(k, cs); if (r) out.append(r); }
      for (const k of src.childNodes) { const r = walk(k, cs); if (r) out.append(r); }
      return out;
    }
    const html = walk(root, root.parentElement ? getComputedStyle(root.parentElement) : null)?.outerHTML || '';
    fr.remove();
    const pcs = root.parentElement ? getComputedStyle(root.parentElement) : null, r = root.getBoundingClientRect();
    const fonts = [...new Set([...document.styleSheets].flatMap(s => { try { return [...s.cssRules].filter(x => x.type === 5).map(x => x.cssText.replace(/url\("?([^")]+)"?\)/g, (m, u) => `url("${new URL(u, s.href || location.href).href}")`)); } catch { return []; } }))].slice(0, 20);
    return { html: pretty(html), css: rules.join('\n\n'), fonts: fonts.join('\n'), bg: pcs?.backgroundColor, w: Math.round(r.width), h: Math.round(r.height), url: location.href, nodes: total };
  }
  function pretty(h) { let ind = 0; return h.replace(/>\s*</g, '>\n<').split('\n').map(l => { if (/^<\/\w/.test(l)) ind = Math.max(0, ind - 1); const o = '  '.repeat(ind) + l; if (/^<\w[^>]*[^/]>$/.test(l) && !/^<(img|br|hr|input|meta|link|source|path|circle|rect|line|polyline|polygon|use)\b/i.test(l) && !/<\/\w+>$/.test(l)) ind++; return o; }).join('\n'); }
})();
