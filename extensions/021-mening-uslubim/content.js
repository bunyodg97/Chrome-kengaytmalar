(() => {
  const host = location.hostname.replace(/^www\./, '');
  let st;
  function apply(styles) {
    const g = styles['*'], s = styles[host];
    const css = [g && g.on ? g.css : '', s && s.on ? s.css : ''].join('\n');
    if (!st) { st = document.createElement('style'); st.id = '__mening_uslubim'; }
    st.textContent = css;
    if (css.trim() && !st.isConnected) (document.head || document.documentElement).appendChild(st);
    // boshqa uslublardan keyin turishi uchun oxirga ko'chiramiz
    if (document.head && st.isConnected && st.parentNode !== document.head) document.head.appendChild(st);
  }
  chrome.storage.local.get('styles', o => apply(o.styles || {}));
  chrome.storage.onChanged.addListener(c => { if (c.styles) apply(c.styles.newValue || {}); });
  document.addEventListener('DOMContentLoaded', () => { if (st && st.isConnected) document.head.appendChild(st); });
})();
