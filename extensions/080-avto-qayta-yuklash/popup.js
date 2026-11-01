let sel = [];
(async () => {
  sel = await store.get('sel', []);
  const ex = (await chrome.management.getAll()).filter(e => e.installType === 'development' && e.id !== chrome.runtime.id && e.type === 'extension');
  $('#list').innerHTML = ex.length ? ex.map(e => `<label class="item inline"><input type="checkbox" data-id="${e.id}" ${sel.includes(e.id) ? 'checked' : ''} style="width:auto"><img src="${e.icons?.[0]?.url || 'icons/16.png'}" alt=""><span class="grow">${esc(e.name)} <span class="small muted">${esc(e.version)}</span></span>${e.enabled ? '' : '<span class="chip warn">o\'chiq</span>'}</label>`).join('')
    : '<div class="empty">Unpacked kengaytma yo\'q. chrome://extensions → Developer mode → «Load unpacked».</div>';
  $('#rt').checked = await store.get('reloadTab', true); $('#tp').value = await store.get('tabPattern', '');
  const log = await store.get('log', []); $('#log').textContent = log[0] ? `Oxirgi: ${new Date(log[0].t).toLocaleTimeString('uz')} (${log[0].why}) · bugun ${log.filter(l => l.t > new Date().setHours(0, 0, 0, 0)).length} marta` : 'Alt+Shift+E — tanlanganlarni qayta yuklash';
})();
$('#list').onchange = e => { const id = e.target.dataset.id; sel = e.target.checked ? [...sel, id] : sel.filter(x => x !== id); store.set('sel', sel); };
$('#now').onclick = async () => { if (!sel.length) return toast('Avval kengaytmani belgilang'); await chrome.runtime.sendMessage({ type: 'reload', ids: sel }); toast('Qayta yuklandi'); };
$('#rt').onchange = () => store.set('reloadTab', $('#rt').checked); $('#tp').onchange = () => store.set('tabPattern', $('#tp').value.trim());
$('#watch').onclick = () => chrome.tabs.create({ url: 'watch.html' });
