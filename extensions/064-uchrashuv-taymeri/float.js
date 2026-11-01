(() => {
  if (document.getElementById('__ut_float')) return;
  const h = document.createElement('div'); h.id = '__ut_float'; h.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
  const s = h.attachShadow({ mode: 'open' });
  s.innerHTML = `<style>.b{font:700 26px ui-monospace,monospace;color:#fff;background:#00897bdd;padding:8px 14px;border-radius:12px;box-shadow:0 4px 16px #0005;cursor:move;user-select:none;display:flex;gap:10px;align-items:center}.x{font:14px system-ui;cursor:pointer;opacity:.7}.l{font:12px system-ui;opacity:.85;max-width:160px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}</style><div class="b"><div><div class="l"></div><div class="t">--:--</div></div><span class="x" title="Yopish">✕</span></div>`;
  document.documentElement.append(h);
  const b = s.querySelector('.b'), tt = s.querySelector('.t'), l = s.querySelector('.l');
  s.querySelector('.x').onclick = () => { clearInterval(iv); h.remove(); };
  let st = null; chrome.storage.local.get('t').then(o => st = o.t); chrome.storage.onChanged.addListener(c => { if (c.t) st = c.t.newValue; });
  const iv = setInterval(() => {
    if (!st) { tt.textContent = '00:00'; b.style.background = '#d32f2fdd'; l.textContent = 'Vaqt tugadi'; return; }
    const left = Math.max(0, st.paused != null ? st.paused : st.end - Date.now()), sec = Math.ceil(left / 1000);
    tt.textContent = (sec >= 3600 ? Math.floor(sec / 3600) + ':' + String(Math.floor(sec / 60) % 60).padStart(2, '0') : String(Math.floor(sec / 60)).padStart(2, '0')) + ':' + String(sec % 60).padStart(2, '0');
    l.textContent = (st.label || '') + (st.paused != null ? ' ⏸' : '');
    b.style.background = sec <= 60 ? '#d32f2fdd' : sec <= 300 ? '#f57c00dd' : '#00897bdd';
  }, 250);
  let d = null; b.onpointerdown = e => { const r = h.getBoundingClientRect(); d = { x: e.clientX - r.left, y: e.clientY - r.top }; b.setPointerCapture(e.pointerId); };
  b.onpointermove = e => { if (d) Object.assign(h.style, { left: e.clientX - d.x + 'px', top: e.clientY - d.y + 'px', right: 'auto', bottom: 'auto' }); }; b.onpointerup = () => d = null;
})();
