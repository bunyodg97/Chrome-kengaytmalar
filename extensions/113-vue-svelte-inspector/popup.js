const { $ } = App;
function fwInfo() {
  const out = [];
  if (window.Vue && window.Vue.version) out.push('Vue ' + window.Vue.version);
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 2000);
  const v3 = els.find(e => e.__vue_app__ || e.__vueParentComponent);
  if (v3 && !out.length) out.push('Vue ' + ((v3.__vue_app__ && v3.__vue_app__.version) || '3'));
  if (!out.length && els.some(e => e.__vue__)) out.push('Vue 2');
  if (window.__svelte && window.__svelte.v) out.push('Svelte ' + Array.from(window.__svelte.v).join('/'));
  else if (els.some(e => e.__svelte_meta)) out.push('Svelte (dev)');
  return out.join(', ');
}
async function status() {
  const s = $('#status');
  try {
    const v = await App.exec(fwInfo, [], 'MAIN');
    s.textContent = v ? t('found', { v }) : t('notFound');
    s.style.borderColor = v ? 'var(--ok)' : 'var(--warn)';
  } catch (e) { s.textContent = e.message; $('#pick').disabled = true; }
}
App.onReady(async () => {
  $('#editor').value = await App.get('editor', 'vscode');
  $('#editor').addEventListener('change', () => App.set('editor', $('#editor').value));
  $('#pick').addEventListener('click', async () => {
    const tab = await App.tab();
    try { await vsStart(tab.id); window.close(); } catch (e) { App.toast(e.message, 'err'); }
  });
  status();
});
App.onLang(status);
