// Tarjima: Google Cloud (kalit bo'lsa) → Chrome'ning o'rnatilgan tarjimoni → Google Translate (bepul)
const cache = new Map();
const translators = new Map();

async function chromeBuiltIn(text, from, to) {
  const T = globalThis.Translator;
  if (!T || !from || from === 'auto') return null;
  const key = from + '>' + to;
  let tr = translators.get(key);
  if (!tr) {
    const av = await T.availability({ sourceLanguage: from, targetLanguage: to });
    if (av === 'unavailable') return null;
    tr = await T.create({ sourceLanguage: from, targetLanguage: to });
    translators.set(key, tr);
  }
  return tr.translate(text);
}

async function googleCloud(text, from, to, key) {
  const body = { q: text, target: to, format: 'text' };
  if (from && from !== 'auto') body.source = from;
  const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Translate ' + r.status);
  const d = await r.json();
  return d.data.translations[0].translatedText;
}

async function googleFree(text, from, to) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t'
    + '&sl=' + encodeURIComponent(from && from !== 'auto' ? from : 'auto')
    + '&tl=' + encodeURIComponent(to) + '&q=' + encodeURIComponent(text);
  const r = await fetch(url);
  if (!r.ok) throw new Error('Translate ' + r.status);
  const d = await r.json();
  const out = (d[0] || []).map(x => x[0]).join('');
  const detected = d[2];
  return { text: out, detected };
}

// Qaytaradi: tarjima matni yoki null (tarjima kerak emas / bo'lmadi)
export async function translate(text, from, to, key) {
  text = String(text || '').trim();
  if (!text || !to || from === to) return null;
  const ck = [from, to, text].join('|');
  if (cache.has(ck)) return cache.get(ck);
  let out = null;
  try {
    if (key) out = await googleCloud(text, from, to, key);
    else {
      try { out = await chromeBuiltIn(text, from, to); } catch { out = null; }
      if (out == null) {
        const g = await googleFree(text, from, to);
        out = g.detected === to ? null : g.text; // allaqachon kerakli tilda
      }
    }
  } catch (e) { console.warn('translate', e); out = null; }
  if (out && out.trim().toLowerCase() === text.toLowerCase()) out = null;
  cache.set(ck, out);
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return out;
}
