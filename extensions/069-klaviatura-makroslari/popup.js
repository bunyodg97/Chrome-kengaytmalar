if (new URLSearchParams(location.search).get('full')) { $('#root').classList.add('page'); $('#big').hidden = true; $('#hostl').hidden = true; } else document.body.classList.add('popup');
let macros = [], host = '';
const save = () => store.set('macros', macros);
function render() {
  const q = $('#q').value.toLowerCase();
  $('#list').innerHTML = macros.filter(m => (m.k + m.v).toLowerCase().includes(q)).map(m => `<div class="item m" data-k="${esc(m.k)}"><span class="k">${esc(m.k)}</span><span class="v grow">${esc(m.v)}</span><button class="ghost" data-e>✎</button><button class="ghost" data-d>✕</button></div>`).join('') || '<div class="empty">Makros yo\'q</div>';
}
$('#sv').onclick = () => { const k = $('#k').value.trim(), v = $('#v').value; if (!k || !v) return toast('Ikkalasini to\'ldiring'); if (/\s/.test(k)) return toast('Qisqa so\'zda bo\'sh joy bo\'lmasin');
  const i = macros.findIndex(m => m.k === k); if (i >= 0) macros[i].v = v; else macros.unshift({ k, v }); save(); render(); $('#k').value = $('#v').value = ''; toast('Saqlandi'); };
$('#list').onclick = e => { const it = e.target.closest('.item'); if (!it) return; const m = macros.find(x => x.k === it.dataset.k);
  if (e.target.closest('[data-d]')) { macros = macros.filter(x => x !== m); save(); render(); } if (e.target.closest('[data-e]')) { $('#k').value = m.k; $('#v').value = m.v; $('#v').focus(); } };
$('#q').oninput = render; $('#on').onchange = () => store.set('off', !$('#on').checked);
$('#hoff').onchange = async () => { const a = await store.get('offHosts', []); store.set('offHosts', $('#hoff').checked ? [...new Set([...a, host])] : a.filter(h => h !== host)); };
$('#exp').onclick = () => download('makroslar.json', JSON.stringify(macros, null, 1), 'application/json');
$('#imp').onchange = async e => { try { const a = JSON.parse(await e.target.files[0].text()); a.forEach(n => { if (n.k && n.v) { const i = macros.findIndex(m => m.k === n.k); if (i >= 0) macros[i] = n; else macros.push(n); } }); save(); render(); toast(a.length + ' ta import'); } catch { toast('Fayl noto\'g\'ri'); } };
(async () => {
  macros = await store.get('macros', null); if (!macros) { macros = KM_DEFAULT; save(); }
  $('#on').checked = !(await store.get('off', false)); render();
  try { const t = await activeTab(); host = new URL(t.url).hostname; $('#host').textContent = host; $('#hoff').checked = (await store.get('offHosts', [])).includes(host); if (!/^https?:/.test(t.url)) $('#hostl').hidden = true; } catch { $('#hostl').hidden = true; }
})();
