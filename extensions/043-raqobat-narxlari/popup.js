(async () => {
  const ps = await store.get('products', []);
  $('#list').innerHTML = ps.map(p => { const s = p.last?.stats; let c = '', t = 'tekshirilmagan';
    if (s?.n) { if (!p.myPrice) { c = 'acc'; t = 'min ' + som(s.min); } else if (p.myPrice <= s.min) { c = 'ok'; t = 'Eng arzon'; } else if (p.myPrice <= s.med) { c = 'warn'; t = `${s.rank}/${s.n} o'rin`; } else { c = 'bad'; t = `+${s.vsMed}%`; } }
    return `<div class="item" style="flex-direction:column;align-items:stretch;gap:2px"><div class="row between"><b class="small">${esc(p.name)}</b><span class="chip ${c}">${esc(t)}</span></div><div class="muted small">Siz: ${som(p.myPrice)}${s?.n ? ` · min ${som(s.min)} · mediana ${som(s.med)}` : ''}</div></div>`; }).join('') || '<div class="empty">Kuzatuvdagi mahsulot yo\'q</div>';
})();
$('#open').onclick = () => chrome.tabs.create({ url: 'app.html' });
$('#add').onclick = () => chrome.tabs.create({ url: 'app.html#add' });
