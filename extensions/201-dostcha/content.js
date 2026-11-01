(() => {
  if (window.top !== window || window.__dostcha) return;
  window.__dostcha = true;

  const DEF = self.DO_DEF;
  const SIZES = { s: 56, m: 72, l: 96 };
  const host = location.hostname.replace(/^www\./, '');
  let S = { ...DEF }, el = null, root, wrap, bubble, petEl;
  let x = 40, y = 0, vy = 0, dir = 1, state = 'walk', until = 0, raf = 0, last = 0;
  let curPet = '', walkT = 0, walkF = 0;
  let lastAct = Date.now(), dragging = null, lastRemind = Date.now(), bubbleTimer = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Takrorlanmasdan tanlash: har bir ro'yxat aralashtiriladi va oxirigacha navbat bilan beriladi
  const bags = {};
  function draw(key, list) {
    if (!list.length) return '';
    let b = bags[key];
    if (!b || !b.left.length || b.src !== list.join('\n')) {
      const left = [...list]; for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; }
      if (b && left.length > 1 && left[left.length - 1] === b.last) left.unshift(left.pop());
      b = bags[key] = { src: list.join('\n'), left, last: b?.last };
    }
    return (b.last = b.left.pop());
  }
  const P = self.PHRASES;
  const custom = () => (S.custom || []).map(t => String(t).trim()).filter(Boolean);
  const sound = () => draw('snd' + curPet, (self.PETS[curPet] || {}).sound || ['🐾']);
  function chatLine(kind) {
    const mine = custom();
    if (mine.length && (!S.useBuiltin || Math.random() < .5)) return draw('mine', mine);
    if (!S.useBuiltin) return '';
    if (kind === 'hello') return Math.random() < .3 ? sound() : draw('salom', [...P.salom, ...self.timePhrases()]);
    const r = Math.random();
    return r < .2 ? sound() : r < .45 ? draw('salom', P.salom) : r < .6 ? draw('time', self.timePhrases()) : draw('any', P.any);
  }
  const CHANCE = { k: .3, m: .65, b: .95 };

  function build() {
    el = document.createElement('dostcha-pet');
    el.style.cssText = 'all:initial;position:fixed;left:0;right:0;bottom:0;height:0;z-index:2147483646;pointer-events:none;';
    root = el.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      .w { position: absolute; bottom: 0; left: 0; pointer-events: auto; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
      .w.drag { cursor: grabbing; }
      .flip { width: 100%; height: 100%; transition: transform .2s; }
      .flip.l { transform: scaleX(-1); }
      ${self.petImgCSS}
      .hop { width: 100%; height: 100%; }
      .jump .hop { animation: hop .55s ease-out; }
      @keyframes hop { 30% { transform: translateY(-38%) scale(1.05, .95); } 60% { transform: translateY(-10%); } }
      .bub { position: absolute; bottom: 100%; left: 50%; transform: translate(-50%, -4px) scale(.6); opacity: 0; transition: .2s; white-space: normal; width: max-content; max-width: 230px; text-align: center; overflow-wrap: anywhere;
        font: 600 13px/1.3 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; border: 2px solid var(--main);
        border-radius: 12px; padding: 6px 10px; box-shadow: 0 4px 14px rgba(0,0,0,.15); pointer-events: none; }
      .bub::after { content: ''; position: absolute; left: 50%; top: 100%; margin-left: -6px; border: 6px solid transparent; border-top-color: var(--main); }
      .bub.on { opacity: 1; transform: translate(-50%, -4px) scale(1); }
      .zz { position: absolute; right: -4px; top: -6px; font: 700 14px system-ui; color: #64748b; opacity: 0; pointer-events: none; }
      .sleep ~ .zz, .w.sleeping .zz { opacity: 1; animation: zz 2s ease-in-out infinite; }
      @keyframes zz { 0% { transform: translate(0, 0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(10px, -20px); opacity: 0; } }
      .hide { display: none; }
    </style>
    <div class="w"><div class="bub"></div><div class="zz">z z</div><div class="hop"><div class="flip"></div></div></div>`;
    wrap = root.querySelector('.w'); bubble = root.querySelector('.bub');
    renderPet();
    bindPointer();
    (document.body || document.documentElement).appendChild(el);
    applyLook();
  }

  const petId = () => self.PETS[S.pet] ? S.pet : 'kuchukcha';
  function renderPet() {
    curPet = petId(); const def = self.PETS[curPet];
    const flip = root.querySelector('.flip');
    flip.innerHTML = self.petImgHTML(chrome.runtime.getURL(def.dir));
    petEl = flip.firstElementChild;
    applyLook();
  }

  function applyLook() {
    const px = Math.round((SIZES[S.size] || 72) * 1.3);
    wrap.style.setProperty('--main', (self.PETS[curPet] || {}).color || '#f59e0b');
    wrap.style.width = wrap.style.height = px + 'px';
  }

  let poseNow = '';
  function showImg(name) { if (poseNow === name) return; poseNow = name; petEl.querySelectorAll('img').forEach(i => i.classList.toggle('on', i.dataset.p === name)); }
  function setPose(p) {
    wrap.classList.toggle('sleeping', p === 'sleep');
    const k = /carry/.test(p) ? 'carry' : /sleep/.test(p) ? 'sleep' : /happy/.test(p) ? 'happy' : /wave/.test(p) ? 'wave' : /walk/.test(p) ? 'walk' : 'idle';
    petEl.className = 'pi ' + k;
    showImg(k === 'walk' ? (walkF ? 'walk2' : 'walk1') : k);
  }

  // force=true — foydalanuvchi o'zi bosganda (gapirish o'chiq bo'lsa ham javob beradi)
  function say(text, ms, force) {
    if (!text || (!S.talk && !force)) return;
    ms = ms || Math.min(6500, 2200 + text.length * 55);
    bubble.textContent = text;
    bubble.classList.add('on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }

  function go(next, ms) {
    state = next; until = performance.now() + ms;
    if (next === 'walk') setPose(reduce ? 'idle' : 'walk');
    else if (next === 'idle') setPose('idle');
    else if (next === 'wave') { setPose('idle wave'); }
    else if (next === 'happy') setPose('happy wave');
    else if (next === 'sleep') { setPose('sleep'); bubble.classList.remove('on'); }
  }

  function decide() {
    const r = Math.random();
    if (r < .5) { if (Math.random() < .3) dir = -dir; go('walk', 3000 + Math.random() * 6000); }
    else if (r < .75) go('idle', 1500 + Math.random() * 2500);
    else {
      go('wave', 2600);
      if (S.remind && Date.now() - lastRemind > (+S.remindMin || 45) * 60e3) { lastRemind = Date.now(); say(draw('remind', P.remind), 5000); }
      else if (Math.random() < (CHANCE[S.chat] ?? .65)) say(chatLine());
    }
  }

  function width() { return wrap.offsetWidth || 72; }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(50, t - (last || t)) / 1000; last = t;
    if (dragging) return;
    const W = innerWidth - width();

    // gravitatsiya (tashlab yuborilganda)
    if (y > 0 || vy !== 0) {
      vy -= 1800 * dt; y += vy * dt;
      if (y <= 0) { y = 0; if (vy < -350) { vy = -vy * .35; } else { vy = 0; go('happy', 1200); say(draw('drop', P.drop), 1600, true); } }
    } else if (state === 'sleep') {
      if (Date.now() - lastAct < 2000) { go('happy', 1500); say(draw('wake', P.wake), 2200); }
    } else {
      if (Date.now() - lastAct > 90e3 && state !== 'happy') go('sleep', 1e9);
      else if (t > until) decide();
      if (state === 'walk' && !reduce) {
        if ((walkT += dt) > .24 / Math.sqrt(S.speed)) { walkT = 0; walkF ^= 1; showImg(walkF ? 'walk2' : 'walk1'); }
        x += dir * 38 * S.speed * dt;
        if (x <= 0) { x = 0; dir = 1; } else if (x >= W) { x = W; dir = -1; }
      }
    }
    x = Math.max(0, Math.min(W, x));
    root.querySelector('.flip').classList.toggle('l', dir < 0);
    wrap.style.transform = `translate(${x}px, ${-y}px)`;
  }

  function bindPointer() {
    let sx, sy, ox, oy, moved, px, py, pt;
    wrap.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      wrap.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = x; oy = y; moved = false; px = sx; py = sy; pt = performance.now();
      dragging = { vx: 0, vy: 0 };
    });
    wrap.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 5) { moved = true; wrap.classList.add('drag'); setPose('carry'); bubble.classList.remove('on'); }
      if (!moved) return;
      const now = performance.now(), dtt = Math.max(1, now - pt);
      dragging.vx = (e.clientX - px) / dtt * 1000; dragging.vy = (py - e.clientY) / dtt * 1000;
      px = e.clientX; py = e.clientY; pt = now;
      x = Math.max(0, Math.min(innerWidth - width(), ox + e.clientX - sx));
      y = Math.max(0, Math.min(innerHeight - wrap.offsetHeight, oy + sy - e.clientY));
      wrap.style.transform = `translate(${x}px, ${-y}px)`;
    });
    const end = e => {
      if (!dragging) return;
      const d = dragging; dragging = null; wrap.classList.remove('drag');
      lastAct = Date.now();
      if (moved) {
        vy = Math.max(-200, Math.min(900, d.vy * .5)); if (Math.abs(d.vx) > 200) dir = d.vx > 0 ? 1 : -1;
        if (y <= 0 && vy <= 0) { go('happy', 1200); } else setPose('carry');
      } else {
        // bosildi — sakrash
        wrap.classList.remove('jump'); void wrap.offsetWidth; wrap.classList.add('jump');
        go('happy', 1600);
        const mine = custom();
        say(mine.length && (!S.useBuiltin || Math.random() < .4) ? draw('mine', mine) : Math.random() < .3 ? sound() : draw('click', P.click), 0, true);
      }
    };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation(); });
  }

  const activity = () => { lastAct = Date.now(); };
  ['mousemove', 'keydown', 'scroll', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, activity, { passive: true, capture: true }));

  function start() {
    if (el) return;
    build(); x = Math.random() * Math.max(0, innerWidth - width()); dir = Math.random() < .5 ? 1 : -1;
    go('wave', 2200); setTimeout(() => say(chatLine('hello')), 400);
    last = 0; raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); el?.remove(); el = null; }
  function sync() {
    const want = S.on && !S.off.includes(host);
    if (want && !el) start(); else if (!want && el) stop();
    else if (el && petId() !== curPet) { poseNow = ''; renderPet(); go('happy', 1500); say(sound(), 2200, true); }
    else if (el) applyLook();
  }

  // Butun ekranli rejimda (video) yashirinish
  document.addEventListener('fullscreenchange', () => { if (el) el.style.display = document.fullscreenElement ? 'none' : ''; });

  chrome.storage.local.get(DEF, v => { S = { ...DEF, ...v }; sync(); });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    for (const k in ch) S[k] = ch[k].newValue ?? DEF[k];
    sync();
  });
  chrome.runtime.onMessage.addListener(m => {
    if (m?.type === 'hello' && el) { lastAct = Date.now(); go('wave', 2400); say(draw('salom', P.salom), 2600, true); }
    if (m?.type === 'say' && el && m.text) { lastAct = Date.now(); go('wave', 2400); say(m.text, 0, true); }
  });
})();
