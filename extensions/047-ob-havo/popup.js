const KUN = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
$('#city').innerHTML = Object.keys(CITIES).map(c => `<option>${c}</option>`).join('');
function render(d) {
  const c = d.w.current, [txt, ic] = WC[c.weather_code] || ['', '🌡️'], q = d.a?.current, A = q ? aqi(q.us_aqi) : null, dl = d.w.daily, h = d.w.hourly;
  const nowI = h.time.findIndex(t => new Date(t) >= new Date()); const hrs = h.time.slice(nowI, nowI + 24).map((t, i) => [t, h.temperature_2m[nowI + i], h.weather_code[nowI + i]]);
  $('#out').innerHTML = `<div class="now"><span class="ic">${ic}</span><div><div class="t">${Math.round(c.temperature_2m)}°</div><div class="small">${txt} · his qilinadi ${Math.round(c.apparent_temperature)}°</div><div class="small muted">Namlik ${c.relative_humidity_2m}% · shamol ${Math.round(c.wind_speed_10m)} km/s</div></div></div>
    ${A ? `<div class="aq" style="background:${A[2]}"><div class="row between"><span>Havo sifati (AQI)</span><b>${q.us_aqi}</b></div><b style="font-size:15px">${A[1]}</b><div class="small">${A[3]}</div><div class="small" style="opacity:.9">PM2.5: ${q.pm2_5} · PM10: ${q.pm10} µg/m³</div></div>` : ''}
    <div class="hours">${hrs.filter((_, i) => i % 2 === 0).map(([t, v, w]) => `<div>${new Date(t).getHours()}:00<br>${(WC[w] || ['', ''])[1]}<br><b>${Math.round(v)}°</b></div>`).join('')}</div>
    <div class="days">${dl.time.map((t, i) => `<div>${i ? KUN[new Date(t).getDay()] : 'Bugun'}<br>${(WC[dl.weather_code[i]] || ['', ''])[1]}<b>${Math.round(dl.temperature_2m_max[i])}°</b><span class="muted">${Math.round(dl.temperature_2m_min[i])}°</span>${dl.precipitation_probability_max[i] > 30 ? `<br>💧${dl.precipitation_probability_max[i]}%` : ''}</div>`).join('')}</div>
    <div class="small muted">Quyosh: ${dl.sunrise[0].slice(11)} – ${dl.sunset[0].slice(11)} · ${new Date(d.t).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} da yangilandi</div>
    <label class="inline small"><input type="checkbox" id="al"> Havo ifloslanganda ogohlantirish</label>`;
  store.get('alertOn', true).then(v => $('#al').checked = v); $('#al').onchange = e => store.set('alertOn', e.target.checked);
}
(async () => {
  $('#city').value = await store.get('city', 'Toshkent');
  const d = await store.get('data', null); if (d && d.city === $('#city').value) render(d);
  if (!d || Date.now() - d.t > 15 * 60e3 || d.city !== $('#city').value) { await chrome.runtime.sendMessage({ cmd: 'refresh' }); const n = await store.get('data', null); if (n) render(n); else $('#out').innerHTML = '<div class="empty">Ma\'lumot olinmadi. Internetni tekshiring.</div>'; }
})();
$('#city').onchange = async e => { await store.set('city', e.target.value); $('#out').innerHTML = '<div class="empty">Yuklanmoqda…</div>'; await chrome.runtime.sendMessage({ cmd: 'refresh' }); render(await store.get('data')); };
