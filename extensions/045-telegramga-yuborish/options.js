let c;
const save = () => chrome.storage.local.set({ cfg: c });
function render() { $('#chats').innerHTML = c.chats.map((ch, i) => `<div class="item"><span class="grow"><b>${esc(ch.name)}</b> <span class="muted small">${esc(ch.id)}</span></span><button class="ghost" data-t="${i}">Sinov xabari</button><button class="danger" data-d="${i}">✕</button></div>`).join('') || '<div class="muted small">Hali yo\'q</div>'; }
$('#chk').onclick = async () => { try { const me = await tg('getMe', {}, $('#token').value.trim()); c.token = $('#token').value.trim(); save(); $('#bot').innerHTML = `<span class="chip ok">Ulandi: @${esc(me.username)}</span>`; } catch (e) { $('#bot').textContent = 'Xato: ' + e.message; } };
$('#find').onclick = async () => {
  try { const ups = await tg('getUpdates', { limit: 50 }); const seen = {};
    ups.forEach(u => { const ch = (u.message || u.channel_post || u.my_chat_member || {}).chat; if (ch) seen[ch.id] = ch.title || [ch.first_name, ch.last_name].filter(Boolean).join(' ') || ch.username; });
    $('#found').innerHTML = Object.entries(seen).map(([id, n]) => `<div class="item"><span class="grow">${esc(n)} <span class="muted small">${id}</span></span><button data-a="${id}" data-n="${esc(n)}">Qo'shish</button></div>`).join('') || '<div class="muted small">Topilmadi — botga xabar yozganingizni tekshiring.</div>';
  } catch (e) { $('#found').textContent = 'Xato: ' + e.message; } };
document.addEventListener('click', async e => {
  const a = e.target.dataset;
  if (a.a) { if (!c.chats.some(x => x.id == a.a)) c.chats.push({ id: a.a, name: a.n }); save(); render(); }
  if (a.d !== undefined) { c.chats.splice(+a.d, 1); save(); render(); }
  if (a.t !== undefined) { try { await tg('sendMessage', { chat_id: c.chats[+a.t].id, text: '✅ Kengaytma ulandi!' }); toast('Yuborildi'); } catch (er) { toast(er.message); } }
});
cfg().then(x => { c = x; $('#token').value = c.token; render(); });
