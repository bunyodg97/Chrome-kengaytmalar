// prefers-color-scheme emulyatsiyasi chrome.debugger orqali.
const attached = new Set();

async function emulate(tabId, value) {
  const target = { tabId };
  if (value === 'auto') {
    if (attached.has(tabId)) {
      try { await chrome.debugger.detach(target); } catch (e) {}
      attached.delete(tabId);
    }
  } else {
    if (!attached.has(tabId)) {
      try { await chrome.debugger.attach(target, '1.3'); } catch (e) { if (!/already attached/i.test(e.message)) throw e; }
      attached.add(tabId);
    }
    await chrome.debugger.sendCommand(target, 'Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value }]
    });
  }
  const s = (await chrome.storage.session.get('emu')).emu || {};
  if (value === 'auto') delete s[tabId]; else s[tabId] = value;
  await chrome.storage.session.set({ emu: s });
}

chrome.debugger.onDetach.addListener(async (src) => {
  attached.delete(src.tabId);
  const s = (await chrome.storage.session.get('emu')).emu || {};
  delete s[src.tabId];
  await chrome.storage.session.set({ emu: s });
});

chrome.tabs.onRemoved.addListener(tabId => attached.delete(tabId));

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'emulate') {
    emulate(msg.tabId, msg.value).then(() => reply({ ok: true }), e => reply({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === 'state') {
    chrome.storage.session.get('emu').then(o => reply((o.emu || {})[msg.tabId] || 'auto'));
    return true;
  }
});

chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== 'cycle' || !tab || !/^(https?|file):/.test(tab.url || '')) return;
  const cur = ((await chrome.storage.session.get('emu')).emu || {})[tab.id] || 'auto';
  const next = { auto: 'dark', dark: 'light', light: 'auto' }[cur];
  try { await emulate(tab.id, next); } catch (e) { console.warn(e); }
});
