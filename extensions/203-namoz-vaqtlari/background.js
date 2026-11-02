import './ru.js';
import './about-bg.js';
import { status, formatLeft, uzDate, daySchedule } from './praytime.js';
import { loadSettings, currentPlace } from './app-settings.js';

const ICON = 'icons/icon128.png';

async function updateBadge() {
  const s = await loadSettings();
  const place = currentPlace(s);
  const now = Date.now();
  const { next } = status(place, s, now);
  const left = next.ms - now;
  const mins = Math.max(0, Math.ceil(left / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  // Belgiga 4 belgigacha sig'adi: "1:25", "45m", "11h"
  const text = h >= 10 ? `${h}h` : h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`;

  let color = '#17805c';
  if (mins <= 5) color = '#d93636';
  else if (mins <= 15) color = '#e08a00';

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setTitle({
    title: `${place.full}\nKeyingi: ${next.name} — ${next.hm}\nQoldi: ${formatLeft(left)}`
  });
}

// Eslatmalarni aniq vaqtga rejalashtirish
async function scheduleNotifications() {
  const all = await chrome.alarms.getAll();
  await Promise.all(all.filter(a => a.name.startsWith('n|')).map(a => chrome.alarms.clear(a.name)));

  const s = await loadSettings();
  if (!s.notify) return;
  const place = currentPlace(s);
  const now = Date.now();
  const events = [...daySchedule(place, s, uzDate(now)), ...daySchedule(place, s, uzDate(now, 1))];

  for (const e of events) {
    if (e.id === 'sunrise' && !s.notifySunrise) continue;
    if (e.ms > now) chrome.alarms.create(`n|now|${e.id}|${e.name}|${e.hm}|${e.ms}`, { when: e.ms });
    const before = e.ms - s.notifyBefore * 60e3;
    if (s.notifyBefore > 0 && before > now)
      chrome.alarms.create(`n|before|${e.id}|${e.name}|${e.hm}|${e.ms}`, { when: before });
  }
  await chrome.storage.local.set({ scheduledFor: dayKey(now) });
}

const dayKey = ms => { const d = uzDate(ms); return `${d.y}-${d.m}-${d.d}`; };

async function showNotification(alarm) {
  const [, kind, id, name, hm, msStr] = alarm.name.split('|');
  const target = kind === 'now' ? +msStr : +msStr - (await loadSettings()).notifyBefore * 60e3;
  if (Date.now() - target > 5 * 60e3) return; // kompyuter uxlab qolgan bo'lsa — eskirgan eslatmani ko'rsatmaymiz

  const s = await loadSettings();
  const place = currentPlace(s);
  let title, message;
  if (id === 'sunrise') {
    title = kind === 'now' ? 'Quyosh chiqdi' : `Quyosh chiqishiga ${s.notifyBefore} daqiqa qoldi`;
    message = kind === 'now' ? `Bomdod vaqti tugadi · ${place.full}` : `Bomdod vaqti ${hm} da tugaydi · ${place.full}`;
  } else {
    title = kind === 'now' ? `${name} vaqti kirdi` : `${name} namoziga ${s.notifyBefore} daqiqa qoldi`;
    message = `${place.full} · ${hm}`;
  }
  chrome.notifications.create(`${alarm.name}`, {
    type: 'basic', iconUrl: ICON, title, message, priority: 2,
    requireInteraction: !!s.persistent
  });
}

async function setup() {
  await chrome.alarms.create('tick', { periodInMinutes: 0.5 });
  await updateBadge();
  await scheduleNotifications();
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'tick') {
    await updateBadge();
    const { scheduledFor } = await chrome.storage.local.get('scheduledFor');
    if (scheduledFor !== dayKey(Date.now())) await scheduleNotifications();
  } else if (alarm.name.startsWith('n|')) {
    await showNotification(alarm);
    await updateBadge();
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;
  await updateBadge();
  await scheduleNotifications();
});

chrome.notifications.onClicked.addListener(id => chrome.notifications.clear(id));

// Popup ochilganda yoki xizmat ishchisi uyg'onganda belgini yangilash
updateBadge();
