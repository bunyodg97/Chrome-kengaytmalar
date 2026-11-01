// sahifadan mahsulot ma'lumotini olish (executeScript func sifatida)
function grabProduct(sel) {
  const meta = n => document.querySelector(`meta[property="${n}"],meta[name="${n}"],meta[itemprop="${n}"]`)?.content;
  let name = '', price = null, cur = '', img = '';
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (o['@graph']) walk(o['@graph']);
        const t = [].concat(o['@type'] || []); if (t.includes('Product')) { name ||= o.name; img ||= [].concat(o.image || [])[0]?.url || [].concat(o.image || [])[0]; const of = [].concat(o.offers || [])[0]; if (of) { price ??= +(of.price ?? of.lowPrice ?? of.priceSpecification?.price); cur ||= of.priceCurrency; } } };
      walk(JSON.parse(s.textContent));
    } catch {}
  }
  name ||= meta('og:title') || document.querySelector('h1')?.innerText || document.title;
  img ||= meta('og:image') || '';
  if (!(price > 0)) { const p = meta('product:price:amount') || meta('og:price:amount') || meta('price') || document.querySelector('[itemprop=price]')?.getAttribute('content'); if (p) { price = +String(p).replace(/[^\d.]/g, ''); cur ||= meta('product:price:currency') || meta('og:price:currency') || document.querySelector('[itemprop=priceCurrency]')?.getAttribute('content') || ''; } }
  const parse = t => { const m = String(t).replace(/ /g, ' ').match(/(\$|USD)?\s*(\d{1,3}(?:[ ., ]\d{3})+|\d+)(?:[.,](\d{1,2}))?\s*(so['ʻ’`]?m|сум|sum|uzs|\$|usd|₽|руб)?/i); if (!m) return null;
    const v = +(m[2].replace(/[ ., ]/g, '') + (m[3] ? '.' + m[3] : '')); const c = /\$|usd/i.test((m[1] || '') + (m[4] || '')) ? 'USD' : /₽|руб/i.test(m[4] || '') ? 'RUB' : /so|сум|sum|uzs/i.test(m[4] || '') ? 'UZS' : ''; return v > 0 ? { v, c } : null; };
  if (sel) { const r = parse(sel); if (r) { price = r.v; cur = r.c || cur; } }
  if (!(price > 0)) {
    const cand = [...document.querySelectorAll('[class*=price i],[id*=price i],[data-test*=price i],[class*=narx i]')].filter(e => e.offsetParent && !e.closest('s,del,strike') && e.innerText.length < 60).slice(0, 30);
    for (const e of cand) { const r = parse(e.innerText); if (r && (r.c || r.v > 999)) { price = r.v; cur = r.c || 'UZS'; break; } }
  }
  if (!cur && price > 0) cur = price < 20000 && /\$/.test(document.body.innerText.slice(0, 20000)) ? 'USD' : 'UZS';
  return { name: String(name).trim().slice(0, 200), price: price > 0 ? price : null, cur: (cur || 'UZS').toUpperCase().replace('SUM', 'UZS'), img: img ? new URL(img, location.href).href : '', url: location.href, host: location.hostname.replace(/^www\./, '') };
}
