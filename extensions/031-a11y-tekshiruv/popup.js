function audit() {
  document.querySelectorAll('[data-a11y]').forEach(e => e.removeAttribute('data-a11y'));
  let id = 0; const out = {};
  const add = (rule, el, msg) => { const k = ++id; el?.setAttribute?.('data-a11y', k); (out[rule] = out[rule] || []).push({ k, msg, tag: el ? `<${el.tagName.toLowerCase()}${el.id ? ' id="' + el.id + '"' : ''}${el.className && typeof el.className === 'string' ? ' class="' + el.className.split(' ').slice(0, 2).join(' ') + '"' : ''}>` : '' }); };
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const name = el => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && el.getAttribute('aria-labelledby').split(' ').map(i => document.getElementById(i)?.textContent).join(' ')) || el.innerText || el.value || el.title || el.querySelector('img[alt]')?.alt || el.querySelector('svg title')?.textContent || '').trim();
  if (!document.documentElement.lang) add('lang', null, '<html> tegida lang atributi yo\'q (masalan lang="uz")');
  if (!document.title.trim()) add('title', null, 'Sahifa sarlavhasi (title) bo\'sh');
  document.querySelectorAll('img').forEach(i => { if (!i.hasAttribute('alt') && vis(i)) add('alt', i, 'Rasmda alt yo\'q: ' + (i.currentSrc || i.src).split('/').pop().slice(0, 50)); });
  document.querySelectorAll('button, [role=button], a[href], [role=link]').forEach(b => { if (vis(b) && !name(b)) add('name', b, (b.tagName === 'A' ? 'Havola' : 'Tugma') + ' nomsiz (ekran o\'quvchi uni o\'qiy olmaydi)'); });
  document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea').forEach(f => {
    if (!vis(f)) return; const lb = (f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`)) || f.closest('label');
    if (!lb && !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby') && !f.title) add('label', f, 'Maydon uchun label yo\'q' + (f.placeholder ? ` (placeholder: «${f.placeholder.slice(0, 30)}» yetarli emas)` : ''));
  });
  let prev = 0; document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => { if (!vis(h)) return; const l = +h.tagName[1]; if (prev && l > prev + 1) add('head', h, `Sarlavha darajasi sakradi: H${prev} dan keyin H${l}`); prev = l; });
  if (![...document.querySelectorAll('h1')].some(vis)) add('head', null, 'Sahifada ko\'rinadigan H1 yo\'q');
  const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); Object.entries(ids).filter(([, n]) => n > 1).slice(0, 30).forEach(([i, n]) => add('dup', document.getElementById(i), `id="${i}" ${n} marta takrorlangan`));
  document.querySelectorAll('[tabindex]').forEach(e => { if (+e.getAttribute('tabindex') > 0) add('tab', e, `tabindex="${e.getAttribute('tabindex')}" — Tab tartibini buzadi`); });
  document.querySelectorAll('a[href], button, input[type=checkbox], input[type=radio]').forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(); if ((r.width < 24 || r.height < 24) && e.closest('p,li') === null && !e.innerText.trim().includes(' ')) add('target', e, `Juda kichik bosish maydoni: ${Math.round(r.width)}×${Math.round(r.height)} px (kamida 24×24)`); });
  // kontrast
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== 'none') return null; const c = parse(s.backgroundColor); if (c && c.a > 0.9) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (checked > 1500) break;
    if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1) || !vis(el)) continue;
    checked++;
    const s = getComputedStyle(el), fg = parse(s.color), bg = bgOf(el); if (!fg || !bg) continue;
    const blend = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const L1 = lum(blend), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(s.fontSize), bold = +s.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66);
    if (ratio < (large ? 3 : 4.5)) add('contrast', el, `Kontrast ${ratio.toFixed(2)}:1 (kerak ${large ? '3' : '4.5'}:1) — «${el.innerText.trim().slice(0, 40)}»`);
  }
  return out;
}
const RULES = { contrast: ['Rang kontrasti past', 3], alt: ['Rasmlarda alt matn yo\'q', 3], name: ['Nomsiz tugma va havolalar', 3], label: ['Label\'siz forma maydonlari', 3],
  lang: ['Sahifa tili ko\'rsatilmagan', 2], title: ['Sahifa sarlavhasi yo\'q', 2], head: ['Sarlavhalar tuzilishi', 1], dup: ['Takrorlangan id', 1], tab: ['Musbat tabindex', 1], target: ['Kichik bosish maydonlari', 1] };
let tab;
async function run() {
  tab = await activeTab();
  let r; try { [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: audit }); } catch { $('.wrap').innerHTML = '<div class="empty">Bu sahifani tekshirib bo\'lmaydi.</div>'; return; }
  const res = r.result, keys = Object.keys(RULES).filter(k => res[k]);
  const pen = keys.reduce((a, k) => a + RULES[k][1] * Math.min(10, res[k].length), 0);
  const sc = Math.max(0, 100 - pen); const col = sc >= 85 ? 'var(--ok)' : sc >= 60 ? 'var(--warn)' : 'var(--bad)';
  $('#score').textContent = sc; $('#score').style.color = col;
  $('#sum').textContent = keys.length ? `${keys.reduce((a, k) => a + res[k].length, 0)} ta muammo, ${keys.length} turdagi` : 'Avtomatik tekshiruvda muammo topilmadi.';
  $('#out').innerHTML = keys.sort((a, b) => RULES[b][1] - RULES[a][1]).map(k => `<details class="g"><summary><span class="chip ${RULES[k][1] === 3 ? 'bad' : RULES[k][1] === 2 ? 'warn' : ''}">${res[k].length}</span><span class="grow">${RULES[k][0]}</span></summary>
    ${res[k].slice(0, 60).map(i => `<div class="iss" data-k="${i.k}">${esc(i.msg)}<br><code>${esc(i.tag)}</code></div>`).join('')}</details>`).join('');
}
$('#out').onclick = e => { const it = e.target.closest('[data-k]'); if (!it) return;
  chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [it.dataset.k], func: k => {
    document.querySelectorAll('[data-a11y-hl]').forEach(e => { e.style.outline = e.dataset.a11yHl; e.removeAttribute('data-a11y-hl'); });
    const el = document.querySelector(`[data-a11y="${k}"]`); if (!el) return;
    el.dataset.a11yHl = el.style.outline; el.style.outline = '3px solid #e53935'; el.style.outlineOffset = '2px'; el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } }); };
$('#re').onclick = run; run();
