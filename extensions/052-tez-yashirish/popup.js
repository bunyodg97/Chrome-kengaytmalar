const DEF = { sites: ['youtube.com', 'instagram.com', 'tiktok.com', 'facebook.com', 'x.com', 'twitter.com', 'twitch.tv', 'vk.com', 'ok.ru', 'kinopoisk.ru', 'netflix.com', 'reddit.com', 'pinterest.com', 'web.telegram.org'], work: 'https://mail.google.com' };
let c;
const save = () => store.set('cfg', c);
(async () => {
  c = { ...DEF, ...(await store.get('cfg', {})) }; const h = await store.get('hidden', []);
  $('#work').value = c.work; $('#sites').value = c.sites.join('\n');
  $('#go').textContent = h.length ? `↩ ${h.length} ta tabni qaytarish` : '🙈 Hozir yashirish';
})();
$('#go').onclick = async () => { await chrome.runtime.sendMessage({ cmd: 'toggle' }); window.close(); };
$('#work').onchange = e => { c.work = e.target.value.trim(); save(); };
$('#sites').onchange = e => { c.sites = e.target.value.split('\n').map(s => s.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter(Boolean); save(); };
