let tab, buf = { con: [], net: [] }, env = {}, img = null, strokes = [], dst = 'tg';
const cv = $('#cv'), cx = cv.getContext('2d');
function paint() { if (!img) return; cx.drawImage(img, 0, 0); cx.strokeStyle = '#e53935'; cx.lineWidth = Math.max(3, img.width / 250); cx.lineCap = cx.lineJoin = 'round'; strokes.forEach(s => { cx.beginPath(); s.forEach((p, i) => i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y)); cx.stroke(); }); }
const P = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); strokes.push([P(e)]); }; cv.onpointermove = e => { if (e.buttons && strokes.length) { strokes[strokes.length - 1].push(P(e)); paint(); } };
$('#undo').onclick = () => { strokes.pop(); paint(); };
const tm = t => new Date(t).toLocaleTimeString('uz', { hour12: false });
function report(md = true) {
  const errs = buf.con.filter(c => c.l === 'error'), b = md ? '```' : '';
  return `${md ? '## ' : ''}🐞 ${$('#title').value || 'Xato hisoboti'}\n\n${$('#desc').value ? $('#desc').value + '\n\n' : ''}${md ? '**' : ''}Sahifa:${md ? '**' : ''} ${env.url}\n${md ? '**' : ''}Vaqt:${md ? '**' : ''} ${new Date().toLocaleString('uz')}\n${md ? '**' : ''}Brauzer:${md ? '**' : ''} ${env.ua}\n${md ? '**' : ''}Ekran:${md ? '**' : ''} ${env.vp} (dpr ${env.dpr}) · til ${env.lang}\n\n` +
    `${md ? '### ' : ''}Konsol xatolari (${errs.length})\n${b}\n${errs.slice(-15).map(c => `[${tm(c.t)}] ${c.m}`).join('\n') || '—'}\n${b}\n\n${md ? '### ' : ''}Muvaffaqiyatsiz so'rovlar (${buf.net.length})\n${b}\n${buf.net.slice(-15).map(n => `[${tm(n.t)}] ${n.m} ${n.s} ${n.u}${n.d ? ` (${n.d}ms)` : ''}${n.b ? '\n   ' + n.b.slice(0, 200).replace(/\n/g, ' ') : ''}`).join('\n') || '—'}\n${b}`;
}
const fullLog = () => JSON.stringify({ env, console: buf.con.map(c => ({ ...c, time: new Date(c.t).toISOString() })), network: buf.net.map(n => ({ ...n, time: new Date(n.t).toISOString() })) }, null, 2);
const shotBlob = () => new Promise(ok => cv.toBlob(ok, 'image/png'));
$$('#dst button').forEach(b => b.onclick = () => { dst = b.dataset.d; $$('#dst button').forEach(x => x.classList.toggle('on', x === b)); $('#cfgTg').hidden = dst !== 'tg'; $('#cfgGh').hidden = dst !== 'gh'; $('#send').textContent = { tg: 'Telegramga yuborish', gh: 'Issue ochish', zip: 'ZIP yuklab olish', md: 'Nusxalash' }[dst]; store.set('dst', dst); });
$('#send').onclick = async () => {
  $('#res').textContent = 'Yuborilmoqda...'; $('#send').disabled = true; store.set('cfg', { tgTok: $('#tgTok').value.trim(), tgChat: $('#tgChat').value.trim(), ghTok: $('#ghTok').value.trim(), ghRepo: $('#ghRepo').value.trim() });
  try {
    if (dst === 'md') { await copyText(report(true)); $('#res').textContent = 'Markdown nusxalandi'; }
    else if (dst === 'zip') { const z = new JSZip(); if ($('#incShot').checked) z.file('skrinshot.png', await shotBlob()); z.file('hisobot.md', report(true)); z.file('loglar.json', fullLog()); download(`xato-${new URL(env.url).hostname}-${Date.now()}.zip`, await z.generateAsync({ type: 'blob' })); $('#res').textContent = 'ZIP yuklandi'; }
    else if (dst === 'tg') { const T = $('#tgTok').value.trim(), C = $('#tgChat').value.trim(); if (!T || !C) throw new Error('Token va chat ID kiriting'); const api = m => `https://api.telegram.org/bot${T}/${m}`;
      const txt = report(false); const fd = new FormData(); fd.append('chat_id', C);
      if ($('#incShot').checked) { fd.append('photo', await shotBlob(), 'skrinshot.png'); fd.append('caption', txt.slice(0, 1000)); const r = await (await fetch(api('sendPhoto'), { method: 'POST', body: fd })).json(); if (!r.ok) throw new Error(r.description); }
      if (!$('#incShot').checked || txt.length > 1000) { const r = await (await fetch(api('sendMessage'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: C, text: txt.slice(0, 4000), disable_web_page_preview: true }) })).json(); if (!r.ok) throw new Error(r.description); }
      const d = new FormData(); d.append('chat_id', C); d.append('document', new Blob([fullLog()], { type: 'application/json' }), 'loglar.json'); await fetch(api('sendDocument'), { method: 'POST', body: d });
      $('#res').innerHTML = '<span style="color:var(--ok)">✓ Telegramga yuborildi</span>'; }
    else { const T = $('#ghTok').value.trim(), R = $('#ghRepo').value.trim(); if (!T || !/^[\w.-]+\/[\w.-]+$/.test(R)) throw new Error('Token va egasi/repo kiriting');
      const body = report(true) + `\n\n<details><summary>To'liq loglar</summary>\n\n\`\`\`json\n${fullLog().slice(0, 50000)}\n\`\`\`\n</details>\n\n> Skrinshot: hisobot ZIP'ini yuklab, issue'ga sudrab tashlang.`;
      const r = await fetch(`https://api.github.com/repos/${R}/issues`, { method: 'POST', headers: { authorization: 'Bearer ' + T, accept: 'application/vnd.github+json', 'content-type': 'application/json' }, body: JSON.stringify({ title: $('#title').value || 'Xato: ' + new URL(env.url).pathname, body, labels: ['bug'] }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.message); if ($('#incShot').checked) download('skrinshot.png', await shotBlob());
      $('#res').innerHTML = `<span style="color:var(--ok)">✓ Ochildi:</span> <a href="${j.html_url}" target="_blank">#${j.number}</a> (skrinshot yuklab olindi — issue'ga qo'shing)`; }
  } catch (e) { $('#res').innerHTML = `<span style="color:var(--bad)">Xato: ${esc(e.message)}</span>`; }
  $('#send').disabled = false;
};
(async () => {
  tab = await activeTab(); const c = await store.get('cfg', {}); $('#tgTok').value = c.tgTok || ''; $('#tgChat').value = c.tgChat || ''; $('#ghTok').value = c.ghTok || ''; $('#ghRepo').value = c.ghRepo || '';
  $(`#dst [data-d="${await store.get('dst', 'tg')}"]`).click();
  try { const u = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }); img = new Image(); img.src = u; await img.decode(); cv.width = img.width; cv.height = img.height; paint(); } catch { $('.shot').innerHTML = '<div class="empty">Skrinshot olinmadi</div>'; $('#incShot').checked = false; }
  try { const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: () => ({ buf: window.__bugBuf || { con: [], net: [] }, env: { url: location.href, ua: navigator.userAgent, vp: innerWidth + '×' + innerHeight, dpr: devicePixelRatio, lang: navigator.language, ref: document.referrer, mem: navigator.deviceMemory, online: navigator.onLine } }) });
    buf = result.buf; env = result.env; } catch { env = { url: tab.url, ua: navigator.userAgent, vp: '?', dpr: devicePixelRatio, lang: navigator.language }; }
  const ne = buf.con.filter(c => c.l === 'error').length, nw = buf.con.filter(c => c.l === 'warn').length;
  $('#sum').innerHTML = `Konsol: <b style="color:${ne ? 'var(--bad)' : 'inherit'}">${ne} xato</b>, ${nw} ogohlantirish, jami ${buf.con.length} · Tarmoq: <b style="color:${buf.net.length ? 'var(--bad)' : 'inherit'}">${buf.net.length} muvaffaqiyatsiz</b> · ${esc(env.vp)}`;
  $('#title').focus();
})();
