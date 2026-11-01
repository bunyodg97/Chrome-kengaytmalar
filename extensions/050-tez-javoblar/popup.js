let L = TJ_DEFAULT;
const r = () => { const s = $('#q').value.toLowerCase(); $('#l').innerHTML = L.filter(x => (x.t + x.x).toLowerCase().includes(s)).map(x => `<div class="item" style="cursor:pointer;flex-direction:column;align-items:flex-start" data-id="${x.id}"><b class="small">${esc(x.t)}</b><span class="muted small">${esc(x.x.slice(0, 80))}</span></div>`).join(''); };
$('#q').oninput = r; $('#l').onclick = e => { const it = e.target.closest('[data-id]'); if (it) copyText(L.find(x => x.id == it.dataset.id).x); };
$('#m').onclick = () => chrome.runtime.openOptionsPage();
store.get('tj', TJ_DEFAULT).then(v => { L = v; r(); });
