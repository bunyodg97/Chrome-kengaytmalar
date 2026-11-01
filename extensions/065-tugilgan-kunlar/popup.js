const P = new URLSearchParams(location.search); if (!P.get('full')) document.body.classList.add('popup'); else document.getElementById('root').classList.add('page');
let people = [], edit = null;
const save = () => store.set('people', people);
function render() {
  const q = $('#q').value.toLowerCase();
  const arr = people.filter(p => (p.name + ' ' + (p.rel || '') + ' ' + (p.note || '')).toLowerCase().includes(q)).map(p => ({ p, n: nextDate(p) })).sort((a, b) => a.n.days - b.n.days);
  $('#list').innerHTML = arr.length ? arr.map(({ p, n }) => `<div class="item ${n.days ? '' : 'today'}" data-id="${p.id}">
    <div class="d">${n.days ? n.days : '🎂'}<small>${n.days ? 'kun' : 'bugun'}</small></div>
    <div class="grow"><b>${esc(p.name)}</b><div class="small muted">${fmtD(p)}${n.age ? ` · ${n.age} yosh bo'ladi` : ''} · ${esc(p.rel || '')}${p.note ? ' · ' + esc(p.note) : ''}</div></div>
    <button class="ghost" data-w title="Tabrik matni">✉</button><button class="ghost" data-e title="Tahrirlash">✎</button></div>`).join('')
    : `<div class="empty">${people.length ? 'Topilmadi' : 'Hali hech kim yo\'q. «+ Qo\'shish» ni bosing yoki CSV import qiling.'}</div>`;
}
$('#list').onclick = e => { const it = e.target.closest('.item'); if (!it) return; const p = people.find(x => x.id === it.dataset.id); if (e.target.closest('[data-w]')) wish(p); else if (e.target.closest('[data-e]')) open(p); };
function open(p) {
  edit = p; $('#dt').textContent = p ? 'Tahrirlash' : 'Yangi odam'; $('#del').hidden = !p;
  $('#fn').value = p?.name || ''; $('#fd').value = p ? `${p.y || 2000}-${p.d}` : ''; $('#fy').checked = p ? !p.y : false; $('#fr').value = p?.rel || 'Do\'st'; $('#fo').value = p?.note || '';
  $('#dlg').showModal(); $('#fn').focus();
}
$('#add').onclick = () => open(null); $('#cancel').onclick = () => $('#dlg').close();
$('#del').onclick = () => { if (confirm('O\'chirilsinmi?')) { people = people.filter(x => x !== edit); save(); render(); $('#dlg').close(); } };
$('#dlg').querySelector('form').onsubmit = e => {
  const [y, m, d] = $('#fd').value.split('-');
  const o = { id: edit?.id || crypto.randomUUID(), name: $('#fn').value.trim(), d: `${m}-${d}`, y: $('#fy').checked ? null : +y, rel: $('#fr').value, note: $('#fo').value.trim() };
  if (edit) Object.assign(edit, o); else people.push(o); save(); render();
};
let wp = null, wl = 'uz', wi = 0;
function wish(p) { wp = p; wi = Math.floor(Math.random() * 3); $('#wt').textContent = 'Tabrik: ' + p.name; showW(); $('#wd').showModal(); }
function showW() { const a = TABRIK[wl]; $('#wx').value = a[wi % a.length](wp.name.split(' ')[0]); $$('#lt button').forEach(b => b.classList.toggle('on', b.dataset.l === wl)); }
$$('#lt button').forEach(b => b.onclick = () => { wl = b.dataset.l; showW(); });
$('#wn').onclick = () => { wi++; showW(); }; $('#wc2').onclick = () => $('#wd').close(); $('#wcp').onclick = () => copyText($('#wx').value);
$('#q').oninput = render; $('#more').onclick = () => $('#cfg').hidden = !$('#cfg').hidden;
$('#before').onchange = () => store.set('before', $('#before').value.split(/[,\s]+/).map(Number).filter(x => x > 0));
$('#hour').onchange = () => store.set('hour', +$('#hour').value);
$('#exp').onclick = () => download('tugilgan-kunlar.csv', '﻿Ism,Sana,Kim,Izoh\n' + people.map(p => { const [m, d] = p.d.split('-'); return [p.name, `${d}.${m}${p.y ? '.' + p.y : ''}`, p.rel, p.note].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','); }).join('\n'), 'text/csv');
function splitCsv(l) { const out = []; let cur = '', q = false; const sep = !l.includes(',') && l.includes(';') ? ';' : ',';
  for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === sep) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  out.push(cur.trim()); return out; }
$('#imp').onchange = async e => {
  const t = await e.target.files[0].text(); let n = 0;
  for (const line of t.replace(/^﻿/, '').split(/\r?\n/)) {
    const c = splitCsv(line);
    const m = (c[1] || '').match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?$/); if (!c[0] || !m) continue;
    people.push({ id: crypto.randomUUID(), name: c[0], d: `${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, y: m[3] ? +m[3] : null, rel: c[2] || 'Boshqa', note: c[3] || '' }); n++;
  }
  save(); render(); toast(n + ' ta qo\'shildi');
};
(async () => {
  people = await store.get('people', []); $('#before').value = (await store.get('before', [3, 1])).join(', '); $('#hour').value = await store.get('hour', 9); render();
  if (P.get('wish')) { const p = people.find(x => x.id === P.get('wish')); if (p) wish(p); }
})();
