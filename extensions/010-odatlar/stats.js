let habits = [];
function render() {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - 7 * 12 - start.getDay());
  $('#list').innerHTML = habits.map((h, i) => {
    let cells = '', total = 0, doneN = 0;
    for (let t = start.getTime(); t <= today.getTime(); t += 864e5) {
      const k = dk(t), on = !!h.done[k], d = due(h, t);
      if (d && k >= h.created) { total++; if (on) doneN++; }
      cells += `<i class="${on ? 'on' : ''} ${!d ? 'off' : ''} ${k === dk() ? 'today' : ''}" title="${k}${on ? ' ✓' : ''}"></i>`;
    }
    return `<div class="card" style="--c:${h.color}">
      <div class="hh"><input type="text" value="${esc(h.name)}" data-i="${i}" aria-label="Nomi"><span class="small muted">${h.days.length === 7 ? 'har kuni' : h.days.map(d => WD[d]).join(', ')}</span><button class="danger" data-del="${i}">O'chirish</button></div>
      <div class="stat"><div>Hozirgi seriya<b>🔥 ${streak(h)}</b></div><div>Eng uzun seriya<b>${best(h)}</b></div><div>12 haftada bajarilgan<b>${total ? Math.round(doneN / total * 100) : 0}%</b></div><div>Jami belgilangan<b>${Object.keys(h.done).length}</b></div></div>
      <div class="heat">${cells}</div></div>`;
  }).join('') || '<div class="empty">Odatlar yo\'q. Kengaytma tugmasini bosib qo\'shing.</div>';
}
$('#list').addEventListener('change', e => { if (e.target.dataset.i) { habits[+e.target.dataset.i].name = e.target.value; store.set('habits', habits); } });
let arm = -1;
$('#list').addEventListener('click', e => {
  const i = e.target.dataset.del; if (i === undefined) return;
  if (arm !== +i) { arm = +i; e.target.textContent = 'Tasdiqlang'; setTimeout(() => { arm = -1; render(); }, 3000); return; }
  habits.splice(+i, 1); store.set('habits', habits); arm = -1; render();
});
$('#exp').onclick = () => download('odatlar.json', JSON.stringify(habits, null, 2), 'application/json');
(async () => {
  habits = await store.get('habits', []); render();
  $('#rem').value = await store.get('remind', '21:00'); $('#remOn').checked = await store.get('remindOn', true);
})();
$('#rem').onchange = e => store.set('remind', e.target.value);
$('#remOn').onchange = e => store.set('remindOn', e.target.checked);
chrome.storage.onChanged.addListener(c => { if (c.habits) { habits = c.habits.newValue; render(); } });
