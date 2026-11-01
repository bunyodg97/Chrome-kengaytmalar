let box, timer;
const ago = t => { const s = (Date.now() - new Date(t)) / 1000; return s < 60 ? 'hozirgina' : s < 3600 ? Math.round(s / 60) + ' daq oldin' : Math.round(s / 3600) + ' soat oldin'; };
async function home() {
  box = await getBox();
  if (!box) { $('#app').innerHTML = `<p>Saytlarda ro'yxatdan o'tish uchun asosiy pochtangiz o'rniga bir martalik manzildan foydalaning.</p><button id="new">Manzil yaratish</button><p class="muted small">Xizmat: mail.tm. Xatlar bir necha kundan keyin o'chadi — muhim akkauntlar uchun ishlatmang.</p>`; $('#new').onclick = make; return; }
  $('#app').innerHTML = `<div class="addr" id="addr" title="Nusxalash uchun bosing">${esc(box.address)}</div>
    <div class="row"><button class="grow" id="copy">Nusxalash</button><button class="ghost" id="new">Yangi manzil</button><button class="danger" id="del">O'chirish</button></div>
    <div class="row between"><b class="small">Kiruvchi xatlar</b><span class="muted small" id="st">tekshirilmoqda…</span></div><div class="list" id="inbox"></div>
    <p class="muted small">Formadagi email maydonida o'ng tugma → «Vaqtinchalik email manzilni qo'yish».</p>`;
  $('#addr').onclick = $('#copy').onclick = () => copyText(box.address);
  $('#new').onclick = make;
  let arm = false; $('#del').onclick = async () => { if (!arm) { arm = true; $('#del').textContent = 'Tasdiqlang'; return; } try { await call('/accounts/' + box.id, { method: 'DELETE' }, box.token); } catch { } await chrome.storage.local.remove('box'); chrome.action.setBadgeText({ text: '' }); home(); };
  inbox(); clearInterval(timer); timer = setInterval(inbox, 5000);
}
async function make() { $('#app').innerHTML = '<div class="empty">Yaratilmoqda…</div>'; try { box = await createAccount(); } catch (e) { $('#app').innerHTML = `<div class="empty">${esc(e.message)}</div><button id="new">Qayta urinish</button>`; $('#new').onclick = make; return; } home(); }
async function inbox() {
  if (!$('#inbox')) return;
  try { const ms = await messages(box); $('#st').textContent = 'yangilandi ' + new Date().toLocaleTimeString('uz-UZ');
    $('#inbox').innerHTML = ms.map(m => `<div class="mail ${m.seen ? '' : 'new'}" data-id="${m.id}"><b>${esc(m.subject || '(mavzusiz)')}</b><span>${esc(m.from?.name || '')} &lt;${esc(m.from?.address || '')}&gt; · ${ago(m.createdAt)}</span><span>${esc((m.intro || '').slice(0, 90))}</span></div>`).join('') || '<div class="empty">Hali xat yo\'q. Har 5 soniyada tekshiriladi.</div>';
    chrome.action.setBadgeText({ text: ms.filter(m => !m.seen).length ? String(ms.filter(m => !m.seen).length) : '' });
  } catch (e) { $('#st').textContent = e.message; }
}
document.addEventListener('click', async e => {
  const it = e.target.closest('.mail'); if (!it) return;
  clearInterval(timer);
  const m = await call('/messages/' + it.dataset.id, {}, box.token);
  call('/messages/' + it.dataset.id, { method: 'PATCH', body: JSON.stringify({ seen: true }), headers: { 'content-type': 'application/merge-patch+json' } }, box.token).catch(() => {});
  const text = (m.text || '') + ' ' + (m.html || []).join(' ').replace(/<[^>]+>/g, ' ');
  const code = (text.match(/\b(\d{4,8})\b/) || [])[1];
  $('#app').innerHTML = `<button class="ghost" id="back" style="align-self:flex-start">← Orqaga</button><b>${esc(m.subject || '(mavzusiz)')}</b><div class="muted small">${esc(m.from?.address || '')} · ${new Date(m.createdAt).toLocaleString('uz-UZ')}</div>
    ${code ? `<div class="card"><div class="muted small">Tasdiqlash kodi bo'lishi mumkin (bosing — nusxalanadi)</div><div class="code" id="code">${code}</div></div>` : ''}
    <iframe sandbox="allow-popups allow-popups-to-escape-sandbox" id="fr"></iframe>`;
  $('#fr').srcdoc = '<base target="_blank"><meta charset="utf-8">' + ((m.html && m.html.join('')) || `<pre style="white-space:pre-wrap;font-family:sans-serif">${esc(m.text || '')}</pre>`);
  $('#back').onclick = home; if (code) $('#code').onclick = () => copyText(code);
});
$('#rf').onclick = () => inbox();
home();
