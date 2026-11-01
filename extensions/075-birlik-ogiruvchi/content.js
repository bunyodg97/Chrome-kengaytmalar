(() => {
  let tip = null, on = true; chrome.storage.local.get('off').then(o => on = !o.off); chrome.storage.onChanged.addListener(c => { if (c.off) on = !c.off.newValue; });
  const hide = () => { tip?.remove(); tip = null; };
  document.addEventListener('mouseup', e => setTimeout(() => {
    if (!on || tip?.contains(e.target)) return; hide();
    const s = getSelection(), t = s.toString(); if (!t || t.length > 120 || !/\d/.test(t)) return;
    const r = parseUnits(t); if (!r.length) return;
    const rc = s.getRangeAt(0).getBoundingClientRect();
    tip = document.createElement('div'); const sh = tip.attachShadow({ mode: 'open' });
    sh.innerHTML = `<style>div{position:fixed;z-index:2147483647;background:#3949ab;color:#fff;font:600 13px system-ui;padding:6px 10px;border-radius:8px;box-shadow:0 4px 14px #0004;max-width:320px}span{opacity:.75;font-weight:400}</style><div>${r.map(x => `<span>${x.src.replace(/[<&]/g, '')} ≈</span> ${x.res}`).join('<br>')}</div>`;
    const d = sh.querySelector('div'); d.style.left = Math.max(4, Math.min(innerWidth - 330, rc.left)) + 'px'; d.style.top = (rc.top > 60 ? rc.top - 8 - 26 * r.length : rc.bottom + 8) + 'px';
    document.documentElement.append(tip);
  }, 10));
  document.addEventListener('mousedown', e => { if (tip && !e.composedPath().includes(tip)) hide(); }, true);
  addEventListener('scroll', hide, { passive: true });
})();
