// Jonli suhbat: yoningizdagi odam gapi → ekranda so'zma-so'z; siz yozgan matn → ovoz
import { t, setLang, detectLang, DEFAULTS } from './js/i18n.js';
import { Chunker, cleanText } from './js/chunker.js';
import { createEngine, libAvailable } from './js/engines.js';
import { translate } from './js/translate.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LANGS = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

let S = { ...DEFAULTS };
let log = [];                 // { who: 'heard'|'me', text, tr, t }
let listening = false, speaking = false, interim = '';
let rec = null, micStream = null, ctx = null, node = null, engine = null, queue = [], busy = false, runId = 0;
let dict = { words: {}, letters: {} };
let facing = false;

async function save(patch) { S = { ...S, ...patch }; await chrome.storage.local.set({ settings: S }); }
const saveLog = () => chrome.storage.local.set({ convLog: log.slice(-500) });

// ---------- holat ----------
function setStatus(kind, text) {
  const p = $('status');
  p.className = 'pill' + (kind ? ' ' + kind : '');
  $('stxt').textContent = text;
}
function warn(text, err) {
  const w = $('warn');
  if (!text) { w.classList.add('hidden'); return; }
  w.textContent = text; w.className = 'warnbar' + (err ? ' err' : '');
}
function refreshStatus() {
  if (speaking) setStatus('speak', t('convSpeaking'));
  else if (listening) setStatus('on', t('convListening'));
  else setStatus('', t('convPaused'));
  const m = $('mic');
  m.textContent = listening ? '■ ' + t('convStop') : '🎤 ' + t('convStart');
  m.classList.toggle('on', listening);
}

// ---------- suhbat oynasi ----------
function renderLog() {
  const el = $('log');
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  if (!log.length && !interim) {
    el.innerHTML = `<div class="empty"><div class="big">🗣</div>${esc(t('convEmpty'))}</div>`;
  } else {
    const tm = d => { const x = new Date(d); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
    el.innerHTML = log.slice(-200).map(m => `<div class="msg ${m.who}"><small>${esc(m.who === 'me' ? t('convMe') : t('convHeard'))} · ${tm(m.t)}</small><span class="txt">${esc(m.text)}</span>${m.tr ? `<span class="tr">${esc(m.tr)}</span>` : ''}</div>`).join('')
      + (interim ? `<div class="msg heard interim"><small>${esc(t('convHeard'))}</small><span class="txt">${esc(interim)}</span></div>` : '');
  }
  if (nearBottom || interim) el.scrollTop = el.scrollHeight;
}

function setInterim(text) { interim = text; renderLog(); }

async function addHeard(text) {
  const { text: clean } = cleanText(text);
  interim = '';
  if (!clean) { renderLog(); return; }
  const item = { who: 'heard', text: clean, t: Date.now(), tr: null };
  log.push(item); renderLog(); saveLog();
  playSigns(clean);
  if (S.convTranslate && S.translateTo !== S.convLang) {
    item.tr = await translate(clean, S.convLang, S.translateTo, S.googleTranslateKey);
    if (item.tr) { renderLog(); saveLog(); }
  }
}

// ---------- tinglash: Chrome nutq tanish (so'zma-so'z) ----------
function startWebSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { warn(t('webNoSupport'), true); stopListening(); return; }
  rec = new SR();
  rec.lang = LANGS[S.convLang] || 'uz-UZ';
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = e => {
    let live = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) addHeard(r[0].transcript.trim());
      else live += r[0].transcript;
    }
    setInterim(live.trim());
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { warn(t('micDenied'), true); stopListening(); }
    else if (e.error === 'network') warn(t('netError'), true);
    else if (e.error !== 'no-speech' && e.error !== 'aborted') warn(t('micError', e.error), true);
  };
  rec.onend = () => { if (listening && !speaking) { try { rec.start(); } catch {} } };
  try { rec.start(); } catch {}
}

// ---------- tinglash: Whisper / Google / OpenAI (mikrofon bo'laklari) ----------
async function startChunked() {
  const id = ++runId;
  ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(micStream);
  await ctx.audioWorklet.addModule('audio-worklet.js');
  node = new AudioWorkletNode(ctx, 'grabber');
  src.connect(node);
  // Suhbat uchun qisqaroq bo'laklar — matn tezroq chiqadi
  const chunker = new Chunker(ctx.sampleRate, audio => {
    if (speaking) return; // o'zimizning ovozni yozmaymiz
    queue.push(audio); if (queue.length > 3) queue.shift(); pump(id);
  }, null, { maxSec: 4, silenceMs: 450 });
  node.port.onmessage = e => chunker.push(e.data);
  setStatus('on', t('statusLoading', 0));
  engine = await createEngine({ ...S, engine: S.convEngine, speechLang: S.convLang }, p => { if (id === runId) setStatus('on', t('statusLoading', p)); });
  if (id !== runId) return;
  refreshStatus();
  pump(id);
}

async function pump(id) {
  if (busy || !engine || !queue.length || id !== runId) return;
  busy = true;
  const audio = queue.shift();
  setInterim('…');
  try {
    const text = await engine.transcribe(audio);
    if (id === runId) await addHeard(text);
  } catch (e) { warn(String(e.message || e), true); interim = ''; renderLog(); }
  finally { busy = false; if (id === runId) pump(id); }
}

async function startListening() {
  warn('');
  if (S.convEngine === 'local' && !(await libAvailable())) { warn(t('libMissing'), true); return; }
  if ((S.convEngine === 'openai' && !S.openaiKey) || (S.convEngine === 'google' && !S.googleKey)) { warn(t('keyMissing'), true); return; }
  try {
    // Kengaytma sahifasi uchun mikrofon ruxsatini birinchi marta shu so'raydi
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) { warn(t('micDenied'), true); return; }
  listening = true; refreshStatus();
  if (S.convEngine === 'webspeech') {
    micStream.getTracks().forEach(tr => tr.stop()); micStream = null; // Chrome o'zi mikrofonni ochadi
    startWebSpeech();
  } else {
    startChunked().catch(e => { warn(e.message === 'libMissing' ? t('libMissing') : String(e.message || e), true); stopListening(); });
  }
}

function stopListening() {
  listening = false; runId++;
  try { rec && rec.abort(); } catch {}
  rec = null;
  try { node && node.disconnect(); ctx && ctx.close(); } catch {}
  try { micStream && micStream.getTracks().forEach(tr => tr.stop()); } catch {}
  node = ctx = micStream = engine = null; queue = []; busy = false;
  interim = ''; renderLog(); refreshStatus();
}

// ---------- gapirish (matn → ovoz) ----------
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
speechSynthesis.onvoiceschanged = () => { loadVoices(); if (!$('drawer').classList.contains('hidden')) renderDrawer(); };
loadVoices();

function pickVoice(text, lang) {
  if (S.ttsVoice) { const v = voices.find(v => v.voiceURI === S.ttsVoice); if (v) return { v, exact: true }; }
  const cyr = /[Ѐ-ӿ]/.test(text);
  const find = p => voices.find(v => v.lang && v.lang.toLowerCase().startsWith(p));
  if (lang === 'uz') {
    const uz = find('uz'); if (uz) return { v: uz, exact: true };
    // O'zbekcha ovoz yo'q: lotin yozuvi uchun turkcha, kirill uchun ruscha talaffuz eng yaqin
    return { v: cyr ? find('ru') : (find('tr') || find('ru')), exact: false };
  }
  return { v: find(lang), exact: true };
}

function pauseListeningForSpeech() {
  speaking = true; refreshStatus();
  if (rec) { try { rec.abort(); } catch {} }
}
function resumeAfterSpeech() {
  setTimeout(() => {
    speaking = false; refreshStatus();
    if (listening && S.convEngine === 'webspeech') { if (!rec) startWebSpeech(); else { try { rec.start(); } catch {} } }
  }, 400);
}

async function speakText(text) {
  text = String(text || '').trim();
  if (!text) return;
  let out = text, tr = null;
  // Suhbatdosh boshqa tilda gapirsa — javobni uning tiliga tarjima qilib o'qish
  if (S.convTranslate && S.translateTo !== S.convLang) {
    tr = await translate(text, S.translateTo, S.convLang, S.googleTranslateKey);
    if (tr) out = tr;
  }
  log.push({ who: 'me', text, tr, t: Date.now() }); renderLog(); saveLog();
  $('facingText').textContent = out;
  const lang = tr ? S.convLang : (S.convTranslate ? S.translateTo : S.convLang);
  pauseListeningForSpeech();

  if (S.ttsEngine === 'openai' && S.openaiKey) {
    try {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', headers: { Authorization: 'Bearer ' + S.openaiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: out, speed: Math.max(0.5, Math.min(2, S.ttsRate || 1)) })
      });
      if (!r.ok) throw new Error('OpenAI TTS ' + r.status);
      const a = new Audio(URL.createObjectURL(await r.blob()));
      a.onended = a.onerror = resumeAfterSpeech;
      await a.play();
      return;
    } catch (e) { warn(String(e.message || e), true); }
  }
  const u = new SpeechSynthesisUtterance(out);
  const { v, exact } = pickVoice(out, lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = LANGS[lang] || 'uz-UZ';
  if (!exact && lang === 'uz' && !window.__uzWarned) { window.__uzWarned = true; warn(t('noUzVoice')); setTimeout(() => warn(''), 9000); }
  u.rate = S.ttsRate || 1;
  u.onend = u.onerror = resumeAfterSpeech;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- tayyor iboralar ----------
function phrases() { return Array.isArray(S.phrases) && S.phrases.length ? S.phrases : t('phrasesDefault'); }
function renderPhrases() {
  $('phrases').innerHTML = phrases().map((p, i) => `<button data-ph="${i}" title="${esc(t('editHint'))}">${esc(p)}</button>`).join('')
    + `<button class="add" id="addPh">${esc(t('addPhrase'))}</button>`;
}

// ---------- imo-ishora (eshitilgan gap) ----------
let sq = [], sBusy = false;
function playSigns(text) {
  if (!S.signOn || !window.OvozSigns) return;
  sq = sq.filter(x => !x.letter);
  for (const it of OvozSigns.sequence(dict, text, S.fingerspell)) {
    if (it.media) sq.push({ ...it });
    else if (it.spelled) it.spelled.forEach((l, i) => sq.push({ ...l, context: it.label, idx: i }));
  }
  if (sq.length > 60) sq = sq.slice(-60);
  if (!sBusy) nextSign();
}
function nextSign() {
  const it = sq.shift(), stage = $('stage'), lbl = $('slbl');
  if (!it) { sBusy = false; setTimeout(() => { if (!sBusy) { stage.innerHTML = '<span class="idle">🤟</span>'; lbl.textContent = ''; } }, 2500); return; }
  sBusy = true;
  const sp = Math.max(0.25, S.signSpeed || 1);
  stage.innerHTML = '';
  if (it.idx != null) { lbl.innerHTML = OvozSigns.spell(dict, it.context).map((u, i) => i === it.idx ? `<b>${esc(u.label)}</b>` : esc(u.label)).join(''); }
  else lbl.textContent = it.label;
  if (it.media && /video/.test(it.media.mime || it.media.data.slice(0, 20))) {
    const v = document.createElement('video'); v.src = it.media.data; v.muted = true; v.autoplay = true; v.playbackRate = sp;
    let done = false; const n = () => { if (!done) { done = true; nextSign(); } };
    v.onended = n; v.onerror = n; setTimeout(n, 5000 / sp); stage.appendChild(v); return;
  }
  if (it.media) { const im = document.createElement('img'); im.src = it.media.data; stage.appendChild(im); }
  else { const b = document.createElement('span'); b.className = 'big'; b.textContent = it.label; stage.appendChild(b); }
  setTimeout(nextSign, (it.letter ? 650 : 1400) / sp);
}

// ---------- sozlamalar paneli ----------
function renderDrawer() {
  const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`;
  const langs = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };
  const vs = voices.slice().sort((a, b) => a.lang.localeCompare(b.lang));
  $('dTitle').textContent = t('settings');
  $('dBody').innerHTML = `
    <div class="card"><h3>${esc(t('convEngine'))}</h3>
      <div class="row"><select id="convEngine" style="max-width:100%;width:100%">
        ${opt('webspeech', t('engWeb'), S.convEngine)}${opt('local', t('engLocal'), S.convEngine)}${opt('google', t('engGoogle'), S.convEngine)}${opt('openai', t('engOpenai'), S.convEngine)}
      </select></div>
      <div class="row"><label for="convLang">${esc(t('speechLang'))}</label><select id="convLang">${Object.entries(langs).map(([k, v]) => opt(k, v, S.convLang)).join('')}</select></div>
    </div>
    <div class="card"><h3>${esc(t('ttsEngine'))}</h3>
      <div class="row"><select id="ttsEngine" style="max-width:100%;width:100%">${opt('browser', t('ttsBrowser'), S.ttsEngine)}${opt('openai', t('ttsOpenai'), S.ttsEngine)}</select></div>
      <div class="row"><label for="ttsVoice">${esc(t('voice'))}</label><select id="ttsVoice"><option value="">${esc(t('langAuto'))}</option>${vs.map(v => opt(v.voiceURI, `${v.name} (${v.lang})`, S.ttsVoice)).join('')}</select></div>
      <div class="row"><label for="ttsRate">${esc(t('rate'))}</label><input type="range" id="ttsRate" min="0.5" max="1.6" step="0.1" value="${S.ttsRate}"><span class="val">${S.ttsRate}×</span></div>
      ${voices.some(v => v.lang.toLowerCase().startsWith('uz')) ? '' : `<small class="hint">${esc(t('noUzVoice'))}</small>`}
    </div>
    <div class="card"><h3>${esc(t('secTranslate'))}</h3>
      <label class="row"><span>${esc(t('translateHeard'))}</span><input type="checkbox" id="convTranslate" ${S.convTranslate ? 'checked' : ''}></label>
      <div class="row"><label for="translateTo">${esc(t('translateTo'))}</label><select id="translateTo">${Object.entries(langs).map(([k, v]) => opt(k, v, S.translateTo)).join('')}</select></div>
    </div>
    <div class="card"><h3>🤟 ${esc(t('secSign'))}</h3>
      <label class="row"><span>${esc(t('signOn'))}</span><input type="checkbox" id="signOn" ${S.signOn ? 'checked' : ''}></label>
      <label class="row"><span>${esc(t('fingerspell'))}</span><input type="checkbox" id="fingerspell" ${S.fingerspell ? 'checked' : ''}></label>
    </div>`;
}

function applyView() {
  document.body.style.setProperty('--fs', S.convFont + 'px');
  $('signs').classList.toggle('hidden', !S.signOn);
  $('facing').classList.toggle('hidden', !facing);
  $('flip').classList.toggle('on', facing);
}

function texts() {
  document.title = t('convTitle') + ' — ' + t('appName');
  document.documentElement.lang = S.lang || 'uz';
  $('title').textContent = t('convTitle');
  $('deaf').textContent = '🦻 ' + t('deafCard');
  $('flip').textContent = '⟲ ' + t('flip'); $('flip').title = t('flipHint');
  $('speak').textContent = t('speak');
  $('input').placeholder = t('typePh');
  $('cardClose').textContent = t('closeCard');
  $('saveBtn').title = t('save'); $('clearBtn').title = t('clearConv'); $('setBtn').title = t('settings');
  renderPhrases(); refreshStatus(); renderLog();
}

// ---------- hodisalar ----------
$('mic').onclick = () => listening ? stopListening() : startListening();
$('speak').onclick = () => { const v = $('input').value; $('input').value = ''; speakText(v); $('input').focus(); };
$('input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('speak').click(); } });
$('phrases').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'addPh') { const p = prompt(t('phrasePrompt')); if (p && p.trim()) { save({ phrases: [...phrases(), p.trim()] }).then(renderPhrases); } return; }
  speakText(phrases()[+b.dataset.ph]);
});
$('phrases').addEventListener('contextmenu', e => {
  const b = e.target.closest('[data-ph]'); if (!b) return;
  e.preventDefault();
  const list = phrases().slice(); const p = list[+b.dataset.ph];
  if (confirm(`${t('remove')}: «${p}»?`)) { list.splice(+b.dataset.ph, 1); save({ phrases: list }).then(renderPhrases); }
});
$('smaller').onclick = () => save({ convFont: Math.max(20, S.convFont - 6) }).then(applyView);
$('bigger').onclick = () => save({ convFont: Math.min(96, S.convFont + 6) }).then(applyView);
$('flip').onclick = () => { facing = !facing; const last = [...log].reverse().find(m => m.who === 'me'); $('facingText').textContent = last ? (last.tr || last.text) : t('deafCard') + ' 🦻'; applyView(); };
$('deaf').onclick = () => { $('card').classList.remove('hidden'); $('card').focus(); };
$('cardClose').onclick = () => $('card').classList.add('hidden');
$('card').addEventListener('click', e => { if (e.target === $('card') || e.target.closest('.cf-ico')) $('card').classList.toggle('flip'); });
$('cardSpeak').onclick = () => speakText(S.lang === 'ru' ? 'Я не слышу. Пожалуйста, говорите — ваши слова появятся на экране.' : "Men eshitmayman. Iltimos, gapiring — so'zlaringiz ekranda yoziladi.");
$('saveBtn').onclick = () => {
  const txt = log.map(m => `[${new Date(m.t).toLocaleTimeString()}] ${m.who === 'me' ? t('convMe') : t('convHeard')}: ${m.text}${m.tr ? `  (${m.tr})` : ''}`).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
  a.download = `suhbat-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`; a.click();
};
$('clearBtn').onclick = () => { log = []; saveLog(); renderLog(); };
$('setBtn').onclick = () => { renderDrawer(); $('drawer').classList.remove('hidden'); };
$('dClose').onclick = () => $('drawer').classList.add('hidden');
$('drawer').addEventListener('click', e => { if (e.target === $('drawer')) $('drawer').classList.add('hidden'); });
$('drawer').addEventListener('change', async e => {
  const el = e.target;
  const val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
  await save({ [el.id]: val });
  if (['convEngine', 'convLang'].includes(el.id) && listening) { stopListening(); startListening(); }
  applyView();
});
$('drawer').addEventListener('input', e => { if (e.target.id === 'ttsRate') e.target.nextElementSibling.textContent = e.target.value + '×'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('card').classList.add('hidden'); $('drawer').classList.add('hidden'); } });

chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  if (ch.signDict) dict = ch.signDict.newValue || { words: {}, letters: {} };
  if (ch.settings) { const n = ch.settings.newValue || {}; if (n.lang && n.lang !== S.lang) { S = { ...S, ...n }; setLang(S.lang); texts(); } }
});

(async function init() {
  const r = await chrome.storage.local.get(['settings', 'convLog', 'signDict']);
  S = { ...DEFAULTS, ...(r.settings || {}) };
  if (!S.lang) S.lang = detectLang();
  setLang(S.lang);
  log = r.convLog || [];
  dict = r.signDict || dict;
  applyView(); texts();
  $('input').focus();
  if (new URLSearchParams(location.search).get('start') === '1') startListening();
})();
