let prompts = [], t;
const save = () => { clearTimeout(t); t = setTimeout(() => store.set('prompts', prompts), 300); };
function render() {
  const s = $('#q').value.toLowerCase();
  $('#list').innerHTML = prompts.map((p, i) => ({ p, i })).filter(({ p }) => (p.title + p.text + p.cat).toLowerCase().includes(s)).map(({ p, i }) => `<div class="card" data-i="${i}">
    <div class="row"><input data-k="title" value="${esc(p.title)}" placeholder="Nomi" style="flex:2;font-weight:600"><input data-k="cat" value="${esc(p.cat || '')}" placeholder="Toifa" style="flex:1"><button class="ghost" data-a="up">↑</button><button class="danger" data-a="del">O'chirish</button></div>
    <textarea data-k="text" rows="4" style="font-family:var(--f)">${esc(p.text)}</textarea></div>`).join('') || '<div class="empty">Prompt yo\'q</div>';
}
$('#list').addEventListener('input', e => { const c = e.target.closest('[data-i]'), k = e.target.dataset.k; if (c && k) { prompts[+c.dataset.i][k] = e.target.value; save(); } });
let arm = -1;
$('#list').addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; const i = +e.target.closest('[data-i]').dataset.i;
  if (a === 'del') { if (arm !== i) { arm = i; e.target.textContent = 'Tasdiqlang'; return; } prompts.splice(i, 1); arm = -1; }
  if (a === 'up' && i > 0) [prompts[i - 1], prompts[i]] = [prompts[i], prompts[i - 1]];
  save(); render(); });
$('#add').onclick = () => { prompts.unshift({ id: Date.now(), cat: 'Boshqa', title: 'Yangi prompt', text: '' }); render(); save(); $('#list textarea').focus(); };
$('#q').oninput = render;
$('#exp').onclick = () => download('promptlar.json', JSON.stringify(prompts, null, 2), 'application/json');
$('#imp').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); prompts = [...d.map(x => ({ ...x, id: x.id || Date.now() + Math.random() })), ...prompts]; save(); render(); toast(d.length + ' ta qo\'shildi'); } catch { toast('Fayl noto\'g\'ri'); } };
let rArm = false;
$('#reset').onclick = () => { if (!rArm) { rArm = true; $('#reset').textContent = 'Tasdiqlang (barcha o\'zgarishlar o\'chadi)'; return; } prompts = JSON.parse(JSON.stringify(DEFAULT_PROMPTS)); save(); render(); rArm = false; $('#reset').textContent = 'Standartlarni qaytarish'; };
store.get('prompts', DEFAULT_PROMPTS).then(p => { prompts = p; render(); });
