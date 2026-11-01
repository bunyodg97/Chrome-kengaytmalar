async function translate(q, to = 'uz') {
  const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&dt=bd&q=${encodeURIComponent(q)}`);
  const j = await r.json();
  const main = (j[0] || []).map(x => x[0]).join('').trim();
  const alts = (j[1] || []).flatMap(b => (b[1] || []).slice(0, 4).map(w => `${w} (${b[0]})`)).slice(0, 6);
  return { tr: main, alts, lang: j[2] || '' };
}
const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];
const due = w => !w.next || w.next <= Date.now();
async function addWord(word, ctx) {
  word = word.trim().replace(/\s+/g, ' ').slice(0, 80); if (!word) return null;
  const { words = [] } = await chrome.storage.local.get('words');
  if (words.some(w => w.w.toLowerCase() === word.toLowerCase())) return { dup: true };
  let t = { tr: '', alts: [], lang: '' }; try { t = await translate(word); } catch { }
  const item = { id: Date.now(), w: word, tr: t.tr, alts: t.alts, lang: t.lang, ctx: (ctx || '').slice(0, 200), box: 0, next: 0, added: Date.now(), ok: 0, bad: 0 };
  words.unshift(item); await chrome.storage.local.set({ words }); return item;
}
