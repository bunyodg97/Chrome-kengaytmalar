if (new URLSearchParams(location.search).get('full')) { $('#root').classList.add('page'); $('#big').hidden = true; } else document.body.classList.add('popup');
let snips = [], edit = null, lang = '';
const save = () => store.set('snips', snips);
function render() {
  const q = $('#q').value.toLowerCase().split(/\s+/).filter(Boolean);
  const langs = [...new Set(snips.map(s => s.lang))];
  $('#langs').innerHTML = langs.length > 1 ? langs.map(l => `<span class="chip ${l === lang ? 'acc' : ''}" data-l="${l}" style="cursor:pointer">${l}</span>`).join('') : '';
  const arr = snips.filter(n => (!lang || n.lang === lang) && q.every(w => (n.title + ' ' + n.tags.join(' ') + ' ' + n.lang + ' ' + n.code).toLowerCase().includes(w)));
  $('#list').innerHTML = arr.length ? arr.map(n => `<div class="card sn" data-id="${n.id}"><div class="h"><b>${esc(n.title)}</b><span class="chip">${esc(n.lang)}</span>${n.tags.map(t => `<span class="chip acc">#${esc(t)}</span>`).join('')}<button class="ghost" data-c>Nusxa</button><button class="ghost" data-e>✎</button></div><pre>${hl(n.code, n.lang)}</pre></div>`).join('')
    : `<div class="empty">${snips.length ? 'Topilmadi' : 'Hali parcha yo\'q. «+ Yangi» yoki saytdagi kodni o\'ng tugma bilan saqlang.'}</div>`;
}
function open(n) { edit = n; $('#ed').hidden = false; $('#et').value = n?.title || ''; $('#el').value = n?.lang || 'js'; $('#eg').value = n?.tags.join(', ') || ''; $('#ec').value = n?.code || ''; $('#edel').hidden = !n; $('#ec').focus(); }
$('#new').onclick = () => open(null); $('#ecan').onclick = () => $('#ed').hidden = true;
$('#ec').oninput = () => { if (!edit && $('#ec').value.length > 15) $('#el').value = guessLang($('#ec').value); };
$('#ec').onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } };
$('#esv').onclick = () => { const code = $('#ec').value; if (!code.trim()) return toast('Kod bo\'sh');
  const o = { title: $('#et').value.trim() || code.trim().split('\n')[0].slice(0, 60), lang: $('#el').value, tags: $('#eg').value.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean), code };
  if (edit) Object.assign(edit, o); else snips.unshift({ id: crypto.randomUUID(), ...o, t: Date.now(), used: 0 }); save(); $('#ed').hidden = true; render(); };
$('#edel').onclick = () => { if (confirm('O\'chirilsinmi?')) { snips = snips.filter(x => x !== edit); save(); $('#ed').hidden = true; render(); } };
$('#list').onclick = e => { const c = e.target.closest('.sn'); if (!c) return; const n = snips.find(x => x.id === c.dataset.id);
  if (e.target.closest('[data-c]')) { copyText(n.code); n.used = (n.used || 0) + 1; save(); } if (e.target.closest('[data-e]')) { open(n); scrollTo(0, 0); } };
$('#langs').onclick = e => { const l = e.target.dataset.l; if (l) { lang = lang === l ? '' : l; render(); } };
$('#q').oninput = render;
$('#exp').onclick = () => download('kod-parchalari.json', JSON.stringify(snips, null, 1), 'application/json');
$('#imp').onchange = async e => { try { const a = JSON.parse(await e.target.files[0].text()); const ids = new Set(snips.map(s => s.id)); a.forEach(n => n.code && !ids.has(n.id) && snips.push({ tags: [], lang: 'js', ...n, id: n.id || crypto.randomUUID() })); save(); render(); toast('Import qilindi'); } catch { toast('Fayl noto\'g\'ri'); } };
chrome.storage.onChanged.addListener(c => { if (c.snips) { snips = c.snips.newValue || []; if ($('#ed').hidden) render(); } });
(async () => { snips = await store.get('snips', []); render(); })();
