tabsInit();
let words = [], card = null, flipped = false;
const save = () => store.set('words', words);
function counts() { const d = words.filter(due).length; $('#cnt').textContent = `${words.length} so'z · ${d} takror`; chrome.action.setBadgeText({ text: d ? String(d) : '' }); }
function learn() {
  const q = words.filter(due).sort((a, b) => a.box - b.box || a.next - b.next); card = q[0]; flipped = false;
  if (!card) { $('#learn').innerHTML = `<div class="empty">${words.length ? '🎉 Hozircha takrorlash yo\'q. Keyinroq qayting!' : 'Lug\'at bo\'sh. Saytda so\'zni belgilab, o\'ng tugma → «lug\'atga qo\'shish».'}</div>`; return; }
  $('#learn').innerHTML = `<div class="card fc" id="fc"><div class="w">${esc(card.w)}</div><div class="t back">${esc(card.tr)}</div>${card.alts?.length ? `<div class="small muted back">${esc(card.alts.join(', '))}</div>` : ''}${card.ctx ? `<div class="c back">«${esc(card.ctx)}»</div>` : ''}<div class="small muted" id="hint">Tarjimani ko'rish uchun bosing</div></div>
    <div class="grid2"><button class="danger" id="no">Bilmayman</button><button id="yes" style="background:var(--ok);border-color:var(--ok)">Bilaman</button></div><div class="small muted">${q.length} ta so'z navbatda · quti ${card.box}/6</div>`;
  $('#fc').onclick = () => $('#fc').classList.toggle('open');
  $('#yes').onclick = () => grade(true); $('#no').onclick = () => grade(false);
}
function grade(ok) { card.box = ok ? Math.min(6, card.box + 1) : 0; card.next = Date.now() + BOX_DAYS[card.box] * 864e5 + (ok ? 0 : 60e3); card[ok ? 'ok' : 'bad']++; save(); counts(); learn(); }
function quiz() {
  const pool = words.filter(w => w.tr); if (pool.length < 4) { $('#quiz').innerHTML = '<div class="empty">Test uchun kamida 4 ta so\'z kerak.</div>'; return; }
  const w = pool[Math.floor(Math.random() * pool.length)], rev = Math.random() < .4;
  const opts = [w, ...pool.filter(x => x !== w).sort(() => Math.random() - .5).slice(0, 3)].sort(() => Math.random() - .5);
  $('#quiz').innerHTML = `<div class="card" style="text-align:center"><div class="small muted">${rev ? 'Qaysi so\'zning tarjimasi?' : 'Tarjimasini tanlang'}</div><div style="font-size:21px;font-weight:700">${esc(rev ? w.tr : w.w)}</div></div><div class="list">${opts.map(o => `<button class="ghost opt" data-id="${o.id}">${esc(rev ? o.w : o.tr)}</button>`).join('')}</div><button id="nx" hidden>Keyingisi →</button>`;
  $$('#quiz .opt').forEach(b => b.onclick = () => { const ok = +b.dataset.id === w.id; b.classList.add(ok ? 'ok' : 'bad'); $(`#quiz .opt[data-id="${w.id}"]`).classList.add('ok'); $$('#quiz .opt').forEach(x => x.disabled = true); w[ok ? 'ok' : 'bad']++; save(); $('#nx').hidden = false; });
  $('#nx').onclick = quiz;
}
function list() {
  const s = $('#q').value.toLowerCase();
  $('#wl').innerHTML = words.filter(w => !s || (w.w + ' ' + w.tr).toLowerCase().includes(s)).map(w => `<div class="item"><div class="row between"><b>${esc(w.w)}</b><span class="box">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${w.box >= i ? 'on' : ''}"></i>`).join('')}</span></div>
    <input value="${esc(w.tr)}" data-tr="${w.id}" style="padding:4px 6px"><div class="row between small muted"><span>${esc(w.lang)} · ✓${w.ok} ✗${w.bad}</span><button class="ghost" data-del="${w.id}" style="padding:1px 6px">✕</button></div></div>`).join('') || '<div class="empty">Bo\'sh</div>';
}
$('#wl').addEventListener('change', e => { const id = e.target.dataset.tr; if (id) { words.find(w => w.id == id).tr = e.target.value; save(); } });
$('#wl').addEventListener('click', e => { const id = e.target.dataset.del; if (id) { words = words.filter(w => w.id != id); save(); list(); counts(); } });
$('#q').oninput = list;
$('#addF').onsubmit = async e => { e.preventDefault(); const v = $('#addW').value.trim(); if (!v) return; const r = await addWord(v); words = await store.get('words', []); $('#addW').value = ''; toast(r?.dup ? 'Bor' : 'Qo\'shildi: ' + r.tr); list(); counts(); learn(); };
$('#exp').onclick = () => download('soz-daftari.csv', '﻿' + [['So\'z', 'Tarjima', 'Til', 'Misol'], ...words.map(w => [w.w, w.tr, w.lang, w.ctx])].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
$('.tabs').addEventListener('click', e => { const t = e.target.dataset.tab; if (t === 'quiz') quiz(); if (t === 'list') list(); if (t === 'learn') learn(); });
store.get('remind', true).then(v => $('#rem').checked = v); $('#rem').onchange = e => store.set('remind', e.target.checked);
store.get('words', []).then(w => { words = w; counts(); learn(); });
