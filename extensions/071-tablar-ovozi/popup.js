let cur = null;
async function render() {
  const all = $('#allT').checked, vols = (await chrome.storage.session.get('vols')).vols || {};
  const tabs = (await chrome.tabs.query({})).filter(t => all ? /^https?:/.test(t.url || '') : t.audible || t.mutedInfo?.muted || (vols[t.id] != null && vols[t.id] !== 1));
  tabs.sort((a, b) => (b.audible - a.audible) || (a.windowId - b.windowId) || a.index - b.index);
  $('#list').innerHTML = tabs.length ? tabs.map(t => { const v = Math.round((vols[t.id] ?? 1) * 100); return `<div class="item t ${t.id === cur ? 'cur' : ''}" data-id="${t.id}" data-w="${t.windowId}">
    <img src="${esc(t.favIconUrl || 'icons/16.png')}" alt=""><span class="n" title="${esc(t.title)}">${t.audible && !t.mutedInfo?.muted ? '<span class="eq">♪</span> ' : ''}${esc(t.title || t.url)}</span>
    <span class="row" style="gap:2px"><button class="ghost m" title="${t.mutedInfo?.muted ? 'Yoqish' : 'O\'chirish'}">${t.mutedInfo?.muted ? '🔇' : '🔊'}</button><button class="ghost s" title="Faqat shu tab">◉</button></span>
    <div class="r"><input type="range" min="0" max="100" step="5" value="${v}"><span class="p">${v}%</span></div></div>`; }).join('')
    : `<div class="empty">Hozir ovoz chiqarayotgan tab yo'q. «Barcha tablar» ni belgilang.</div>`;
  $$('#list img').forEach(i => i.onerror = () => i.src = 'icons/16.png');
}
$('#list').onclick = async e => {
  const it = e.target.closest('.item'); if (!it) return; const id = +it.dataset.id;
  if (e.target.closest('.m')) { const t = await chrome.tabs.get(id); await chrome.tabs.update(id, { muted: !t.mutedInfo.muted }); render(); }
  else if (e.target.closest('.s')) { await chrome.runtime.sendMessage({ type: 'solo', tabId: id }); setTimeout(render, 150); }
  else if (e.target.closest('.n')) { chrome.tabs.update(id, { active: true }); chrome.windows.update(+it.dataset.w, { focused: true }); }
};
$('#list').oninput = e => { if (e.target.type !== 'range') return; const it = e.target.closest('.item'); it.querySelector('.p').textContent = e.target.value + '%'; chrome.runtime.sendMessage({ type: 'vol', tabId: +it.dataset.id, v: e.target.value / 100 }); };
$('#muteAll').onclick = async () => { for (const t of await chrome.tabs.query({ audible: true })) await chrome.tabs.update(t.id, { muted: true }); render(); };
$('#unAll').onclick = async () => { for (const t of await chrome.tabs.query({ muted: true })) await chrome.tabs.update(t.id, { muted: false }); render(); };
$('#allT').onchange = () => { store.set('allT', $('#allT').checked); render(); };
(async () => { $('#allT').checked = await store.get('allT', false); cur = (await activeTab())?.id; render(); setInterval(() => { if (!document.activeElement?.matches('input[type=range]')) render(); }, 2000); })();
