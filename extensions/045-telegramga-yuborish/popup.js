let tab;
(async () => {
  tab = await activeTab(); $('#t').textContent = tab.title; $('#u').textContent = tab.url;
  const c = await cfg(); if (!c.token || !c.chats.length) { $('#st').innerHTML = 'Avval sozlamalarda bot va chatni ulang.'; $('#go').textContent = 'Sozlash'; $('#go').onclick = () => chrome.runtime.openOptionsPage(); return; }
  $('#chat').innerHTML = c.chats.map((ch, i) => `<option value="${i}">${esc(ch.name || ch.id)}</option>`).join('');
  $('#go').onclick = async () => { $('#go').disabled = true; try { await sendTo(c.chats[+$('#chat').value].id, 'page', { title: tab.title, url: tab.url, note: $('#note').value.trim() }); $('#st').innerHTML = '<span class="chip ok">Yuborildi</span>'; setTimeout(() => window.close(), 900); } catch (e) { $('#st').textContent = 'Xato: ' + e.message; $('#go').disabled = false; } };
})();
$('#set').onclick = () => chrome.runtime.openOptionsPage();
$('#note').onkeydown = e => { if (e.key === 'Enter' && e.ctrlKey) $('#go').click(); };
