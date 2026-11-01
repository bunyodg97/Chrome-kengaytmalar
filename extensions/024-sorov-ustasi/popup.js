const TN = { block: 'Bloklash', redirect: 'Yo\'naltirish', header: 'Header', mock: 'Mock javob' };
let rules = [];
async function render() {
  const o = await chrome.storage.local.get(['rules', 'paused', 'syncErr']); rules = o.rules || [];
  $('#paused').checked = !!o.paused; $('#err').textContent = o.syncErr ? 'Xato: ' + o.syncErr : '';
  $('#list').innerHTML = rules.map((r, i) => `<label class="item" style="flex-direction:row;color:var(--ink)"><input type="checkbox" data-i="${i}" ${r.on ? 'checked' : ''}><span class="grow"><b class="small">${esc(r.name || r.pattern)}</b><br><span class="muted small mono">${esc(r.pattern.slice(0, 50))}</span></span><span class="chip acc">${TN[r.type]}</span></label>`).join('') || '<div class="empty">Qoidalar yo\'q</div>';
  const t = await activeTab(); const n = await chrome.runtime.sendMessage({ cmd: 'hits', tabId: t.id });
  $('#hits').textContent = `Shu tabda qoidalar ${n} marta ishladi (mock'lar bundan tashqari, ularni Console'da ko'rasiz).`;
}
$('#list').onchange = e => { const i = e.target.dataset.i; if (i === undefined) return; rules[+i].on = e.target.checked; chrome.storage.local.set({ rules }); };
$('#paused').onchange = e => chrome.storage.local.set({ paused: e.target.checked });
$('#edit').onclick = () => chrome.runtime.openOptionsPage();
render();
