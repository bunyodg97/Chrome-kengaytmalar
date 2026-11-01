(async () => {
  const art = new Readability(document.cloneNode(true), { charThreshold: 200 }).parse();
  const html = art?.content || `<p>${document.body.innerText.slice(0, 50000).replace(/</g, '&lt;').replace(/\n+/g, '</p><p>')}</p>`;
  // rasmlarni data URL qilish (internetsiz o'qish uchun), katta bo'lsa havola qoladi
  const box = document.createElement('div'); box.innerHTML = html;
  box.querySelectorAll('img').forEach(i => { const s = i.getAttribute('data-src') || i.getAttribute('src'); if (s) i.setAttribute('src', new URL(s, location.href).href); i.removeAttribute('srcset'); i.removeAttribute('loading'); });
  box.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', new URL(a.getAttribute('href'), location.href).href));
  let total = 0;
  await Promise.all([...box.querySelectorAll('img')].slice(0, 25).map(async i => {
    try { const r = await fetch(i.src, { credentials: 'omit' }); const b = await r.blob(); if (!b.type.startsWith('image/') || b.size > 800000 || total > 6e6) return; total += b.size;
      i.src = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }); } catch {}
  }));
  const text = box.innerText || box.textContent || '';
  return { title: art?.title || document.title, by: art?.byline || '', site: art?.siteName || location.hostname.replace(/^www\./, ''), excerpt: (art?.excerpt || text.slice(0, 200)).trim(), html: box.innerHTML, words: text.split(/\s+/).filter(Boolean).length, url: location.href, lang: document.documentElement.lang || '' };
})();
