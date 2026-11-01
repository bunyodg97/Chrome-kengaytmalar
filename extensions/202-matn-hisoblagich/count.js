// Matn statistikasi — popup va kontent skriptda umumiy (self.MH)
(function (g) {
  const GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  const GSM_EXT = '^{}\\[~]|€\f';
  const gsmSet = new Set(GSM), extSet = new Set(GSM_EXT);

  // SMS: GSM-7 (160/153) yoki Unicode UCS-2 (70/67)
  function sms(text) {
    let gsm = true, units = 0;
    const bad = new Set();
    for (const ch of text) {
      if (gsmSet.has(ch)) units += 1;
      else if (extSet.has(ch)) units += 2;
      else { gsm = false; bad.add(ch); }
    }
    if (!gsm) units = text.length;                      // UTF-16 birliklari
    const single = gsm ? 160 : 70, multi = gsm ? 153 : 67;
    const parts = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
    const cap = parts <= 1 ? single : parts * multi;
    return { gsm, units, parts, left: cap - units, bad: [...bad].slice(0, 12) };
  }

  // SMS uchun moslash: maxsus tutuq va tirnoqlarni oddiy belgilarga almashtirish
  function smsFriendly(text) {
    return text.replace(/[ʻʼ‘’`´]/g, "'").replace(/[“”«»„]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ');
  }

  function stats(text) {
    const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'ʻʼ‘’\-]*/gu) || [];
    const sentences = (text.match(/[^.!?…]*[\p{L}\p{N}][^.!?…]*([.!?…]+|$)/gu) || []).filter(s => s.trim()).length;
    const paras = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const lines = text ? text.split('\n').length : 0;
    const noSpace = text.replace(/\s/g, '').length;
    return {
      chars: [...text].length, noSpace, words: words.length, sentences, paras, lines,
      readMin: words.length / 200, speakMin: words.length / 130, sms: sms(text), words_: words
    };
  }

  function topWords(words, n = 8) {
    const STOP = new Set(['va', 'bu', 'bilan', 'uchun', 'ham', 'esa', 'bir', 'deb', 'emas', 'yoki', 'lekin', 'shu', 'u', 'ular', 'biz', 'siz', 'men', 'the', 'and', 'of', 'to', 'a', 'in', 'is', 'и', 'в', 'на', 'не', 'что', 'с', 'по']);
    const m = new Map();
    for (const w of words) { const k = w.toLowerCase(); if (k.length < 3 || STOP.has(k) || /^\d+$/.test(k)) continue; m.set(k, (m.get(k) || 0) + 1); }
    return [...m].sort((a, b) => b[1] - a[1]).filter(x => x[1] > 1).slice(0, n);
  }

  function fmtMin(m) {
    if (m < 1 / 60) return '0 s';
    if (m < 1) return `${Math.round(m * 60)} soniya`;
    const h = Math.floor(m / 60), mm = Math.round(m % 60);
    return h ? `${h} soat ${mm} daq` : `${Math.round(m)} daqiqa`;
  }

  g.MH = { stats, sms, smsFriendly, topWords, fmtMin };
})(self);
