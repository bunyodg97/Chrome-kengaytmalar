let src = null, mic = null, actx = null, recorder = null, chunks = [], loop = null, crop = null, cfgNow = null, timer = null, sec = 0, paused = false, mime = '';
const send = m => chrome.runtime.sendMessage(m).catch(() => {});
const BITRATE = { high: 8e6, mid: 4e6, low: 1.5e6 };
function pickMime(fmt) {
  const mp4 = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];
  const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return (fmt === 'mp4' ? [...mp4, ...webm] : [...webm, ...mp4]).find(t => MediaRecorder.isTypeSupported(t)) || '';
}
async function getMic() { try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { return null; } }
function cleanup() {
  clearInterval(timer); loop = null;
  [src, mic].forEach(s => s?.getTracks().forEach(t => t.stop())); src = mic = null;
  actx?.close().catch(() => {}); actx = null; recorder = null; chunks = []; crop = null; sec = 0; paused = false;
}
// Video oqimidan kadrlarni o'qib, kerakli hududni kanvasga chizamiz.
// Kanvas o'lchami birinchi kadrdan keyin o'rnatiladi va shundan keyingina oqim yaratiladi.
function startFrames(track) {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { alpha: false });
  const reader = new MediaStreamTrackProcessor({ track }).readable.getReader();
  const id = Symbol(); loop = id;
  let vtrack = null, resolve; const ready = new Promise(ok => resolve = ok);
  (async () => {
    while (loop === id) {
      const { value: f, done } = await reader.read(); if (done) break;
      if (crop) {
        const sc = f.displayWidth / crop.vw;
        const sx = Math.round(crop.rect.x * sc), sy = Math.round(crop.rect.y * sc);
        if (!vtrack) {
          let sw = Math.round(crop.rect.w * sc), sh = Math.round(crop.rect.h * sc);
          cv.width = Math.min(sw - sw % 2, f.displayWidth - sx); cv.height = Math.min(sh - sh % 2, f.displayHeight - sy);
          cv.width -= cv.width % 2; cv.height -= cv.height % 2;
        }
        ctx.drawImage(f, sx, sy, cv.width, cv.height, 0, 0, cv.width, cv.height);
        if (!vtrack) { vtrack = cv.captureStream(0).getVideoTracks()[0]; resolve(vtrack); }
        vtrack.requestFrame?.();
      }
      f.close();
    }
    try { reader.releaseLock(); } catch { }
  })();
  return ready;
}
async function begin(rect, vw) {
  const c = cfgNow;
  crop = { rect, vw };
  const vtrack = await Promise.race([startFrames(src.getVideoTracks()[0]), new Promise((_, no) => setTimeout(() => no(new Error('Video oqimi kelmadi')), 5000))]);
  // ovoz: tab/tizim ovozi + mikrofon
  actx = new AudioContext(); const dest = actx.createMediaStreamDestination();
  if (src.getAudioTracks().length) {
    const a = actx.createMediaStreamSource(new MediaStream(src.getAudioTracks()));
    if (c.sysAudio) a.connect(dest);
    if (src.__tab) a.connect(actx.destination); // tab ovozi o'chib qolmasligi uchun
  }
  if (c.mic) { mic = await getMic(); if (mic) actx.createMediaStreamSource(mic).connect(dest); }
  const tracks = [vtrack, ...(dest.stream.getAudioTracks().length && (c.mic && mic || c.sysAudio && src.getAudioTracks().length) ? dest.stream.getAudioTracks() : [])];
  mime = pickMime(c.fmt);
  recorder = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: BITRATE[c.quality] || 4e6 });
  chunks = []; recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mime.split(';')[0] }), id = 'r' + Date.now();
    const dur = sec; cleanup();
    if (blob.size < 1000) { send({ cmd: 'error', error: 'Video juda qisqa yoki bo\'sh' }); return; }
    await DB.put(id, { blob, mime: blob.type, dur, t: Date.now() });
    send({ cmd: 'done', id });
  };
  recorder.start(1000);
  sec = 0; send({ cmd: 'tick', sec }); timer = setInterval(() => { if (!paused) { sec++; send({ cmd: 'tick', sec }); } }, 1000);
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'off') return;
  (async () => {
    try {
      if (m.cmd === 'prepare' || m.cmd === 'start') {
        cleanup(); cfgNow = m.cfg;
        if (m.kind === 'tab') {
          src = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId } },
            video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId, maxWidth: 3840, maxHeight: 2160, maxFrameRate: m.cfg.fps } } });
          src.__tab = true;
          // tanlash paytida ham tab ovozi eshitilib tursin
          actx = new AudioContext(); if (src.getAudioTracks().length) actx.createMediaStreamSource(new MediaStream(src.getAudioTracks())).connect(actx.destination);
        } else {
          src = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: m.streamId } },
            video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: m.streamId, maxWidth: 3840, maxHeight: 2160, maxFrameRate: m.cfg.fps } } })
            .catch(() => navigator.mediaDevices.getUserMedia({ video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: m.streamId, maxWidth: 3840, maxHeight: 2160 } } }));
          const st = src.getVideoTracks()[0].getSettings();
          src.getVideoTracks()[0].onended = () => recorder?.state !== 'inactive' && recorder?.stop();
          await begin({ x: 0, y: 0, w: st.width, h: st.height }, st.width);
        }
        src.getVideoTracks()[0].addEventListener('ended', () => { if (recorder && recorder.state !== 'inactive') recorder.stop(); });
        return reply({ ok: true });
      }
      if (m.cmd === 'record') { actx?.close().catch(() => {}); actx = null; await begin(m.rect, m.vw); return reply({ ok: true }); }
      if (m.cmd === 'pause') { recorder?.pause(); paused = true; return reply({ paused: true }); }
      if (m.cmd === 'resume') { recorder?.resume(); paused = false; return reply({ paused: false }); }
      if (m.cmd === 'stop') { if (recorder && recorder.state !== 'inactive') recorder.stop(); else { cleanup(); send({ cmd: 'done' }); } return reply(1); }
      if (m.cmd === 'cancel') { cleanup(); return reply(1); }
    } catch (e) { cleanup(); send({ cmd: 'error', error: e.message }); reply({ error: e.message }); }
  })();
  return true;
});
