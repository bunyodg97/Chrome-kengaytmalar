let R, t = 'h';
function inline() { // klasslarni style="" ga aylantirish
  const d = new DOMParser().parseFromString(`<style>${R.css}</style>${R.html}`, 'text/html'), map = {};
  R.css.replace(/\.(\w+)\s*\{([^}]*)\}/g, (m, c, b) => map[c] = b.trim().replace(/\s*\n\s*/g, ' '));
  d.body.querySelectorAll('[class]').forEach(e => { const st = e.getAttribute('class').split(' ').map(c => map[c] || '').join(' ').trim(); if (st) e.setAttribute('style', st); if (!/::/.test(R.css) || !e.getAttribute('class').split(' ').some(c => R.css.includes('.' + c + '::'))) e.removeAttribute('class'); });
  return d.body.innerHTML.replace(/^<style>[\s\S]*?<\/style>/, '');
}
const full = () => `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><style>\n${R.fonts}\nbody{margin:0;padding:24px;background:${R.bg && R.bg !== 'rgba(0, 0, 0, 0)' ? R.bg : '#fff'}}\n${R.css}\n</style></head><body>\n${R.html}\n</body></html>`;
function show() { $('#code').value = $('#inl').checked ? (t === 'h' ? inline() : '/* Inline rejimda CSS HTML ichida */') : t === 'h' ? R.html : R.css; }
(async () => { R = await store.get('result', null); if (!R) { $('#meta').textContent = 'Ma\'lumot yo\'q'; return; }
  $('#meta').textContent = `${R.w}×${R.h}px · ${R.nodes} tugun · ${new URL(R.url).hostname}`; $('#pv').srcdoc = full(); show(); })();
$$('#tb button').forEach(b => b.onclick = () => { t = b.dataset.t; $$('#tb button').forEach(x => x.classList.toggle('on', x === b)); show(); });
$('#inl').onchange = show;
$('#cAll').onclick = () => copyText($('#inl').checked ? inline() : `<style>\n${R.css}\n</style>\n${R.html}`);
$('#cH').onclick = () => copyText($('#inl').checked ? inline() : R.html); $('#cC').onclick = () => copyText(R.css);
$('#dl').onclick = () => download('element.html', full(), 'text/html');
