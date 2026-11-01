const CITIES = { "Toshkent": [41.31, 69.28], "Samarqand": [39.65, 66.96], "Buxoro": [39.77, 64.42], "Andijon": [40.78, 72.34], "Namangan": [41.0, 71.67], "Farg'ona": [40.39, 71.78],
  "Qo'qon": [40.53, 70.94], "Nukus": [42.46, 59.6], "Urganch": [41.55, 60.63], "Xiva": [41.38, 60.36], "Qarshi": [38.86, 65.79], "Termiz": [37.22, 67.28], "Jizzax": [40.12, 67.84],
  "Guliston": [40.49, 68.78], "Navoiy": [40.1, 65.38], "Nurafshon": [41.04, 69.36], "Chirchiq": [41.47, 69.58], "Olmaliq": [40.85, 69.6], "Angren": [41.02, 70.14], "Marg'ilon": [40.47, 71.72] };
const WC = { 0: ['Ochiq', '☀️'], 1: ['Asosan ochiq', '🌤️'], 2: ['Qisman bulutli', '⛅'], 3: ['Bulutli', '☁️'], 45: ['Tuman', '🌫️'], 48: ['Tuman', '🌫️'], 51: ['Mayda yomg\'ir', '🌦️'], 53: ['Mayda yomg\'ir', '🌦️'], 55: ['Yomg\'ir', '🌧️'],
  61: ['Yomg\'ir', '🌧️'], 63: ['Yomg\'ir', '🌧️'], 65: ['Kuchli yomg\'ir', '🌧️'], 71: ['Qor', '🌨️'], 73: ['Qor', '🌨️'], 75: ['Kuchli qor', '❄️'], 80: ['Jala', '🌦️'], 81: ['Jala', '🌧️'], 82: ['Kuchli jala', '⛈️'], 95: ['Momaqaldiroq', '⛈️'], 96: ['Do\'l', '⛈️'], 99: ['Do\'l', '⛈️'] };
const AQ = [[50, 'Yaxshi', '#2e7d32', 'Havo toza.'], [100, 'O\'rtacha', '#f9a825', 'Sezgir odamlar uzoq vaqt tashqarida bo\'lmasin.'], [150, 'Sezgirlar uchun zararli', '#ef6c00', 'Bolalar va keksalar tashqarida kamroq bo\'lsin.'],
  [200, 'Zararli', '#d32f2f', 'Tashqarida jismoniy mashq qilmang, niqob taqing.'], [300, 'Juda zararli', '#7b1fa2', 'Iloji boricha uyda qoling, derazalarni yoping.'], [9999, 'Xavfli', '#4a0e0e', 'Tashqariga chiqmang.']];
const aqi = v => AQ.find(a => v <= a[0]);
async function fetchAll(city) {
  const [lat, lon] = CITIES[city] || CITIES.Toshkent;
  const [w, a] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=7`).then(r => r.json()),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto`).then(r => r.json()).catch(() => null)
  ]);
  return { city, t: Date.now(), w, a };
}
