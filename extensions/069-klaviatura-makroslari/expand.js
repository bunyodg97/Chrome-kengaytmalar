(() => {
  let macros = [], on = true;
  const load = () => chrome.storage.local.get(['macros', 'off', 'offHosts']).then(o => { macros = (o.macros || []).filter(m => m.k).sort((a, b) => b.k.length - a.k.length); on = !o.off && !(o.offHosts || []).includes(location.hostname); });
  load(); chrome.storage.onChanged.addListener(load);
  const pad = n => String(n).padStart(2, '0');
  function fill(v) { const d = new Date(); return v.replace(/\{sana\}/g, `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`).replace(/\{vaqt\}/g, `${pad(d.getHours())}:${pad(d.getMinutes())}`).replace(/\{yil\}/g, d.getFullYear()).replace(/\{url\}/g, location.href); }
  function inField(el) {
    const v = el.value, pos = el.selectionStart; if (pos == null || pos !== el.selectionEnd) return;
    const before = v.slice(0, pos);
    for (const m of macros) if (before.endsWith(m.k) && (before.length === m.k.length || /[\s(«"']/.test(before[before.length - m.k.length - 1]))) {
      let txt = fill(m.v), cur = txt.indexOf('{kursor}'); txt = txt.replace('{kursor}', ''); if (cur < 0) cur = txt.length;
      if (el.tagName === 'INPUT') txt = txt.replace(/\n/g, ' ');
      el.setSelectionRange(pos - m.k.length, pos);
      if (!document.execCommand('insertText', false, txt)) el.setRangeText(txt, pos - m.k.length, pos, 'end');
      const p = pos - m.k.length + cur; el.setSelectionRange(p, p); el.dispatchEvent(new Event('input', { bubbles: true })); return true;
    }
  }
  function inEditable() {
    const sel = getSelection(); if (!sel.rangeCount || !sel.isCollapsed) return; const n = sel.anchorNode; if (n.nodeType !== 3) return;
    const before = n.textContent.slice(0, sel.anchorOffset);
    for (const m of macros) if (before.endsWith(m.k) && (before.length === m.k.length || /[\s («"']/.test(before[before.length - m.k.length - 1]))) {
      let txt = fill(m.v); const cur = txt.indexOf('{kursor}'); txt = txt.replace('{kursor}', '');
      const r = document.createRange(); r.setStart(n, sel.anchorOffset - m.k.length); r.setEnd(n, sel.anchorOffset); sel.removeAllRanges(); sel.addRange(r);
      const lines = txt.split('\n');
      lines.forEach((l, i) => { if (i) document.execCommand('insertLineBreak') || document.execCommand('insertParagraph'); if (l) document.execCommand('insertText', false, l); });
      if (cur >= 0) { const back = txt.length - cur; for (let i = 0; i < back; i++) sel.modify('move', 'backward', 'character'); }
      return true;
    }
  }
  // Trigger so'z oxirida yozilganda ham, bo'sh joy/Tab bosilganda ham ishlaydi
  document.addEventListener('input', e => {
    if (!on || !macros.length || e.isComposing || e.inputType?.startsWith('delete') || e.inputType === 'insertText' && e.data == null) return;
    const el = e.target;
    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|email|url|tel|)$/.test(el.type))) inField(el);
    else if (el.isContentEditable || document.activeElement?.isContentEditable) inEditable();
  }, true);
})();
