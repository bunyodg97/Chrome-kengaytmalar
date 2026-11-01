const { $, h } = App;
let st = null;
const send = m => chrome.runtime.sendMessage(m);
const MINS = [0, 15, 30, 45, 60, 90, 120];

async function patch(p) { st = await send({ type: 'patch', patch: p }); paint(); }
let vt = 0;
function patchVols() { clearTimeout(vt); vt = setTimeout(() => send({ type: 'patch', patch: { vols: st.vols } }), 40); }

function build() {
  const g = $('#grid'); g.innerHTML = '';
  for (const id of SOUND_IDS) {
    const r = h('input', { type: 'range', min: 0, max: 100 });
    r.addEventListener('input', () => { st.vols[id] = r.value / 100; if (!st.playing) { /* tinglashni boshlamaydi */ } paint(true); patchVols(); });
    const tile = h('div', { class: 'tile', 'data-id': id },
      h('button', { onclick: () => {
        const v = st.vols[id] || 0;
        tile.dataset.last = v > 0 ? v : (tile.dataset.last || 0.6);
        st.vols[id] = v > 0 ? 0 : +tile.dataset.last;
        paint(); patchVols();
      } }, h('span', { class: 'ico', text: SOUND_ICONS[id] }), h('span', { class: 'nm', text: t('s_' + id) })), r);
    g.append(tile);
  }
  const p = $('#pre'); p.innerHTML = '';
  for (const id of Object.keys(PRESETS)) p.append(h('button', { class: 'btn ghost small', text: t('p_' + id), onclick: () => { st.vols = { ...PRESETS[id] }; paint(); patchVols(); } }));
  const sel = $('#tm'); const cur = st ? st.timerMin : 0; sel.innerHTML = '';
  MINS.forEach(m => sel.append(h('option', { value: m }, m ? t('min', { n: m }) : t('timerOff'))));
  sel.value = cur;
}

function paint(skipSliders) {
  if (!st) return;
  const pb = $('#play'); pb.textContent = (st.playing ? '⏸ ' + t('pause') : '▶ ' + t('play'));
  $('#master').value = Math.round(st.master * 100);
  document.querySelectorAll('.tile').forEach(tile => {
    const v = st.vols[tile.dataset.id] || 0;
    tile.classList.toggle('on', v > 0);
    const r = tile.querySelector('input'); if (!skipSliders || document.activeElement !== r) r.value = Math.round(v * 100);
  });
  $('#tm').value = st.timerMin;
  tick();
}

function tick() {
  if (!st) return;
  const rem = st.playing && st.timerEnd > Date.now() ? Math.ceil((st.timerEnd - Date.now()) / 1000) : 0;
  $('#left').textContent = rem ? t('left', { t: `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}` }) : '';
  if (st.playing && st.timerEnd && st.timerEnd < Date.now() - 500) send({ type: 'get' }).then(s => { st = s; paint(); });
}

App.onReady(async () => {
  st = await send({ type: 'get' });
  build(); paint();
  $('#play').addEventListener('click', () => patch({ playing: !st.playing }));
  let mt = 0;
  $('#master').addEventListener('input', e => { st.master = e.target.value / 100; clearTimeout(mt); mt = setTimeout(() => send({ type: 'patch', patch: { master: st.master } }), 40); });
  $('#tm').addEventListener('change', e => { const m = +e.target.value; patch(st.playing ? { timerMin: m, timerEnd: m ? Date.now() + m * 60000 : 0 } : { timerMin: m }); });
  $('#reset').addEventListener('click', () => { st.vols = {}; paint(); patch({ vols: {} }); });
  setInterval(tick, 1000);
});
App.onLang(() => { if (st) { build(); paint(); } });
