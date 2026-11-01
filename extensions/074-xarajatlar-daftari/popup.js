if (new URLSearchParams(location.search).get('full')) { $('#root').classList.add('page'); $('#big').hidden = true; } else document.body.classList.add('popup');
const DEFCATS = [['🍞', 'Oziq-ovqat', '#43a047'], ['🚕', 'Transport', '#fb8c00'], ['🏠', 'Uy/kommunal', '#5e35b1'], ['📱', 'Aloqa', '#1e88e5'], ['🍽', 'Kafe', '#e53935'], ['👕', 'Kiyim', '#8e24aa'], ['💊', 'Dorixona', '#00897b'], ['🎁', 'Sovg\'a', '#d81b60'], ['📚', 'Ta\'lim', '#3949ab'], ['•••', 'Boshqa', '#757575']];
let ex = [], cats = [], cat = 0, view = 'list', ym, budget = 0;
const som = n => Math.round(n).toLocaleString('ru-RU').replace(/ |,/g, ' ');
const OY = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const month = () => ex.filter(e => e.d.startsWith(ym));
function drawCats() { $('#cats').innerHTML = cats.map((c, i) => `<button class="ghost ${i === cat ? 'on' : ''}" data-i="${i}">${c[0]} ${esc(c[1])}</button>`).join(''); }
$('#cats').onclick = e => { const b = e.target.closest('button'); if (b) { cat = +b.dataset.i; drawCats(); $('#amt').focus(); } };
$('#amt').oninput = () => { const v = $('#amt').value.replace(/\D/g, ''); $('#amt').value = v ? som(+v) : ''; };
$('#add').onclick = $('#amt').onkeydown = $('#note').onkeydown = e => {
  if (e.type === 'keydown' && e.key !== 'Enter') return; const a = +$('#amt').value.replace(/\D/g, ''); if (!a) return toast('Summani kiriting');
  ex.push({ id: crypto.randomUUID(), a, c: cats[cat][1], n: $('#note').value.trim(), d: $('#date').value || today() }); store.set('ex', ex);
  $('#amt').value = $('#note').value = ''; ym = ($('#date').value || today()).slice(0, 7); render(); toast(`+${som(a)} so'm`); $('#amt').focus();
};
function render() {
  const [y, m] = ym.split('-').map(Number); $('#mon').textContent = `${OY[m - 1]} ${y}`;
  const arr = month(), tot = arr.reduce((s, e) => s + e.a, 0), isCur = ym === today().slice(0, 7), days = isCur ? new Date().getDate() : new Date(y, m, 0).getDate();
  $('#tot').textContent = som(tot) + ' so\'m'; $('#avg').textContent = som(tot / days);
  $('#setb').textContent = budget ? som(budget) : 'belgilash'; $('#budw').hidden = !budget;
  if (budget) { const p = tot / budget; $('#bud').style.width = Math.min(100, p * 100) + '%'; $('#bud').style.background = p > 1 ? 'var(--bad)' : p > .8 ? 'var(--warn)' : 'var(--ok)'; }
  const color = n => (cats.find(c => c[1] === n) || DEFCATS[9])[2], icon = n => (cats.find(c => c[1] === n) || ['•'])[0];
  if (view === 'list') {
    const by = {}; arr.slice().sort((a, b) => b.d.localeCompare(a.d)).forEach(e => (by[e.d] ||= []).push(e));
    $('#v').innerHTML = Object.keys(by).length ? Object.entries(by).map(([d, a]) => `<div class="day"><span>${+d.slice(8)} ${OY[+d.slice(5, 7) - 1].toLowerCase()}</span><span>${som(a.reduce((s, e) => s + e.a, 0))}</span></div><div class="list">` + a.map(e => `<div class="item e" data-id="${e.id}"><span>${icon(e.c)}</span><div class="grow"><div>${esc(e.c)}</div>${e.n ? `<div class="small muted">${esc(e.n)}</div>` : ''}</div><span class="a">${som(e.a)}</span><button class="ghost x">✕</button></div>`).join('') + '</div>').join('') : '<div class="empty">Bu oyda xarajat yo\'q</div>';
  } else if (view === 'cat') {
    const by = {}; arr.forEach(e => by[e.c] = (by[e.c] || 0) + e.a); const s = Object.entries(by).sort((a, b) => b[1] - a[1]);
    $('#v').innerHTML = s.length ? '<canvas id="cv"></canvas><div class="list">' + s.map(([c, v]) => `<div class="item"><span style="width:10px;height:10px;border-radius:50%;background:${color(c)}"></span><span class="grow">${icon(c)} ${esc(c)}</span><span class="small muted">${Math.round(v / tot * 100)}%</span><b>${som(v)}</b></div>`).join('') + '</div>' : '<div class="empty">Ma\'lumot yo\'q</div>';
    if (s.length) { const cv = $('#cv'), r = cv.getBoundingClientRect(), dp = devicePixelRatio; cv.width = r.width * dp; cv.height = r.height * dp; const x = cv.getContext('2d'); x.scale(dp, dp); let a0 = -Math.PI / 2; const R = r.height / 2 - 4, cx = r.width / 2, cy = r.height / 2;
      s.forEach(([c, v]) => { const a1 = a0 + v / tot * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a0, a1); x.fillStyle = color(c); x.fill(); a0 = a1; });
      x.beginPath(); x.arc(cx, cy, R * .58, 0, 7); x.fillStyle = getComputedStyle(document.body).getPropertyValue('--card') || '#fff'; x.fill(); x.fillStyle = getComputedStyle(document.body).color; x.font = '700 14px system-ui'; x.textAlign = 'center'; x.fillText(som(tot), cx, cy + 5); }
  } else {
    const n = new Date(y, m, 0).getDate(), d = Array(n).fill(0); arr.forEach(e => d[+e.d.slice(8) - 1] += e.a); const mx = Math.max(...d, 1);
    $('#v').innerHTML = '<canvas id="cv"></canvas><div class="small muted" id="dmx"></div>';
    const cv = $('#cv'), r = cv.getBoundingClientRect(), dp = devicePixelRatio; cv.width = r.width * dp; cv.height = r.height * dp; const x = cv.getContext('2d'); x.scale(dp, dp);
    const bw = r.width / n; d.forEach((v, i) => { const h = v / mx * (r.height - 18); x.fillStyle = budget && v > budget / n ? '#e53935' : '#00838f'; x.fillRect(i * bw + 1, r.height - 14 - h, bw - 2, h); if (i % 5 === 0 || i === n - 1) { x.fillStyle = '#888'; x.font = '10px system-ui'; x.fillText(i + 1, i * bw + 1, r.height - 2); } });
    const mi = d.indexOf(Math.max(...d)); $('#dmx').textContent = d[mi] ? `Eng ko'p: ${mi + 1}-kun — ${som(d[mi])} so'm` : '';
  }
}
$('#v').onclick = e => { if (e.target.matches('.x')) { const id = e.target.closest('.item').dataset.id; ex = ex.filter(x => x.id !== id); store.set('ex', ex); render(); } };
$$('#vt button').forEach(b => b.onclick = () => { view = b.dataset.v; $$('#vt button').forEach(x => x.classList.toggle('on', x === b)); render(); });
const shift = k => { const [y, m] = ym.split('-').map(Number), d = new Date(y, m - 1 + k, 1); ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; render(); };
$('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1);
$('#setb').onclick = e => { e.preventDefault(); const v = prompt('Oylik byudjet (so\'m), 0 — o\'chirish:', budget || ''); if (v != null) { budget = +v.replace(/\D/g, '') || 0; store.set('budget', budget); render(); } };
$('#cfg').onclick = () => { const v = prompt('Toifalar (har biri: emoji nom, vergul bilan ajrating):', cats.map(c => c[0] + ' ' + c[1]).join(', ')); if (!v) return;
  const pal = ['#43a047', '#fb8c00', '#5e35b1', '#1e88e5', '#e53935', '#8e24aa', '#00897b', '#d81b60', '#3949ab', '#757575', '#6d4c41', '#c0ca33'];
  cats = v.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => { const m = s.match(/^(\S+)\s+(.+)$/); return m && /\p{Extended_Pictographic}|•/u.test(m[1]) ? [m[1], m[2], pal[i % 12]] : ['•', s, pal[i % 12]]; });
  cat = 0; store.set('cats', cats); drawCats(); render(); };
$('#csv').onclick = () => download(`xarajatlar-${ym}.csv`, '﻿Sana,Toifa,Summa,Izoh\n' + month().sort((a, b) => a.d.localeCompare(b.d)).map(e => [e.d, e.c, e.a, e.n].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n') + `\n,"Jami",${month().reduce((s, e) => s + e.a, 0)},`, 'text/csv');
(async () => { ex = await store.get('ex', []); cats = await store.get('cats', DEFCATS); budget = await store.get('budget', 0); $('#date').value = today(); ym = today().slice(0, 7); drawCats(); render(); $('#amt').focus(); })();
