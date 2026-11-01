(() => {
  if (window.__chz) { window.__chz.toggle(); return; }
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;z-index:2147483646;';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>
  canvas{position:fixed;inset:0;cursor:crosshair;touch-action:none}
  .bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;background:#1e1f24;color:#fff;padding:6px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.35);font:13px system-ui;user-select:none;cursor:move}
  .bar button{all:unset;cursor:pointer;min-width:30px;height:30px;display:grid;place-items:center;border-radius:8px;font-size:15px}
  .bar button:hover{background:#33353d}.bar button.on{background:#d81b60}
  .c{width:20px;height:20px;border-radius:50%;border:2px solid #fff3;cursor:pointer}.c.on{border-color:#fff}
  .sep{width:1px;height:22px;background:#444;margin:0 3px}
  input[type=range]{width:70px}
  .ti{position:fixed;font:600 20px system-ui;background:transparent;border:1px dashed #888;outline:none;min-width:40px;padding:2px}
  .hint{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#1e1f24cc;color:#ddd;font:12px system-ui;padding:5px 10px;border-radius:8px}
  </style><canvas></canvas>
  <div class="bar"><button data-t="pen" class="on" title="Qalam (P)">✎</button><button data-t="mark" title="Marker (M)">▬</button><button data-t="line" title="Chiziq (L)">／</button><button data-t="arrow" title="Strelka (A)">➚</button><button data-t="rect" title="To'rtburchak (R)">▭</button><button data-t="ell" title="Aylana (O)">◯</button><button data-t="text" title="Matn (T)">T</button><button data-t="erase" title="O'chirg'ich (E)">⌫</button><button data-t="spot" title="Diqqat nuqtasi (S)">◎</button>
  <span class="sep"></span><span id="cols" style="display:flex;gap:4px"></span><input type="range" id="w" min="1" max="30" value="4" title="Qalinlik">
  <span class="sep"></span><button id="undo" title="Orqaga (Ctrl+Z)">↶</button><button id="redo" title="Oldinga (Ctrl+Y)">↷</button><button id="clr" title="Tozalash">🗑</button><button id="hide" title="Ko'rinmas qilish / sahifa bilan ishlash (H)">👁</button><button id="save" title="PNG saqlash">💾</button><button id="__ab" title="Sozlamalar va til">⚙</button><button id="x" title="Yopish (Esc)">✕</button></div>
  <div class="hint">Esc — yopish · H — sahifani bosish rejimi · Ctrl+Z — orqaga</div>`;
  document.documentElement.append(host);
  const cv = sh.querySelector('canvas'), cx = cv.getContext('2d'), bar = sh.querySelector('.bar');
  const COLS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#000000', '#ffffff'];
  let tool = 'pen', col = COLS[0], wd = 4, shapes = [], redo = [], cur = null, hidden = false;
  const dpr = devicePixelRatio;
  function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; paint(); }
  const cs = sh.getElementById('cols');
  COLS.forEach((c, i) => { const d = document.createElement('span'); d.className = 'c' + (i ? '' : ' on'); d.style.background = c; d.onclick = () => { col = c; cs.querySelectorAll('.c').forEach(x => x.classList.toggle('on', x === d)); }; cs.append(d); });
  sh.getElementById('w').oninput = e => wd = +e.target.value;
  function setTool(t) { tool = t; bar.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t)); cv.style.cursor = t === 'text' ? 'text' : 'crosshair'; }
  bar.querySelectorAll('[data-t]').forEach(b => b.onclick = () => setTool(b.dataset.t));
  function arrowHead(a, b, w) { const ang = Math.atan2(b.y - a.y, b.x - a.x), l = 10 + w * 3; cx.beginPath(); cx.moveTo(b.x, b.y); cx.lineTo(b.x - l * Math.cos(ang - .45), b.y - l * Math.sin(ang - .45)); cx.lineTo(b.x - l * Math.cos(ang + .45), b.y - l * Math.sin(ang + .45)); cx.closePath(); cx.fill(); }
  function drawShape(s) {
    cx.save(); cx.strokeStyle = cx.fillStyle = s.c; cx.lineWidth = s.w; cx.lineCap = cx.lineJoin = 'round';
    const sx = window.scrollX - s.sx, sy = window.scrollY - s.sy; cx.translate(-sx, -sy);
    if (s.t === 'pen' || s.t === 'mark' || s.t === 'erase') {
      if (s.t === 'mark') { cx.globalAlpha = .35; cx.lineWidth = s.w * 4; cx.lineCap = 'butt'; }
      if (s.t === 'erase') { cx.globalCompositeOperation = 'destination-out'; cx.lineWidth = s.w * 5; }
      cx.beginPath(); s.p.forEach((q, i) => i ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y)); cx.stroke();
    } else if (s.t === 'line' || s.t === 'arrow') { cx.beginPath(); cx.moveTo(s.a.x, s.a.y); cx.lineTo(s.b.x, s.b.y); cx.stroke(); if (s.t === 'arrow') arrowHead(s.a, s.b, s.w); }
    else if (s.t === 'rect') cx.strokeRect(s.a.x, s.a.y, s.b.x - s.a.x, s.b.y - s.a.y);
    else if (s.t === 'ell') { cx.beginPath(); cx.ellipse((s.a.x + s.b.x) / 2, (s.a.y + s.b.y) / 2, Math.abs(s.b.x - s.a.x) / 2, Math.abs(s.b.y - s.a.y) / 2, 0, 0, 7); cx.stroke(); }
    else if (s.t === 'text') { cx.font = `600 ${12 + s.w * 3}px system-ui`; cx.textBaseline = 'top'; s.txt.split('\n').forEach((l, i) => cx.fillText(l, s.a.x, s.a.y + i * (14 + s.w * 3.4))); }
    cx.restore();
  }
  function paint() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    const spots = [...shapes, cur].filter(s => s && s.t === 'spot');
    if (spots.length) { cx.save(); cx.fillStyle = 'rgba(0,0,0,.55)'; cx.fillRect(0, 0, innerWidth, innerHeight); cx.globalCompositeOperation = 'destination-out';
      spots.forEach(s => { const sx = scrollX - s.sx, sy = scrollY - s.sy; cx.beginPath(); cx.ellipse((s.a.x + s.b.x) / 2 - sx, (s.a.y + s.b.y) / 2 - sy, Math.abs(s.b.x - s.a.x) / 2 + 1, Math.abs(s.b.y - s.a.y) / 2 + 1, 0, 0, 7); cx.fill(); }); cx.restore(); }
    // o'chirg'ich faqat chizmalarga ta'sir qilsin — alohida qatlamda emas, ketma-ket
    [...shapes, cur].forEach(s => s && s.t !== 'spot' && drawShape(s));
  }
  const P = e => ({ x: e.clientX, y: e.clientY });
  cv.onpointerdown = e => {
    if (e.button) return; const p = P(e);
    if (tool === 'text') { addText(p); return; }
    cv.setPointerCapture(e.pointerId);
    cur = { t: tool, c: col, w: wd, sx: scrollX, sy: scrollY, ...(['pen', 'mark', 'erase'].includes(tool) ? { p: [p] } : { a: p, b: p }) };
  };
  cv.onpointermove = e => { if (!cur) return; const p = P(e); if (cur.p) cur.p.push(p); else { cur.b = p; if (e.shiftKey && (cur.t === 'rect' || cur.t === 'ell')) { const d = Math.max(Math.abs(p.x - cur.a.x), Math.abs(p.y - cur.a.y)); cur.b = { x: cur.a.x + Math.sign(p.x - cur.a.x) * d, y: cur.a.y + Math.sign(p.y - cur.a.y) * d }; } } paint(); };
  cv.onpointerup = () => { if (!cur) return; shapes.push(cur); redo = []; cur = null; paint(); };
  function addText(p) {
    const ta = document.createElement('textarea'); ta.className = 'ti'; ta.rows = 1; Object.assign(ta.style, { left: p.x + 'px', top: p.y + 'px', color: col, font: `600 ${12 + wd * 3}px system-ui` });
    sh.append(ta); setTimeout(() => ta.focus());
    const done = () => { if (ta.value.trim()) { shapes.push({ t: 'text', c: col, w: wd, sx: scrollX, sy: scrollY, a: p, txt: ta.value }); redo = []; } ta.remove(); paint(); };
    ta.onblur = done; ta.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ta.blur(); } if (e.key === 'Escape') { ta.value = ''; ta.blur(); } };
  }
  const undo = () => { if (shapes.length) { redo.push(shapes.pop()); paint(); } }, redoF = () => { if (redo.length) { shapes.push(redo.pop()); paint(); } };
  sh.getElementById('undo').onclick = undo; sh.getElementById('__ab').onclick = () => chrome.runtime.sendMessage({ type: '__ab_open' }); sh.getElementById('redo').onclick = redoF;
  sh.getElementById('clr').onclick = () => { if (shapes.length) { redo = shapes.reverse(); shapes = []; paint(); } };
  function setHidden(h) { hidden = h; cv.style.pointerEvents = h ? 'none' : ''; host.style.pointerEvents = h ? 'none' : ''; bar.style.pointerEvents = 'auto'; sh.getElementById('hide').classList.toggle('on', h); }
  sh.getElementById('hide').onclick = () => setHidden(!hidden);
  sh.getElementById('save').onclick = async () => {
    bar.style.visibility = 'hidden'; sh.querySelector('.hint').style.visibility = 'hidden';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const url = await chrome.runtime.sendMessage({ type: 'shot' });
    bar.style.visibility = ''; sh.querySelector('.hint').style.visibility = '';
    if (url) chrome.runtime.sendMessage({ type: 'save', url });
  };
  function close() { host.remove(); removeEventListener('keydown', kd, true); removeEventListener('scroll', paint); removeEventListener('resize', size); window.__chz = null; }
  sh.getElementById('x').onclick = close;
  const kd = e => {
    if (e.target !== document.body && e.target !== document.documentElement && e.target !== host) { if (e.key !== 'Escape') return; }
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redoF() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redoF(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const map = { p: 'pen', m: 'mark', l: 'line', a: 'arrow', r: 'rect', o: 'ell', t: 'text', e: 'erase', s: 'spot' };
    if (map[k]) { setTool(map[k]); e.preventDefault(); } else if (k === 'h') setHidden(!hidden);
  };
  addEventListener('keydown', kd, true); addEventListener('scroll', paint, { passive: true }); addEventListener('resize', size);
  // panelni sudrash
  let dg = null; bar.onpointerdown = e => { if (e.target !== bar) return; const r = bar.getBoundingClientRect(); dg = { dx: e.clientX - r.left, dy: e.clientY - r.top }; bar.setPointerCapture(e.pointerId); };
  bar.onpointermove = e => { if (!dg) return; Object.assign(bar.style, { left: e.clientX - dg.dx + 'px', top: e.clientY - dg.dy + 'px', transform: 'none' }); };
  bar.onpointerup = () => dg = null;
  size();
  window.__chz = { toggle: () => setHidden(!hidden) };
})();
