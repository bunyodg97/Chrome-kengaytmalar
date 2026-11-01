const dk = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const COLS = ['#2e7d32', '#1f5fd1', '#ef6c00', '#6d3fd1', '#c62828', '#00838f', '#ad1457', '#5d4037'];
const WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
function due(h, t = Date.now()) { return !h.days || h.days.length === 7 || h.days.includes(new Date(t).getDay()); }
function streak(h) {
  let s = 0, t = Date.now();
  if (!h.done[dk(t)]) t -= 864e5; // bugun hali belgilanmagan bo'lsa kechadan sanaymiz
  for (let i = 0; i < 1000; i++, t -= 864e5) {
    if (!due(h, t)) continue;
    if (h.done[dk(t)]) s++; else break;
  }
  return s;
}
function best(h) {
  const keys = Object.keys(h.done).sort(); let b = 0, cur = 0, prev = null;
  for (const k of keys) { const t = new Date(k + 'T12:00').getTime(); let gap = false;
    if (prev) for (let x = prev + 864e5; x < t - 3600e3; x += 864e5) if (due(h, x)) { gap = true; break; }
    cur = prev && !gap ? cur + 1 : 1; b = Math.max(b, cur); prev = t; }
  return b;
}
