(() => {
  if (window.__ekranRegion) return; window.__ekranRegion = true;
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .layer{position:fixed;inset:0;cursor:crosshair}
    .rec .layer{pointer-events:none;cursor:default}
    .box{position:fixed;outline:2px dashed #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45),0 0 0 3px rgba(211,47,47,.9);cursor:move}
    .rec .box{outline:0;box-shadow:0 0 0 3px #d32f2f;pointer-events:none;border-radius:0}
    .rec .box{box-shadow:none}
    .frame{position:fixed;border:3px solid #d32f2f;pointer-events:none;display:none}
    .rec .frame{display:block}.paused .frame{border-color:#f9a825}
    .h{position:absolute;width:14px;height:14px;background:#fff;border:2px solid #d32f2f;border-radius:3px}
    .rec .h{display:none}
    .h[data-h=nw]{left:-7px;top:-7px;cursor:nwse-resize}.h[data-h=n]{left:calc(50% - 7px);top:-7px;cursor:ns-resize}.h[data-h=ne]{right:-7px;top:-7px;cursor:nesw-resize}
    .h[data-h=e]{right:-7px;top:calc(50% - 7px);cursor:ew-resize}.h[data-h=se]{right:-7px;bottom:-7px;cursor:nwse-resize}.h[data-h=s]{left:calc(50% - 7px);bottom:-7px;cursor:ns-resize}
    .h[data-h=sw]{left:-7px;bottom:-7px;cursor:nesw-resize}.h[data-h=w]{left:-7px;top:calc(50% - 7px);cursor:ew-resize}
    .size{position:absolute;left:0;top:-30px;background:#d32f2f;color:#fff;font:600 12px/1 ui-monospace,Consolas,monospace;padding:6px 8px;border-radius:6px;white-space:nowrap}
    .rec .size{display:none}
    .bar{pointer-events:auto;position:fixed;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#16191f;color:#fff;padding:7px 8px;border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,.4);font-size:13px;cursor:default;max-width:calc(100vw - 16px)}
    .bar button{border:0;border-radius:7px;padding:6px 10px;font:600 12.5px system-ui;cursor:pointer;background:#2b303a;color:#fff}
    .bar button.go{background:#d32f2f}.bar button.on{background:#5b6475}
    .bar input{width:62px;padding:5px 6px;border-radius:6px;border:1px solid #3a404c;background:#0f1115;color:#fff;font:12.5px ui-monospace,monospace}
    .bar .sep{width:1px;height:22px;background:#3a404c}
    .bar .t{font:700 14px ui-monospace,monospace;min-width:52px;text-align:center}
    .dot{width:10px;height:10px;border-radius:50%;background:#d32f2f;animation:b 1s infinite}.paused .dot{background:#f9a825;animation:none}
    @keyframes b{50%{opacity:.25}}
    .cd{position:fixed;font:800 120px system-ui;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.6);pointer-events:none;display:grid;place-items:center}
    .hint{color:#aab2c0;font-size:12px}
  </style>
  <div class="w"><div class="layer"></div>
  <div class="box"><div class="size"></div>${['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<div class="h" data-h="${h}"></div>`).join('')}</div>
  <div class="frame"></div>
  <div class="bar sel">
    <button data-p="free" class="on">Erkin</button><button data-p="16:9">16:9</button><button data-p="1:1">1:1</button><button data-p="9:16">9:16</button><button data-p="4:3">4:3</button>
    <span class="sep"></span><input id="w" type="number" min="40" title="Eni (px)"> × <input id="h" type="number" min="40" title="Bo'yi (px)">
    <span class="sep"></span><button class="go" id="go">● Yozish (Enter)</button><button id="x">Bekor (Esc)</button>
  </div>
  <div class="bar recbar" style="display:none"><span class="dot"></span><span class="t" id="t">0:00</span><button id="pz">⏸ Pauza</button><button class="go" id="st">■ To'xtatish</button></div>
  <div class="cd" style="display:none"></div></div>`;
  const $ = s => root.querySelector(s);
  const W = () => innerWidth, H = () => innerHeight, MIN = 40;
  let r = { x: Math.round(W() * 0.2), y: Math.round(H() * 0.18), w: Math.round(W() * 0.6), h: Math.round(H() * 0.6) }, ratio = 0, mode = 'sel', countdown = true;
  const wrap = root.querySelector('.w');
  function clamp() {
    r.w = Math.max(MIN, Math.min(r.w, W())); r.h = Math.max(MIN, Math.min(r.h, H()));
    r.x = Math.max(0, Math.min(r.x, W() - r.w)); r.y = Math.max(0, Math.min(r.y, H() - r.h));
    r.x = Math.round(r.x); r.y = Math.round(r.y); r.w = Math.round(r.w); r.h = Math.round(r.h);
  }
  function draw() {
    clamp();
    Object.assign($('.box').style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
    Object.assign($('.frame').style, { left: r.x - 3 + 'px', top: r.y - 3 + 'px', width: r.w + 6 + 'px', height: r.h + 6 + 'px' });
    const d = devicePixelRatio || 1;
    $('.size').textContent = `${r.w} × ${r.h}` + (d !== 1 ? `  (video: ${Math.round(r.w * d)} × ${Math.round(r.h * d)})` : '');
    $('.size').style.top = r.y < 34 ? (r.h + 6) + 'px' : '-30px';
    if (root.activeElement !== $('#w')) $('#w').value = r.w; if (root.activeElement !== $('#h')) $('#h').value = r.h;
    placeBar(mode === 'sel' ? $('.bar.sel') : $('.recbar'));
  }
  // panelni hududdan tashqariga joylaymiz (videoga tushmasligi uchun)
  function placeBar(b) {
    const bw = b.offsetWidth || 420, bh = b.offsetHeight || 44, gap = 10;
    let x = Math.min(Math.max(8, r.x + r.w / 2 - bw / 2), W() - bw - 8), y;
    if (r.y + r.h + gap + bh < H()) y = r.y + r.h + gap; else if (r.y - gap - bh > 0) y = r.y - gap - bh;
    else if (r.x + r.w + gap + bw < W()) { x = r.x + r.w + gap; y = Math.max(8, r.y); } else if (r.x - gap - bw > 0) { x = r.x - gap - bw; y = Math.max(8, r.y); }
    else { x = W() - bw - 8; y = 8; }
    b.style.left = x + 'px'; b.style.top = y + 'px';
  }
  function setRatio(p) {
    root.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === p));
    ratio = p === 'free' ? 0 : p.split(':').reduce((a, b) => a / b);
    if (ratio) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2; let w = r.w, h = w / ratio; if (h > H() * 0.9) { h = H() * 0.9; w = h * ratio; } if (w > W() * 0.95) { w = W() * 0.95; h = w / ratio; } r = { x: cx - w / 2, y: cy - h / 2, w, h }; }
    draw();
  }
  // sichqoncha bilan surish, cho'zish va yangidan chizish
  let drag = null;
  wrap.addEventListener('pointerdown', e => {
    if (mode !== 'sel' || e.target.closest('.bar')) return;
    const hnd = e.target.dataset?.h, inBox = e.target.closest('.box');
    drag = { h: hnd || (inBox ? 'move' : 'new'), sx: e.clientX, sy: e.clientY, r0: { ...r } };
    if (drag.h === 'new') { r = { x: e.clientX, y: e.clientY, w: MIN, h: MIN }; drag.r0 = { ...r }; drag.h = 'se'; }
    e.target.setPointerCapture?.(e.pointerId); e.preventDefault();
  });
  wrap.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy, o = drag.r0; let { x, y, w, h } = o;
    if (drag.h === 'move') { x = o.x + dx; y = o.y + dy; }
    else {
      if (drag.h.includes('e')) w = o.w + dx; if (drag.h.includes('s')) h = o.h + dy;
      if (drag.h.includes('w')) { w = o.w - dx; x = o.x + dx; } if (drag.h.includes('n')) { h = o.h - dy; y = o.y + dy; }
      if (w < MIN) { if (drag.h.includes('w')) x -= MIN - w; w = MIN; } if (h < MIN) { if (drag.h.includes('n')) y -= MIN - h; h = MIN; }
      if (ratio) { if (/^[ns]$/.test(drag.h)) w = h * ratio; else h = w / ratio; if (drag.h.includes('n')) y = o.y + o.h - h; }
      if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; }
    }
    r = { x, y, w, h }; draw();
  });
  wrap.addEventListener('pointerup', () => drag = null);
  $('#w').onchange = () => { r.w = +$('#w').value || r.w; if (ratio) r.h = r.w / ratio; draw(); };
  $('#h').onchange = () => { r.h = +$('#h').value || r.h; if (ratio) r.w = r.h * ratio; draw(); };
  root.querySelectorAll('[data-p]').forEach(b => b.onclick = () => setRatio(b.dataset.p));
  addEventListener('resize', draw);
  async function go() {
    if (mode !== 'sel') return;
    mode = 'count'; $('.bar.sel').style.display = 'none';
    $('.box').style.boxShadow = 'none'; $('.box').style.outline = '0'; root.querySelectorAll('.h,.size').forEach(e => e.style.display = 'none');
    wrap.classList.add('rec'); host.style.pointerEvents = 'none'; $('.frame').style.display = 'block';
    if (countdown) { const cd = $('.cd'); Object.assign(cd.style, { display: 'grid', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      for (const n of [3, 2, 1]) { cd.textContent = n; await new Promise(k => setTimeout(k, 800)); } cd.style.display = 'none'; await new Promise(k => requestAnimationFrame(() => requestAnimationFrame(k))); }
    mode = 'rec'; $('.recbar').style.display = 'flex'; draw();
    chrome.runtime.sendMessage({ cmd: 'regionGo', rect: { ...r }, vw: innerWidth });
  }
  const end = () => { removeEventListener('keydown', key, true); removeEventListener('resize', draw); host.remove(); window.__ekranRegion = false; };
  const cancel = () => { chrome.runtime.sendMessage({ cmd: 'regionCancel' }); end(); };
  const key = e => { if (mode === 'sel' && e.key === 'Enter' && !/INPUT/.test(root.activeElement?.tagName || '')) { e.preventDefault(); go(); } else if (e.key === 'Escape' && mode === 'sel') { e.preventDefault(); cancel(); } };
  addEventListener('keydown', key, true);
  $('#go').onclick = go; $('#x').onclick = cancel;
  $('#st').onclick = () => chrome.runtime.sendMessage({ cmd: 'stop' });
  $('#pz').onclick = () => chrome.runtime.sendMessage({ cmd: 'pause' });
  chrome.runtime.onMessage.addListener(m => {
    if (m.cmd === 'regionInit') countdown = m.countdown !== false;
    if (m.cmd === 'tick') $('#t').textContent = `${Math.floor(m.sec / 60)}:${String(m.sec % 60).padStart(2, '0')}`;
    if (m.cmd === 'paused') { wrap.classList.toggle('paused', m.v); $('#pz').textContent = m.v ? '▶ Davom etish' : '⏸ Pauza'; }
    if (m.cmd === 'regionEnd') end();
  });
  document.documentElement.appendChild(host);
  chrome.storage.local.get('lastRect', o => { const l = o.lastRect; if (l && l.w <= W() && l.h <= H()) r = l; draw(); });
  const saveRect = () => chrome.storage.local.set({ lastRect: { ...r } });
  wrap.addEventListener('pointerup', saveRect);
  draw();
})();
