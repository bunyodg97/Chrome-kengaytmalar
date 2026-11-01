const opt = (o, sel) => Object.entries(o).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v[2]}</option>`).join('');
$('#cat').innerHTML = Object.keys(UNITS).map(c => `<option>${c}</option>`).join('');
function fill(f, t) { const u = UNITS[$('#cat').value].u, ks = Object.keys(u); $('#from').innerHTML = opt(u, f || ks[0]); $('#to').innerHTML = opt(u, t || ks[1]); calc(); }
function calc() {
  const c = $('#cat').value, v = parseFloat($('#v').value.replace(/\s/g, '').replace(',', '.')); if (isNaN(v)) { $('#res').textContent = '—'; return; }
  const u = UNITS[c].u; $('#res').textContent = `${fmt(convert(c, $('#from').value, $('#to').value, v))} ${u[$('#to').value][2]}`;
  $('#all').innerHTML = Object.keys(u).filter(k => k !== $('#from').value).map(k => `<div class="item"><span class="muted">${u[k][2]}</span><b>${fmt(convert(c, $('#from').value, k, v))}</b></div>`).join('');
  store.set('last', { c, f: $('#from').value, t: $('#to').value, v: $('#v').value });
}
$('#cat').onchange = () => fill(); $('#from').onchange = $('#to').onchange = $('#v').oninput = calc;
$('#sw').onclick = () => fill($('#to').value, $('#from').value);
$('#cp').onclick = () => copyText($('#res').textContent);
$('#auto').onchange = () => store.set('off', !$('#auto').checked);
(async () => { const l = await store.get('last', null); if (l) { $('#cat').value = l.c; $('#v').value = l.v; fill(l.f, l.t); } else { $('#cat').value = 'Uzunlik'; fill('inch', 'sm'); } $('#auto').checked = !(await store.get('off', false)); $('#v').select(); })();
