let sites = [];
const save = () => store.set('sites', sites);
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? Math.round(s) + ' s oldin' : s < 3600 ? Math.round(s / 60) + ' daq oldin' : Math.round(s / 3600) + ' soat oldin'; };
function render() {
  $('#list').innerHTML = sites.map((s, i) => {
    const h = (s.hist || []).filter(x => x.t > Date.now() - 864e5), up = h.length ? Math.round(h.filter(x => x.ok).length / h.length * 1000) / 10 : null, l = s.last;
    const avg = h.filter(x => x.ok).length ? Math.round(h.filter(x => x.ok).reduce((a, x) => a + x.ms, 0) / h.filter(x => x.ok).length) : null;
    const bars = (s.hist || []).slice(-60), mx = Math.max(...bars.map(b => b.ms), 1);
    return `<div class="s ${!l ? '' : l.ok ? 'ok' : 'down'}" data-i="${i}"><div class="row between"><b class="small">${esc(s.name || new URL(s.url).host)}</b><span class="chip ${!l ? '' : l.ok ? 'ok' : 'bad'}">${!l ? 'kutilmoqda' : l.ok ? `ishlayapti · ${l.ms} ms` : 'ISHLAMAYAPTI'}</span></div>
      <div class="small muted" style="word-break:break-all">${esc(s.url)}</div>
      ${l && !l.ok ? `<div class="small" style="color:var(--bad)">${esc(l.why)}${s.downSince ? ' · ' + ago(s.downSince) + 'dan beri' : ''}</div>` : ''}
      <div class="bars" title="Oxirgi 60 ta tekshiruv">${bars.map(b => `<i class="${b.ok ? '' : 'x'}" style="height:${Math.max(10, b.ms / mx * 100)}%" title="${new Date(b.t).toLocaleTimeString('uz-UZ')}: ${b.ok ? b.ms + ' ms' : 'xato'}"></i>`).join('')}</div>
      <div class="row between small muted"><span>24 soat: ${up != null ? up + '%' : '—'} · o'rtacha ${avg != null ? avg + ' ms' : '—'} · har ${s.every} daq${l ? ' · ' + ago(l.t) : ''}</span>
        <span class="row"><button class="ghost" data-a="run">↻</button><button class="ghost" data-a="pause">${s.paused ? '▶' : '⏸'}</button><button class="ghost" data-a="del">✕</button></span></div></div>`; }).join('') || '<div class="empty">Kuzatiladigan sayt qo\'shing.</div>';
}
$('#f').onsubmit = async e => {
  e.preventDefault(); let u = $('#url').value.trim(); if (!/^https?:\/\//.test(u)) u = 'https://' + u;
  try { new URL(u); } catch { return toast('Manzil noto\'g\'ri'); }
  sites.push({ id: Date.now(), url: u, name: $('#name').value.trim(), kw: $('#kw').value.trim(), every: +$('#every').value, hist: [] }); await save(); $('#f').reset(); render();
  await chrome.runtime.sendMessage({ cmd: 'run', id: sites.at(-1).id }); sites = await store.get('sites', []); render();
};
$('#list').onclick = async e => { const a = e.target.dataset.a; if (!a) return; const i = +e.target.closest('[data-i]').dataset.i;
  if (a === 'del') { sites.splice(i, 1); await save(); } if (a === 'pause') { sites[i].paused = !sites[i].paused; await save(); }
  if (a === 'run') { e.target.textContent = '…'; await chrome.runtime.sendMessage({ cmd: 'run', id: sites[i].id }); sites = await store.get('sites', []); } render(); };
$('#all').onclick = async () => { $('#all').disabled = true; await chrome.runtime.sendMessage({ cmd: 'run' }); sites = await store.get('sites', []); render(); $('#all').disabled = false; };
$('#tgs').onclick = async () => { const tg = { token: $('#tgt').value.trim(), chat: $('#tgc').value.trim() }; await store.set('tg', tg);
  try { const r = await (await fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: tg.chat, text: '✅ Sayt Nazoratchisi ulandi' }) })).json(); toast(r.ok ? 'Telegram ulandi' : 'Xato: ' + r.description); } catch { toast('Yuborib bo\'lmadi'); } };
(async () => { sites = await store.get('sites', []); const tg = await store.get('tg', {}); $('#tgt').value = tg.token || ''; $('#tgc').value = tg.chat || ''; render(); setInterval(async () => { sites = await store.get('sites', []); render(); }, 5000); })();
