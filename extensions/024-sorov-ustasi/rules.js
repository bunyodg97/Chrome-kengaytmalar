let rules = [], t;
const TN = { block: 'Bloklash', redirect: 'Yo\'naltirish', header: 'Header o\'zgartirish', mock: 'Soxta javob (mock)' };
const save = () => { clearTimeout(t); t = setTimeout(() => store.set('rules', rules), 300); };
const M = ['ANY', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
function render() {
  $('#list').innerHTML = rules.map((r, i) => `<div class="card rule ${r.on ? '' : 'off'}" data-i="${i}">
    <div class="row between"><div class="row"><span class="chip acc">${TN[r.type]}</span><input data-k="name" value="${esc(r.name || '')}" placeholder="Nomi (ixtiyoriy)" style="width:240px"></div>
      <div class="row"><label class="inline"><input type="checkbox" data-k="on" ${r.on ? 'checked' : ''}> Yoqilgan</label><button class="ghost" data-a="up">↑</button><button class="ghost" data-a="dup">Nusxa</button><button class="danger" data-a="del">O'chirish</button></div></div>
    <div class="row"><label class="grow">Manzil namunasi<input data-k="pattern" value="${esc(r.pattern)}" class="mono" placeholder="||api.sayt.uz/v1/*"></label>
      <label>Metod<select data-k="method">${M.map(m => `<option ${r.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label></div>
    ${r.type === 'redirect' ? `<label>Yangi manzil<input data-k="to" value="${esc(r.to || '')}" class="mono" placeholder="http://localhost:3000/api/users"></label>` : ''}
    ${r.type === 'mock' ? `<div class="row"><label>Status<input data-k="status" type="number" value="${r.status || 200}" style="width:90px"></label><label>Kechikish (ms)<input data-k="delay" type="number" value="${r.delay || 0}" style="width:110px"></label><label class="grow">Content-Type<input data-k="ctype" value="${esc(r.ctype || 'application/json; charset=utf-8')}"></label></div>
      <label>Javob tanasi<textarea data-k="body" rows="6">${esc(r.body || '')}</textarea></label><div class="row"><button class="ghost" data-a="fmt">JSON'ni formatlash</button><span class="small muted" data-jv></span></div>` : ''}
    ${r.type === 'header' ? `<div class="list">${(r.headers || []).map((h, j) => `<div class="hrow" data-j="${j}">
      <select data-h="where"><option value="req" ${h.where === 'req' ? 'selected' : ''}>So'rov</option><option value="res" ${h.where === 'res' ? 'selected' : ''}>Javob</option></select>
      <select data-h="op"><option value="set" ${h.op === 'set' ? 'selected' : ''}>O'rnatish</option><option value="remove" ${h.op === 'remove' ? 'selected' : ''}>O'chirish</option></select>
      <input data-h="name" value="${esc(h.name)}" placeholder="Authorization"><input data-h="value" value="${esc(h.value || '')}" placeholder="Bearer …" ${h.op === 'remove' ? 'disabled' : ''}><button class="ghost" data-a="hdel" data-j="${j}">✕</button></div>`).join('')}
      <button class="ghost" data-a="hadd" style="align-self:flex-start">+ Header</button></div>` : ''}
  </div>`).join('') || '<div class="empty">Qoida yo\'q. Yuqoridan turini tanlab qo\'shing.</div>';
}
$('#add').onclick = () => {
  const type = $('#newType').value;
  const r = { id: Date.now(), on: true, type, name: '', pattern: '', method: 'ANY' };
  if (type === 'mock') Object.assign(r, { status: 200, delay: 300, body: '{\n  "ok": true,\n  "data": []\n}' });
  if (type === 'header') r.headers = [{ where: 'req', op: 'set', name: '', value: '' }];
  if (type === 'redirect') r.to = '';
  rules.unshift(r); render(); save();
};
$('#list').addEventListener('input', e => {
  const c = e.target.closest('[data-i]'); if (!c) return; const r = rules[+c.dataset.i];
  if (e.target.dataset.k) { const k = e.target.dataset.k; r[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; if (k === 'on') c.classList.toggle('off', !r.on); }
  if (e.target.dataset.h) { const j = +e.target.closest('[data-j]').dataset.j; r.headers[j][e.target.dataset.h] = e.target.value; if (e.target.dataset.h === 'op') render(); }
  if (e.target.dataset.k === 'body') { const jv = c.querySelector('[data-jv]'); try { JSON.parse(e.target.value); jv.textContent = 'JSON to\'g\'ri'; } catch { jv.textContent = /json/.test(r.ctype || 'json') ? 'JSON emas' : ''; } }
  save();
});
$('#list').addEventListener('click', e => {
  const a = e.target.dataset.a; if (!a) return; const i = +e.target.closest('[data-i]').dataset.i, r = rules[i];
  if (a === 'del') rules.splice(i, 1);
  if (a === 'dup') rules.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(r)), id: Date.now() });
  if (a === 'up' && i > 0) [rules[i - 1], rules[i]] = [rules[i], rules[i - 1]];
  if (a === 'hadd') r.headers.push({ where: 'req', op: 'set', name: '', value: '' });
  if (a === 'hdel') r.headers.splice(+e.target.dataset.j, 1);
  if (a === 'fmt') { try { r.body = JSON.stringify(JSON.parse(r.body), null, 2); } catch { return toast('JSON xato'); } }
  render(); save();
});
$('#exp').onclick = () => download('soruv-ustasi.json', JSON.stringify(rules, null, 2), 'application/json');
$('#imp').onchange = async e => { try { rules = [...JSON.parse(await e.target.files[0].text()), ...rules]; render(); save(); } catch { toast('Fayl noto\'g\'ri'); } };
chrome.storage.onChanged.addListener(c => { if (c.syncErr) $('#err').textContent = c.syncErr.newValue ? 'Qoidada xato: ' + c.syncErr.newValue : ''; });
store.get('rules', []).then(r => { rules = r; render(); });
