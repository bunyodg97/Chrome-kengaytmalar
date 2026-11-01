const { $ } = App;
let repo = null;
async function info() {
  const tab = await App.tab();
  repo = repoOf(tab && tab.url || '');
  $('#repo').textContent = repo ? t('repo', { r: repo.owner + '/' + repo.repo }) : t('notRepo');
  $('#go').disabled = !repo;
  if (repo) {
    try { const s = await App.exec(() => String(getSelection()).trim()); const m = s.match(/^[A-Za-z_$][\w$]*$/); if (m && !$('#q').value) $('#q').value = m[0]; } catch (e) {}
  }
}
App.onReady(async () => {
  $('#newTab').checked = await App.get('newTab', false);
  $('#mode').value = await App.get('mode', 'symbol');
  $('#newTab').addEventListener('change', () => App.set('newTab', $('#newTab').checked));
  $('#mode').addEventListener('change', () => App.set('mode', $('#mode').value));
  const go = async () => {
    const n = $('#q').value.trim();
    if (!n || !repo) return;
    chrome.tabs.create({ url: defUrl(repo.owner, repo.repo, n, await App.get('mode', 'symbol')) });
  };
  $('#go').addEventListener('click', go);
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  info();
});
App.onLang(info);
