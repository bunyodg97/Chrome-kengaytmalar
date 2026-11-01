import * as pdfjsLib from './lib/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdf.worker.min.mjs';

const $ = id => document.getElementById(id);
const PX = 96 / 72;                 // 1 pt = 1.333 px (100%)
let zoom = 1, pdf = null, bytes = null, fileName = 'hujjat.pdf';
let pages = [];                     // [{w, h, rot, el, layer}]  w,h — ko'rinadigan o'lcham (pt)
let items = [];                     // [{id, page, type:'img'|'text', x,y,w,h (pt), src?, text?, size?, color?}]
let selected = null, armed = null;  // armed: {type, src?}
let sigs = [];
const uid = () => Math.random().toString(36).slice(2, 9);
const scale = () => zoom * PX;

// ---------- PDF ochish ----------
async function openBytes(buf, name) {
  bytes = new Uint8Array(buf);
  fileName = name || 'hujjat.pdf';
  try {
    pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  } catch (e) {
    alert(e.name === 'PasswordException' ? 'Bu PDF parol bilan himoyalangan.' : 'PDF faylni o\'qib bo\'lmadi.');
    return;
  }
  items = []; selected = null;
  $('drop').hidden = true;
  $('fname').textContent = fileName;
  $('save').disabled = false;
  document.title = `✍️ ${fileName} — PDF Imzo`;
  await renderPages();
}
async function openFile(f) {
  if (!f) return;
  if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { alert('Faqat PDF fayl tanlang'); return; }
  openBytes(await f.arrayBuffer(), f.name);
}
$('file').onchange = e => openFile(e.target.files[0]);
$('file2').onchange = e => openFile(e.target.files[0]);
const drop = $('viewer');
drop.addEventListener('dragover', e => { e.preventDefault(); $('drop').classList.add('over'); });
drop.addEventListener('dragleave', () => $('drop').classList.remove('over'));
drop.addEventListener('drop', e => { e.preventDefault(); $('drop').classList.remove('over'); openFile(e.dataTransfer.files[0]); });

// Havoladan ochish (?src=...)
const src = new URLSearchParams(location.search).get('src');
if (src) {
  fetch(src).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(b => openBytes(b, decodeURIComponent(src.split('/').pop().split('?')[0]) || 'hujjat.pdf'))
    .catch(() => hint('PDF ni avtomatik ochib bo\'lmadi. Faylni yuklab oling va "📂 PDF ochish" orqali tanlang.', 6000));
}

// ---------- Sahifalarni chizish ----------
async function renderPages() {
  const box = $('pages');
  box.innerHTML = '';
  pages = [];
  const dpr = window.devicePixelRatio || 1;
  for (let i = 1; i <= pdf.numPages; i++) {
    const p = await pdf.getPage(i);
    const vp1 = p.getViewport({ scale: 1 });
    const vp = p.getViewport({ scale: scale() });
    const el = document.createElement('div');
    el.className = 'page';
    el.style.width = vp.width + 'px'; el.style.height = vp.height + 'px';
    const c = document.createElement('canvas');
    c.width = Math.floor(vp.width * dpr); c.height = Math.floor(vp.height * dpr);
    c.style.width = vp.width + 'px'; c.style.height = vp.height + 'px';
    const layer = document.createElement('div'); layer.className = 'layer';
    const num = document.createElement('div'); num.className = 'num'; num.textContent = `${i} / ${pdf.numPages}`;
    el.append(c, layer, num);
    box.append(el);
    pages.push({ w: vp1.width, h: vp1.height, rot: p.rotate % 360, el, layer });
    layer.addEventListener('pointerdown', e => onPagePointer(e, i - 1));
    await p.render({ canvasContext: c.getContext('2d'), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
  }
  items.forEach(renderItem);
  setArmed(armed);
}

// ---------- Elementlar ----------
function renderItem(it) {
  const pg = pages[it.page]; if (!pg) return;
  let el = pg.layer.querySelector(`[data-id="${it.id}"]`);
  const s = scale();
  if (!el) {
    el = document.createElement('div');
    el.className = 'it'; el.dataset.id = it.id;
    if (it.type === 'img') el.innerHTML = `<img alt="">`;
    else el.innerHTML = `<div class="txt" contenteditable="plaintext-only" spellcheck="false"></div>`;
    el.insertAdjacentHTML('beforeend', '<span class="rs"></span><button class="x" title="O\'chirish">✕</button>');
    pg.layer.append(el);
    bindItem(el, it);
    if (it.type === 'img') el.querySelector('img').src = it.src;
    else el.querySelector('.txt').textContent = it.text;
  }
  el.style.left = it.x * s + 'px'; el.style.top = it.y * s + 'px';
  if (it.type === 'img') { el.style.width = it.w * s + 'px'; el.style.height = it.h * s + 'px'; }
  else {
    const t = el.querySelector('.txt');
    t.style.fontSize = it.size * s + 'px'; t.style.color = it.color;
    t.style.fontFamily = '"Segoe UI", Arial, sans-serif';
    it.w = t.offsetWidth / s; it.h = t.offsetHeight / s;
  }
  el.classList.toggle('sel', selected === it.id);
}

function bindItem(el, it) {
  el.querySelector('.x').addEventListener('pointerdown', e => { e.stopPropagation(); removeItem(it.id); });
  if (it.type === 'text') {
    const t = el.querySelector('.txt');
    t.addEventListener('input', () => { it.text = t.innerText; it.w = t.offsetWidth / scale(); it.h = t.offsetHeight / scale(); });
    t.addEventListener('keydown', e => e.stopPropagation());
  }
  el.addEventListener('pointerdown', e => {
    if (e.target.classList.contains('txt') && selected === it.id) return;   // matnni tahrirlash
    e.stopPropagation(); e.preventDefault();
    select(it.id);
    const resize = e.target.classList.contains('rs');
    const s = scale(), sx = e.clientX, sy = e.clientY, o = { ...it };
    const move = ev => {
      const dx = (ev.clientX - sx) / s, dy = (ev.clientY - sy) / s;
      const pg = pages[it.page];
      if (resize) {
        if (it.type === 'img') { const k = Math.max(0.15, (o.w + dx) / o.w); it.w = o.w * k; it.h = o.h * k; }
        else { it.size = Math.max(5, Math.min(72, o.size * (1 + dx / Math.max(20, o.w)))); }
      } else {
        it.x = Math.min(Math.max(0, o.x + dx), pg.w - it.w);
        it.y = Math.min(Math.max(0, o.y + dy), pg.h - it.h);
      }
      renderItem(it); renderProps();
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
  el.addEventListener('dblclick', () => { if (it.type === 'text') { const t = el.querySelector('.txt'); t.focus(); document.getSelection().selectAllChildren(t); } });
}

function select(id) {
  selected = id;
  document.querySelectorAll('.it').forEach(e => e.classList.toggle('sel', e.dataset.id === id));
  renderProps();
}
function removeItem(id) {
  items = items.filter(x => x.id !== id);
  document.querySelector(`.it[data-id="${id}"]`)?.remove();
  if (selected === id) select(null);
}
document.addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !document.activeElement?.isContentEditable) removeItem(selected);
  if (e.key === 'Escape') { setArmed(null); select(null); }
});

function renderProps() {
  const it = items.find(x => x.id === selected);
  const box = $('props');
  if (!it) { box.className = 'props muted'; box.textContent = 'Element ustiga bosing'; return; }
  box.className = 'props';
  if (it.type === 'text') {
    box.innerHTML = `<label>Hajm <input type="range" id="pSize" min="6" max="48" value="${Math.round(it.size)}"></label>
      <label>Rang <input type="color" id="pColor" value="${it.color}"></label>
      <div class="muted" style="font-size:12px">Matnni o'zgartirish: ikki marta bosing</div><button class="btn" id="pDel">🗑 O'chirish</button>`;
    $('pSize').oninput = e => { it.size = +e.target.value; renderItem(it); };
    $('pColor').oninput = e => { it.color = e.target.value; renderItem(it); };
  } else {
    box.innerHTML = `<div class="muted" style="font-size:12px">Hajmini o'zgartirish: pastki o'ng burchakdagi nuqtani torting</div><button class="btn" id="pDel">🗑 O'chirish</button>`;
  }
  $('pDel').onclick = () => removeItem(it.id);
}

// ---------- Asboblar ----------
function hint(t, ms) { $('hint').textContent = t; $('hint').classList.toggle('show', !!t); if (ms) setTimeout(() => $('hint').classList.remove('show'), ms); }
function setArmed(a) {
  armed = a;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', !!a && b.dataset.tool === a.tool));
  pages.forEach(p => p.el.classList.toggle('arm', !!a));
  hint(a ? (pdf ? 'Sahifada kerakli joyni bosing (Esc — bekor qilish)' : 'Avval PDF faylni oching') : '');
}
document.querySelectorAll('.tool').forEach(b => b.onclick = () => {
  const t = b.dataset.tool;
  if (armed?.tool === t) return setArmed(null);
  if (t === 'sign') { if (!sigs.length) return openPad(); return setArmed({ tool: 'sign', src: sigs[0] }); }
  if (t === 'check') return setArmed({ tool: 'check', src: checkPng() });
  const d = new Date(), p = n => String(n).padStart(2, '0');
  setArmed({ tool: t, text: t === 'date' ? `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}` : 'Matn' });
});

function onPagePointer(e, pageIdx) {
  if (!armed) { select(null); return; }
  const r = pages[pageIdx].layer.getBoundingClientRect(), s = scale();
  const px = (e.clientX - r.left) / s, py = (e.clientY - r.top) / s;
  let it;
  if (armed.src) {
    const img = new Image();
    img.onload = () => {
      const w = armed.tool === 'check' ? 18 : 150, h = w * img.naturalHeight / img.naturalWidth;
      it = { id: uid(), page: pageIdx, type: 'img', src: armed.src, x: px - w / 2, y: py - h / 2, w, h };
      items.push(it); renderItem(it); select(it.id); setArmed(null);
    };
    img.src = armed.src;
  } else {
    it = { id: uid(), page: pageIdx, type: 'text', text: armed.text, size: 12, color: '#111111', x: px, y: py - 8, w: 40, h: 14 };
    items.push(it); renderItem(it); select(it.id); setArmed(null);
    if (armed === null && it.text === 'Matn') setTimeout(() => { const t = document.querySelector(`[data-id="${it.id}"] .txt`); t.focus(); document.getSelection().selectAllChildren(t); }, 30);
  }
}

function checkPng() {
  const c = document.createElement('canvas'); c.width = c.height = 120;
  const g = c.getContext('2d');
  g.strokeStyle = '#1a3fb5'; g.lineWidth = 16; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); g.moveTo(18, 64); g.lineTo(48, 96); g.lineTo(104, 22); g.stroke();
  return c.toDataURL('image/png');
}

// ---------- Kattalashtirish ----------
const setZoom = z => { zoom = Math.min(2.5, Math.max(0.5, z)); $('zoomTxt').textContent = Math.round(zoom * 100) + '%'; if (pdf) renderPages(); };
$('zoomIn').onclick = () => setZoom(zoom + 0.15);
$('zoomOut').onclick = () => setZoom(zoom - 0.15);

// ---------- Imzolar ----------
async function loadSigs() { sigs = (await chrome.storage.local.get('sigs')).sigs || []; renderSigs(); }
function renderSigs() {
  $('sigs').innerHTML = sigs.length ? '' : '<div class="muted" style="font-size:12.5px;margin-bottom:6px">Hali imzo yo\'q</div>';
  sigs.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'sig'; d.title = 'Bosib, keyin sahifaga qo\'ying';
    d.innerHTML = `<img alt=""><button class="del" title="O'chirish">✕</button>`;
    d.querySelector('img').src = s;
    d.onclick = () => setArmed({ tool: 'sign', src: s });
    d.querySelector('.del').onclick = async e => { e.stopPropagation(); if (!confirm('Imzo o\'chirilsinmi?')) return; sigs.splice(i, 1); await chrome.storage.local.set({ sigs }); renderSigs(); };
    $('sigs').append(d);
  });
}
$('newSig').onclick = () => openPad();

// Chizish maydoni
const pad = $('pad'), pg = pad.getContext('2d');
let penColor = '#1a3fb5', drawing = false, last = null, dirty = false;
function openPad() { pg.clearRect(0, 0, pad.width, pad.height); dirty = false; $('modal').hidden = false; }
$('mClose').onclick = () => { $('modal').hidden = true; };
$('padClear').onclick = () => { pg.clearRect(0, 0, pad.width, pad.height); dirty = false; };
document.querySelectorAll('.clr').forEach(b => b.onclick = () => { penColor = b.dataset.c; document.querySelectorAll('.clr').forEach(x => x.classList.toggle('on', x === b)); });
const pt = e => { const r = pad.getBoundingClientRect(); return { x: (e.clientX - r.left) * pad.width / r.width, y: (e.clientY - r.top) * pad.height / r.height, p: e.pressure || 0.5 }; };
pad.addEventListener('pointerdown', e => { drawing = true; last = pt(e); pad.setPointerCapture(e.pointerId); });
pad.addEventListener('pointermove', e => {
  if (!drawing) return;
  const p = pt(e);
  pg.strokeStyle = penColor; pg.lineCap = pg.lineJoin = 'round';
  pg.lineWidth = +$('thick').value * (e.pointerType === 'pen' ? 0.6 + p.p : 1) * 1.6;
  pg.beginPath(); pg.moveTo(last.x, last.y); pg.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2); pg.lineTo(p.x, p.y); pg.stroke();
  last = p; dirty = true;
});
pad.addEventListener('pointerup', () => { drawing = false; });

// Rasmdan imzo: oq fonni olib tashlaymiz
$('sigImg').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(); img.src = URL.createObjectURL(f); await img.decode();
  const k = Math.min(pad.width / img.width, pad.height / img.height);
  const w = img.width * k, h = img.height * k;
  pg.clearRect(0, 0, pad.width, pad.height);
  pg.drawImage(img, (pad.width - w) / 2, (pad.height - h) / 2, w, h);
  const d = pg.getImageData(0, 0, pad.width, pad.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const lum = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2];
    a[i + 3] = lum > 200 ? 0 : Math.min(255, (255 - lum) * 1.8) * (a[i + 3] / 255);
  }
  pg.putImageData(d, 0, 0); dirty = true; e.target.value = '';
};

// Bo'sh chetlarni kesib olish
function trimmed(canvas) {
  const g = canvas.getContext('2d'), { width: W, height: H } = canvas, a = g.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (a[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return null;
  const pad8 = 8; x0 = Math.max(0, x0 - pad8); y0 = Math.max(0, y0 - pad8); x1 = Math.min(W - 1, x1 + pad8); y1 = Math.min(H - 1, y1 + pad8);
  const c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
  c.getContext('2d').drawImage(canvas, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
$('padSave').onclick = async () => {
  if (!dirty) { alert('Avval imzo chizing'); return; }
  const url = trimmed(pad); if (!url) return;
  sigs.unshift(url); sigs = sigs.slice(0, 6);
  await chrome.storage.local.set({ sigs });
  renderSigs(); $('modal').hidden = true;
  setArmed({ tool: 'sign', src: url });
};

// ---------- Saqlash ----------
function textPng(it) {
  const k = 4, c = document.createElement('canvas'), g = c.getContext('2d');
  const font = `${it.size * k}px "Segoe UI", Arial, sans-serif`;
  g.font = font;
  const lines = it.text.split('\n'), lh = it.size * k * 1.15;
  c.width = Math.ceil(Math.max(...lines.map(l => g.measureText(l).width), 4)) + 4;
  c.height = Math.ceil(lh * lines.length);
  g.font = font; g.fillStyle = it.color; g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, 2, i * lh + it.size * k * 0.05));
  return { url: c.toDataURL('image/png'), w: c.width / k, h: c.height / k };
}

$('save').onclick = async () => {
  if (!bytes) return;
  $('save').disabled = true; $('save').textContent = 'Saqlanmoqda…';
  try {
    const { PDFDocument, degrees } = window.PDFLib;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    for (const it of items) {
      if (it.type === 'text' && !it.text.trim()) continue;
      const page = doc.getPage(it.page);
      const cb = page.getCropBox();
      const rot = ((page.getRotation().angle % 360) + 360) % 360;
      let url = it.src, w = it.w, h = it.h;
      if (it.type === 'text') { const t = textPng(it); url = t.url; w = t.w; h = t.h; }
      const png = await doc.embedPng(url);
      // Ko'rinadigan (u, v) nuqtani PDF koordinatasiga o'tkazish (sahifa burilgan bo'lsa ham)
      const W = cb.width, H = cb.height;
      const map = (u, v) => rot === 90 ? [v, u] : rot === 180 ? [W - u, v] : rot === 270 ? [W - v, H - u] : [u, H - v];
      const [ax, ay] = map(it.x, it.y + h);
      page.drawImage(png, { x: cb.x + ax, y: cb.y + ay, width: w, height: h, rotate: degrees(rot) });
    }
    const out = await doc.save();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }));
    a.download = fileName.replace(/\.pdf$/i, '') + '_imzolangan.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    hint('✓ Imzolangan PDF Yuklamalar papkasiga saqlandi', 4000);
  } catch (e) {
    alert('Saqlashda xato: ' + e.message);
  }
  $('save').disabled = false; $('save').textContent = '⬇ Imzolangan PDF ni saqlash';
};

loadSigs();
