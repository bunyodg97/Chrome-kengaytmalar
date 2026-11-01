chrome.runtime.onMessage.addListener(m => {
  if (m.to !== 'off') return;
  const ac = new AudioContext(), seq = m.kind === 'end' ? [880, 0, 880, 0, 880, 0, 1175, 1175] : [660, 0, 880];
  seq.forEach((f, i) => { if (!f) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = 'sine'; o.connect(g); g.connect(ac.destination); const t = ac.currentTime + i * .18; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .02); g.gain.linearRampToValueAtTime(0, t + .17); o.start(t); o.stop(t + .18); });
  setTimeout(() => ac.close(), seq.length * 200 + 300);
});
