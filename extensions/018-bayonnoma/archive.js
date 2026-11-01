let meetings = [], cur = null;
const tm = t => new Date(t).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const dt = t => new Date(t).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const text = m => m.lines.map(l => `[${tm(l.t)}] ${l.who ? l.who + ': ' : ''}${l.text}`).join('\n');
function side() {
  $('#side').innerHTML = meetings.map(m => `<div class="item ${cur?.id === m.id ? 'on' : ''}" data-id="${m.id}"><b class="small">${esc(m.title || 'Yig\'ilish')}</b><span class="muted small">${dt(m.start)} · ${m.lines.length} gap</span></div>`).join('') || '<div class="empty">Hali yozuv yo\'q</div>';
}
function show(m) {
  cur = m; side();
  const dur = m.end ? fmtDur(m.end - m.start) : 'davom etmoqda';
  const who = [...new Set(m.lines.map(l => l.who).filter(Boolean))];
  $('#main').innerHTML = `<div class="row between"><div><h2>${esc(m.title)}</h2><div class="muted small">${dt(m.start)} · ${dur} · ${who.length ? 'Ishtirokchilar: ' + esc(who.join(', ')) : ''}</div></div>
    <div class="row"><button id="sumGo">AI xulosa</button><button class="ghost" id="cp">Nusxalash</button><button class="ghost" id="dl">TXT</button><button class="ghost" id="md">Markdown</button><button class="danger" id="del">O'chirish</button></div></div>
    <div class="card" id="sumBox" ${m.summary ? '' : 'hidden'}><b>Xulosa</b><div id="sum">${esc(m.summary || '')}</div></div>
    <div>${m.lines.map(l => `<div class="line"><time>${tm(l.t)}</time>${l.who ? `<b>${esc(l.who)}:</b> ` : ''}${esc(l.text)}</div>`).join('') || '<div class="empty">Matn yozilmagan. Subtitrlar yoqilganini tekshiring.</div>'}</div>`;
  $('#cp').onclick = () => copyText(text(m));
  $('#dl').onclick = () => download(`bayonnoma-${m.id}.txt`, `${m.title}\n${dt(m.start)}\n\n${m.summary ? 'XULOSA\n' + m.summary + '\n\n' : ''}STENOGRAMMA\n${text(m)}`);
  $('#md').onclick = () => download(`bayonnoma-${m.id}.md`, `# ${m.title}\n\n*${dt(m.start)} · ${dur}*\n\n${m.summary ? '## Xulosa\n\n' + m.summary + '\n\n' : ''}## Stenogramma\n\n` + m.lines.map(l => `- **${tm(l.t)}** ${l.who ? '**' + l.who + ':** ' : ''}${l.text}`).join('\n'));
  let arm = false;
  $('#del').onclick = async () => { if (!arm) { arm = true; $('#del').textContent = 'Tasdiqlang'; return; } meetings = meetings.filter(x => x.id !== m.id); await store.set('meetings', meetings); cur = null; side(); $('#main').innerHTML = '<div class="empty">O\'chirildi</div>'; };
  $('#sumGo').onclick = async () => {
    if (!m.lines.length) return toast('Matn yo\'q');
    $('#sumGo').disabled = true; $('#sumGo').textContent = 'Tayyorlanmoqda…'; $('#sumBox').hidden = false; $('#sum').textContent = '…';
    try { m.summary = await askAI(SUMMARY_PROMPT(text(m).slice(0, 60000))); $('#sum').textContent = m.summary; await store.set('meetings', meetings); }
    catch (e) { $('#sum').textContent = 'Xato: ' + e.message; }
    $('#sumGo').disabled = false; $('#sumGo').textContent = 'AI xulosa';
  };
}
$('#side').onclick = e => { const it = e.target.closest('[data-id]'); if (it) show(meetings.find(m => m.id === +it.dataset.id)); };
$('#setBtn').onclick = async () => { $('#setBox').hidden = !$('#setBox').hidden; const c = await store.get('cfg', {}); $('#prov').value = c.provider || 'anthropic'; $('#key').value = c.key || ''; $('#model').value = c.model || ''; };
$('#setSave').onclick = async () => { await store.set('cfg', { provider: $('#prov').value, key: $('#key').value.trim(), model: $('#model').value.trim() }); toast('Saqlandi'); $('#setBox').hidden = true; };
store.get('meetings', []).then(ms => { meetings = ms; side(); if (ms[0]) show(ms[0]); });
chrome.storage.onChanged.addListener(c => { if (c.meetings) { meetings = c.meetings.newValue; side(); if (cur) { const n = meetings.find(m => m.id === cur.id); if (n && n.lines.length !== cur.lines.length) show(n); } } });
