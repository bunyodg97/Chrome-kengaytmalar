const { $, h } = App;
let libs = null, page = '';

function issues() {
  const out = [];
  for (const l of libs) for (const v of (checkLib(l) || [])) out.push(Object.assign({ libVer: l.version }, v));
  const ord = { high: 0, medium: 1, info: 2 };
  return out.sort((a, b) => ord[a.sev] - ord[b.sev]);
}

function render() {
  if (!libs) return;
  const list = issues();
  const real = list.filter(x => x.sev !== 'info').length;
  $('#head').innerHTML = '';
  $('#head').append(h('div', { class: 'big ' + (real ? 'bad' : 'ok'), text: real ? t('found', { n: real }) : t('ok') }));
  const L = $('#list'); L.innerHTML = '';
  for (const v of list) {
    const npm = NPM_NAME[v.lib];
    L.append(h('div', { class: 'vl ' + v.sev },
      h('div', { class: 'row' }, h('b', { class: 'grow', text: v.lib + ' ' + v.libVer }), h('span', { class: 'badge ' + (v.sev === 'high' ? 'bad' : v.sev === 'medium' ? 'warn' : ''), text: t(v.sev) })),
      h('div', { text: I18N.lang === 'ru' ? v.ru : v.uz }),
      h('div', { class: 'row small muted' },
        v.id.startsWith('CVE') ? h('a', { class: 'id', href: 'https://nvd.nist.gov/vuln/detail/' + v.id.split(' ')[0], target: '_blank', text: v.id }) : h('span', { class: 'id', text: v.id }),
        h('span', { text: '· ' + t('fixIn', { v: v.fix }) }),
        npm ? h('a', { href: 'https://security.snyk.io/package/npm/' + encodeURIComponent(npm), target: '_blank', text: 'Snyk' }) : null)));
  }
  $('#libsBox').classList.toggle('hidden', !libs.length);
  const T = $('#libs'); T.innerHTML = '';
  for (const l of libs) {
    const c = checkLib(l);
    const bad = c && c.some(x => x.sev !== 'info');
    T.append(h('tr', {}, h('td', { text: l.name }), h('td', { class: 'mono', text: l.version || '?' }),
      h('td', {}, h('span', { class: 'badge ' + (c == null ? '' : bad ? 'bad' : 'ok'), text: c == null ? '?' : bad ? '⚠' : t('clean') }))));
  }
  $('#copy').classList.toggle('hidden', !list.length);
}

App.onReady(() => {
  $('#scan').addEventListener('click', async () => {
    try {
      libs = await App.exec(detectLibs, [], 'MAIN');
      const tab = await App.tab();
      page = tab.url;
      const n = issues().filter(x => x.sev !== 'info').length;
      chrome.action.setBadgeText({ tabId: tab.id, text: n ? String(n) : '✓' });
      chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: n ? '#c92a2a' : '#2b8a3e' });
      render();
    } catch (e) { App.toast(e.message, 'err'); }
  });
  $('#copy').addEventListener('click', () => {
    const lines = [page, ''];
    for (const v of issues()) lines.push(`- [${v.sev.toUpperCase()}] ${v.lib} ${v.libVer}: ${v.id} — ${I18N.lang === 'ru' ? v.ru : v.uz} (${t('fixIn', { v: v.fix })})`);
    App.copy(lines.join('\n'));
  });
});
App.onLang(render);
