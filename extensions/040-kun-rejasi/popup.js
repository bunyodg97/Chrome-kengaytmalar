let days = {}, cur = dk();
const PC = { 1: 'var(--line)', 2: 'var(--warn)', 3: 'var(--bad)' };
const OY = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const KUN = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const save = () => store.set('days', days);
const D = () => (days[cur] = days[cur] || { tasks: [], note: '' });
function render() {
  const d = new Date(cur + 'T12:00'), rel = cur === dk() ? 'Bugun' : cur === dk(Date.now() + 864e5) ? 'Ertaga' : cur === dk(Date.now() - 864e5) ? 'Kecha' : KUN[d.getDay()];
  $('#day').textContent = `${rel}, ${d.getDate()}-${OY[d.getMonth()]}`;
  const ts = (days[cur]?.tasks || []).slice().sort((a, b) => a.done - b.done || (a.time || '99').localeCompare(b.time || '99') || b.pri - a.pri);
  const done = ts.filter(t => t.done).length;
  $('#prog').textContent = ts.length ? `${done}/${ts.length}` : ''; $('#pbar').style.width = ts.length ? done / ts.length * 100 + '%' : '0';
  $('#list').innerHTML = ts.map(t => `<div class="t ${t.done ? 'done' : ''}" style="--p:${PC[t.pri]}" data-id="${t.id}"><input type="checkbox" ${t.done ? 'checked' : ''}>${t.time ? `<time>${t.time}</time>` : ''}<span class="x">${esc(t.t)}</span><button data-mv title="Ertaga ko'chirish">→</button><button data-del title="O'chirish">✕</button></div>`).join('') || '<div class="empty">Reja bo\'sh. Yuqoriga yozing.</div>';
  $('#note').value = days[cur]?.note || '';
  const y = days[dk(Date.now() - 864e5)]?.tasks.filter(t => !t.done) || [];
  $('#carry').hidden = !(cur === dk() && y.length); $('#carry').textContent = `Kechagi ${y.length} ta bajarilmaganni bugunga ko'chirish`;
}
$('#f').onsubmit = e => { e.preventDefault(); D().tasks.push({ id: Date.now(), t: $('#txt').value.trim(), time: $('#time').value, pri: +$('input[name=p]:checked').value, done: false }); $('#f').reset(); save(); render(); $('#txt').focus(); };
$('#list').onclick = e => { const el = e.target.closest('[data-id]'); if (!el) return; const ts = D().tasks, i = ts.findIndex(t => t.id == el.dataset.id);
  if (e.target.type === 'checkbox') ts[i].done = e.target.checked;
  else if (e.target.hasAttribute('data-del')) ts.splice(i, 1);
  else if (e.target.hasAttribute('data-mv')) { const nk = dk(new Date(cur + 'T12:00').getTime() + 864e5); (days[nk] = days[nk] || { tasks: [], note: '' }).tasks.push({ ...ts[i], id: Date.now() }); ts.splice(i, 1); toast('Ertaga ko\'chirildi'); }
  else return; save(); render(); };
$('#carry').onclick = () => { const yk = dk(Date.now() - 864e5), y = days[yk].tasks; D().tasks.push(...y.filter(t => !t.done).map(t => ({ ...t, id: Date.now() + Math.random() }))); days[yk].tasks = y.filter(t => t.done); save(); render(); };
let nt; $('#note').oninput = e => { D().note = e.target.value; clearTimeout(nt); nt = setTimeout(save, 400); };
const shift = n => { cur = dk(new Date(cur + 'T12:00').getTime() + n * 864e5); render(); };
$('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1); $('#today').onclick = () => { cur = dk(); render(); };
$('#before').onchange = e => store.set('before', +e.target.value);
(async () => { days = await store.get('days', {}); $('#before').value = await store.get('before', 10); render(); $('#txt').focus(); })();
