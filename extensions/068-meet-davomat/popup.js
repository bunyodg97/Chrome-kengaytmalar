if (new URLSearchParams(location.search).get('full')) $('#root').classList.add('page'); else document.body.classList.add('popup');
let sessions = [], cur = null;
const hm = t => new Date(t).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
const dur = p => p.seen.reduce((a, [f, t]) => a + (t - f) + 10000, 0);
const mins = ms => Math.round(ms / 60000);
function rows(s) { const min = +$('#min').value || 0; return Object.entries(s.people).map(([n, p]) => ({ n, first: p.first, last: p.last, d: dur(p), k: p.seen.length })).sort((a, b) => a.first - b.first).map((r, i) => ({ ...r, i: i + 1, ok: mins(r.d) >= min })); }
function list() {
  $('#detail').hidden = true; $('#lst').hidden = false;
  $('#lst').innerHTML = sessions.length ? sessions.map(s => `<div class="item" data-id="${s.id}" style="cursor:pointer"><div class="grow"><b>${esc(s.title || s.code)}</b><div class="small muted">${new Date(s.start).toLocaleDateString('uz')} · ${hm(s.start)}–${hm(s.end)} · ${Object.keys(s.people).length} kishi</div></div>›</div>`).join('') : '<div class="empty">Hali sessiya yo\'q</div>';
}
function show(s) {
  cur = s; $('#lst').hidden = true; $('#detail').hidden = false; $('#dt').textContent = s.title || s.code; $('#dm').textContent = `${new Date(s.start).toLocaleDateString('uz')} · ${hm(s.start)}–${hm(s.end)} · ${mins(s.end - s.start)} daqiqa · kod: ${s.code}`;
  const r = rows(s);
  $('#tbl').innerHTML = '<tr><th>#</th><th>Ism</th><th>Kirdi</th><th>Chiqdi</th><th>Daq.</th></tr>' + r.map(x => `<tr><td>${x.i}</td><td>${esc(x.n)} ${x.ok ? '' : '<span class="chip warn">qisqa</span>'}${x.k > 1 ? ` <span class="small muted" title="Necha marta kirgan">×${x.k}</span>` : ''}</td><td>${hm(x.first)}</td><td>${hm(x.last)}</td><td>${mins(x.d)}</td></tr>`).join('');
}
$('#lst').onclick = e => { const it = e.target.closest('.item'); if (it) show(sessions.find(s => s.id === it.dataset.id)); };
$('#back').onclick = list; $('#min').oninput = () => { store.set('min', +$('#min').value); show(cur); };
const table = s => [['№', 'Ism', 'Kirdi', 'Chiqdi', 'Qatnashdi (daq)', 'Kirishlar soni', 'Holat'], ...rows(s).map(x => [x.i, x.n, hm(x.first), hm(x.last), mins(x.d), x.k, x.ok ? 'Qatnashdi' : 'Qisqa'])];
const fname = s => `davomat-${(s.title || s.code).replace(/[\\/:*?"<>|]/g, '').slice(0, 40)}-${new Date(s.start).toISOString().slice(0, 10)}`;
$('#xlsx').onclick = () => { const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet([[cur.title || cur.code], [`Sana: ${new Date(cur.start).toLocaleDateString('uz')}, ${hm(cur.start)}–${hm(cur.end)}`], [], ...table(cur)]); ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 14 }, { wch: 11 }]; XLSX.utils.book_append_sheet(wb, ws, 'Davomat'); XLSX.writeFile(wb, fname(cur) + '.xlsx'); };
$('#csv').onclick = () => download(fname(cur) + '.csv', '﻿' + table(cur).map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
$('#del').onclick = async () => { if (!confirm('Sessiya o\'chirilsinmi?')) return; sessions = sessions.filter(s => s !== cur); await store.set('sessions', sessions); list(); };
$('#on').onchange = () => store.set('paused', !$('#on').checked);
(async () => {
  sessions = await store.get('sessions', []); $('#on').checked = !(await store.get('paused', false)); $('#min').value = await store.get('min', 10);
  const live = await store.get('live', null);
  if (live && Date.now() - live.t < 30000) { $('#live').innerHTML = `🔴 Jonli: hozir ${live.n} kishi ko'rinmoqda. <a href="#" id="ol">Ochish</a>`; $('#ol').onclick = e => { e.preventDefault(); show(sessions.find(s => s.id === live.id)); }; }
  list();
})();
