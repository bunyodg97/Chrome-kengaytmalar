tabsInit();
let mode = 'qr', lastSvg = '';
const wifiEsc = s => s.replace(/([\;,:"])/g, '\\$1');
function qrText() { return mode === 'wifi' ? `WIFI:T:${$('#sec').value};S:${wifiEsc($('#ssid').value)};${$('#sec').value !== 'nopass' ? 'P:' + wifiEsc($('#pass').value) + ';' : ''}${$('#hid').checked ? 'H:true;' : ''};` : $('#txt').value; }
function draw() {
  const pv = $('#pv'); pv.innerHTML = ''; $('#bcErr').textContent = '';
  if (mode === 'bc') {
    const v = $('#code').value.trim(); if (!v) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    try { JsBarcode(svg, v, { format: $('#fmt').value, lineColor: $('#fg').value, background: $('#bg').value, width: 2, height: 90, fontSize: 18, margin: 12 }); pv.appendChild(svg); lastSvg = svg.outerHTML; }
    catch { $('#bcErr').textContent = $('#fmt').value === 'EAN13' ? 'EAN-13 uchun 12 yoki 13 ta raqam kiriting (oxirgisi nazorat raqami).' : 'Bu formatga mos qiymat emas.'; }
    return;
  }
  const t = qrText(); if (!t) return;
  const q = qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(t))); q.make();
  const n = q.getModuleCount(), s = +$('#sz').value, m = 4, W = (n + m * 2) * s, fg = $('#fg').value, bg = $('#bg').value;
  let path = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) path += `M${(c + m) * s},${(r + m) * s}h${s}v${s}h-${s}z`;
  lastSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><rect width="100%" height="100%" fill="${bg}"/><path d="${path}" fill="${fg}"/></svg>`;
  pv.innerHTML = lastSvg; pv.querySelector('svg').style.width = Math.min(W, 300) + 'px';
}
function toCanvas() { return new Promise(ok => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const sc = mode === 'bc' ? 2 : 1; c.width = img.width * sc; c.height = img.height * sc; const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); ok(c); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastSvg.includes('xmlns=') ? lastSvg : lastSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); }); }
const fname = () => mode === 'bc' ? 'shtrix-kod-' + $('#code').value.trim() : mode === 'wifi' ? 'wifi-' + $('#ssid').value : 'qr-kod';
$('#png').onclick = async () => { if (!lastSvg) return; (await toCanvas()).toBlob(b => download(fname() + '.png', b)); };
$('#svg').onclick = () => lastSvg && download(fname() + '.svg', lastSvg, 'image/svg+xml');
$('#cp').onclick = async () => { if (!lastSvg) return; (await toCanvas()).toBlob(async b => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Rasm nusxalandi'); } catch { toast('Nusxalab bo\'lmadi'); } }); };
$('.tabs').addEventListener('click', e => { if (e.target.dataset.tab) { mode = e.target.dataset.tab; $('#sz').closest('label').style.display = mode === 'bc' ? 'none' : ''; draw(); } });
document.addEventListener('input', draw);
(async () => {
  const p = new URLSearchParams(location.search).get('t');
  if (p) $('#txt').value = p; else { const t = await activeTab(); $('#txt').value = t?.url || ''; }
  draw();
})();
