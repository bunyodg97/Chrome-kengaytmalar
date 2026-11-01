import { t, setLang, detectLang, DEFAULTS } from './js/i18n.js';
import { translate } from './js/translate.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = { ...DEFAULTS }, items = [], fs = 18;

const pad = (n, l = 2) => String(n).padStart(l, '0');
const hm = d => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`; };

function render() {
  const q = $('q').value.trim().toLowerCase();
  const list = q ? items.filter(i => (i.text + ' ' + (i.tr || '')).toLowerCase().includes(q)) : items;
  const hl = s => { const e = esc(s); if (!q) return e; return e.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); };
  let lastPage = '';
  $('list').innerHTML = list.length ? list.map(i => {
    const pg = i.page && i.page !== lastPage ? `<span class="pg">${esc(t('pageLbl'))}: ${esc(i.page)}</span>` : '';
    lastPage = i.page || lastPage;
    return `<div class="e"><time>${hm(i.t)}</time><div class="tx">${pg}${hl(i.text)}${i.tr ? `<span class="tr">${hl(i.tr)}</span>` : ''}</div></div>`;
  }).join('') : `<span class="hint">${esc(t('emptyText'))}</span>`;
  $('count').textContent = t('entries', items.length);
  document.body.style.setProperty('--fs', fs + 'px');
}

function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
  a.download = name; a.click();
}

// .srt: video vaqti bo'lsa — videoga mos, aks holda yozuv boshidan
function toSrt() {
  const f = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms, 3)}`; };
  const t0 = items.length ? items[0].t : 0;
  return items.map((i, k) => {
    const start = i.vt != null ? i.vt : (i.t - t0) / 1000;
    const next = items[k + 1];
    let end = start + Math.max(1.5, i.dur || Math.min(7, i.text.split(/\s+/).length * 0.45));
    const ns = next ? (next.vt != null ? next.vt : (next.t - t0) / 1000) : null;
    if (ns != null && ns > start && ns < end) end = ns;
    return `${k + 1}\n${f(start)} --> ${f(end)}\n${i.text}${i.tr ? '\n' + i.tr : ''}\n`;
  }).join('\n');
}

async function ai(kind) {
  const card = $('aiCard'), out = $('ai');
  card.classList.remove('hidden');
  $('aiTitle').textContent = kind === 'sum' ? t('summary') : t('simplify');
  if (!S.openaiKey) { out.textContent = t('aiNeedKey'); return; }
  const text = items.map(i => i.text).join('\n').slice(-24000);
  if (!text) { out.textContent = t('emptyText'); return; }
  const langName = { uz: "o'zbek tilida (lotin yozuvida)", ru: 'на русском языке' }[S.lang] || 'in Uzbek';
  const prompt = kind === 'sum'
    ? `Quyidagi matn — video yoki suhbatning avtomatik subtitri (xatolar bo'lishi mumkin). Kar foydalanuvchi uchun ${langName} qisqa xulosa yoz: 5–8 ta asosiy fikr, ro'yxat ko'rinishida, oddiy so'zlar bilan.`
    : `Quyidagi matn — avtomatik subtitr (xatolar bo'lishi mumkin). Uni ${langName} juda sodda tilda qayta yoz: qisqa gaplar, oddiy so'zlar, murakkab atamalarni tushuntir. Ma'noni o'zgartirma, o'zingdan fakt qo'shma.`;
  out.textContent = t('aiWorking');
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + S.openaiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: S.aiModel || 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }, { role: 'user', content: text }], temperature: 0.3 })
    });
    if (!r.ok) throw new Error('OpenAI ' + r.status + (r.status === 404 ? ' (model nomini sozlamalarda tekshiring)' : ''));
    const d = await r.json();
    out.textContent = d.choices[0].message.content.trim();
  } catch (e) { out.textContent = String(e.message || e); }
}

$('q').oninput = render;
$('smaller').onclick = () => { fs = Math.max(13, fs - 2); render(); };
$('bigger').onclick = () => { fs = Math.min(40, fs + 2); render(); };
$('txt').onclick = () => download(`subtitr-${new Date().toISOString().slice(0, 10)}.txt`, items.map(i => `[${hm(i.t)}] ${i.text}${i.tr ? '  (' + i.tr + ')' : ''}`).join('\n'));
$('srt').onclick = () => download(`subtitr-${new Date().toISOString().slice(0, 10)}.srt`, toSrt(), 'application/x-subrip');
$('sum').onclick = () => ai('sum');
$('simp').onclick = () => ai('simp');
$('trall').onclick = async () => {
  const to = $('trTo').value, b = $('trall'); b.disabled = true;
  for (let k = 0; k < items.length; k++) {
    items[k].tr = await translate(items[k].text, 'auto', to, S.googleTranslateKey) || items[k].tr;
    if (k % 5 === 4) { b.textContent = `${t('translateAll')} ${k + 1}/${items.length}`; render(); }
  }
  b.disabled = false; b.textContent = t('translateAll'); render();
};

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'session' && ch.transcript) { items = ch.transcript.newValue || []; render(); }
});

(async function init() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  S = { ...DEFAULTS, ...settings };
  setLang(S.lang || detectLang());
  document.title = t('textTitle') + ' — ' + t('appName');
  $('title').textContent = t('textTitle');
  $('q').placeholder = t('search');
  $('txt').textContent = t('exportTxt'); $('srt').textContent = t('exportSrt');
  $('sum').textContent = t('summary'); $('simp').textContent = t('simplify'); $('trall').textContent = t('translateAll');
  $('trTo').value = S.translateTo || 'uz';
  items = (await chrome.storage.session.get('transcript')).transcript || [];
  render();
})();
