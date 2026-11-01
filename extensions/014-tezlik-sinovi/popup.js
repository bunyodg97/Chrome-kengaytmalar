const BASE = 'https://speed.cloudflare.com';
function gauge(v) {
  const c = $('#g').getContext('2d'), W = 440, H = 260, cx = W / 2, cy = 240, r = 190;
  const max = v > 500 ? 1000 : v > 100 ? 500 : 100, f = Math.min(1, v / max);
  const css = getComputedStyle(document.body);
  c.clearRect(0, 0, W, H); c.lineWidth = 26; c.lineCap = 'round';
  c.strokeStyle = css.getPropertyValue('--line'); c.beginPath(); c.arc(cx, cy, r, Math.PI, 2 * Math.PI); c.stroke();
  c.strokeStyle = css.getPropertyValue('--acc'); c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * f); c.stroke();
  c.fillStyle = css.getPropertyValue('--muted'); c.font = '22px sans-serif'; c.textAlign = 'center';
  c.fillText('0', cx - r, cy + 4 + 22); c.fillText(String(max), cx + r, cy + 4 + 22);
}
const mbps = (bytes, ms) => bytes * 8 / ms / 1000;
async function ping() {
  const t = [];
  for (let i = 0; i < 8; i++) { const s = performance.now(); await fetch(`${BASE}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store' }); t.push(performance.now() - s); }
  t.sort((a, b) => a - b); return { ping: t[1], jitter: t.slice(1, -1).reduce((a, x, i, arr) => i ? a + Math.abs(x - arr[i - 1]) : 0, 0) / (t.length - 3) };
}
async function download(sec = 7) {
  let bytes = 0; const start = performance.now(), end = start + sec * 1000, ctrl = new AbortController();
  const ui = setInterval(() => { const v = mbps(bytes, performance.now() - start); $('#now').textContent = v.toFixed(1); gauge(v); }, 150);
  const worker = async () => {
    while (performance.now() < end) {
      const r = await fetch(`${BASE}/__down?bytes=25000000&r=${Math.random()}`, { cache: 'no-store', signal: ctrl.signal });
      const rd = r.body.getReader();
      while (true) { const { done, value } = await rd.read(); if (done) break; bytes += value.length; if (performance.now() > end) { ctrl.abort(); return; } }
    }
  };
  await Promise.allSettled([worker(), worker(), worker(), worker()]);
  clearInterval(ui); return mbps(bytes, performance.now() - start);
}
async function upload(sec = 6) {
  let bytes = 0; const start = performance.now(), end = start + sec * 1000, chunk = new Uint8Array(2 * 1024 * 1024);
  crypto.getRandomValues(chunk.subarray(0, 65536));
  const ui = setInterval(() => { const v = mbps(bytes, performance.now() - start); $('#now').textContent = v.toFixed(1); gauge(v); }, 150);
  const worker = async () => { while (performance.now() < end) { await fetch(`${BASE}/__up?r=${Math.random()}`, { method: 'POST', body: chunk, cache: 'no-store' }); bytes += chunk.length; } };
  await Promise.allSettled([worker(), worker(), worker()]);
  clearInterval(ui); return mbps(bytes, performance.now() - start);
}
function fit(d, u, p) {
  const rows = [
    ['Messenjer va email', d >= 1], ['YouTube 1080p', d >= 8], ['YouTube 4K', d >= 25], ['Video qo\'ng\'iroq (Zoom, Meet)', d >= 4 && u >= 3 && p < 150],
    ['Onlayn o\'yinlar', d >= 5 && p < 60], ['Jonli efir (stream) 1080p', u >= 8], ['Katta fayllar yuklash', u >= 20]
  ];
  $('#fitBox').hidden = false;
  $('#fitBox').innerHTML = '<b class="small">Nimaga yetadi</b>' + rows.map(([n, ok]) => `<div class="fit"><span>${n}</span><span class="chip ${ok ? 'ok' : 'bad'}">${ok ? 'Yetadi' : 'Yetmaydi'}</span></div>`).join('');
}
async function hist(add) {
  let h = await store.get('hist', []); if (add) { h.unshift(add); h = h.slice(0, 20); await store.set('hist', h); }
  $('#hist').innerHTML = '<tr><th>Vaqt</th><th>Ping</th><th>↓</th><th>↑</th></tr>' + h.map(x => `<tr><td>${new Date(x.t).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td><td>${x.p}</td><td>${x.d}</td><td>${x.u}</td></tr>`).join('');
}
$('#go').onclick = async () => {
  $('#go').disabled = true; $('#fitBox').hidden = true; ['#ping', '#down', '#up'].forEach(s => $(s).textContent = '…');
  try {
    $('#phase').textContent = 'Ping o\'lchanmoqda'; const p = await ping(); $('#ping').textContent = Math.round(p.ping);
    $('#phase').textContent = 'Yuklab olish, Mbit/s'; const d = await download(); $('#down').textContent = d.toFixed(1);
    $('#phase').textContent = 'Yuklash, Mbit/s'; const u = await upload(); $('#up').textContent = u.toFixed(1);
    $('#now').textContent = d.toFixed(1); $('#phase').textContent = 'Yuklab olish, Mbit/s'; gauge(d);
    fit(d, u, p.ping); hist({ t: Date.now(), p: Math.round(p.ping), d: d.toFixed(1), u: u.toFixed(1) });
  } catch (e) { $('#phase').textContent = 'Xato: internet aloqasini tekshiring'; }
  $('#go').disabled = false; $('#go').textContent = 'Qayta o\'lchash';
};
gauge(0); hist();
