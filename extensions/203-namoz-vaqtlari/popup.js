import { status, hijri, EVENTS } from './praytime.js';
import { DEFAULTS, DEFAULT_PLACE, loadSettings, currentPlace, nearestPlace } from './settings.js';
import { REGIONS, placeId, findPlace, fullName } from './regions.js';

const $ = id => document.getElementById(id);
let S = await loadSettings();

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const pad = n => String(n).padStart(2, '0');

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

async function save(patch) {
  S = { ...S, ...patch };
  await chrome.storage.sync.set(patch);
  render();
}

// ---------- Viloyat → shahar/tuman tanlash ----------
function selectedRegionId() {
  if (S.cityId === 'custom') return 'custom';
  return (findPlace(S.cityId) || findPlace(DEFAULT_PLACE)).region.id;
}

function fillRegions() {
  const sel = $('region');
  sel.innerHTML = '';
  if (S.custom) sel.add(new Option('📍 Joylashuvim', 'custom'));
  for (const r of REGIONS) sel.add(new Option(r.name, r.id));
  sel.value = selectedRegionId();
}

function fillPlaces(regionId) {
  const sel = $('city');
  sel.innerHTML = '';
  if (regionId === 'custom') {
    sel.add(new Option(S.custom?.name || 'Joylashuvim', 'custom'));
    sel.value = 'custom';
    return;
  }
  const r = REGIONS.find(x => x.id === regionId);
  const group = (label, list, kind) => {
    const g = document.createElement('optgroup');
    g.label = label;
    for (const [n] of list) g.appendChild(new Option(n, placeId(r.id, kind, n)));
    sel.appendChild(g);
  };
  group(r.id === 'tsh' ? 'Shahar' : 'Shaharlar', r.cities, 's');
  group('Tumanlar', [...r.districts].sort((a, b) => a[0].localeCompare(b[0], 'uz')), 't');
  sel.value = findPlace(S.cityId)?.region.id === r.id ? S.cityId : placeId(r.id, 's', r.cities[0][0]);
}

$('region').addEventListener('change', e => {
  const rid = e.target.value;
  fillPlaces(rid);
  save({ cityId: rid === 'custom' ? 'custom' : $('city').value });
});
$('city').addEventListener('change', e => save({ cityId: e.target.value }));

$('locate').addEventListener('click', () => {
  const btn = $('locate');
  btn.classList.add('spin');
  navigator.geolocation.getCurrentPosition(async pos => {
    btn.classList.remove('spin');
    const { latitude: lat, longitude: lng } = pos.coords;
    const { place, km } = nearestPlace(lat, lng);
    const name = km < 10 ? fullName(place) : `${fullName(place)} yaqinida`;
    await save({ custom: { name, lat: +lat.toFixed(4), lng: +lng.toFixed(4) }, cityId: 'custom' });
    fillRegions(); fillPlaces('custom');
    toast(`Joylashuv aniqlandi: ${place.name}`);
  }, () => {
    btn.classList.remove('spin');
    toast("Joylashuvni aniqlab bo'lmadi");
  }, { timeout: 10000 });
});

// ---------- Asosiy ko'rinish ----------
function render() {
  const now = Date.now();
  const place = currentPlace(S);
  $('placeFull').textContent = place.full;
  const st = status(place, S, now);
  const { next, prev, today } = st;

  const left = Math.max(0, next.ms - now);
  const h = Math.floor(left / 3600e3), m = Math.floor(left / 60e3) % 60, sec = Math.floor(left / 1000) % 60;
  $('countdown').textContent = `${pad(h)}:${pad(m)}:${pad(sec)}`;

  const isSun = next.id === 'sunrise';
  $('nextName').textContent = isSun ? 'Quyosh chiqishi' : next.name;
  document.querySelector('.hero-label .muted').textContent = isSun ? 'gacha' : 'namozigacha';
  const tomorrow = next.ms > today[5].ms;
  $('nextAt').textContent = `${tomorrow ? 'Ertaga ' : ''}${next.hm} da`;

  const pct = prev ? ((now - prev.ms) / (next.ms - prev.ms)) * 100 : 0;
  $('progressBar').style.width = `${Math.min(100, Math.max(0, pct))}%`;
  $('prevLbl').textContent = prev ? `${prev.name} ${prev.hm}` : '';
  $('nextLbl').textContent = `${next.name} ${next.hm}`;

  // Joriy namoz: o'tgan oxirgi namoz (quyosh chiqqandan peshingacha — yo'q)
  const passed = today.filter(e => e.ms <= now);
  const last = passed[passed.length - 1];
  const currentId = last && last.id !== 'sunrise' ? last.id : null;

  const ul = $('times');
  ul.innerHTML = '';
  for (const e of today) {
    const li = document.createElement('li');
    const cls = [];
    if (e.id === 'sunrise') cls.push('sun');
    if (e.ms <= now) cls.push('passed');
    if (e.id === currentId) cls.push('current');
    if (e.ms === next.ms) cls.push('next');
    li.className = cls.join(' ');
    let tag = '';
    if (cls.includes('current')) tag = '<span class="tag">hozir</span>';
    else if (cls.includes('next')) tag = '<span class="tag">keyingi</span>';
    li.innerHTML = `<span class="n"><span class="dot"></span>${e.name}${tag}</span><span class="t">${e.hm}</span>`;
    ul.appendChild(li);
  }

  const d = new Date(now + 5 * 3600e3);
  $('gregorian').textContent = `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}`;
  $('hijri').textContent = hijri(now);
}

// ---------- Sozlamalar ----------
const ADJ_NAMES = Object.fromEntries(EVENTS.map(e => [e.id, e.name]));

function fillSettings() {
  $('notify').checked = S.notify;
  $('notifyBefore').value = String(S.notifyBefore);
  $('notifySunrise').checked = S.notifySunrise;
  $('persistent').checked = S.persistent;
  $('asrFactor').value = String(S.asrFactor);
  $('fajrAngle').value = S.fajrAngle;
  $('ishaAngle').value = S.ishaAngle;
  const adj = $('adj');
  adj.innerHTML = '';
  for (const id of Object.keys(DEFAULTS.adj)) {
    const lbl = document.createElement('label');
    lbl.innerHTML = `<span>${ADJ_NAMES[id]}</span><input type="number" step="1" min="-30" max="30" data-adj="${id}" value="${S.adj[id] || 0}">`;
    adj.appendChild(lbl);
  }
}

$('notify').addEventListener('change', e => save({ notify: e.target.checked }));
$('notifyBefore').addEventListener('change', e => save({ notifyBefore: +e.target.value }));
$('notifySunrise').addEventListener('change', e => save({ notifySunrise: e.target.checked }));
$('persistent').addEventListener('change', e => save({ persistent: e.target.checked }));
$('asrFactor').addEventListener('change', e => save({ asrFactor: +e.target.value }));
$('fajrAngle').addEventListener('change', e => save({ fajrAngle: +e.target.value || DEFAULTS.fajrAngle }));
$('ishaAngle').addEventListener('change', e => save({ ishaAngle: +e.target.value || DEFAULTS.ishaAngle }));
$('adj').addEventListener('change', e => {
  const id = e.target.dataset.adj;
  if (!id) return;
  save({ adj: { ...S.adj, [id]: Math.round(+e.target.value || 0) } });
});

$('testNotify').addEventListener('click', () => {
  const st = status(currentPlace(S), S);
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon128.png', priority: 2,
    title: `${st.next.name} namoziga ${S.notifyBefore || 10} daqiqa qoldi`,
    message: `${currentPlace(S).full} · ${st.next.hm} (sinov)`
  });
});

$('reset').addEventListener('click', async () => {
  const { cityId, custom } = S;
  await chrome.storage.sync.clear();
  await chrome.storage.sync.set({ cityId, custom });
  S = await loadSettings();
  fillSettings(); render();
  toast('Standart sozlamalar tiklandi');
});

function showSettings(on) {
  $('mainView').hidden = on;
  $('settingsView').hidden = !on;
}
$('toggleSettings').addEventListener('click', () => showSettings($('settingsView').hidden));
$('back').addEventListener('click', () => showSettings(false));

// ---------- Ishga tushirish ----------
fillRegions();
fillPlaces(selectedRegionId());
fillSettings();
render();
setInterval(render, 1000);
