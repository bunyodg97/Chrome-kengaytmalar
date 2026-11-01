let recent = [];
const btn = c => `<button data-c="${esc(c)}" class="${[...c].length > 2 ? 'w' : ''}" title="${esc(NAMES[c] || 'U+' + c.codePointAt(0).toString(16).toUpperCase())}">${esc(c)}</button>`;
function render() {
  const q = $('#q').value.trim().toLowerCase(); let h = '';
  if (q) { const all = [...new Set(Object.values(GROUPS).join(' ').split(' '))].filter(c => c === q || (NAMES[c] || '').includes(q) || Object.entries(GROUPS).some(([g, s]) => g.toLowerCase().includes(q) && s.split(' ').includes(c)) || c.toLowerCase().includes(q)); h = all.length ? `<div class="g">${all.map(btn).join('')}</div>` : '<div class="empty">Topilmadi</div>'; }
  else { if (recent.length) h += `<div class="h">Oxirgi</div><div class="g">${recent.map(btn).join('')}</div>`; for (const [g, s] of Object.entries(GROUPS)) h += `<div class="h">${g}</div><div class="g">${s.split(' ').map(btn).join('')}</div>`; }
  $('#out').innerHTML = h;
}
$('#out').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return; const c = b.dataset.c;
  recent = [c, ...recent.filter(x => x !== c)].slice(0, 16); store.set('recent', recent);
  let ok = false; if (!e.shiftKey) { const t = await activeTab(); ok = await chrome.runtime.sendMessage({ type: 'ins', tabId: t.id, t: c }).catch(() => false); }
  if (ok) toast(c + ' qo\'yildi'); else { await copyText(c); }
};
$('#q').oninput = render;
(async () => { recent = await store.get('recent', []); render(); $('#q').focus(); })();
