let habits = [];
const save = () => store.set('habits', habits);
$('#days').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `<label><input type="checkbox" value="${d}" checked>${WD[d]}</label>`).join('');
function render() {
  const t = dk(), todays = habits.filter(h => due(h));
  const done = todays.filter(h => h.done[t]).length;
  $('#today').textContent = 'Bugun: ' + new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
  $('#prog').textContent = `${done}/${todays.length}`;
  $('#list').innerHTML = habits.map((h, i) => !due(h) ? '' : `<div class="h ${h.done[t] ? 'done' : ''}" style="--c:${h.color}">
    <button class="ck" data-i="${i}" aria-label="Belgilash">${h.done[t] ? '✓' : ''}</button>
    <div class="grow"><div class="nm">${esc(h.name)}</div><div class="fire">🔥 ${streak(h)} kun ketma-ket · eng yaxshisi ${best(h)}</div></div></div>`).join('')
    || '<div class="empty">Hali odat yo\'q. Pastdan qo\'shing.</div>';
  if (!habits.length) $('#addBox').open = true;
}
$('#list').onclick = e => { const b = e.target.closest('.ck'); if (!b) return; const h = habits[+b.dataset.i], t = dk(); if (h.done[t]) delete h.done[t]; else h.done[t] = 1; save(); render(); };
$('#f').onsubmit = e => {
  e.preventDefault(); const days = $$('#days input:checked').map(x => +x.value);
  if (!days.length) return toast('Kamida bitta kun tanlang');
  habits.push({ id: Date.now(), name: $('#name').value.trim(), color: COLS[habits.length % COLS.length], days, done: {}, created: dk() });
  save(); $('#f').reset(); $$('#days input').forEach(x => x.checked = true); render();
};
$('#stats').onclick = () => chrome.tabs.create({ url: 'stats.html' });
store.get('habits', []).then(h => { habits = h; render(); });
