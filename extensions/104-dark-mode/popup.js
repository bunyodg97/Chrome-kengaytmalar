const { $, $$ } = App;

function invertFn(on, strength) {
  const id = '__dm_invert_style';
  let st = document.getElementById(id);
  if (!on) { if (st) st.remove(); return false; }
  if (!st) { st = document.createElement('style'); st.id = id; (document.head || document.documentElement).append(st); }
  const p = strength / 100;
  st.textContent = `html{filter:invert(${p}) hue-rotate(180deg)!important;background:#fff!important}
img,video,picture,canvas,iframe,svg image,[style*="background-image"]{filter:invert(${p}) hue-rotate(180deg)!important}`;
  return true;
}
function invertState() {
  const st = document.getElementById('__dm_invert_style');
  if (!st) return null;
  const m = st.textContent.match(/invert\(([\d.]+)\)/);
  return m ? Math.round(parseFloat(m[1]) * 100) : 90;
}

let tab;
async function refresh() {
  tab = await App.tab();
  const ok = App.canRun(tab);
  $$('#emu button, #inv, #str').forEach(b => b.disabled = !ok);
  if (!ok) { $('#state').textContent = t('cantRunHere'); return; }
  const emu = await chrome.runtime.sendMessage({ type: 'state', tabId: tab.id });
  $$('#emu button').forEach(b => b.classList.toggle('active', b.dataset.v === emu));
  try {
    const inv = await App.exec(invertState);
    $('#inv').checked = inv != null;
    if (inv != null) $('#str').value = inv;
  } catch (e) {}
  $('#state').textContent = t('current', { s: t(emu) + ($('#inv').checked ? ' + filter' : '') });
}

App.onReady(async () => {
  $('#str').value = await App.get('strength', 90);
  $$('#emu button').forEach(b => b.addEventListener('click', async () => {
    const r = await chrome.runtime.sendMessage({ type: 'emulate', tabId: tab.id, value: b.dataset.v });
    if (!r.ok) App.toast(r.error, 'err');
    refresh();
  }));
  const applyInv = async () => {
    await App.set('strength', +$('#str').value);
    await App.exec(invertFn, [$('#inv').checked, +$('#str').value]);
    refresh();
  };
  $('#inv').addEventListener('change', applyInv);
  $('#str').addEventListener('change', () => { if ($('#inv').checked) applyInv(); });
  await refresh();
});
App.onLang(refresh);
