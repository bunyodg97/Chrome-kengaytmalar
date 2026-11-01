async function collectSvgs() {
  const out = [], seen = new Set(), ser = new XMLSerializer();
  const add = (src, svg, url) => { const k = svg || url; if (!k || seen.has(k)) return; seen.add(k); out.push({ src, svg, url }); };
  const defsOf = id => { const el = document.getElementById(id); return el ? el : null; };
  document.querySelectorAll('svg').forEach(s => {
    if (s.closest('svg') !== s && s.parentElement?.closest('svg')) return;
    const r = s.getBoundingClientRect(); if (s.querySelector(':scope > defs:only-child, :scope > symbol') && !r.width) return; // faqat sprite konteyner
    const c = s.cloneNode(true);
    c.querySelectorAll('use').forEach(u => { const h = u.getAttribute('href') || u.getAttribute('xlink:href'); if (h?.startsWith('#')) { const sym = defsOf(h.slice(1)); if (sym) { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); [...sym.childNodes].forEach(n => g.append(n.cloneNode(true))); if (sym.getAttribute('viewBox') && !c.getAttribute('viewBox')) c.setAttribute('viewBox', sym.getAttribute('viewBox')); u.replaceWith(g); } } });
    if (!c.getAttribute('xmlns')) c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const cs = getComputedStyle(s); if (cs.color && /currentColor/i.test(c.outerHTML)) c.setAttribute('color', cs.color);
    if (!c.getAttribute('width') && !c.getAttribute('viewBox') && r.width) { c.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`); }
    add('inline', ser.serializeToString(c));
  });
  document.querySelectorAll('symbol[id]').forEach(sym => { const vb = sym.getAttribute('viewBox') || '0 0 24 24'; add('sprite #' + sym.id, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${sym.innerHTML}</svg>`); });
  document.querySelectorAll('img, image, object[type="image/svg+xml"], embed').forEach(i => { const u = i.currentSrc || i.src || i.getAttribute('href') || i.data; if (u && /\.svg(\?|#|$)|^data:image\/svg/i.test(u)) add('img', null, u); });
  for (const el of document.querySelectorAll('*')) { const b = getComputedStyle(el).backgroundImage + getComputedStyle(el).maskImage; if (!b || !/svg/i.test(b)) continue; for (const m of b.matchAll(/url\("?([^")]+)"?\)/g)) if (/\.svg|svg\+xml/i.test(m[1])) add('css', null, m[1]); }
  for (const x of out) if (!x.svg && x.url) { try { if (x.url.startsWith('data:')) { const [h, d] = x.url.split(','); x.svg = /base64/.test(h) ? atob(d) : decodeURIComponent(d); } else { const r = await fetch(x.url); if (r.ok) x.svg = await r.text(); } } catch {} }
  return out.slice(0, 500).map(x => ({ ...x, svg: x.svg && /<svg/i.test(x.svg) ? x.svg : null }));
}
