import { SITES } from './sites.js';

// ---------- Vaqt (O'zbekiston, UTC+5; server soati bilan tuzatilgan) ----------
const TZ = 5 * 3600e3;
export async function now() {
  const { timeOffset = 0 } = await chrome.storage.local.get('timeOffset');
  return Date.now() + timeOffset;
}
export const dayKey = ms => new Date(ms + TZ).toISOString().slice(0, 10);
export const minuteOfDay = ms => { const d = new Date(ms + TZ); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
export const hmToMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };

export function fmtDur(sec) {
  const m = Math.max(0, Math.floor(sec / 60));
  const h = Math.floor(m / 60), mm = m % 60;
  if (h && mm) return `${h} soat ${mm} daq`;
  if (h) return `${h} soat`;
  return `${mm} daq`;
}

// ---------- Sozlamalar ----------
export const DEFAULT_SETTINGS = {
  blockAdult: true,
  blockGambling: true,
  safeSearch: true,
  protectExtensions: true,
  closeIncognito: false,
  limits: { youtube: 60, tiktok: 30, instagram: 30 },   // daqiqa; 0 = butunlay bloklash
  customSites: [],                                      // [{id, name, icon, domains}]
  totalLimit: null,                                     // umumiy kunlik internet vaqti, daqiqa
  bedtime: { enabled: false, from: '22:00', to: '07:00' },
  blocklist: [],
  allowlist: []
};

export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return {
    ...DEFAULT_SETTINGS, ...settings,
    bedtime: { ...DEFAULT_SETTINGS.bedtime, ...(settings.bedtime || {}) },
    limits: settings.limits ?? DEFAULT_SETTINGS.limits
  };
}
export const saveSettings = s => chrome.storage.local.set({ settings: s });

// ---------- Kunlik foydalanish ----------
export async function getUsage(ms) {
  const { usage } = await chrome.storage.local.get('usage');
  const date = dayKey(ms);
  if (!usage || usage.date !== date) return { date, sites: {}, total: 0, bonus: {}, bedtimeOffUntil: 0 };
  return { bonus: {}, sites: {}, bedtimeOffUntil: 0, ...usage };
}

// ---------- Sayt moslash ----------
export const allSites = s => [...SITES, ...(s.customSites || [])];
export const hostMatches = (host, d) => host === d || host.endsWith('.' + d);
export function hostOf(url) {
  try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.replace(/^www\./, '') : null; }
  catch { return null; }
}
export const siteForHost = (host, s) => host ? allSites(s).find(x => x.domains.some(d => hostMatches(host, d))) : null;

export function cleanDomain(str) {
  let t = String(str).trim().toLowerCase();
  if (!t) return '';
  if (!/^https?:\/\//.test(t)) t = 'http://' + t;
  try { return new URL(t).hostname.replace(/^www\./, ''); } catch { return ''; }
}

// Sayt holati: 'none' | 'ok' | 'limit' | 'blocked'
export function siteState(site, s, usage) {
  const lim = s.limits[site.id];
  if (lim === 0) return 'blocked';
  if (lim == null) return 'none';
  return (usage.sites[site.id] || 0) >= lim * 60 + (usage.bonus[site.id] || 0) ? 'limit' : 'ok';
}
export function siteLeft(site, s, usage) {
  const lim = s.limits[site.id];
  if (lim == null || lim === 0) return null;
  return lim * 60 + (usage.bonus[site.id] || 0) - (usage.sites[site.id] || 0);
}

export function inBedtime(s, ms) {
  if (!s.bedtime.enabled) return false;
  const m = minuteOfDay(ms), a = hmToMin(s.bedtime.from), b = hmToMin(s.bedtime.to);
  return a <= b ? (m >= a && m < b) : (m >= a || m < b);
}

// Hamma saytni yopadigan sabab: 'bedtime' | 'total' | null
export function globalReason(s, usage, ms) {
  if (inBedtime(s, ms) && !(usage.bedtimeOffUntil > ms)) return 'bedtime';
  if (s.totalLimit != null && usage.total >= s.totalLimit * 60 + (usage.bonus.__total || 0)) return 'total';
  return null;
}

// URL uchun bloklash sababi (ochiq tablarni yopish uchun)
export function blockReasonForUrl(url, s, usage, ms) {
  const host = hostOf(url);
  if (!host) return null;
  if (s.allowlist.some(d => hostMatches(host, d))) return null;
  const g = globalReason(s, usage, ms);
  if (g) return { r: g };
  if (s.blocklist.some(d => hostMatches(host, d))) return { r: 'custom' };
  const site = siteForHost(host, s);
  if (site) {
    const st = siteState(site, s, usage);
    if (st === 'limit' || st === 'blocked') return { r: st, s: site.id };
  }
  return null;
}

// ---------- PIN ----------
async function sha(str) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function hasPin() { return !!(await chrome.storage.local.get('pin')).pin; }
export async function setPin(p) {
  const salt = crypto.randomUUID();
  await chrome.storage.local.set({ pin: { salt, hash: await sha(salt + p) } });
}
export async function verifyPin(p) {
  const { pin, pinFails = { n: 0, until: 0 } } = await chrome.storage.local.get(['pin', 'pinFails']);
  if (Date.now() < pinFails.until) return { ok: false, wait: Math.ceil((pinFails.until - Date.now()) / 1000) };
  if (pin && await sha(pin.salt + p) === pin.hash) {
    await chrome.storage.local.set({ pinFails: { n: 0, until: 0 } });
    return { ok: true };
  }
  const n = pinFails.n + 1;
  if (n >= 5) {
    await chrome.storage.local.set({ pinFails: { n: 0, until: Date.now() + 5 * 60e3 } });
    return { ok: false, wait: 300 };
  }
  await chrome.storage.local.set({ pinFails: { n, until: 0 } });
  return { ok: false, left: 5 - n };
}
export function pinError(res) {
  if (res.wait) return `Ko'p marta xato kiritildi. ${Math.ceil(res.wait / 60)} daqiqadan keyin urinib ko'ring.`;
  return `PIN noto'g'ri. Yana ${res.left} ta urinish qoldi.`;
}
