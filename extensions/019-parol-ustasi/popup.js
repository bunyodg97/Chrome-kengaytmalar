tabsInit();
let o = { ...DEF };
const LV = ['Juda zaif', 'Zaif', 'O\'rtacha', 'Kuchli', 'Juda kuchli'];
function meter(el, s) { el.className = 'meter s' + s.score; }
function regen() {
  const p = generate(o); $('#pw').textContent = p; const s = strength(p); meter($('#m1'), s);
  $('#info1').textContent = `${LV[s.score]} · ${s.bits} bit · buzish uchun ~${s.time}`;
}
function sync() {
  $('#mode').value = o.mode; $('#len').value = o.len; $('#lenV').textContent = o.len;
  ['upper', 'lower', 'num', 'sym', 'noSimilar'].forEach(k => $('#' + k).checked = o[k]);
  $('#opts').style.display = o.mode === 'random' ? '' : 'none';
}
function change() { store.set('opts', o); sync(); regen(); }
$('#mode').onchange = e => { o.mode = e.target.value; if (o.mode === 'pin' && o.len > 12) o.len = 6; if (o.mode !== 'pin' && o.len < 12) o.len = 16; change(); };
$('#len').oninput = e => { o.len = +e.target.value; change(); };
['upper', 'lower', 'num', 'sym', 'noSimilar'].forEach(k => $('#' + k).onchange = e => { o[k] = e.target.checked; change(); });
$('#again').onclick = regen;
$('#copy').onclick = () => copyText($('#pw').textContent);
$('#test').oninput = e => {
  const s = strength(e.target.value); meter($('#m2'), s); $('#pwnRes').textContent = '';
  $('#info2').innerHTML = e.target.value ? `<b>${LV[s.score]}</b> · ${s.bits} bit · buzish uchun ~${s.time}${s.warn.length ? '<ul>' + s.warn.map(w => `<li>${w}</li>`).join('') + '</ul>' : ''}` : '';
};
$('#showT').onchange = e => $('#test').type = e.target.checked ? 'text' : 'password';
$('#pwn').onclick = async () => {
  const p = $('#test').value; if (!p) return toast('Parol kiriting');
  const h = [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(p)))].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  $('#pwnRes').textContent = 'Tekshirilmoqda…';
  try {
    const txt = await (await fetch('https://api.pwnedpasswords.com/range/' + h.slice(0, 5))).text();
    const line = txt.split('\n').find(l => l.startsWith(h.slice(5)));
    const n = line ? +line.split(':')[1] : 0;
    $('#pwnRes').innerHTML = n ? `<span class="chip bad">Xavfli</span> Bu parol ${n.toLocaleString('uz')} marta sizib chiqqan bazalarda uchragan. Uni ishlatmang.` : '<span class="chip ok">Topilmadi</span> Ma\'lum sizib chiqishlarda bu parol yo\'q.';
  } catch { $('#pwnRes').textContent = 'Tekshirib bo\'lmadi (internetni tekshiring).'; }
};
store.get('opts', DEF).then(x => { o = { ...DEF, ...x }; sync(); regen(); });
