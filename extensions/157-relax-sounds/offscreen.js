'use strict';
// Web Audio sintez dvigateli: barcha tovushlar kod bilan hosil qilinadi (fayl yo'q).
let ctx, master, fade, analyser;
let state = null, lastPlaying = null, lastEnd = 0, fadeT = 0, endT = 0, idleT = 0;
const live = {};
const bufCache = {};
const R = Math.random;
const rr = (a, b) => a + R() * (b - a);

function C() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain(); master.gain.value = 0;
  fade = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
  master.connect(fade); fade.connect(comp); comp.connect(analyser); comp.connect(ctx.destination);
  return ctx;
}

const XF = 0.15;
function noiseBuffer(kind) {
  if (bufCache[kind]) return bufCache[kind];
  const sr = ctx.sampleRate, len = Math.floor(sr * 8), fl = Math.floor(sr * XF);
  const b = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = R() * 2 - 1;
      if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5;
      } else d[i] = w * 0.35;
    }
    for (let i = 0; i < fl; i++) { const k = i / fl; d[i] = d[i] * k + d[len - fl + i] * (1 - k); }
  }
  return (bufCache[kind] = b);
}

const biq = (type, f, q) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q; return n; };
const gn = v => { const n = ctx.createGain(); n.gain.value = v; return n; };
const pan = p => { if (!ctx.createStereoPanner) return gn(1); const n = ctx.createStereoPanner(); n.pan.value = p; return n; };

// Har bir tovush o'z "rig"iga ega: tugunlar va taymerlar to'xtatilganda tozalanadi
function Rig(out) {
  const nodes = new Set(), timers = new Set();
  let dead = false;
  const r = {
    out,
    get dead() { return dead; },
    noise(kind) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuffer(kind); s.loop = true;
      s.loopEnd = s.buffer.duration - XF; s.start(0, R() * 6); nodes.add(s); return s;
    },
    osc(type, f) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); nodes.add(o); return o; },
    shot(kind, t0, dur) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuffer(kind);
      s.start(t0, R() * 6, dur); nodes.add(s); s.onended = () => nodes.delete(s); return s;
    },
    // fn() keyingi chaqiruvgacha millisekund qaytaradi
    every(fn, first = 0) {
      const run = () => {
        if (dead) return;
        const d = fn();
        const id = setTimeout(() => { timers.delete(id); run(); }, d);
        timers.add(id);
      };
      const id0 = setTimeout(() => { timers.delete(id0); run(); }, first);
      timers.add(id0);
    },
    stop() {
      dead = true; timers.forEach(clearTimeout); timers.clear();
      nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
      nodes.clear();
    }
  };
  return r;
}

function grain(r, { f, q = 2, type = 'bandpass', dur = 0.03, gain = 0.2, p = 0, t0 = ctx.currentTime, att = 0.002 }) {
  const s = r.shot('white', t0, dur + 0.05);
  const bp = biq(type, f, q);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + att); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const pn = pan(p);
  s.connect(bp); bp.connect(g); g.connect(pn); pn.connect(r.out);
  s.addEventListener('ended', () => { try { pn.disconnect(); } catch (e) {} });
}

function lfo(r, f, depth, param) { const o = r.osc('sine', f); const g = gn(depth); o.connect(g); g.connect(param); return o; }

const BUILD = {
  white(r) { r.noise('white').connect(r.out); },
  pink(r) { r.noise('pink').connect(r.out); },
  brown(r) { r.noise('brown').connect(r.out); },

  rain(r) {
    const n = r.noise('pink'), hp = biq('highpass', 450), lp = biq('lowpass', 9000), g = gn(0.8);
    n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(r.out);
    const n2 = r.noise('brown'), lp2 = biq('lowpass', 220), g2 = gn(0.45);
    n2.connect(lp2); lp2.connect(g2); g2.connect(r.out);
    lfo(r, 0.05, 0.12, g.gain);
    r.every(() => { grain(r, { f: rr(2200, 6500), q: rr(2, 7), dur: rr(0.015, 0.05), gain: rr(0.04, 0.16), p: rr(-1, 1) }); return rr(6, 28); });
  },

  wind(r) {
    const n = r.noise('pink'), bp = biq('bandpass', 520, 0.8), g = gn(0.55);
    n.connect(bp); bp.connect(g); g.connect(r.out);
    lfo(r, rr(0.05, 0.09), 260, bp.frequency);
    lfo(r, 0.04, 0.2, g.gain);
    const n2 = r.noise('brown'), lp = biq('lowpass', 180), g2 = gn(0.5);
    n2.connect(lp); lp.connect(g2); g2.connect(r.out);
    r.every(() => {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(rr(0.8, 1.3), t, 1.2);
      g.gain.setTargetAtTime(0.5, t + 3.5, 2);
      return rr(6000, 14000);
    }, 2000);
  },

  snow(r) {
    const n = r.noise('pink'), hp = biq('highpass', 2500), lp = biq('lowpass', 7500), g = gn(0.22);
    n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(r.out);
    lfo(r, 0.11, 0.08, g.gain);
    const w = r.noise('pink'), blp = biq('lowpass', 380), wg = gn(0.35);
    w.connect(blp); blp.connect(wg); wg.connect(r.out);
    lfo(r, 0.06, 0.2, wg.gain);
    r.every(() => { grain(r, { f: rr(5500, 9500), q: 1, dur: rr(0.01, 0.03), gain: rr(0.01, 0.05), p: rr(-1, 1) }); return rr(80, 500); });
  },

  fire(r) {
    const n = r.noise('brown'), lp = biq('lowpass', 420), g = gn(1.1);
    n.connect(lp); lp.connect(g); g.connect(r.out);
    lfo(r, 0.31, 0.25, g.gain); lfo(r, 0.13, 0.15, g.gain);
    const h = r.noise('pink'), hp = biq('highpass', 3200), hg = gn(0.05);
    h.connect(hp); hp.connect(hg); hg.connect(r.out);
    r.every(() => {
      const burst = R() < 0.25 ? 2 + Math.floor(R() * 4) : 1;
      for (let i = 0; i < burst; i++) grain(r, { f: rr(900, 6000), q: rr(1, 6), dur: rr(0.005, 0.03), gain: rr(0.2, 0.6), p: rr(-0.7, 0.7), t0: ctx.currentTime + i * rr(0.01, 0.05) });
      if (R() < 0.08) grain(r, { f: rr(250, 500), q: 1.5, dur: 0.09, gain: 0.8, p: rr(-0.5, 0.5), att: 0.004 });
      return rr(40, 260);
    });
  },

  waves(r) {
    const n = r.noise('pink'), lp = biq('lowpass', 800), g = gn(0.4);
    n.connect(lp); lp.connect(g); g.connect(r.out);
    lfo(r, 0.1, 0.35, g.gain); lfo(r, 0.1, 650, lp.frequency);
    const h = r.noise('white'), hp = biq('highpass', 3000), hl = biq('lowpass', 8000), hg = gn(0.05);
    h.connect(hp); hp.connect(hl); hl.connect(hg); hg.connect(r.out);
    lfo(r, 0.087, 0.045, hg.gain);
    const b = r.noise('brown'), blp = biq('lowpass', 160), bg = gn(0.4);
    b.connect(blp); blp.connect(bg); bg.connect(r.out);
  },

  stream(r) {
    const n = r.noise('pink'), bp = biq('bandpass', 1300, 0.5), g = gn(0.45);
    n.connect(bp); bp.connect(g); g.connect(r.out);
    const n2 = r.noise('pink'), bp2 = biq('bandpass', 3000, 0.8), g2 = gn(0.25);
    n2.connect(bp2); bp2.connect(g2); g2.connect(r.out);
    lfo(r, 0.23, 0.08, g.gain); lfo(r, 0.37, 400, bp.frequency);
    r.every(() => {
      const t = ctx.currentTime, o = ctx.createOscillator(), e = ctx.createGain(), f = rr(450, 1400), d = rr(0.04, 0.09);
      o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rr(1.4, 2.2), t + d);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(rr(0.03, 0.1), t + d * 0.3); e.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const pn = pan(rr(-0.8, 0.8)); o.connect(e); e.connect(pn); pn.connect(r.out);
      o.start(t); o.stop(t + d + 0.02); o.onended = () => { try { pn.disconnect(); } catch (e2) {} };
      return rr(18, 70);
    });
  },

  crickets(r) {
    const air = r.noise('pink'), alp = biq('lowpass', 900), ag = gn(0.04);
    air.connect(alp); alp.connect(ag); ag.connect(r.out);
    for (let i = 0; i < 6; i++) {
      const f = rr(4200, 5300), o = r.osc('sine', f), g = gn(0), p = pan(rr(-0.9, 0.9)), amp = rr(0.05, 0.11);
      const shaper = biq('peaking', f, 2); shaper.gain.value = 3;
      o.connect(g); g.connect(shaper); shaper.connect(p); p.connect(r.out);
      const period = rr(0.055, 0.085), pulses = 2 + Math.floor(R() * 4), gap = rr(0.25, 0.7);
      r.every(() => {
        const t = ctx.currentTime + 0.02;
        for (let k = 0; k < pulses; k++) {
          const tt = t + k * period;
          g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp, tt + 0.01); g.gain.linearRampToValueAtTime(0, tt + 0.034);
        }
        const rest = R() < 0.12 ? rr(2.5, 7) : gap * rr(0.85, 1.15);
        return (pulses * period + rest) * 1000;
      }, rr(0, 1500));
    }
  },

  thunder(r) {
    const roll = (t0, dur, gain) => {
      const s = r.shot('brown', t0, dur + 0.5), lp = biq('lowpass', 1000, 0.7), g = ctx.createGain();
      lp.frequency.setValueAtTime(rr(700, 1100), t0); lp.frequency.exponentialRampToValueAtTime(70, t0 + dur);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + rr(0.05, 0.5)); g.gain.setTargetAtTime(0, t0 + dur * 0.25, dur * 0.28);
      s.connect(lp); lp.connect(g); g.connect(r.out);
    };
    r.every(() => {
      const t = ctx.currentTime + 0.05, dur = rr(4, 8);
      if (R() < 0.5) grain(r, { f: rr(900, 2200), q: 0.8, dur: 0.25, gain: 0.55, att: 0.004, t0: t });
      roll(t, dur, rr(1.2, 2.0));
      const extra = 1 + Math.floor(R() * 3);
      for (let i = 0; i < extra; i++) roll(t + rr(0.8, 3) * (i + 1), rr(2.5, 5), rr(0.5, 1.2));
      return rr(14000, 32000);
    }, 2500);
  },

  owl(r) {
    const hoot = (t, f, dur, amp, p) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = gn(0.18), lp = biq('lowpass', 1100), pn = pan(p);
      o.type = 'sine'; o2.type = 'sine';
      o.frequency.setValueAtTime(f * 1.04, t); o.frequency.exponentialRampToValueAtTime(f * 0.93, t + dur);
      o2.frequency.setValueAtTime(f * 2.08, t); o2.frequency.exponentialRampToValueAtTime(f * 1.86, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.06); g.gain.setTargetAtTime(0, t + dur * 0.55, dur * 0.18);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(pn); pn.connect(r.out);
      o.start(t); o2.start(t); o.stop(t + dur + 0.6); o2.stop(t + dur + 0.6);
      o.onended = () => { try { pn.disconnect(); } catch (e) {} };
    };
    r.every(() => {
      const t = ctx.currentTime + 0.05, f = rr(330, 420), p = rr(-0.8, 0.8);
      hoot(t, f, 0.28, 0.5, p); hoot(t + 0.5, f * 0.97, 0.3, 0.45, p);
      if (R() < 0.7) hoot(t + 1.35, f * 0.92, 0.8, 0.5, p);
      return rr(9000, 22000);
    }, 3000);
  }
};

// har bir tovush uchun sozlangan daraja
const LVL = { white: 0.7, pink: 1, brown: 1, rain: 1, wind: 1, snow: 1, fire: 1, waves: 1, stream: 1.8, crickets: 1.7, thunder: 0.9, owl: 0.7 };
const curve = v => Math.pow(v, 1.6);

function start(id) {
  const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
  const rig = Rig(g);
  BUILD[id](rig);
  return (live[id] = { g, rig, kill: 0 });
}

async function apply(s) {
  state = s; C();
  const t = ctx.currentTime;
  if (s.playing && ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }
  master.gain.setTargetAtTime(s.playing ? curve(s.master) : 0, t, 0.25);

  for (const id of Object.keys(BUILD)) {
    const v = (s.vols && s.vols[id]) || 0, want = s.playing && v > 0, L = live[id];
    if (want) {
      const l = L || start(id);
      clearTimeout(l.kill); l.kill = 0;
      l.g.gain.setTargetAtTime(curve(v) * (LVL[id] || 1), t, 0.2);
    } else if (L) {
      L.g.gain.setTargetAtTime(0, t, 0.2);
      if (!L.kill) L.kill = setTimeout(() => {
        L.rig.stop(); try { L.g.disconnect(); } catch (e) {}
        if (live[id] === L) delete live[id];
      }, 1500);
    }
  }

  // taymer: faqat o'zgarganda qayta rejalanadi
  if (s.playing !== lastPlaying || s.timerEnd !== lastEnd) {
    clearTimeout(fadeT); clearTimeout(endT);
    fade.gain.cancelScheduledValues(t); fade.gain.setTargetAtTime(1, t, 0.2);
    if (s.playing && s.timerEnd > Date.now()) {
      const rem = s.timerEnd - Date.now(), fd = Math.min(15000, rem);
      fadeT = setTimeout(() => {
        const n = ctx.currentTime;
        fade.gain.cancelScheduledValues(n); fade.gain.setValueAtTime(fade.gain.value, n);
        fade.gain.linearRampToValueAtTime(0, n + fd / 1000);
      }, rem - fd);
      endT = setTimeout(() => chrome.runtime.sendMessage({ target: 'bg', type: 'ended' }).catch(() => {}), rem);
    }
    lastPlaying = s.playing; lastEnd = s.timerEnd;
  }

  clearTimeout(idleT);
  if (!s.playing) idleT = setTimeout(() => {
    if (state && !state.playing) { ctx.suspend().catch(() => {}); chrome.runtime.sendMessage({ target: 'bg', type: 'idle' }).catch(() => {}); }
  }, 1800);
}

function level() {
  const d = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(d);
  let s = 0, pk = 0; for (const x of d) { s += x * x; pk = Math.max(pk, Math.abs(x)); }
  return { rms: Math.sqrt(s / d.length), peak: pk, ctx: ctx.state, live: Object.keys(live) };
}

chrome.runtime.onMessage.addListener((m, _s, send) => {
  if (!m || m.target !== 'off') return;
  if (m.type === 'apply') apply(m.state).then(() => send({ ok: true }), e => send({ ok: false, error: String(e) }));
  else if (m.type === 'level') send(ctx ? level() : null);
  return true;
});
