const cv = $('#cv'), ctx = cv.getContext('2d');
let base = null, ops = [], tool = 'arrow', cur = null, title = 'sahifa';

function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }

async function init() {
  const shot = await chrome.runtime.sendMessage({ cmd: 'getShot' });
  if (!shot) { document.body.innerHTML = '<p class="empty">Rasm topilmadi. Kengaytma tugmasini qayta bosing.</p>'; return; }
  title = (shot.title || 'sahifa').replace(/[\\/:*?"<>|]+/g, '').slice(0, 60);
  const imgs = await Promise.all(shot.parts.map(p => loadImg(p.url)));
  const scale = imgs[0].width / shot.w;
  const W = imgs[0].width, H = Math.round(Math.min(shot.total, shot.parts.at(-1).y + shot.h) * scale);
  base = document.createElement('canvas'); base.width = W; base.height = Math.min(H, 32000);
  const b = base.getContext('2d');
  imgs.forEach((im, i) => b.drawImage(im, 0, Math.round(shot.parts[i].y * scale)));
  cv.width = base.width; cv.height = base.height; render();
}

function arrow(c, x1, y1, x2, y2, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = Math.max(12, w * 4);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.beginPath(); c.moveTo(x2, y2);
  c.lineTo(x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45));
  c.lineTo(x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)); c.closePath(); c.fill();
}
function pixelate(c, x, y, w, h) {
  if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
  if (w < 2 || h < 2) return;
  const s = 12, t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(w / s)); t.height = Math.max(1, Math.round(h / s));
  const tc = t.getContext('2d'); tc.drawImage(cv, x, y, w, h, 0, 0, t.width, t.height);
  c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, t.width, t.height, x, y, w, h); c.imageSmoothingEnabled = true;
}
function drawOp(o) {
  ctx.strokeStyle = ctx.fillStyle = o.color; ctx.lineWidth = o.w; ctx.lineCap = ctx.lineJoin = 'round';
  if (o.t === 'arrow') arrow(ctx, o.x1, o.y1, o.x2, o.y2, o.w);
  else if (o.t === 'rect') ctx.strokeRect(o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1);
  else if (o.t === 'blur') pixelate(ctx, o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1);
  else if (o.t === 'pen') { ctx.beginPath(); o.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
  else if (o.t === 'text') { ctx.font = `600 ${o.w * 6 + 10}px Segoe UI, sans-serif`; ctx.textBaseline = 'top'; ctx.fillText(o.text, o.x1, o.y1); }
  else if (o.t === 'crop' && o.preview) { ctx.setLineDash([8, 6]); ctx.strokeStyle = '#1f5fd1'; ctx.lineWidth = 2; ctx.strokeRect(o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1); ctx.setLineDash([]); }
}
function render() {
  ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
  ops.forEach(drawOp); if (cur) drawOp(cur);
}
function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }

cv.addEventListener('pointerdown', e => {
  if (!base) return;
  const [x, y] = pos(e), color = $('#color').value, w = +$('#width').value || 4;
  if (tool === 'text') {
    const inp = document.createElement('input');
    Object.assign(inp.style, { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: '240px', zIndex: 9 });
    inp.placeholder = 'Matn yozing va Enter'; document.body.appendChild(inp); inp.focus();
    const done = ok => { if (ok && inp.value.trim()) { ops.push({ t: 'text', x1: x, y1: y, text: inp.value, color, w }); render(); } inp.remove(); };
    inp.onkeydown = ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); };
    inp.onblur = () => done(true);
    return;
  }
  cv.setPointerCapture(e.pointerId);
  cur = { t: tool, x1: x, y1: y, x2: x, y2: y, color, w, pts: [[x, y]], preview: true };
});
cv.addEventListener('pointermove', e => { if (!cur) return; const [x, y] = pos(e); cur.x2 = x; cur.y2 = y; cur.pts.push([x, y]); render(); });
cv.addEventListener('pointerup', () => {
  if (!cur) return;
  const c = cur; cur = null;
  if (c.t === 'crop') {
    const x = Math.round(Math.min(c.x1, c.x2)), y = Math.round(Math.min(c.y1, c.y2)), w = Math.round(Math.abs(c.x2 - c.x1)), h = Math.round(Math.abs(c.y2 - c.y1));
    if (w > 10 && h > 10) {
      render(); const n = document.createElement('canvas'); n.width = w; n.height = h;
      n.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, w, h);
      base = n; ops = []; cv.width = w; cv.height = h;
    }
    render(); return;
  }
  delete c.preview; ops.push(c); render();
});
$$('.tool').forEach(b => b.onclick = () => { tool = b.dataset.t; $$('.tool').forEach(x => x.classList.toggle('on', x === b)); });
$('#undo').onclick = () => { ops.pop(); render(); };
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { ops.pop(); render(); } });
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
$('#png').onclick = () => cv.toBlob(b => download(`${title} ${stamp()}.png`, b), 'image/png');
$('#jpg').onclick = () => cv.toBlob(b => download(`${title} ${stamp()}.jpg`, b), 'image/jpeg', 0.92);
$('#copy').onclick = () => cv.toBlob(async b => {
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); toast('Rasm nusxalandi'); } catch { toast('Nusxalab bo\'lmadi'); }
}, 'image/png');
init();
