(async () => {
  if (window.__vk) { window.__vk.show(); return; }
  const { fmt = 'png', q = .92 } = await chrome.storage.local.get(['fmt', 'q']);
  const vids = () => [...document.querySelectorAll('video')].filter(v => v.videoWidth && v.getBoundingClientRect().width > 80);
  const pick = () => vids().sort((a, b) => (!b.paused - !a.paused) || (b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
  let v = pick(), F = fmt, Q = q;
  const h = document.createElement('div'); h.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0';
  const s = h.attachShadow({ mode: 'open' });
  s.innerHTML = `<style>.b{position:fixed;display:flex;gap:4px;align-items:center;background:#111d;color:#fff;padding:6px;border-radius:10px;font:13px system-ui;box-shadow:0 4px 18px #0007;backdrop-filter:blur(6px)}
  button,select{all:unset;cursor:pointer;padding:6px 9px;border-radius:7px;font:600 13px system-ui}button:hover,select:hover{background:#fff2}.pri{background:#c62828}.t{font:12px ui-monospace,monospace;opacity:.8;padding:0 4px}
  .flash{position:fixed;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s}.msg{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#c62828;color:#fff;padding:8px 14px;border-radius:9px;font:600 13px system-ui}</style>
  <div class="flash"></div><div class="b"><button id="pv" title="Oldingi kadr ( , )">⏮</button><button id="pp" title="Pauza/davom (K)">⏯</button><button id="nx" title="Keyingi kadr ( . )">⏭</button><span class="t" id="tm"></span>
  <button class="pri" id="sv" title="Saqlash (S)">📷 Saqlash</button><button id="cp" title="Nusxalash (C)">📋</button><select id="fm" title="Format"><option value="png">PNG</option><option value="jpeg">JPG</option><option value="webp">WEBP</option></select><button id="__ab" title="Sozlamalar va til">⚙</button><button id="x" title="Yopish (Esc)">✕</button></div>`;
  document.documentElement.append(h);
  const bar = s.querySelector('.b'), fl = s.querySelector('.flash'); s.getElementById('fm').value = F;
  const fps = () => { const q = v.getVideoPlaybackQuality?.(); return q && v.currentTime > 1 && q.totalVideoFrames ? Math.min(60, Math.max(23.976, Math.round(q.totalVideoFrames / v.currentTime))) : 30; };
  const fmtT = t => { const ms = Math.floor((t % 1) * 1000); t = Math.floor(t); return (t >= 3600 ? Math.floor(t / 3600) + ':' : '') + String(Math.floor(t / 60) % 60).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0') + '.' + String(ms).padStart(3, '0'); };
  function place() { if (!v?.isConnected) v = pick(); if (!v) return; const r = v.getBoundingClientRect(); bar.style.left = Math.max(6, r.left + r.width / 2 - bar.offsetWidth / 2) + 'px'; bar.style.top = Math.max(6, Math.min(innerHeight - 50, r.top + 10)) + 'px'; s.getElementById('tm').textContent = fmtT(v.currentTime); }
  const iv = setInterval(place, 200); place();
  function msg(t) { const d = document.createElement('div'); d.className = 'msg'; d.textContent = t; s.append(d); setTimeout(() => d.remove(), 1800); }
  function flash() { const r = v.getBoundingClientRect(); Object.assign(fl.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); fl.style.opacity = .7; setTimeout(() => fl.style.opacity = 0, 80); }
  async function grab() {
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; const x = c.getContext('2d');
    x.drawImage(v, 0, 0); try { x.getImageData(0, 0, 1, 1); return c; } catch {}
    // CORS bilan himoyalangan video — ekrandan olamiz (sifat ekran o'lchamida)
    bar.style.visibility = 'hidden'; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const url = await chrome.runtime.sendMessage({ type: 'shot' }); bar.style.visibility = ''; if (!url) throw new Error('shot');
    const img = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = url; });
    const r = v.getBoundingClientRect(), k = img.width / innerWidth;
    // video ichidagi haqiqiy tasvir maydoni (object-fit: contain)
    const ar = v.videoWidth / v.videoHeight; let w = r.width, hh = r.height; if (w / hh > ar) w = hh * ar; else hh = w / ar;
    const lx = r.left + (r.width - w) / 2, ty = r.top + (r.height - hh) / 2;
    c.width = Math.round(w * k); c.height = Math.round(hh * k); c.getContext('2d').drawImage(img, lx * k, ty * k, w * k, hh * k, 0, 0, c.width, c.height); c.__screen = true; return c;
  }
  const name = () => { const t = (document.title.replace(/ - YouTube$/, '') || 'video').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60); return `${t} ${fmtT(v.currentTime).replace(/[:.]/g, '-')}.${F === 'jpeg' ? 'jpg' : F}`; };
  async function save() { try { const c = await grab(); flash(); chrome.runtime.sendMessage({ type: 'save', url: c.toDataURL('image/' + F, Q), name: name() }); msg(`Saqlandi: ${c.width}×${c.height}${c.__screen ? ' (ekrandan)' : ''}`); } catch { msg('Bu videodan kadr olib bo\'lmadi (himoyalangan)'); } }
  async function copy() { try { const c = await grab(); const b = await new Promise(ok => c.toBlob(ok, 'image/png')); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); flash(); msg('Nusxalandi — Ctrl+V bilan qo\'ying'); } catch { msg('Nusxalab bo\'lmadi'); } }
  const step = d => { v.pause(); v.currentTime = Math.max(0, Math.min(v.duration || 1e9, v.currentTime + d / fps())); };
  s.getElementById('pv').onclick = () => step(-1); s.getElementById('nx').onclick = () => step(1); s.getElementById('pp').onclick = () => v.paused ? v.play() : v.pause();
  s.getElementById('sv').onclick = save; s.getElementById('__ab').onclick = () => chrome.runtime.sendMessage({ type: '__ab_open' }); s.getElementById('cp').onclick = copy;
  s.getElementById('fm').onchange = e => { F = e.target.value; chrome.storage.local.set({ fmt: F }); };
  const kd = e => { if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return; const k = e.key;
    const map = { ',': () => step(-1), '.': () => step(1), s: save, S: save, c: copy, Escape: close };
    if (map[k] && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); e.stopImmediatePropagation(); map[k](); } };
  addEventListener('keydown', kd, true);
  function close() { clearInterval(iv); removeEventListener('keydown', kd, true); h.remove(); window.__vk = null; }
  s.getElementById('x').onclick = close;
  window.__vk = { show: () => { v = pick(); place(); save(); } };
})();
