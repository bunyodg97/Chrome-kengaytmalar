let list = [], tab, flt = '';
const ICON = { xato: '⛔', promise: '⏳', console: '🟡', resurs: '📦' };
function render() { const a = list.filter(x => !flt || x.kind === flt).slice().reverse();
  $('#list').innerHTML = a.length ? a.map((x, i) => `<div class="item e" data-i="${list.indexOf(x)}"><div class="m">${ICON[x.kind]} ${esc(x.msg)}${x.n > 1 ? ` <span class="chip warn">×${x.n}</span>` : ''}</div><div class="s">${esc(x.src || '')} · ${new Date(x.t).toLocaleTimeString('uz')}${x.frame ? ' · iframe' : ''}</div>${x.stack ? `<pre>${esc(x.stack)}</pre>` : ''}</div>`).join('') : '<div class="empty">✓ Bu sahifada xato yo\'q</div>'; }
const txt = x => `[${x.kind}] ${x.msg}${x.n > 1 ? ` (×${x.n})` : ''}\n${x.src || ''}\n${x.stack || ''}`.trim();
$('#list').onclick = e => { const it = e.target.closest('.e'); if (!it) return; if (e.detail === 2) copyText(txt(list[+it.dataset.i])); else it.classList.toggle('open'); };
$$('#f button').forEach(b => b.onclick = () => { flt = b.dataset.k; $$('#f button').forEach(x => x.classList.toggle('on', x === b)); render(); });
$('#cp').onclick = () => copyText(`${tab.url}\n\n` + list.map(txt).join('\n\n---\n\n'));
$('#clr').onclick = async () => { await chrome.storage.session.remove('tab' + tab.id); chrome.action.setBadgeText({ tabId: tab.id, text: '' }); list = []; render(); };
$('#sv').onclick = () => { chrome.storage.local.set({ ignore: $('#ign').value.split('\n').map(s => s.trim()).filter(Boolean), tg: { token: $('#tok').value.trim(), chat: $('#chat').value.trim() }, tgHosts: $('#hosts').value.split(',').map(s => s.trim()).filter(Boolean) }); toast('Saqlandi'); };
(async () => { tab = await activeTab(); list = (await chrome.storage.session.get('tab' + tab.id))['tab' + tab.id] || []; render();
  const c = await chrome.storage.local.get(['ignore', 'tg', 'tgHosts']); $('#ign').value = (c.ignore || []).join('\n'); $('#tok').value = c.tg?.token || ''; $('#chat').value = c.tg?.chat || ''; $('#hosts').value = (c.tgHosts || []).join(', '); })();
