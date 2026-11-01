const send = m => chrome.runtime.sendMessage(m);
let st = null;
function render() {
  $('#run').hidden = !st; $('#new').hidden = !!st; if (!st) return;
  const left = Math.max(0, st.paused != null ? st.paused : st.end - Date.now()), s = Math.ceil(left / 1000);
  $('#clock').textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + String(Math.floor(s / 60) % (s >= 3600 ? 60 : 1e9)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  $('#clock').style.color = s <= 60 ? 'var(--bad)' : s <= 300 ? 'var(--warn)' : '';
  $('#bar').style.width = (100 * left / st.dur) + '%'; $('#lbl').textContent = st.label || '';
  $('#pp').textContent = st.paused != null ? 'Davom ettirish' : 'Pauza';
  if (left <= 0) send({ cmd: 'x' }).then(t => { st = t; render(); });
}
const upd = t => { st = t; render(); };
$$('.pre button').forEach(b => b.onclick = () => { $('#mm').value = b.dataset.m; $('#ss').value = 0; $('#at').value = ''; });
$('#go').onclick = async () => {
  let ms = ((+$('#mm').value || 0) * 60 + (+$('#ss').value || 0)) * 1000;
  if ($('#at').value) { const [h, m] = $('#at').value.split(':').map(Number), d = new Date(); d.setHours(h, m, 0, 0); if (d < Date.now()) d.setDate(d.getDate() + 1); ms = d - Date.now(); }
  if (ms < 1000) return toast('Vaqtni kiriting');
  const warn = $('#warn').value.split(/[,\s]+/).map(Number).filter(x => x > 0 && x * 60000 < ms);
  store.set('last', { mm: $('#mm').value, label: $('#label').value, warn: $('#warn').value });
  upd(await send({ cmd: 'start', ms, label: $('#label').value.trim(), warn }));
};
$('#pp').onclick = async () => upd(await send({ cmd: st.paused != null ? 'resume' : 'pause' }));
$('#p1').onclick = async () => upd(await send({ cmd: 'add', ms: 60000 }));
$('#p5').onclick = async () => upd(await send({ cmd: 'add', ms: 300000 }));
$('#st').onclick = async () => upd(await send({ cmd: 'stop' }));
$('#sound').onchange = () => chrome.storage.local.set({ sound: $('#sound').checked });
$('#test').onclick = e => { e.preventDefault(); send({ cmd: 'test' }); };
$('#float').onclick = async () => { const tab = await activeTab(); try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['float.js'] }); window.close(); } catch { toast('Bu sahifada ishlamaydi'); } };
(async () => {
  const l = await store.get('last', null); if (l) { $('#mm').value = l.mm; $('#label').value = l.label; $('#warn').value = l.warn; }
  $('#sound').checked = await store.get('sound', true);
  upd(await send({ cmd: 'x' })); setInterval(render, 250);
})();
