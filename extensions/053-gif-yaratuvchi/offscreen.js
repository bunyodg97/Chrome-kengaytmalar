let src = null, actx = null, cfg = null, frames = [], loop = null, timer = null, sec = 0, size = null, crop = null, lastT = 0;
const send = m => chrome.runtime.sendMessage(m).catch(() => {});
function cleanup() { loop = null; clearInterval(timer); src?.getTracks().forEach(t => t.stop()); src = null; actx?.close().catch(() => {}); actx = null; }
async function encode() {
  const { GIFEncoder, quantize, applyPalette } = await import('./lib/gifenc.esm.js');
  const gif = GIFEncoder(), delay = Math.round(1000 / cfg.fps);
  for (let i = 0; i < frames.length; i++) {
    const data = frames[i].data; const pal = quantize(data, 256, { format: 'rgb565' }); const idx = applyPalette(data, pal, 'rgb565');
    gif.writeFrame(idx, size.w, size.h, { palette: pal, delay, repeat: cfg.loop ? 0 : -1 });
    if (i % 5 === 0) { send({ cmd: 'encoding', p: Math.round(i / frames.length * 100) }); await new Promise(r => setTimeout(r)); }
  }
  gif.finish(); return new Blob([gif.bytes()], { type: 'image/gif' });
}
async function stop() {
  if (!loop) return; loop = null; clearInterval(timer);
  const n = frames.length; cleanup();
  if (n < 2) return send({ cmd: 'error', error: 'Juda qisqa' });
  try { const blob = await encode(); const id = 'g' + Date.now(); await DB.put(id, { blob, mime: 'image/gif', dur: sec, t: Date.now(), w: size.w, h: size.h, n }); frames = []; send({ cmd: 'done', id }); }
  catch (e) { send({ cmd: 'error', error: e.message }); }
}
function record(rect, vw) {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const reader = new MediaStreamTrackProcessor({ track: src.getVideoTracks()[0] }).readable.getReader();
  frames = []; crop = { rect, vw }; size = null; lastT = 0; const id = Symbol(); loop = id; const step = 1000 / cfg.fps;
  (async () => {
    while (loop === id) {
      const { value: f, done } = await reader.read(); if (done) break;
      const now = performance.now();
      if (now - lastT >= step - 2) {
        lastT = now; const sc = f.displayWidth / crop.vw;
        const sx = crop.rect.x * sc, sy = crop.rect.y * sc, sw = crop.rect.w * sc, sh = crop.rect.h * sc;
        if (!size) { const k = Math.min(1, cfg.width / sw); size = { w: Math.max(2, Math.round(sw * k)), h: Math.max(2, Math.round(sh * k)) }; cv.width = size.w; cv.height = size.h; }
        ctx.drawImage(f, sx, sy, sw, sh, 0, 0, size.w, size.h);
        frames.push(ctx.getImageData(0, 0, size.w, size.h));
      }
      f.close();
    }
  })();
  sec = 0; send({ cmd: 'tick', sec }); timer = setInterval(() => { sec++; send({ cmd: 'tick', sec }); if (sec >= cfg.max) stop(); }, 1000);
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'off') return;
  (async () => {
    try {
      if (m.cmd === 'prepare') {
        cleanup(); cfg = m.cfg;
        src = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId } }, video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId, maxWidth: 3840, maxHeight: 2160, maxFrameRate: 30 } } });
        actx = new AudioContext(); if (src.getAudioTracks().length) actx.createMediaStreamSource(new MediaStream(src.getAudioTracks())).connect(actx.destination);
        return reply({ ok: true });
      }
      if (m.cmd === 'record') { record(m.rect, m.vw); return reply(1); }
      if (m.cmd === 'stop') { stop(); return reply(1); }
      if (m.cmd === 'cancel') { cleanup(); frames = []; return reply(1); }
    } catch (e) { cleanup(); reply({ error: e.message }); }
  })();
  return true;
});
