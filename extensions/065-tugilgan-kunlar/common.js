// p: {id, name, d:'MM-DD', y:year|null, rel, note}
function nextDate(p, from = new Date()) {
  const [m, d] = p.d.split('-').map(Number); const t = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let n = new Date(t.getFullYear(), m - 1, d); if (m === 2 && d === 29 && n.getMonth() !== 1) n = new Date(t.getFullYear(), 1, 28);
  if (n < t) { n = new Date(t.getFullYear() + 1, m - 1, d); if (m === 2 && d === 29 && n.getMonth() !== 1) n = new Date(t.getFullYear() + 1, 1, 28); }
  return { date: n, days: Math.round((n - t) / 864e5), age: p.y ? n.getFullYear() - p.y : null };
}
const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const fmtD = p => { const [m, d] = p.d.split('-').map(Number); return `${d}-${OYLAR[m - 1]}`; };
const TABRIK = {
  uz: [
    n => `Hurmatli ${n}! Tug'ilgan kuningiz muborak bo'lsin! Sizga mustahkam sog'lik, oilaviy baxt, ishlaringizda omad va barcha orzularingiz ushalishini tilayman!`,
    n => `${n}, tug'ilgan kuning bilan! 🎉 Hayoting quvonch va kulgiga to'la bo'lsin, har bir kuning bugungidek bayramona o'tsin!`,
    n => `Aziz ${n}! Yangi yoshingiz muborak! Alloh umringizni uzoq, rizqingizni keng, xonadoningizni fayzli qilsin. Doim sog' va baxtli bo'ling!`,
    n => `${n}, tabriklayman! Yangi yoshing yangi g'alabalar, yangi do'stlar va unutilmas lahzalar olib kelsin. Omadingni bersin! 🎂`,
    n => `Hurmatli ${n}! Jamoamiz nomidan tug'ilgan kuningiz bilan chin qalbdan tabriklaymiz. Kasbiy yutuqlar, salomatlik va ezgu niyatlaringiz ro'yobga chiqishini tilaymiz.`
  ],
  ru: [
    n => `${n}, с днём рождения! Желаю крепкого здоровья, счастья, успехов во всём и исполнения всех желаний! 🎉`,
    n => `Дорогой(ая) ${n}! Поздравляю с днём рождения! Пусть каждый день приносит радость, а рядом всегда будут близкие люди.`,
    n => `Уважаемый(ая) ${n}! От всей команды поздравляем Вас с днём рождения! Профессиональных побед, благополучия и вдохновения!`
  ],
  en: [
    n => `Happy birthday, ${n}! Wishing you health, happiness and a year full of wonderful surprises! 🎉`,
    n => `Dear ${n}, happy birthday! May all your dreams come true and every day be as bright as today.`,
    n => `Happy birthday, ${n}! On behalf of the whole team — wishing you success, growth and a fantastic year ahead.`
  ]
};
