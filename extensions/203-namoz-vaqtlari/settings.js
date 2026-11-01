import { ALL_PLACES, findPlace, fullName } from './regions.js';

export const DEFAULT_PLACE = 'tsh|s|Toshkent (markaz)';

export const DEFAULTS = {
  cityId: DEFAULT_PLACE,   // "hudud|s|nomi" yoki "custom"
  custom: null,            // { name, lat, lng } — "Joylashuvim" tanlanganda
  fajrAngle: 15,           // Bomdod: quyosh ufqdan necha gradus pastda
  ishaAngle: 15,           // Xufton
  asrFactor: 2,            // 2 = Hanafiy, 1 = Shofi'iy
  adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, // daqiqa tuzatish
  notify: true,
  notifyBefore: 10,
  notifySunrise: false,
  persistent: false
};

// 1.0 versiyadagi eski id'larni yangisiga o'tkazish
const LEGACY = {
  toshkent: DEFAULT_PLACE, andijon: 'and|s|Andijon', namangan: 'nam|s|Namangan', fargona: "far|s|Farg'ona",
  qoqon: "far|s|Qo'qon", margilon: "far|s|Marg'ilon", guliston: 'sir|s|Guliston', jizzax: 'jiz|s|Jizzax',
  samarqand: 'sam|s|Samarqand', qarshi: 'qash|s|Qarshi', shahrisabz: 'qash|s|Shahrisabz', termiz: 'sur|s|Termiz',
  denov: 'sur|s|Denov', navoiy: 'nav|s|Navoiy', zarafshon: 'nav|s|Zarafshon', buxoro: 'bux|s|Buxoro',
  urganch: 'xor|s|Urganch', xiva: 'xor|s|Xiva', nukus: 'qqr|s|Nukus', chirchiq: 'tsv|s|Chirchiq',
  angren: 'tsv|s|Angren', olmaliq: 'tsv|s|Olmaliq'
};

export async function loadSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  s.adj = { ...DEFAULTS.adj, ...(s.adj || {}) };
  if (LEGACY[s.cityId]) {
    s.cityId = LEGACY[s.cityId];
    chrome.storage.sync.set({ cityId: s.cityId });
  }
  return s;
}

// { name, full, lat, lng }
export function currentPlace(s) {
  if (s.cityId === 'custom' && s.custom) return { ...s.custom, full: s.custom.name };
  const p = findPlace(s.cityId) || findPlace(DEFAULT_PLACE);
  return { ...p, full: fullName(p) };
}

export function nearestPlace(lat, lng) {
  const R = 6371, r = Math.PI / 180;
  const dist = p => {
    const dLat = (p.lat - lat) * r, dLng = (p.lng - lng) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * r) * Math.cos(p.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  let best = ALL_PLACES[0], bd = Infinity;
  for (const p of ALL_PLACES) { const d = dist(p); if (d < bd) { bd = d; best = p; } }
  return { place: best, km: bd };
}
