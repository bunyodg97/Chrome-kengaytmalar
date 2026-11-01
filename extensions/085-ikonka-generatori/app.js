const SETS = {
  web: ['Favicon (16, 32, 48 + favicon.ico)', [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['favicon-48x48.png', 48]]],
  apple: ['Apple touch (180)', [['apple-touch-icon.png', 180, 'apple']]],
  pwa: ['PWA (192, 512 + maskable)', [['android-chrome-192x192.png', 192], ['android-chrome-512x512.png', 512], ['maskable-512x512.png', 512, 'mask']]],
  ext: ['Chrome kengaytma (16, 32, 48, 128)', [['extension/icon16.png', 16], ['extension/icon32.png', 32], ['extension/icon48.png', 48], ['extension/icon128.png', 128]]],
  android: ['Android mipmap (48–192)', [['android/mipmap-mdpi/ic_launcher.png', 48], ['android/mipmap-hdpi/ic_launcher.png', 72], ['android/mipmap-xhdpi/ic_launcher.png', 96], ['android/mipmap-xxhdpi/ic_launcher.png', 144], ['android/mipmap-xxxhdpi/ic_launcher.png', 192], ['android/playstore-512.png', 512]]],
  ios: ['iOS App Store (1024 va boshq.)', [['ios/AppIcon-1024.png', 1024, 'apple'], ['ios/AppIcon-180.png', 180, 'apple'], ['ios/AppIcon-167.png', 167, 'apple'], ['ios/AppIcon-152.png', 152, 'apple'], ['ios/AppIcon-120.png', 120, 'apple'], ['ios/AppIcon-87.png', 87, 'apple'], ['ios/AppIcon-80.png', 80, 'apple'], ['ios/AppIcon-58.png', 58, 'apple'], ['ios/AppIcon-40.png', 40, 'apple']]],
  win: ['Windows tile (150, 310)', [['mstile-150x150.png', 150], ['mstile-310x310.png', 310]]]
};
let img = null, on = ['web', 'apple', 'pwa'];
$('#sets').innerHTML = Object.entries(SETS).map(([k, [n]]) => `<label class="inline small"><input type="checkbox" data-k="${k}" ${on.includes(k) ? 'checked' : ''} style="width:auto"> ${n}</label>`).join('');
function make(size, kind) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const opaque = kind === 'apple' || kind === 'mask'; const bg = $('#bgOn').checked || opaque ? $('#bg').value : null;
  const r = kind === 'apple' ? 0 : size * $('#rad').value / 100;
  if (r) { x.beginPath(); x.roundRect(0, 0, size, size, r); x.clip(); }
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
  let pad = size * $('#pad').value / 100; if (kind === 'mask') pad = Math.max(pad, size * .1); // maskable xavfsiz zona
  const s = size - pad * 2, k = Math.min(s / img.width, s / img.height), w = img.width * k, h = img.height * k;
  if ($('#sharp').checked && size <= 48 && img.width > size * 4) { // bosqichma-bosqich kichraytirish
    let t = document.createElement('canvas'), cw = img.width, ch = img.height; t.width = cw; t.height = ch; t.getContext('2d').drawImage(img, 0, 0);
    while (cw / 2 > w) { const n = document.createElement('canvas'); n.width = cw = Math.round(cw / 2); n.height = ch = Math.round(ch / 2); const nx = n.getContext('2d'); nx.imageSmoothingQuality = 'high'; nx.drawImage(t, 0, 0, cw, ch); t = n; }
    x.imageSmoothingQuality = 'high'; x.drawImage(t, (size - w) / 2, (size - h) / 2, w, h);
  } else { x.imageSmoothingQuality = 'high'; x.drawImage(img, (size - w) / 2, (size - h) / 2, w, h); }
  return c;
}
const blob = c => new Promise(ok => c.toBlob(ok, 'image/png'));
async function ico(sizes) { // PNG ichli ICO
  const pngs = await Promise.all(sizes.map(async s => new Uint8Array(await (await blob(make(s))).arrayBuffer())));
  const head = 6 + 16 * pngs.length, total = head + pngs.reduce((a, p) => a + p.length, 0), b = new Uint8Array(total), v = new DataView(b.buffer);
  v.setUint16(2, 1, true); v.setUint16(4, pngs.length, true); let off = head;
  pngs.forEach((p, i) => { const e = 6 + i * 16, s = sizes[i]; b[e] = s >= 256 ? 0 : s; b[e + 1] = s >= 256 ? 0 : s; v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true); v.setUint32(e + 8, p.length, true); v.setUint32(e + 12, off, true); b.set(p, off); off += p.length; });
  return new Blob([b], { type: 'image/x-icon' });
}
function list() { const out = []; on.forEach(k => SETS[k][1].forEach(f => out.push(f))); return out; }
function render() {
  $('#padv').textContent = $('#pad').value; $('#radv').textContent = $('#rad').value; if (!img) return;
  $('#prev').innerHTML = ''; [16, 32, 48, 128, 180, 512].forEach(s => { const c = make(s, s === 180 ? 'apple' : ''), d = document.createElement('div'); c.style.width = c.style.height = Math.min(s, 128) + 'px'; d.append(c, s + 'px'); $('#prev').append(d); });
  const has = k => on.includes(k);
  $('#html').textContent = [has('web') && '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">', has('apple') && '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">', has('pwa') && '<link rel="manifest" href="/site.webmanifest">', `<meta name="theme-color" content="${$('#tc').value}">`].filter(Boolean).join('\n');
  $('#man').textContent = JSON.stringify({ name: $('#nm').value, short_name: $('#nm').value.slice(0, 12), icons: has('pwa') ? [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }, { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] : [], theme_color: $('#tc').value, background_color: $('#bgOn').checked ? $('#bg').value : '#ffffff', display: 'standalone', start_url: '/' }, null, 2);
}
async function load(f) { const u = URL.createObjectURL(f); img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u; });
  if (/svg/.test(f.type) && (!img.width || img.width < 1024)) { const c = document.createElement('canvas'), k = 1024 / Math.max(img.width || 1, img.height || 1); c.width = (img.width || 1024) * k; c.height = (img.height || 1024) * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); img = c; }
  if (img.width < 512) toast(`Rasm kichik (${img.width}px) — katta o'lchamlar xira bo'lishi mumkin`); render(); }
$('#f').onchange = e => e.target.files[0] && load(e.target.files[0]);
const dz = $('#drop'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on'); dz.ondrop = e => { e.preventDefault(); dz.classList.remove('on'); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); };
document.addEventListener('paste', e => { const f = [...e.clipboardData.files][0]; if (f) load(f); });
$('#sets').onchange = e => { const k = e.target.dataset.k; on = e.target.checked ? [...on, k] : on.filter(x => x !== k); render(); };
['pad', 'rad', 'bg', 'bgOn', 'sharp', 'nm', 'tc'].forEach(id => $('#' + id).oninput = render);
$('#zip').onclick = async () => {
  if (!img) return toast('Avval rasm tanlang'); if (!on.length) return toast('To\'plam tanlang'); const z = new JSZip();
  for (const [name, s, kind] of list()) z.file(name, await blob(make(s, kind)));
  if (on.includes('web')) z.file('favicon.ico', await ico([16, 32, 48]));
  if (on.includes('pwa')) z.file('site.webmanifest', $('#man').textContent);
  z.file('head.html', $('#html').textContent); z.file('original.png', await blob(make(1024)));
  download('ikonkalar.zip', await z.generateAsync({ type: 'blob' })); toast('Tayyor');
};
render();
