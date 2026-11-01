tabsInit();
if (new URLSearchParams(location.search).has('full')) { document.body.className = 'full'; $('#full').hidden = true; }
$('#full').onclick = () => chrome.tabs.create({ url: 'popup.html?full=1' });
document.addEventListener('click', e => { if (e.target.matches('.out, .kv b') && e.target.textContent) copyText(e.target.textContent); });
const out = (id, t) => $(id).textContent = t;
// Base64 (UTF-8)
const b64e = s => { let r = btoa(String.fromCharCode(...new TextEncoder().encode(s))); return $('#b64u').checked ? r.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : r; };
const b64d = s => { s = s.trim().replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); };
$('#b64e').onclick = () => out('#b64out', b64e($('#b64in').value));
$('#b64d').onclick = () => { try { out('#b64out', b64d($('#b64in').value)); } catch { out('#b64out', 'Base64 emas'); } };
// URL
$('#urle').onclick = () => out('#urlout', encodeURIComponent($('#urlin').value));
$('#urld').onclick = () => { try { out('#urlout', decodeURIComponent($('#urlin').value.replace(/\+/g, ' '))); } catch { out('#urlout', 'Noto\'g\'ri kodlangan'); } };
$('#urlp').onclick = () => { try { const u = new URL($('#urlin').value.trim()); out('#urlout', [`Protokol: ${u.protocol}`, `Host: ${u.host}`, `Yo'l: ${decodeURIComponent(u.pathname)}`, ...[...u.searchParams].map(([k, v]) => `  ${k} = ${v}`), u.hash ? `Hash: ${u.hash}` : ''].filter(Boolean).join('\n')); } catch { out('#urlout', 'To\'liq manzil kiriting (https://...)'); } };
// JWT
$('#jwtin').oninput = () => {
  const p = $('#jwtin').value.trim().split('.');
  if (p.length < 2) { $('#jwtout').innerHTML = ''; return; }
  try {
    const h = JSON.parse(b64d(p[0])), b = JSON.parse(b64d(p[1]));
    const t = k => b[k] ? `${new Date(b[k] * 1000).toLocaleString('uz-UZ')}` : '';
    const exp = b.exp ? (b.exp * 1000 < Date.now() ? '<span class="chip bad">Muddati o\'tgan</span>' : `<span class="chip ok">Amal qiladi: yana ${fmtDur(b.exp * 1000 - Date.now())}</span>`) : '<span class="chip">exp yo\'q</span>';
    $('#jwtout').innerHTML = `<div class="row">${exp}<span class="chip acc">${esc(h.alg || '')}</span></div>
      <div class="small muted" style="margin-top:6px">Header</div><div class="out">${esc(JSON.stringify(h, null, 2))}</div>
      <div class="small muted" style="margin-top:6px">Payload ${b.iat ? '· berilgan: ' + t('iat') : ''} ${b.exp ? '· tugaydi: ' + t('exp') : ''}</div><div class="out">${esc(JSON.stringify(b, null, 2))}</div>
      <div class="small muted" style="margin-top:6px">Imzo tekshirilmaydi (kalit kerak).</div>`;
  } catch { $('#jwtout').innerHTML = '<div class="small" style="color:var(--bad)">JWT o\'qilmadi</div>'; }
};
// Vaqt
function ts() {
  const v = $('#tsin').value.trim(); let d;
  if (/^\d{9,10}$/.test(v)) d = new Date(+v * 1000); else if (/^\d{12,13}$/.test(v)) d = new Date(+v); else d = new Date(v.replace(' ', 'T'));
  if (!v || isNaN(d)) { $('#tsout').innerHTML = v ? '<span>Xato</span><b>Sanani o\'qib bo\'lmadi</b>' : ''; return; }
  const rel = Date.now() - d; const r = Math.abs(rel) < 6e4 ? 'hozir' : (rel > 0 ? fmtDur(rel) + ' oldin' : fmtDur(-rel) + ' keyin');
  $('#tsout').innerHTML = [['Unix (s)', Math.floor(d / 1000)], ['Unix (ms)', +d], ['Mahalliy', d.toLocaleString('uz-UZ')], ['UTC', d.toUTCString()], ['ISO 8601', d.toISOString()], ['Nisbiy', r]].map(([k, v]) => `<span>${k}</span><b>${esc(v)}</b>`).join('');
}
$('#tsin').oninput = ts; $('#tsnow').onclick = () => { $('#tsin').value = Math.floor(Date.now() / 1000); ts(); };
// UUID
$('#uuidg').onclick = () => out('#uuidout', Array.from({ length: Math.min(500, +$('#uuidn').value || 1) }, () => { let u = crypto.randomUUID(); if ($('#uuidD').checked) u = u.replace(/-/g, ''); return $('#uuidU').checked ? u.toUpperCase() : u; }).join('\n'));
// Hash
$('#hashin').oninput = async () => {
  const s = $('#hashin').value, enc = new TextEncoder().encode(s), hx = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  const rows = [['MD5', md5(s)]];
  for (const a of ['SHA-1', 'SHA-256', 'SHA-512']) rows.push([a, hx(await crypto.subtle.digest(a, enc))]);
  rows.push(['Uzunlik', `${s.length} belgi, ${enc.length} bayt`]);
  $('#hashout').innerHTML = rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('');
};
// Regex
function re() {
  let r; try { r = new RegExp($('#rep').value, $('#ref').value.includes('g') ? $('#ref').value : $('#ref').value + 'g'); } catch (e) { out('#reout', 'Xato: ' + e.message); $('#regr').innerHTML = ''; return; }
  const s = $('#rein').value; if (!$('#rep').value) { out('#reout', s); $('#regr').innerHTML = ''; return; }
  const ms = [...s.matchAll(r)].slice(0, 500); let html = '', last = 0;
  ms.forEach(m => { if (m[0] === '') return; html += esc(s.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; });
  $('#reout').innerHTML = html + esc(s.slice(last));
  $('#regr').innerHTML = `<b>${ms.length} ta moslik</b>` + ms.slice(0, 20).map((m, i) => m.length > 1 ? `<div class="mono">${i + 1}: ${m.slice(1).map((g, j) => `$${j + 1}=${esc(g ?? '')}`).join(', ')}${m.groups ? ' ' + esc(JSON.stringify(m.groups)) : ''}</div>` : '').join('');
}
['#rep', '#ref', '#rein'].forEach(s => $(s).oninput = re);
// JSON
const js = f => { try { const v = JSON.parse($('#jsin').value); $('#jsin').value = f(v); $('#jsmsg').textContent = 'Tayyor'; } catch (e) { $('#jsmsg').textContent = 'JSON xato: ' + e.message; } };
const sortK = v => Array.isArray(v) ? v.map(sortK) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortK(v[k])])) : v;
$('#jsf').onclick = () => js(v => JSON.stringify(v, null, 2)); $('#jsm').onclick = () => js(v => JSON.stringify(v));
$('#jss').onclick = () => js(v => JSON.stringify(sortK(v), null, 2)); $('#jse').onclick = () => { $('#jsin').value = JSON.stringify($('#jsin').value); };
// Sanoq tizimlari
const NB = { n10: 10, n16: 16, n2: 2, n8: 8 };
Object.keys(NB).forEach(id => $('#' + id).oninput = e => {
  const v = e.target.value.trim().replace(/^0x|^0b|^0o/i, ''); let n;
  try { n = BigInt(NB[id] === 10 ? v : (NB[id] === 16 ? '0x' : NB[id] === 2 ? '0b' : '0o') + v); } catch { return; }
  Object.keys(NB).forEach(o => { if (o !== id) $('#' + o).value = n.toString(NB[o]).toUpperCase(); });
});
