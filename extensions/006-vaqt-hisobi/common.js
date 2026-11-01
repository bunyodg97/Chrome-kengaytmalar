const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const COLORS = ['#1f5fd1', '#ef6c00', '#2e7d32', '#6d3fd1', '#c62828', '#00838f', '#ad1457', '#5d4037', '#546e7a', '#9e9d24'];
function sumDays(days, keys) {
  const t = {}; keys.forEach(k => Object.entries(days[k] || {}).forEach(([d, ms]) => t[d] = (t[d] || 0) + ms));
  return Object.entries(t).sort((a, b) => b[1] - a[1]);
}
function lastKeys(n) { return Array.from({ length: n }, (_, i) => dayKey(Date.now() - i * 864e5)).reverse(); }
function siteRows(list, limit = 50) {
  const total = list.reduce((a, x) => a + x[1], 0) || 1;
  return list.slice(0, limit).map(([d, ms], i) => `<div class="item" style="flex-direction:column;align-items:stretch;gap:4px">
    <div class="row between"><span class="row" style="gap:6px;min-width:0"><img src="https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(d)}" width="16" height="16" alt=""><b class="small" style="overflow:hidden;text-overflow:ellipsis">${esc(d)}</b></span><span class="small mono">${fmtDur(ms)}</span></div>
    <div class="bar"><span style="width:${(ms / total * 100).toFixed(1)}%;background:${COLORS[i % COLORS.length]}"></span></div></div>`).join('');
}
