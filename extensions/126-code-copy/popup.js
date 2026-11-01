const { $, h } = App;
let host = '';
const DEF = { prompt: true, nums: true, min: 1, excluded: [] };
async function render() {
  const cfg = Object.assign({}, DEF, await App.get('cfg', {}));
  $('#here').checked = !cfg.excluded.includes(host);
  $('#here').disabled = !host;
  $('#prompt').checked = cfg.prompt; $('#nums').checked = cfg.nums; $('#min').value = cfg.min;
  const ex = $('#ex'); ex.innerHTML = '';
  $('#exBox').classList.toggle('hidden', !cfg.excluded.length);
  cfg.excluded.forEach(d => ex.append(h('div', { class: 'row' }, h('span', { class: 'grow small mono', text: d }),
    h('button', { class: 'btn ghost small', text: '✕', onclick: async () => { cfg.excluded = cfg.excluded.filter(x => x !== d); await App.set('cfg', cfg); render(); } }))));
}
App.onReady(async () => {
  const tab = await App.tab();
  try { host = new URL(tab.url).hostname; } catch (e) {}
  $('#host').textContent = host || '—';
  const save = async () => {
    const cfg = Object.assign({}, DEF, await App.get('cfg', {}));
    cfg.prompt = $('#prompt').checked; cfg.nums = $('#nums').checked; cfg.min = Math.max(1, +$('#min').value || 1);
    if (host) { cfg.excluded = cfg.excluded.filter(x => x !== host); if (!$('#here').checked) cfg.excluded.push(host); }
    await App.set('cfg', cfg); render();
  };
  ['here', 'prompt', 'nums', 'min'].forEach(id => $('#' + id).addEventListener('change', save));
  render();
});
