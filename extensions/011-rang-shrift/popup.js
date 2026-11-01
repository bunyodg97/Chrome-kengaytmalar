tabsInit();
let tab;
function conv(h, f) {
  const n = h.replace('#', ''); if (n.length < 6) return h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  if (f === 'RGB') return `rgb(${r}, ${g}, ${b})`;
  if (f === 'HSL') { const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2; let hh = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; hh *= 60; }
    return `hsl(${Math.round(hh)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`; }
  return h;
}
function scan() {
  const hex = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a] = m[1].split(/[ ,/]+/).map(Number); if (a === 0) return null; return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); };
  const cols = {}, fonts = {};
  [...document.querySelectorAll('body *')].slice(0, 4000).forEach(e => {
    const s = getComputedStyle(e);
    [s.color, s.backgroundColor, s.borderTopColor].forEach((c, i) => { const h = hex(c); if (h && !(i === 2 && s.borderTopWidth === '0px')) cols[h] = (cols[h] || 0) + 1; });
    if (e.childNodes[0]?.nodeType === 3 && e.textContent.trim()) { const f = `${s.fontFamily.split(',')[0].replace(/["']/g, '')}|${s.fontSize}|${s.fontWeight}`; fonts[f] = (fonts[f] || 0) + 1; }
  });
  return { cols: Object.entries(cols).sort((a, b) => b[1] - a[1]).slice(0, 36), fonts: Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 25) };
}
let data = { cols: [], fonts: [] };
function render() {
  const f = $('#fmt').value;
  $('#pal').innerHTML = data.cols.map(([c, n]) => `<button style="background:${c}" data-v="${c}" title="${c} · ${n} marta"><span>${c}</span></button>`).join('') || '<div class="muted small">Ranglar topilmadi</div>';
  $('#fonts').innerHTML = data.fonts.map(([k, n]) => { const [fam, sz, w] = k.split('|'); return `<div class="f" data-v="font-family: ${esc(fam)}; font-size: ${sz}; font-weight: ${w};"><span style="font-family:'${esc(fam)}';font-weight:${w}">${esc(fam)}</span><span class="muted small">${sz} · ${w} · ${n}×</span></div>`; }).join('');
  store.get('hist', []).then(h => {
    $('#hist').innerHTML = h.map(x => x.t === 'color' ? `<div class="f" data-v="${esc(x.v)}"><span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;background:${esc(x.v)};border:1px solid var(--line)"></span> ${esc(conv(x.v, f))}</span><span class="muted small">rang</span></div>`
      : `<div class="f" data-v="${esc(x.v)}"><span>${esc(x.v)}</span><span class="muted small">shrift</span></div>`).join('') || '<div class="muted small">Hali tanlanmagan</div>';
  });
}
document.addEventListener('click', e => { const v = e.target.closest('[data-v]')?.dataset.v; if (v) copyText(v.startsWith('#') ? conv(v, $('#fmt').value) : v); });
$('#fmt').onchange = render;
$('#pick').onclick = async () => { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['inspect.js'] }).catch(() => toast('Bu sahifada ishlamaydi')); window.close(); };
(async () => {
  tab = await activeTab();
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scan }); data = r.result; } catch { $('#pick').disabled = true; }
  render();
})();
