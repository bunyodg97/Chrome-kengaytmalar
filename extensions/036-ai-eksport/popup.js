let chat = null;
const ROLE = { user: 'Siz', ai: 'AI' };
const fname = ext => (chat.title || 'suhbat').replace(/[\\/:*?"<>|]+/g, '').slice(0, 60) + '.' + ext;
const msgs = () => $('#onlyAi').checked ? chat.msgs.filter(m => m.role === 'ai') : chat.msgs;
const md = () => `# ${chat.title}\n\n*${new Date(chat.t).toLocaleString('uz-UZ')} · ${chat.site}*\n\n` + msgs().map(m => `## ${ROLE[m.role]}\n\n${m.role === 'ai' ? toMd(m.html) : m.text}`).join('\n\n---\n\n') + '\n';
(async () => {
  const tab = await activeTab();
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractChat }); chat = r.result; } catch { }
  if (!chat || !chat.msgs.length) { $('#info').innerHTML = '<b>Suhbat topilmadi</b><div class="muted small">AI chat sahifasida suhbatni oching.</div>'; $$('button[data-f]').forEach(b => b.disabled = true); return; }
  const u = chat.msgs.filter(m => m.role === 'user').length;
  $('#info').innerHTML = `<b>${esc(chat.title)}</b><div class="muted small">${chat.msgs.length} ta xabar (${u} savol, ${chat.msgs.length - u} javob) · ${esc(chat.site)}</div>`;
})();
document.addEventListener('click', async e => {
  const f = e.target.dataset.f; if (!f || !chat) return;
  if (f === 'md') download(fname('md'), md(), 'text/markdown');
  if (f === 'copy') copyText(md());
  if (f === 'txt') download(fname('txt'), `${chat.title}\n${chat.url}\n\n` + msgs().map(m => `=== ${ROLE[m.role]} ===\n${m.text}`).join('\n\n'));
  if (f === 'json') download(fname('json'), JSON.stringify({ ...chat, msgs: msgs().map(m => ({ role: m.role, text: m.text, markdown: m.role === 'ai' ? toMd(m.html) : m.text })) }, null, 2), 'application/json');
  if (f === 'pdf') { await chrome.storage.session.set({ print: { ...chat, msgs: msgs() } }); chrome.tabs.create({ url: 'print.html' }); }
});
