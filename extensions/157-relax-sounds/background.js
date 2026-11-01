importScripts('presets.js');

let chain = Promise.resolve();
const queue = fn => (chain = chain.then(fn, fn));

async function load() {
  const { rs } = await chrome.storage.local.get('rs');
  return { ...structuredClone(DEFAULT_STATE), ...(rs || {}) };
}
const hasOff = async () => (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;

async function push(s) {
  if (s.playing && !(await hasOff())) {
    await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Play relaxing ambient sounds in the background' });
  }
  if (await hasOff()) {
    try { await chrome.runtime.sendMessage({ target: 'off', type: 'apply', state: s }); } catch (e) {}
  }
  chrome.action.setBadgeText({ text: s.playing ? '♪' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#364fc7' });
}

function patch(p) {
  return queue(async () => {
    const s = { ...(await load()), ...p };
    if ('playing' in p) {
      if (s.playing && !Object.values(s.vols).some(v => v > 0)) s.vols = { ...PRESETS.summer };
      if (s.playing && !('timerEnd' in p)) s.timerEnd = s.timerMin ? Date.now() + s.timerMin * 60000 : 0;
      if (!s.playing) s.timerEnd = 0;
    }
    await chrome.storage.local.set({ rs: s });
    await push(s);
    return s;
  });
}

chrome.runtime.onMessage.addListener((m, _s, send) => {
  if (!m || m.target === 'off') return;
  if (m.type === 'get') { load().then(send); return true; }
  if (m.type === 'patch') { patch(m.patch).then(send); return true; }
  if (m.type === 'ended') { patch({ playing: false }).then(send); return true; }
  if (m.type === 'idle') {
    queue(async () => { const s = await load(); if (!s.playing && (await hasOff())) await chrome.offscreen.closeDocument(); });
  }
});

chrome.commands.onCommand.addListener(async cmd => {
  if (cmd === 'toggle') { const s = await load(); patch({ playing: !s.playing }); }
});

// brauzer qayta ochilganda ovoz o'chiq holatda boshlanadi
chrome.runtime.onStartup.addListener(() => patch({ playing: false }));
