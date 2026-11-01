// GitHub kod sahifasida Ctrl/⌘ + bosish: nomni topib, e'lonini qidirish.
(async function () {
  await I18N.init();
  const isMac = /Mac/.test(navigator.platform);
  const IDENT = /[A-Za-z_$][\w$]*/g;
  let tip = null, hovered = null;
  const KEYWORDS = new Set('if else for while do return function const let var class new this import export from default async await try catch finally throw switch case break continue def self None True False null undefined true false public private protected static void int string bool fn pub use mod impl struct enum interface type package func go chan map range lambda in of is not and or with as yield elif except pass raise'.split(' '));

  const inCode = el => !!(el && el.closest && el.closest('#read-only-cursor-text-area, .react-code-text, .react-code-lines, .blob-code, .blob-code-inner, .highlight, [data-testid="code-lines-container"], .react-file-line, table.diff-table, .js-file-line'));

  // GitHub yangi kod ko'rinishida kod ustida shaffof textarea turadi — ostidagi elementni olamiz
  function under(e) {
    const tg = e.target;
    if (!tg || tg.tagName !== 'TEXTAREA') return tg;
    tg.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    tg.style.pointerEvents = '';
    return el;
  }
  function wordAt(x, y, target) {
    if (target && target.tagName === 'TEXTAREA') {
      target.style.pointerEvents = 'none';
      try { return wordAt(x, y, null); } finally { target.style.pointerEvents = ''; }
    }
    const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    if (!range || range.startContainer.nodeType !== 3) return null;
    const text = range.startContainer.textContent;
    const off = range.startOffset;
    IDENT.lastIndex = 0;
    let m;
    while ((m = IDENT.exec(text))) {
      if (m.index <= off && off <= m.index + m[0].length) return m[0];
    }
    return null;
  }
  function wordInTextarea(ta) {
    const pos = ta.selectionStart;
    const v = ta.value;
    let s = pos, e = pos;
    while (s > 0 && /[\w$]/.test(v[s - 1])) s--;
    while (e < v.length && /[\w$]/.test(v[e])) e++;
    const w = v.slice(s, e);
    return /^[A-Za-z_$]/.test(w) ? w : null;
  }
  async function open(name) {
    if (!name || KEYWORDS.has(name)) return;
    const r = repoOf(location.href);
    if (!r) return;
    const { mode, newTab } = await chrome.storage.local.get(['mode', 'newTab']);
    chrome.runtime.sendMessage({ type: 'open', url: defUrl(r.owner, r.repo, name, mode), newTab: !!newTab });
  }
  const mod = e => isMac ? e.metaKey : e.ctrlKey;

  function clearHover() {
    if (hovered) { hovered.classList.remove('__gd-hover'); hovered = null; }
    if (tip) { tip.remove(); tip = null; }
  }
  document.addEventListener('mousemove', e => {
    if (!mod(e) || !inCode(e.target)) { clearHover(); return; }
    const base = under(e);
    const el = base && base.closest && base.closest('span, td, div');
    const w = wordAt(e.clientX, e.clientY, e.target);
    if (!w || KEYWORDS.has(w)) { clearHover(); return; }
    if (el && el !== hovered && el.textContent.length < 120) { clearHover(); hovered = el; el.classList.add('__gd-hover'); }
    if (!tip) { tip = document.createElement('div'); tip.className = '__gd-tip'; document.body.append(tip); }
    tip.textContent = t('tip', { w });
    tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 16) + 'px';
  }, { passive: true });
  document.addEventListener('keyup', e => { if (e.key === 'Control' || e.key === 'Meta') clearHover(); });

  document.addEventListener('click', e => {
    if (!mod(e) || !inCode(e.target)) return;
    let w = null;
    if (e.target.tagName === 'TEXTAREA') { e.preventDefault(); return; } // mousedown'da ishlangan
    w = wordAt(e.clientX, e.clientY, e.target);
    if (w) { e.preventDefault(); e.stopPropagation(); clearHover(); open(w); }
  }, true);

  // Yangi ko'rinishdagi textarea: matn ostidagi qatorlardan so'zni olish
  document.addEventListener('mousedown', e => {
    if (!mod(e) || e.target.id !== 'read-only-cursor-text-area') return;
    const ta = e.target;
    const w = wordAt(e.clientX, e.clientY, ta) || null;
    if (w) { e.preventDefault(); e.stopPropagation(); clearHover(); open(w); }
    else setTimeout(() => open(wordInTextarea(ta)), 0);
  }, true);
})();
