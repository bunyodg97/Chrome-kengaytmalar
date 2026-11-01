// Kod bloklari ustida suzuvchi "Nusxalash" tugmasi.
(async function () {
  if (window.top !== window || window.__codeCopy) return;
  window.__codeCopy = true;
  await I18N.init();
  const { cfg } = await chrome.storage.local.get('cfg');
  const C = Object.assign({ prompt: true, nums: true, min: 1, excluded: [] }, cfg || {});
  if (C.excluded.includes(location.hostname)) return;

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483646;display:none';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>button{font:600 12px/1 system-ui,-apple-system,sans-serif;padding:6px 10px;border-radius:6px;border:1px solid rgba(127,127,127,.35);background:rgba(36,41,47,.92);color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)}button:hover{background:#2f6fed}button.ok{background:#2b8a3e}</style><button></button>`;
  const btn = root.querySelector('button');
  btn.textContent = t('copy');
  document.documentElement.appendChild(host);
  let cur = null, hideT = 0;

  const isCode = el => {
    if (!el || el.isContentEditable) return false;
    const txt = el.innerText || '';
    return txt.trim().length > 0 && txt.split('\n').length >= C.min;
  };
  function findBlock(el) {
    const pre = el.closest && el.closest('pre');
    if (pre && isCode(pre)) return pre;
    const code = el.closest && el.closest('code');
    if (code && code.innerText.includes('\n') && isCode(code)) return code;
    return null;
  }
  function place() {
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { host.style.display = 'none'; return; }
    host.style.display = 'block';
    host.style.top = Math.max(4, r.top + 6) + 'px';
    host.style.left = Math.min(innerWidth - 110, r.right - btn.offsetWidth - 8) + 'px';
  }
  function clean(text) {
    let lines = text.replace(/\u00a0/g, ' ').split('\n');
    if (C.nums) {
      const numbered = lines.filter(l => /^\s*\d+[\s:|.]/.test(l)).length;
      if (numbered >= Math.max(2, lines.length * 0.8)) lines = lines.map(l => l.replace(/^\s*\d+[:|.]?\s?/, ''));
    }
    if (C.prompt) {
      const pr = lines.filter(l => /^\s*(\$|>|PS [^>]*>|C:\\[^>]*>|#)\s/.test(l)).length;
      if (pr && pr >= lines.filter(l => l.trim()).length * 0.5) lines = lines.map(l => l.replace(/^\s*(\$|>|PS [^>]*>|C:\\[^>]*>)\s/, ''));
    }
    return lines.join('\n').replace(/\n+$/, '');
  }
  document.addEventListener('mouseover', e => {
    if (e.target === host) { clearTimeout(hideT); return; }
    const b = findBlock(e.target);
    if (b) { clearTimeout(hideT); if (b !== cur) { cur = b; btn.textContent = t('copy'); btn.className = ''; } place(); }
    else if (cur) { hideT = setTimeout(() => { host.style.display = 'none'; cur = null; }, 400); }
  }, { passive: true });
  addEventListener('scroll', place, { passive: true, capture: true });
  addEventListener('resize', place, { passive: true });
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!cur) return;
    const text = clean(cur.innerText);
    try { await navigator.clipboard.writeText(text); }
    catch (er) { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    btn.textContent = t('copied'); btn.className = 'ok';
    setTimeout(() => { btn.textContent = t('copy'); btn.className = ''; }, 1500);
  });
})();
