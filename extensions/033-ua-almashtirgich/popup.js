tabsInit();
let scope = 'tab', tab;
$('.tabs').addEventListener('click', e => { if (e.target.dataset.tab) { scope = e.target.dataset.tab; render(); } });
async function state() {
  const { global = null } = await chrome.storage.local.get('global'); const tabs = (await chrome.storage.session.get('tabs')).tabs || {};
  return { global, tabs, cur: scope === 'tab' ? tabs[tab.id] : global };
}
async function render() {
  const { cur, global, tabs } = await state();
  $('#list').innerHTML = [...Object.entries(PRESETS).map(([k, p]) => [k, p.n]), ['custom', 'O\'zim yozaman…']].map(([k, n]) => `<label class="opt ${cur?.key === k ? 'on' : ''}"><input type="radio" name="p" value="${k}" ${cur?.key === k ? 'checked' : ''}>${esc(n)}</label>`).join('');
  $('#custom').hidden = cur?.key !== 'custom'; if (cur?.key === 'custom') $('#custom').value = cur.custom || '';
  const eff = tabs[tab.id] || global;
  $('#cur').textContent = eff ? 'Hozir: ' + (eff.key === 'custom' ? eff.custom : PRESETS[eff.key].ua) : 'Hozir: brauzerning asl User-Agent\'i';
}
async function set(v) {
  if (scope === 'tab') { const t = (await chrome.storage.session.get('tabs')).tabs || {}; if (v) t[tab.id] = v; else delete t[tab.id]; await chrome.storage.session.set({ tabs: t }); }
  else await chrome.storage.local.set({ global: v });
  render();
}
$('#list').onchange = e => { const k = e.target.value; if (k === 'custom') { $('#custom').hidden = false; $('#custom').focus(); if ($('#custom').value.trim()) set({ key: k, custom: $('#custom').value.trim() }); } else set({ key: k }); };
$('#custom').oninput = e => { if (e.target.value.trim()) set({ key: 'custom', custom: e.target.value.trim() }); };
$('#off').onclick = () => set(null);
$('#reload').onclick = () => { chrome.tabs.reload(tab.id); window.close(); };
(async () => { tab = await activeTab(); render(); })();
