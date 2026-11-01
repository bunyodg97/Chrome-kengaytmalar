tabsInit();
let tab, sel = '';
function show(t) { if (!t) { $('#q').innerHTML = '<div class="empty">Matn kiriting</div>'; return; } if (t.length > 2500) { $('#q').innerHTML = '<div class="empty">Matn juda uzun (2500 belgigacha)</div>'; return; } $('#q').innerHTML = qrSvg(t); $('#info').textContent = t.length > 120 ? t.slice(0, 120) + '…' : t; }
$('.tabs').addEventListener('click', e => { const t = e.target.dataset.tab; if (!t) return; $('#txt').hidden = t !== 'text'; if (t === 'page') show(tab.url); else { $('#txt').value = $('#txt').value || sel; show($('#txt').value); $('#txt').focus(); } });
$('#txt').oninput = e => show(e.target.value);
(async () => {
  tab = await activeTab();
  try { const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(getSelection()) }); sel = result.trim(); } catch { }
  if (sel) { $$('.tabs button')[1].click(); } else show(tab.url);
})();
