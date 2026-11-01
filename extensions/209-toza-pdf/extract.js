// Sahifa ichida ishlaydi: maqolaning asosiy qismini topib, tozalangan HTML qaytaradi
function tozaPdfExtract() {
  const visible = el => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
  const JUNK = 'script, style, noscript, iframe, object, embed, svg:not(figure svg), nav, aside, footer, form, button, input, select, textarea, ' +
    '[role=navigation], [role=banner], [role=complementary], [aria-hidden=true], .share, .social, .sharing, .related, .comments, #comments, ' +
    '.advert, .ads, .ad, [class*="banner"], [class*="subscribe"], [class*="newsletter"], [class*="cookie"], [id*="cookie"], .breadcrumb, .tags';

  // 1) Asosiy blokni topish: eng ko'p xatboshi matni bor element
  function scoreOf(el) { let n = 0; for (const p of el.querySelectorAll('p')) n += p.textContent.trim().length; return n; }
  let root = null, best = 0;
  const cands = [...document.querySelectorAll('article, [itemprop=articleBody], main, [role=main], .post, .article, .entry-content, .content, #content')].filter(visible);
  for (const el of (cands.length ? cands : document.querySelectorAll('div, section'))) {
    const s = scoreOf(el);
    if (s > best) { best = s; root = el; }
  }
  if (!root || best < 200) root = document.body;
  // Juda katta konteyner tanlangan bo'lsa — ichidagi eng zich bolasiga tushamiz
  for (let i = 0; i < 4; i++) {
    const kids = [...root.children].filter(visible);
    const top = kids.map(k => [k, scoreOf(k)]).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > best * 0.75 && top[0].querySelectorAll('p').length >= 2) { root = top[0]; best = top[1]; } else break;
  }

  // 2) Nusxa olib tozalaymiz
  const clone = root.cloneNode(true);
  clone.querySelectorAll(JUNK).forEach(e => e.remove());
  const KEEP = { A: ['href'], IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'], OL: ['start'] };
  const ALLOWED = /^(P|H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|CODE|TABLE|THEAD|TBODY|TR|TD|TH|FIGURE|FIGCAPTION|IMG|A|B|STRONG|I|EM|U|BR|HR|SUP|SUB|SPAN|DIV|SECTION|DL|DT|DD|MARK|SMALL|PICTURE|CAPTION)$/;

  // Rasmlar: lazy-load manzillari, srcset dan eng kattasi
  clone.querySelectorAll('img').forEach(img => {
    const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
    let src = lazy || img.getAttribute('src') || '';
    const ss = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    if (ss) { const last = ss.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean).pop(); if (last) src = last; }
    try { src = new URL(src, location.href).href; } catch {}
    if (!src || src.startsWith('data:image/gif') || /pixel|spacer|1x1/.test(src)) { img.remove(); return; }
    img.setAttribute('src', src);
  });
  clone.querySelectorAll('picture source').forEach(s => s.remove());

  const walk = el => {
    for (const child of [...el.children]) {
      if (!ALLOWED.test(child.tagName)) { child.replaceWith(...child.childNodes); continue; }
      for (const a of [...child.attributes]) if (!(KEEP[child.tagName] || []).includes(a.name)) child.removeAttribute(a.name);
      if (child.tagName === 'A') { try { child.setAttribute('href', new URL(child.getAttribute('href') || '', location.href).href); } catch { child.removeAttribute('href'); } }
      walk(child);
    }
  };
  // replaceWith natijasida yangi bolalar paydo bo'ladi — bir necha marta aylanamiz
  for (let i = 0; i < 3; i++) walk(clone);
  // Bo'sh bloklarni o'chirish
  clone.querySelectorAll('p, div, span, li, section, figure').forEach(e => { if (!e.textContent.trim() && !e.querySelector('img, table')) e.remove(); });

  // 3) Sarlavha va ma'lumotlar
  const h1 = document.querySelector('h1');
  const title = (document.querySelector('meta[property="og:title"]')?.content || h1?.innerText || document.title || '').trim();
  const firstH1 = clone.querySelector('h1');
  if (firstH1 && firstH1.textContent.trim() === title) firstH1.remove();
  const author = document.querySelector('meta[name=author]')?.content || document.querySelector('[rel=author], .author, .byline')?.innerText?.trim() || '';
  const dateRaw = document.querySelector('meta[property="article:published_time"]')?.content || document.querySelector('time[datetime]')?.getAttribute('datetime') || '';
  const site = document.querySelector('meta[property="og:site_name"]')?.content || location.hostname.replace(/^www\./, '');
  const lead = document.querySelector('meta[property="og:image"]')?.content || '';
  return { title, author: author.slice(0, 80), date: dateRaw, site, url: location.href, html: clone.innerHTML, lead, words: clone.textContent.trim().split(/\s+/).length };
}
