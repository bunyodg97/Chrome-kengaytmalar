const INFO = { LCP: 'Eng katta element chiqish vaqti', INP: 'Bosishga javob tezligi', CLS: 'Sahifa «sakrashi»', FCP: 'Birinchi kontent chiqishi', TTFB: 'Server javobi' };
const LBL = { good: 'Yaxshi', ni: 'O\'rtacha', poor: 'Yomon', na: '—' };
(async () => {
  $('#ov').checked = await store.get('overlay', true);
  const tab = await activeTab(); let m;
  try { m = await chrome.tabs.sendMessage(tab.id, { cmd: 'get' }); } catch { $('#list').innerHTML = '<div class="empty">Sahifani yangilang (F5) — o\'lchov yuklanishdan boshlanadi.</div>'; return; }
  $('#list').innerHTML = Object.keys(INFO).map(k => { const r = rate(k, m[k]); return `<div class="v"><b>${k}</b><div><div class="small">${INFO[k]}</div><div class="muted small">yaxshi ≤ ${fmtV(k, TH[k][0])}</div></div><div style="text-align:right"><div class="val ${r}">${fmtV(k, m[k])}</div><div class="small ${r}">${LBL[r]}</div></div></div>`; }).join('');
})();
$('#ov').onchange = e => store.set('overlay', e.target.checked);
