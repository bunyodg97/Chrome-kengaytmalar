// Sahifa ustidagi subtitr oynasi + imo-ishora paneli + sayt subtitrlarini o'qish
(function () {
  if (window.__ovozOverlay) return;
  window.__ovozOverlay = true;

  const TXT = {
    uz: { loading: 'Model yuklanmoqda… {0}%', listening: 'Tinglanmoqda', site: "Sayt subtitrlari", wait: 'Ovoz kutilmoqda…',
      music: '♪ musiqa', sound: '🔊 ovoz bor', noise: '🔊 shovqin', siteHint: "Videoda subtitr yoqilmagan yoki mavjud emas", stop: "To'xtatish",
      smaller: 'Kichikroq', bigger: 'Kattaroq', signs: 'Imo-ishora', move: "Surish (2 marta bosing — joyiga qaytarish)", error: 'Xato',
      alertKeyword: "🔔 «{0}» so'zi aytildi", alertLoud: '⚠️ Keskin baland ovoz', loud: 'baland', quiet: 'past ovozda', paused: '⏸ O\'qish uchun pauza' },
    ru: { loading: 'Загрузка модели… {0}%', listening: 'Слушаю', site: 'Субтитры сайта', wait: 'Жду звук…',
      music: '♪ музыка', sound: '🔊 есть звук', noise: '🔊 шум', siteHint: 'В видео нет или не включены субтитры', stop: 'Остановить',
      smaller: 'Меньше', bigger: 'Больше', signs: 'Жесты', move: 'Перетащить (двойной клик — сбросить)', error: 'Ошибка',
      alertKeyword: '🔔 Прозвучало слово «{0}»', alertLoud: '⚠️ Резкий громкий звук', loud: 'громко', quiet: 'тихо', paused: '⏸ Пауза для чтения' }
  };

  let S = {
    fontSize: 30, position: 'bottom', lines: 2, bgOpacity: 0.8, showLevel: true,
    signOn: true, fingerspell: true, signSpeed: 1, lang: 'uz',
    theme: 'white', emphasis: true, translateOn: false, translateTo: 'uz', trShow: 'both',
    keywords: '', flashLoud: true, slowVideo: false, slowRate: 0.85, pauseEach: false
  };
  let dict = { words: {}, letters: {} };
  let mode = null, active = false;
  let lines = [], hideTimer = null, lastCaptionAt = 0, soundChipTimer = null;
  let pos = null;

  const tx = (k, ...a) => { let s = (TXT[S.lang] || TXT.uz)[k] || k; a.forEach((v, i) => { s = s.replace(`{${i}}`, v); }); return s; };

  // ---------- DOM ----------
  const host = document.createElement('div');
  host.id = 'ovoz-overlay-host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
    .wrap { position: fixed; left: 50%; transform: translateX(-50%); width: min(92vw, 1100px); display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; }
    .wrap.bottom { bottom: 7vh; } .wrap.top { top: 6vh; }
    .wrap.custom { transform: none; }
    .wrap.withsign:not(.custom) { width: min(calc(100vw - 300px), 1000px); left: calc((100vw - 270px) / 2); }
    .bar { display: flex; gap: 6px; align-items: center; opacity: 0; transition: opacity .15s; pointer-events: auto; }
    .wrap:hover .bar, .bar:focus-within, .wrap.pinbar .bar { opacity: 1; }
    .bar button { all: unset; cursor: pointer; background: rgba(15,23,42,.92); color: #fff; border-radius: 8px; padding: 5px 9px; font: 600 13px system-ui; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .bar button:hover { background: #2563eb; }
    .bar .drag { cursor: grab; }
    .status { pointer-events: auto; display: flex; gap: 8px; align-items: center; background: rgba(15,23,42,.92); color: #e2e8f0; border-radius: 999px; padding: 4px 12px; font: 600 13px system-ui; }
    .status.hidden { display: none; }
    .lvl { display: inline-flex; gap: 2px; align-items: flex-end; height: 14px; }
    .lvl i { width: 3px; background: #22c55e; border-radius: 2px; height: 3px; transition: height .15s; }
    .chip { background: #f59e0b; color: #111; border-radius: 999px; padding: 1px 8px; font-weight: 700; }
    .chip.hidden { display: none; }
    .dots::after { content: '…'; animation: blink 1s infinite; }
    @keyframes blink { 50% { opacity: .2; } }
    .cap { pointer-events: auto; color: #fff; border-radius: 12px; padding: .35em .7em; text-align: center; line-height: 1.32; font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,.6); max-width: 100%; transition: opacity .3s; overflow-wrap: anywhere; }
    .cap.hidden { opacity: 0; pointer-events: none; }
    .cap .ln { display: block; }
    .cap .ln.old { opacity: .72; }
    .cap .ln.loud { font-weight: 900; letter-spacing: .02em; }
    .cap .ln.loud::before { content: '📢 '; }
    .cap .ln.quiet { font-style: italic; font-weight: 400; }
    .cap .ln.quiet::before { content: '🤫 '; }
    .cap .tr { display: block; font-size: .78em; font-weight: 500; opacity: .9; color: var(--trc, #93c5fd); }
    .cap .tags { display: block; font-size: .62em; font-weight: 700; color: #fbbf24; }
    .alert { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); pointer-events: auto; cursor: pointer; background: #b91c1c; color: #fff;
      font: 800 20px system-ui; padding: 12px 22px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.45); max-width: 90vw; text-align: center; }
    .alert.warn { background: #b45309; }
    .alert.hidden { display: none; }
    .flash { position: fixed; inset: 0; border: 10px solid #ef4444; border-radius: 4px; pointer-events: none; opacity: 0; }
    .flash.warn { border-color: #f59e0b; }
    .flash.on { animation: flash 0.5s ease-in-out 3; }
    @keyframes flash { 50% { opacity: 1; } }
    .sign { position: fixed; right: 18px; bottom: 18px; width: 240px; pointer-events: auto; background: rgba(15,23,42,.95); color: #fff;
      border-radius: 16px; padding: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 6px; }
    .sign.hidden { display: none; }
    .sign .stage { height: 190px; border-radius: 10px; background: #0b1220; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .sign .stage img, .sign .stage video { max-width: 100%; max-height: 100%; object-fit: contain; }
    .sign .big { font-size: 92px; font-weight: 800; color: #93c5fd; }
    .sign .idle { font-size: 54px; opacity: .5; }
    .sign .lbl { text-align: center; font: 700 16px system-ui; min-height: 20px; }
    .sign .lbl b { color: #fbbf24; }
    .sign .head { display: flex; justify-content: space-between; font: 600 12px system-ui; color: #94a3b8; }
    .sign .head button { all: unset; cursor: pointer; color: #94a3b8; }
    .sign .head button:hover { color: #fff; }
  </style>
  <div class="wrap bottom" id="wrap">
    <div class="bar">
      <button class="drag" id="drag" title="">⠿</button>
      <button id="smaller" title="">A−</button>
      <button id="bigger" title="">A+</button>
      <button id="signBtn" title="">🤟</button>
      <button id="stop" title="">✕</button>
    </div>
    <div class="status" id="status"><span class="lvl" id="lvl"><i></i><i></i><i></i><i></i><i></i></span><span id="stxt"></span><span class="chip hidden" id="chip"></span></div>
    <div class="cap hidden" id="cap"></div>
  </div>
  <div class="flash" id="flash"></div>
  <div class="alert hidden" id="alert"></div>
  <div class="sign hidden" id="sign">
    <div class="head"><span>🤟 <span id="signTitle"></span></span><button id="signClose">✕</button></div>
    <div class="stage" id="stage"><span class="idle">🤟</span></div>
    <div class="lbl" id="slbl"></div>
  </div>`;
  const $ = id => root.getElementById(id);
  const wrap = $('wrap'), cap = $('cap'), statusEl = $('status'), stxt = $('stxt'), chip = $('chip'), lvl = $('lvl');
  const signBox = $('sign'), stage = $('stage'), slbl = $('slbl');

  function mount() {
    const fs = document.fullscreenElement;
    const parent = fs && fs.tagName !== 'VIDEO' ? fs : document.documentElement;
    if (host.parentNode !== parent) parent.appendChild(host);
  }
  document.addEventListener('fullscreenchange', () => { if (active) mount(); });

  // ---------- ko'rinish ----------
  function applyView() {
    cap.style.fontSize = S.fontSize + 'px';
    const TH = { white: ['#fff', '0,0,0', '#93c5fd'], yellow: ['#ffd60a', '0,0,0', '#fff'], green: ['#4ade80', '0,0,0', '#fff'], light: ['#0f172a', '255,255,255', '#1d4ed8'] };
    const th = TH[S.theme] || TH.white;
    cap.style.color = th[0];
    cap.style.textShadow = S.theme === 'light' ? 'none' : '';
    cap.style.background = `rgba(${th[1]},${S.bgOpacity})`;
    cap.style.setProperty('--trc', th[2]);
    wrap.classList.remove('top', 'bottom', 'custom');
    if (pos) { wrap.classList.add('custom'); wrap.style.left = pos.x + 'px'; wrap.style.top = pos.y + 'px'; wrap.style.bottom = 'auto'; }
    else { wrap.classList.add(S.position === 'top' ? 'top' : 'bottom'); wrap.style.left = ''; wrap.style.top = ''; wrap.style.bottom = ''; }
    lvl.style.display = S.showLevel ? '' : 'none';
    wrap.classList.toggle('withsign', !!(active && S.signOn));
    signBox.classList.toggle('hidden', !(active && S.signOn));
    $('drag').title = tx('move'); $('smaller').title = tx('smaller'); $('bigger').title = tx('bigger');
    $('signBtn').title = tx('signs'); $('stop').title = tx('stop'); $('signTitle').textContent = tx('signs');
    renderLines();
  }

  function renderLines() {
    const shown = lines.slice(-Math.max(1, S.lines));
    cap.innerHTML = '';
    shown.forEach((l, i) => {
      if (typeof l === 'string') l = { text: l };
      const d = document.createElement('span');
      d.className = 'ln' + (i < shown.length - 1 ? ' old' : '') + (S.emphasis && l.emph ? ' ' + l.emph : '');
      const only = l.tr && S.trShow === 'only';
      if (l.tags && l.tags.length) { const g = document.createElement('span'); g.className = 'tags'; g.textContent = '[' + l.tags.join(', ') + ']'; d.appendChild(g); }
      if (l.text) d.appendChild(document.createTextNode(only ? l.tr : l.text));
      if (l.tr && !only) { const r = document.createElement('span'); r.className = 'tr'; r.textContent = l.tr; d.appendChild(r); }
      cap.appendChild(d);
    });
    cap.classList.toggle('hidden', !shown.length);
  }

  // item: { text, tr, emph, tags, dur }
  function showCaption(item, replace) {
    if (typeof item === 'string') item = { text: item };
    const text = item.text || '';
    if (replace) lines = text ? [{ ...item }] : [];
    else if (text || (item.tags && item.tags.length)) lines.push(item);
    if (lines.length > 50) lines = lines.slice(-50);
    if (text) lastCaptionAt = Date.now();
    renderLines();
    clearTimeout(hideTimer);
    // jimlikdan keyin oyna yo'qoladi (o'qishga yetarli vaqt qoldirib)
    hideTimer = setTimeout(() => { lines = []; renderLines(); }, Math.max(9000, text.length * 120));
    if (!text) return;
    enqueueSigns(item.tr && S.trShow === 'only' ? item.tr : text);
    checkKeywords(text + ' ' + (item.tr || ''));
    const v = mainVideo();
    const vt = v ? Math.max(0, v.currentTime - (mode === 'audio' ? (item.dur || 0) + 1 : 0)) : null;
    chrome.runtime.sendMessage({ type: 'captionLog', entry: { text, tr: item.tr || null, vt, dur: item.dur || null, url: location.href } }).catch(() => {});
    if (S.pauseEach) pauseForReading(v, (item.tr && S.trShow !== 'only' ? text + ' ' + item.tr : text));
  }

  // ---------- video: sekinlashtirish va o'qish uchun pauza ----------
  function mainVideo() {
    let best = null, area = 0;
    document.querySelectorAll('video').forEach(v => {
      const r = v.getBoundingClientRect(); const a = r.width * r.height;
      if (a > area && v.readyState > 0) { best = v; area = a; }
    });
    return best;
  }
  let pausedByUs = null, pauseTimer = null, slowTimer = null;
  function pauseForReading(v, text) {
    if (!v || v.paused || pausedByUs) return;
    const words = text.split(/\s+/).length;
    const ms = Math.min(9000, Math.max(1500, words * 330));
    v.pause(); pausedByUs = v; showChip(tx('paused'));
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => { if (pausedByUs && pausedByUs.paused) pausedByUs.play().catch(() => {}); pausedByUs = null; }, ms);
  }
  function applySlow() {
    clearInterval(slowTimer); slowTimer = null;
    if (active && S.slowVideo) {
      const set = () => document.querySelectorAll('video').forEach(v => {
        if (Math.abs(v.playbackRate - S.slowRate) > 0.01) { v.dataset.ovozRate = v.dataset.ovozRate || String(v.playbackRate); v.playbackRate = S.slowRate; }
      });
      set(); slowTimer = setInterval(set, 1000);
    } else {
      document.querySelectorAll('video[data-ovoz-rate]').forEach(v => { v.playbackRate = Number(v.dataset.ovozRate) || 1; delete v.dataset.ovozRate; });
    }
  }

  // ---------- ogohlantirishlar ----------
  const flashEl = $('flash'), alertEl = $('alert');
  let alertTimer = null, alertTab = null, lastKw = {}, lastLoud = 0;
  function showAlert(text, kind, tabId) {
    if (!host.isConnected) mount();
    alertEl.textContent = text;
    alertEl.className = 'alert' + (kind === 'warn' ? ' warn' : '');
    flashEl.className = 'flash' + (kind === 'warn' ? ' warn' : '');
    void flashEl.offsetWidth; flashEl.classList.add('on');
    alertTab = tabId || null;
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => { alertEl.classList.add('hidden'); if (!active) host.remove(); }, 6000);
  }
  alertEl.addEventListener('click', () => {
    if (alertTab) chrome.runtime.sendMessage({ type: 'focusTab', tabId: alertTab }).catch(() => {});
    alertEl.classList.add('hidden');
  });
  function checkKeywords(text) {
    const kws = String(S.keywords || '').split(',').map(k => window.OvozSigns ? OvozSigns.norm(k.trim()) : k.trim().toLowerCase()).filter(Boolean);
    if (!kws.length) return;
    const words = String(text).split(/\s+/).map(w => window.OvozSigns ? OvozSigns.norm(w) : w.toLowerCase());
    const joined = ' ' + words.join(' ') + ' ';
    for (const k of kws) {
      const hit = k.includes(' ') ? joined.includes(' ' + k + ' ') : words.some(w => w === k || (k.length > 3 && w.startsWith(k)));
      if (hit && Date.now() - (lastKw[k] || 0) > 10000) {
        lastKw[k] = Date.now();
        const msg = tx('alertKeyword', k);
        showAlert(msg, 'red');
        if (document.hidden) chrome.runtime.sendMessage({ type: 'alertNotify', title: msg, text: String(text).slice(0, 120) }).catch(() => {});
      }
    }
  }

  function setStatus(st, progress, err) {
    statusEl.classList.remove('hidden');
    let s = '';
    if (st === 'loading') s = tx('loading', progress || 0);
    else if (st === 'listening') s = tx('listening');
    else if (st === 'site') s = tx('site');
    else if (st === 'error') s = tx('error') + ': ' + (err || '');
    stxt.textContent = s;
  }

  function showChip(text) {
    chip.textContent = text; chip.classList.remove('hidden');
    clearTimeout(soundChipTimer);
    soundChipTimer = setTimeout(() => chip.classList.add('hidden'), 4000);
  }

  let quietSince = 0, levelAvg = 0;
  function setLevel(level, busy) {
    if (S.flashLoud && level > 0.8 && levelAvg < 0.25 && Date.now() - lastLoud > 8000) { lastLoud = Date.now(); showAlert(tx('alertLoud'), 'warn'); }
    levelAvg = levelAvg * 0.9 + level * 0.1;
    const bars = lvl.children;
    for (let i = 0; i < bars.length; i++) bars[i].style.height = (3 + Math.max(0, Math.min(1, level * 1.4 - i * 0.12)) * 11) + 'px';
    stxt.classList.toggle('dots', !!busy);
    // Ovoz bor, lekin nutq aniqlanmayapti — foydalanuvchiga bildirish
    if (level > 0.08 && Date.now() - lastCaptionAt > 3500) { if (!quietSince) quietSince = Date.now(); if (Date.now() - quietSince > 1500 && chip.classList.contains('hidden')) showChip(tx('sound')); }
    else quietSince = 0;
  }

  // ---------- boshqaruv tugmalari ----------
  function saveSetting(patch) {
    chrome.storage.local.get('settings', ({ settings = {} }) => chrome.storage.local.set({ settings: { ...settings, ...patch } }));
  }
  $('smaller').onclick = () => saveSetting({ fontSize: Math.max(14, S.fontSize - 4) });
  $('bigger').onclick = () => saveSetting({ fontSize: Math.min(80, S.fontSize + 4) });
  $('signBtn').onclick = () => saveSetting({ signOn: !S.signOn });
  $('signClose').onclick = () => saveSetting({ signOn: false });
  $('stop').onclick = () => chrome.runtime.sendMessage({ type: 'overlayStop' });

  // Surish
  (function drag() {
    const h = $('drag');
    let sx, sy, ox, oy, on = false;
    h.addEventListener('pointerdown', e => {
      const r = wrap.getBoundingClientRect();
      on = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      h.setPointerCapture(e.pointerId); wrap.classList.add('pinbar');
    });
    h.addEventListener('pointermove', e => {
      if (!on) return;
      pos = { x: Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), y: Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy)) };
      applyView();
    });
    h.addEventListener('pointerup', () => { on = false; wrap.classList.remove('pinbar'); chrome.storage.local.set({ overlayPos: pos }); });
    h.addEventListener('dblclick', () => { pos = null; chrome.storage.local.set({ overlayPos: null }); applyView(); });
  })();

  // ---------- imo-ishora navbati ----------
  let signQueue = [], signBusy = false, signIdleTimer = null;
  function enqueueSigns(text) {
    if (!S.signOn || !window.OvozSigns) return;
    const seq = OvozSigns.sequence(dict, text, S.fingerspell);
    // Yangi gap keldi: eski harflashni tashlaymiz, lug'atdagi so'zlar qoladi (orqada qolmaslik uchun)
    signQueue = signQueue.filter(x => !x.letter);
    for (const it of seq) {
      if (it.media) signQueue.push({ ...it, context: it.label });
      else if (it.spelled) it.spelled.forEach((l, i) => signQueue.push({ ...l, context: it.label, idx: i }));
    }
    // Real vaqtdan orqada qolmaslik
    if (signQueue.length > 60) signQueue = signQueue.slice(-60);
    if (!signBusy) playNext();
  }

  function playNext() {
    clearTimeout(signIdleTimer);
    const it = signQueue.shift();
    if (!it) {
      signBusy = false;
      signIdleTimer = setTimeout(() => { stage.innerHTML = '<span class="idle">🤟</span>'; slbl.textContent = ''; }, 2500);
      return;
    }
    signBusy = true;
    const sp = Math.max(0.25, S.signSpeed || 1);
    stage.innerHTML = '';
    if (it.letter && it.context && it.idx != null) {
      const w = it.context;
      slbl.innerHTML = '';
      const units = OvozSigns.spell(dict, w);
      units.forEach((u, i) => { const s = document.createElement(i === it.idx ? 'b' : 'span'); s.textContent = u.label; slbl.appendChild(s); });
    } else slbl.textContent = it.label;

    let dur = (it.letter ? 650 : 1400) / sp;
    if (it.media && /^data:video|^video\//.test(it.media.mime || it.media.data)) {
      const v = document.createElement('video');
      v.src = it.media.data; v.muted = true; v.autoplay = true; v.playsInline = true; v.playbackRate = sp;
      stage.appendChild(v);
      let done = false;
      const next = () => { if (!done) { done = true; playNext(); } };
      v.onended = next; v.onerror = next;
      setTimeout(next, 5000 / sp);
      return;
    }
    if (it.media) {
      const im = document.createElement('img'); im.src = it.media.data; stage.appendChild(im);
      if (/gif/.test(it.media.mime || '')) dur = Math.max(dur, 1800 / sp);
    } else {
      const b = document.createElement('span'); b.className = 'big'; b.textContent = it.label; stage.appendChild(b);
    }
    setTimeout(playNext, dur);
  }

  // ---------- sayt subtitrlari (YouTube va HTML5 video) ----------
  let siteTimer = null, lastSite = '', ytStyle = null;
  function readSiteCaptions() {
    // Google Meet (tajribaviy): subtitr hududi, so'zlovchi nomi bilan
    if (location.hostname === 'meet.google.com') {
      const reg = document.querySelector('[aria-label="Captions"], [aria-label="Субтитры"], [aria-label="Subtitrlar"], [role="region"][aria-label*="aption"]');
      if (!reg) return '';
      const blocks = [...reg.children].filter(b => b.innerText && b.innerText.trim()).slice(-2);
      return blocks.map(b => {
        const ls = b.innerText.split('\n').map(x => x.trim()).filter(Boolean);
        return ls.length > 1 && ls[0].length < 40 ? `${ls[0]}: ${ls.slice(1).join(' ')}` : ls.join(' ');
      }).join('\n');
    }
    // YouTube
    const segs = document.querySelectorAll('.ytp-caption-segment');
    if (segs.length || location.hostname.includes('youtube.com')) {
      const btn = document.querySelector('.ytp-subtitles-button');
      if (btn && btn.getAttribute('aria-pressed') === 'false' && !btn.dataset.ovozClicked) { btn.dataset.ovozClicked = '1'; btn.click(); }
      const rows = [...document.querySelectorAll('.caption-visual-line')].map(l => l.textContent.trim()).filter(Boolean);
      return rows.length ? rows.join('\n') : [...segs].map(s => s.textContent.trim()).join(' ');
    }
    // Oddiy HTML5 video: matn treklari
    const out = [];
    document.querySelectorAll('video').forEach(v => {
      const tracks = [...v.textTracks].filter(t => t.kind === 'subtitles' || t.kind === 'captions');
      if (!tracks.length) return;
      let tr = tracks.find(t => t.mode === 'showing') || tracks.find(t => t.mode === 'hidden') || tracks[0];
      if (tr.mode === 'disabled') tr.mode = 'hidden';
      const cues = tr.activeCues ? [...tr.activeCues] : [];
      cues.forEach(c => out.push((c.text || '').replace(/<[^>]+>/g, '')));
    });
    return out.join('\n');
  }

  function startSite() {
    if (location.hostname.includes('youtube.com') && !ytStyle) {
      ytStyle = document.createElement('style');
      ytStyle.textContent = '.ytp-caption-window-container{opacity:0 !important}';
      document.documentElement.appendChild(ytStyle);
    }
    let emptyFor = 0;
    siteTimer = setInterval(() => {
      const txt = readSiteCaptions().trim();
      if (txt && txt !== lastSite) {
        lastSite = txt;
        const flat = txt.replace(/\n/g, ' ');
        showCaption({ text: flat }, true);
        if (S.translateOn) {
          chrome.runtime.sendMessage({ type: 'translate', text: flat, to: S.translateTo }).then(r => {
            if (r && r.tr && lastSite === txt && lines[0]) { lines[0].tr = r.tr; renderLines(); }
          }).catch(() => {});
        }
        emptyFor = 0;
      } else if (!txt) {
        emptyFor++;
        if (emptyFor === 40 && !lastSite) showChip(tx('siteHint'));
      }
    }, 250);
  }
  function stopSite() {
    clearInterval(siteTimer); siteTimer = null; lastSite = '';
    if (ytStyle) { ytStyle.remove(); ytStyle = null; }
  }

  // ---------- xabarlar ----------
  chrome.runtime.onMessage.addListener(msg => {
    switch (msg.type) {
      case 'ovoz-start':
        active = true; mode = msg.mode; mount(); applyView(); applySlow();
        stopSite();
        if (mode === 'site') { setStatus('site'); startSite(); }
        else setStatus('loading', 0);
        break;
      case 'ovoz-stop':
        active = false; stopSite(); lines = []; signQueue = []; applySlow();
        if (pausedByUs && pausedByUs.paused) pausedByUs.play().catch(() => {});
        pausedByUs = null;
        host.remove();
        break;
      case 'ovoz-alert': showAlert(msg.text, 'red', msg.tabId); break;
      case 'ovoz-status': setStatus(msg.status, msg.progress, msg.error); break;
      case 'ovoz-caption':
        if (msg.sound && !(msg.tags && msg.tags.length)) showChip(msg.sound === 'music' ? tx('music') : tx('noise'));
        if (msg.text || (msg.tags && msg.tags.length)) showCaption({ text: msg.text, tr: msg.tr, emph: msg.emph, tags: msg.tags, dur: msg.dur }, false);
        break;
      case 'ovoz-level': setLevel(msg.level, msg.busy); break;
    }
  });

  chrome.storage.local.get(['settings', 'signDict', 'overlayPos'], r => {
    S = { ...S, ...(r.settings || {}) };
    if (!S.lang) S.lang = (navigator.language || '').startsWith('ru') ? 'ru' : 'uz';
    dict = r.signDict || dict;
    pos = r.overlayPos || null;
    applyView();
  });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch.settings) { S = { ...S, ...(ch.settings.newValue || {}) }; applyView(); applySlow(); }
    if (ch.signDict) dict = ch.signDict.newValue || { words: {}, letters: {} };
  });
})();
