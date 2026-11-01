async function cfg() { return (await chrome.storage.local.get('cfg')).cfg || { token: '', chats: [] }; }
async function tg(method, body, token) {
  token = token || (await cfg()).token; if (!token) throw new Error('Sozlamalarda bot tokenini kiriting');
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json(); if (!j.ok) throw new Error(j.description || 'Telegram xatosi'); return j.result;
}
const escH = s => String(s ?? '').replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
async function sendTo(chatId, kind, d) {
  if (kind === 'photo') return tg('sendPhoto', { chat_id: chatId, photo: d.src, caption: (d.note ? d.note + '\n' : '') + (d.page || '') });
  let text = '';
  if (kind === 'page') text = `<b>${escH(d.title)}</b>\n${escH(d.url)}`;
  if (kind === 'text') text = `${escH(d.text)}\n\n<i>${escH(d.title || '')}</i>\n${escH(d.url)}`;
  if (kind === 'link') text = `${escH(d.text || '')}\n${escH(d.link)}`;
  if (d.note) text = escH(d.note) + '\n\n' + text;
  return tg('sendMessage', { chat_id: chatId, text: text.slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: kind === 'text' });
}
