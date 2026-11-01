const { $ } = App;
const DEF = { mode: 'document', auto: true, button: true, ask: true, unlock: true, autoReturn: true, win: null };
let cfg = { ...DEF };
const BOOLS = ['auto', 'autoReturn', 'button', 'ask', 'unlock'];

function fill() { $('#p-mode').value = cfg.mode; BOOLS.forEach(k => { $('#p-' + k).checked = !!cfg[k]; }); }

App.onReady(async () => {
  cfg = { ...DEF, ...(await App.get('pip_cfg', {})) }; fill();
  $('#go').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { App.toast(t('noTab'), 'err'); return; }
    chrome.tabs.sendMessage(tab.id, { type: 'toggle' }).then(() => window.close(), () => App.toast(t('noTab'), 'err'));
  });
  $('#p-save').addEventListener('click', async () => {
    cfg = { ...cfg, mode: $('#p-mode').value }; BOOLS.forEach(k => { cfg[k] = $('#p-' + k).checked; });
    await App.set('pip_cfg', cfg); App.toast(t('saved'), 'ok');
  });
  $('#p-reset').addEventListener('click', async () => { cfg.win = null; await App.set('pip_cfg', cfg); App.toast(t('resetDone'), 'ok'); });
});
