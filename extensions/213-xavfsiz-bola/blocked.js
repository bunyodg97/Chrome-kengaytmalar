import { getSettings, allSites, verifyPin, pinError } from './common.js';

const $ = id => document.getElementById(id);
const q = new URLSearchParams(location.search);
const r = q.get('r'), siteId = q.get('s');
const S = await getSettings();
const site = siteId ? allSites(S).find(x => x.id === siteId) : null;
const sname = site?.name || 'Bu sayt';

const IDEAS = ['📚 Kitob o\'qish', '⚽ Tashqarida o\'ynash', '🎨 Rasm chizish', '🧩 Boshqotirma yechish', '🤸 Badantarbiya'];

const VIEWS = {
  adult:    { e: '🚫', t: 'Bu sayt bolalar uchun mos emas', s: 'Bu sahifa kattalar uchun mo\'ljallangan, shuning uchun yopildi.' },
  gambling: { e: '🎰', t: 'Qimor saytlari yopiq', s: 'Stavka va kazino saytlari pul va vaqtni olib qo\'yadi. Ular bloklangan.' },
  custom:   { e: '🛑', t: 'Bu sayt bloklangan', s: 'Ota-onang bu saytni yopib qo\'ygan.' },
  blocked:  { e: '🛑', t: `${sname} bloklangan`, s: 'Ota-onang bu saytni yopib qo\'ygan.' },
  limit:    { e: '⏰', t: `${sname} uchun bugungi vaqting tugadi`, s: 'Ertaga yana ochiladi. Hozir boshqa qiziqarli ish bilan shug\'ullanish vaqti!', ideas: true, bonus: siteId },
  total:    { e: '⌛', t: 'Bugungi internet vaqting tugadi', s: 'Ertaga yana davom etasan. Ko\'zlaringga ham dam ber 🙂', ideas: true, bonus: '__total' },
  bedtime:  { e: '🌙', t: 'Uxlash vaqti!', s: `Internet ${S.bedtime.to} da yana ochiladi. Yaxshi tush ko'r!`, bed: true }
};
const v = VIEWS[r] || VIEWS.custom;
$('emoji').textContent = v.e;
$('title').textContent = v.t;
$('sub').textContent = v.s;
document.title = `${v.t} — Xavfsiz Bola`;
if (v.ideas) $('ideas').innerHTML = IDEAS.map(i => `<span>${i}</span>`).join('');

// Ota-ona: PIN bilan qo'shimcha vaqt
if (v.bonus || v.bed) {
  $('parentBox').classList.remove('hidden');
  const opts = v.bed ? [[60, '1 soatga ruxsat'], [120, '2 soatga ruxsat']] : [[15, '+15 daq'], [30, '+30 daq'], [60, '+1 soat']];
  $('opts').innerHTML = opts.map(([m, l]) => `<button class="btn sm" data-m="${m}">${l}</button>`).join('');
  $('opts').addEventListener('click', async e => {
    const m = +e.target.dataset.m;
    if (!m) return;
    const res = await verifyPin($('pin').value);
    if (!res.ok) { $('err').textContent = pinError(res); $('pin').value = ''; return; }
    await chrome.runtime.sendMessage(v.bed ? { type: 'bedtimeOff', minutes: m } : { type: 'bonus', key: v.bonus, minutes: m });
    $('err').textContent = '';
    if (site) location.href = `https://${site.domains[0]}`;
    else if (history.length > 1) history.back();
    else location.href = 'https://www.google.com';
  });
}
