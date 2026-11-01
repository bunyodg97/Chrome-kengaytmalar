// MAIN world: PiP mantiqi (video, Document PiP, tugma, tanlash oynasi, avto-PiP)
(() => {
  if (window.__pipx) return; window.__pipx = true;
  const cfg = { mode: 'document', auto: true, button: true, ask: true, unlock: true, autoReturn: true, win: null, lang: 'uz' };
  const T = {
    uz: { btn: 'PiP', tip: 'Suzuvchi oynaga chiqarish', choose: 'Qaysi videoni chiqaramiz?', playing: 'ijroda', paused: 'pauza', noVideo: 'Bu sahifada video topilmadi', needClick: 'Chrome ruxsat bermadi — video ustidagi «PiP» tugmasini bosing', failed: 'PiP ochilmadi', inPip: 'Video suzuvchi oynada', back: 'Sahifaga qaytarish', speed: 'Tezlik', mute: 'Ovoz', fs: 'To’liq ekran', rew: '−10 soniya', fwd: '+10 soniya', play: 'Ijro / pauza', cancel: 'Bekor qilish' },
    ru: { btn: 'PiP', tip: 'Вывести в плавающее окно', choose: 'Какое видео вывести?', playing: 'играет', paused: 'пауза', noVideo: 'На странице нет видео', needClick: 'Chrome не разрешил — нажмите кнопку «PiP» на видео', failed: 'Не удалось открыть PiP', inPip: 'Видео в плавающем окне', back: 'Вернуть на страницу', speed: 'Скорость', mute: 'Звук', fs: 'Во весь экран', rew: '−10 секунд', fwd: '+10 секунд', play: 'Играть / пауза', cancel: 'Отмена' }
  };
  const tr = k => (T[cfg.lang] || T.uz)[k];
  const MIN_W = 150, MIN_H = 90;
  let cur = null, autoOpened = false;

  // ---------- yordamchi ----------
  const allVideos = (root = document, out = []) => {
    root.querySelectorAll('video').forEach(v => out.push(v));
    root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) allVideos(el.shadowRoot, out); });
    return out;
  };
  const visible = v => { const r = v.getBoundingClientRect(); return r.width >= MIN_W && r.height >= MIN_H && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  const candidates = () => allVideos().filter(v => v.readyState > 0 && visible(v) && v !== (cur && cur.video));
  const area = v => { const r = v.getBoundingClientRect(); return r.width * r.height; };
  const biggest = l => l.slice().sort((a, b) => area(b) - area(a))[0];
  const unlock = v => {
    if (!cfg.unlock) return;
    ['disablePictureInPicture', 'disableRemotePlayback'].forEach(a => { try { v.removeAttribute(a); v[a] = false; } catch (e) {} });
  };
  new MutationObserver(ms => { if (!cfg.unlock) return; ms.forEach(m => { if (m.target.tagName === 'VIDEO') unlock(m.target); }); })
    .observe(document, { attributes: true, subtree: true, attributeFilter: ['disablepictureinpicture', 'disableremoteplayback'] });
  const deepFromPoint = (x, y) => {
    const out = [], walk = root => root.elementsFromPoint(x, y).forEach(el => { out.push(el); if (el.shadowRoot && el.shadowRoot !== root) walk(el.shadowRoot); });
    walk(document); return out;
  };

  // ---------- kichik xabar ----------
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.style.cssText = 'all:initial;position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;background:#212529;color:#fff;font:13px system-ui,sans-serif;padding:9px 14px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.35);max-width:80vw'; }
    toastEl.textContent = msg; (document.body || document.documentElement).append(toastEl);
    clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.remove(), 3500);
  }

  // ---------- Document PiP ----------
  const fmt = s => { if (!isFinite(s)) return '--:--'; s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0'); };
  const CSS = `html,body{margin:0;height:100%;background:#000;overflow:hidden;font:12px system-ui,sans-serif;color:#fff}
.stage{position:absolute;inset:0}.stage video{width:100%;height:100%;object-fit:contain;display:block;background:#000}
.bar{position:absolute;left:0;right:0;bottom:0;padding:18px 8px 6px;background:linear-gradient(transparent,rgba(0,0,0,.85));display:flex;flex-direction:column;gap:3px;transition:opacity .25s}
.bar.hide{opacity:0}.row{display:flex;align-items:center;gap:6px}.row.top input[type=range]{flex:1}
button,select{all:unset;cursor:pointer;color:#fff;padding:3px 6px;border-radius:5px;font-size:13px}button:hover,select:hover{background:rgba(255,255,255,.2)}select{background:rgba(255,255,255,.12);font-size:12px}select option{color:#000}
input[type=range]{accent-color:#7c5cff;height:4px}.sp{flex:1}.vol{width:60px}.time{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:11px;opacity:.9}`;

  async function openDoc(video, auto) {
    const w = cfg.win || {}, r = video.getBoundingClientRect();
    const ratio = (video.videoWidth && video.videoHeight) ? video.videoWidth / video.videoHeight : (r.width / r.height || 16 / 9);
    const width = Math.max(300, Math.min(w.w || 480, 1200)), height = Math.max(180, w.h || Math.round(width / ratio));
    const pw = await documentPictureInPicture.requestWindow({ width, height });
    try { if (w.x != null && w.y != null) pw.moveTo(w.x, w.y); } catch (e) {}
    const d = pw.document, st = d.createElement('style'); st.textContent = CSS; d.head.append(st);
    const stage = d.createElement('div'); stage.className = 'stage'; d.body.append(stage);
    // asl joyda joy egasi qoldiramiz (sahifa maketi buzilmasin)
    const ph = document.createElement('div'); const cs = getComputedStyle(video);
    ph.style.cssText = `width:${r.width}px;height:${r.height}px;background:#111;color:#aaa;display:flex;align-items:center;justify-content:center;font:13px system-ui,sans-serif;box-sizing:border-box;${cs.position !== 'static' ? 'position:' + cs.position + ';' : ''}`;
    ph.textContent = '▣ ' + tr('inPip');
    const wasPlaying = !video.paused;
    video.before(ph); stage.append(video);
    video.style.cssText += ';width:100%;height:100%';
    if (wasPlaying) video.play().catch(() => {});

    const el = (tag, props = {}, ...kids) => { const e = d.createElement(tag); Object.assign(e, props); e.append(...kids); return e; };
    const bar = el('div', { className: 'bar' });
    const seek = el('input', { type: 'range', min: 0, max: 1000, value: 0 });
    const time = el('span', { className: 'time' });
    const bPlay = el('button', { title: tr('play') }), bRew = el('button', { title: tr('rew'), textContent: '⟲10' }), bFwd = el('button', { title: tr('fwd'), textContent: '10⟳' });
    const speed = el('select', { title: tr('speed') }); [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach(s => speed.append(el('option', { value: s, textContent: s + 'x' })));
    const bMute = el('button', { title: tr('mute') }), vol = el('input', { type: 'range', min: 0, max: 1, step: 0.05, className: 'vol' });
    const bFs = el('button', { title: tr('fs'), textContent: '⛶' }), bBack = el('button', { title: tr('back'), textContent: '⤴' });
    bar.append(el('div', { className: 'row top' }, seek, time), el('div', { className: 'row' }, bRew, bPlay, bFwd, speed, el('span', { className: 'sp' }), bMute, vol, bFs, bBack));
    stage.append(bar);

    const sync = () => {
      bPlay.textContent = video.paused ? '▶' : '⏸'; bMute.textContent = video.muted || video.volume === 0 ? '🔇' : '🔊';
      vol.value = video.muted ? 0 : video.volume; speed.value = String(video.playbackRate);
      const live = !isFinite(video.duration);
      seek.style.visibility = live ? 'hidden' : 'visible';
      if (!live && !seek.dragging) seek.value = video.duration ? video.currentTime / video.duration * 1000 : 0;
      time.textContent = live ? 'LIVE' : fmt(video.currentTime) + ' / ' + fmt(video.duration);
    };
    ['timeupdate', 'play', 'pause', 'volumechange', 'ratechange', 'durationchange', 'loadedmetadata'].forEach(ev => video.addEventListener(ev, sync));
    sync();
    bPlay.onclick = () => (video.paused ? video.play() : video.pause()); video.onclick = bPlay.onclick;
    bRew.onclick = () => { video.currentTime = Math.max(0, video.currentTime - 10); }; bFwd.onclick = () => { video.currentTime = Math.min(video.duration || 1e9, video.currentTime + 10); };
    speed.onchange = () => { video.playbackRate = +speed.value; };
    bMute.onclick = () => { video.muted = !video.muted; }; vol.oninput = () => { video.muted = false; video.volume = +vol.value; };
    seek.onpointerdown = () => { seek.dragging = true; }; seek.onpointerup = () => { seek.dragging = false; };
    seek.oninput = () => { if (isFinite(video.duration)) video.currentTime = seek.value / 1000 * video.duration; };
    bFs.onclick = () => { try { if (d.fullscreenElement) d.exitFullscreen(); else stage.requestFullscreen(); } catch (e) {} };
    bBack.onclick = () => pw.close();
    d.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); bPlay.onclick(); } else if (e.key === 'ArrowLeft') bRew.onclick(); else if (e.key === 'ArrowRight') bFwd.onclick();
      else if (e.key === 'f') bFs.onclick(); else if (e.key === 'm') bMute.onclick();
    });
    let hideT; const wake = () => { bar.classList.remove('hide'); clearTimeout(hideT); hideT = setTimeout(() => bar.classList.add('hide'), 2500); };
    d.addEventListener('mousemove', wake); wake();

    // oyna joyi/o'lchamini eslab qolish
    let lastGeo = '';
    const saveGeo = () => {
      try {
        const g = { w: pw.innerWidth, h: pw.innerHeight, x: pw.screenX, y: pw.screenY }, k = JSON.stringify(g);
        if (k !== lastGeo && g.w > 100) { lastGeo = k; cfg.win = g; window.dispatchEvent(new CustomEvent('__pipx_save', { detail: k })); }
      } catch (e) {}
    };
    const geoT = setInterval(saveGeo, 1500);

    const restore = () => {
      clearInterval(geoT); clearTimeout(hideT);
      ['timeupdate', 'play', 'pause', 'volumechange', 'ratechange', 'durationchange', 'loadedmetadata'].forEach(ev => video.removeEventListener(ev, sync));
      video.onclick = null; video.style.width = ''; video.style.height = '';
      const was = !video.paused;
      if (ph.isConnected) ph.replaceWith(video); else (document.body || document.documentElement).append(video);
      if (was) video.play().catch(() => {});
      if (cur && cur.video === video) cur = null; autoOpened = false;
    };
    pw.addEventListener('pagehide', () => { saveGeo(); restore(); });
    cur = { video, pw, auto: !!auto };
  }

  function close() { if (cur) { try { cur.pw.close(); } catch (e) {} } else if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {}); }

  // ---------- ochish ----------
  function notAllowed() {
    toast(tr('needClick'));
    const c = candidates(); if (c.length) { showBtn(biggest(c), true); }
  }
  async function open(video, auto) {
    unlock(video);
    if (cfg.mode === 'document' && 'documentPictureInPicture' in window) {
      try { await openDoc(video, auto); return; }
      catch (e) { if (e && e.name === 'NotAllowedError') { notAllowed(); return; } console.warn('[PiP] Document PiP ishlamadi, oddiy PiP’ga o’tildi:', e); }
    }
    try { await video.requestPictureInPicture(); autoOpened = !!auto; }
    catch (e) { if (e && e.name === 'NotAllowedError') notAllowed(); else toast(tr('failed') + ': ' + (e && e.message || e)); }
  }

  async function toggle(video, auto) {
    if (cur || document.pictureInPictureElement) { close(); return; }
    if (video) return open(video, auto);
    const c = candidates();
    if (!c.length) { if (window === top && !document.querySelector('iframe')) toast(tr('noVideo')); return; }
    if (c.length === 1) return open(c[0], auto);
    const pl = c.filter(v => !v.paused && !v.ended);
    if (pl.length === 1) return open(pl[0], auto);
    if (cfg.ask && !auto) return chooser(c);
    return open(biggest(pl.length ? pl : c), auto);
  }

  // ---------- tanlash oynasi ----------
  function chooser(list) {
    const host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647';
    const sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>.bg{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif}
.box{background:#fff;color:#212529;border-radius:12px;padding:14px;min-width:280px;max-width:420px;box-shadow:0 10px 40px rgba(0,0,0,.4)}h3{margin:0 0 10px;font-size:15px}
button{display:block;width:100%;text-align:left;border:1px solid #dee2e6;background:#f8f9fa;border-radius:8px;padding:8px 10px;margin-bottom:6px;font:inherit;cursor:pointer}button:hover{border-color:#7048e8;background:#f3f0ff}small{color:#868e96}
.c{border:0;background:none;text-align:center;color:#868e96}</style><div class="bg"><div class="box"><h3></h3></div></div>`;
    const box = sr.querySelector('.box'); sr.querySelector('h3').textContent = tr('choose');
    const hl = document.createElement('div'); hl.style.cssText = 'all:initial;position:fixed;z-index:2147483646;outline:3px solid #7c5cff;outline-offset:-3px;pointer-events:none;display:none';
    const done = () => { host.remove(); hl.remove(); removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); done(); } };
    addEventListener('keydown', onKey, true);
    list.forEach((v, i) => {
      const b = document.createElement('button'), r = v.getBoundingClientRect();
      b.innerHTML = `<b>Video ${i + 1}</b> <small>${Math.round(r.width)}×${Math.round(r.height)} · ${v.paused ? tr('paused') : '▶ ' + tr('playing')}${v.duration && isFinite(v.duration) ? ' · ' + fmt(v.duration) : ''}</small>`;
      b.onmouseenter = () => { const q = v.getBoundingClientRect(); Object.assign(hl.style, { display: 'block', left: q.left + 'px', top: q.top + 'px', width: q.width + 'px', height: q.height + 'px' }); };
      b.onclick = () => { done(); open(v, false); };
      box.append(b);
    });
    const cb = document.createElement('button'); cb.className = 'c'; cb.textContent = tr('cancel'); cb.onclick = done; box.append(cb);
    sr.querySelector('.bg').addEventListener('mousedown', e => { if (e.target.classList.contains('bg')) done(); });
    (document.documentElement).append(host, hl);
  }

  // ---------- video ustidagi tugma ----------
  let btnHost, btnFor = null, hideT2;
  function ensureBtn() {
    if (btnHost) return;
    btnHost = document.createElement('div'); btnHost.style.cssText = 'all:initial;position:fixed;z-index:2147483647;display:none';
    const sr = btnHost.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>button{all:initial;cursor:pointer;display:flex;align-items:center;gap:5px;background:rgba(20,20,24,.82);color:#fff;font:600 12px system-ui,sans-serif;padding:6px 10px;border-radius:7px;border:1px solid rgba(255,255,255,.25);box-shadow:0 2px 10px rgba(0,0,0,.4)}button:hover{background:#7048e8}</style><button><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="11" y="11" width="9" height="7" rx="1" fill="#fff"/></svg><span></span></button>`;
    const b = sr.querySelector('button');
    b.addEventListener('mousedown', e => { e.stopPropagation(); }, true);
    b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); const v = btnFor; hideBtn(); if (v) toggle(v, false); }, true);
    (document.documentElement).append(btnHost);
  }
  function showBtn(v, sticky) {
    ensureBtn(); btnFor = v; const r = v.getBoundingClientRect();
    btnHost.shadowRoot.querySelector('span').textContent = tr('btn'); btnHost.shadowRoot.querySelector('button').title = tr('tip');
    btnHost.style.display = 'block'; btnHost.style.left = Math.max(4, Math.min(innerWidth - 80, r.right - 74)) + 'px'; btnHost.style.top = Math.max(4, r.top + 8) + 'px';
    clearTimeout(hideT2); if (!sticky) hideT2 = setTimeout(hideBtn, 2600); else hideT2 = setTimeout(hideBtn, 8000);
  }
  function hideBtn() { if (btnHost) btnHost.style.display = 'none'; btnFor = null; }
  let raf = 0, px = 0, py = 0;
  addEventListener('pointermove', e => {
    if (!cfg.button || e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (document.fullscreenElement) { hideBtn(); return; }
      const els = deepFromPoint(px, py);
      if (btnHost && els.includes(btnHost)) { clearTimeout(hideT2); return; }
      const v = els.find(el => el.tagName === 'VIDEO' && el !== (cur && cur.video) && el.readyState > 0 && visible(el));
      if (v && v !== document.pictureInPictureElement) showBtn(v, false); else if (btnFor) hideBtn();
    });
  }, { passive: true, capture: true });

  // ---------- avtomatik PiP (tab almashganda) ----------
  function setupAuto() {
    try {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('enterpictureinpicture', cfg.auto ? async () => {
        if (cur || document.pictureInPictureElement) return;
        const pl = candidates().filter(v => !v.paused && !v.ended);
        if (pl.length) { autoOpened = true; await open(biggest(pl), true); }
      } : null);
    } catch (e) { /* eski Chrome: qo'llab-quvvatlanmaydi */ }
  }
  document.addEventListener('play', () => { if (cfg.auto) setupAuto(); }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && cfg.autoReturn && (cur && cur.auto || (autoOpened && document.pictureInPictureElement))) close();
  });
  addEventListener('leavepictureinpicture', () => { autoOpened = false; }, true);

  // ---------- ISOLATED dunyodan buyruqlar ----------
  addEventListener('__pipx_cfg', e => { try { Object.assign(cfg, JSON.parse(e.detail)); setupAuto(); } catch (err) {} });
  addEventListener('__pipx_cmd', e => { try { if (JSON.parse(e.detail).type === 'toggle') toggle(); } catch (err) {} });
  // sinov uchun
  window.__pipx_api = { toggle, candidates, cfg, getCur: () => cur };
})();
