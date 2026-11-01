(async () => {
  if (document.getElementById('__kp')) return;
  const target = document.activeElement, sel = getSelection(), range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  const { snips = [] } = await chrome.storage.local.get('snips');
  const h = document.createElement('div'); h.id = '__kp'; h.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0005;display:flex;justify-content:center;align-items:flex-start;padding-top:12vh';
  const s = h.attachShadow({ mode: 'open' });
  s.innerHTML = `<style>.b{width:min(620px,92vw);background:#1e1f24;color:#e6e6e6;border-radius:12px;box-shadow:0 20px 60px #0008;font:14px system-ui;overflow:hidden}input{all:unset;box-sizing:border-box;width:100%;padding:14px 16px;font-size:16px;border-bottom:1px solid #333}
  .l{max-height:50vh;overflow:auto}.i{padding:8px 16px;cursor:pointer;border-left:3px solid transparent}.i.on{background:#2b2d35;border-left-color:#7c9cff}.t{font-weight:600}.p{font:12px ui-monospace,monospace;color:#9aa;white-space:pre;overflow:hidden;max-height:3.2em}.g{font-size:11px;color:#7c9cff;margin-left:6px}.e{padding:18px;color:#888;text-align:center}.f{font-size:11px;color:#777;padding:6px 16px;border-top:1px solid #333}</style>
  <div class="b"><input placeholder="Kod parchasini qidiring..." autofocus><div class="l"></div><div class="f">↑↓ tanlash · Enter qo'yish · Shift+Enter nusxalash · Esc yopish</div></div>`;
  document.documentElement.append(h);
  const inp = s.querySelector('input'), L = s.querySelector('.l'); let arr = [], idx = 0;
  const e = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() { const q = inp.value.toLowerCase().split(/\s+/).filter(Boolean); arr = snips.filter(n => q.every(w => (n.title + ' ' + n.tags.join(' ') + ' ' + n.lang + ' ' + n.code).toLowerCase().includes(w))).sort((a, b) => (b.used || 0) - (a.used || 0)).slice(0, 40); idx = Math.min(idx, Math.max(0, arr.length - 1));
    L.innerHTML = arr.length ? arr.map((n, i) => `<div class="i ${i === idx ? 'on' : ''}" data-i="${i}"><div class="t">${e(n.title)}<span class="g">${e(n.lang)} ${n.tags.map(t => '#' + e(t)).join(' ')}</span></div><div class="p">${e(n.code.slice(0, 300))}</div></div>`).join('') : `<div class="e">${snips.length ? 'Topilmadi' : 'Hali parcha yo\'q — kengaytma oynasidan qo\'shing'}</div>`;
    L.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); }
  const close = () => { h.remove(); target?.focus?.(); };
  async function use(n, copyOnly) {
    close(); n.used = (n.used || 0) + 1; chrome.storage.local.set({ snips });
    if (copyOnly || !target || !(target.isContentEditable || /^(TEXTAREA|INPUT)$/.test(target.tagName))) { await navigator.clipboard.writeText(n.code).catch(() => {}); return; }
    target.focus(); if (range && target.isContentEditable) { sel.removeAllRanges(); sel.addRange(range); }
    if (!document.execCommand('insertText', false, n.code) && 'setRangeText' in target) { target.setRangeText(n.code, target.selectionStart, target.selectionEnd, 'end'); target.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  inp.oninput = () => { idx = 0; render(); };
  inp.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Escape') close(); else if (ev.key === 'ArrowDown') { idx = Math.min(arr.length - 1, idx + 1); render(); ev.preventDefault(); } else if (ev.key === 'ArrowUp') { idx = Math.max(0, idx - 1); render(); ev.preventDefault(); } else if (ev.key === 'Enter' && arr[idx]) { ev.preventDefault(); use(arr[idx], ev.shiftKey); } };
  L.onclick = ev => { const i = ev.target.closest('.i'); if (i) use(arr[+i.dataset.i]); };
  h.onclick = ev => { if (ev.target === h) close(); };
  render(); setTimeout(() => inp.focus(), 0);
})();
