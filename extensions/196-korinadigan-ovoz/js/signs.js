// Imo-ishora lug'ati yordamchilari (subtitr oynasi va boshqaruv sahifasi uchun umumiy, oddiy skript)
(function (g) {
  if (g.OvozSigns) return;
  const APOS = /[ʻʼ`’‘]/g;

  function norm(w) {
    return String(w || '').toLowerCase().replace(APOS, "'")
      .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '').replace(/^'+|'+$/g, '');
  }

  const C2L = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
    ъ: "'", ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h'
  };
  const L2C_DI = [["o'", 'ў'], ["g'", 'ғ'], ['sh', 'ш'], ['ch', 'ч'], ['yo', 'ё'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'], ['ng', 'нг']];
  const L2C = {
    a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
    p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', "'": 'ъ', c: 'с', w: 'в'
  };

  const isCyr = w => /[Ѐ-ӿ]/.test(w);
  const cyrToLat = w => [...w].map(c => C2L[c] ?? c).join('');

  // Lotin so'zni harf birliklariga bo'lish (sh, ch, o', g' — bitta harf)
  function latUnits(w) {
    const out = [];
    let i = 0;
    while (i < w.length) {
      const d = L2C_DI.find(([k]) => k !== 'ng' && w.startsWith(k, i));
      if (d) { out.push([d[0], d[1]]); i += d[0].length; continue; }
      out.push([w[i], L2C[w[i]] || w[i]]); i++;
    }
    return out;
  }
  const latToCyr = w => latUnits(w).map(u => u[1]).join('');

  function wordKeys(w) {
    const n = norm(w);
    if (!n) return [];
    if (isCyr(n)) { const l = cyrToLat(n); return [n, l, l.replace(/x/g, 'h')]; } // х/ҳ farqi
    return [n, latToCyr(n)];
  }

  function lookupWord(dict, w) {
    const words = (dict && dict.words) || {};
    for (const k of wordKeys(w)) if (words[k]) return words[k];
    return null;
  }

  // Daktil: har bir harf uchun rasm (bo'lmasa — katta harf)
  function spell(dict, w) {
    const n = norm(w);
    const letters = (dict && dict.letters) || {};
    const units = isCyr(n) ? [...n].map(c => [c, c]) : latUnits(n);
    return units
      .filter(u => /[\p{L}\p{N}]/u.test(u[0]))
      .map(([label, cyr]) => ({ label: label.toUpperCase(), media: letters[label] || letters[cyr] || letters[C2L[label]] || null, letter: true }));
  }

  // Matnni ko'rsatish navbatiga aylantirish
  function sequence(dict, text, fingerspell) {
    const out = [];
    for (const raw of String(text || '').split(/\s+/)) {
      const n = norm(raw);
      if (!n) continue;
      const m = lookupWord(dict, n);
      if (m) out.push({ label: n, media: m, letter: false });
      else if (fingerspell) out.push({ label: n, spelled: spell(dict, n), letter: false });
    }
    return out;
  }

  g.OvozSigns = { norm, wordKeys, lookupWord, spell, sequence, cyrToLat, latToCyr, isCyr };
})(globalThis);
