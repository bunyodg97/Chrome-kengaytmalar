tabsInit();
const IC = { PullRequest: '⤴', Issue: '◎', Release: '🏷', Commit: '●', Discussion: '💬', CheckSuite: '✓' };
const RS = { review_requested: 'review so\'raldi', mention: 'tilga olindi', author: 'muallif', comment: 'izoh', assign: 'tayinlandi', subscribed: 'kuzatilmoqda', state_change: 'holat o\'zgardi', ci_activity: 'CI', team_mention: 'jamoa tilga olindi' };
const ago = t => { const s = (Date.now() - new Date(t)) / 1000; return s < 3600 ? Math.round(s / 60) + ' daq oldin' : s < 86400 ? Math.round(s / 3600) + ' soat oldin' : Math.round(s / 86400) + ' kun oldin'; };
async function renderN() {
  const { notes = [], err = '' } = await chrome.storage.local.get(['notes', 'err']);
  const list = $('#unread').checked ? notes.filter(n => n.unread) : notes;
  $('#cn').textContent = notes.filter(n => n.unread).length || ''; $('#err').textContent = err;
  const by = {}; list.forEach(n => (by[n.repository.full_name] = by[n.repository.full_name] || []).push(n));
  $('#nl').innerHTML = Object.entries(by).map(([r, ns]) => `<div class="repo">${esc(r)}</div>` + ns.map(n => `<div class="n ${n.unread ? '' : 'read'}" data-id="${n.id}"><span class="ic">${IC[n.subject.type] || '•'}</span><div class="t"><b>${esc(n.subject.title)}</b><span>${RS[n.reason] || n.reason} · ${ago(n.updated_at)}</span></div>${n.unread ? '<button class="ghost" data-read="' + n.id + '" title="O\'qildi">✓</button>' : ''}</div>`).join('')).join('') || '<div class="empty">Yangi bildirishnoma yo\'q 🎉</div>';
}
async function search(q, box) {
  $(box).innerHTML = '<div class="empty">Yuklanmoqda…</div>';
  try { const r = await gh('/search/issues?per_page=30&q=' + encodeURIComponent(q));
    $(box).innerHTML = r.items.map(i => `<div class="n" data-url="${esc(i.html_url)}"><span class="ic">${i.draft ? '◌' : '⤴'}</span><div class="t"><b>${esc(i.title)}</b><span>${esc(i.repository_url.split('/').slice(-2).join('/'))} #${i.number} · ${ago(i.updated_at)}${i.comments ? ' · 💬 ' + i.comments : ''}</span></div></div>`).join('') || '<div class="empty">Yo\'q</div>';
  } catch (e) { $(box).innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
document.addEventListener('click', async e => {
  const rd = e.target.dataset.read; if (rd) { e.stopPropagation(); await gh('/notifications/threads/' + rd, { method: 'PATCH' }).catch(() => {}); await chrome.runtime.sendMessage({ cmd: 'poll' }); return renderN(); }
  const n = e.target.closest('.n'); if (!n) return;
  if (n.dataset.url) return chrome.tabs.create({ url: n.dataset.url });
  const { notes = [] } = await chrome.storage.local.get('notes'); const x = notes.find(k => k.id === n.dataset.id);
  if (x) { chrome.tabs.create({ url: htmlUrl(x) }); gh('/notifications/threads/' + x.id, { method: 'PATCH' }).then(() => chrome.runtime.sendMessage({ cmd: 'poll' })).catch(() => {}); }
});
$('.tabs').addEventListener('click', e => { const t = e.target.closest('[data-tab]')?.dataset.tab; if (t === 'mine') search('is:pr is:open author:@me', '#ml'); if (t === 'rev') search('is:pr is:open review-requested:@me', '#rl'); });
$('#unread').onchange = renderN;
$('#all').onclick = async () => { await gh('/notifications', { method: 'PUT', body: JSON.stringify({ last_read_at: new Date().toISOString() }) }).catch(() => {}); await chrome.runtime.sendMessage({ cmd: 'poll' }); renderN(); };
$('#rf').onclick = async () => { $('#rf').disabled = true; await chrome.runtime.sendMessage({ cmd: 'poll' }); renderN(); $('#rf').disabled = false; };
$('#save').onclick = async () => { await store.set('token', $('#token').value.trim()); await chrome.runtime.sendMessage({ cmd: 'poll' }); init(); };
$('#logout').onclick = async e => { e.preventDefault(); await chrome.storage.local.remove(['token', 'notes']); chrome.action.setBadgeText({ text: '' }); init(); };
$('#notify').onchange = e => store.set('notify', e.target.checked);
async function init() {
  const { token, notify = true } = await chrome.storage.local.get(['token', 'notify']);
  $('#setup').hidden = !!token; $('#main').hidden = !token; $('#notify').checked = notify;
  if (token) renderN();
}
init();
