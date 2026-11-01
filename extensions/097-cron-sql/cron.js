const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'], KUNLAR = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const ALIAS = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
const NAMES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function field(s, lo, hi, nm) {
  s = s.toLowerCase().replace(/[a-z]{3}/g, m => NAMES[m] ?? m); if (s === '?') s = '*'; const set = new Set();
  for (const part of s.split(',')) { const m = part.match(/^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/); if (!m) throw new Error(`«${part}» — noto'g'ri qism (${nm})`);
    let a = m[1] === '*' ? lo : +m[2], b = m[1] === '*' ? hi : m[3] != null ? +m[3] : (m[4] ? hi : a); const st = m[4] ? +m[4] : 1;
    if (a < lo || b > hi || a > b && !(nm === 'hafta kuni')) throw new Error(`${nm}: ${lo}–${hi} oralig'ida bo'lishi kerak`); if (!st) throw new Error('Qadam 0 bo\'lmaydi');
    for (let i = a; i <= b; i += st) set.add(nm === 'hafta kuni' && i === 7 ? 0 : i); }
  return { set, all: s === '*', raw: s };
}
function parseCron(expr) {
  let e = expr.trim(); e = ALIAS[e.toLowerCase()] || e; let p = e.split(/\s+/), sec = null;
  if (p.length === 6) { sec = field(p.shift(), 0, 59, 'soniya'); } if (p.length === 7) { sec = field(p.shift(), 0, 59, 'soniya'); p.pop(); }
  if (p.length !== 5) throw new Error('5 ta maydon kerak: daqiqa soat kun oy hafta_kuni');
  return { sec, min: field(p[0], 0, 59, 'daqiqa'), hour: field(p[1], 0, 23, 'soat'), dom: field(p[2], 1, 31, 'oy kuni'), mon: field(p[3], 1, 12, 'oy'), dow: field(p[4], 0, 7, 'hafta kuni'), p };
}
const list = (arr, f = x => x) => { const a = [...arr].map(f); return a.length <= 2 ? a.join(' va ') : a.slice(0, -1).join(', ') + ' va ' + a[a.length - 1]; };
const pad = n => String(n).padStart(2, '0');
function describe(c) {
  const step = (raw, unit) => { const m = raw.match(/^\*\/(\d+)$/) || raw.match(/^0\/(\d+)$/); return m ? `har ${m[1]} ${unit}da` : null; };
  let t;
  if (c.min.all && c.hour.all) t = 'har daqiqada';
  else if (step(c.min.raw, 'daqiqa') && c.hour.all) t = step(c.min.raw, 'daqiqa');
  else if (c.hour.all) t = `har soatning ${list(c.min.set)}-daqiqasida`;
  else if (c.min.set.size === 1 && c.hour.set.size <= 6 && !/[/-]/.test(c.hour.raw)) t = `soat ${list(c.hour.set, h => `${pad(h)}:${pad([...c.min.set][0])}`)} da`;
  else { const hs = step(c.hour.raw, 'soat'); const hr = /^\d+-\d+$/.test(c.hour.raw) ? `soat ${c.hour.raw.replace('-', ':00 dan ')}:59 gacha` : hs || `soat ${list(c.hour.set, pad)} da`;
    t = `${hr}, ${c.min.all ? 'har daqiqada' : step(c.min.raw, 'daqiqa') || list(c.min.set) + '-daqiqada'}`; }
  if (c.sec && !c.sec.all) t = (step(c.sec.raw, 'soniya') || list(c.sec.set) + '-soniyada') + ', ' + t;
  const parts = [];
  if (!c.dom.all) parts.push(`oyning ${list(c.dom.set)}-kuni`);
  if (!c.dow.all) { const r = c.dow.raw; parts.push(r === '1-5' ? 'ish kunlari (dushanba–juma)' : r === '0,6' || r === '6,0' ? 'dam olish kunlari' : list([...c.dow.set].sort(), d => KUNLAR[d]) + ' kunlari'); }
  if (!c.mon.all) parts.push(list(c.mon.set, m => OYLAR[m - 1]) + ' oyida');
  return (parts.length ? parts.join(', ') + (c.dom.all || c.dow.all ? '' : ' (yoki)') + ', ' : '') + t;
}
function nextRuns(c, n = 8, from = new Date()) {
  const out = [], d = new Date(from); d.setSeconds(c.sec ? d.getSeconds() + 1 : 0, 0); if (!c.sec) d.setMinutes(d.getMinutes() + 1);
  const domStar = c.dom.all, dowStar = c.dow.all; let guard = 0;
  while (out.length < n && guard++ < 600000) {
    if (!c.mon.set.has(d.getMonth() + 1)) { d.setMonth(d.getMonth() + 1, 1); d.setHours(0, 0, 0); continue; }
    const dm = c.dom.set.has(d.getDate()), dw = c.dow.set.has(d.getDay()), dayOk = domStar && dowStar ? true : domStar ? dw : dowStar ? dm : dm || dw;
    if (!dayOk) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0); continue; }
    if (!c.hour.set.has(d.getHours())) { d.setHours(d.getHours() + 1, 0, 0); continue; }
    if (!c.min.set.has(d.getMinutes())) { d.setMinutes(d.getMinutes() + 1, 0); continue; }
    if (c.sec && !c.sec.set.has(d.getSeconds())) { d.setSeconds(d.getSeconds() + 1); continue; }
    out.push(new Date(d)); c.sec ? d.setSeconds(d.getSeconds() + 1) : d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

// Ruscha tavsif
const MES_RU = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'], DN_RU = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
function describeRu(c) {
  const lr = (arr, f = x => x) => { const a = [...arr].map(f); return a.length <= 2 ? a.join(' и ') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]; };
  const step = (raw, unit) => { const m = raw.match(/^\*\/(\d+)$/) || raw.match(/^0\/(\d+)$/); return m ? `каждые ${m[1]} ${unit}` : null; };
  let t;
  if (c.min.all && c.hour.all) t = 'каждую минуту';
  else if (step(c.min.raw, 'мин') && c.hour.all) t = step(c.min.raw, 'мин');
  else if (c.hour.all) t = `каждый час в ${lr(c.min.set)} мин`;
  else if (c.min.set.size === 1 && c.hour.set.size <= 6 && !/[/-]/.test(c.hour.raw)) t = `в ${lr(c.hour.set, h => `${pad(h)}:${pad([...c.min.set][0])}`)}`;
  else { const hs = step(c.hour.raw, 'ч'); const hr = /^\d+-\d+$/.test(c.hour.raw) ? `с ${c.hour.raw.split('-')[0]}:00 до ${c.hour.raw.split('-')[1]}:59` : hs || `в ${lr(c.hour.set, pad)} ч`;
    t = `${hr}, ${c.min.all ? 'каждую минуту' : step(c.min.raw, 'мин') || 'в ' + lr(c.min.set) + ' мин'}`; }
  if (c.sec && !c.sec.all) t = (step(c.sec.raw, 'сек') || 'на ' + lr(c.sec.set) + ' сек') + ', ' + t;
  const parts = [];
  if (!c.dom.all) parts.push(`${lr(c.dom.set)}-го числа`);
  if (!c.dow.all) { const r = c.dow.raw; parts.push(r === '1-5' ? 'по будням (пн–пт)' : r === '0,6' || r === '6,0' ? 'по выходным' : 'в ' + lr([...c.dow.set].sort(), d => DN_RU[d])); }
  if (!c.mon.all) parts.push('в ' + lr(c.mon.set, m => MES_RU[m - 1]));
  return (parts.length ? parts.join(', ') + (c.dom.all || c.dow.all ? '' : ' (или)') + ', ' : '') + t;
}
