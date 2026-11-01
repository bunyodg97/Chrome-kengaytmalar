const { $, h } = App;
const COLS = ['todo', 'doing', 'done'];
const COLORS = ['', '#e03131', '#f08c00', '#2f9e44', '#1c7ed6', '#9c36b5'];
let st;   // {boards:[{id,name,cards:[{id,c,text,color,due}]}], cur}
let editing = null; // card id or 'new:col'

async function load() {
  st = await App.get('kanban', null);
  if (!st || !st.boards || !st.boards.length) st = { boards: [{ id: 'b1', name: 'Asosiy', cards: [] }], cur: 'b1' };
}
async function save() {
  await App.set('kanban', st);
  const n = st.boards.reduce((a, b) => a + b.cards.filter(c => c.c === 'doing').length, 0);
  chrome.action.setBadgeText({ text: n ? String(n) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#1971c2' });
}
const board = () => st.boards.find(b => b.id === st.cur) || st.boards[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function editor(card, col) {
  const ta = h('textarea', { placeholder: t('cardPh') });
  ta.value = card ? card.text : '';
  let color = card ? card.color || '' : '';
  const due = h('input', { type: 'date', style: { width: 'auto', padding: '2px 4px', fontSize: '11px' } });
  due.value = card && card.due || '';
  const sws = COLORS.map(c => { const s = h('span', { class: 'sw' + (c === color ? ' on' : ''), style: { background: c || 'var(--bg3)' } }); s.addEventListener('mousedown', e => { e.preventDefault(); color = c; sws.forEach(x => x.classList.toggle('on', x === s)); }); return s; });
  const commit = async () => {
    const text = ta.value.trim();
    if (card) { if (text) Object.assign(card, { text, color, due: due.value }); else board().cards = board().cards.filter(x => x !== card); }
    else if (text) board().cards.push({ id: uid(), c: col, text, color, due: due.value });
    editing = null; await save(); render();
  };
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { editing = null; render(); }
  });
  const box = h('div', { class: 'cd ed' }, ta, h('div', { class: 'row' }, ...sws, due, h('span', { class: 'grow' }), h('button', { class: 'btn small', text: '✓', onclick: commit })));
  setTimeout(() => ta.focus(), 0);
  return box;
}

function render() {
  const sel = $('#board'); sel.innerHTML = '';
  st.boards.forEach(b => sel.append(h('option', { value: b.id }, b.name)));
  sel.value = st.cur;
  const K = $('#kb'); K.innerHTML = '';
  const b = board();
  const today = new Date().toISOString().slice(0, 10);
  for (const c of COLS) {
    const cards = b.cards.filter(x => x.c === c);
    const col = h('div', { class: 'col', 'data-col': c }, h('h3', {}, h('span', { text: t(c) }), h('span', { text: cards.length })));
    for (const cd of cards) {
      if (editing === cd.id) { col.append(editor(cd, c)); continue; }
      const el = h('div', { class: 'cd' + (c === 'done' ? ' done-t' : ''), draggable: 'true', 'data-id': cd.id, style: { borderLeftColor: cd.color || 'var(--line)' } },
        h('div', { class: 'tx', text: cd.text }),
        cd.due ? h('div', { class: 'due' + (cd.due < today && c !== 'done' ? ' late' : ''), text: '⏰ ' + new Date(cd.due + 'T00:00').toLocaleDateString() + (cd.due < today && c !== 'done' ? ' · ' + t('overdue') : '') }) : '',
        h('button', { class: 'x', text: '✕', onclick: async e => { e.stopPropagation(); b.cards = b.cards.filter(x => x !== cd); await save(); render(); } }));
      el.addEventListener('dblclick', () => { editing = cd.id; render(); });
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', cd.id); el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      col.append(el);
    }
    if (editing === 'new:' + c) col.append(editor(null, c));
    else col.append(h('button', { class: 'add', text: t('addCard'), onclick: () => { editing = 'new:' + c; render(); } }));
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', async e => {
      e.preventDefault(); col.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      const card = b.cards.find(x => x.id === id);
      if (!card) return;
      // tushgan joyga qarab tartib
      const after = [...col.querySelectorAll('.cd[data-id]')].find(x => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
      b.cards = b.cards.filter(x => x !== card);
      card.c = c;
      if (after) b.cards.splice(b.cards.findIndex(x => x.id === after.dataset.id), 0, card); else b.cards.push(card);
      await save(); render();
    });
    K.append(col);
  }
}

App.onReady(async () => {
  await load();
  if (document.body.classList.contains('wide')) $('#big').remove();
  $('#board').addEventListener('change', async () => { st.cur = $('#board').value; await save(); render(); });
  $('#addBoard').addEventListener('click', async () => {
    const n = prompt(t('boardName'), t('newBoard')); if (!n) return;
    const id = uid(); st.boards.push({ id, name: n, cards: [] }); st.cur = id; await save(); render();
  });
  $('#menuBtn').addEventListener('click', () => $('#menu').classList.toggle('hidden'));
  $('#rename').addEventListener('click', async () => { const n = prompt(t('boardName'), board().name); if (n) { board().name = n; await save(); render(); } });
  $('#clearDone').addEventListener('click', async () => { board().cards = board().cards.filter(c => c.c !== 'done'); await save(); render(); });
  $('#delBoard').addEventListener('click', async () => {
    if (!confirm(t('confirmDel'))) return;
    st.boards = st.boards.filter(b => b.id !== st.cur);
    if (!st.boards.length) st.boards.push({ id: uid(), name: 'Asosiy', cards: [] });
    st.cur = st.boards[0].id; await save(); render();
  });
  $('#exp').addEventListener('click', () => App.download('kanban.json', JSON.stringify(st, null, 2), 'application/json'));
  $('#imp').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j.boards) throw new Error('format'); st = j; await save(); render(); App.toast(t('imported'), 'ok'); } catch (er) { App.toast(er.message, 'err'); }
  });
  chrome.storage.onChanged.addListener(async ch => { if (ch.kanban && !editing) { st = ch.kanban.newValue; render(); } });
  render();
});
App.onLang(render);
