let cfg = { name: '', city: 'Toshkent', eng: 'google', h24: true }, links = DEFAULT_LINKS, todos = [];
const ENG = { google: 'https://www.google.com/search?q=', yandex: 'https://yandex.uz/search/?text=', bing: 'https://www.bing.com/search?q=', ddg: 'https://duckduckgo.com/?q=' };

// --- tasodifiy manzara (kun bo'yicha bir xil) ---
function rnd(seed) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
function drawSky() {
  const cv = $('#sky'), dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const pal = h < 5 || h >= 21 ? ['#0b1026', '#1b2350', '#2c2f5c', '#141834'] : h < 7 ? ['#2b3a6b', '#f08a5d', '#f6c56b', '#3a2f4a'] :
    h < 17 ? ['#3d8bdc', '#8fc3ee', '#d6ecf8', '#2f5d3a'] : h < 19 ? ['#30406f', '#e9775b', '#f5b971', '#3b2a3a'] : ['#1c2452', '#5a4a8a', '#c76b7a', '#221b33'];
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(0.8, pal[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = rnd(+new Date().toISOString().slice(0, 10).replace(/-/g, '') % 233280);
  if (h < 6 || h >= 20) { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 160; i++) { c.globalAlpha = r(); c.fillRect(r() * W, r() * H * 0.6, 1.4, 1.4); } c.globalAlpha = 1; }
  const sunY = h >= 6 && h < 20 ? H * (0.75 - Math.sin((h - 6) / 14 * Math.PI) * 0.55) : H * 0.2;
  c.fillStyle = h >= 6 && h < 20 ? 'rgba(255,240,200,.9)' : 'rgba(240,240,255,.85)'; c.beginPath(); c.arc(W * 0.72, sunY, 34, 0, 7); c.fill();
  for (let L = 0; L < 4; L++) {
    const base = H * (0.55 + L * 0.1), amp = H * (0.16 - L * 0.03);
    const col = c.createLinearGradient(0, base - amp, 0, H);
    const k = (3 - L) / 3; col.addColorStop(0, `rgba(${L === 3 ? '20,28,24' : '40,50,70'},${0.35 + L * 0.2})`); col.addColorStop(1, pal[3]);
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    let y = base; const step = 18;
    for (let x = 0; x <= W + step; x += step) { y += (r() - 0.5) * amp * 0.35 * (1 + k); y = Math.max(base - amp, Math.min(base + amp * 0.3, y)); c.lineTo(x, y); }
    c.lineTo(W, H); c.closePath(); c.fill();
  }
}
function tick() {
  const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  $('#clock').textContent = cfg.h24 ? `${String(h).padStart(2, '0')}:${m}` : `${h % 12 || 12}:${m}`;
  $('#greet').textContent = (h < 5 ? 'Xayrli tun' : h < 11 ? 'Xayrli tong' : h < 17 ? 'Xayrli kun' : 'Xayrli kech') + (cfg.name ? ', ' + cfg.name : '');
  $('#date').textContent = `${KUNLAR[d.getDay()]}, ${d.getDate()}-${OYLAR[d.getMonth()]} ${d.getFullYear()}`;
}
async function weather() {
  const [lat, lon] = CITIES[cfg.city] || CITIES.Toshkent;
  const cache = await store.get('wx', null);
  let w = cache && cache.city === cfg.city && Date.now() - cache.t < 30 * 60e3 ? cache : null;
  if (!w) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
      const j = await r.json();
      w = { city: cfg.city, t: Date.now(), temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, wind: Math.round(j.current.wind_speed_10m), max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]) };
      store.set('wx', w);
    } catch { $('#wx').textContent = cfg.city + ': ob-havo yuklanmadi'; return; }
  }
  const [txt, ic] = WCODE[w.code] || ['', '🌡️'];
  $('#wx').innerHTML = `<span style="font-size:30px">${ic}</span><div><b>${w.temp}°</b> ${esc(txt)}<div class="small">${esc(cfg.city)} · ${w.min}°/${w.max}° · shamol ${w.wind} km/s</div></div>`;
}
function quote() {
  const d = new Date(), i = (d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate()) % MAQOL.length;
  $('#quote').innerHTML = `«${esc(MAQOL[i])}»<small>Kun maqoli</small>`;
}
function renderLinks() {
  $('#links').innerHTML = links.map((l, i) => { let h = ''; try { h = new URL(l.u).hostname; } catch {}
    return `<a href="${esc(l.u)}"><span class="ic"><img src="https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(h)}" alt=""></span>${esc(l.n)}<span class="x" data-i="${i}">✕</span></a>`; }).join('') +
    `<a href="#" id="addL"><span class="ic" style="color:#333;font-size:24px">+</span>Qo'shish</a>`;
}
function renderTodo() {
  $('#todo').innerHTML = todos.map((t, i) => `<label class="${t.d ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${t.d ? 'checked' : ''}><span>${esc(t.t)}</span><button data-del="${i}" title="O'chirish">✕</button></label>`).join('') || '<div class="small" style="opacity:.7">Vazifa yo\'q. Yuqoriga yozing.</div>';
}
$('#sf').onsubmit = e => { e.preventDefault(); const q = $('#sq').value.trim(); if (!q) return;
  location.href = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q) && !q.includes(' ') ? (q.startsWith('http') ? q : 'https://' + q) : ENG[cfg.eng] + encodeURIComponent(q); };
$('#tf').onsubmit = e => { e.preventDefault(); const v = $('#tin').value.trim(); if (!v) return; todos.push({ t: v, d: false }); $('#tin').value = ''; store.set('todos', todos); renderTodo(); };
$('#todo').onclick = e => {
  if (e.target.dataset.del) { e.preventDefault(); todos.splice(+e.target.dataset.del, 1); }
  else if (e.target.dataset.i !== undefined) todos[+e.target.dataset.i].d = e.target.checked; else return;
  store.set('todos', todos); renderTodo();
};
$('#links').onclick = e => {
  if (e.target.closest('#addL')) { e.preventDefault(); $('#ldlg').showModal(); return; }
  if (e.target.classList.contains('x')) { e.preventDefault(); links.splice(+e.target.dataset.i, 1); store.set('links', links); renderLinks(); }
};
$('#editL').onclick = () => $('#ldlg').showModal();
$('#lClose').onclick = () => $('#ldlg').close();
$('#lEdit').onclick = () => { document.body.classList.toggle('edit'); $('#ldlg').close(); };
$('#lf').onsubmit = e => { e.preventDefault(); let u = $('#lUrl').value.trim(); if (!/^https?:/.test(u)) u = 'https://' + u;
  links.push({ n: $('#lName').value.trim(), u }); store.set('links', links); renderLinks(); $('#lf').reset(); $('#ldlg').close(); };
$('#sCity').innerHTML = Object.keys(CITIES).map(c => `<option>${c}</option>`).join('');
$('#gear').onclick = () => { $('#sName').value = cfg.name; $('#sCity').value = cfg.city; $('#sEng').value = cfg.eng; $('#s24').checked = cfg.h24; $('#dlg').showModal(); };
$('#sClose').onclick = () => $('#dlg').close();
$('#sSave').onclick = async () => { cfg = { name: $('#sName').value.trim(), city: $('#sCity').value, eng: $('#sEng').value, h24: $('#s24').checked }; await store.set('cfg', cfg); $('#dlg').close(); tick(); weather(); };
(async () => {
  cfg = { ...cfg, ...(await store.get('cfg', {})) }; links = await store.get('links', DEFAULT_LINKS); todos = await store.get('todos', []);
  drawSky(); tick(); quote(); renderLinks(); renderTodo(); weather();
  setInterval(tick, 1000); addEventListener('resize', drawSky); setInterval(drawSky, 10 * 60e3);
  $('#sq').focus();
})();
