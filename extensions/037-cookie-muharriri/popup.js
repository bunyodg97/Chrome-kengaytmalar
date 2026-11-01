let tab, url, cookies = [], open = null;
const dec = v => { if (!$('#dec').checked) return v; try { return decodeURIComponent(v); } catch { return v; } };
const cUrl = c => (c.secure ? 'https://' : 'http://') + c.domain.replace(/^\./, '') + c.path;
async function load() { cookies = (await chrome.cookies.getAll({ url })).sort((a, b) => a.name.localeCompare(b.name)); render(); }
function render() {
  const s = $('#q').value.toLowerCase(); $('#cnt').textContent = cookies.length + ' ta';
  $('#list').innerHTML = cookies.map((c, i) => ({ c, i })).filter(({ c }) => !s || (c.name + c.value).toLowerCase().includes(s)).map(({ c, i }) => `<div class="ck" data-i="${i}">
    <div class="h"><b title="${esc(c.name)}">${esc(c.name)}</b><span class="v">${esc(dec(c.value))}</span>${c.httpOnly ? '<span class="chip">HttpOnly</span>' : ''}${c.secure ? '<span class="chip ok">Secure</span>' : ''}</div>
    <div class="f" ${open === c.name + c.domain + c.path ? '' : 'hidden'}>
      <label>Nomi<input data-k="name" value="${esc(c.name)}" class="mono"></label>
      <label>Qiymati<textarea data-k="value" rows="3">${esc(dec(c.value))}</textarea></label>
      <div class="grid2"><label>Domen<input data-k="domain" value="${esc(c.domain)}"></label><label>Yo'l<input data-k="path" value="${esc(c.path)}"></label></div>
      <div class="grid2"><label>Tugash vaqti<input data-k="exp" type="datetime-local" value="${c.expirationDate ? new Date(c.expirationDate * 1000 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ''}"></label>
        <label>SameSite<select data-k="sameSite">${['unspecified', 'no_restriction', 'lax', 'strict'].map(v => `<option ${c.sameSite === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
      <div class="flags"><label class="inline"><input type="checkbox" data-k="secure" ${c.secure ? 'checked' : ''}> Secure</label><label class="inline"><input type="checkbox" data-k="httpOnly" ${c.httpOnly ? 'checked' : ''}> HttpOnly</label><span class="muted small">${c.session ? 'Sessiya cookie\'si (bo\'sh = brauzer yopilguncha)' : ''}</span></div>
      <div class="row"><button data-a="save">Saqlash</button><button class="ghost" data-a="copy">Qiymatni nusxalash</button><button class="danger" data-a="del">O'chirish</button></div></div></div>`).join('') || '<div class="empty">Cookie yo\'q</div>';
}
async function setFrom(box, old) {
  const g = k => box.querySelector(`[data-k="${k}"]`);
  let value = g('value').value; if ($('#dec').checked && old && dec(old.value) === value) value = old.value; else if ($('#dec').checked) value = encodeURIComponent(value);
  const d = { url: (g('secure').checked ? 'https://' : 'http://') + g('domain').value.replace(/^\./, '') + g('path').value, name: g('name').value, value, path: g('path').value, secure: g('secure').checked, httpOnly: g('httpOnly').checked, sameSite: g('sameSite').value };
  if (g('domain').value.startsWith('.')) d.domain = g('domain').value;
  if (g('exp').value) d.expirationDate = new Date(g('exp').value).getTime() / 1000;
  if (d.sameSite === 'no_restriction' && !d.secure) return toast('SameSite=None uchun Secure kerak');
  if (old && (old.name !== d.name || old.domain !== g('domain').value || old.path !== d.path)) await chrome.cookies.remove({ url: cUrl(old), name: old.name, storeId: old.storeId });
  const r = await chrome.cookies.set(d); if (!r) return toast('Saqlab bo\'lmadi: ' + (chrome.runtime.lastError?.message || 'qiymatlarni tekshiring'));
  open = d.name + r.domain + r.path; toast('Saqlandi'); load();
}
$('#list').onclick = async e => {
  const box = e.target.closest('.ck'); if (!box) return; const c = cookies[+box.dataset.i];
  if (e.target.closest('.h')) { const k = c.name + c.domain + c.path; open = open === k ? null : k; render(); return; }
  const a = e.target.dataset.a; if (!a) return;
  if (a === 'save') setFrom(box, c);
  if (a === 'copy') copyText(c.value);
  if (a === 'del') { await chrome.cookies.remove({ url: cUrl(c), name: c.name, storeId: c.storeId }); load(); }
};
$('#q').oninput = render; $('#dec').onchange = render;
$('#add').onclick = async () => { const u = new URL(url); const r = await chrome.cookies.set({ url, name: 'yangi_cookie', value: 'qiymat', path: '/' }); if (r) { open = 'yangi_cookie' + r.domain + r.path; load(); } };
let arm = false;
$('#delAll').onclick = async () => { if (!arm) { arm = true; $('#delAll').textContent = 'Tasdiqlang'; setTimeout(() => { arm = false; $('#delAll').textContent = 'Hammasini o\'chirish'; }, 3000); return; }
  for (const c of cookies) await chrome.cookies.remove({ url: cUrl(c), name: c.name, storeId: c.storeId }); arm = false; $('#delAll').textContent = 'Hammasini o\'chirish'; load(); };
const host = () => new URL(url).hostname;
$('#exp').onclick = () => download(host() + '-cookies.json', JSON.stringify(cookies, null, 2), 'application/json');
$('#net').onclick = () => download(host() + '-cookies.txt', '# Netscape HTTP Cookie File\n' + cookies.map(c => [c.domain, c.domain.startsWith('.') ? 'TRUE' : 'FALSE', c.path, c.secure ? 'TRUE' : 'FALSE', Math.round(c.expirationDate || 0), c.name, c.value].join('\t')).join('\n'));
$('#hdr').onclick = () => copyText(cookies.map(c => `${c.name}=${c.value}`).join('; '));
$('#imp').onchange = async e => {
  try { const arr = JSON.parse(await e.target.files[0].text()); let n = 0;
    for (const c of arr) { const d = { url: (c.secure ? 'https://' : 'http://') + c.domain.replace(/^\./, '') + (c.path || '/'), name: c.name, value: c.value, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly };
      if (c.domain?.startsWith('.')) d.domain = c.domain; if (c.expirationDate) d.expirationDate = c.expirationDate; if (c.sameSite) d.sameSite = c.sameSite;
      if (await chrome.cookies.set(d)) n++; }
    toast(n + ' ta cookie qo\'shildi'); load(); } catch { toast('Fayl noto\'g\'ri'); }
};
(async () => {
  tab = await activeTab(); url = tab.url;
  if (!/^https?:/.test(url || '')) { $('.wrap').innerHTML = '<div class="empty">Oddiy veb-saytni oching.</div>'; return; }
  $('#url').textContent = new URL(url).origin; load();
})();
