const { $ } = App;
function reactInfo() {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const vs = [];
  if (hook && hook.renderers) hook.renderers.forEach(r => vs.push(r.version));
  if (!vs.length && window.React && window.React.version) vs.push(window.React.version);
  if (vs.length) return vs.join(', ');
  const els = document.querySelectorAll('body *');
  for (let i = 0; i < Math.min(els.length, 400); i++) if (Object.keys(els[i]).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))) return '?';
  return null;
}
async function status() {
  const s = $('#status');
  try {
    const v = await App.exec(reactInfo, [], 'MAIN');
    s.textContent = v ? t('detected', { v }) : t('notDetected');
    s.style.borderColor = v ? 'var(--ok)' : 'var(--warn)';
  } catch (e) { s.textContent = e.message; $('#pick').disabled = true; }
}
App.onReady(async () => {
  $('#editor').value = await App.get('editor', 'vscode');
  $('#editor').addEventListener('change', () => App.set('editor', $('#editor').value));
  $('#pick').addEventListener('click', async () => {
    const tab = await App.tab();
    try { await rfStart(tab.id); window.close(); } catch (e) { App.toast(e.message, 'err'); }
  });
  status();
});
App.onLang(status);
