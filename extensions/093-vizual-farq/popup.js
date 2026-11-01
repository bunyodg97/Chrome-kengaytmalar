let tab, base = null;
async function init() {
  tab = await activeTab(); if (!/^https?:|^file:/.test(tab?.url || '')) { $('#st').textContent = 'Bu sahifada ishlamaydi'; $('#base').disabled = true; base = null; } else base = await DB.get(keyOf(tab.url)); $('#cmp').disabled = !base;
  $('#st').innerHTML = base ? `«Oldin» saqlangan: <b>${new Date(base.t).toLocaleString('uz')}</b><br>${base.w}×${base.h}${base.full ? ' (butun sahifa)' : ''}` : 'Bu sahifa uchun «oldin» holati yo\'q. Avval saqlang, keyin o\'zgartirib solishtiring.';
  if (base) $('#full').checked = !!base.full;
  const all = (await DB.all()).sort((a, b) => b.t - a.t);
  $('#list').innerHTML = all.length ? all.map(a => `<div class="item"><img src="${a.url}" alt=""><div class="grow small" style="min-width:0;word-break:break-all">${esc(a.id.replace(/^https?:\/\//, ''))}<div class="muted">${new Date(a.t).toLocaleString('uz')}</div></div><button class="ghost x" data-id="${esc(a.id)}">✕</button></div>`).join('') : '<div class="empty small">Yo\'q</div>';
}
$('#list').onclick = async e => { if (e.target.dataset.id) { await DB.del(e.target.dataset.id); init(); } };
$('#base').onclick = async () => { $('#base').disabled = true; $('#base').textContent = 'Suratga olinmoqda...'; try { const s = await shoot(tab, $('#full').checked); await DB.put({ id: keyOf(tab.url), ...s, t: Date.now() }); toast('Saqlandi'); } catch (e) { toast('Xato: ' + e.message); } $('#base').disabled = false; $('#base').textContent = '📸 «Oldin» holatini saqlash'; init(); };
$('#cmp').onclick = async () => { $('#cmp').textContent = 'Suratga olinmoqda...'; try { const s = await shoot(tab, $('#full').checked || !!base.full); await chrome.storage.local.set({ after: { ...s, t: Date.now(), id: keyOf(tab.url) } }); chrome.tabs.create({ url: 'diff.html', index: tab.index + 1 }); } catch (e) { toast('Xato: ' + e.message); } };
init();
