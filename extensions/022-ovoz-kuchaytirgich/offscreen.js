const chains = {};
function set(c, gain, bass, comp) {
  c.gain.gain.value = gain;
  c.bass.gain.value = bass ? 9 : 0;
  c.gain.disconnect(); c.comp.disconnect();
  if (comp) { c.gain.connect(c.comp); c.comp.connect(c.ctx.destination); } else c.gain.connect(c.ctx.destination);
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.to !== 'off') return;
  (async () => {
    if (m.cmd === 'start') {
      if (chains[m.tabId]) { set(chains[m.tabId], m.gain, m.bass, m.comp); return reply(1); }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: m.streamId } } });
      const ctx = new AudioContext(), src = ctx.createMediaStreamSource(stream);
      const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 180;
      const gain = ctx.createGain(), comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.2;
      src.connect(bass); bass.connect(gain);
      chains[m.tabId] = { ctx, stream, gain, bass, comp }; set(chains[m.tabId], m.gain, m.bass, m.comp);
    }
    if (m.cmd === 'set' && chains[m.tabId]) set(chains[m.tabId], m.gain, m.bass, m.comp);
    if (m.cmd === 'stop' && chains[m.tabId]) { const c = chains[m.tabId]; c.stream.getTracks().forEach(t => t.stop()); c.ctx.close(); delete chains[m.tabId]; }
    reply(1);
  })().catch(e => reply({ error: e.message }));
  return true;
});
