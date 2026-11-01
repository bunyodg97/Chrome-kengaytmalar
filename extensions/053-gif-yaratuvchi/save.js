const id = location.hash.slice(1); let rec, url;
(async () => {
  rec = await DB.get(id); if (!rec) { document.querySelector('.page').innerHTML = '<div class="empty">GIF topilmadi.</div>'; return; }
  url = URL.createObjectURL(rec.blob); $('#img').src = url;
  $('#meta').textContent = `${rec.w}×${rec.h} · ${rec.n} kadr · ${rec.dur} s · ${fmtBytes(rec.blob.size)}`;
  const d = new Date(rec.t), p = n => String(n).padStart(2, '0'); $('#name').value = `GIF ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
})();
$('#save').onclick = async () => { await chrome.downloads.download({ url, filename: 'GIF/' + ($('#name').value.trim() || 'animatsiya').replace(/[\\/:*?"<>|]+/g, '-') + '.gif' }); await DB.del(id); toast('Saqlandi'); };
$('#cp').onclick = async () => { try { const c = document.createElement('canvas'); const i = $('#img'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); c.toBlob(async b => { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Birinchi kadr rasm sifatida nusxalandi'); }); } catch { toast('Nusxalab bo\'lmadi'); } };
let arm = false; $('#del').onclick = async () => { if (!arm) { arm = true; $('#del').textContent = 'Tasdiqlang'; return; } await DB.del(id); window.close(); };
