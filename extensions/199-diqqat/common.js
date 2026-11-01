// Kategoriyalar: qaysi saytlar chalg'itadi
export const CATEGORIES = [
  { id: 'social', name: 'Ijtimoiy tarmoqlar', icon: '💬', on: true,
    domains: ['facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'vk.com', 'ok.ru', 'threads.net', 'snapchat.com', 'pinterest.com', 'reddit.com', 'likee.video'] },
  { id: 'video', name: 'Video va kino', icon: '🎬', on: true,
    domains: ['youtube.com', 'twitch.tv', 'rutube.ru', 'netflix.com', 'kinopoisk.ru', 'ivi.ru', 'okko.tv'] },
  { id: 'messengers', name: 'Messenjerlar', icon: '✈️', on: false,
    domains: ['web.telegram.org', 'web.whatsapp.com', 'discord.com', 'messenger.com'] },
  { id: 'news', name: 'Yangiliklar', icon: '📰', on: false,
    domains: ['kun.uz', 'daryo.uz', 'gazeta.uz', 'qalampir.uz', 'podrobno.uz', 'xabar.uz', 'nuz.uz', 'championat.com', 'sports.uz'] },
  { id: 'games', name: "O'yinlar", icon: '🎮', on: true,
    domains: ['poki.com', 'crazygames.com', 'friv.com', 'y8.com', 'roblox.com', 'miniclip.com', 'chess.com', 'lichess.org'] },
  { id: 'shopping', name: 'Onlayn xaridlar', icon: '🛍️', on: false,
    domains: ['uzum.uz', 'olx.uz', 'wildberries.ru', 'ozon.ru', 'aliexpress.com', 'temu.com', 'amazon.com'] }
];

export const DEFAULTS = {
  cats: Object.fromEntries(CATEGORIES.map(c => [c.id, c.on])),
  custom: [],
  allow: [],
  schedule: { enabled: false, days: [1, 2, 3, 4, 5], from: '09:00', to: '18:00' },
  pomo: { work: 25, short: 5, long: 15, every: 4, autoNext: false },
  strict: false,          // qat'iy rejim: seansni to'xtatib bo'lmaydi, "baribir ochish" yo'q
  emergencyMin: 5,        // "baribir ochish" necha daqiqaga
  sound: { enabled: true, type: 'bell', volume: 0.7 }
};

export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return {
    ...DEFAULTS, ...settings,
    cats: { ...DEFAULTS.cats, ...(settings.cats || {}) },
    schedule: { ...DEFAULTS.schedule, ...(settings.schedule || {}) },
    pomo: { ...DEFAULTS.pomo, ...(settings.pomo || {}) },
    sound: { ...DEFAULTS.sound, ...(settings.sound || {}) }
  };
}
export const saveSettings = s => chrome.storage.local.set({ settings: s });

export function blockedDomains(s) {
  const set = new Set(s.custom);
  for (const c of CATEGORIES) if (s.cats[c.id]) c.domains.forEach(d => set.add(d));
  return [...set];
}

export const hmToMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
export function scheduleActive(s, ms = Date.now()) {
  const sc = s.schedule;
  if (!sc.enabled) return false;
  const d = new Date(ms), m = d.getHours() * 60 + d.getMinutes();
  const a = hmToMin(sc.from), b = hmToMin(sc.to);
  if (a <= b) return sc.days.includes(d.getDay()) && m >= a && m < b;
  // tungi smena: kechqurun boshlanib ertalab tugaydi
  if (m >= a) return sc.days.includes(d.getDay());
  return m < b && sc.days.includes((d.getDay() + 6) % 7);
}

export const dayKey = (ms = Date.now()) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function fmtDur(sec) {
  const m = Math.round(sec / 60), h = Math.floor(m / 60), mm = m % 60;
  if (h && mm) return `${h} soat ${mm} daq`;
  if (h) return `${h} soat`;
  return `${mm} daq`;
}

export function cleanDomain(str) {
  let t = String(str).trim().toLowerCase();
  if (!t) return '';
  if (!/^https?:\/\//.test(t)) t = 'http://' + t;
  try { return new URL(t).hostname.replace(/^www\./, ''); } catch { return ''; }
}
export const hostMatches = (host, d) => host === d || host.endsWith('.' + d);
