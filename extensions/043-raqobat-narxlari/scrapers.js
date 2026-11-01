// Bu funksiyalar sahifa ichida bajariladi (o'zida hamma narsa bor)
async function scrapeStore(maxScrolls, linkParts, srcId) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const parse = t => { const m = String(t).replace(/ | /g, ' ').match(/(\d[\d ]{2,})\s*(so['ʻ’`]?m|сум|sum)/i); return m ? +m[1].replace(/\s/g, '') : 0; };
  const parts = String(linkParts || '/product/').split(',').map(s => s.trim()).filter(Boolean);
  const sel = parts.map(p => `a[href*="${p.replace(/"/g, '')}"]`).join(',');
  const priceRe = /(\d[\d\s\u00a0\u202f]{2,})\s*(so['ʻ’`]?m|сум|sum|uzs)/i;
  for (let i = 0; i < 40 && !document.querySelector(sel); i++) await sleep(500);
  for (let i = 0; i < maxScrolls; i++) { scrollTo(0, document.body.scrollHeight); await sleep(1200); }
  let anchors = [...document.querySelectorAll(sel)];
  // namuna mos kelmasa — rasmli va yonida narxi bor havolalarni olamiz
  if (!anchors.length) anchors = [...document.querySelectorAll('a[href]')].filter(a => a.host === location.host && a.querySelector('img') && priceRe.test(a.closest('li, article, div')?.innerText || ''));
  const seen = new Map();
  for (const a of anchors) {
    const url = a.href.split('?')[0].split('#')[0]; if (seen.has(url) || url === location.href.split('?')[0]) continue;
    let card = a; for (let k = 0; k < 5 && card.parentElement; k++) { if (/(\d[\d\s ]{2,})\s*(so['ʻ’`]?m|сум)/i.test(card.innerText) && card.innerText.length > 20) break; card = card.parentElement; }
    // narx: chizilgan (eski) va «oyiga» (muddatli to'lov) narxlarini tashlab ketamiz
    let price = 0;
    for (const el of card.querySelectorAll('span, div, p, b, strong, ins, bdi')) {
      if (el.children.length > 1) continue;
      const tx = el.textContent; if (!/(so['ʻ’`]?m|сум|sum|uzs)/i.test(tx) || tx.length > 60) continue;
      // muddatli to'lov («oyiga», «/oy», «x 12», «/мес») narxini o'tkazib yuboramiz
      const near = (el.previousSibling?.textContent || '').slice(-12) + ' ' + (el.nextSibling?.textContent || '').slice(0, 8);
      if (/\boy|мес|x\s*\d+/i.test(tx) || /\boy|мес|в месяц|x\s*\d+|^\s*\//i.test(near)) continue;
      if (el.closest('s, del') || getComputedStyle(el).textDecorationLine.includes('line-through')) continue;
      const v = parse(tx); if (v) { price = v; break; }
    }
    if (!price) continue;
    const lines = card.innerText.split('\n').map(s => s.trim()).filter(s => s.length > 8 && !/so['ʻ’`]?m|сум|oyiga|\d+\s*ta\b|baho|отзыв|заказ|buyurtma/i.test(s));
    const title = card.querySelector('[data-test-id*="title"], [class*="title"]')?.innerText?.trim() || a.getAttribute('title') || card.querySelector('img[alt]')?.alt || lines.sort((x, y) => y.length - x.length)[0] || '';
    const ord = (card.innerText.match(/([\d\s]+)\s*(ta\s*buyurtma|заказ)/i) || [])[1];
    const rat = (card.innerText.match(/\b([1-5][.,]\d)\b/) || [])[1];
    seen.set(url, { src: srcId, title: title.slice(0, 160), price, cur: 'UZS', url, img: card.querySelector('img')?.src || '', orders: ord ? +ord.replace(/\s/g, '') : null, rating: rat ? +rat.replace(',', '.') : null });
  }
  return [...seen.values()];
}
function scrapeOlxDom() {
  const out = [];
  for (const card of document.querySelectorAll('[data-cy="l-card"], [data-testid="l-card"]')) {
    const a = card.querySelector('a[href]'); const pt = card.querySelector('[data-testid="ad-price"]')?.innerText || '';
    const title = (card.querySelector('h4, h6, [data-cy="ad-card-title"]')?.innerText || '').trim();
    const t = pt.replace(/ | /g, ' '); const m = t.match(/(\d[\d\s]*)/); if (!m) continue;
    const usd = /у\.?\s*е|y\.?\s*e|\$|usd/i.test(t);
    out.push({ src: 'olx', title, price: +m[1].replace(/\s/g, ''), cur: usd ? 'USD' : 'UZS', url: a ? a.href.split('?')[0].split('#')[0] : '', neg: /договор|kelish/i.test(t),
      loc: card.querySelector('[data-testid="location-date"]')?.innerText || '', top: !!card.querySelector('[data-testid="adCard-featured"]'), img: card.querySelector('img')?.src || '' });
  }
  return out;
}
