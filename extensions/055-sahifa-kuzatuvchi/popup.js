let mons = [];
const save = () => store.set('mons', mons);
const ago = t => { if (!t) return 'hali tekshirilmagan'; const s = (Date.now() - t) / 1000; return s < 60 ? 'hozirgina' : s < 3600 ? Math.round(s / 60) + ' daq oldin' : s < 86400 ? Math.round(s / 3600) + ' soat oldin' : Math.round(s / 86400) + ' kun oldin'; };
function diff(a, b) {
  const A = String(a).split(/(\s+)/), B = String(b).split(/(\s+)/); const n = A.length, m = B.length; if (n * m > 400000) return `<del>${esc(a.slice(0, 200))}</del> → <ins>${esc(b.slice(0, 200))}</ins>`;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1)); for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0, o = ''; while (i < n && j < m) { if (A[i] === B[j]) { o += esc(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) o += `<del>${esc(A[i++])}</del>`; else o += `<ins>${esc(B[j++])}</ins>`; }
  while (i < n) o += `<del>${esc(A[i++])}</del>`; while (j < m) o += `<ins>${esc(B[j++])}</ins>`; return o;
}
function render() {
  $('#list').innerHTML = mons.map((m, i) => `<div class="m ${m.unseen ? 'new' : ''}" data-i="${i}"><div class="row between"><input value="${esc(m.name || m.title)}" data-k="name" style="padding:3px 6px;font-weight:600;flex:1"><span class="chip ${m.paused ? '' : 'ok'}">${m.paused ? 'pauza' : 'har ' + (m.every >= 60 ? m.every / 60 + ' soat' : m.every + ' daq')}</span></div>
    <div class="tx">${esc(m.text.slice(0, 200))}</div><div class="small muted">${ago(m.lastCheck)}${m.err ? ` · <span style="color:var(--bad)">${esc(m.err)}</span>` : ''}${m.how === 'tab' ? ' · fon tabi orqali' : ''}</div>
    ${(m.changes || []).slice(0, 3).map(c => `<div class="ch"><span class="muted">${new Date(c.t).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}:</span> ${diff(c.old.slice(0, 600), c.new.slice(0, 600))}</div>`).join('')}
    <div class="row"><button class="ghost" data-a="check">Hozir tekshirish</button><button class="ghost" data-a="open">Ochish</button><button class="ghost" data-a="pause">${m.paused ? 'Davom' : 'Pauza'}</button><button class="danger" data-a="del">✕</button></div></div>`).join('') || '<div class="empty">Hali kuzatuv yo\'q. Kerakli sahifani ochib, yuqoridagi tugmani bosing.</div>';
}
$('#pick').onclick = async () => {
  const tab = await activeTab();
  await chrome.runtime.sendMessage({ cmd: 'pick', tabId: tab.id, every: +$('#every').value });
  window.close(); // tanlash sahifada davom etadi, natija fon jarayonida saqlanadi
};
$('#list').addEventListener('change', e => { const c = e.target.closest('[data-i]'); if (c && e.target.dataset.k) { mons[+c.dataset.i][e.target.dataset.k] = e.target.value; save(); } });
$('#list').addEventListener('click', async e => {
  const a = e.target.dataset.a; if (!a) return; const i = +e.target.closest('[data-i]').dataset.i, m = mons[i];
  if (a === 'del') mons.splice(i, 1); if (a === 'pause') m.paused = !m.paused; if (a === 'open') { chrome.tabs.create({ url: m.url }); m.unseen = 0; }
  if (a === 'check') { e.target.textContent = 'Tekshirilmoqda…'; await save(); mons = await chrome.runtime.sendMessage({ cmd: 'check', id: m.id }); render(); return; }
  await save(); render();
});
(async () => { mons = await store.get('mons', []); render(); mons.forEach(m => m.unseen = 0); setTimeout(() => { save(); chrome.action.setBadgeText({ text: '' }); }, 1500); })();
