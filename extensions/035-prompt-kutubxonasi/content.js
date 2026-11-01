(() => {
  const findInput = () => document.querySelector('div.ProseMirror[contenteditable=true], #prompt-textarea, rich-textarea .ql-editor, textarea#userInput, textarea[placeholder], div[contenteditable=true][role=textbox], textarea');
  let prompts = DEFAULT_PROMPTS;
  chrome.storage.local.get('prompts', o => { if (o.prompts) prompts = o.prompts; });
  chrome.storage.onChanged.addListener(c => { if (c.prompts) prompts = c.prompts.newValue; });
  const host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;right:18px;bottom:96px';
  const root = host.attachShadow({ mode: 'open' }); document.documentElement.appendChild(host);
  root.innerHTML = `<style>
    *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .fab{width:42px;height:42px;border-radius:50%;border:0;background:#8e24aa;color:#fff;font-size:19px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
    .p{position:absolute;right:0;bottom:52px;width:380px;max-height:70vh;display:flex;flex-direction:column;background:#fff;color:#1d2330;border:1px solid #e1e4ea;border-radius:12px;box-shadow:0 10px 32px rgba(0,0,0,.25);overflow:hidden}
    @media (prefers-color-scheme:dark){.p{background:#1b1f27;color:#e7eaf0;border-color:#2c3340}.i:hover{background:#252b36!important}input,textarea{background:#12151b!important;color:#e7eaf0!important;border-color:#2c3340!important}}
    .p[hidden]{display:none}
    .hd{padding:10px;border-bottom:1px solid rgba(127,127,127,.2);display:flex;gap:6px}
    input,textarea{width:100%;padding:7px 9px;border:1px solid #d6dae2;border-radius:8px;font-size:13px;background:#fff;color:#1d2330}
    .ls{overflow:auto;padding:6px}
    .c{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#8a93a3;padding:8px 8px 2px}
    .i{padding:8px;border-radius:8px;cursor:pointer}.i:hover,.i.sel{background:#f3eef8}
    .i b{font-size:13.5px;display:block}.i span{font-size:12px;color:#8a93a3;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vars{padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto}
    .vars label{font-size:12px;color:#8a93a3;display:flex;flex-direction:column;gap:3px}
    button.go{background:#8e24aa;color:#fff;border:0;border-radius:8px;padding:8px 12px;font-weight:600;cursor:pointer}
    button.lnk{background:none;border:0;color:#8e24aa;cursor:pointer;font-size:12px;white-space:nowrap}
  </style><div class="p" hidden><div class="hd"><input placeholder="Prompt qidirish… (↑↓ Enter)"><button class="lnk" data-a="manage">Tahrirlash</button></div><div class="ls"></div><div class="vars" hidden></div></div>
  <button class="fab" title="Prompt Kutubxonasi (Alt+Shift+P)">📚</button>`;
  const P = root.querySelector('.p'), q = root.querySelector('input'), ls = root.querySelector('.ls'), vars = root.querySelector('.vars');
  let shown = [], sel = 0;
  function list() {
    const s = q.value.trim().toLowerCase();
    shown = prompts.filter(p => !s || (p.title + ' ' + p.text + ' ' + p.cat).toLowerCase().includes(s));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    let cat = null; ls.innerHTML = shown.map((p, i) => { const h = p.cat !== cat ? `<div class="c">${esc(p.cat || 'Boshqa')}</div>` : ''; cat = p.cat; return h + `<div class="i ${i === sel ? 'sel' : ''}" data-i="${i}"><b>${esc(p.title)}</b><span>${esc(p.text.slice(0, 90))}</span></div>`; }).join('') || '<div class="c">Topilmadi</div>';
  }
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  function open(v = P.hidden) { P.hidden = !v; vars.hidden = true; ls.hidden = false; if (v) { q.value = ''; sel = 0; list(); setTimeout(() => q.focus(), 30); } }
  function insert(text) {
    const el = findInput(); if (!el) return alert('Yozish maydoni topilmadi');
    el.focus();
    if (el.tagName === 'TEXTAREA') { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; setter.call(el, (el.value ? el.value + '\n' : '') + text); el.dispatchEvent(new Event('input', { bubbles: true })); }
    else { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, text); }
    open(false);
  }
  function pick(p) {
    const names = [...new Set([...p.text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map(m => m[1]))];
    if (!names.length) return insert(p.text);
    ls.hidden = true; vars.hidden = false;
    vars.innerHTML = `<b>${esc(p.title)}</b>` + names.map((n, i) => `<label>${esc(n)}${/matn|kod|xabar/.test(n) ? `<textarea rows="4" data-n="${esc(n)}"></textarea>` : `<input data-n="${esc(n)}">`}</label>`).join('') + '<button class="go">Qo\'yish</button>';
    vars.querySelector('[data-n]').focus();
    const go = () => { let t = p.text; vars.querySelectorAll('[data-n]').forEach(f => { t = t.split(new RegExp(`\\{\\{\\s*${f.dataset.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`)).join(f.value); }); insert(t); };
    vars.querySelector('.go').onclick = go;
    vars.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.target.tagName === 'INPUT')) { e.preventDefault(); go(); } if (e.key === 'Escape') open(false); };
  }
  root.querySelector('.fab').onclick = () => open();
  root.querySelector('[data-a=manage]').onclick = () => chrome.runtime.sendMessage({ cmd: 'manage' });
  q.oninput = () => { sel = 0; list(); };
  q.onkeydown = e => {
    if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); list(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); list(); e.preventDefault(); }
    if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); pick(shown[sel]); }
    if (e.key === 'Escape') open(false);
  };
  ls.onclick = e => { const i = e.target.closest('.i'); if (i) pick(shown[+i.dataset.i]); };
  addEventListener('keydown', e => { if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); open(); } }, true);
})();
