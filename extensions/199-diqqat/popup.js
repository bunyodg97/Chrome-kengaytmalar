import { getSettings, saveSettings, scheduleActive, dayKey, fmtDur } from './common.js';

const $ = id => document.getElementById(id);
const C = 2 * Math.PI * 94;
const pad = n => String(n).padStart(2, '0');
let S = await getSettings();
let minutes = S.pomo.work;
let pomodoro = !!(await chrome.storage.local.get('lastPomo')).lastPomo;

function selectPreset(m) {
  minutes = m;
  document.querySelectorAll('#presets button').forEach(b => b.classList.toggle('sel', +b.dataset.m === m));
  $('time').textContent = `${pad(m)}:00`.replace(/^(\d{3,}):/, '$1:');
}

$('presets').addEventListener('click', e => {
  if (!e.target.dataset.m) return;
  $('custom').value = '';
  selectPreset(+e.target.dataset.m);
});
$('custom').addEventListener('input', e => {
  const m = Math.min(480, Math.max(1, parseInt(e.target.value, 10) || 0));
  if (m) selectPreset(m);
});
$('pomo').checked = pomodoro;
$('pomo').addEventListener('change', e => {
  pomodoro = e.target.checked;
  chrome.storage.local.set({ lastPomo: pomodoro });
  if (pomodoro) { $('custom').value = ''; selectPreset(S.pomo.work); }
});

$('start').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'start', minutes, pomodoro });
  render();
});
$('stop').addEventListener('click', async () => { await chrome.runtime.sendMessage({ type: 'stop' }); render(); });
$('plus').addEventListener('click', async () => { await chrome.runtime.sendMessage({ type: 'extend', minutes: 5 }); render(); });
$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
const muteIcon = () => {
  $('mute').textContent = S.sound.enabled ? '🔔' : '🔕';
  $('mute').title = S.sound.enabled ? "Ovozli signal yoqilgan (o'chirish)" : 'Ovozli signal o\'chirilgan (yoqish)';
};
$('mute').addEventListener('click', async () => {
  S.sound.enabled = !S.sound.enabled;
  await saveSettings(S);
  muteIcon();
});
muteIcon();

async function render() {
  const { session, stats = {} } = await chrome.storage.local.get(['session', 'stats']);
  const now = Date.now();
  const active = session && now < session.endsAt;

  $('idle').classList.toggle('hidden', !!active);
  $('running').classList.toggle('hidden', !active);

  if (active) {
    const left = session.endsAt - now, total = session.duration * 60e3;
    const sec = Math.ceil(left / 1000);
    const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    $('time').textContent = h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    const isBreak = session.mode === 'break';
    $('lbl').textContent = isBreak ? '☕ Dam olish' : '🎯 Diqqat';
    const end = new Date(session.endsAt);
    $('sub').textContent = isBreak ? 'Saytlar ochiq' : `${pad(end.getHours())}:${pad(end.getMinutes())} da tugaydi`;
    $('arc').style.stroke = isBreak ? '#30a46c' : '#6e56cf';
    $('arc').style.strokeDashoffset = String(C * (left / total));
    const lock = !isBreak && S.strict;
    $('stop').disabled = lock;
    $('stop').textContent = isBreak ? '⏭ O\'tkazish' : '■ To\'xtatish';
    $('strictNote').classList.toggle('hidden', !lock);
  } else {
    $('lbl').textContent = 'Tayyor';
    $('sub').innerHTML = '&nbsp;';
    $('arc').style.strokeDashoffset = String(C);
    if (!$('custom').value) selectPreset(minutes);
  }

  const sch = scheduleActive(S);
  $('sched').classList.toggle('hidden', !S.schedule.enabled);
  $('sched').textContent = sch
    ? `💼 Ish vaqti (${S.schedule.from}–${S.schedule.to}) — saytlar bloklangan`
    : `💼 Ish vaqti jadvali: ${S.schedule.from}–${S.schedule.to}`;

  const d = stats[dayKey()] || { focusSec: 0, sessions: 0, blocked: 0 };
  $('stFocus').textContent = d.focusSec >= 60 ? fmtDur(d.focusSec) : '0';
  $('stSess').textContent = d.sessions;
  $('stBlk').textContent = d.blocked;
}

chrome.storage.onChanged.addListener(async (ch) => { if (ch.settings) S = await getSettings(); render(); });
selectPreset(pomodoro ? S.pomo.work : 25);
render();
setInterval(render, 1000);
