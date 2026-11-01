// Umumiy: do'konlar, narxni o'qish, filtrlash va statistika
// Do'konlar ro'yxati: qidiruv manzili ({q} — qidiruv so'zi) va mahsulot havolasida uchraydigan bo'laklar
const DEFAULT_STORES = [
  { id: 'uzum', name: 'Uzum', color: '#7b1fa2', on: true, kind: 'shop', search: 'https://uzum.uz/uz/search?query={q}', links: '/product/' },
  { id: 'olx', name: 'OLX', color: '#00897b', on: true, kind: 'olx', search: 'https://www.olx.uz/list/q-{q-}/', links: '/d/obyavlenie/,/d/uz/obyavlenie/' },
  { id: 'olcha', name: 'Olcha', color: '#e53935', on: true, kind: 'shop', search: 'https://olcha.uz/uz/search?q={q}', links: '/product/view/,/product/' },
  { id: 'alif', name: 'Alif Shop', color: '#2e7d32', on: true, kind: 'shop', search: 'https://alifshop.uz/uz/search?query={q}', links: '/moderated-offer/,/product/,/offer/' },
  { id: 'mediapark', name: 'Mediapark', color: '#1565c0', on: true, kind: 'shop', search: 'https://mediapark.uz/search?q={q}', links: '/products/view/,/product/' },
  { id: 'texnomart', name: 'Texnomart', color: '#f57c00', on: false, kind: 'shop', search: 'https://texnomart.uz/uz/search?q={q}', links: '/product/detail/,/product/' },
  { id: 'asaxiy', name: 'Asaxiy', color: '#0d47a1', on: false, kind: 'shop', search: 'https://asaxiy.uz/product?key={q}', links: '/product/' }
];
async function getStores() { const { stores } = await chrome.storage.local.get('stores'); if (!stores) return DEFAULT_STORES.map(s => ({ ...s }));
  const ids = stores.map(s => s.id); return [...stores, ...DEFAULT_STORES.filter(d => !ids.includes(d.id)).map(s => ({ ...s, on: false }))]; }
const searchUrl = (st, q) => st.search.replace('{q-}', encodeURIComponent(q.trim().replace(/\s+/g, '-'))).replace('{q}', encodeURIComponent(q.trim()));
const storeOn = (p, id, st) => p.src ? p.src[id] !== undefined ? p.src[id] : st.on : (id === 'uzum' ? p.uzum !== false : id === 'olx' ? p.olx !== false : st.on);
const norm = s => String(s || '').toLowerCase().replace(/[ʻʼ’‘`']/g, "'").replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
// Kirill → lotin (sarlavhalarni solishtirish uchun)
const CYR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h' };
const lat = s => norm(s).replace(/[а-яўқғҳ]/g, c => CYR[c] ?? c);
function matches(title, p) {
  const t = lat(title) + ' ' + norm(title);
  const words = lat(p.query).split(/[\s,]+/).filter(w => w.length > 1);
  if (p.strict !== false && !words.every(w => t.includes(w))) return false;
  const ex = (p.exclude || '').split(',').map(x => lat(x)).filter(Boolean);
  if (ex.some(x => t.includes(x))) return false;
  return true;
}
function filterItems(items, p, rate) {
  return items.map(i => ({ ...i, uzs: i.cur === 'USD' ? Math.round(i.price * rate) : i.price }))
    .filter(i => i.uzs > 0 && matches(i.title, p) && (!p.minP || i.uzs >= p.minP) && (!p.maxP || i.uzs <= p.maxP) && !(p.hidden || []).includes(i.url));
}
function quant(a, q) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), pos = (s.length - 1) * q, b = Math.floor(pos); return s[b + 1] !== undefined ? s[b] + (pos - b) * (s[b + 1] - s[b]) : s[b]; }
function stats(items, my, trim = true) {
  let v = items.map(i => i.uzs).sort((a, b) => a - b);
  let out = [];
  if (trim && v.length >= 6) { const q1 = quant(v, .25), q3 = quant(v, .75), iqr = q3 - q1; const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr; out = v.filter(x => x < lo || x > hi); v = v.filter(x => x >= lo && x <= hi); }
  if (!v.length) return { n: 0 };
  const s = { n: v.length, outliers: out.length, min: v[0], max: v.at(-1), p25: Math.round(quant(v, .25)), med: Math.round(quant(v, .5)), avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) };
  if (my) {
    s.cheaper = v.filter(x => x < my).length; s.rank = s.cheaper + 1;
    s.vsMed = Math.round((my / s.med - 1) * 1000) / 10; s.vsMin = Math.round((my / s.min - 1) * 1000) / 10;
    const r = x => Math.max(1000, Math.round(x / 1000) * 1000);
    s.sugCheapest = r(s.min * 0.99); s.sugCompetitive = r(s.p25); s.sugMarket = r(s.med);
  }
  return s;
}
const som = n => n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + " so'm";
async function usdRate() {
  const o = await chrome.storage.local.get(['rate', 'rateT', 'rateManual']);
  if (o.rateManual) return o.rateManual;
  if (o.rate && Date.now() - o.rateT < 12 * 3600e3) return o.rate;
  try { const j = await (await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/')).json(); const r = parseFloat(j[0].Rate); if (r > 1000) { await chrome.storage.local.set({ rate: r, rateT: Date.now() }); return r; } } catch { }
  return o.rate || 12800;
}
