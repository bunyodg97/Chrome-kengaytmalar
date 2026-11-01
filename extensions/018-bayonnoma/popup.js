let tab;
async function render() {
  tab = await activeTab();
  if (!/meet\.google\.com|zoom\.us/.test(tab.url || '')) { $('#st').innerHTML = '<b>Yig\'ilish sahifasi ochilmagan</b><div class="muted small">Google Meet yoki Zoom (brauzer) yig\'ilishini oching.</div>'; return; }
  let s; try { s = await chrome.tabs.sendMessage(tab.id, { cmd: 'status' }); } catch { $('#st').innerHTML = 'Sahifani yangilang (F5).'; return; }
  $('#st').innerHTML = `<div class="row between"><b>${s.rec ? 'Yozilmoqda' : 'Tayyor'}</b>${s.rec ? '<span class="chip bad">● REC</span>' : ''}</div>
    <div class="small">Subtitrlar: ${s.captions ? '<span class="chip ok">ko\'rinmoqda</span>' : '<span class="chip warn">topilmadi — yoqing</span>'}</div>
    ${s.rec ? `<div class="small muted">${s.n} ta gap yozildi</div>` : ''}`;
  $('#rec').hidden = s.rec; $('#stop').hidden = !s.rec;
}
$('#rec').onclick = async () => { await chrome.tabs.sendMessage(tab.id, { cmd: 'start' }); render(); };
$('#stop').onclick = async () => { await chrome.tabs.sendMessage(tab.id, { cmd: 'stop' }); setTimeout(() => chrome.tabs.create({ url: 'archive.html' }), 1700); };
$('#all').onclick = () => chrome.tabs.create({ url: 'archive.html' });
render(); setInterval(render, 2000);
