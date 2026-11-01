let tab, tables = [];
function grab() {
  const out = [];
  const read = t => {
    const grid = [], rows = t.matches('table') ? [...t.rows] : [...t.querySelectorAll('[role=row]')];
    rows.forEach((tr, ri) => {
      grid[ri] = grid[ri] || []; let ci = 0;
      [...(tr.cells || tr.querySelectorAll('[role=cell],[role=gridcell],[role=columnheader],[role=rowheader]'))].forEach(td => {
        while (grid[ri][ci] !== undefined) ci++;
        const v = td.innerText.replace(/\s+\n/g, '\n').trim(), rs = +td.rowSpan || 1, cs = +td.colSpan || 1;
        for (let r = 0; r < rs; r++) for (let c = 0; c < cs; c++) { grid[ri + r] = grid[ri + r] || []; grid[ri + r][ci + c] = r || c ? '' : v; }
        ci += cs;
      });
    });
    return grid.map(r => Array.from(r, x => x ?? ''));
  };
  [...document.querySelectorAll('table, [role=table], [role=grid]')].forEach((t, i) => {
    if (t.closest('table') !== t && t.matches('table') && t.parentElement.closest('table')) return; // ichma-ich jadvallarni o'tkazamiz
    const g = read(t); if (g.length < 2 || Math.max(...g.map(r => r.length)) < 2) return;
    t.dataset.jyId = i;
    out.push({ id: i, title: (t.caption?.innerText || t.getAttribute('aria-label') || t.previousElementSibling?.innerText || '').trim().slice(0, 60), grid: g });
  });
  return { title: document.title, tables: out };
}
const toNum = v => { const s = String(v).replace(/ | /g, ' ').trim(); if (!/^[-+]?[\d\s]+([.,]\d+)?\s*%?$/.test(s) || /^0\d/.test(s.replace(/\s/g, ''))) return v; const n = parseFloat(s.replace(/\s/g, '').replace(',', '.').replace('%', '')); return isNaN(n) ? v : s.endsWith('%') ? n / 100 : n; };
const prep = g => $('#num').checked ? g.map(r => r.map(toNum)) : g;
const name = () => (tab.title || 'jadval').replace(/[\\/:*?"<>|]+/g, '').slice(0, 50);
function sheet(g) { const ws = XLSX.utils.aoa_to_sheet(prep(g)); ws['!cols'] = (g[0] || []).map((_, c) => ({ wch: Math.min(50, Math.max(6, ...g.slice(0, 50).map(r => String(r[c] ?? '').length))) })); return ws; }
function xlsx(list, fn) { const wb = XLSX.utils.book_new(); list.forEach((t, i) => XLSX.utils.book_append_sheet(wb, sheet(t.grid), (t.title || 'Jadval ' + (i + 1)).replace(/[\\/?*[\]:]/g, '').slice(0, 28) + (list.length > 1 ? ' ' + (i + 1) : ''))); download(fn, new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], { type: 'application/octet-stream' })); }
(async () => {
  tab = await activeTab();
  let r; try { [{ result: r }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: grab }); } catch { $('#list').innerHTML = '<div class="empty">Bu sahifada ishlamaydi.</div>'; return; }
  tables = r.tables; $('#sum').textContent = tables.length ? `${tables.length} ta jadval topildi` : ''; $('#all').hidden = tables.length < 2;
  $('#list').innerHTML = tables.map((t, i) => `<div class="tb" data-i="${i}"><div class="row between"><b class="small">${esc(t.title || 'Jadval ' + (i + 1))}</b><span class="chip">${t.grid.length}×${Math.max(...t.grid.map(r => r.length))}</span></div>
    <div class="pv"><table>${t.grid.slice(0, 4).map(r => `<tr>${r.slice(0, 6).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>
    <div class="row"><button data-a="xlsx">Excel</button><button class="ghost" data-a="csv">CSV</button><button class="ghost" data-a="copy">Nusxalash</button><button class="ghost" data-a="show">Ko'rsatish</button></div></div>`).join('') || '<div class="empty">Bu sahifada jadval topilmadi.</div>';
})();
$('#list').onclick = e => {
  const a = e.target.dataset.a; if (!a) return; const t = tables[+e.target.closest('[data-i]').dataset.i];
  if (a === 'xlsx') xlsx([t], name() + '.xlsx');
  if (a === 'csv') download(name() + '.csv', '﻿' + t.grid.map(r => r.map(c => /[;"\n]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c).join(';')).join('\n'), 'text/csv');
  if (a === 'copy') copyText(t.grid.map(r => r.join('\t')).join('\n'));
  if (a === 'show') chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [t.id], func: id => { const el = document.querySelector(`[data-jy-id="${id}"]`); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.outline = '3px solid #217346'; setTimeout(() => el.style.outline = '', 2500); } });
};
$('#all').onclick = () => xlsx(tables, name() + ' (barcha jadvallar).xlsx');
