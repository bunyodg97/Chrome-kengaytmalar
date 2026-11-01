import { FORMATS, getSettings, baseName, filePath, fmtBytes } from './common.js';
import { loadImage, render, naturalSize } from './convert.js';

const $ = id => document.getElementById(id);
const S = await getSettings();
const key = `edit:${location.hash.slice(1)}`;
const job = (await chrome.storage.session.get(key))[key];

const st = { fmt: 'jpg', quality: S.quality, bg: S.bg, w: 0, h: 0, rotate: 0, flipH: false, flipV: false, lock: true };
let img, nat, orig, outBlob, outUrl;

function toast(m) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = m;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
}

async function init() {
  if (!job) throw new Error('Rasm topilmadi. Rasm ustida o\'ng tugma → "Tahrirlab saqlash" ni qayta bosing.');
  orig = await chrome.runtime.sendMessage({ type: 'fetch', src: job.src, tabId: job.tabId });
  if (!orig || orig.error) throw new Error(orig?.error || "Rasmni yuklab bo'lmadi");
  img = await loadImage(orig.dataUrl);
  nat = naturalSize(img);
  st.w = nat.w; st.h = nat.h;
  // Asl format WebP/PNG bo'lsa — standart JPG, aks holda PNG
  const ext = Object.keys(FORMATS).find(k => FORMATS[k].mime === orig.type);
  st.fmt = ext === 'jpg' ? 'png' : 'jpg';
  const typeName = (orig.type || '').replace('image/', '').replace('svg+xml', 'SVG').toUpperCase() || '?';
  $('origTxt').textContent = `${nat.w}×${nat.h} · ${typeName} · ${fmtBytes(orig.size)}`;
  $('fname').value = baseName(job.src);
  document.title = `Tahrirlash — ${$('fname').value}`;
  sync();
  update();
}

function sync() {
  document.querySelectorAll('#fmt button').forEach(b => b.classList.toggle('on', b.dataset.f === st.fmt));
  const f = FORMATS[st.fmt];
  $('qSec').classList.toggle('hidden', !f.lossy);
  $('bgRow').classList.toggle('hidden', st.fmt !== 'jpg');
  $('q').value = Math.round(st.quality * 100);
  $('qTxt').textContent = `${Math.round(st.quality * 100)}%`;
  $('bg').value = st.bg;
  $('w').value = st.w; $('h').value = st.h;
  $('lock').classList.toggle('on', st.lock);
  $('flipH').classList.toggle('on', st.flipH);
  $('flipV').classList.toggle('on', st.flipV);
  $('ext').textContent = '.' + f.ext;
}

let timer, seq = 0;
function update() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const my = ++seq;
    const blob = await render(img, st);
    if (my !== seq) return;
    outBlob = blob;
    if (outUrl) URL.revokeObjectURL(outUrl);
    outUrl = URL.createObjectURL(blob);
    $('preview').src = outUrl;
    const side = st.rotate % 180 !== 0;
    const ow = side ? st.h : st.w, oh = side ? st.w : st.h;
    $('resTxt').textContent = `${ow}×${oh} · ${fmtBytes(blob.size)}`;
    const pct = Math.round((blob.size / orig.size - 1) * 100);
    $('gain').textContent = pct === 0 ? '' : `${pct > 0 ? '+' : ''}${pct}%`;
    $('gain').className = `gain ${pct < 0 ? 'down' : 'up'}`;
    $('info').textContent = `Natija: ${ow}×${oh} piksel, ${FORMATS[st.fmt].name}`;
  }, 120);
}

// ---------- Boshqaruv ----------
$('fmt').addEventListener('click', e => { if (e.target.dataset.f) { st.fmt = e.target.dataset.f; sync(); update(); } });
$('q').addEventListener('input', () => { st.quality = +$('q').value / 100; $('qTxt').textContent = `${$('q').value}%`; update(); });
$('bg').addEventListener('input', () => { st.bg = $('bg').value; update(); });

const ratio = () => nat.w / nat.h;
$('w').addEventListener('input', () => {
  const v = Math.max(1, parseInt($('w').value, 10) || 1);
  st.w = v; if (st.lock) { st.h = Math.max(1, Math.round(v / ratio())); $('h').value = st.h; }
  update();
});
$('h').addEventListener('input', () => {
  const v = Math.max(1, parseInt($('h').value, 10) || 1);
  st.h = v; if (st.lock) { st.w = Math.max(1, Math.round(v * ratio())); $('w').value = st.w; }
  update();
});
$('lock').addEventListener('click', () => { st.lock = !st.lock; sync(); });
$('chips').addEventListener('click', e => {
  const b = e.target;
  if (b.dataset.p) { st.w = Math.round(nat.w * +b.dataset.p); st.h = Math.round(nat.h * +b.dataset.p); }
  else if (b.dataset.max) {
    const m = +b.dataset.max, k = Math.min(1, m / Math.max(nat.w, nat.h));
    st.w = Math.round(nat.w * k); st.h = Math.round(nat.h * k);
  } else return;
  st.lock = true; sync(); update();
});
$('rotL').addEventListener('click', () => { st.rotate = (st.rotate + 270) % 360; update(); });
$('rotR').addEventListener('click', () => { st.rotate = (st.rotate + 90) % 360; update(); });
$('flipH').addEventListener('click', () => { st.flipH = !st.flipH; sync(); update(); });
$('flipV').addEventListener('click', () => { st.flipV = !st.flipV; sync(); update(); });

$('save').addEventListener('click', async () => {
  if (!outBlob) return;
  const name = ($('fname').value.trim() || baseName(job.src)).replace(/[\\/:*?"<>|]+/g, '_');
  await chrome.downloads.download({
    url: outUrl, filename: filePath(S, `${name}.${FORMATS[st.fmt].ext}`), saveAs: S.saveAs, conflictAction: 'uniquify'
  });
  toast('Saqlandi ✓');
});

$('copy').addEventListener('click', async () => {
  try {
    const png = st.fmt === 'png' ? outBlob : await render(img, { ...st, fmt: 'png' });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    toast('Nusxa olindi — Telegram yoki Word ga Ctrl+V bilan qo\'ying');
  } catch { toast("Nusxa olib bo'lmadi"); }
});

init().catch(e => {
  document.querySelector('.stage').innerHTML = `<div class="err">⚠️ ${e.message}</div>`;
  document.querySelector('aside').classList.add('hidden');
  document.body.style.gridTemplateColumns = '1fr';
});
