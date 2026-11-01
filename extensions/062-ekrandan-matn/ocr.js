let worker = null, wLang = '';
async function getWorker(lang) {
  if (worker && wLang === lang) return worker; if (worker) await worker.terminate();
  worker = await Tesseract.createWorker(lang, 1, {
    workerPath: chrome.runtime.getURL('lib/worker.min.js'), corePath: chrome.runtime.getURL('lib/'), workerBlobURL: false,
    logger: m => { if (m.progress != null) { $('#pg').value = m.progress; $('#st').textContent = ({ 'loading tesseract core': 'Dastur yuklanmoqda', 'loading language traineddata': 'Til ma\'lumoti yuklanmoqda', 'initializing api': 'Tayyorlanmoqda', 'recognizing text': 'Matn o\'qilmoqda' }[m.status] || m.status) + ` ${Math.round(m.progress * 100)}%`; } }
  });
  wLang = lang; return worker;
}
async function prepare(src, r) {
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const cv = $('#cv'), x = cv.getContext('2d');
  if (r) { const s = img.width / r.vw; cv.width = Math.round(r.w * s); cv.height = Math.round(r.h * s); x.drawImage(img, r.x * s, r.y * s, r.w * s, r.h * s, 0, 0, cv.width, cv.height); }
  else { cv.width = img.width; cv.height = img.height; x.drawImage(img, 0, 0); }
  // kichik matnni kattalashtiramiz — aniqlik oshadi
  if (cv.width < 1000) { const k = Math.min(3, 1000 / cv.width), t = document.createElement('canvas'); t.width = cv.width * k; t.height = cv.height * k; const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(cv, 0, 0, t.width, t.height); return t; }
  return cv;
}
let input = null;
async function run() {
  if (!input) return; $('#out').value = ''; $('#conf').textContent = '';
  try {
    const w = await getWorker($('#lang').value);
    const { data } = await w.recognize(input);
    $('#out').value = data.text.trim(); $('#st').textContent = data.text.trim() ? 'Tayyor' : 'Matn topilmadi'; $('#pg').value = 1;
    $('#conf').textContent = `Ishonch: ${Math.round(data.confidence)}%`;
  } catch (e) { $('#st').textContent = 'Xato: ' + (e.message || e) + '. Internet aloqasini tekshiring (til ma\'lumoti birinchi marta yuklanadi).'; }
}
$('#re').onclick = run; $('#lang').onchange = () => { store.set('lang', $('#lang').value); run(); };
$('#cp').onclick = () => copyText($('#out').value);
$('#dl').onclick = () => download('matn.txt', $('#out').value);
$('#file').onchange = async e => { const f = e.target.files[0]; if (!f) return; input = await prepare(URL.createObjectURL(f)); run(); };
document.addEventListener('paste', async e => { const it = [...e.clipboardData.items].find(i => i.type.startsWith('image/')); if (it) { input = await prepare(URL.createObjectURL(it.getAsFile())); run(); } });
(async () => {
  $('#lang').value = await store.get('lang', 'uzb+rus+eng'); if (!$('#lang').value) $('#lang').value = 'uzb+rus+eng'; if (!$('#lang').value) $('#lang').value = 'uzb+rus+eng';
  const shot = await store.get('shot', null);
  if (shot && Date.now() - shot.t < 120000) { input = await prepare(shot.img, shot.r); chrome.storage.local.remove('shot'); run(); }
  else $('#st').textContent = 'Rasm yuklang yoki Ctrl+V bilan qo\'ying. Saytdan olish uchun: kengaytma tugmasi yoki Alt+Shift+T.';
})();
