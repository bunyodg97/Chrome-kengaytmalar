// Umumiy yordamchi funksiyalar
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const store = {
  get: (k, d) => chrome.storage.local.get(k).then(o => (o[k] === undefined ? d : o[k])),
  set: (k, v) => chrome.storage.local.set({ [k]: v })
};
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copyText(s) {
  try { await navigator.clipboard.writeText(s); toast('Nusxalandi'); }
  catch { toast('Nusxalab bo\'lmadi'); }
}
function download(name, data, type = 'text/plain') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function activeTab() { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t; }
function fmtBytes(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(2) + ' MB'; }
function fmtDur(ms) { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} soat ${m} daq` : m ? `${m} daq ${s % 60} s` : `${s} s`; }
function tabsInit(root = document) {
  $$('.tabs', root).forEach(t => t.addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    $$('button', t).forEach(x => x.classList.toggle('on', x === b));
    $$('[data-pane]', root).forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
  }));
}
