(() => {
  if (window.__rsOn) { window.__rsStop?.(); return; }
  window.__rsOn = true;
  const host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' }); document.documentElement.appendChild(host);
  root.innerHTML = `<style>
    .box{position:fixed;border:2px solid #ad1457;background:rgba(173,20,87,.08);pointer-events:none}
    .tip{position:fixed;background:#16181d;color:#eee;font:12px/1.5 system-ui,sans-serif;padding:8px 10px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.35);max-width:320px;pointer-events:none}
    .tip b{color:#fff}.sw{display:inline-block;width:11px;height:11px;border-radius:3px;border:1px solid #888;vertical-align:-1px;margin-right:4px}
    .bar{position:fixed;top:10px;right:10px;display:flex;gap:6px;pointer-events:auto;font:13px system-ui,sans-serif}
    .bar button{border:0;border-radius:8px;padding:7px 11px;background:#ad1457;color:#fff;font-weight:600;cursor:pointer}
    .bar button.g{background:#2b2f38}
    .msg{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#16181d;color:#fff;font:13px system-ui;padding:7px 12px;border-radius:8px;opacity:0;transition:opacity .2s}
    .msg.s{opacity:1}</style>
    <div class="box" hidden></div><div class="tip" hidden></div>
    <div class="bar"><button id="eye">🎯 Pipetka</button><button class="g" id="x">Yopish (Esc)</button></div><div class="msg"></div>`;
  const box = root.querySelector('.box'), tip = root.querySelector('.tip'), msg = root.querySelector('.msg');
  const hex = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return c; const [r, g, b, a] = m[1].split(/[ ,/]+/).map(Number);
    if (a === 0) return 'shaffof'; return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('') + (a !== undefined && a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''); };
  const say = t => { msg.textContent = t; msg.classList.add('s'); clearTimeout(msg._t); msg._t = setTimeout(() => msg.classList.remove('s'), 1600); };
  let cur = null;
  const info = el => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''),
      font: s.fontFamily.split(',')[0].replace(/["']/g, ''), fontFull: s.fontFamily, size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight,
      color: hex(s.color), bg: hex(s.backgroundColor), w: Math.round(r.width), h: Math.round(r.height), pad: s.padding, rad: s.borderRadius }; };
  const save = item => chrome.storage.local.get('hist', o => { const h = [item, ...(o.hist || []).filter(x => x.v !== item.v)].slice(0, 40); chrome.storage.local.set({ hist: h }); });
  function move(e) {
    const el = e.composedPath()[0]; if (!el || el === host || !(el instanceof Element)) return; cur = el;
    const r = el.getBoundingClientRect(), i = info(el);
    Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); box.hidden = false;
    tip.innerHTML = `<b>${i.tag}</b> · ${i.w}×${i.h}<br>Shrift: <b>${i.font}</b> ${i.size} / ${i.weight} / ${i.lh}<br>Rang: <span class="sw" style="background:${i.color}"></span>${i.color}<br>Fon: <span class="sw" style="background:${i.bg === 'shaffof' ? 'transparent' : i.bg}"></span>${i.bg}<br><span style="opacity:.7">Bosing — CSS nusxalanadi</span>`;
    tip.hidden = false; const tx = Math.min(e.clientX + 14, innerWidth - 330), ty = e.clientY + 14 + 150 > innerHeight ? e.clientY - 150 : e.clientY + 14;
    tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
  }
  function click(e) {
    if (e.composedPath().includes(host)) return;
    e.preventDefault(); e.stopPropagation(); if (!cur) return;
    const i = info(cur);
    const css = `font-family: ${i.fontFull};\nfont-size: ${i.size};\nfont-weight: ${i.weight};\nline-height: ${i.lh};\ncolor: ${i.color};\nbackground-color: ${i.bg};\npadding: ${i.pad};\nborder-radius: ${i.rad};`;
    navigator.clipboard.writeText(css).then(() => say('CSS nusxalandi'), () => say('Nusxalab bo\'lmadi'));
    save({ t: 'font', v: `${i.font} ${i.size} ${i.weight}` }); if (i.color !== 'shaffof') save({ t: 'color', v: i.color });
  }
  const key = e => { if (e.key === 'Escape') stop(); };
  function stop() { removeEventListener('mousemove', move, true); removeEventListener('click', click, true); removeEventListener('keydown', key, true); host.remove(); window.__rsOn = false; }
  window.__rsStop = stop;
  root.getElementById('x').onclick = stop;
  root.getElementById('eye').onclick = async () => {
    if (!window.EyeDropper) return say('Brauzer pipetkani qo\'llamaydi');
    try { const r = await new EyeDropper().open(); navigator.clipboard.writeText(r.sRGBHex); save({ t: 'color', v: r.sRGBHex }); say(r.sRGBHex + ' nusxalandi'); } catch {}
  };
  addEventListener('mousemove', move, true); addEventListener('click', click, true); addEventListener('keydown', key, true);
})();
