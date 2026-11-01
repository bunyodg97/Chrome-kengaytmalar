import { CATEGORIES, getSettings, saveSettings, cleanDomain, dayKey, fmtDur } from './common.js';
import { SOUNDS, play } from './sounds.js';

const $ = id => document.getElementById(id);
let S = await getSettings();

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}
async function save() { await saveSettings(S); toast('Saqlandi ✓'); }

// ---------- Kategoriyalar ----------
function renderCats() {
  $('cats').innerHTML = CATEGORIES.map(c => `
    <label class="cat ${S.cats[c.id] ? 'on' : ''}">
      <span class="ic">${c.icon}</span>
      <span class="tx"><b>${c.name}</b><small>${c.domains.join(', ')}</small></span>
      <span class="switch"><input type="checkbox" data-cat="${c.id}" ${S.cats[c.id] ? 'checked' : ''}><span></span></span>
    </label>`).join('');
  $('cats').querySelectorAll('[data-cat]').forEach(el => el.onchange = () => {
    S.cats[el.dataset.cat] = el.checked; renderCats(); save();
  });
}

// ---------- Ro'yxatlar ----------
for (const key of ['custom', 'allow']) {
  $(key).value = S[key].join('\n');
  $(key).addEventListener('change', () => {
    S[key] = [...new Set($(key).value.split(/[\s,]+/).map(cleanDomain).filter(d => d && d.includes('.')))];
    $(key).value = S[key].join('\n');
    save();
  });
}

// ---------- Jadval ----------
const DAYS = [[1, 'Du'], [2, 'Se'], [3, 'Ch'], [4, 'Pa'], [5, 'Ju'], [6, 'Sh'], [0, 'Ya']];
function renderDays() {
  $('days').innerHTML = DAYS.map(([d, n]) => `<button data-d="${d}" class="${S.schedule.days.includes(d) ? 'on' : ''}">${n}</button>`).join('');
}
$('days').addEventListener('click', e => {
  const d = e.target.dataset.d;
  if (d === undefined) return;
  const n = +d, days = S.schedule.days;
  S.schedule.days = days.includes(n) ? days.filter(x => x !== n) : [...days, n];
  renderDays(); save();
});
$('schOn').checked = S.schedule.enabled;
$('from').value = S.schedule.from;
$('to').value = S.schedule.to;
$('schOn').onchange = () => { S.schedule.enabled = $('schOn').checked; save(); };
$('from').onchange = () => { S.schedule.from = $('from').value || '09:00'; save(); };
$('to').onchange = () => { S.schedule.to = $('to').value || '18:00'; save(); };

// ---------- Pomodoro ----------
const P = { pWork: 'work', pShort: 'short', pLong: 'long', pEvery: 'every' };
for (const [id, k] of Object.entries(P)) {
  $(id).value = S.pomo[k];
  $(id).onchange = () => {
    const el = $(id), v = Math.min(+el.max, Math.max(+el.min, parseInt(el.value, 10) || S.pomo[k]));
    el.value = v; S.pomo[k] = v; save();
  };
}
$('pAuto').checked = S.pomo.autoNext;
$('pAuto').onchange = () => { S.pomo.autoNext = $('pAuto').checked; save(); };

// ---------- Intizom ----------
$('strict').checked = S.strict;
$('strict').onchange = () => { S.strict = $('strict').checked; save(); };
$('emer').value = String(S.emergencyMin);
$('emer').onchange = () => { S.emergencyMin = +$('emer').value; save(); };

// ---------- Ovoz ----------
$('sndType').innerHTML = SOUNDS.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
$('sndOn').checked = S.sound.enabled;
$('sndType').value = S.sound.type;
$('sndVol').value = Math.round(S.sound.volume * 100);
$('sndVolTxt').textContent = $('sndVol').value + '%';
$('sndOn').onchange = () => { S.sound.enabled = $('sndOn').checked; save(); };
$('sndType').onchange = () => { S.sound.type = $('sndType').value; save(); play(S.sound.type, S.sound.volume); };
$('sndVol').oninput = () => { $('sndVolTxt').textContent = $('sndVol').value + '%'; };
$('sndVol').onchange = () => { S.sound.volume = +$('sndVol').value / 100; save(); play(S.sound.type, S.sound.volume); };
$('sndTest1').onclick = () => play($('sndType').value, +$('sndVol').value / 100, false);
$('sndTest2').onclick = () => play($('sndType').value, +$('sndVol').value / 100, true);

// ---------- Statistika ----------
const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
async function renderStats() {
  const { stats = {} } = await chrome.storage.local.get('stats');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push({ d, i, v: stats[dayKey(d.getTime())] || { focusSec: 0, sessions: 0, blocked: 0 } });
  }
  const max = Math.max(3600, ...days.map(x => x.v.focusSec));
  $('chart').innerHTML = days.map(x => `<div class="c ${x.i === 0 ? 'today' : ''}">
      <span class="v">${x.v.focusSec >= 60 ? fmtDur(x.v.focusSec).replace(' daq', 'd').replace(' soat ', 's ').replace(' soat', 's') : ''}</span>
      <div class="b" style="height:${(x.v.focusSec / max) * 100}%"></div>
      <small>${x.i === 0 ? 'Bugun' : WD[x.d.getDay()]}</small></div>`).join('');
  const tot = days.reduce((a, x) => ({ f: a.f + x.v.focusSec, s: a.s + x.v.sessions, b: a.b + x.v.blocked }), { f: 0, s: 0, b: 0 });
  $('sum').innerHTML = `<span>⏱ Jami diqqat: <b>${fmtDur(tot.f)}</b></span><span>✅ Seanslar: <b>${tot.s}</b></span><span>🛑 To'xtatilgan urinishlar: <b>${tot.b}</b></span>`;
}
$('resetStats').onclick = async () => {
  if (!confirm('Statistika tozalansinmi?')) return;
  await chrome.storage.local.set({ stats: {} }); renderStats();
};

renderCats(); renderDays(); renderStats();
chrome.storage.onChanged.addListener(ch => { if (ch.stats) renderStats(); });
