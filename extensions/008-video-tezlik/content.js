(() => {
  if (window.__vtLoaded) return; window.__vtLoaded = true;
  const host = location.hostname;
  let cfg = { step: 0.25, jump: 10, remember: true, badge: true, keys: true, sites: {} };
  let speed = 1, wanted = new WeakMap(), lastSet = 0;
  const clamp = v => Math.min(16, Math.max(0.1, Math.round(v * 100) / 100));
  const vids = () => [...document.querySelectorAll('video, audio')];

  function badge(v) {
    if (!cfg.badge || v.tagName !== 'VIDEO') return;
    let b = v.__vtBadge;
    if (!b) {
      b = document.createElement('div'); v.__vtBadge = b;
      Object.assign(b.style, { position: 'absolute', zIndex: 2147483647, background: 'rgba(0,0,0,.65)', color: '#fff', font: '600 13px/1 system-ui,sans-serif', padding: '5px 8px', borderRadius: '6px', pointerEvents: 'none', transition: 'opacity .3s' });
      (v.parentElement || document.body).appendChild(b);
      if (getComputedStyle(v.parentElement).position === 'static') v.parentElement.style.position = 'relative';
    }
    b.textContent = speed.toFixed(2).replace(/0$/, '') + 'x';
    b.style.left = (v.offsetLeft + 10) + 'px'; b.style.top = (v.offsetTop + 10) + 'px';
    b.style.opacity = '1'; clearTimeout(b.__t); b.__t = setTimeout(() => b.style.opacity = '0', 1500);
  }
  function apply(v) { wanted.set(v, speed); lastSet = Date.now(); if (Math.abs(v.playbackRate - speed) > 0.001) v.playbackRate = speed; }
  function setSpeed(s, show = true) {
    speed = clamp(s); vids().forEach(v => { apply(v); if (show) badge(v); });
    if (cfg.remember) { cfg.sites[host] = speed; chrome.storage.local.set({ sites: cfg.sites }); }
  }
  // sayt tezlikni o'zi qaytarib qo'ysa, qayta o'rnatamiz
  document.addEventListener('ratechange', e => {
    const v = e.target, w = wanted.get(v);
    if (!w || Math.abs(v.playbackRate - w) < 0.001) return;
    // yuklanish paytida sayt qaytarsa — qayta o'rnatamiz; foydalanuvchi sayt menyusidan o'zgartirsa — qabul qilamiz
    if (Date.now() - lastSet < 1500 || v.readyState < 2) v.playbackRate = w; else { speed = v.playbackRate; wanted.set(v, speed); }
  }, true);
  document.addEventListener('play', e => apply(e.target), true);
  document.addEventListener('loadedmetadata', e => apply(e.target), true);

  document.addEventListener('keydown', e => {
    if (!cfg.keys || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (!vids().length) return;
    const k = e.key.toLowerCase(), v = vids().find(x => !x.paused) || vids()[0];
    const map = { s: () => setSpeed(speed - cfg.step), d: () => setSpeed(speed + cfg.step), r: () => setSpeed(speed === 1 ? (cfg.fav || 1.75) : 1),
      z: () => { v.currentTime -= cfg.jump; badge(v); }, x: () => { v.currentTime += cfg.jump; badge(v); } };
    if (map[k]) { map[k](); e.preventDefault(); e.stopPropagation(); }
  }, true);

  chrome.runtime.onMessage.addListener((m, s, reply) => {
    if (m.cmd === 'get') reply({ speed, count: vids().length });
    if (m.cmd === 'set') { setSpeed(m.speed); reply({ speed }); }
  });
  chrome.storage.local.get(null, o => {
    cfg = { ...cfg, ...o, sites: o.sites || {} };
    if (cfg.remember && cfg.sites[host]) setSpeed(cfg.sites[host], false);
  });
  new MutationObserver(() => vids().forEach(v => { if (!wanted.has(v)) apply(v); })).observe(document.documentElement, { childList: true, subtree: true });
})();
