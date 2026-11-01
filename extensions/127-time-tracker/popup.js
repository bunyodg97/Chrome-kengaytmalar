const { $, h } = App;
let data, timer;
const CURS = ['UZS', 'USD', 'EUR', 'RUB', 'KZT'];

function startOfDay(d) { d = new Date(d); d.setHours(0, 0, 0, 0); return d.getTime(); }
function startOfWeek() { const d = new Date(); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return startOfDay(d); }
function spent(pid, from) {
  let ms = data.entries.filter(e => (!pid || e.p === pid) && e.e > from).reduce((a, e) => a + e.e - Math.max(e.s, from), 0);
  if (data.running && (!pid || data.running.p === pid)) ms += Date.now() - Math.max(data.running.s, from);
  return ms;
}

let editing = null;
async function render() {
  data = await TT.load();
  const R = $('#run');
  if (data.running) {
    const p = data.projects.find(x => x.id === data.running.p) || { name: '?' };
    R.classList.remove('hidden'); R.innerHTML = '';
    const secs = Math.floor((Date.now() - data.running.s) / 1000);
    R.append(h('div', { class: 'small muted', text: t('running') + ': ' + p.name }),
      h('div', { class: 'row' }, h('span', { class: 'big grow', text: `${Math.floor(secs / 3600)}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}` }),
        h('button', { class: 'btn danger', text: '■', onclick: async () => { await TT.stop(); render(); } })));
  } else R.classList.add('hidden');
  const P = $('#projects'); P.innerHTML = '';
  if (!data.projects.length) P.append(h('div', { class: 'empty', text: t('noProjects') }));
  const today = startOfDay(Date.now());
  for (const p of data.projects) {
    const on = data.running && data.running.p === p.id;
    P.append(h('div', { class: 'pr' }, h('i', { style: { background: p.color } }), h('span', { class: 'n', text: p.name }),
      h('span', { class: 'tm', text: TT.dur(spent(p.id, today)) }),
      h('button', { class: 'btn ghost small', text: '⋯', title: t('edit'), onclick: () => { editing = editing === p.id ? null : p.id; render(); } }),
      h('button', { class: 'play' + (on ? ' on' : ''), text: on ? '■' : '▶', onclick: async () => { on ? await TT.stop() : await TT.start(p.id); render(); } })));
    if (editing === p.id) {
      const rate = h('input', { type: 'number', min: 0, value: p.rate || '', placeholder: t('rate') });
      const cur = h('select', {}, CURS.map(c => h('option', { value: c }, c))); cur.value = p.cur || 'UZS';
      const name = h('input', { value: p.name });
      const save = async () => { p.name = name.value.trim() || p.name; p.rate = +rate.value || 0; p.cur = cur.value; await TT.save({ projects: data.projects }); };
      [rate, cur, name].forEach(x => x.addEventListener('change', save));
      P.append(h('div', { class: 'ed' }, name, rate, cur,
        h('button', { class: 'btn ghost small', style: { gridColumn: '1 / -1', color: 'var(--bad)' }, text: t('del'), onclick: async () => {
          if (!confirm(t('confirmDel'))) return;
          if (data.running && data.running.p === p.id) await TT.save({ running: null });
          await TT.save({ projects: data.projects.filter(x => x.id !== p.id), entries: data.entries.filter(e => e.p !== p.id) });
          await TT.badge(); editing = null; render();
        } })));
    }
  }
  $('#tToday').textContent = TT.dur(spent(null, today));
  $('#tWeek').textContent = TT.dur(spent(null, startOfWeek()));
}

App.onReady(async () => {
  $('#addF').addEventListener('submit', async e => {
    e.preventDefault();
    const n = $('#pname').value.trim(); if (!n) return;
    const d = await TT.load();
    d.projects.push({ id: TT.uid(), name: n, color: TT.COLORS[d.projects.length % TT.COLORS.length], rate: 0, cur: 'UZS' });
    await TT.save({ projects: d.projects });
    $('#pname').value = ''; render();
  });
  await render();
  timer = setInterval(() => { if (data && data.running && editing === null && document.activeElement.tagName !== "INPUT") render(); }, 1000);
});
App.onLang(render);
