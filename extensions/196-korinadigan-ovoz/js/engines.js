// Nutqni matnga aylantirish: mahalliy Whisper, OpenAI, Google
import { toWav, pcm16Base64 } from './chunker.js';

const WHISPER_LANG = { uz: 'uzbek', ru: 'russian', en: 'english' };
const GOOGLE_LANG = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };

export async function libAvailable() {
  try {
    const r = await fetch(chrome.runtime.getURL('lib/transformers.min.js'), { method: 'HEAD' });
    return r.ok;
  } catch { return false; }
}

// ---- transformers.js ni bir marta yuklash ----
let TX = null;
export async function loadTransformers() {
  if (TX) return TX;
  if (!(await libAvailable())) throw new Error('libMissing');
  const T = await import(chrome.runtime.getURL('lib/transformers.min.js'));
  T.env.allowLocalModels = false;
  T.env.useBrowserCache = true;
  const wasm = T.env.backends.onnx.wasm;
  wasm.wasmPaths = chrome.runtime.getURL('lib/');
  wasm.numThreads = 1; // offscreen hujjat crossOriginIsolated emas
  TX = T;
  return T;
}

// ---- Mahalliy Whisper (transformers.js) ----
export async function createLocal(settings, onProgress) {
  const T = await loadTransformers();

  let device = 'wasm';
  try { if (navigator.gpu && await navigator.gpu.requestAdapter()) device = 'webgpu'; } catch {}

  const files = {};
  const progress_callback = p => {
    if (p.status === 'progress' && p.file) {
      files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
      let l = 0, tt = 0;
      Object.values(files).forEach(f => { l += f.loaded; tt += f.total; });
      if (tt) onProgress(Math.min(99, Math.round(l / tt * 100)));
    }
  };
  const model = `onnx-community/whisper-${settings.model || 'base'}`;
  const opts = device === 'webgpu'
    ? { device, dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' }, progress_callback }
    : { device, dtype: 'q8', progress_callback };
  let pipe;
  try {
    pipe = await T.pipeline('automatic-speech-recognition', model, opts);
  } catch (e) {
    if (device !== 'webgpu') throw e;
    pipe = await T.pipeline('automatic-speech-recognition', model, { device: 'wasm', dtype: 'q8', progress_callback });
  }
  onProgress(100);
  const language = WHISPER_LANG[settings.speechLang];
  return {
    name: 'local',
    async transcribe(audio) {
      const out = await pipe(audio, language ? { language, task: 'transcribe' } : { task: 'transcribe' });
      return Array.isArray(out) ? out.map(o => o.text).join(' ') : (out.text || '');
    }
  };
}

// ---- OpenAI ----
export function createOpenAI(settings) {
  if (!settings.openaiKey) throw new Error('keyMissing');
  return {
    name: 'openai',
    async transcribe(audio) {
      const fd = new FormData();
      fd.append('file', new Blob([toWav(audio)], { type: 'audio/wav' }), 'audio.wav');
      fd.append('model', 'whisper-1');
      if (settings.speechLang !== 'auto') fd.append('language', settings.speechLang);
      const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST', headers: { Authorization: 'Bearer ' + settings.openaiKey.trim() }, body: fd
      });
      if (!r.ok) throw new Error('OpenAI ' + r.status + (r.status === 401 ? ' (API kalit noto\'g\'ri)' : ''));
      return (await r.json()).text || '';
    }
  };
}

// ---- Google Cloud Speech-to-Text ----
export function createGoogle(settings) {
  if (!settings.googleKey) throw new Error('keyMissing');
  const auto = settings.speechLang === 'auto';
  const config = {
    encoding: 'LINEAR16', sampleRateHertz: 16000,
    languageCode: auto ? 'uz-UZ' : GOOGLE_LANG[settings.speechLang],
    enableAutomaticPunctuation: true
  };
  if (auto) config.alternativeLanguageCodes = ['ru-RU', 'en-US'];
  return {
    name: 'google',
    async transcribe(audio) {
      const r = await fetch('https://speech.googleapis.com/v1p1beta1/speech:recognize?key=' + encodeURIComponent(settings.googleKey.trim()), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, audio: { content: pcm16Base64(audio) } })
      });
      if (!r.ok) throw new Error('Google ' + r.status + (r.status === 400 || r.status === 403 ? ' (kalit yoki API yoqilmagan)' : ''));
      const d = await r.json();
      return (d.results || []).map(x => (x.alternatives && x.alternatives[0] && x.alternatives[0].transcript) || '').join(' ');
    }
  };
}

export async function createEngine(settings, onProgress) {
  if (settings.engine === 'openai') return createOpenAI(settings);
  if (settings.engine === 'google') return createGoogle(settings);
  return createLocal(settings, onProgress);
}
