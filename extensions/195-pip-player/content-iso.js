// ISOLATED world: sozlamalar va buyruqlarni sahifa (MAIN) skriptiga uzatadi
(() => {
  if (window.__pipxIso) return; window.__pipxIso = true;
  const DEF = { mode: 'document', auto: true, button: true, ask: true, unlock: true, autoReturn: true, win: null };
  const send = (name, obj) => window.dispatchEvent(new CustomEvent(name, { detail: JSON.stringify(obj) }));
  async function push() {
    try {
      const s = await chrome.storage.local.get(['pip_cfg', 'lang']);
      send('__pipx_cfg', { ...DEF, ...(s.pip_cfg || {}), lang: s.lang === 'ru' ? 'ru' : 'uz' });
    } catch (e) {}
  }
  push();
  try { chrome.storage.onChanged.addListener(push); } catch (e) {}
  try {
    chrome.runtime.onMessage.addListener(m => { if (m && m.type === 'toggle') send('__pipx_cmd', { type: 'toggle' }); });
  } catch (e) {}
  window.addEventListener('__pipx_save', async e => {
    try {
      const win = JSON.parse(e.detail), { pip_cfg } = await chrome.storage.local.get('pip_cfg');
      await chrome.storage.local.set({ pip_cfg: { ...(pip_cfg || {}), win } });
    } catch (err) {}
  });
})();
