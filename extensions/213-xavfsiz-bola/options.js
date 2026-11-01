import {
  now, getSettings, saveSettings, getUsage, allSites, fmtDur, cleanDomain,
  hasPin, setPin, verifyPin, pinError
} from './common.js';
import { SITES, LIMIT_OPTIONS } from './sites.js';

const $ = id => document.getElementById(id);
const UNLOCK_MIN = 15;
let S;

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
function show(view) {
  for (const v of ['setupView', 'lockView', 'panelView']) $(v).classList.toggle('hidden', v !== view);
}
const validPin = p => /^\d{4,6}$/.test(p);

// ---------- Qulf ----------
async function isUnlocked() {
  const { panelUntil = 0 } = await chrome.storage.session.get('panelUntil');
  return Date.now() < panelUntil;
}
const touch = () => chrome.storage.session.set({ panelUntil: Date.now() + UNLOCK_MIN * 60e3 });

async function init() {
  if (!(await hasPin())) { show('setupView'); $('newPin1').focus(); return; }
  if (!(await isUnlocked())) { show('lockView'); $('pin').value = ''; $('pin').focus(); return; }
  await openPanel();
}

$('setupBtn').addEventListener('click', async () => {
  const a = $('newPin1').value, b = $('newPin2').value;
  if (!validPin(a)) return ($('setupErr').textContent = 'PIN 4–6 ta raqamdan iborat bo\'lishi kerak');
  if (a !== b) return ($('setupErr').textContent = 'PIN kodlar bir xil emas');
  await setPin(a); await touch();
  await openPanel();
  toast('PIN saqlandi');
});
$('newPin2').addEventListener('keydown', e => e.key === 'Enter' && $('setupBtn').click());

$('unlockBtn').addEventListener('click', async () => {
  const res = await verifyPin($('pin').value);
  if (!res.ok) { $('pinErr').textContent = pinError(res); $('pin').value = ''; return; }
  $('pinErr').textContent = '';
  await touch(); await openPanel();
});
$('pin').addEventListener('keydown', e => e.key === 'Enter' && $('unlockBtn').click());

$('lockBtn').addEventListener('click', async () => {
  await chrome.storage.session.set({ panelUntil: 0 });
  init();
});

// Panel ochiq turganda vaqt tugasa — qulflash
setInterval(async () => { if (!$('panelView').classList.contains('hidden') && !(await isUnlocked())) init(); }, 10e3);
document.addEventListener('click', () => { if (!$('panelView').classList.contains('hidden')) touch(); });

// ---------- Panel ----------
async function save() {
  if (!(await isUnlocked())) return init();
  await saveSettings(S);
  toast('Saqlandi ✓');
}

async function openPanel() {
  S = await getSettings();
  show('panelView');

  document.querySelectorAll('[data-s]').forEach(el => {
    el.checked = !!S[el.dataset.s];
    el.onchange = () => { S[el.dataset.s] = el.checked; save(); };
  });

  const tl = $('totalLimit');
  tl.innerHTML = LIMIT_OPTIONS.filter(([v]) => v !== '0').map(([v, l]) => `<option value="${v}">${l}</option>`).join('')
    + '<option value="240">4 soat</option><option value="300">5 soat</option>';
  tl.value = S.totalLimit == null ? '' : String(S.totalLimit);
  tl.onchange = () => { S.totalLimit = tl.value === '' ? null : +tl.value; save(); };

  $('bedOn').checked = S.bedtime.enabled;
  $('bedFrom').value = S.bedtime.from;
  $('bedTo').value = S.bedtime.to;
  const bedSave = () => { S.bedtime = { enabled: $('bedOn').checked, from: $('bedFrom').value || '22:00', to: $('bedTo').value || '07:00' }; save(); };
  $('bedOn').onchange = bedSave; $('bedFrom').onchange = bedSave; $('bedTo').onchange = bedSave;

  for (const key of ['blocklist', 'allowlist']) {
    $(key).value = S[key].join('\n');
    $(key).onchange = () => {
      S[key] = [...new Set($(key).value.split(/[\s,]+/).map(cleanDomain).filter(Boolean))];
      $(key).value = S[key].join('\n');
      save();
    };
  }

  const inc = await chrome.extension.isAllowedIncognitoAccess();
  $('incognitoWarn').innerHTML = inc ? '' :
    `<div class="warnbox">⚠️ <b>Inkognito rejimi himoyalanmagan.</b> Bola inkognito oynada cheklovsiz kirishi mumkin.
     Tuzatish: <code>chrome://extensions</code> → Xavfsiz Bola → <b>Tafsilotlar</b> → <b>"Inkognito rejimida ruxsat berish"</b> ni yoqing.
     Yoki inkognitoni butunlay o'chirish uchun <code>windows/chrome_himoya_yoqish.reg</code> faylidan foydalaning.</div>`;

  await renderSites();
  await renderStats();
}

async function renderSites() {
  const u = await getUsage(await now());
  const box = $('sitesBox');
  const cats = [...new Set(SITES.map(s => s.cat))];
  const groups = cats.map(c => [c, SITES.filter(s => s.cat === c)]);
  if (S.customSites.length) groups.push(["Qo'shilgan saytlar", S.customSites]);

  box.innerHTML = groups.map(([cat, list]) => `<div class="cat">${cat}</div><div class="sites">${list.map(site => {
    const lim = S.limits[site.id];
    const cls = lim === 0 ? 'blk' : lim != null ? 'on' : '';
    const used = u.sites[site.id] ? `bugun ${fmtDur(u.sites[site.id])}` : site.domains[0];
    const opts = LIMIT_OPTIONS.map(([v, l]) => `<option value="${v}" ${String(lim ?? '') === v ? 'selected' : ''}>${l}</option>`).join('');
    const del = site.id.startsWith('c:') ? `<button class="x" data-del="${site.id}" title="O'chirish">✕</button>` : '';
    return `<div class="site ${cls}"><span class="ic">${site.icon || '🌐'}</span>
      <span class="nm"><b>${site.name}</b><small>${used}</small></span>
      <select data-lim="${site.id}">${opts}</select>${del}</div>`;
  }).join('')}</div>`).join('');

  box.querySelectorAll('[data-lim]').forEach(sel => sel.onchange = () => {
    const id = sel.dataset.lim;
    if (sel.value === '') delete S.limits[id]; else S.limits[id] = +sel.value;
    save(); renderSites();
  });
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    S.customSites = S.customSites.filter(x => x.id !== b.dataset.del);
    delete S.limits[b.dataset.del];
    save(); renderSites();
  });
}

$('addBtn').addEventListener('click', () => {
  const d = cleanDomain($('addDomain').value);
  if (!d || !d.includes('.')) return toast('Sayt manzilini to\'g\'ri kiriting');
  if (allSites(S).some(x => x.domains.includes(d))) return toast('Bu sayt ro\'yxatda bor');
  const id = 'c:' + d;
  S.customSites.push({ id, name: d, icon: '🌐', domains: [d] });
  S.limits[id] = 30;
  $('addDomain').value = '';
  save(); renderSites();
});
$('addDomain').addEventListener('keydown', e => e.key === 'Enter' && $('addBtn').click());

async function renderStats() {
  const u = await getUsage(await now());
  $('statTotal').textContent = `Bugun internetda jami: ${fmtDur(u.total)}`;
  const names = Object.fromEntries(allSites(S).map(x => [x.id, `${x.icon || '🌐'} ${x.name}`]));
  const rows = Object.entries(u.sites).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 30);
  $('stats').innerHTML = rows.length ? rows.map(([id, v]) => {
    const b = u.bonus[id] ? ` <small class="muted">(+${Math.round(u.bonus[id] / 60)} daq qo'shilgan)</small>` : '';
    return `<div class="stat"><span>${names[id] || id}${b}</span><b>${fmtDur(v)}</b></div>`;
  }).join('') : '<div class="muted" style="font-size:13px">Hali ma\'lumot yo\'q.</div>';
}
setInterval(() => { if (!$('panelView').classList.contains('hidden')) renderStats(); }, 15e3);

document.querySelectorAll('[data-bonus]').forEach(b => b.addEventListener('click', async () => {
  if (!(await isUnlocked())) return init();
  await chrome.runtime.sendMessage({ type: 'bonus', key: '__total', minutes: +b.dataset.bonus });
  toast(`Umumiy vaqtga +${b.dataset.bonus} daqiqa qo'shildi`);
  renderStats();
}));

$('resetToday').addEventListener('click', async () => {
  if (!(await isUnlocked())) return init();
  if (!confirm('Bugungi barcha hisob nolga tushirilsinmi?')) return;
  await chrome.runtime.sendMessage({ type: 'resetToday' });
  toast('Bugungi hisob tozalandi');
  renderStats(); renderSites();
});

$('chBtn').addEventListener('click', async () => {
  const res = await verifyPin($('chOld').value);
  if (!res.ok) return ($('chErr').textContent = pinError(res));
  if (!validPin($('chNew').value)) return ($('chErr').textContent = 'Yangi PIN 4–6 ta raqam bo\'lishi kerak');
  await setPin($('chNew').value);
  $('chErr').textContent = ''; $('chOld').value = ''; $('chNew').value = '';
  toast('PIN o\'zgartirildi');
});

init();
