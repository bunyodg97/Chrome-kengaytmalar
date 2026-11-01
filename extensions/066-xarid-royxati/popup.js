let items = [], usd = 0, rub = 0, flt = 'all';
const som = n => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' so\'m';
const toUzs = i => i.price == null ? 0 : i.cur === 'USD' ? i.price * usd : i.cur === 'RUB' ? i.price * rub : i.price;
const save = () => store.set('items', items);
function render() {
  const sum = items.filter(i => !i.done).reduce((a, i) => a + toUzs(i) * i.qty, 0), sd = items.filter(i => i.done).reduce((a, i) => a + toUzs(i) * i.qty, 0);
  $('#tot').textContent = som(sum); $('#tdone').textContent = som(sd);
  const arr = items.filter(i => flt === 'all' || (flt === 'done') === i.done), groups = {};
  arr.forEach(i => (groups[i.host || 'Qo\'lda'] ||= []).push(i));
  $('#list').innerHTML = arr.length ? Object.entries(groups).map(([h, a]) => `<div class="grp">${esc(h)} · ${som(a.reduce((s, i) => s + toUzs(i) * i.qty, 0))}</div><div class="list">` + a.map(i => `<div class="item it ${i.done ? 'done' : ''}" data-id="${i.id}">
    <input type="checkbox" class="ck" ${i.done ? 'checked' : ''} style="width:auto">${i.img ? `<img src="${esc(i.img)}" alt="">` : ''}
    <div class="grow" style="min-width:0">${i.url ? `<a href="${esc(i.url)}" target="_blank" style="color:inherit;text-decoration:none"><b>${esc(i.name)}</b></a>` : `<b>${esc(i.name)}</b>`}
    <div class="row" style="gap:4px;margin-top:3px"><input class="q" type="number" min="1" value="${i.qty}" title="Soni">×<input class="p" type="number" min="0" value="${i.price ?? ''}" placeholder="narx"><select class="c" style="width:auto;padding:4px"><option ${i.cur === 'UZS' ? 'selected' : ''}>UZS</option><option ${i.cur === 'USD' ? 'selected' : ''}>USD</option><option ${i.cur === 'RUB' ? 'selected' : ''}>RUB</option></select></div></div>
    <button class="ghost x" title="O'chirish">✕</button></div>`).join('') + '</div>').join('') : '<div class="empty">Ro\'yxat bo\'sh. Do\'kon sahifasida «+ qo\'shish» ni bosing yoki o\'ng tugma → «Xarid ro\'yxatiga qo\'shish».</div>';
}
$('#list').onchange = e => { const id = e.target.closest('.item')?.dataset.id, i = items.find(x => x.id === id); if (!i) return;
  if (e.target.matches('.ck')) i.done = e.target.checked; if (e.target.matches('.q')) i.qty = Math.max(1, +e.target.value || 1);
  if (e.target.matches('.p')) i.price = e.target.value === '' ? null : +e.target.value; if (e.target.matches('.c')) i.cur = e.target.value; save(); render(); };
$('#list').onclick = e => { if (e.target.matches('.x')) { items = items.filter(x => x.id !== e.target.closest('.item').dataset.id); save(); render(); } };
$('#add').onclick = async () => { const t = await activeTab(); const r = await chrome.runtime.sendMessage({ type: 'add', tabId: t.id }); if (r?.error) return toast('Bu sahifada ishlamaydi'); items = await store.get('items', []); render(); toast(r.price ? 'Qo\'shildi' : 'Qo\'shildi — narxni qo\'lda kiriting'); };
$('#madd').onclick = $('#manual').onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; const v = $('#manual').value.trim(); if (!v) return;
  const m = v.match(/^(.*?)(?:\s+(\d+)\s*(?:dona|ta|x|kg|l)?)?(?:\s+(\d[\d\s]*))?\s*(?:so'?m|\$)?$/i);
  items.unshift({ id: crypto.randomUUID(), name: m[1] || v, qty: +(m[3] ? m[2] : 1) || 1, price: m[3] ? +m[3].replace(/\s/g, '') : m[2] && +m[2] > 100 ? +m[2] : null, cur: /\$/.test(v) ? 'USD' : 'UZS', host: '', url: '', img: '', done: false, t: Date.now() });
  $('#manual').value = ''; save(); render(); };
$$('#f button').forEach(b => b.onclick = () => { flt = b.dataset.f; $$('#f button').forEach(x => x.classList.toggle('on', x === b)); render(); });
$('#clr').onclick = () => { items = items.filter(i => !i.done); save(); render(); };
$('#copy').onclick = () => copyText(items.filter(i => !i.done).map((i, n) => `${n + 1}. ${i.name} — ${i.qty} × ${i.price ? som(toUzs(i)) : '?'}`).join('\n') + `\n\nJami: ${$('#tot').textContent}`);
$('#csv').onclick = () => download('xarid-royxati.csv', '﻿Nomi,Soni,Narx,Valyuta,So\'mda,Do\'kon,Havola,Olingan\n' + items.map(i => [i.name, i.qty, i.price ?? '', i.cur, Math.round(toUzs(i) * i.qty), i.host, i.url, i.done ? 'ha' : ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
(async () => {
  items = await store.get('items', []); render();
  let r = await store.get('rates', null);
  if (!r || Date.now() - r.t > 6 * 36e5) try { const j = await (await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/')).json(); r = { t: Date.now(), usd: +j.find(x => x.Ccy === 'USD').Rate, rub: +j.find(x => x.Ccy === 'RUB').Rate }; store.set('rates', r); } catch {}
  if (r) { usd = r.usd; rub = r.rub; $('#rate').textContent = `1$ = ${usd.toLocaleString('ru-RU')} so'm`; render(); }
})();
