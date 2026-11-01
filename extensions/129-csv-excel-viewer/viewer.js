const { $, h } = App;
let file = null, buf = null, kind = 'csv', book = null, sheetIdx = 0;
let raw = [], header = [], body = [], view = [], sortCol = -1, sortDir = 1, limit = 500;

function detectDelim(text) {
  const sample = text.split(/\r?\n/).slice(0, 20).join('\n');
  let best = ',', bestScore = -1;
  for (const d of [',', ';', '\t', '|']) {
    const counts = sample.split('\n').filter(Boolean).map(l => l.split(d).length - 1);
    if (!counts.length) continue;
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const consistent = counts.filter(c => c === counts[0]).length / counts.length;
    const score = avg * consistent;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}
function parseCSV(text, d) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"' && f === '') q = true;
    else if (c === d) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function decode(buffer, enc) {
  let s = new TextDecoder(enc).decode(buffer);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s;
}
function autoEnc(buffer) {
  const s = new TextDecoder('utf-8').decode(buffer.slice(0, 200000));
  const bad = (s.match(/�/g) || []).length;
  return bad > 3 ? 'windows-1251' : 'utf-8';
}

async function open(f) {
  file = f;
  buf = await f.arrayBuffer();
  $('#dropZone').classList.add('hidden'); $('#view').classList.remove('hidden');
  $('#fname').textContent = f.name;
  sortCol = -1; limit = 500;
  if (/\.xls$/i.test(f.name)) { App.toast(t('xlsOld'), 'err'); return; }
  const isZip = new Uint8Array(buf)[0] === 0x50 && new Uint8Array(buf)[1] === 0x4b;
  if (isZip) {
    kind = 'xlsx';
    try { book = await XLSX.read(buf); } catch (e) { App.toast(t('badXlsx') + ': ' + e.message, 'err'); return; }
    sheetIdx = 0;
    $('#csvOpts').classList.add('hidden');
    await loadSheet();
  } else {
    kind = 'csv'; book = null;
    $('#csvOpts').classList.remove('hidden');
    $('#enc').value = autoEnc(buf);
    const text = decode(buf, $('#enc').value);
    $('#delim').value = /\.tsv$/i.test(f.name) ? '\t' : detectDelim(text);
    loadCSV();
  }
}
function loadCSV() {
  raw = parseCSV(decode(buf, $('#enc').value), $('#delim').value);
  while (raw.length && raw[raw.length - 1].every(x => x === '')) raw.pop();
  renderTabs(); prepare();
}
async function loadSheet() {
  raw = await book.sheet(sheetIdx);
  renderTabs(); prepare();
}
function renderTabs() {
  const T = $('#tabs'); T.innerHTML = '';
  T.classList.toggle('hidden', !book || book.sheets.length < 2);
  if (!book) return;
  book.sheets.forEach((n, i) => T.append(h('button', { class: i === sheetIdx ? 'active' : '', text: n, onclick: async () => { sheetIdx = i; sortCol = -1; await loadSheet(); } })));
}
function prepare() {
  const width = raw.reduce((m, r) => Math.max(m, r.length), 0);
  const norm = raw.map(r => { const x = r.slice(); while (x.length < width) x.push(''); return x.map(v => v ?? ''); });
  if ($('#hdr').checked && norm.length) { header = norm[0].map((v, i) => v || colName(i)); body = norm.slice(1); }
  else { header = Array.from({ length: width }, (_, i) => colName(i)); body = norm; }
  apply();
}
const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const num = v => { if (v === '' || v == null) return NaN; const s = String(v).replace(/\s/g, '').replace(/,(\d+)$/, '.$1'); return /^-?\d*\.?\d+(e-?\d+)?$/i.test(s) ? +s : NaN; };

function apply() {
  const q = $('#q').value.trim().toLowerCase();
  view = body.map((r, i) => ({ r, i })).filter(x => !q || x.r.some(v => String(v).toLowerCase().includes(q)));
  if (sortCol >= 0) {
    view.sort((a, b) => {
      const x = a.r[sortCol], y = b.r[sortCol], nx = num(x), ny = num(y);
      if (!isNaN(nx) && !isNaN(ny)) return (nx - ny) * sortDir;
      return String(x).localeCompare(String(y), undefined, { numeric: true }) * sortDir;
    });
  }
  render();
}
function render() {
  const q = $('#q').value.trim().toLowerCase();
  $('#info').textContent = view.length === body.length ? t('rows', { n: body.length.toLocaleString() }) : t('shown', { a: view.length.toLocaleString(), b: body.length.toLocaleString() });
  const TH = $('#th'); TH.innerHTML = '';
  const numCols = header.map((_, c) => { const vals = body.slice(0, 200).map(r => r[c]).filter(v => v !== ''); return vals.length && vals.filter(v => !isNaN(num(v))).length / vals.length > 0.8; });
  TH.append(h('tr', {}, h('th', { class: 'rn', text: '#' }), header.map((n, i) => h('th', {
    title: n, text: n + (sortCol === i ? (sortDir > 0 ? ' ▲' : ' ▼') : ''),
    onclick: e => { if (e.shiftKey) return stats(i); if (sortCol === i) sortDir = -sortDir; else { sortCol = i; sortDir = 1; } apply(); stats(i); }
  }))));
  const TB = $('#tb'); TB.innerHTML = '';
  const frag = document.createDocumentFragment();
  const esc = App.esc;
  for (const { r, i } of view.slice(0, limit)) {
    const tr = document.createElement('tr');
    let html = `<td class="rn">${i + 1 + ($('#hdr').checked ? 1 : 0)}</td>`;
    r.forEach((v, c) => {
      let s = esc(v);
      if (q) { const k = String(v).toLowerCase().indexOf(q); if (k >= 0) s = esc(String(v).slice(0, k)) + '<mark>' + esc(String(v).slice(k, k + q.length)) + '</mark>' + esc(String(v).slice(k + q.length)); }
      html += `<td${numCols[c] ? ' class="num"' : ''} title="${esc(v)}">${s}</td>`;
    });
    tr.innerHTML = html;
    frag.append(tr);
  }
  TB.append(frag);
  const left = view.length - limit;
  $('#more').classList.toggle('hidden', left <= 0);
  $('#more').textContent = t('more', { n: Math.min(left, 500).toLocaleString() });
}
function stats(c) {
  const vals = view.map(x => x.r[c]).filter(v => v !== '');
  const nums = vals.map(num).filter(v => !isNaN(v));
  const S = $('#stats'); S.innerHTML = ''; S.classList.remove('hidden');
  const parts = [[t('count'), vals.length], [t('unique'), new Set(vals).size]];
  if (nums.length) {
    const sum = nums.reduce((a, b) => a + b, 0);
    parts.push([t('sum'), +sum.toFixed(4)], [t('avg'), +(sum / nums.length).toFixed(4)], [t('min'), Math.min(...nums)], [t('max'), Math.max(...nums)]);
  }
  S.append(h('b', { text: header[c] + ': ' }), ...parts.map(([k, v]) => h('span', { style: { marginRight: '14px' } }, k + ' ', h('b', { text: Number(v).toLocaleString() }))));
}

App.onReady(() => {
  const pick = e => { const f = e.target.files[0]; if (f) open(f); e.target.value = ''; };
  $('#file').addEventListener('change', pick); $('#file2').addEventListener('change', pick);
  const dz = document.body;
  dz.addEventListener('dragover', e => { e.preventDefault(); $('#dropZone').classList.add('over'); });
  dz.addEventListener('dragleave', () => $('#dropZone').classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); $('#dropZone').classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) open(f); });
  $('#delim').addEventListener('change', loadCSV);
  $('#enc').addEventListener('change', loadCSV);
  $('#hdr').addEventListener('change', prepare);
  let tm; $('#q').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { limit = 500; apply(); }, 200); });
  $('#more').addEventListener('click', () => { limit += 500; render(); });
  $('#exp').addEventListener('click', () => {
    const q = v => /[",\n;]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
    const out = [header, ...view.map(x => x.r)].map(r => r.map(q).join(',')).join('\r\n');
    App.download((file ? file.name.replace(/\.\w+$/, '') : 'table') + '-export.csv', '﻿' + out, 'text/csv');
  });
});
App.onLang(() => { if (body.length) render(); });
