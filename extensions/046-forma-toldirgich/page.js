// Sahifaga yuboriladigan funksiyalar (o'zida hamma narsa bor)
function pagePick() {
  return new Promise(ok => {
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;outline:3px solid #1b5e20;background:rgba(27,94,32,.12);border-radius:4px';
    const tip = document.createElement('div'); tip.textContent = 'Maydonni bosing (Esc — bekor)'; tip.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1b5e20;color:#fff;font:600 13px system-ui;padding:7px 12px;border-radius:8px';
    document.documentElement.append(box, tip);
    const sel = el => {
      if (el.id && !/^\d/.test(el.id) && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
      if (el.name) { const s = `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`; if (document.querySelectorAll(s).length === 1) return s; }
      const path = []; for (let e = el; e && e !== document.body; e = e.parentElement) { const p = e.parentElement; if (!p) break; const same = [...p.children].filter(c => c.tagName === e.tagName); path.unshift(e.tagName.toLowerCase() + (same.length > 1 ? `:nth-of-type(${same.indexOf(e) + 1})` : '')); if (e.id && !/^\d/.test(e.id)) { path[0] = '#' + CSS.escape(e.id); break; } }
      return path.join(' > ');
    };
    const label = el => (el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.placeholder || el.name || el.innerText || el.value || el.tagName).trim().slice(0, 40);
    const mv = e => { const r = e.target.getBoundingClientRect(); Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); };
    const done = v => { removeEventListener('mousemove', mv, true); removeEventListener('click', ck, true); removeEventListener('keydown', kd, true); box.remove(); tip.remove(); ok(v); };
    const ck = e => { e.preventDefault(); e.stopPropagation(); const el = e.target.closest('input, select, textarea, button, [contenteditable=true], a, [role=button], [role=textbox], [role=combobox]') || e.target; done({ sel: sel(el), label: label(el), tag: el.tagName.toLowerCase(), type: el.type || '' }); };
    const kd = e => { if (e.key === 'Escape') done(null); };
    addEventListener('mousemove', mv, true); addEventListener('click', ck, true); addEventListener('keydown', kd, true);
  });
}
function pageFields() {
  return [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea')].filter(e => e.offsetParent).map(el => ({
    sel: el.id ? '#' + CSS.escape(el.id) : el.name ? `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]` : null,
    label: (el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.placeholder || el.name || '').trim().toLowerCase() })).filter(f => f.sel && f.label);
}
async function pageFill(map, row, submit, highlight) {
  const res = [];
  const setVal = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set; setter ? setter.call(el, v) : (el.value = v);
  };
  for (const [col, sel] of Object.entries(map)) {
    if (!sel) continue; const el = document.querySelector(sel); let v = row[col] ?? '';
    if (!el) { res.push(`✗ ${col}: maydon topilmadi`); continue; }
    v = String(v);
    el.focus?.();
    if (el.tagName === 'SELECT') { const o = [...el.options].find(o => o.value === v || o.text.trim().toLowerCase() === v.trim().toLowerCase()) || [...el.options].find(o => o.text.toLowerCase().includes(v.toLowerCase()) && v); if (o) setVal(el, o.value); else res.push(`⚠ ${col}: «${v}» varianti yo'q`); }
    else if (el.type === 'checkbox' || el.type === 'radio') { const on = /^(1|ha|true|yes|bor|x|✓|да)$/i.test(v.trim()); if (el.checked !== on) el.click(); }
    else if (el.isContentEditable) { el.textContent = v; }
    else if (el.type === 'date' && /^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(v)) { const [d, m, y] = v.split(/[./]/); setVal(el, `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`); }
    else setVal(el, v);
    ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
    if (highlight) { el.style.outline = '2px solid #2e7d32'; setTimeout(() => el.style.outline = '', 1500); }
    await new Promise(r => setTimeout(r, 60));
  }
  if (submit) { const b = document.querySelector(submit); if (b) { await new Promise(r => setTimeout(r, 300)); b.click(); res.push('→ yuborish bosildi'); } else res.push('✗ yuborish tugmasi topilmadi'); }
  return res;
}
