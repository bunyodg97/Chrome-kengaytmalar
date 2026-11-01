(async () => {
  if (window.__lupa) { window.__lupa(); return; }
  let { z = 3, size = 220, shape = 'circle' } = await chrome.storage.local.get(['z', 'size', 'shape']);
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
  const sh = host.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>canvas{position:fixed;border:3px solid #fff;box-shadow:0 6px 24px #0007,0 0 0 1px #0004;background:#fff;image-rendering:pixelated}.i{position:fixed;background:#263238;color:#fff;font:600 11px ui-monospace,monospace;padding:3px 7px;border-radius:5px;white-space:nowrap;display:flex;gap:6px;align-items:center}.i span{width:12px;height:12px;border-radius:3px;border:1px solid #fff8}
  .h{pointer-events:auto;position:fixed;top:10px;right:10px;background:#263238ee;color:#ddd;font:12px system-ui;padding:6px 10px;border-radius:8px}</style><canvas></canvas><div class="i"><span></span><b></b></div><div class="h">Lupa: <b id="zz"></b> · Alt+g'ildirak — kattalik · Shift+g'ildirak — o'lcham · S — shakl · C — rangni nusxalash · Esc <button id="__ab" title="Sozlamalar va til" style="pointer-events:auto;cursor:pointer;border:0;background:#fff2;color:#fff;border-radius:5px;margin-left:6px">⚙</button></div>`;
  document.documentElement.append(host);
  sh.getElementById('__ab').onclick = () => chrome.runtime.sendMessage({ type: '__ab_open' }); const cv = sh.querySelector('canvas'), cx = cv.getContext('2d'), info = sh.querySelector('.i'), sw = info.querySelector('span'), it = info.querySelector('b');
  let img = null, k = 1, mx = innerWidth / 2, my = innerHeight / 2, hex = '', busy = false, stale = true;
  const src = document.createElement('canvas'), sx = src.getContext('2d', { willReadFrequently: true });
  async function shot() {
    if (busy) return; busy = true; host.style.visibility = 'hidden'; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const u = await chrome.runtime.sendMessage({ type: 'shot' }); host.style.visibility = ''; busy = false; if (!u) return;
    img = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = u; }); k = img.width / innerWidth; src.width = img.width; src.height = img.height; sx.drawImage(img, 0, 0); stale = false; draw();
  }
  function draw() {
    sh.getElementById('zz').textContent = z + 'x';
    const d = devicePixelRatio; cv.width = cv.height = size * d; cv.style.width = cv.style.height = size + 'px'; cv.style.borderRadius = shape === 'circle' ? '50%' : '10px';
    let L = mx + 24, T = my + 24; if (L + size > innerWidth) L = mx - size - 24; if (T + size > innerHeight) T = my - size - 24; cv.style.left = L + 'px'; cv.style.top = T + 'px';
    info.style.left = L + 'px'; info.style.top = (T + size + 6 > innerHeight - 22 ? T - 24 : T + size + 6) + 'px';
    if (!img) return; cx.imageSmoothingEnabled = z < 4; const w = size / z * k;
    cx.drawImage(img, mx * k - w / 2, my * k - w / 2, w, w, 0, 0, cv.width, cv.height);
    cx.strokeStyle = 'rgba(255,0,0,.7)'; cx.lineWidth = d; const c = cv.width / 2, p = z * d / k; cx.strokeRect(c - p / 2, c - p / 2, p, p);
    const px = sx.getImageData(Math.round(mx * k), Math.round(my * k), 1, 1).data; hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    sw.style.background = hex; it.textContent = `${hex} · rgb(${px[0]},${px[1]},${px[2]}) · ${Math.round(mx)},${Math.round(my)}`;
  }
  const mv = e => { mx = e.clientX; my = e.clientY; requestAnimationFrame(draw); };
  let st; const sc = () => { stale = true; cv.style.opacity = .4; clearTimeout(st); st = setTimeout(async () => { await shot(); cv.style.opacity = 1; }, 250); };
  const wh = e => { if (!e.altKey && !e.shiftKey) return; e.preventDefault(); e.stopPropagation(); const up = (e.deltaY || e.deltaX) < 0;
    if (e.altKey) z = Math.max(1.5, Math.min(12, z + (up ? .5 : -.5))); else size = Math.max(120, Math.min(480, size + (up ? 20 : -20))); chrome.storage.local.set({ z, size }); draw(); };
  const kd = e => { if (e.key === 'Escape') close(); else if ((e.key === 's' || e.key === 'S') && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { shape = shape === 'circle' ? 'sq' : 'circle'; chrome.storage.local.set({ shape }); draw(); }
    else if ((e.key === 'c' || e.key === 'C') && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName) && !e.ctrlKey && !e.metaKey) { navigator.clipboard.writeText(hex); it.textContent = hex + ' nusxalandi ✓'; } else if (e.key === '+' || e.key === '=') { z = Math.min(12, z + .5); draw(); } else if (e.key === '-') { z = Math.max(1.5, z - .5); draw(); } };
  addEventListener('mousemove', mv, true); addEventListener('scroll', sc, true); addEventListener('resize', sc); addEventListener('wheel', wh, { capture: true, passive: false }); addEventListener('keydown', kd, true);
  const iv = setInterval(() => { if (!document.hidden) shot(); }, 3000); // animatsiyali sahifalar uchun yangilab turish
  function close() { clearInterval(iv); removeEventListener('mousemove', mv, true); removeEventListener('scroll', sc, true); removeEventListener('resize', sc); removeEventListener('wheel', wh, true); removeEventListener('keydown', kd, true); host.remove(); window.__lupa = null; }
  window.__lupa = close; await shot();
})();
