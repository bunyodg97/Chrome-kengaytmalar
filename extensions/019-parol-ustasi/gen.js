const SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', num: '0123456789', sym: '!@#$%^&*()-_=+[]{};:,.?/' };
const SIMILAR = /[Il1O0o]/g;
const WORDS = ['olma', 'nok', 'tog', 'daryo', 'kitob', 'quyosh', 'oy', 'yulduz', 'bulut', 'shamol', 'qalam', 'daftar', 'maktab', 'bahor', 'yoz', 'kuz', 'qish',
  'gul', 'lola', 'chinor', 'archa', 'baliq', 'burgut', 'lochin', 'arslon', 'yo\'lbars', 'tulki', 'quyon', 'ot', 'tuya', 'non', 'choy', 'osh', 'somsa', 'anor',
  'uzum', 'qovun', 'tarvuz', 'shaftoli', 'o\'rik', 'gilos', 'yong\'oq', 'bodom', 'piyola', 'choynak', 'eshik', 'deraza', 'ko\'cha', 'shahar', 'qishloq',
  'bozor', 'temir', 'oltin', 'kumush', 'mis', 'tosh', 'qum', 'dengiz', 'ko\'l', 'buloq', 'yomg\'ir', 'qor', 'muz', 'olov', 'nur', 'soya', 'tong', 'kech',
  'yo\'l', 'ko\'prik', 'minora', 'gumbaz', 'bog\'', 'dala', 'ariq', 'tegirmon', 'karvon', 'sandiq', 'gilam', 'do\'ppi', 'chopon', 'kamalak', 'sayyora'].map(w => w.replace(/'/g, ''));
const rand = n => { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
function generate(o) {
  if (o.mode === 'pin') return Array.from({ length: o.len }, () => rand(10)).join('');
  if (o.mode === 'words') {
    const n = Math.max(3, Math.round(o.len / 6)), w = Array.from({ length: n }, () => WORDS[rand(WORDS.length)]);
    const ci = rand(n), out = w.map((x, i) => i === ci ? x[0].toUpperCase() + x.slice(1) : x); return out.join(o.sep ?? '-') + (o.num ? rand(100) : '');
  }
  let pool = '', must = [];
  for (const k of ['lower', 'upper', 'num', 'sym']) if (o[k]) { let s = SETS[k]; if (o.noSimilar) s = s.replace(SIMILAR, ''); pool += s; must.push(s); }
  if (!pool) pool = SETS.lower;
  const chars = Array.from({ length: o.len }, () => pool[rand(pool.length)]);
  must.forEach(s => { if (!chars.some(c => s.includes(c))) chars[rand(chars.length)] = s[rand(s.length)]; });
  return chars.join('');
}
function strength(p) {
  if (!p) return { bits: 0, score: 0 };
  let pool = 0; if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^a-zA-Z0-9]/.test(p)) pool += 32;
  let bits = p.length * Math.log2(pool || 1);
  const warn = [];
  if (/(.)\1{2,}/.test(p)) { bits -= 10; warn.push("Bir xil belgi ketma-ket takrorlangan"); }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv|йцук)/i.test(p)) { bits -= 15; warn.push("Klaviatura yoki raqamlar ketma-ketligi bor"); }
  if (/^(password|parol|qwerty|admin|123456|111111|iloveyou|salom|toshkent)/i.test(p)) { bits = Math.min(bits, 10); warn.push("Juda keng tarqalgan parol"); }
  if (/(19|20)\d\d/.test(p)) { bits -= 6; warn.push("Yil (tug'ilgan yil?) bor — oson topiladi"); }
  if (/^\+?998\d{9}$|^\d{9}$/.test(p)) { bits = Math.min(bits, 12); warn.push("Telefon raqamga o'xshaydi"); }
  if (p.length < 12) warn.push("Kamida 12 belgi tavsiya etiladi");
  bits = Math.max(0, bits);
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const secs = Math.pow(2, bits) / 1e10;
  return { bits: Math.round(bits), score, warn, time: crack(secs) };
}
function crack(s) {
  if (s < 1) return 'bir zumda'; if (s < 60) return Math.round(s) + ' soniya'; if (s < 3600) return Math.round(s / 60) + ' daqiqa';
  if (s < 86400) return Math.round(s / 3600) + ' soat'; if (s < 3.15e7) return Math.round(s / 86400) + ' kun'; if (s < 3.15e9) return Math.round(s / 3.15e7) + ' yil';
  if (s < 3.15e12) return Math.round(s / 3.15e9) + ' asr'; return 'milliardlab yil';
}
const DEF = { mode: 'random', len: 16, lower: true, upper: true, num: true, sym: true, noSimilar: true, sep: '-' };
