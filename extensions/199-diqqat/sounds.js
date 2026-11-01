// Signal ovozlari — Web Audio bilan sintez qilinadi (audio fayl kerak emas)
export const SOUNDS = [
  { id: 'bell',  name: "🔔 Qo'ng'iroqcha" },
  { id: 'soft',  name: '🎵 Yumshoq marimba' },
  { id: 'gong',  name: '🥁 Gong' },
  { id: 'birds', name: '🐦 Qushcha' }
];

let ctx;
const ac = () => (ctx ||= new AudioContext());

// Bitta nota: chastota, boshlanish vaqti, davomiyligi, to'lqin turi
function note(freq, at, dur, vol, type = 'sine', partials = [[1, 1]]) {
  const a = ac(), t = a.currentTime + at;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(a.destination);
  for (const [mul, amp] of partials) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq * mul; g.gain.value = amp;
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

// up = true — dam olish tugadi (ko'tariluvchi ohang), false — diqqat seansi tugadi
export async function play(id = 'bell', volume = 0.7, up = false) {
  const a = ac();
  if (a.state === 'suspended') await a.resume();
  const v = Math.max(0.01, Math.min(1, volume)) * 0.35;
  const seq = (notes, step, dur, fn) => (up ? [...notes].reverse() : notes).forEach((f, i) => fn(f, i * step, dur));

  if (id === 'bell') {
    const bell = [[1, 1], [2.76, 0.35], [5.4, 0.12]];
    seq([1568, 1319, 1047], 0.22, 1.6, (f, t, d) => note(f, t, d, v, 'sine', bell));
    return 1.4 + 0.5;
  }
  if (id === 'soft') {
    const mar = [[1, 1], [4, 0.25]];
    seq([784, 988, 1175, 1568], 0.16, 0.9, (f, t, d) => note(f, t, d, v * 1.2, 'triangle', mar));
    return 1.6;
  }
  if (id === 'gong') {
    const g = [[1, 1], [1.48, 0.5], [2.03, 0.35], [2.76, 0.2], [3.52, 0.1]];
    note(up ? 196 : 147, 0, 3.6, v * 1.3, 'sine', g);
    note(up ? 392 : 294, 0.6, 2.4, v * 0.5, 'sine', g);
    return 3.8;
  }
  if (id === 'birds') {
    // Qisqa chirqillash: chastota tez sakraydi
    const a2 = ac();
    [0, 0.18, 0.5, 0.68].forEach((at, i) => {
      const t = a2.currentTime + at, o = a2.createOscillator(), g = a2.createGain();
      o.type = 'sine';
      const base = (up ? 2600 : 2200) + (i % 2) * 400;
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.06);
      o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.13);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v * 0.8, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(a2.destination);
      o.start(t); o.stop(t + 0.2);
    });
    return 1.1;
  }
}
