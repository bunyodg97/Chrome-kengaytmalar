tabsInit();
pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
const { PDFDocument, degrees } = PDFLib;
const state = { merge: [], compress: null, split: null, img: [] };
let pickFor = null;

// --- fayl tanlash va sudrab tashlash ---
$$('.drop').forEach(d => {
  d.onclick = () => { pickFor = d.dataset.for; $('#picker').accept = pickFor === 'img' ? 'image/png,image/jpeg' : 'application/pdf'; $('#picker').multiple = pickFor === 'merge' || pickFor === 'img'; $('#picker').click(); };
  d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
  d.ondragleave = () => d.classList.remove('over');
  d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); add(d.dataset.for, [...e.dataTransfer.files]); };
});
$('#picker').onchange = e => { add(pickFor, [...e.target.files]); e.target.value = ''; };

async function add(kind, files) {
  const okType = kind === 'img' ? f => /image\/(png|jpe?g)/.test(f.type) : f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  files = files.filter(okType); if (!files.length) return toast('Mos fayl topilmadi');
  if (kind === 'merge') { for (const f of files) state.merge.push({ f, pages: await pageCount(f) }); renderList('merge'); }
  if (kind === 'img') { state.img.push(...files.map(f => ({ f }))); renderList('img'); }
  if (kind === 'compress') { state.compress = files[0]; $('#cInfo').textContent = `${files[0].name} — ${fmtBytes(files[0].size)}, ${await pageCount(files[0])} sahifa`; $('#cGo').disabled = false; }
  if (kind === 'split') loadSplit(files[0]);
}
async function pageCount(f) { try { return (await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })).getPageCount(); } catch { return '?'; } }

function renderList(kind) {
  const arr = state[kind], box = kind === 'merge' ? $('#mList') : $('#iList');
  box.innerHTML = arr.map((x, i) => `<div class="item" draggable="true" data-i="${i}"><span class="n">${i + 1}</span><span class="grow">${esc(x.f.name)}</span><span class="muted small">${x.pages ? x.pages + ' sahifa · ' : ''}${fmtBytes(x.f.size)}</span><button class="ghost" data-rm="${i}">✕</button></div>`).join('');
  (kind === 'merge' ? $('#mGo') : $('#iGo')).disabled = kind === 'merge' ? arr.length < 2 : !arr.length;
  let from = null;
  $$('.item', box).forEach(it => {
    it.ondragstart = () => { from = +it.dataset.i; it.classList.add('dragging'); };
    it.ondragend = () => it.classList.remove('dragging');
    it.ondragover = e => e.preventDefault();
    it.ondrop = e => { e.preventDefault(); const to = +it.dataset.i; if (from === null || from === to) return; arr.splice(to, 0, arr.splice(from, 1)[0]); renderList(kind); };
  });
  box.onclick = e => { if (e.target.dataset.rm !== undefined) { arr.splice(+e.target.dataset.rm, 1); renderList(kind); } };
}
const savePdf = async (doc, name) => download(name.endsWith('.pdf') ? name : name + '.pdf', new Blob([await doc.save()], { type: 'application/pdf' }));

// --- birlashtirish ---
$('#mGo').onclick = async () => {
  $('#mGo').disabled = true; $('#mGo').textContent = 'Birlashtirilmoqda…';
  try {
    const out = await PDFDocument.create();
    for (const { f } of state.merge) { const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true }); (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p)); }
    await savePdf(out, $('#mName').value || 'birlashtirilgan.pdf'); toast('Tayyor');
  } catch (e) { toast('Xato: ' + e.message); }
  $('#mGo').disabled = false; $('#mGo').textContent = 'Birlashtirish va yuklab olish';
};

// --- siqish ---
$('#cGo').onclick = async () => {
  const f = state.compress, q = +$('#cQ').value, scale = +$('#cD').value, gray = $('#cGray').checked;
  $('#cGo').disabled = true; $('#cP').hidden = false;
  try {
    const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer(), isEvalSupported: false }).promise, out = await PDFDocument.create();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale });
      const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: cx, viewport: vp }).promise;
      if (gray) { const d = cx.getImageData(0, 0, cv.width, cv.height), a = d.data; for (let k = 0; k < a.length; k += 4) { const y = a[k] * .299 + a[k + 1] * .587 + a[k + 2] * .114; a[k] = a[k + 1] = a[k + 2] = y; } cx.putImageData(d, 0, 0); }
      const jpg = await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
      const img = await out.embedJpg(await jpg.arrayBuffer());
      out.addPage([vp1.width, vp1.height]).drawImage(img, { x: 0, y: 0, width: vp1.width, height: vp1.height });
      $('#cP').value = i / pdf.numPages;
    }
    const bytes = await out.save();
    $('#cInfo').textContent = `${f.name}: ${fmtBytes(f.size)} → ${fmtBytes(bytes.length)} (${Math.round((1 - bytes.length / f.size) * 100)}% kamaydi)`;
    if (bytes.length >= f.size) toast('Fayl allaqachon siqilgan — kattaroq bo\'lib qoldi, boshqa sifatni tanlang');
    download(f.name.replace(/\.pdf$/i, '') + '-siqilgan.pdf', new Blob([bytes], { type: 'application/pdf' }));
  } catch (e) { toast('Xato: ' + e.message); }
  $('#cGo').disabled = false; $('#cP').hidden = true; $('#cP').value = 0;
};

// --- ajratish / aylantirish ---
let sel = new Set(), rot = {};
async function loadSplit(f) {
  state.split = f; sel = new Set(); rot = {};
  const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer(), isEvalSupported: false }).promise;
  $('#sThumbs').innerHTML = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i), vp = page.getViewport({ scale: 0.3 });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    const d = document.createElement('div'); d.className = 'thumb'; d.dataset.p = i - 1; d.appendChild(cv); d.insertAdjacentHTML('beforeend', `<div>${i}-sahifa</div>`);
    $('#sThumbs').appendChild(d);
  }
  updSplit();
}
function updSplit() {
  $$('.thumb').forEach(t => { t.classList.toggle('sel', sel.has(+t.dataset.p)); t.querySelector('canvas').style.transform = `rotate(${rot[t.dataset.p] || 0}deg)`; });
  ['#sGo', '#sDel'].forEach(b => $(b).disabled = !sel.size); $('#sEach').disabled = !state.split;
}
$('#sThumbs').onclick = e => { const t = e.target.closest('.thumb'); if (!t) return; const p = +t.dataset.p; sel.has(p) ? sel.delete(p) : sel.add(p); updSplit(); };
$('#sAll').onclick = () => { $$('.thumb').forEach(t => sel.add(+t.dataset.p)); updSplit(); };
$('#sNone').onclick = () => { sel.clear(); updSplit(); };
$('#sRot').onclick = () => { sel.forEach(p => rot[p] = ((rot[p] || 0) + 90) % 360); updSplit(); };
$('#sRange').onchange = e => {
  sel.clear(); const n = $$('.thumb').length;
  e.target.value.split(',').forEach(part => { const [a, b] = part.split('-').map(x => parseInt(x)); if (!a) return; for (let i = a; i <= (b || a); i++) if (i <= n) sel.add(i - 1); });
  updSplit();
};
async function build(indices) {
  const src = await PDFDocument.load(await state.split.arrayBuffer(), { ignoreEncryption: true }), out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p, k) => { const r = rot[indices[k]]; if (r) p.setRotation(degrees((p.getRotation().angle + r) % 360)); out.addPage(p); });
  return out;
}
const base = () => state.split.name.replace(/\.pdf$/i, '');
$('#sGo').onclick = async () => savePdf(await build([...sel].sort((a, b) => a - b)), base() + '-tanlangan.pdf');
$('#sDel').onclick = async () => { const keep = $$('.thumb').map(t => +t.dataset.p).filter(p => !sel.has(p)); if (!keep.length) return toast('Hamma sahifani o\'chirib bo\'lmaydi'); savePdf(await build(keep), base() + '-tahrirlangan.pdf'); };
$('#sEach').onclick = async () => { const n = $$('.thumb').length; for (let i = 0; i < n; i++) { await savePdf(await build([i]), `${base()}-${i + 1}.pdf`); await new Promise(r => setTimeout(r, 250)); } };

// --- rasmlardan PDF ---
$('#iGo').onclick = async () => {
  const out = await PDFDocument.create(), a4 = $('#iSize').value === 'a4', m = (+$('#iMargin').value || 0) * 2.835;
  for (const { f } of state.img) {
    const buf = await f.arrayBuffer(), img = /png/.test(f.type) ? await out.embedPng(buf) : await out.embedJpg(buf);
    if (!a4) { const p = out.addPage([img.width + m * 2, img.height + m * 2]); p.drawImage(img, { x: m, y: m, width: img.width, height: img.height }); continue; }
    const land = img.width > img.height, W = land ? 841.89 : 595.28, H = land ? 595.28 : 841.89;
    const s = Math.min((W - m * 2) / img.width, (H - m * 2) / img.height), w = img.width * s, h = img.height * s;
    out.addPage([W, H]).drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
  }
  savePdf(out, $('#iName').value || 'rasmlar.pdf');
};
