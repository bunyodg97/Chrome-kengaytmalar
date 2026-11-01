// Namoz vaqtlarini astronomik hisoblash (internetsiz).
// O'zbekiston vaqti: UTC+5, yozgi vaqt yo'q.

export const TZ = 5;

export const EVENTS = [
  { id: 'fajr',    name: 'Bomdod' },
  { id: 'sunrise', name: 'Quyosh' },
  { id: 'dhuhr',   name: 'Peshin' },
  { id: 'asr',     name: 'Asr' },
  { id: 'maghrib', name: 'Shom' },
  { id: 'isha',    name: 'Xufton' }
];

const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const sin = d => Math.sin(rad(d)), cos = d => Math.cos(rad(d)), tan = d => Math.tan(rad(d));
const asin = x => deg(Math.asin(x)), acos = x => deg(Math.acos(Math.max(-1, Math.min(1, x))));
const atan2 = (y, x) => deg(Math.atan2(y, x)), acot = x => deg(Math.atan(1 / x));
const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPos(jd) {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fix(RA, 24) };
}

// Bitta kun uchun vaqtlar (soat, o'nlik kasr ko'rinishida, O'zbekiston vaqti)
function computeHours(y, m, d, lat, lng, s) {
  const jDate = julian(y, m, d) - lng / (15 * 24);
  const midDay = t => fix(12 - sunPos(jDate + t).eqt, 24);
  const angleTime = (angle, t, ccw) => {
    const decl = sunPos(jDate + t).decl;
    const T = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    return midDay(t) + (ccw ? -T : T);
  };
  const asrTime = (f, t) => {
    const decl = sunPos(jDate + t).decl;
    return angleTime(-acot(f + tan(Math.abs(lat - decl))), t);
  };

  let h = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    const t = k => h[k] / 24;
    h = {
      fajr:    angleTime(s.fajrAngle, t('fajr'), true),
      sunrise: angleTime(0.833, t('sunrise'), true),
      dhuhr:   midDay(t('dhuhr')),
      asr:     asrTime(s.asrFactor, t('asr')),
      maghrib: angleTime(0.833, t('maghrib')),
      isha:    angleTime(s.ishaAngle, t('isha'))
    };
  }
  const out = {};
  for (const k in h) out[k] = h[k] + TZ - lng / 15 + (s.adj?.[k] || 0) / 60;
  return out;
}

// O'zbekistondagi bugungi sana (kompyuter vaqt mintaqasidan qat'i nazar)
export function uzDate(ms = Date.now(), addDays = 0) {
  const d = new Date(ms + TZ * 3600e3 + addDays * 86400e3);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay() };
}

const pad = n => String(n).padStart(2, '0');

// Kun jadvali: [{id, name, ms, hm}]
export function daySchedule(place, s, date) {
  const hrs = computeHours(date.y, date.m, date.d, place.lat, place.lng, s);
  const base = Date.UTC(date.y, date.m - 1, date.d);
  return EVENTS.map(e => {
    const mins = Math.round(hrs[e.id] * 60);
    const ms = base + (mins - TZ * 60) * 60e3;
    const name = (e.id === 'dhuhr' && date.wd === 5) ? 'Juma' : e.name;
    return { id: e.id, name, ms, hm: `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}` };
  });
}

// Hozirgi holat: bugungi jadval, oldingi va keyingi voqea
export function status(place, s, now = Date.now()) {
  const today = daySchedule(place, s, uzDate(now));
  const tomorrow = daySchedule(place, s, uzDate(now, 1));
  const yesterday = daySchedule(place, s, uzDate(now, -1));
  const all = [...yesterday, ...today, ...tomorrow];
  const idx = all.findIndex(e => e.ms > now);
  return { today, tomorrow, next: all[idx], prev: all[idx - 1], all };
}

export function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(total / 60), m = total % 60;
  if (h === 0) return `${m} daqiqa`;
  return m ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

// Hijriy sana (o'zbekcha oy nomlari bilan)
const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabiul avval', 'Rabiul oxir', 'Jumodul avval', 'Jumodul oxir',
  'Rajab', "Sha'bon", 'Ramazon', 'Shavvol', "Zulqa'da", 'Zulhijja'];
export function hijri(ms = Date.now()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',
      { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Tashkent' }).formatToParts(new Date(ms));
    const get = t => parseInt(parts.find(p => p.type === t)?.value, 10);
    return `${get('day')} ${HIJRI_MONTHS[get('month') - 1]} ${get('year')} h.`;
  } catch { return ''; }
}
