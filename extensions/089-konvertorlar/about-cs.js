/* Bunyodg97 — kontent skriptlar uchun tarjima: faqat kengaytma o'zi qo'shgan elementlar tarjima qilinadi (sayt matniga tegmaydi) */
(() => {
  if (self.__ABCS) return; self.__ABCS = true;
  let D = null, pats = [], on = false; const pending = new Set();
  const tr = s => { if (!on || !s) return s; const k = s.trim(); if (!k || k.length > 600) return s; let r = D[k];
    if (r == null) for (const [re, tpl] of pats) { const m = k.match(re); if (m) { r = tpl.replace(/\{(\d)\}/g, (x, i) => tr(m[+i + 1])); break; } }
    if (r == null) { const m = k.match(/^(.*?)([:.!?…]+)$/s); if (m && D[m[1].trim()] != null) r = D[m[1].trim()] + m[2]; }
    if (r == null) { const m = k.match(/^([^\p{L}\p{N}«"(]+)(\p{L}.*)$/su); if (m) { const t2 = tr(m[2]); if (t2 !== m[2]) r = m[1] + t2; } }
    return r == null ? s : s.replace(k, r); };
  const SKIP = 'textarea,pre,code,[contenteditable],script,style,.no-tr';
  function walk(root) { if (!on || !root) return;
    if (root.nodeType === 3) { if (!root.parentElement?.closest(SKIP)) { const v = tr(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; } return; }
    if (root.nodeType === 1) { if (root.closest?.(SKIP)) return; attrs(root); if (root.shadowRoot) { walk(root.shadowRoot); watch(root.shadowRoot); } }
    const w = document.createTreeWalker(root, 5); let n; while ((n = w.nextNode())) { if (n.nodeType === 1) { if (n.matches(SKIP)) continue; attrs(n); if (n.shadowRoot) { walk(n.shadowRoot); watch(n.shadowRoot); } } else if (!n.parentElement?.closest(SKIP)) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } } }
  function attrs(el) { for (const a of ['placeholder', 'title', 'aria-label']) { const v = el.getAttribute?.(a); if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } } }
  const watched = new WeakSet();
  function watch(root) { if (watched.has(root)) return; watched.add(root);
    new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') walk(m.target); else if (m.type === 'attributes') attrs(m.target); else m.addedNodes.forEach(walk); } })
      .observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] }); }
  const mark = n => { if (n && (n.nodeType === 1 || n.nodeType === 11)) { if (D) { walk(n); if (n.nodeType === 1) watch(n); } else pending.add(n); } };
  // Faqat shu (izolyatsiyalangan) dunyodagi chaqiruvlar — ya'ni kengaytma kodi — ushlanadi
  const P = Element.prototype, NP = Node.prototype;
  const as = P.attachShadow; P.attachShadow = function (o) { const r = as.call(this, o); mark(r); return r; };
  for (const [proto, fns] of [[NP, ['appendChild', 'insertBefore']], [P, ['append', 'prepend', 'after', 'before', 'insertAdjacentElement']]]) for (const f of fns) { const o = proto[f]; if (o) proto[f] = function (...a) { const r = o.apply(this, a); a.forEach(x => x instanceof Node && mark(x)); return r; }; }
  chrome.storage.local.get('__ab_lang').then(o => {
    const lang = o.__ab_lang || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'uz');
    D = self.RU || {}; on = lang === 'ru';
    for (const k of Object.keys(D)) if (/\{\d\}/.test(k)) pats.push([new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{(\d)\\?\}/g, '(.+?)') + '$', 's'), D[k], k.replace(/\{\d\}/g, '').length]);
    pats.sort((a, b) => b[2] - a[2]);
    pending.forEach(n => { walk(n); if (n.nodeType === 1) watch(n); }); pending.clear();
  }).catch(() => {});
  self.abTr = s => tr(s);
})();
