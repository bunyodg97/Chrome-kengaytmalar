const DEF = { mode: 'region', mic: false, sysAudio: true, fmt: 'mp4', quality: 'high', fps: 30, nameMode: 'ask', countdown: true, tpl: DEFAULT_TPL };
const DESC = { region: 'Joriy sahifada to\'rtburchak chiqadi: uni sichqoncha bilan surasiz, chetlaridan tortib kattalashtirasiz yoki kichraytirasiz.', tab: 'Joriy tab to\'liq yoziladi.', screen: 'Butun ekran, istalgan dastur oynasi yoki tabni tanlaysiz.' };
let c = { ...DEF }, t;
const save = () => store.set('cfg', c);
function render() {
  $$('.modes button').forEach(b => b.classList.toggle('on', b.dataset.m === c.mode)); $('#mdesc').textContent = DESC[c.mode];
  ['mic', 'sysAudio', 'countdown'].forEach(k => $('#' + k).checked = c[k]); $('#fmt').value = c.fmt; $('#quality').value = c.quality;
  $$('input[name=nm]').forEach(r => r.checked = r.value === c.nameMode); $('#tpl').value = c.tpl; $('#ex').textContent = makeName(c.tpl) + '.' + c.fmt;
  $('#cdRow').style.display = c.mode === 'region' ? '' : 'none';
}
$('.modes').onclick = e => { const b = e.target.closest('[data-m]'); if (b) { c.mode = b.dataset.m; save(); render(); } };
['mic', 'sysAudio', 'countdown'].forEach(k => $('#' + k).onchange = async e => {
  c[k] = e.target.checked; save();
  if (k === 'mic' && c.mic) { const p = await navigator.permissions.query({ name: 'microphone' }).catch(() => null); if (p?.state !== 'granted') chrome.tabs.create({ url: 'mic.html' }); }
});
['fmt', 'quality'].forEach(k => $('#' + k).onchange = e => { c[k] = e.target.value; save(); render(); });
$$('input[name=nm]').forEach(r => r.onchange = () => { c.nameMode = r.value; save(); });
$('#tpl').oninput = e => { c.tpl = e.target.value; $('#ex').textContent = makeName(c.tpl) + '.' + c.fmt; clearTimeout(t); t = setTimeout(save, 300); };
$('#go').onclick = async () => {
  $('#err').textContent = ''; $('#go').disabled = true;
  await save();
  const tab = await activeTab();
  if (c.mode === 'screen') { chrome.runtime.sendMessage({ cmd: 'start', mode: 'screen' }); window.close(); return; }
  const r = await chrome.runtime.sendMessage({ cmd: 'start', mode: c.mode, tab });
  if (r?.error) { $('#err').textContent = r.error; $('#go').disabled = false; return; }
  window.close();
};
$('#pause').onclick = async () => { const r = await chrome.runtime.sendMessage({ cmd: 'pause' }); live(); };
$('#stop').onclick = async () => { await chrome.runtime.sendMessage({ cmd: 'stop' }); window.close(); };
async function live() {
  const r = await chrome.runtime.sendMessage({ cmd: 'state' });
  const on = r && r.state !== 'idle';
  $('#idle').hidden = on; $('#live').hidden = !on;
  if (on) {
    $('#lmode').textContent = { region: 'Hudud yozilmoqda', tab: 'Tab yozilmoqda', screen: 'Ekran yozilmoqda' }[r.mode] + (r.state === 'paused' ? ' · pauza' : r.state === 'selecting' ? ' · hudud tanlanmoqda' : '');
    $('#live').classList.toggle('paused', r.state === 'paused'); $('#pause').textContent = r.state === 'paused' ? '▶ Davom etish' : '⏸ Pauza';
    $('#pause').disabled = r.state === 'selecting';
    const txt = await chrome.action.getBadgeText({}); if (txt) $('#lt').textContent = txt;
  }
}
(async () => {
  c = { ...DEF, ...(await store.get('cfg', {})) }; render(); live(); setInterval(live, 1000);
  const { lastErr } = await chrome.storage.session.get('lastErr');
  if (lastErr) { $('#err').textContent = 'Oxirgi yozuvda xato: ' + lastErr; chrome.storage.session.remove('lastErr'); chrome.action.setBadgeText({ text: '' }); }
})();
