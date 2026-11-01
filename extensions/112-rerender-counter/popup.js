const { $, h } = App;
let origin = null;
const ID = o => 'rr_' + o.replace(/[^a-z0-9]/gi, '_');

async function registered() {
  const list = await chrome.scripting.getRegisteredContentScripts();
  return list.filter(s => s.id.startsWith('rr_') && !s.id.endsWith('_l'));
}

async function unreg(id) {
  const all = (await chrome.scripting.getRegisteredContentScripts()).map(s => s.id);
  const ids = [id, id + '_l'].filter(x => all.includes(x));
  if (ids.length) await chrome.scripting.unregisterContentScripts({ ids });
}

async function render() {
  const tab = await App.tab();
  const ok = App.canRun(tab) && /^https?:/.test(tab.url);
  origin = ok ? new URL(tab.url).origin : null;
  $('#origin').textContent = origin || t('cantRunHere');
  const regs = await registered();
  const on = origin && regs.some(r => r.id === ID(origin));
  const b = $('#toggle');
  b.disabled = !origin;
  b.textContent = on ? t('disable') : t('enable');
  b.classList.toggle('danger', !!on);
  const S = $('#sites'); S.innerHTML = '';
  $('#sitesBox').classList.toggle('hidden', !regs.length);
  for (const r of regs) {
    const o = r.matches[0].replace(/\/\*$/, '');
    S.append(h('div', { class: 'row' }, h('span', { class: 'grow url small', text: o }),
      h('button', { class: 'btn ghost small', text: '✕', onclick: async () => { await unreg(r.id); render(); } })));
  }
}

App.onReady(async () => {
  $('#toggle').addEventListener('click', async () => {
    const tab = await App.tab();
    const id = ID(origin);
    const regs = await registered();
    try {
      if (regs.some(r => r.id === id)) {
        await unreg(id);
      } else {
        await App.requestOrigin(origin);
        const matches = [origin + '/*'];
        await chrome.scripting.registerContentScripts([
          { id, matches, js: ['hook.js'], runAt: 'document_start', world: 'MAIN', allFrames: false, persistAcrossSessions: true },
          { id: id + '_l', matches, js: ['lang.js'], runAt: 'document_start', allFrames: false, persistAcrossSessions: true }
        ]);
      }
      chrome.tabs.reload(tab.id);
      render();
    } catch (e) { App.toast(e.message, 'err'); }
  });
  render();
});
App.onLang(render);
