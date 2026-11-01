/* Bunyodg97 — Sozlamalar, til (UZ/RU) va dasturchi haqida. Barcha kengaytma sahifalariga ulanadi. */
(() => {
  if (window.__AB) return;
  const SITE = 'https://www.ali-dasturchi.uz', DONAT = 'https://www.ali-dasturchi.uz/#donat', DEV = 'Bunyodg97';
  const own = {
    'Sozlamalar': 'Настройки', 'Til': 'Язык', 'Dasturchi': 'Разработчик', 'Sayt': 'Сайт', 'Versiya': 'Версия',
    'Dasturchini qo\'llab-quvvatlash': 'Поддержать разработчика', 'Yopish': 'Закрыть', 'Xush kelibsiz!': 'Добро пожаловать!',
    'Kengaytma o\'rnatildi va ishlashga tayyor.': 'Расширение установлено и готово к работе.', 'Tezkor tugmalar': 'Горячие клавиши',
    'Tugmani o\'zgartirish': 'Изменить сочетание', 'Bepul, reklamasiz va hech qanday ma\'lumotingiz serverga yuborilmaydi.': 'Бесплатно, без рекламы, ваши данные никуда не отправляются.',
    'Boshqa kengaytmalar va dasturlar': 'Другие расширения и программы', 'Til o\'zgardi': 'Язык изменён', 'Qanday ishlatiladi': 'Как пользоваться',
    'Kengaytma ikonkasini panelga mahkamlab qo\'ying: 🧩 → 📌': 'Закрепите значок расширения на панели: 🧩 → 📌', 'belgilanmagan': 'не назначено'
  };
  const D = Object.assign({}, own, window.RU || {});
  const pats = [];
  for (const k of Object.keys(D)) if (/\{\d\}/.test(k)) { const re = new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\d)\\?\}/g, '(.+?)') + '$', 's'); pats.push([re, D[k], k.replace(/\{\d\}/g, '').length]); }
  pats.sort((a, b) => b[2] - a[2]);
  let lang = localStorage.getItem('__ab_lang') || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'uz');
  const tr = s => {
    if (lang !== 'ru' || !s) return s; const k = s.trim(); if (!k || k.length > 600) return s;
    let r = D[k]; if (r == null) for (const [re, tpl] of pats) { const m = k.match(re); if (m) { r = tpl.replace(/\{(\d)\}/g, (x, i) => tr(m[+i + 1])); break; } }
    if (r == null) { const m = k.match(/^(.*?)([:：.!?…]+)$/s); if (m && D[m[1].trim()] != null) r = D[m[1].trim()] + m[2]; }
    if (r == null) { const m = k.match(/^([^\p{L}\p{N}«"(]+)(\p{L}.*)$/su); if (m) { const t2 = tr(m[2]); if (t2 !== m[2]) r = m[1] + t2; } }
    return r == null ? s : s.replace(k, r);
  };
  const SKIP = 'textarea,pre,code,[contenteditable],script,style,.no-tr,.mono';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-tip'];
  function walk(root) {
    if (lang !== 'ru' || !root) return;
    if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(SKIP)) { const n = tr(root.nodeValue); if (n !== root.nodeValue) root.nodeValue = n; } return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (root.closest(SKIP)) return; attrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
    while ((n = w.nextNode())) { if (n.nodeType === 1) { if (n.matches(SKIP)) { continue; } attrs(n); if (n.shadowRoot) { walk(n.shadowRoot); observe(n.shadowRoot); } } else { const p = n.parentElement; if (p && !p.closest(SKIP)) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } } }
  }
  function attrs(el) { for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const n = tr(v); if (n !== v) el.setAttribute(a, n); } }
    if (el.tagName === 'INPUT' && /^(button|submit)$/.test(el.type) && el.value) el.value = tr(el.value);
    if (el.tagName === 'OPTION' && el.textContent) { /* matn tugun orqali */ } }
  const seen = new WeakSet();
  function observe(root) { if (seen.has(root)) return; seen.add(root);
    new MutationObserver(ms => { if (lang !== 'ru') return; for (const m of ms) { if (m.type === 'characterData') { const v = tr(m.target.nodeValue); if (v !== m.target.nodeValue) m.target.nodeValue = v; } else if (m.type === 'attributes') { attrs(m.target); } else m.addedNodes.forEach(walk); } })
      .observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }
  // alert/confirm/prompt matnlari
  for (const f of ['alert', 'confirm', 'prompt']) { const o = window[f]; if (o) window[f] = function (m, ...r) { return o.call(this, typeof m === 'string' ? tr(m) : m, ...r.map(x => typeof x === 'string' && f === 'prompt' ? x : x)); }; }
  const M = chrome.runtime.getManifest();
  const META = window.AB_META || {}; const uzName = (META.uz && META.uz.name) || M.name, uzDesc = (META.uz && META.uz.desc) || M.description || '';
  const name = () => lang === 'ru' && META.ru ? META.ru.name : tr(uzName); const desc = () => lang === 'ru' && META.ru ? META.ru.desc : tr(uzDesc);
  function css() { if (document.getElementById('__ab_css')) return; const s = document.createElement('style'); s.id = '__ab_css'; s.textContent = `
  .__ab_f{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 10px 8px;font:12px var(--f,system-ui);color:var(--muted,#667);border-top:1px solid var(--line,#ddd);margin-top:4px}
  .__ab_f a,.__ab_f button{all:unset;cursor:pointer;color:var(--muted,#667);padding:2px 4px;border-radius:5px}.__ab_f a:hover,.__ab_f button:hover{color:var(--acc,#1f5fd1);background:var(--acc-soft,#e7eefc)}.__ab_f .h{color:#e11d48}
  .__ab_f.float{position:fixed;right:8px;bottom:8px;border:1px solid var(--line,#ddd);border-radius:20px;background:var(--card,#fff);padding:3px 6px;margin:0;z-index:2147483000;box-shadow:0 2px 10px #0002;opacity:.85}.__ab_f.float:hover{opacity:1}.__ab_f.float .t{display:none}
  .__ab_o{position:fixed;inset:0;background:#0007;z-index:2147483600;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto}
  .__ab_p{background:var(--card,#fff);color:var(--ink,#123);border-radius:14px;width:min(380px,100%);box-shadow:0 20px 60px #0006;font:14px/1.45 var(--f,system-ui);overflow:hidden}
  .__ab_p .hd{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line,#ddd)}.__ab_p .hd img{width:36px;height:36px;border-radius:8px}.__ab_p .hd b{display:block;font-size:15px}.__ab_p .hd small{color:var(--muted,#667)}
  .__ab_p .bd{padding:14px 16px;display:flex;flex-direction:column;gap:12px}.__ab_p .lb{font-size:12px;color:var(--muted,#667);margin-bottom:4px}
  .__ab_p .lg{display:grid;grid-template-columns:1fr 1fr;gap:6px}.__ab_p .lg button{all:unset;cursor:pointer;text-align:center;padding:8px;border-radius:9px;border:1px solid var(--line,#ddd);font-weight:600}.__ab_p .lg button.on{background:var(--acc,#1f5fd1);color:var(--acc-ink,#fff);border-color:var(--acc,#1f5fd1)}
  .__ab_p .ln{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;border:1px solid var(--line,#ddd);color:inherit;text-decoration:none}.__ab_p .ln:hover{border-color:var(--acc,#1f5fd1)}.__ab_p .ln span{flex:1}
  .__ab_p .don{background:linear-gradient(135deg,#e11d48,#f97316);color:#fff;border:0;font-weight:700}.__ab_p .don:hover{filter:brightness(1.07)}
  .__ab_p .ft{display:flex;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--line,#ddd);font-size:12px;color:var(--muted,#667)}.__ab_p .ft button{all:unset;cursor:pointer;color:var(--acc,#1f5fd1);font-weight:600}
  .__ab_p kbd{background:var(--bg,#eee);border:1px solid var(--line,#ddd);border-radius:5px;padding:1px 6px;font:12px var(--mono,monospace)}`; document.head.append(s); }
  function panel(opts = {}) {
    css(); const el = document.createElement('div'); el.className = '__ab_p no-tr';
    const L = s => lang === 'ru' ? (D[s] || s) : s;
    el.innerHTML = `<div class="hd"><img src="${chrome.runtime.getURL(M.icons?.['128'] || M.icons?.['48'] || 'icons/128.png')}" alt=""><div><b></b><small>${L('Versiya')} ${M.version}</small></div></div>
    <div class="bd">${opts.welcome ? `<div><b style="font-size:17px">${L('Xush kelibsiz!')}</b><div class="d"></div><div style="margin-top:6px;font-size:12.5px">${L('Kengaytma ikonkasini panelga mahkamlab qo\'ying: 🧩 → 📌')}</div></div>` : ''}
      <div><div class="lb">${L('Til')}</div><div class="lg"><button data-l="uz">O'zbekcha</button><button data-l="ru">Русский</button></div></div>
      <div class="ks"></div>
      <div><div class="lb">${L('Dasturchi')}</div><a class="ln" href="${SITE}" target="_blank"><b style="font-size:16px">👨‍💻</b><span><b>${DEV}</b><br><small>www.ali-dasturchi.uz</small></span>↗</a></div>
      <a class="ln don" href="${DONAT}" target="_blank"><b>❤️</b><span>${L('Dasturchini qo\'llab-quvvatlash')}</span>↗</a>
      <a class="ln" href="${SITE}" target="_blank"><b>🌐</b><span>${L('Boshqa kengaytmalar va dasturlar')}</span>↗</a>
      <div style="font-size:12px;color:var(--muted,#667)">${L('Bepul, reklamasiz va hech qanday ma\'lumotingiz serverga yuborilmaydi.')}</div></div>
    ${opts.close ? `<div class="ft"><span>© ${new Date().getFullYear()} ${DEV}</span><button class="x">${L('Yopish')}</button></div>` : ''}`;
    el.querySelector('.hd b').textContent = name();
    if (opts.welcome) el.querySelector('.d').textContent = desc();
    el.querySelectorAll('.lg button').forEach(b => { b.classList.toggle('on', b.dataset.l === lang); b.onclick = () => setLang(b.dataset.l); });
    if (chrome.commands?.getAll) chrome.commands.getAll(cs => { const a = cs.filter(c => c.description || c.name === '_execute_action'); if (!a.length) return;
      el.querySelector('.ks').innerHTML = `<div class="lb">${L('Tezkor tugmalar')}</div>` + a.map(c => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;padding:2px 0"><span>${c.name === '_execute_action' ? name() : tr(c.description)}</span><kbd>${c.shortcut || L('belgilanmagan')}</kbd></div>`).join('') + `<a href="#" class="sc" style="font-size:12px;color:var(--acc,#1f5fd1)">${L('Tugmani o\'zgartirish')}</a>`;
      el.querySelector('.sc').onclick = e => { e.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }; });
    return el;
  }
  function open() { css(); const o = document.createElement('div'); o.className = '__ab_o'; const p = panel({ close: true }); o.append(p);
    const close = () => o.remove(); o.onclick = e => { if (e.target === o) close(); }; p.querySelector('.x').onclick = close; document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } }); document.body.append(o); }
  async function setLang(l) { lang = l; localStorage.setItem('__ab_lang', l); try { await chrome.storage.local.set({ __ab_lang: l }); } catch {} location.reload(); }
  function footer() {
    if (document.body.dataset.about === 'none' || /offscreen/.test(location.pathname)) return; css();
    const f = document.createElement('div'); const bs = getComputedStyle(document.body), fl = document.body.dataset.about === 'float' || bs.display.includes('grid') || (bs.display.includes('flex') && !bs.flexDirection.startsWith('column'));
    f.className = '__ab_f no-tr' + (fl ? ' float' : '');
    f.innerHTML = `<button class="s" title="${lang === 'ru' ? 'Настройки' : 'Sozlamalar'}">⚙ <span class="t">${lang === 'ru' ? 'Настройки' : 'Sozlamalar'}</span></button><span class="t">·</span><a class="h" href="${DONAT}" target="_blank" title="${lang === 'ru' ? 'Поддержать разработчика' : 'Dasturchini qo\'llab-quvvatlash'}">❤ <span class="t">${lang === 'ru' ? 'Поддержать' : 'Qo\'llab-quvvatlash'}</span></a><span class="t">·</span><a class="t" href="${SITE}" target="_blank">${DEV}</a>`;
    f.querySelector('.s').onclick = open; document.body.append(f);
  }
  window.__AB = { tr, open, panel, setLang, get lang() { return lang; }, SITE, DONAT, DEV };
  window.t = window.t || tr;
  // storage'dagi tilni sinxronlash (boshqa sahifada o'zgargan bo'lsa)
  try { chrome.storage.local.get('__ab_lang').then(o => { if (o.__ab_lang && o.__ab_lang !== lang) { localStorage.setItem('__ab_lang', o.__ab_lang); location.reload(); } }); } catch {}
  const start = () => { document.documentElement.lang = lang; if (lang === 'ru') { document.title = META.ru && document.title === uzName ? META.ru.name : tr(document.title); walk(document.body); } observe(document.body); if (!document.body.dataset.noFooter) footer(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
