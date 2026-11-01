let groups = [];
const save = () => store.set('groups', groups);
const fmt = t => new Date(t).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function render() {
  const q = $('#q').value.trim().toLowerCase();
  const total = groups.reduce((a, g) => a + g.tabs.length, 0);
  $('#sum').textContent = `${groups.length} guruh, ${total} ta saqlangan havola`;
  const box = $('#groups'); box.innerHTML = '';
  if (!groups.length) { box.innerHTML = '<div class="empty">Hali hech narsa saqlanmagan. Kengaytma tugmasini bosib, tablarni yig\'ing.</div>'; return; }
  groups.forEach((g, gi) => {
    const tabs = g.tabs.map((t, ti) => ({ ...t, ti })).filter(t => !q || (t.title + ' ' + t.url).toLowerCase().includes(q));
    if (q && !tabs.length) return;
    const el = document.createElement('div'); el.className = 'card';
    el.innerHTML = `<div class="g-head">
        <input class="g-name" value="${esc(g.name)}" placeholder="${g.tabs.length} ta tab · ${fmt(g.created)}">
        ${g.locked ? '<span class="chip acc">qulflangan</span>' : ''}
        <button class="ghost" data-a="restore">Hammasini ochish</button>
        <button class="ghost" data-a="window">Yangi oynada</button>
        <button class="ghost" data-a="lock">${g.locked ? 'Qulfni ochish' : 'Qulflash'}</button>
        <button class="ghost" data-a="del">O'chirish</button></div>
      <div class="muted small">${g.tabs.length} ta tab · ${fmt(g.created)}${g.locked ? ' · ochilganda ro\'yxatdan o\'chmaydi' : ''}</div>
      <div>${tabs.map(t => `<div class="link" data-ti="${t.ti}">${t.fav ? `<img src="${esc(t.fav)}" alt="">` : '<span class="ph"></span>'}
        <a href="${esc(t.url)}" title="${esc(t.url)}">${esc(t.title)}</a><button class="x" data-a="rm" title="O'chirish">✕</button></div>`).join('')}</div>`;
    el.querySelector('.g-name').onchange = e => { g.name = e.target.value; save(); };
    el.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      const link = e.target.closest('.link');
      if (e.target.tagName === 'A') {
        e.preventDefault(); chrome.tabs.create({ url: e.target.href, active: false });
        if (!g.locked) { g.tabs.splice(+link.dataset.ti, 1); if (!g.tabs.length) groups.splice(gi, 1); save(); render(); }
        return;
      }
      if (a === 'rm') { g.tabs.splice(+link.dataset.ti, 1); if (!g.tabs.length) groups.splice(gi, 1); }
      if (a === 'restore') { g.tabs.forEach(t => chrome.tabs.create({ url: t.url, active: false })); if (!g.locked) groups.splice(gi, 1); }
      if (a === 'window') { chrome.windows.create({ url: g.tabs.map(t => t.url) }); if (!g.locked) groups.splice(gi, 1); }
      if (a === 'lock') g.locked = !g.locked;
      if (a === 'del') { if (g.locked) return toast('Avval qulfni oching'); groups.splice(gi, 1); }
      if (a) { save(); render(); }
    });
    box.appendChild(el);
  });
}
$('#q').oninput = render;
$('#exp').onclick = () => download('tablar.txt', groups.map(g => `# ${g.name || fmt(g.created)}\n` + g.tabs.map(t => `${t.url} | ${t.title}`).join('\n')).join('\n\n'));
$('#imp').onclick = () => $('#impBox').hidden = false;
$('#impX').onclick = () => $('#impBox').hidden = true;
$('#impGo').onclick = () => {
  const tabs = $('#impText').value.split('\n').map(l => l.trim()).filter(l => /^https?:\/\//.test(l)).map(l => { const [url, ...t] = l.split(' | '); return { url: url.trim(), title: t.join(' | ') || url, fav: '' }; });
  if (!tabs.length) return toast('Havola topilmadi');
  groups.unshift({ id: Date.now(), name: 'Import', created: Date.now(), locked: false, tabs }); save(); render();
  $('#impText').value = ''; $('#impBox').hidden = true; toast(tabs.length + ' ta havola qo\'shildi');
};
chrome.storage.onChanged.addListener(c => { if (c.groups) { groups = c.groups.newValue || []; render(); } });
store.get('groups', []).then(g => { groups = g; render(); });
