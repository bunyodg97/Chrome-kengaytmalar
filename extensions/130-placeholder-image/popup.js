const { $, $$, h } = App;
const PRESETS = [['16:9', 1280, 720], ['FHD', 1920, 1080], ['OG', 1200, 630], ['Insta', 1080, 1080], ['Story', 1080, 1920], ['Avatar', 256, 256], ['Banner', 728, 90], ['Card', 600, 400], ['Logo', 512, 512]];
let S = { w: 1200, h: 630, bg: '#cbd5e1', fg: '#475569', tx: '', st: 'solid', fmt: 'png' };

function label() { return S.tx || `${S.w} × ${S.h}`; }
function draw(cv) {
  cv.width = S.w; cv.height = S.h;
  const c = cv.getContext('2d');
  if (S.st === 'gradient') {
    const g = c.createLinearGradient(0, 0, S.w, S.h); g.addColorStop(0, S.bg); g.addColorStop(1, shade(S.bg, -40)); c.fillStyle = g;
  } else c.fillStyle = S.bg;
  c.fillRect(0, 0, S.w, S.h);
  if (S.st === 'checker') {
    const k = Math.max(8, Math.round(Math.min(S.w, S.h) / 12));
    c.fillStyle = shade(S.bg, -14);
    for (let y = 0; y < S.h; y += k) for (let x = (y / k % 2) * k; x < S.w; x += 2 * k) c.fillRect(x, y, k, k);
  }
  const fs = Math.max(8, Math.min(S.w / Math.max(4, label().length) * 1.5, S.h / 3.2));
  c.fillStyle = S.fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `600 ${fs}px system-ui, sans-serif`;
  c.fillText(label(), S.w / 2, S.h / 2);
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, v + amt));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function svg() {
  const fs = Math.max(8, Math.min(S.w / Math.max(4, label().length) * 1.5, S.h / 3.2)).toFixed(1);
  const fill = S.st === 'gradient' ? 'url(#g)' : S.bg;
  const defs = S.st === 'gradient' ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${S.bg}"/><stop offset="1" stop-color="${shade(S.bg, -40)}"/></linearGradient></defs>` : '';
  const pat = S.st === 'checker' ? (() => { const k = Math.max(8, Math.round(Math.min(S.w, S.h) / 12)); return `<defs><pattern id="p" width="${2 * k}" height="${2 * k}" patternUnits="userSpaceOnUse"><rect width="${k}" height="${k}" fill="${shade(S.bg, -14)}"/><rect x="${k}" y="${k}" width="${k}" height="${k}" fill="${shade(S.bg, -14)}"/></pattern></defs>`; })() : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S.w}" height="${S.h}" viewBox="0 0 ${S.w} ${S.h}">${defs}${pat}<rect width="100%" height="100%" fill="${fill}"/>${pat ? '<rect width="100%" height="100%" fill="url(#p)"/>' : ''}<text x="50%" y="50%" fill="${S.fg}" font-family="system-ui,sans-serif" font-weight="600" font-size="${fs}" text-anchor="middle" dominant-baseline="middle">${App.esc(label())}</text></svg>`;
}
const blob = () => S.fmt === 'svg' ? Promise.resolve(new Blob([svg()], { type: 'image/svg+xml' })) : new Promise(r => { const cv = document.createElement('canvas'); draw(cv); cv.toBlob(r, 'image/' + S.fmt, 0.9); });
const dataUrl = async () => S.fmt === 'svg' ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg()) : (() => { const cv = document.createElement('canvas'); draw(cv); return cv.toDataURL('image/' + S.fmt, 0.9); })();

async function update() {
  S.w = Math.max(1, Math.min(8000, +$('#w').value || 1)); S.h = Math.max(1, Math.min(8000, +$('#h').value || 1));
  S.bg = $('#bg').value; S.fg = $('#fg').value; S.tx = $('#tx').value; S.st = $('#st').value;
  draw($('#cv'));
  $$('#fmt button').forEach(b => b.classList.toggle('active', b.dataset.f === S.fmt));
  const b = await blob();
  $('#meta').textContent = `${S.w}×${S.h} · ${S.fmt.toUpperCase()} · ` + t('size', { s: App.bytes(b.size) });
  App.set('ph', S);
}
function fill() { $('#w').value = S.w; $('#h').value = S.h; $('#bg').value = S.bg; $('#fg').value = S.fg; $('#tx').value = S.tx; $('#st').value = S.st; }

App.onReady(async () => {
  S = Object.assign(S, await App.get('ph', {}));
  fill();
  PRESETS.forEach(([n, w, hh]) => $('#pre').append(h('button', { class: 'btn ghost', title: w + '×' + hh, text: n, onclick: () => { S.w = w; S.h = hh; fill(); update(); } })));
  ['w', 'h', 'bg', 'fg', 'tx', 'st'].forEach(id => $('#' + id).addEventListener('input', update));
  $('#swap').addEventListener('click', () => { [S.w, S.h] = [S.h, S.w]; fill(); update(); });
  $('#rnd').addEventListener('click', () => {
    const hue = Math.floor(Math.random() * 360);
    const hsl = (hh, s, l) => { const a = s * Math.min(l, 1 - l); const f = n => { const k = (n + hh / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); };
    S.bg = hsl(hue, 0.55, 0.78); S.fg = hsl(hue, 0.5, 0.3); fill(); update();
  });
  $$('#fmt button').forEach(b => b.addEventListener('click', () => { S.fmt = b.dataset.f; update(); }));
  $('#dl').addEventListener('click', async () => App.download(`placeholder-${S.w}x${S.h}.${S.fmt === 'jpeg' ? 'jpg' : S.fmt}`, await blob()));
  $('#cpImg').addEventListener('click', async () => {
    try {
      const cv = document.createElement('canvas'); draw(cv);
      const png = await new Promise(r => cv.toBlob(r, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      App.toast(t('copied'), 'ok');
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $('#cpUrl').addEventListener('click', async () => App.copy(await dataUrl()));
  $('#cpTag').addEventListener('click', async () => App.copy(`<img src="${await dataUrl()}" width="${S.w}" height="${S.h}" alt="${App.esc(label())}">`));
  update();
});
