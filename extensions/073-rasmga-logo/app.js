let images = [], sel = 0, logoImg = null, logoW = null, cfg;
const DEF = { mode: 'logo', pos: 8, sz: 18, op: 70, mg: 3, tile: false, rot: 0, txt: '© Do\'konim.uz', col: '#ffffff', shadow: true, white: false, fmt: 'same', maxw: '', suf: '-logo' };
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const fileUrl = f => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
['','','','','','','','',''].forEach((_, i) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = '·'; b.dataset.p = i; $('#pos').append(b); });
function ui() {
  $$('#pos button').forEach(b => b.classList.toggle('on', +b.dataset.p === cfg.pos)); $$('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === cfg.mode));
  $('#mLogo').hidden = cfg.mode !== 'logo'; $('#mText').hidden = cfg.mode !== 'text';
  for (const k of ['sz', 'op', 'mg', 'rot', 'txt', 'col', 'fmt', 'maxw', 'suf']) $('#' + k).value = cfg[k]; for (const k of ['tile', 'shadow', 'white']) $('#' + k).checked = cfg[k];
  $('#szv').textContent = cfg.sz; $('#opv').textContent = cfg.op; $('#mgv').textContent = cfg.mg;
}
function whiteLogo() { if (!logoImg) return null; const c = document.createElement('canvas'); c.width = logoImg.width; c.height = logoImg.height; const x = c.getContext('2d'); x.drawImage(logoImg, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); return c; }
function render(img, cv) {
  let W = img.naturalWidth || img.width, H = img.naturalHeight || img.height; const mw = +cfg.maxw; if (mw && W > mw) { H = Math.round(H * mw / W); W = mw; }
  cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.drawImage(img, 0, 0, W, H);
  const base = Math.min(W, H), mark = cfg.mode === 'logo' ? (cfg.white ? logoW : logoImg) : null;
  if (cfg.mode === 'logo' && !mark) return cv;
  x.save(); x.globalAlpha = cfg.op / 100;
  let mw2, mh, drawMark;
  if (mark) { mw2 = W * cfg.sz / 100; mh = mw2 * mark.height / mark.width; if (mh > H * .9) { mh = H * .9; mw2 = mh * mark.width / mark.height; } drawMark = (cx, cy) => x.drawImage(mark, cx - mw2 / 2, cy - mh / 2, mw2, mh); }
  else { const fs = Math.max(10, base * cfg.sz / 100 / 2.2); x.font = `700 ${fs}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; mw2 = x.measureText(cfg.txt).width; mh = fs * 1.2;
    drawMark = (cx, cy) => { if (cfg.shadow) { x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = fs / 6; x.shadowOffsetY = fs / 16; } x.fillStyle = cfg.col; x.fillText(cfg.txt, cx, cy); }; }
  const rot = cfg.rot * Math.PI / 180, at = (cx, cy) => { x.save(); x.translate(cx, cy); x.rotate(rot); drawMark(0, 0); x.restore(); };
  if (cfg.tile) { const sx = mw2 * 1.8, sy = mh * 3; for (let yy = -sy, r = 0; yy < H + sy; yy += sy, r++) for (let xx = -sx + (r % 2) * sx / 2; xx < W + sx; xx += sx) at(xx, yy); }
  else { const m = base * cfg.mg / 100, col = cfg.pos % 3, row = Math.floor(cfg.pos / 3);
    const cx = col === 0 ? m + mw2 / 2 : col === 1 ? W / 2 : W - m - mw2 / 2, cy = row === 0 ? m + mh / 2 : row === 1 ? H / 2 : H - m - mh / 2; at(cx, cy); }
  x.restore(); return cv;
}
let raf; function preview() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { $('#ph').hidden = !!images.length; $('#cv').hidden = !images.length; if (images[sel]) render(images[sel].img, $('#cv')); }); }
function thumbs() { $('#th').innerHTML = images.map((m, i) => `<div><img src="${m.src}" class="${i === sel ? 'on' : ''}" data-i="${i}" title="${esc(m.name)}"><span data-d="${i}">×</span></div>`).join(''); $('#cnt').textContent = images.length ? images.length + ' ta rasm' : ''; }
async function addFiles(files) { for (const f of files) { if (!f.type.startsWith('image/')) continue; const src = await fileUrl(f); try { images.push({ name: f.name || 'rasm.png', type: f.type, src, img: await loadImg(src) }); } catch {} } thumbs(); preview(); }
$('#imgs').onchange = e => addFiles(e.target.files);
const dz = $('#drop'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); addFiles(e.dataTransfer.files); };
document.ondragover = e => e.preventDefault(); document.ondrop = e => { e.preventDefault(); addFiles(e.dataTransfer.files); };
document.addEventListener('paste', e => addFiles([...e.clipboardData.files]));
$('#th').onclick = e => { if (e.target.dataset.d != null) { images.splice(+e.target.dataset.d, 1); sel = Math.min(sel, images.length - 1); if (sel < 0) sel = 0; } else if (e.target.dataset.i != null) sel = +e.target.dataset.i; thumbs(); preview(); };
$('#logo').onchange = async e => { const f = e.target.files[0]; if (!f) return; const src = await fileUrl(f); logoImg = await loadImg(src); logoW = whiteLogo(); $('#lp').src = src; $('#lp').hidden = false; store.set('logo', src); preview(); };
const save = () => { store.set('cfg', cfg); ui(); preview(); };
$('#pos').onclick = e => { if (e.target.dataset.p != null) { cfg.pos = +e.target.dataset.p; cfg.tile = false; save(); } };
$('#mode').onclick = e => { if (e.target.dataset.m) { cfg.mode = e.target.dataset.m; save(); } };
for (const k of ['sz', 'op', 'mg', 'rot']) $('#' + k).oninput = e => { cfg[k] = +e.target.value; save(); };
for (const k of ['txt', 'col', 'fmt', 'maxw', 'suf']) $('#' + k).oninput = e => { cfg[k] = e.target.value; save(); };
for (const k of ['tile', 'shadow', 'white']) $('#' + k).onchange = e => { cfg[k] = e.target.checked; save(); };
function outType(m) { const t = cfg.fmt === 'same' ? (/png|webp|jpeg/.exec(m.type)?.[0] || 'jpeg') : cfg.fmt; return { mime: 'image/' + t, ext: t === 'jpeg' ? 'jpg' : t }; }
const outName = (m, ext) => m.name.replace(/\.[^.]+$/, '') + cfg.suf + '.' + ext;
async function blobOf(m) { const c = render(m.img, document.createElement('canvas')), o = outType(m); return { blob: await new Promise(ok => c.toBlob(ok, o.mime, .92)), name: outName(m, o.ext) }; }
function need() { if (!images.length) { toast('Avval rasm qo\'shing'); return false; } if (cfg.mode === 'logo' && !logoImg) { toast('Logo tanlang yoki «Matn» rejimiga o\'ting'); return false; } return true; }
$('#one').onclick = async () => { if (!need()) return; const { blob, name } = await blobOf(images[sel]); download(name, blob); };
$('#zip').onclick = async () => {
  if (!need()) return; const z = new JSZip(), used = {}; $('#pg').hidden = false; $('#pg').max = images.length;
  for (let i = 0; i < images.length; i++) { let { blob, name } = await blobOf(images[i]); if (used[name]) name = name.replace(/(\.\w+)$/, `-${++used[name]}$1`); else used[name] = 1; z.file(name, blob); $('#pg').value = i + 1; }
  download('logo-rasmlar.zip', await z.generateAsync({ type: 'blob' })); $('#pg').hidden = true; toast(images.length + ' ta rasm tayyor');
};
(async () => {
  cfg = { ...DEF, ...(await store.get('cfg', {})) }; ui();
  const l = await store.get('logo', null); if (l) { logoImg = await loadImg(l); logoW = whiteLogo(); $('#lp').src = l; $('#lp').hidden = false; }
  const src = new URLSearchParams(location.search).get('src');
  if (src) {
    const get = async () => { const blob = await (await fetch(src)).blob(); await addFiles([new File([blob], decodeURIComponent(new URL(src).pathname.split('/').pop() || '') || 'rasm.jpg', { type: blob.type })]); };
    try { await get(); } catch {
      $('#ph').innerHTML = 'Bu saytdan rasmni olish uchun ruxsat kerak.<br><br><button id="perm">Ruxsat berish va yuklash</button>';
      $('#perm').onclick = async () => { try { if (await chrome.permissions.request({ origins: [new URL(src).origin + '/*'] })) await get(); } catch { toast('Rasmni yuklab bo\'lmadi — saqlab, keyin bu yerga tashlang'); } };
    }
  }
  preview();
})();
