(() => {
  if (window.__ruler) { window.__ruler(); return; }
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>*{box-sizing:border-box}.b{position:fixed;pointer-events:none}.hov{outline:1px solid #f4511e;background:#f4511e14}.sel{outline:2px solid #1e88e5;background:#1e88e514}.pad{background:#81c78466}.mar{background:#ffb74d55}
  .lbl{position:fixed;background:#f4511e;color:#fff;font:600 11px ui-monospace,monospace;padding:2px 5px;border-radius:3px;white-space:nowrap;pointer-events:none}.lbl.d{background:#d81b60}.lbl.s{background:#1e88e5}
  .ln{position:fixed;background:#d81b60;pointer-events:none}.gd{position:fixed;pointer-events:none;border:0 dashed #d81b6088}
  .hud{position:fixed;bottom:10px;right:10px;background:#1e1f24ee;color:#ddd;font:12px system-ui;padding:8px 10px;border-radius:8px;pointer-events:auto;max-width:300px;line-height:1.5}.hud b{color:#fff}.hud kbd{background:#444;border-radius:3px;padding:0 4px;font-size:11px}
  .cap{position:fixed;inset:0;pointer-events:auto;cursor:crosshair;background:transparent}</style>
  <div class="cap"></div><div id="g"></div><div class="hud" id="hud"></div><button id="__ab" title="Sozlamalar va til" style="position:fixed;top:10px;right:10px;pointer-events:auto;cursor:pointer;border:0;border-radius:8px;background:#1e1f24ee;color:#fff;font:15px system-ui;padding:6px 9px">⚙</button>`;
  document.documentElement.append(host);
  sh.getElementById('__ab').onclick = () => chrome.runtime.sendMessage({ type: '__ab_open' }); const G = sh.getElementById('g'), cap = sh.querySelector('.cap'), hud = sh.getElementById('hud');
  let hov = null, sel = null, drag = null, mode = 'el', mx = 0, my = 0;
  const box = (r, cls) => `<div class="b ${cls}" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"></div>`;
  const lbl = (x, y, t, c = '') => `<div class="lbl ${c}" style="left:${x}px;top:${y}px">${t}</div>`;
  const ln = (x1, y1, x2, y2) => x1 === x2 ? `<div class="ln" style="left:${x1}px;top:${Math.min(y1, y2)}px;width:1px;height:${Math.abs(y2 - y1)}px"></div>` : `<div class="ln" style="left:${Math.min(x1, x2)}px;top:${y1}px;height:1px;width:${Math.abs(x2 - x1)}px"></div>`;
  const R = n => Math.round(n * 10) / 10;
  function under(x, y) { cap.style.pointerEvents = 'none'; host.style.display = 'none'; const e = document.elementFromPoint(x, y); host.style.display = ''; cap.style.pointerEvents = 'auto'; return e; }
  function spacing(el, r) { const cs = getComputedStyle(el), n = p => parseFloat(cs[p]) || 0; let h = '';
    const pt = n('paddingTop'), pb = n('paddingBottom'), pl = n('paddingLeft'), pr = n('paddingRight'), bt = n('borderTopWidth'), bl = n('borderLeftWidth'), br = n('borderRightWidth'), bb = n('borderBottomWidth');
    const mt = n('marginTop'), mb = n('marginBottom'), ml = n('marginLeft'), mr = n('marginRight');
    if (pt) h += box({ left: r.left + bl, top: r.top + bt, width: r.width - bl - br, height: pt }, 'pad'); if (pb) h += box({ left: r.left + bl, top: r.bottom - bb - pb, width: r.width - bl - br, height: pb }, 'pad');
    if (pl) h += box({ left: r.left + bl, top: r.top + bt + pt, width: pl, height: r.height - bt - bb - pt - pb }, 'pad'); if (pr) h += box({ left: r.right - br - pr, top: r.top + bt + pt, width: pr, height: r.height - bt - bb - pt - pb }, 'pad');
    if (mt > 0) h += box({ left: r.left, top: r.top - mt, width: r.width, height: mt }, 'mar'); if (mb > 0) h += box({ left: r.left, top: r.bottom, width: r.width, height: mb }, 'mar');
    if (ml > 0) h += box({ left: r.left - ml, top: r.top, width: ml, height: r.height }, 'mar'); if (mr > 0) h += box({ left: r.right, top: r.top, width: mr, height: r.height }, 'mar');
    return { h, info: `padding: <b>${[pt, pr, pb, pl].map(R).join(' ')}</b><br>margin: <b>${[mt, mr, mb, ml].map(R).join(' ')}</b><br>font: <b>${cs.fontSize} / ${cs.lineHeight}</b> ${cs.fontWeight}<br>rang: <b>${cs.color}</b>` };
  }
  function dist(a, b) { // a — tanlangan, b — kursor ostidagi
    let h = '';
    const inside = b.left <= a.left && b.right >= a.right && b.top <= a.top && b.bottom >= a.bottom, contains = a.left <= b.left && a.right >= b.right && a.top <= b.top && a.bottom >= b.bottom;
    if (inside || contains) { const o = inside ? b : a, i = inside ? a : b, cy = i.top + i.height / 2, cx = i.left + i.width / 2;
      [[o.left, i.left, cy, 'h'], [i.right, o.right, cy, 'h'], [o.top, i.top, cx, 'v'], [i.bottom, o.bottom, cx, 'v']].forEach(([p1, p2, c, d]) => { if (p2 - p1 < .5) return; h += d === 'h' ? ln(p1, c, p2, c) + lbl((p1 + p2) / 2 - 12, c + 3, R(p2 - p1), 'd') : ln(c, p1, c, p2) + lbl(c + 4, (p1 + p2) / 2 - 8, R(p2 - p1), 'd'); });
      return h; }
    const cy = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2, cx = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
    const ovY = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top), ovX = Math.min(a.right, b.right) > Math.max(a.left, b.left);
    if (b.left >= a.right) { const y = ovY ? cy : a.top + a.height / 2; h += ln(a.right, y, b.left, y) + lbl((a.right + b.left) / 2 - 12, y + 3, R(b.left - a.right), 'd'); if (!ovY) h += `<div class="gd" style="left:${b.left}px;top:${Math.min(y, b.top)}px;height:${Math.abs(y - (y < b.top ? b.top : b.bottom))}px;border-left-width:1px"></div>`; }
    if (a.left >= b.right) { const y = ovY ? cy : a.top + a.height / 2; h += ln(b.right, y, a.left, y) + lbl((b.right + a.left) / 2 - 12, y + 3, R(a.left - b.right), 'd'); }
    if (b.top >= a.bottom) { const x = ovX ? cx : a.left + a.width / 2; h += ln(x, a.bottom, x, b.top) + lbl(x + 4, (a.bottom + b.top) / 2 - 8, R(b.top - a.bottom), 'd'); }
    if (a.top >= b.bottom) { const x = ovX ? cx : a.left + a.width / 2; h += ln(x, b.bottom, x, a.top) + lbl(x + 4, (b.bottom + a.top) / 2 - 8, R(a.top - b.bottom), 'd'); }
    return h;
  }
  function draw() {
    let h = '', info = '';
    if (mode === 'free' && drag) { const w = mx - drag.x, ht = my - drag.y; h += `<div class="b sel" style="left:${Math.min(drag.x, mx)}px;top:${Math.min(drag.y, my)}px;width:${Math.abs(w)}px;height:${Math.abs(ht)}px"></div>` + lbl(mx + 10, my + 10, `${Math.abs(w)} × ${Math.abs(ht)} · ${R(Math.hypot(w, ht))}`, 's'); }
    else if (mode === 'free') { h += `<div class="ln" style="left:0;top:${my}px;width:100vw;height:1px;opacity:.5"></div><div class="ln" style="left:${mx}px;top:0;height:100vh;width:1px;opacity:.5"></div>` + lbl(mx + 8, my + 8, `${mx}, ${my}`, 's'); }
    const sr = sel?.isConnected ? sel.getBoundingClientRect() : null;
    if (sr) h += box(sr, 'sel') + lbl(sr.left, Math.max(0, sr.top - 18), `${R(sr.width)} × ${R(sr.height)}`, 's');
    if (mode === 'el' && hov) { const r = hov.getBoundingClientRect();
      if (hov !== sel) { const sp = spacing(hov, r); h += sp.h + box(r, 'hov') + lbl(r.left, r.bottom + 3 > innerHeight - 20 ? r.top - 18 : r.bottom + 3, `${hov.tagName.toLowerCase()}${hov.id ? '#' + hov.id : ''}${typeof hov.className === 'string' && hov.className.trim() ? '.' + hov.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} · ${R(r.width)} × ${R(r.height)}`); info = sp.info; }
      if (sr && hov !== sel) h += dist(sr, r); }
    G.innerHTML = h;
    hud.innerHTML = `<b>${mode === 'el' ? 'Element rejimi' : 'Erkin chizg\'ich'}</b><br>${info ? info + '<br>' : ''}<kbd>Klik</kbd> elementni tanlash · keyin boshqasiga olib boring — masofa<br><kbd>R</kbd> erkin chizg'ich · <kbd>↑</kbd> ota element · <kbd>Esc</kbd> chiqish`;
  }
  cap.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; if (mode === 'el') { const el = under(mx, my); if (el && el !== document.documentElement) hov = el; } requestAnimationFrame(draw); });
  cap.addEventListener('mousedown', e => { e.preventDefault(); if (mode === 'free') drag = { x: e.clientX, y: e.clientY }; else { sel = hov === sel ? null : hov; draw(); } });
  cap.addEventListener('mouseup', () => { if (mode === 'free' && drag) { drag = null; draw(); } });
  cap.addEventListener('wheel', e => { cap.style.pointerEvents = 'none'; setTimeout(() => cap.style.pointerEvents = 'auto', 150); }, { passive: true });
  const kd = e => { const k = e.key;
    if (k === 'Escape') { if (sel) { sel = null; draw(); } else close(); }
    else if (k === 'r' || k === 'R') { mode = mode === 'el' ? 'free' : 'el'; draw(); }
    else if (k === 'ArrowUp' && hov?.parentElement && hov.parentElement !== document.documentElement) { hov = hov.parentElement; draw(); }
    else return; e.preventDefault(); e.stopPropagation(); };
  addEventListener('keydown', kd, true); const sc = () => requestAnimationFrame(draw); addEventListener('scroll', sc, true);
  function close() { removeEventListener('keydown', kd, true); removeEventListener('scroll', sc, true); host.remove(); window.__ruler = null; }
  window.__ruler = close; draw();
})();
