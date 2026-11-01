importScripts('ru.js', 'about-bg.js');
importScripts('data.js');
async function refresh() {
  const { city = 'Toshkent', alertOn = true, lastAqi = 0 } = await chrome.storage.local.get(['city', 'alertOn', 'lastAqi']);
  try {
    const d = await fetchAll(city); await chrome.storage.local.set({ data: d });
    const tC = Math.round(d.w.current.temperature_2m), q = d.a?.current?.us_aqi;
    chrome.action.setBadgeText({ text: tC + '°' }); chrome.action.setBadgeBackgroundColor({ color: q ? aqi(q)[2] : '#0288d1' });
    chrome.action.setTitle({ title: `${city}: ${tC}°, ${(WC[d.w.current.weather_code] || [''])[0]}${q ? `, havo sifati ${q} (${aqi(q)[1]})` : ''}` });
    if (alertOn && q > 150 && lastAqi <= 150) chrome.notifications.create({ type: 'basic', iconUrl: 'icons/128.png', title: `${city}: havo ifloslangan (AQI ${q})`, message: aqi(q)[3] });
    await chrome.storage.local.set({ lastAqi: q || 0 });
  } catch { }
}
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('w', { periodInMinutes: 30 }); refresh(); });
chrome.runtime.onStartup.addListener(refresh); chrome.alarms.onAlarm.addListener(refresh);
chrome.runtime.onMessage.addListener((m, s, r) => { if (m.cmd === 'refresh') { refresh().then(() => r(1)); return true; } });
