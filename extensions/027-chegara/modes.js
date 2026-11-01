const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#00acc1', '#1e88e5', '#8e24aa', '#d81b60', '#6d4c41', '#546e7a'];
const CSS = {
  outline: COLORS.map((c, i) => `${'body ' + '* '.repeat(i)}{outline:1px solid ${c}!important;outline-offset:-1px!important}`).join('\n'),
  flex: `*:where([style*="display:flex"],[style*="display: flex"]){}`,
  bg: COLORS.map((c, i) => `${'body ' + '* '.repeat(i)}{background-color:${c}14!important}`).join('\n'),
  overflow: ''
};
function pageTool(mode, on) {
  const id = '__chegara_' + mode;
  document.getElementById(id)?.remove();
  if (mode === 'labels') {
    if (window.__chL) { removeEventListener('mousemove', window.__chL, true); window.__chTip?.remove(); window.__chBox?.remove(); window.__chL = null; }
    if (!on) return false;
    const tip = document.createElement('div'), box = document.createElement('div');
    tip.style.cssText = 'position:fixed;z-index:2147483647;background:#111;color:#fff;font:11px/1.4 ui-monospace,monospace;padding:4px 7px;border-radius:5px;pointer-events:none;white-space:nowrap';
    box.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;outline:2px solid #e53935;background:rgba(229,57,53,.08)';
    document.documentElement.append(box, tip); window.__chTip = tip; window.__chBox = box;
    window.__chL = e => { const el = e.target; if (!(el instanceof Element) || el === tip || el === box) return;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      tip.textContent = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList[0] ? '.' + [...el.classList].slice(0, 2).join('.') : ''}  ${Math.round(r.width)}×${Math.round(r.height)}  ${s.display}${s.position !== 'static' ? ' ' + s.position : ''}  m:${s.margin} p:${s.padding}`;
      tip.style.left = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 6) + 'px'; tip.style.top = Math.max(4, r.top - 24) + 'px'; };
    addEventListener('mousemove', window.__chL, true); return true;
  }
  if (mode === 'flexgrid') {
    if (!on) { document.querySelectorAll('[data-chfg]').forEach(e => { e.style.outline = e.dataset.chfg; delete e.dataset.chfg; }); return false; }
    let n = 0; document.querySelectorAll('body *').forEach(e => { const d = getComputedStyle(e).display; if (/flex|grid/.test(d)) { e.dataset.chfg = e.style.outline; e.style.outline = `2px dashed ${d.includes('grid') ? '#8e24aa' : '#1e88e5'}`; n++; } });
    return n;
  }
  if (mode === 'overflow') {
    if (!on) { document.querySelectorAll('[data-chov]').forEach(e => { e.style.outline = e.dataset.chov; delete e.dataset.chov; }); return false; }
    const W = document.documentElement.clientWidth; let n = 0;
    document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > W + 1 || r.left < -1) { e.dataset.chov = e.style.outline; e.style.outline = '3px solid #e53935'; n++; } });
    return n;
  }
  if (!on) return false;
  const st = document.createElement('style'); st.id = id; st.textContent = window.__chCSS[mode]; document.documentElement.appendChild(st); return true;
}
