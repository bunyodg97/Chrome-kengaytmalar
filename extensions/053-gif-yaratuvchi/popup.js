const DEF = { fps: 10, width: 640, max: 15, countdown: true, loop: true };
let c;
(async () => {
  c = { ...DEF, ...(await store.get('cfg', {})) };
  ['fps', 'width', 'max'].forEach(k => { $('#' + k).value = c[k]; $('#' + k).onchange = e => { c[k] = +e.target.value; store.set('cfg', c); }; });
  ['loop', 'countdown'].forEach(k => { $('#' + k).checked = c[k]; $('#' + k).onchange = e => { c[k] = e.target.checked; store.set('cfg', c); }; });
  const r = await chrome.runtime.sendMessage({ cmd: 'state' }); if (r.state !== 'idle') { $('#idle').hidden = true; $('#live').hidden = false; }
  const { err } = await chrome.storage.session.get('err'); if (err) { $('#err').textContent = 'Oxirgi urinish: ' + err; chrome.storage.session.remove('err'); }
})();
$('#go').onclick = async () => { const tab = await activeTab(); const r = await chrome.runtime.sendMessage({ cmd: 'start', tab }); if (r?.error) $('#err').textContent = r.error; else window.close(); };
$('#stop').onclick = async () => { await chrome.runtime.sendMessage({ cmd: 'stop' }); window.close(); };
