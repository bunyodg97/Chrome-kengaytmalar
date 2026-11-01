let tab, tabs = {};
$('#pre').innerHTML = [100, 150, 200, 300, 600].map(v => `<button class="ghost" data-v="${v}">${v}%</button>`).join('');
const opts = () => ({ gain: +$('#rng').value / 100, bass: $('#bass').checked, comp: $('#comp').checked });
const send = m => chrome.runtime.sendMessage({ to: 'bg', ...m });
function render() {
  const on = !!tabs[tab.id];
  $('#st').textContent = on ? 'Yoqilgan' : 'O\'chiq'; $('#st').className = 'chip ' + (on ? 'ok' : '');
  $('#go').hidden = on; $('#stop').hidden = !on; $('#val').textContent = $('#rng').value + '%';
  const ids = Object.keys(tabs);
  $('#list').innerHTML = ids.length ? ids.map(id => `<div class="item"><span class="grow small">${esc((tabs[id].title || '').slice(0, 40))}</span><span class="chip acc">${Math.round(tabs[id].gain * 100)}%</span><button class="ghost" data-s="${id}">✕</button></div>`).join('') : '<div class="muted small">Yo\'q</div>';
}
async function start() {
  try {
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
    tabs = await send({ cmd: 'start', tabId: tab.id, streamId, title: tab.title, ...opts() });
  } catch (e) { toast('Bu tabda ishlamaydi: ' + (e.message || '').slice(0, 60)); }
  render();
}
let t;
async function update() {
  $('#val').textContent = $('#rng').value + '%'; store.set('last', opts());
  clearTimeout(t); t = setTimeout(async () => { if (tabs[tab.id]) tabs = await send({ cmd: 'set', tabId: tab.id, ...opts() }); render(); }, 60);
}
$('#rng').oninput = update; $('#bass').onchange = update; $('#comp').onchange = update;
$('#pre').onclick = e => { if (e.target.dataset.v) { $('#rng').value = e.target.dataset.v; update(); if (!tabs[tab.id]) start(); } };
$('#go').onclick = start;
$('#stop').onclick = async () => { tabs = await send({ cmd: 'stop', tabId: tab.id }); render(); };
$('#list').onclick = async e => { const id = e.target.dataset.s; if (id) { tabs = await send({ cmd: 'stop', tabId: +id }); render(); } };
(async () => {
  tab = await activeTab(); $('#tt').textContent = tab.title;
  tabs = (await chrome.storage.session.get('tabs')).tabs || {};
  const cur = tabs[tab.id] || await store.get('last', { gain: 1.5, bass: false, comp: true });
  $('#rng').value = Math.round(cur.gain * 100); $('#bass').checked = cur.bass; $('#comp').checked = cur.comp;
  render();
})();
