const PRE = [[5, '5 s'], [10, '10 s'], [30, '30 s'], [60, '1 daq'], [120, '2 daq'], [300, '5 daq'], [900, '15 daq'], [1800, '30 daq']];
let tab;
$('#pre').innerHTML = PRE.map(([s, t]) => `<button class="ghost" data-s="${s}">${t}</button>`).join('');
$('#pre').onclick = e => { const s = e.target.dataset.s; if (!s) return; $('#sec').value = s; mark(); };
const mark = () => $$('#pre button').forEach(b => b.classList.toggle('on', b.dataset.s === $('#sec').value));
$('#sec').oninput = mark;
$('#watch').onchange = e => $('#selBox').hidden = !e.target.checked;
async function render() {
  const jobs = await chrome.runtime.sendMessage({ cmd: 'list' }), j = jobs[tab.id];
  $('#go').hidden = !!j; $('#stop').hidden = !j;
  if (j) { $('#sec').value = j.sec; $('#watch').checked = j.watch; $('#selBox').hidden = !j.watch; $('#sel').value = j.sel || ''; }
  mark();
  const ids = Object.keys(jobs);
  $('#list').innerHTML = ids.length ? ids.map(id => `<div class="item"><span class="grow small">${esc((jobs[id].title || '').slice(0, 40))}</span><span class="chip acc">${jobs[id].sec} s</span><button class="ghost" data-stop="${id}">✕</button></div>`).join('') : '<div class="muted small">Hech qayerda yoqilmagan</div>';
}
$('#go').onclick = async () => {
  const sec = Math.max(2, +$('#sec').value || 60);
  await chrome.runtime.sendMessage({ cmd: 'start', tabId: tab.id, sec, watch: $('#watch').checked, sel: $('#sel').value.trim(), title: tab.title });
  render(); toast('Yoqildi');
};
$('#stop').onclick = async () => { await chrome.runtime.sendMessage({ cmd: 'stop', tabId: tab.id }); render(); };
$('#list').onclick = async e => { const id = e.target.dataset.stop; if (id) { await chrome.runtime.sendMessage({ cmd: 'stop', tabId: +id }); render(); } };
(async () => { tab = await activeTab(); $('#tt').textContent = tab.title; render(); })();
