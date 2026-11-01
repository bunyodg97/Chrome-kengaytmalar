// Offscreen hujjat: tab ovozini ushlaydi, eshittiradi, bo'laklarga ajratib matnga aylantiradi
import { Chunker, cleanText } from './js/chunker.js';
import { createEngine, loadTransformers } from './js/engines.js';
import { createClassifier } from './js/sounds.js';
import { translate } from './js/translate.js';

let stream = null, ctx = null, node = null, engine = null, chunker = null;
let queue = [], busy = false, runId = 0, S = {}, classifier = null, rmsAvg = 0;

const send = m => chrome.runtime.sendMessage(m).catch(() => {});

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (msg.target !== 'offscreen') return;
  if (msg.type === 'start') start(msg.streamId, msg.settings);
  if (msg.type === 'stop') stop();
  reply({ ok: true }); // fon xizmati xabar yetib kelganini bilsin
});

async function start(streamId, settings) {
  stop();
  S = settings || {};
  const id = ++runId;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
      video: false
    });
    ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    src.connect(ctx.destination); // tab ovozi o'chib qolmasligi uchun qayta eshittiramiz
    await ctx.audioWorklet.addModule('audio-worklet.js');
    node = new AudioWorkletNode(ctx, 'grabber');
    src.connect(node);

    // Model yuklanayotganda ham ovoz ko'rsatkichi ishlaydi
    chunker = new Chunker(ctx.sampleRate, onChunk, level => send({ type: 'level', level, busy }));
    node.port.onmessage = e => chunker.push(e.data);

    send({ type: 'status', status: 'loading', progress: 0 });
    engine = await createEngine(settings, p => { if (id === runId) send({ type: 'status', status: 'loading', progress: p }); });
    if (id !== runId) return;
    send({ type: 'status', status: 'listening', progress: 100 });
    pump();
    // Ovoz turlarini aniqlash modeli (mahalliy kutubxona bo'lsa, fonda yuklanadi)
    if (S.soundTypes) loadTransformers().then(T => createClassifier(T)).then(c => { if (id === runId) classifier = c; }).catch(() => {});
  } catch (e) {
    console.error(e);
    if (id === runId) send({ type: 'status', status: 'error', error: String(e.message || e) });
  }
}

function onChunk(audio, meta) {
  audio.meta = meta;
  queue.push(audio);
  // real vaqtdan orqada qolmaslik: navbat uzaysa eskilarini tashlaymiz
  if (queue.length > 3) queue.splice(0, queue.length - 3);
  pump();
}

async function pump() {
  if (busy || !engine || !queue.length) return;
  busy = true;
  const id = runId;
  const audio = queue.shift();
  try {
    const raw = await engine.transcribe(audio);
    if (id !== runId) return;
    const { text, sound } = cleanText(raw);
    const meta = audio.meta || {};
    // Ohang: o'rtachadan ancha baland yoki past gapirilgan gaplar
    let emph = '';
    if (text && meta.rms) {
      if (rmsAvg && meta.rms > rmsAvg * 1.8) emph = 'loud';
      else if (rmsAvg && meta.rms < rmsAvg * 0.45) emph = 'quiet';
      rmsAvg = rmsAvg ? rmsAvg * 0.85 + meta.rms * 0.15 : meta.rms;
    }
    let tags = [];
    if (classifier && (!text || Math.random() < 0.35)) {
      try { tags = await classifier.classify(audio, S.lang); } catch {}
    }
    if (id !== runId) return;
    let tr = null;
    if (text && S.translateOn) tr = await translate(text, S.speechLang, S.translateTo, S.googleTranslateKey);
    if (id !== runId) return;
    if (text || sound || tags.length) send({ type: 'caption', text, sound, tags, emph, tr, dur: meta.sec || 0 });
  } catch (e) {
    console.warn(e);
    send({ type: 'status', status: 'listening', error: String(e.message || e) });
  } finally {
    busy = false;
    if (id === runId) pump();
  }
}

function stop() {
  runId++;
  queue = [];
  try { node && node.disconnect(); } catch {}
  try { ctx && ctx.close(); } catch {}
  try { stream && stream.getTracks().forEach(t => t.stop()); } catch {}
  stream = ctx = node = chunker = null;
  engine = null; busy = false;
}
