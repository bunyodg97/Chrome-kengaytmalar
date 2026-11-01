const TYPES = [
  ['cache', 'Kesh (vaqtinchalik fayllar)', true], ['cacheStorage', 'Saytlar keshi (Cache Storage)', true], ['cookies', 'Cookie\'lar (saytlardan chiqib ketasiz)', false],
  ['history', 'Ko\'rilgan sahifalar tarixi', false], ['downloads', 'Yuklanmalar ro\'yxati', false], ['formData', 'Formalarga yozilgan ma\'lumotlar', false],
  ['localStorage', 'Local Storage', false], ['indexedDB', 'IndexedDB', false], ['serviceWorkers', 'Service Worker\'lar', false]
];
const ORIGIN_OK = ['cache', 'cacheStorage', 'cookies', 'localStorage', 'indexedDB', 'serviceWorkers'];
const RANGES = [[3600e3, 'Oxirgi 1 soat'], [864e5, 'Oxirgi 24 soat'], [6048e5, 'Oxirgi 7 kun'], [24192e5, 'Oxirgi 4 hafta'], [0, 'Hammasi']];
async function clean(opts, origin) {
  const data = {}; Object.entries(opts.types).forEach(([k, v]) => { if (v && (!origin || ORIGIN_OK.includes(k))) data[k] = true; });
  const o = { since: opts.range ? Date.now() - opts.range : 0 }; if (origin) o.origins = [origin];
  if (!Object.keys(data).length) return 0;
  await chrome.browsingData.remove(o, data);
  return Object.keys(data).length;
}
