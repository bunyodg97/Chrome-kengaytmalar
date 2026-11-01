(() => {
  const host = (() => { try { return window.top.location.hostname; } catch { return location.hostname; } })().replace(/^www\./, '');
  let active = false;
  const EVENTS = ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart', 'beforecopy', 'keydown', 'mousedown', 'mouseup'];
  const block = e => {
    if (!active) return;
    if (e.type === 'keydown' && !((e.ctrlKey || e.metaKey) && /^[acvxp]$/i.test(e.key)) && e.key !== 'F12') return;
    if ((e.type === 'mousedown' || e.type === 'mouseup') && e.button !== 2) return;
    e.stopImmediatePropagation();
  };
  EVENTS.forEach(t => window.addEventListener(t, block, true));
  function enable() {
    if (active) return; active = true;
    const st = document.createElement('style'); st.id = '__nr';
    st.textContent = '*,*::before,*::after{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}';
    (document.head || document.documentElement).appendChild(st);
    const clean = () => {
      ['oncopy', 'oncut', 'onpaste', 'oncontextmenu', 'onselectstart', 'ondragstart', 'onmousedown'].forEach(a => {
        document.querySelectorAll(`[${a}]`).forEach(e => e.removeAttribute(a));
        if (document.body) document.body[a] = null; document[a] = null;
      });
    };
    clean(); document.addEventListener('DOMContentLoaded', clean); setTimeout(clean, 2000);
  }
  chrome.storage.local.get(['all', 'sites'], o => { if (o.all || (o.sites || []).includes(host)) enable(); });
  chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.cmd === 'state') reply(active); });
})();
