const full = new URLSearchParams(location.search).get('full'); if (full) { $('#root').classList.add('page'); $('#big').hidden = true; } else document.body.classList.add('popup');
let all = [], flt = 'new', tag = '';
const mins = w => Math.max(1, Math.round(w / 200));
async function load() { all = (await DB.all()).sort((a, b) => b.t - a.t); render(); }
function render() {
  const q = $('#q').value.toLowerCase();
  const arr = all.filter(a => (flt === 'all' || (flt === 'arch') === !!a.arch) && (!tag || a.tags.includes(tag)) && (!q || (a.title + ' ' + a.site + ' ' + a.tags.join(' ') + ' ' + (q.length > 2 ? a.html.replace(/<[^>]+>/g, ' ') : '')).toLowerCase().includes(q)));
  const tags = [...new Set(all.flatMap(a => a.tags))];
  $('#tags').innerHTML = tags.map(t => `<span class="chip ${t === tag ? 'acc' : ''}" data-t="${esc(t)}" style="cursor:pointer">#${esc(t)}</span>`).join('');
  $('#list').innerHTML = arr.length ? arr.map(a => `<div class="item a" data-id="${a.id}"><div class="grow" style="min-width:0"><b>${esc(a.title)}</b><div class="small muted">${esc(a.site)} · ${mins(a.words)} daq · ${new Date(a.t).toLocaleDateString('uz')}</div><div class="ex">${esc(a.excerpt)}</div>
    <div>${a.tags.map(t => `<span class="tg">#${esc(t)}</span>`).join('')}</div>${a.pos ? `<div class="pr"><i style="width:${Math.round(a.pos * 100)}%"></i></div>` : ''}</div>
    <div style="display:flex;flex-direction:column;gap:3px"><button class="ghost" data-ar title="${a.arch ? 'Qaytarish' : 'Arxivga'}">${a.arch ? '↺' : '✓'}</button><button class="ghost" data-del title="O'chirish">✕</button></div></div>`).join('')
    : `<div class="empty">${all.length ? 'Hech narsa yo\'q' : 'Maqolani ochib «Saqlash» ni bosing yoki Alt+Shift+S.'}</div>`;
  $('#stat').textContent = `${all.filter(a => !a.arch).length} ta o'qilmagan · ${all.length} ta jami`;
}
$('#tags').onclick = e => { const t = e.target.dataset.t; if (t != null) { tag = tag === t ? '' : t; render(); } };
$('#list').onclick = async e => {
  const it = e.target.closest('.item'); if (!it) return; const a = all.find(x => x.id === it.dataset.id);
  if (e.target.closest('[data-del]')) { if (confirm('O\'chirilsinmi?')) { await DB.del(a.id); chrome.runtime.sendMessage({ type: 'badge' }); load(); } return; }
  if (e.target.closest('[data-ar]')) { a.arch = !a.arch; await DB.put(a); chrome.runtime.sendMessage({ type: 'badge' }); render(); return; }
  chrome.tabs.create({ url: 'read.html#' + a.id });
};
$$('#f button').forEach(b => b.onclick = () => { flt = b.dataset.f; $$('#f button').forEach(x => x.classList.toggle('on', x === b)); render(); });
$('#q').oninput = render;
$('#save').onclick = async () => { $('#save').disabled = true; $('#save').textContent = 'Saqlanmoqda...'; const t = await activeTab(); const r = await chrome.runtime.sendMessage({ type: 'save', tabId: t.id }); $('#save').disabled = false; $('#save').textContent = '📥 Shu sahifani saqlash'; if (r?.error) toast('Bu sahifani saqlab bo\'lmaydi'); else { toast('Saqlandi'); load(); } };
load();
