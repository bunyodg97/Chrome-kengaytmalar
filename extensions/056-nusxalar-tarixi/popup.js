let clips = [], shown = [], sel = 0;
const save = () => store.set('clips', clips);
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'hozir' : s < 3600 ? Math.round(s / 60) + ' daq' : s < 86400 ? Math.round(s / 3600) + ' soat' : Math.round(s / 86400) + ' kun'; };
function render() {
  const s = $('#q').value.toLowerCase(); shown = clips.filter(c => !s || c.text.toLowerCase().includes(s)); sel = Math.min(sel, Math.max(0, shown.length - 1));
  $('#cnt').textContent = clips.length;
  $('#list').innerHTML = shown.map((c, i) => `<div class="c ${c.pin ? 'pin' : ''} ${i === sel ? 'sel' : ''}" data-i="${i}"><div style="flex:1;min-width:0"><div class="tx">${esc(c.text.slice(0, 400))}</div><div class="m">${ago(c.t)} · ${esc(c.host)} · ${c.text.length} belgi</div></div><div class="b"><button data-a="pin" title="Mahkamlash">${c.pin ? '★' : '☆'}</button><button data-a="del" title="O'chirish">✕</button></div></div>`).join('') || '<div class="empty">Hali nusxa olinmagan. Istalgan saytda matnni nusxalang (Ctrl+C).</div>';
}
async function use(c) { await navigator.clipboard.writeText(c.text); c.t = Date.now(); clips = [c, ...clips.filter(x => x !== c)]; await save(); toast('Nusxalandi — Ctrl+V bilan qo\'ying'); setTimeout(() => window.close(), 600); }
$('#list').onclick = e => { const el = e.target.closest('[data-i]'); if (!el) return; const c = shown[+el.dataset.i]; const a = e.target.dataset.a;
  if (a === 'pin') { c.pin = !c.pin; save(); render(); } else if (a === 'del') { clips = clips.filter(x => x !== c); save(); render(); } else use(c); };
$('#q').oninput = () => { sel = 0; render(); };
document.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); render(); e.preventDefault(); } if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); } if (e.key === 'Enter' && shown[sel]) use(shown[sel]); });
let arm = false; $('#clr').onclick = () => { if (!arm) { arm = true; $('#clr').textContent = 'Tasdiqlang'; return; } clips = clips.filter(c => c.pin); save(); render(); arm = false; $('#clr').textContent = 'Tozalash (mahkamlanganlardan tashqari)'; };
$('#off').onchange = e => store.set('off', e.target.checked);
$('#skip').onchange = e => store.set('skip', e.target.value.split('\n').map(s => s.trim()).filter(Boolean));
(async () => { clips = await store.get('clips', []); $('#off').checked = await store.get('off', false); $('#skip').value = (await store.get('skip', ['bank', 'click.uz', 'payme.uz', 'my.uzcard', 'humo'])).join('\n'); render(); })();
