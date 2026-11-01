(() => {
  let list = TJ_DEFAULT, sites = TJ_SITES, lastInput = null, host, root;
  chrome.storage.local.get(['tj', 'sites'], o => { if (o.tj) list = o.tj; if (o.sites) sites = o.sites; if (sites.some(s => location.hostname.endsWith(s))) build(true); });
  chrome.storage.onChanged.addListener(c => { if (c.tj) list = c.tj.newValue; });
  const isInput = el => el && (el.isContentEditable || /^(TEXTAREA|INPUT)$/.test(el.tagName) && !/^(checkbox|radio|submit|button|file|hidden|password)$/.test(el.type));
  document.addEventListener('focusin', e => { if (isInput(e.target)) lastInput = e.target; }, true);
  function insert(text) {
    const el = (isInput(document.activeElement) && document.activeElement) || lastInput;
    if (!el) { navigator.clipboard.writeText(text); flash('Nusxalandi — xabar maydoniga qo\'ying (Ctrl+V)'); return; }
    el.focus();
    if (el.isContentEditable) { document.execCommand('insertText', false, text); }
    else { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; const s = el.selectionStart ?? el.value.length; set.call(el, el.value.slice(0, s) + text + el.value.slice(el.selectionEnd ?? s)); el.dispatchEvent(new Event('input', { bubbles: true })); }
    toggle(false);
  }
  function flash(t) { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#00897b;color:#fff;padding:8px 14px;border-radius:8px;font:13px system-ui'; document.documentElement.appendChild(d); setTimeout(() => d.remove(), 2200); }
  function fill(x, cb) {
    const vars = [...new Set([...x.matchAll(/\{([^}]+)\}/g)].map(m => m[1]))];
    if (!vars.length) return cb(x);
    const p = root.querySelector('.p'); p.querySelector('.ls').hidden = true; const f = p.querySelector('.vars'); f.hidden = false;
    f.innerHTML = vars.map(v => `<label>${v}<input data-v="${v}"></label>`).join('') + '<button class="go">Qo\'yish</button>';
    f.querySelector('input').focus();
    const go = () => { let t = x; f.querySelectorAll('[data-v]').forEach(i => t = t.split(`{${i.dataset.v}}`).join(i.value)); cb(t); };
    f.querySelector('.go').onclick = go; f.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } if (e.key === 'Escape') toggle(false); };
  }
  function build(fab) {
    if (host) return;
    host = document.createElement('div'); host.style.cssText = 'all:initial;position:fixed;right:18px;bottom:88px;z-index:2147483647';
    root = host.attachShadow({ mode: 'open' }); document.documentElement.appendChild(host);
    root.innerHTML = `<style>*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
      .fab{width:44px;height:44px;border-radius:50%;border:0;background:#00897b;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
      .p{position:absolute;right:0;bottom:54px;width:340px;max-height:65vh;display:flex;flex-direction:column;background:#fff;color:#1b1f27;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden}
      .p[hidden]{display:none}input{width:100%;padding:7px 9px;border:1px solid #dde;border-radius:8px;font-size:13px}.hd{padding:10px;border-bottom:1px solid #eee}
      .ls{overflow:auto;padding:6px}.c{font-size:11px;font-weight:700;color:#8a93a3;text-transform:uppercase;padding:8px 6px 2px}.i{padding:7px 8px;border-radius:8px;cursor:pointer}.i:hover,.i.s{background:#e0f2f1}
      .i b{font-size:13px;display:block}.i span{font-size:12px;color:#6b7280;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vars{padding:10px;display:flex;flex-direction:column;gap:6px}.vars label{font-size:12px;color:#6b7280;display:flex;flex-direction:column;gap:3px}
      .go{background:#00897b;color:#fff;border:0;border-radius:8px;padding:8px;font-weight:600;cursor:pointer}</style>
      <div class="p" hidden><div class="hd"><input placeholder="Qidirish… (↑↓ Enter)"></div><div class="ls"></div><div class="vars" hidden></div></div>${fab ? '<button class="fab" title="Tez javoblar (Alt+J)">💬</button>' : ''}`;
    root.querySelector('.fab')?.addEventListener('mousedown', e => e.preventDefault());
    root.querySelector('.fab')?.addEventListener('click', () => toggle());
    const q = root.querySelector('input'); let sel = 0, shown = [];
    const render = () => { const s = q.value.toLowerCase(); shown = list.filter(x => (x.t + x.x + x.cat).toLowerCase().includes(s)); sel = Math.min(sel, Math.max(0, shown.length - 1)); let c;
      root.querySelector('.ls').innerHTML = shown.map((x, i) => { const h = x.cat !== c ? `<div class="c">${x.cat}</div>` : ''; c = x.cat; return h + `<div class="i ${i === sel ? 's' : ''}" data-i="${i}"><b></b><span></span></div>`; }).join('');
      root.querySelectorAll('.i').forEach(el => { const x = shown[+el.dataset.i]; el.querySelector('b').textContent = x.t; el.querySelector('span').textContent = x.x; }); };
    root.render = () => { q.value = ''; sel = 0; render(); };
    q.oninput = () => { sel = 0; render(); };
    q.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); render(); e.preventDefault(); } if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); } if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); fill(shown[sel].x, insert); } if (e.key === 'Escape') toggle(false); };
    root.querySelector('.ls').addEventListener('mousedown', e => e.preventDefault());
    root.querySelector('.ls').onclick = e => { const el = e.target.closest('.i'); if (el) fill(shown[+el.dataset.i].x, insert); };
  }
  function toggle(v) { build(false); const p = root.querySelector('.p'); const open = v ?? p.hidden; p.hidden = !open; root.querySelector('.vars').hidden = true; root.querySelector('.ls').hidden = false; if (open) { root.render(); setTimeout(() => root.querySelector('input').focus(), 20); } }
  addEventListener('keydown', e => { if (e.altKey && e.code === 'KeyJ') { e.preventDefault(); toggle(); } }, true);
})();
