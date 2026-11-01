const id = location.hash.slice(1);
let rec, url, ext, cfg;
async function doSave(saveAs) {
  const name = ($('#name').value.trim() || makeName(cfg.tpl)).replace(/[\\/:*?"<>|]+/g, '-');
  try {
    const dlId = await chrome.downloads.download({ url, filename: `Ekran Yozuvchi/${name}.${ext}`, saveAs: !!saveAs, conflictAction: 'uniquify' });
    if (dlId === undefined) return;
    if ($('#remember').checked) { cfg.nameMode = 'auto'; await store.set('cfg', cfg); }
    await DB.del(id);
    $('#form').hidden = true; $('#done').hidden = false;
    $('#done').innerHTML = `<b>✓ Saqlandi: ${esc(name)}.${ext}</b><div class="row"><button id="show">Papkada ko'rsatish</button><button class="ghost" id="close">Yopish</button></div>`;
    $('#show').onclick = () => chrome.downloads.show(dlId); $('#close').onclick = () => window.close();
    document.title = '✓ ' + name;
  } catch (e) { toast('Saqlab bo\'lmadi: ' + e.message); }
}
(async () => {
  cfg = { nameMode: 'ask', tpl: DEFAULT_TPL, ...(await store.get('cfg', {})) };
  rec = id && await DB.get(id);
  if (!rec) { document.querySelector('.page').innerHTML = '<div class="empty">Video topilmadi (allaqachon saqlangan yoki o\'chirilgan).</div>'; return; }
  ext = /mp4/.test(rec.mime) ? 'mp4' : 'webm';
  url = URL.createObjectURL(rec.blob); $('#v').src = url;
  $('#ext').textContent = '.' + ext;
  $('#meta').textContent = `${Math.floor(rec.dur / 60)}:${String(rec.dur % 60).padStart(2, '0')} · ${fmtBytes(rec.blob.size)} · ${ext.toUpperCase()}`;
  $('#name').value = makeName(cfg.tpl, new Date(rec.t));
  if (cfg.nameMode === 'auto') return doSave(false);
  $('#name').focus(); $('#name').select();
})();
$('#useDate').onclick = () => { $('#name').value = makeName(cfg.tpl); $('#name').focus(); };
$('#save').onclick = () => doSave(false);
$('#saveAs').onclick = () => doSave(true);
$('#name').onkeydown = e => { if (e.key === 'Enter') doSave(false); };
let arm = false;
$('#discard').onclick = async () => { if (!arm) { arm = true; $('#discard').textContent = 'Rostdan o\'chirilsinmi?'; return; } await DB.del(id); window.close(); };
