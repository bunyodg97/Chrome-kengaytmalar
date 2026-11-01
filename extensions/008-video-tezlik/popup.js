const PRE = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];
let tab;
$('#pre').innerHTML = PRE.map(p => `<button class="ghost" data-s="${p}">${p}x</button>`).join('');
function show(s) { $('#val').textContent = s + 'x'; $('#rng').value = s; $$('#pre button').forEach(b => b.classList.toggle('on', +b.dataset.s === s)); }
async function set(s) {
  s = Math.round(s * 100) / 100; show(s);
  try { await chrome.tabs.sendMessage(tab.id, { cmd: 'set', speed: s }); } catch { $('#cnt').textContent = 'Sahifani yangilang'; }
}
(async () => {
  tab = await activeTab();
  try { const r = await chrome.tabs.sendMessage(tab.id, { cmd: 'get' }); show(r.speed); $('#cnt').textContent = r.count ? r.count + ' ta video/audio' : 'Video topilmadi'; }
  catch { $('#cnt').textContent = 'Bu sahifada ishlamaydi yoki yangilash kerak'; }
  const o = await chrome.storage.local.get(null);
  $('#remember').checked = o.remember ?? true; $('#badge').checked = o.badge ?? true; $('#keys').checked = o.keys ?? true;
  $('#step').value = o.step ?? 0.25; $('#jump').value = o.jump ?? 10; $('#fav').value = o.fav ?? 1.75;
})();
$('#rng').oninput = e => set(+e.target.value);
$('#pre').onclick = e => { const s = e.target.dataset.s; if (s) set(+s); };
['remember', 'badge', 'keys'].forEach(id => $('#' + id).onchange = e => chrome.storage.local.set({ [id]: e.target.checked }));
['step', 'jump', 'fav'].forEach(id => $('#' + id).onchange = e => chrome.storage.local.set({ [id]: +e.target.value }));
