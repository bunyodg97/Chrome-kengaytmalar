import { t, setLang, detectLang } from './js/i18n.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX = 5 * 1024 * 1024;
// O'zbek (kirill) daktil alifbosi + rus tilidagi qo'shimcha harflar
const ABC = ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'ъ', 'ь', 'э', 'ю', 'я', 'ў', 'қ', 'ғ', 'ҳ', 'ы', 'щ'];

let dict = { words: {}, letters: {} };
let cellTarget = null;

function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('on'); setTimeout(() => el.classList.remove('on'), 1800); }

async function load() {
  const { signDict } = await chrome.storage.local.get('signDict');
  dict = { words: {}, letters: {}, ...(signDict || {}) };
}
async function persist() { await chrome.storage.local.set({ signDict: dict }); }

function readFile(file) {
  return new Promise((res, rej) => {
    if (file.size > MAX) return rej(new Error(t('sizeWarn')));
    const r = new FileReader();
    r.onload = () => res({ mime: file.type || 'application/octet-stream', data: r.result });
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

function mediaHTML(m) {
  if (!m) return '';
  return /^video\//.test(m.mime) || /^data:video/.test(m.data)
    ? `<video src="${esc(m.data)}" muted loop autoplay playsinline></video>`
    : `<img src="${esc(m.data)}" alt="">`;
}

// Bitta harf (yoki o', g', sh, ch) — alifboga, qolgani — so'zlarga
function isLetterKey(k) { return [...k].length === 1 || ["o'", "g'", 'sh', 'ch', 'ng'].includes(k); }

async function addEntry(name, file) {
  const key = OvozSigns.norm(name);
  if (!key) return false;
  const m = await readFile(file);
  if (isLetterKey(key)) dict.letters[key] = m; else dict.words[key] = m;
  return true;
}

function renderABC() {
  const extra = Object.keys(dict.letters).filter(k => !ABC.includes(k));
  $('#abc').innerHTML = [...ABC, ...extra].map(k => {
    const m = dict.letters[k];
    return `<div class="cell ${m ? 'has' : ''}" data-letter="${esc(k)}" title="${esc(k.toUpperCase())}">
      ${m ? `<span class="k">${esc(k.toUpperCase())}</span>${mediaHTML(m)}<button class="x" data-dell="${esc(k)}" title="${esc(t('remove'))}">✕</button>`
          : `<span class="l">${esc(k.toUpperCase())}</span><span class="p">+</span>`}
    </div>`;
  }).join('');
}

function renderWords() {
  const q = OvozSigns.norm($('#q').value);
  const keys = Object.keys(dict.words).sort().filter(k => !q || k.includes(q));
  $('#words').innerHTML = keys.length ? keys.map(k => `<div class="w"><div class="m">${mediaHTML(dict.words[k])}</div>
    <div class="n"><span>${esc(k)}</span><button data-delw="${esc(k)}" title="${esc(t('remove'))}">✕</button></div></div>`).join('')
    : `<span class="hint">${esc(t('nothing'))}</span>`;
}

function renderTexts() {
  document.title = t('dictTitle') + ' — ' + t('appName');
  $('#title').textContent = t('dictTitle');
  $('#intro').textContent = t('dictIntro');
  $('#lWord').textContent = t('addWord'); $('#lFile').textContent = t('addFile'); $('#addBtn').textContent = t('add');
  $('#lFolder').textContent = '📁 ' + t('importFolder'); $('#exp').textContent = '⬇ ' + t('exportPack'); $('#lImp').textContent = '⬆ ' + t('importPack');
  $('#hint').textContent = t('importHint');
  $('#hLetters').textContent = t('letters'); $('#hWords').textContent = t('words'); $('#q').placeholder = t('search');
}

function renderAll() { renderABC(); renderWords(); renderQuiz(); }

// ---------- Daktil mashqi ----------
let quiz = { cur: null, ok: 0, total: 0, answered: false };
function newQuestion() {
  const keys = Object.keys(dict.letters);
  if (keys.length < 4) { quiz.cur = null; return; }
  const ans = keys[Math.floor(Math.random() * keys.length)];
  const opts = new Set([ans]);
  while (opts.size < 4) opts.add(keys[Math.floor(Math.random() * keys.length)]);
  quiz.cur = { ans, opts: [...opts].sort(() => Math.random() - 0.5) };
  quiz.answered = false;
}
function renderQuiz() {
  $('#hQuiz').textContent = t('quizTitle');
  $('#quizIntro').textContent = t('quizIntro');
  if (!quiz.cur || !dict.letters[quiz.cur.ans]) newQuestion();
  if (!quiz.cur) { $('#quiz').innerHTML = `<span class="hint">${esc(t('quizNeed'))}</span>`; return; }
  const q = quiz.cur;
  $('#quiz').innerHTML = `<div class="q-stage">${mediaHTML(dict.letters[q.ans])}</div>
    <div class="q-opts">${q.opts.map(o => `<button data-q="${esc(o)}">${esc(o.toUpperCase())}</button>`).join('')}</div>
    <div class="q-foot"><span id="qMsg">${esc(t('score', quiz.ok, quiz.total))}</span><button class="btn" id="qNext">${esc(t('nextQ'))}</button></div>`;
}

// ---------- hodisalar ----------
$('#addBtn').onclick = async () => {
  const w = $('#word').value, f = $('#file').files[0];
  if (!w || !f) return;
  try { if (await addEntry(w, f)) { await persist(); $('#word').value = ''; $('#file').value = ''; renderAll(); toast(t('saved')); } }
  catch (e) { toast(e.message); }
};

$('#folder').onchange = async e => {
  let n = 0;
  for (const f of e.target.files) {
    if (!/^(image|video)\//.test(f.type)) continue;
    const name = f.name.replace(/\.[^.]+$/, '');
    try { if (await addEntry(name, f)) n++; } catch {}
  }
  await persist(); renderAll(); toast(`${t('saved')}: ${n}`);
  e.target.value = '';
};

$('#exp').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: 'korinadigan-ovoz-signs', version: 1, ...dict })], { type: 'application/json' }));
  a.download = 'imo-ishora-lugat.json';
  a.click();
};

$('#imp').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    Object.assign(dict.words, d.words || {});
    Object.assign(dict.letters, d.letters || {});
    await persist(); renderAll(); toast(t('saved'));
  } catch (err) { toast(err.message); }
  e.target.value = '';
};

$('#q').oninput = renderWords;

document.addEventListener('click', async e => {
  const qb = e.target.closest('[data-q]');
  if (qb && quiz.cur && !quiz.answered) {
    quiz.answered = true; quiz.total++;
    const right = qb.dataset.q === quiz.cur.ans;
    if (right) quiz.ok++;
    qb.classList.add(right ? 'ok' : 'bad');
    if (!right) document.querySelector(`[data-q="${CSS.escape(quiz.cur.ans)}"]`).classList.add('ok');
    $('#qMsg').textContent = (right ? t('correct') : t('wrong', quiz.cur.ans.toUpperCase())) + ' · ' + t('score', quiz.ok, quiz.total);
    return;
  }
  if (e.target.id === 'qNext') { newQuestion(); renderQuiz(); return; }
  const dl = e.target.closest('[data-dell]');
  if (dl) { e.stopPropagation(); delete dict.letters[dl.dataset.dell]; await persist(); return renderABC(); }
  const dw = e.target.closest('[data-delw]');
  if (dw) { delete dict.words[dw.dataset.delw]; await persist(); return renderWords(); }
  const cell = e.target.closest('[data-letter]');
  if (cell) { cellTarget = cell.dataset.letter; $('#cellFile').click(); }
});

$('#cellFile').onchange = async e => {
  const f = e.target.files[0];
  if (!f || !cellTarget) return;
  try { dict.letters[cellTarget] = await readFile(f); await persist(); renderABC(); toast(t('saved')); }
  catch (err) { toast(err.message); }
  e.target.value = '';
};

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.settings) { const l = (ch.settings.newValue || {}).lang; if (l) { setLang(l); renderTexts(); renderAll(); } }
});

(async function init() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  setLang(settings.lang || detectLang());
  await load();
  renderTexts();
  renderAll();
})();
