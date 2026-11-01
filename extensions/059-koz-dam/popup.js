const DEF = { every: 20, style: 'note', sound: true, on: true };
let c;
const save = () => store.set('cfg', c);
async function tick() {
  const a = await chrome.alarms.get('eye'), r = await chrome.alarms.get('resume');
  if (!c.on) $('#left').textContent = 'o\'chiq'; else if (r) $('#left').textContent = 'pauza ' + Math.ceil((r.scheduledTime - Date.now()) / 60e3) + ' daq';
  else if (a) { const s = Math.max(0, Math.round((a.scheduledTime - Date.now()) / 1000)); $('#left').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } else $('#left').textContent = '—';
}
(async () => {
  c = { ...DEF, ...(await store.get('cfg', {})) }; $('#on').checked = c.on; $('#every').value = c.every; $('#style').value = c.style; $('#sound').checked = c.sound;
  const st = await store.get('stats', {}); const d = new Date().toISOString().slice(0, 10); $('#today').textContent = st[d] || 0;
  let w = 0; for (let i = 0; i < 7; i++) w += st[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)] || 0; $('#week').textContent = `7 kunda: ${w} marta`;
  tick(); setInterval(tick, 1000);
})();
$('#on').onchange = e => { c.on = e.target.checked; save(); }; $('#every').onchange = e => { c.every = +e.target.value; save(); };
$('#style').onchange = e => { c.style = e.target.value; save(); }; $('#sound').onchange = e => { c.sound = e.target.checked; save(); };
$('#now').onclick = () => chrome.runtime.sendMessage({ cmd: 'now' }); $('#pause').onclick = () => { chrome.runtime.sendMessage({ cmd: 'pause', min: 60 }); setTimeout(tick, 200); };
