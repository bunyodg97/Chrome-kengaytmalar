function pickElement() {
  return new Promise(ok => {
    const box = document.createElement('div'); box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;outline:3px solid #00695c;background:rgba(0,105,92,.12)';
    const tip = document.createElement('div'); tip.textContent = 'Kuzatiladigan qismni bosing · ↑ — kattaroq blok · Esc — bekor'; tip.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#00695c;color:#fff;font:600 13px system-ui;padding:7px 12px;border-radius:8px';
    document.documentElement.append(box, tip); let cur = null;
    const sel = el => { const path = []; for (let e = el; e && e !== document.body && e.nodeType === 1; e = e.parentElement) { if (e.id && !/\d{3,}/.test(e.id)) { path.unshift('#' + CSS.escape(e.id)); break; } const p = e.parentElement; const same = p ? [...p.children].filter(c => c.tagName === e.tagName) : []; const cls = [...e.classList].filter(c => !/\d{3,}|active|hover|selected/.test(c)).slice(0, 2).map(c => '.' + CSS.escape(c)).join(''); path.unshift(e.tagName.toLowerCase() + cls + (same.length > 1 ? `:nth-of-type(${same.indexOf(e) + 1})` : '')); } return path.join(' > '); };
    const draw = () => { const r = cur.getBoundingClientRect(); Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); };
    const mv = e => { if (e.target === box || e.target === tip) return; cur = e.target; draw(); };
    const done = v => { removeEventListener('mousemove', mv, true); removeEventListener('click', ck, true); removeEventListener('keydown', kd, true); box.remove(); tip.remove(); ok(v); };
    const ck = e => { e.preventDefault(); e.stopPropagation(); done({ sel: sel(cur), text: cur.innerText.trim().slice(0, 2000), title: document.title, url: location.href }); };
    const kd = e => { if (e.key === 'Escape') done(null); if (e.key === 'ArrowUp' && cur?.parentElement && cur.parentElement !== document.body) { e.preventDefault(); cur = cur.parentElement; draw(); } };
    addEventListener('mousemove', mv, true); addEventListener('click', ck, true); addEventListener('keydown', kd, true);
  });
}
