import { t, setLang, getLang, detectLang, DEFAULTS } from './js/i18n.js';
import { libAvailable } from './js/engines.js';

const DEV_URL = 'https://www.ali-dasturchi.uz';
const DONATE_URL = 'https://www.ali-dasturchi.uz/#donat';
const OTHER_URL = 'https://www.ali-dasturchi.uz';

const $ = s => document.querySelector(s);
const main = $('#main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let S = { ...DEFAULTS };
let session = null, view = 'main', lib = true, notice = '', curTab = null, dictInfo = { w: 0, l: 0 };

async function save(patch) {
  S = { ...S, ...patch };
  await chrome.storage.local.set({ settings: S });
}

// ---------- asosiy ko'rinish ----------
function heroHTML() {
  const mine = session && curTab && session.tabId === curTab.id;
  const other = session && !mine;
  let state = `<span class="dot"></span>${esc(t('statusOff'))}`, prog = '';
  if (session) {
    const st = session.status;
    if (st === 'loading') { state = `<span class="dot load"></span>${esc(t('statusLoading', session.progress || 0))}`; prog = `<div class="progress"><i style="width:${session.progress || 0}%"></i></div>`; }
    else if (st === 'listening') state = `<span class="dot on"></span>${esc(t('statusListening'))}`;
    else if (st === 'site') state = `<span class="dot on"></span>${esc(t('statusSite'))}`;
    else if (st === 'error') state = `<span class="dot err"></span>${esc(t('statusError', errText(session.error)))}`;
  }
  return `<div class="card hero">
    <button class="big-btn ${session ? 'stop' : ''}" id="toggle">${session ? '■ ' + esc(t('stop')) : '▶ ' + esc(t('start'))}</button>
    <div class="state">${state}</div>${prog}
    ${other ? `<div class="warn">${esc(t('otherTab', session.title || ''))} <a href="#" id="goTab">${esc(t('goTab'))}</a></div>` : ''}
    ${session && session.error && session.status !== 'error' ? `<div class="warn">${esc(errText(session.error))}</div>` : ''}
    ${notice ? `<div class="warn err">${esc(notice)}</div>` : ''}
  </div>`;
}

function errText(e) {
  if (!e) return '';
  if (e === 'libMissing') return t('libMissing');
  if (e === 'keyMissing') return t('keyMissing');
  if (e === 'cantCapture') return t('cantCapture');
  return e;
}

function quickHTML() {
  return `<div class="card quick">
    <button class="qbig" id="openConv"><span>${esc(t('openConv'))}</span><small>${esc(t('openConvHint'))}</small></button>
    <div class="qrow"><button class="btn ghost" id="openText">${esc(t('openText'))}</button><button class="btn ghost" id="openDict">${esc(t('openDict'))}</button></div>
  </div>`;
}

// Umumiy boshqaruv elementlari (data-k = sozlama nomi)
const chk = (k, label, hint) => `<label class="row"><span>${esc(label)}${hint ? `<small class="hint">${esc(hint)}</small>` : ''}</span><input type="checkbox" data-k="${k}" ${S[k] ? 'checked' : ''}></label>`;
const sel = (k, label, opts) => `<div class="row"><label>${esc(label)}</label><select data-k="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(S[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
const LANG_OPTS = [['uz', "O'zbekcha"], ['ru', 'Русский'], ['en', 'English']];

function moreHTML() {
  return `
  <details class="card"><summary><h3>🌐 ${esc(t('secTranslate'))}</h3></summary>
    ${chk('translateOn', t('translateOn'))}
    ${sel('translateTo', t('translateTo'), LANG_OPTS)}
    ${sel('trShow', t('trShow'), [['both', t('trBoth')], ['only', t('trOnly')]])}
    <div class="row"><input type="password" data-k="googleTranslateKey" value="${esc(S.googleTranslateKey)}" placeholder="${esc(t('trKey'))}" style="width:100%"></div>
    <small class="hint">${esc(t('trHint'))}</small>
  </details>
  <details class="card"><summary><h3>🎵 ${esc(t('secSound'))}</h3></summary>
    ${chk('soundTypes', t('soundTypes'), t('soundTypesHint'))}
    ${chk('emphasis', t('emphasis'))}
  </details>
  <details class="card"><summary><h3>🔔 ${esc(t('secAlerts'))}</h3></summary>
    ${chk('alertOtherTabs', t('alertOtherTabs'))}
    ${chk('flashLoud', t('flashLoud'))}
    ${chk('notifyAlerts', t('notifyAlerts'))}
    <div class="row" style="flex-direction:column;align-items:stretch"><label>${esc(t('keywords'))}</label><input type="text" data-k="keywords" value="${esc(S.keywords)}" placeholder="${esc(t('keywordsPh'))}"></div>
  </details>
  <details class="card"><summary><h3>📖 ${esc(t('secRead'))}</h3></summary>
    ${chk('slowVideo', t('slowVideo'))}
    ${sel('slowRate', '↳', [['0.9', '0.9×'], ['0.85', '0.85×'], ['0.75', '0.75×'], ['0.6', '0.6×']])}
    ${chk('pauseEach', t('pauseEach'), t('pauseHint'))}
  </details>
  <details class="card"><summary><h3>🤖 ${esc(t('secAI'))}</h3></summary>
    <div class="row"><label>${esc(t('aiModel'))}</label><input type="text" data-k="aiModel" value="${esc(S.aiModel)}"></div>
    <small class="hint">${esc(t('aiHint'))}</small>
  </details>`;
}

function engineHTML() {
  const opt = (v, title, hint, extra = '') => `<label class="opt"><input type="radio" name="engine" value="${v}" ${S.engine === v ? 'checked' : ''}>
    <span><b>${esc(title)}</b><small>${esc(hint)}</small>${S.engine === v ? extra : ''}</span></label>`;
  const langSel = `<div class="row"><label for="speechLang">${esc(t('speechLang'))}</label><select id="speechLang">
      ${['auto', 'uz', 'ru', 'en'].map(l => `<option value="${l}" ${S.speechLang === l ? 'selected' : ''}>${l === 'auto' ? esc(t('langAuto')) : { uz: "O'zbekcha", ru: 'Русский', en: 'English' }[l]}</option>`).join('')}
    </select></div>`;
  const local = `<div class="sub">${langSel}
      <div class="row"><label for="model">${esc(t('model'))}</label><select id="model">
        <option value="tiny" ${S.model === 'tiny' ? 'selected' : ''}>${esc(t('mTiny'))}</option>
        <option value="base" ${S.model === 'base' ? 'selected' : ''}>${esc(t('mBase'))}</option>
        <option value="small" ${S.model === 'small' ? 'selected' : ''}>${esc(t('mSmall'))}</option></select></div>
      ${lib ? '' : `<div class="warn">${esc(t('libMissing'))}</div>`}</div>`;
  const key = (id, val) => `<div class="sub">${langSel}<div class="row"><input type="password" id="${id}" value="${esc(val)}" placeholder="${esc(t('apiKey'))}" autocomplete="off"></div><small class="hint">${esc(t('engCloudHint'))}</small></div>`;
  return `<div class="card"><h3>${esc(t('secEngine'))}</h3>
    ${opt('local', t('engLocal'), t('engLocalHint'), local)}
    ${opt('site', t('engSite'), t('engSiteMeet'))}
    ${opt('google', t('engGoogle'), '', key('googleKey', S.googleKey))}
    ${opt('openai', t('engOpenai'), '', key('openaiKey', S.openaiKey))}
  </div>`;
}

function viewHTML() {
  return `<div class="card"><h3>${esc(t('secView'))}</h3>
    <div class="row"><label for="fontSize">${esc(t('fontSize'))}</label><input type="range" id="fontSize" min="14" max="80" step="2" value="${S.fontSize}"><span class="val" id="fontSizeV">${S.fontSize}px</span></div>
    <div class="row"><label>${esc(t('position'))}</label><div class="seg" style="flex:1">
      <button data-pos="bottom" class="${S.position === 'bottom' ? 'on' : ''}">${esc(t('posBottom'))}</button>
      <button data-pos="top" class="${S.position === 'top' ? 'on' : ''}">${esc(t('posTop'))}</button></div></div>
    <div class="row"><label for="lines">${esc(t('lines'))}</label><input type="range" id="lines" min="1" max="5" value="${S.lines}"><span class="val" id="linesV">${S.lines}</span></div>
    <div class="row"><label for="bgOpacity">${esc(t('bgOpacity'))}</label><input type="range" id="bgOpacity" min="0" max="1" step="0.05" value="${S.bgOpacity}"><span class="val" id="bgOpacityV">${Math.round(S.bgOpacity * 100)}%</span></div>
    <label class="row"><span>${esc(t('showLevel'))}</span><input type="checkbox" id="showLevel" ${S.showLevel ? 'checked' : ''}></label>
    <div class="row"><label>${esc(t('theme'))}</label><div class="seg themes" style="flex:1">
      ${[['white', t('thWhite')], ['yellow', t('thYellow')], ['green', t('thGreen')], ['light', t('thLight')]].map(([v, l]) => `<button data-theme="${v}" class="th-${v} ${S.theme === v ? 'on' : ''}">${esc(l)}</button>`).join('')}
    </div></div>
  </div>`;
}

function signHTML() {
  return `<div class="card"><h3>🤟 ${esc(t('secSign'))}</h3>
    <label class="row"><span>${esc(t('signOn'))}</span><input type="checkbox" id="signOn" ${S.signOn ? 'checked' : ''}></label>
    <label class="row"><span>${esc(t('fingerspell'))}</span><input type="checkbox" id="fingerspell" ${S.fingerspell ? 'checked' : ''}></label>
    <div class="row"><label for="signSpeed">${esc(t('signSpeed'))}</label><input type="range" id="signSpeed" min="0.5" max="2" step="0.25" value="${S.signSpeed}"><span class="val" id="signSpeedV">${S.signSpeed}×</span></div>
    <div class="row"><button class="btn ghost" id="manage" style="flex:1">${esc(t('manageDict'))} · ${esc(t('dictCount', dictInfo.w, dictInfo.l))}</button></div>
  </div>`;
}

async function textHTML() {
  const { transcript = [] } = await chrome.storage.session.get('transcript');
  const items = transcript.slice(-60);
  const tm = d => { const x = new Date(d); return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };
  return `<div class="card"><h3>${esc(t('secText'))}</h3>
    <div class="trans" id="trans">${items.length ? items.map(i => `<p><time>${tm(i.t)}</time>${esc(i.text)}</p>`).join('') : `<span class="hint">${esc(t('emptyText'))}</span>`}</div>
    <div class="actions"><button class="btn ghost" id="copy">${esc(t('copy'))}</button><button class="btn ghost" id="dl">${esc(t('download'))}</button><button class="btn ghost" id="clr">${esc(t('clear'))}</button></div>
  </div>`;
}

function settingsHTML() {
  const ver = chrome.runtime.getManifest().version;
  const L = getLang();
  return `<div class="card"><button class="btn ghost" id="backBtn">← ${esc(t('back'))}</button></div>
    <div class="card"><h3>${esc(t('language'))}</h3>
      <div class="seg"><button data-lang="uz" class="${L === 'uz' ? 'on' : ''}">🇺🇿 O'zbekcha</button><button data-lang="ru" class="${L === 'ru' ? 'on' : ''}">🇷🇺 Русский</button></div></div>
    <div class="card"><h3>${esc(t('shortcuts'))}</h3>
      <div class="kbd-row"><span>${esc(t('scOpen'))}</span><kbd>Alt+Shift+K</kbd></div>
      <div class="kbd-row"><span>${esc(t('scToggle'))}</span><kbd>Alt+Shift+S</kbd></div>
      <div class="kbd-row"><span>${esc(t('openConv'))}</span><kbd>Alt+Shift+J</kbd></div>
      <div class="kbd-row"><span></span><button class="btn ghost" id="shortcuts">${esc(t('changeShortcut'))}</button></div></div>
    <div class="card links">
      <a href="${DEV_URL}" target="_blank" rel="noopener">${esc(t('developer'))} <span>Bunyodg97 ↗</span></a>
      <a href="${DONATE_URL}" target="_blank" rel="noopener" class="donate">❤ ${esc(t('donate'))} <span>↗</span></a>
      <a href="${OTHER_URL}" target="_blank" rel="noopener">${esc(t('otherExt'))} <span>↗</span></a>
    </div>
    <div class="foot">${esc(t('version'))} ${esc(ver)}</div>`;
}

async function render() {
  document.documentElement.lang = getLang();
  $('#appName').textContent = t('appName');
  $('#tagline').textContent = t('tagline');
  $('#btnSettings').setAttribute('aria-label', t('settings'));
  if (view === 'settings') { main.innerHTML = settingsHTML(); return; }
  const st = main.scrollTop;
  main.innerHTML = quickHTML() + heroHTML() + engineHTML() + viewHTML() + signHTML() + moreHTML() + await textHTML();
  main.scrollTop = st;
  const tr = $('#trans'); if (tr) tr.scrollTop = tr.scrollHeight;
}

function renderHero() {
  const h = main.querySelector('.hero');
  if (h) h.outerHTML = heroHTML(); else render();
}

// ---------- boshlash / to'xtatish ----------
async function startCapture() {
  notice = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  curTab = tab;
  if (!tab || !/^(https?|file):/.test(tab.url || '') || /chromewebstore\.google\.com|chrome\.google\.com\/webstore/.test(tab.url)) {
    notice = t('cantCapture'); return renderHero();
  }
  if (S.engine === 'local' && !lib) { notice = t('libMissing'); return renderHero(); }
  if ((S.engine === 'openai' && !S.openaiKey) || (S.engine === 'google' && !S.googleKey)) { notice = t('keyMissing'); return renderHero(); }
  let streamId;
  if (S.engine !== 'site') {
    try { streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }); }
    catch (e) { notice = String(e.message || e); return renderHero(); }
  }
  const r = await chrome.runtime.sendMessage({ type: 'start', tabId: tab.id, streamId });
  if (!r || !r.ok) notice = errText(r && r.error) || 'Error';
  session = r && r.session || null;
  renderHero();
}

async function stopCapture() {
  await chrome.runtime.sendMessage({ type: 'stop' });
  session = null; notice = '';
  renderHero();
}

// Ishlab turganda usul o'zgarsa — qayta ishga tushiramiz
async function restartIfRunning() {
  if (!session || !curTab || session.tabId !== curTab.id) return;
  await chrome.runtime.sendMessage({ type: 'stop' });
  session = null;
  await startCapture();
}

// ---------- hodisalar ----------
document.addEventListener('click', async e => {
  const el = e.target.closest('button, a');
  if (!el) return;
  if (el.id === 'btnSettings') { view = view === 'settings' ? 'main' : 'settings'; return render(); }
  if (el.id === 'backBtn') { view = 'main'; return render(); }
  if (el.id === 'toggle') return session ? stopCapture() : startCapture();
  if (el.id === 'goTab') { e.preventDefault(); chrome.tabs.update(session.tabId, { active: true }); return; }
  if (el.dataset.pos) { await save({ position: el.dataset.pos }); main.querySelectorAll('[data-pos]').forEach(b => b.classList.toggle('on', b === el)); chrome.storage.local.set({ overlayPos: null }); return; }
  if (el.dataset.lang) { setLang(el.dataset.lang); await save({ lang: el.dataset.lang }); return render(); }
  if (el.id === 'manage' || el.id === 'openDict') { chrome.runtime.openOptionsPage(); return; }
  if (el.id === 'openConv') { chrome.tabs.create({ url: chrome.runtime.getURL('suhbat.html') }); return; }
  if (el.id === 'openText' || el.id === 'openText2') { chrome.tabs.create({ url: chrome.runtime.getURL('matn.html') }); return; }
  if (el.dataset.theme) { await save({ theme: el.dataset.theme }); main.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b === el)); return; }
  if (el.id === 'shortcuts') { chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); return; }
  if (el.id === 'copy' || el.id === 'dl') {
    const { transcript = [] } = await chrome.storage.session.get('transcript');
    const txt = transcript.map(i => `[${new Date(i.t).toLocaleTimeString()}] ${i.text}`).join('\n');
    if (el.id === 'copy') { await navigator.clipboard.writeText(txt); el.textContent = t('copied'); setTimeout(() => { el.textContent = t('copy'); }, 1500); }
    else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
      a.download = `subtitr-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`;
      a.click();
    }
    return;
  }
  if (el.id === 'clr') { await chrome.storage.session.set({ transcript: [] }); return render(); }
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.name === 'engine') { await save({ engine: el.value }); notice = ''; await render(); return restartIfRunning(); }
  if (el.id === 'speechLang' || el.id === 'model') { await save({ [el.id]: el.value }); return restartIfRunning(); }
  if (el.id === 'openaiKey' || el.id === 'googleKey') { await save({ [el.id]: el.value.trim() }); return; }
  if (['showLevel', 'signOn', 'fingerspell'].includes(el.id)) { await save({ [el.id]: el.checked }); return; }
  if (el.dataset.k) {
    const k = el.dataset.k;
    let v = el.type === 'checkbox' ? el.checked : el.value.trim();
    if (k === 'slowRate') v = Number(v);
    await save({ [k]: v });
    if (['translateOn', 'translateTo', 'soundTypes'].includes(k)) restartIfRunning();
  }
});

document.addEventListener('input', e => {
  const el = e.target;
  const fmt = { fontSize: v => v + 'px', lines: v => v, bgOpacity: v => Math.round(v * 100) + '%', signSpeed: v => v + '×' };
  if (fmt[el.id]) {
    const v = Number(el.value);
    const o = document.getElementById(el.id + 'V'); if (o) o.textContent = fmt[el.id](v);
    save({ [el.id]: v });
  }
});

// Holatni jonli yangilash
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'status' && session) {
    session = { ...session, status: msg.status, progress: msg.progress ?? session.progress, error: msg.error || '' };
    renderHero();
  }
});
chrome.storage.onChanged.addListener(async (ch, area) => {
  if (area === 'session' && ch.transcript && view === 'main') {
    const items = (ch.transcript.newValue || []).slice(-60);
    const tr = $('#trans');
    if (tr && items.length) {
      tr.innerHTML = items.map(i => { const x = new Date(i.t); return `<p><time>${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}</time>${esc(i.text)}</p>`; }).join('');
      tr.scrollTop = tr.scrollHeight;
    }
  }
  if (area === 'session' && ch.session) { session = ch.session.newValue || null; renderHero(); }
  if (area === 'local' && ch.settings) {
    const n = ch.settings.newValue || {};
    if (n.fontSize !== S.fontSize || n.signOn !== S.signOn) {
      S = { ...S, ...n };
      const fs = $('#fontSize'); if (fs) { fs.value = S.fontSize; $('#fontSizeV').textContent = S.fontSize + 'px'; }
      const so = $('#signOn'); if (so) so.checked = S.signOn;
    }
  }
});

(async function init() {
  const { settings = {}, signDict } = await chrome.storage.local.get(['settings', 'signDict']);
  S = { ...DEFAULTS, ...settings };
  if (!S.lang) { S.lang = detectLang(); await chrome.storage.local.set({ settings: S }); } // birinchi ochilishda
  setLang(S.lang);
  dictInfo = { w: Object.keys((signDict && signDict.words) || {}).length, l: Object.keys((signDict && signDict.letters) || {}).length };
  [curTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const st = await chrome.runtime.sendMessage({ type: 'state' }).catch(() => null);
  session = st && st.session || null;
  lib = await libAvailable();
  render();
})();
