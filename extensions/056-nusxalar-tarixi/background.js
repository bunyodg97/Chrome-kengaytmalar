importScripts('ru.js', 'about-bg.js');
const MAX = 100;
let q = Promise.resolve();
chrome.runtime.onMessage.addListener(m => {
  if (m.cmd !== 'clip') return;
  q = q.then(async () => {
    const { clips = [], off = false, skip = ['bank', 'click.uz', 'payme.uz', 'my.uzcard', 'humo'] } = await chrome.storage.local.get(['clips', 'off', 'skip']);
    if (off || skip.some(s => m.host.includes(s))) return;
    const text = m.text.slice(0, 20000); const old = clips.find(c => c.text === text);
    const rest = clips.filter(c => c.text !== text);
    const item = { id: old?.id || Date.now(), text, host: m.host, title: (m.title || '').slice(0, 80), t: Date.now(), pin: old?.pin || false };
    const pins = rest.filter(c => c.pin), others = rest.filter(c => !c.pin);
    await chrome.storage.local.set({ clips: [item, ...pins, ...others].slice(0, MAX + pins.length) });
  });
});
