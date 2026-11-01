(async () => {
  const $ = id => document.getElementById(id);
  const C = { yellow: '#f2d649', green: '#7fd17b', blue: '#7eb8f2', pink: '#f28cb9' };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  $('all').onclick = () => { chrome.tabs.create({ url: 'all.html' }); window.close(); };
  $('add').onclick = async () => {
    try { await chrome.tabs.sendMessage(tab.id, { type: 'addNote', center: true }); window.close(); }
    catch { $('list').innerHTML = '<div class="empty">Bu sahifaga stiker qo\'yib bo\'lmaydi (yoki sahifani yangilang — F5).</div>'; }
  };

  let res = null;
  try { res = await chrome.tabs.sendMessage(tab.id, { type: 'list' }); } catch {}
  if (!res) { $('list').innerHTML = '<div class="empty">Bu sahifada ishlamaydi.<br>Kengaytma o\'rnatilgandan oldin ochilgan bo\'lsa — F5 bosing.</div>'; return; }
  if (!res.items.length) { $('list').innerHTML = '<div class="empty">Hali stiker yoki marker yo\'q.</div>'; return; }
  $('list').innerHTML = '';
  for (const it of res.items) {
    const el = document.createElement('div'); el.className = 'it';
    const d = document.createElement('span'); d.className = 'dot'; d.style.background = C[it.color] || C.yellow;
    if (it.type === 'hl') d.style.borderRadius = '50%';
    const tx = document.createElement('span'); tx.className = 'tx';
    tx.textContent = (it.type === 'note' ? '📝 ' : '🖍 ') + (it.text || '(bo\'sh stiker)');
    el.append(d, tx);
    el.onclick = () => { chrome.tabs.sendMessage(tab.id, { type: 'focus', id: it.id }); window.close(); };
    $('list').append(el);
  }
})();
