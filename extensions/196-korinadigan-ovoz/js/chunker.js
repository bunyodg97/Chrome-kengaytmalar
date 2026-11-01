// Ovozni 16 kHz ga o'tkazib, nutq bo'laklariga ajratadi (sodda energiya asosidagi VAD)
export const RATE = 16000;

export class Chunker {
  constructor(inRate, onChunk, onLevel, opt = {}) {
    this.ratio = inRate / RATE;
    this.onChunk = onChunk;
    this.onLevel = onLevel || (() => {});
    this.frame = 320;                         // 20 ms
    this.maxLen = (opt.maxSec || 8) * RATE;   // uzluksiz nutqni shu yerda kesamiz
    this.minLen = 0.6 * RATE;
    this.hang = Math.round((opt.silenceMs || 650) / 20); // shuncha jim kadrdan keyin bo'lak tugaydi
    this.pre = 15;                            // 300 ms oldingi ovoz
    this.floor = 0.004;                       // shovqin darajasi (moslashadi)
    this.pos = 0; this.carry = new Float32Array(0);
    this.ring = [];                           // oldingi kadrlar
    this.cur = null; this.quiet = 0;
    this.levelAcc = 0; this.levelN = 0;
  }

  // Pasaytirish: har bir chiqish namunasi — kirish oralig'ining o'rtachasi (fazasi bloklar orasida saqlanadi)
  resample(input) {
    const r = this.ratio;
    if (Math.abs(r - 1) < 1e-6) return input;
    const out = new Float32Array(Math.ceil(input.length / r) + 1);
    let pos = this.pos, n = 0;
    while (pos + r <= input.length) {
      const s = Math.max(0, Math.floor(pos)), e = Math.max(s + 1, Math.floor(pos + r));
      let sum = 0;
      for (let k = s; k < e; k++) sum += input[k];
      out[n++] = sum / (e - s);
      pos += r;
    }
    this.pos = pos - input.length;
    return out.subarray(0, n);
  }

  push(samples) {
    const x = this.resample(samples);
    let data = x;
    if (this.carry.length) { data = new Float32Array(this.carry.length + x.length); data.set(this.carry); data.set(x, this.carry.length); }
    let i = 0;
    for (; i + this.frame <= data.length; i += this.frame) this.frameIn(data.subarray(i, i + this.frame));
    this.carry = data.slice(i);
  }

  frameIn(f) {
    let e = 0;
    for (let i = 0; i < f.length; i++) e += f[i] * f[i];
    const rms = Math.sqrt(e / f.length);
    // shovqin darajasini sekin kuzatish
    if (rms < this.floor * 2) this.floor = this.floor * 0.995 + rms * 0.005;
    this.floor = Math.max(0.0015, Math.min(this.floor, 0.05));
    const speech = rms > Math.max(0.012, this.floor * 3.2);

    this.levelAcc += rms; this.levelN++;
    if (this.levelN >= 10) { // har 200 ms
      this.onLevel(Math.min(1, (this.levelAcc / this.levelN) * 9));
      this.levelAcc = 0; this.levelN = 0;
    }

    const copy = Float32Array.from(f);
    if (!this.cur) {
      this.ring.push(copy); if (this.ring.length > this.pre) this.ring.shift();
      if (speech) { this.cur = [...this.ring]; this.len = this.cur.length * this.frame; this.ring = []; this.quiet = 0; this.voiced = 1; this.vsum = rms; }
      return;
    }
    this.cur.push(copy); this.len += this.frame;
    if (speech) { this.quiet = 0; this.voiced++; this.vsum += rms; } else this.quiet++;
    if ((this.quiet >= this.hang && this.len >= this.minLen) || this.len >= this.maxLen) this.flush();
  }

  flush() {
    if (!this.cur) return;
    const parts = this.cur; this.cur = null;
    if (this.voiced < 8) return; // 160 ms dan kam nutq — shovqin
    const out = new Float32Array(parts.length * this.frame);
    parts.forEach((p, k) => out.set(p, k * this.frame));
    this.onChunk(out, { rms: this.vsum / this.voiced, sec: out.length / RATE });
  }
}

// 16-bit WAV (bulutli xizmatlar uchun)
export function toWav(f32, rate = RATE) {
  const buf = new ArrayBuffer(44 + f32.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + f32.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, f32.length * 2, true);
  for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return buf;
}

export function pcm16Base64(f32) {
  const bytes = new Uint8Array(toWav(f32)).subarray(44);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// Whisper'ning jimlikdagi "xayoliy" iboralari
const JUNK = [
  /продолжение следует/i, /субтитр\S* (сделал|создавал|подогнал|делал)/i, /редактор субтитров/i, /корректор/i,
  /спасибо за (просмотр|внимание)/i, /подпис(ывайтесь|ывайся) на канал/i, /thank(s| you) for watching/i,
  /subtitles? by/i, /amara\.org/i, /please subscribe/i, /^\W*$/
];
export function cleanText(s) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (!s) return { text: '' };
  if (/^[\s\[(]*(music|музыка|musiqa|♪|♫)+[\s\])]*$/i.test(s) || /^[♪♫\s]+$/.test(s)) return { text: '', sound: 'music' };
  if (/^[\[(][^\])]{1,30}[\])]$/.test(s)) return { text: '', sound: 'noise' };
  if (JUNK.some(r => r.test(s))) return { text: '' };
  return { text: s.replace(/[♪♫]/g, '').trim() };
}
