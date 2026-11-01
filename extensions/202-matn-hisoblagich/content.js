// Sahifadagi matn maydonlari tagida kichik jonli hisoblagich
(() => {
  if (window.__mhLive) return;
  window.__mhLive = true;
  let on = true, badge = null, target = null, raf = 0;
  chrome.storage.local.get('live', ({ live }) => { on = live !== false; });
  chrome.storage.onChanged.addListener(ch => { if (ch.live) { on = ch.live.newValue !== false; if (!on) hide(); } });

  const isField = el => el && (el.tagName === 'TEXTAREA' || (el.isContentEditable && el.closest('[contenteditable]') === el) ||
    (el.tagName === 'INPUT' && /^(text|search|)$/.test(el.type) && el.maxLength !== 0 && el.offsetWidth > 250));
  const textOf = el => el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.value : el.innerText;

  function ensure() {
    if (badge?.isConnected) return badge;
    badge = document.createElement('matn-hisoblagich');
    badge.attachShadow({ mode: 'open' }).innerHTML = `<style>
      :host{all:initial;position:fixed;z-index:2147483646;pointer-events:none}
      .b{font:11.5px/1 "Segoe UI",system-ui,sans-serif;background:rgba(30,30,36,.82);color:#fff;padding:4px 8px;border-radius:7px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)}
      .w{color:#fdba74}</style><div class="b" id="b"></div>`;
    document.documentElement.appendChild(badge);
    return badge;
  }
  function hide() { badge?.remove(); badge = null; }

  function update() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!on || !target || !document.contains(target)) return hide();
      const t = textOf(target) || '';
      if (!t.trim()) return hide();
      const s = self.MH.stats(t);
      const b = ensure();
      const smsTxt = s.sms.gsm ? `${s.sms.parts} SMS` : `<span class="w">${s.sms.parts} SMS (Unicode)</span>`;
      b.shadowRoot.getElementById('b').innerHTML = `${s.chars} belgi · ${s.words} so'z · ${smsTxt}`;
      const r = target.getBoundingClientRect();
      const bw = b.shadowRoot.getElementById('b').offsetWidth;
      b.style.left = Math.max(4, Math.min(innerWidth - bw - 6, r.right - bw)) + 'px';
      b.style.top = Math.min(innerHeight - 26, r.bottom + 4) + 'px';
    });
  }
  document.addEventListener('focusin', e => { if (isField(e.target)) { target = e.target; update(); } }, true);
  document.addEventListener('focusout', () => setTimeout(() => { if (!isField(document.activeElement)) { target = null; hide(); } }, 100), true);
  document.addEventListener('input', e => { if (e.target === target || target?.contains(e.target)) update(); }, true);
  addEventListener('scroll', () => target && update(), true);
  addEventListener('resize', () => target && update());
})();
