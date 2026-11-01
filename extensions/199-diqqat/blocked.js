import { getSettings, scheduleActive, hmToMin } from './common.js';

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
let target = location.hash.slice(1);
if (target && !/^https?:/.test(target)) { try { target = decodeURIComponent(target); } catch {} }
let host = '';
try { host = new URL(target).hostname.replace(/^www\./, ''); } catch {}
$('host').textContent = host || 'Bu sayt';
document.title = `Diqqat vaqti — ${host}`;

const QUOTES = [
  'Bitta ishni oxiriga yetkazish o\'nta boshlangan ishdan afzal.',
  'Telefonni varaqlash kutadi. Bugungi maqsad kutmaydi.',
  'Diqqat — eng qimmat resurs. Uni o\'zingiz uchun sarflang.',
  'Kichik qadamlar har kuni — katta natija bir kun.',
  'Hozir 25 daqiqa sabr — kechqurun bo\'sh vaqt.',
  'Lenta cheksiz, vaqtingiz esa yo\'q.',
  'Avval ish, keyin dam. Dam olish shunda shirinroq.'
];
$('quote').textContent = `“${QUOTES[Math.floor(Math.random() * QUOTES.length)]}”`;

if (!sessionStorage.getItem('hit')) {
  sessionStorage.setItem('hit', '1');
  chrome.runtime.sendMessage({ type: 'hit' });
}

const S = await getSettings();

async function tick() {
  const { session } = await chrome.storage.local.get('session');
  const now = Date.now();
  let end = null;
  if (session?.mode === 'focus' && now < session.endsAt) { end = session.endsAt; $('leftLbl').textContent = 'Seans tugashiga'; }
  else if (scheduleActive(S, now)) {
    const d = new Date(now); const to = hmToMin(S.schedule.to);
    const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(to / 60), to % 60);
    if (e <= d) e.setDate(e.getDate() + 1);
    end = e.getTime(); $('leftLbl').textContent = `Ish vaqti tugashiga (${S.schedule.to})`;
  }
  if (!end) {                       // bloklash tugadi — saytga qaytamiz
    if (target) location.replace(target);
    return;
  }
  const sec = Math.ceil((end - now) / 1000);
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
  $('left').textContent = h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
tick();
setInterval(tick, 1000);

$('back').addEventListener('click', async () => {
  if (history.length > 1) history.back();
  else { const t = await chrome.tabs.getCurrent(); chrome.tabs.remove(t.id); }
});

// "Baribir ochish": 15 soniya o'ylab ko'rish, keyin qisqa muddatga ruxsat
if (S.strict || !host) $('anyway').classList.add('hidden');
let waiting = false;
$('anyway').addEventListener('click', async () => {
  if (waiting) return;
  if ($('anyway').dataset.ready) {
    await chrome.runtime.sendMessage({ type: 'emergency', domain: host });
    location.replace(target);
    return;
  }
  waiting = true;
  let n = 15;
  $('anyway').disabled = true;
  const iv = setInterval(() => {
    $('anyway').textContent = `O'ylab ko'ring... ${n}`;
    if (n-- <= 0) {
      clearInterval(iv); waiting = false;
      $('anyway').disabled = false;
      $('anyway').dataset.ready = '1';
      $('anyway').textContent = `${S.emergencyMin} daqiqaga ochish`;
    }
  }, 1000);
});
