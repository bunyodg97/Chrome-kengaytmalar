// O'qib Ber — matnni bo'laklab chrome.tts orqali o'qiydi, sahifaga jarayonni bildirib turadi
const DEFAULTS = { rate: 1, pitch: 1, voices: { uz: '', ru: '', en: '' }, autoLang: true };
const getS = async () => { const s = (await chrome.storage.local.get('settings')).settings || {}; return { ...DEFAULTS, ...s, voices: { ...DEFAULTS.voices, ...(s.voices || {}) } }; };

let job = null;   // { tabId, chunks:[{text,i}], pos, paused }

// ---------- Til aniqlash ----------
function detectLang(t) {
  const cyr = (t.match(/[а-яёўқғҳ]/gi) || []).length, lat = (t.match(/[a-z]/gi) || []).length;
  if (cyr > lat) return 'ru';                         // kirill (o'zbekcha kirill ham ruscha ovoz bilan)
  // O'zbekcha belgilar: o'/g', ko'p uchraydigan so'zlar, inglizchada kam uchraydigan "q" va "x"
  const uzHints = (t.match(/\b(va|bu|uchun|bilan|ham|emas|yoki|bo['ʻ‘’]l|qil|o['ʻ‘’]z|kerak|edi|lekin|ekan|men|sen|biz|siz|ular|bor|yo['ʻ‘’]q)\b|[og]['ʻ‘’]|q/gi) || []).length;
  const words = (t.match(/\S+/g) || []).length || 1;
  if (uzHints / words > 0.12) return 'uz';
  // Inglizchaning aniq belgilari bo'lmasa — noaniq (sahifaning umumiy tili olinadi)
  const enHints = (t.match(/\b(the|and|of|to|is|are|with|for|this|that|will|be|in|on)\b/gi) || []).length;
  return enHints / words > 0.08 ? 'en' : '?';
}
const resolveLang = (t, docLang) => { const l = detectLang(t); return l === '?' ? docLang : l; };

// Har bir til uchun eng mos ovoz
async function pickVoice(lang, s) {
  if (s.voices[lang]) return { voiceName: s.voices[lang] };
  const voices = await chrome.tts.getVoices();
  const has = l => voices.find(v => (v.lang || '').toLowerCase().startsWith(l));
  const order = { uz: ['uz', 'tr', 'kk', 'az'], ru: ['ru'], en: ['en-us', 'en'] }[lang] || [lang];
  for (const l of order) { const v = has(l); if (v) return { voiceName: v.voiceName, lang: v.lang }; }
  return { lang: lang === 'uz' ? 'tr-TR' : lang === 'ru' ? 'ru-RU' : 'en-US' };
}

// ---------- O'qish ----------
const notify = (msg) => job && chrome.tabs.sendMessage(job.tabId, msg).catch(() => {});

async function speakNext() {
  if (!job) return;
  if (job.pos >= job.chunks.length) { notify({ type: 'tts:end' }); job = null; return; }
  const s = await getS();
  const ch = job.chunks[job.pos];
  const lang = s.autoLang ? resolveLang(ch.text, job.docLang) : 'uz';
  const v = await pickVoice(lang, s);
  notify({ type: 'tts:pos', pos: job.pos, total: job.chunks.length, para: ch.p });
  const myJob = job, myPos = job.pos;
  chrome.tts.speak(ch.text, {
    ...v, rate: s.rate, pitch: s.pitch, enqueue: false,
    onEvent: e => {
      if (job !== myJob || job.pos !== myPos) return;
      if (e.type === 'end') { job.pos++; speakNext(); }
      else if (e.type === 'error') { notify({ type: 'tts:error', message: e.errorMessage || 'Ovoz topilmadi' }); job = null; }
    }
  });
}

// Uzun xatboshilarni gaplarga bo'lamiz (ba'zi ovozlar uzun matnda to'xtab qoladi)
function toChunks(paras) {
  const out = [];
  paras.forEach((p, pi) => {
    const sents = p.match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [p];
    let buf = '';
    for (const s of sents) {
      if ((buf + s).length > 260 && buf) { out.push({ text: buf.trim(), p: pi }); buf = ''; }
      buf += s;
    }
    if (buf.trim()) out.push({ text: buf.trim(), p: pi });
  });
  return out;
}

function start(tabId, paras, fromPara = 0) {
  chrome.tts.stop();
  const chunks = toChunks(paras);
  const pos = Math.max(0, chunks.findIndex(c => c.p >= fromPara));
  const d = detectLang(paras.join(' ').slice(0, 5000));
  job = { tabId, chunks, pos, paused: false, docLang: d === '?' ? 'en' : d };
  speakNext();
}

function control(cmd) {
  if (!job) return;
  if (cmd === 'pause') { chrome.tts.pause(); job.paused = true; notify({ type: 'tts:paused' }); }
  if (cmd === 'resume') { chrome.tts.resume(); job.paused = false; notify({ type: 'tts:resumed' }); }
  if (cmd === 'stop') { chrome.tts.stop(); notify({ type: 'tts:end' }); job = null; }
  if (cmd === 'next' || cmd === 'prev') {
    const curP = job.chunks[job.pos]?.p ?? 0;
    const target = cmd === 'next' ? curP + 1 : Math.max(0, curP - (job.chunks[job.pos - 1]?.p === curP ? 0 : 1));
    const idx = job.chunks.findIndex(c => c.p === target);
    if (idx < 0) return;
    chrome.tts.stop(); job.pos = idx; job.paused = false; speakNext();
  }
  if (cmd === 'rate') speakNext();     // yangi tezlik bilan joriy gapni qaytadan
}

// ---------- Hodisalar ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'sel', title: '🔊 Belgilangan matnni o\'qish', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'page', title: '🔊 Sahifani ovozda o\'qish', contexts: ['page'] });
  });
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sel') chrome.tabs.sendMessage(tab.id, { type: 'readSelection', text: info.selectionText }).catch(() => {});
  if (info.menuItemId === 'page') chrome.tabs.sendMessage(tab.id, { type: 'readPage' }).catch(() => {});
});
chrome.commands.onCommand.addListener(async cmd => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (cmd === 'stop') return control('stop');
  if (cmd === 'read-page' && tab) chrome.tabs.sendMessage(tab.id, { type: 'readAuto' }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'speak') { start(msg.tabId ?? sender.tab.id, msg.paras, msg.from || 0); reply(true); }
  else if (msg.type === 'ctl') { control(msg.cmd); reply(true); }
  else if (msg.type === 'state') reply(job ? { active: true, paused: job.paused, pos: job.pos, total: job.chunks.length, tabId: job.tabId } : { active: false });
});
chrome.tabs.onRemoved.addListener(id => { if (job?.tabId === id) control('stop'); });
