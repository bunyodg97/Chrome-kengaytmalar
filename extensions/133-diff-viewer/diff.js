const { $, $$, h } = App;
let view = 'split', lastParts = null;
const esc = s => App.esc(s);

function opts() { return { ignoreWhitespace: $('#ws').checked, ignoreCase: $('#cs').checked }; }
function norm(s) { return s.replace(/\r\n?/g, '\n'); }

function compute() {
  const A = norm($('#a').value), B = norm($('#b').value);
  const o = opts();
  const parts = Diff.diffLines(A, B, { ignoreWhitespace: o.ignoreWhitespace, ignoreCase: o.ignoreCase, newlineIsToken: false });
  // qatorlarga yoyish
  const rows = [];
  let ln = 1, rn = 1;
  for (const p of parts) {
    const lines = p.value.replace(/\n$/, '').split('\n');
    for (const l of lines) {
      if (p.added) rows.push({ t: 'add', r: l, rn: rn++ });
      else if (p.removed) rows.push({ t: 'del', l, ln: ln++ });
      else rows.push({ t: 'eq', l, r: l, ln: ln++, rn: rn++ });
    }
  }
  return rows;
}

function inline(a, b) {
  const o = opts();
  const d = Diff.diffWordsWithSpace(a, b, { ignoreCase: o.ignoreCase });
  let L = '', R = '';
  for (const p of d) {
    if (p.added) R += '<ins>' + esc(p.value) + '</ins>';
    else if (p.removed) L += '<del>' + esc(p.value) + '</del>';
    else { L += esc(p.value); R += esc(p.value); }
  }
  return [L, R];
}

// kontekst bo'yicha qatorlarni yashirish
function visible(rows) {
  const ctx = +$('#ctx').value;
  if (ctx < 0) return rows.map(r => r);
  const keep = new Array(rows.length).fill(false);
  rows.forEach((r, i) => { if (r.t !== 'eq') for (let k = Math.max(0, i - ctx); k <= Math.min(rows.length - 1, i + ctx); k++) keep[k] = true; });
  const out = [];
  let skip = 0;
  rows.forEach((r, i) => { if (keep[i]) { if (skip) { out.push({ t: 'gap', n: skip }); skip = 0; } out.push(r); } else skip++; });
  if (skip) out.push({ t: 'gap', n: skip });
  return out;
}

function renderSplit(rows) {
  // o'chirilgan + qo'shilgan bloklarni juftlash
  const pairs = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.t === 'del') {
      const dels = []; while (i < rows.length && rows[i].t === 'del') dels.push(rows[i++]);
      const adds = []; while (i < rows.length && rows[i].t === 'add') adds.push(rows[i++]);
      i--;
      for (let k = 0; k < Math.max(dels.length, adds.length); k++) pairs.push({ d: dels[k], a: adds[k] });
    } else if (r.t === 'add') pairs.push({ a: r });
    else pairs.push({ eq: r });
  }
  let html = '<table class="dt split"><colgroup><col style="width:48px"><col><col style="width:48px"><col></colgroup>';
  for (const p of pairs) {
    if (p.eq && p.eq.t === 'gap') { html += `<tr class="gap"><td colspan="4">${esc(t('hidden', { n: p.eq.n }))}</td></tr>`; continue; }
    if (p.eq) { html += `<tr><td class="n">${p.eq.ln}</td><td class="c">${esc(p.eq.l)}</td><td class="n">${p.eq.rn}</td><td class="c">${esc(p.eq.r)}</td></tr>`; continue; }
    let L = p.d ? esc(p.d.l) : '', R = p.a ? esc(p.a.r) : '';
    if (p.d && p.a) [L, R] = inline(p.d.l, p.a.r);
    html += `<tr><td class="n">${p.d ? p.d.ln : ''}</td><td class="c ${p.d ? 'del' : 'empty'}">${L}</td><td class="n">${p.a ? p.a.rn : ''}</td><td class="c ${p.a ? 'add' : 'empty'}">${R}</td></tr>`;
  }
  return html + '</table>';
}
function renderUnified(rows) {
  let html = '<table class="dt"><colgroup><col style="width:48px"><col style="width:48px"><col style="width:16px"><col></colgroup>';
  for (const r of rows) {
    if (r.t === 'gap') { html += `<tr class="gap"><td colspan="4">${esc(t('hidden', { n: r.n }))}</td></tr>`; continue; }
    const sign = r.t === 'add' ? '+' : r.t === 'del' ? '−' : '';
    html += `<tr class="${r.t}"><td class="n">${r.ln || ''}</td><td class="n">${r.rn || ''}</td><td class="s">${sign}</td><td class="c">${esc(r.t === 'add' ? r.r : r.l)}</td></tr>`;
  }
  return html + '</table>';
}

function run() {
  const rows = compute();
  lastParts = rows;
  const a = rows.filter(r => r.t === 'add').length, d = rows.filter(r => r.t === 'del').length;
  $('#stats').innerHTML = `<b style="color:var(--ok)">+${a}</b> <b style="color:var(--bad)">−${d}</b>`;
  $('#stats').title = t('stats', { a, d });
  const R = $('#res');
  if (!a && !d) { R.innerHTML = `<div class="ok-big">${esc(t('same'))}</div>`; return; }
  const vis = visible(rows);
  R.innerHTML = view === 'split' ? renderSplit(vis) : renderUnified(vis);
  $('#inputs').classList.add('hidden');
  App.set('diffTexts', { a: $('#a').value, b: $('#b').value });
}
function counts() { $('#ln').textContent = norm($('#a').value).split('\n').length; $('#rn').textContent = norm($('#b').value).split('\n').length; }

App.onReady(async () => {
  const saved = await App.get('diffTexts', null);
  if (saved) { $('#a').value = saved.a; $('#b').value = saved.b; }
  counts();
  ['a', 'b'].forEach(id => {
    $('#' + id).addEventListener('input', counts);
    $('#' + id).addEventListener('dragover', e => e.preventDefault());
    $('#' + id).addEventListener('drop', async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { $('#' + id).value = await f.text(); counts(); } });
  });
  $('#fl').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { $('#a').value = await f.text(); counts(); } });
  $('#fr').addEventListener('change', async e => { const f = e.target.files[0]; if (f) { $('#b').value = await f.text(); counts(); } });
  $('#go').addEventListener('click', run);
  $('#edit').addEventListener('click', () => $('#inputs').classList.toggle('hidden'));
  $('#swap').addEventListener('click', () => { const x = $('#a').value; $('#a').value = $('#b').value; $('#b').value = x; counts(); if (lastParts) run(); });
  $$('#view button').forEach(b => b.addEventListener('click', () => { view = b.dataset.v; $$('#view button').forEach(x => x.classList.toggle('active', x === b)); if (lastParts) run(); }));
  ['ws', 'cs', 'ctx'].forEach(id => $('#' + id).addEventListener('change', () => { if (lastParts) run(); }));
  $('#patch').addEventListener('click', () => App.download('changes.patch', Diff.createTwoFilesPatch('a', 'b', norm($('#a').value), norm($('#b').value), '', '', { context: Math.max(0, +$('#ctx').value) || 3 }), 'text/x-diff'));
  $('#clr').addEventListener('click', () => { $('#a').value = $('#b').value = ''; $('#res').innerHTML = ''; lastParts = null; $('#inputs').classList.remove('hidden'); counts(); App.set('diffTexts', null); });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });
});
App.onLang(() => { if (lastParts) run(); });
