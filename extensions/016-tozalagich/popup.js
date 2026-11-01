tabsInit();
let mode = 'all', origin = '', cfg;
$('.tabs').addEventListener('click', e => { if (e.target.dataset.tab) { mode = e.target.dataset.tab; render(); } });
$('#range').innerHTML = RANGES.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
function render() {
  $('#types').innerHTML = TYPES.map(([k, t]) => `<label class="inline" ${mode === 'site' && !ORIGIN_OK.includes(k) ? 'style="opacity:.4"' : ''}><input type="checkbox" data-k="${k}" ${cfg.types[k] ? 'checked' : ''} ${mode === 'site' && !ORIGIN_OK.includes(k) ? 'disabled' : ''}> ${t}</label>`).join('');
  $('#range').value = cfg.range; $('#onStart').checked = cfg.onStart;
  $('#go').textContent = mode === 'site' ? 'Shu saytni tozalash' : 'Tozalash';
}
const save = () => store.set('cfg', cfg);
$('#types').onchange = e => { cfg.types[e.target.dataset.k] = e.target.checked; save(); };
$('#range').onchange = e => { cfg.range = +e.target.value; save(); };
$('#onStart').onchange = e => { cfg.onStart = e.target.checked; save(); };
$('#go').onclick = async () => {
  if (mode === 'site' && !origin) return toast('Bu sahifa uchun mumkin emas');
  $('#go').disabled = true; $('#go').textContent = 'Tozalanmoqda…';
  const n = await clean(cfg, mode === 'site' ? origin : null);
  $('#go').disabled = false; render(); $('#msg').textContent = n ? `Tayyor: ${n} turdagi ma'lumot tozalandi.` : 'Hech narsa tanlanmagan.';
  if (mode === 'site' && cfg.types.cookies) { const t = await activeTab(); chrome.tabs.reload(t.id); }
};
(async () => {
  cfg = await store.get('cfg', { types: Object.fromEntries(TYPES.map(t => [t[0], t[2]])), range: 864e5, onStart: false });
  const t = await activeTab(); try { const u = new URL(t.url); if (/^https?:$/.test(u.protocol)) origin = u.origin; } catch {}
  $('#origin').textContent = origin || '—'; render();
})();
