let styles = {};
function render() {
  const keys = Object.keys(styles).sort((a, b) => a === '*' ? -1 : b === '*' ? 1 : a.localeCompare(b));
  $('#list').innerHTML = keys.map(k => `<div class="card"><div class="row between"><b>${k === '*' ? 'Barcha saytlar' : esc(k)}</b>
    <div class="row"><label class="inline"><input type="checkbox" data-on="${esc(k)}" ${styles[k].on ? 'checked' : ''}> Yoqilgan</label><button class="danger" data-del="${esc(k)}">O'chirish</button></div></div>
    <textarea data-css="${esc(k)}" rows="6" spellcheck="false">${esc(styles[k].css)}</textarea></div>`).join('') || '<div class="empty">Hali uslub yozilmagan. Saytni ochib, kengaytma tugmasini bosing.</div>';
}
let t;
$('#list').addEventListener('input', e => { const k = e.target.dataset.css; if (k === undefined) return; styles[k].css = e.target.value; clearTimeout(t); t = setTimeout(() => store.set('styles', styles), 300); });
$('#list').addEventListener('change', e => { const k = e.target.dataset.on; if (k !== undefined) { styles[k].on = e.target.checked; store.set('styles', styles); } });
$('#list').addEventListener('click', e => { const k = e.target.dataset.del; if (k !== undefined) { delete styles[k]; store.set('styles', styles); render(); } });
$('#exp').onclick = () => download('mening-uslubim.json', JSON.stringify(styles, null, 2), 'application/json');
$('#imp').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); styles = { ...styles, ...d }; await store.set('styles', styles); render(); toast('Import qilindi'); } catch { toast('Fayl noto\'g\'ri'); } };
store.get('styles', {}).then(s => { styles = s; render(); });
