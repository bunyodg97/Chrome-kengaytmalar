// toifa: {nom: [ko'paytuvchi asosiy birlikka, nomlari/regex]}
const UNITS = {
  "Uzunlik": { base: 'm', u: { mm: [.001, 'mm', 'millimetr'], sm: [.01, 'cm|sm|см', 'santimetr'], m: [1, 'm|metr|meters?|м', 'metr'], km: [1000, 'km|км|kilometers?', 'kilometr'], inch: [.0254, 'in|inch(?:es)?|"|″|дюйм', 'dyuym'], ft: [.3048, 'ft|feet|foot|′|фут', 'fut'], yd: [.9144, 'yd|yards?', 'yard'], mi: [1609.344, 'mi|miles?|миля', 'mil'] } },
  "Og'irlik": { base: 'kg', u: { g: [.001, 'g|gr|grams?|г', 'gramm'], kg: [1, 'kg|кг|kilograms?', 'kilogramm'], t: [1000, 't|tonna|tons?', 'tonna'], oz: [.0283495, 'oz|ounces?|унц', 'unsiya'], lb: [.453592, 'lbs?|pounds?|фунт', 'funt'], st: [6.35029, 'st|stone', 'stoun'] } },
  "Hajm": { base: 'l', u: { ml: [.001, 'ml|мл', 'millilitr'], l: [1, 'l|L|litr|liters?|л', 'litr'], m3: [1000, 'm3|m³', 'kub metr'], floz: [.0295735, 'fl\\.? ?oz', 'suyuq unsiya'], cup: [.236588, 'cups?', 'stakan (US)'], pt: [.473176, 'pt|pints?', 'pint'], gal: [3.78541, 'gal|gallons?|галлон', 'gallon (US)'] } },
  "Harorat": { base: 'C', u: { C: [null, '°?C|°С|℃|celsius', 'Selsiy'], F: [null, '°?F|℉|fahrenheit', 'Farengeyt'], K: [null, 'K|kelvin', 'Kelvin'] } },
  "Tezlik": { base: 'kmh', u: { kmh: [1, 'km/h|kmh|kph|km/soat|км/ч', 'km/soat'], ms: [3.6, 'm/s', 'm/s'], mph: [1.609344, 'mph', 'mil/soat'], kn: [1.852, 'kn|knots?|uzel', 'uzel'] } },
  "Maydon": { base: 'm2', u: { m2: [1, 'm2|m²|кв\\.? ?м', 'kv. metr'], sotix: [100, 'sotix|сотка|соток', 'sotix'], ga: [10000, 'ga|ha|hectares?|га', 'gektar'], ft2: [.092903, 'ft2|ft²|sq\\.? ?ft', 'kv. fut'], acre: [4046.86, 'acres?', 'akr'], km2: [1e6, 'km2|km²', 'kv. km'] } },
  "Ma'lumot": { base: 'MB', u: { KB: [1 / 1024, 'KB|kb|КБ', 'KB'], MB: [1, 'MB|mb|МБ', 'MB'], GB: [1024, 'GB|gb|ГБ', 'GB'], TB: [1048576, 'TB|tb|ТБ', 'TB'] } },
  "Yoqilg'i": { base: 'l100', u: { l100: [null, 'l/100\\s?km|л/100', 'l/100km'], mpg: [null, 'mpg', 'mpg (US)'], kml: [null, 'km/l', 'km/l'] } }
};
function convert(cat, from, to, v) {
  if (cat === 'Harorat') { const c = from === 'C' ? v : from === 'F' ? (v - 32) * 5 / 9 : v - 273.15; return to === 'C' ? c : to === 'F' ? c * 9 / 5 + 32 : c + 273.15; }
  if (cat === "Yoqilg'i") { const l = from === 'l100' ? v : from === 'mpg' ? 235.215 / v : 100 / v; return to === 'l100' ? l : to === 'mpg' ? 235.215 / l : 100 / l; }
  const U = UNITS[cat].u; return v * U[from][0] / U[to][0];
}
// matndan "5.5 inch", "6'2\"", "72°F" topish
const METRIC_TARGET = { inch: 'sm', ft: 'm', yd: 'm', mi: 'km', oz: 'g', lb: 'kg', st: 'kg', floz: 'ml', cup: 'ml', pt: 'l', gal: 'l', F: 'C', mph: 'kmh', kn: 'kmh', ft2: 'm2', acre: 'sotix', mpg: 'l100', C: 'F', sm: 'inch', kg: 'lb', km: 'mi', l: 'gal', m: 'ft', kmh: 'mph', g: 'oz', ml: 'floz', mm: 'inch', K: 'C', ms: 'kmh', m2: 'ft2', ga: 'acre' };
function parseUnits(text) {
  const out = []; text = text.trim().slice(0, 200);
  const fi = text.match(/(\d+)\s*(?:'|′|ft)\s*(\d+(?:\.\d+)?)\s*(?:"|″|in)?/); // 6'2"
  if (fi) { const cm = (+fi[1] * 12 + +fi[2]) * 2.54; out.push({ src: fi[0], res: `${fmt(cm)} sm` }); }
  for (const [cat, { u }] of Object.entries(UNITS)) for (const [k, [, re]] of Object.entries(u)) {
    const r = new RegExp(`(-?\\d[\\d\\s,]*(?:[.,]\\d+)?)\\s?(?:${re})(?![\\p{L}\\d])`, 'iu'); const m = text.match(r);
    if (!m || !METRIC_TARGET[k]) continue; if (k === 'm' && /\d\s?m(?:in|s|b)/i.test(text)) continue;
    const v = parseFloat(m[1].replace(/\s/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.')); if (isNaN(v)) continue;
    const to = METRIC_TARGET[k], res = convert(cat, k, to, v);
    if (fi && fi[0].includes(m[0].trim())) continue;
    if (!out.some(o => o.src === m[0])) out.push({ src: m[0].trim(), res: `${fmt(res)} ${UNITS[cat].u[to][2]}` });
  }
  return out.slice(0, 4);
}
function fmt(n) { const a = Math.abs(n); return (a >= 100 ? Math.round(n * 10) / 10 : a >= 1 ? Math.round(n * 100) / 100 : +n.toPrecision(3)).toLocaleString('ru-RU').replace(/ /g, ' '); }
