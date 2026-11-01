let tab, host = '';
const KNOWN = /(analytics|tagmanager|facebook|doubleclick|yandex|mail\.ru|hotjar|clarity|segment|mixpanel|tiktok|criteo|adnxs|scorecard|pixel|track|metric|stat|counter|ads?\.)/i;
(async () => {
  tab = await activeTab();
  try { host = new URL(tab.url).hostname.replace(/^www\./, ''); } catch {}
  if (!/^https?:/.test(tab.url || '')) { $('.wrap').innerHTML = '<div class="empty">Oddiy veb-saytni oching.</div>'; return; }
  $('#host').textContent = host;
  const { on = true, allow = [] } = await chrome.storage.local.get(['on', 'allow']);
  $('#on').checked = on; $('#allow').textContent = allow.includes(host) ? 'Bloklashni qayta yoqish' : 'Shu saytda ruxsat berish';
  const info = await chrome.runtime.sendMessage({ cmd: 'info', tabId: tab.id });
  const cookies = await chrome.cookies.getAll({ url: tab.url });
  $('#bl').textContent = info.blocked; $('#tp').textContent = info.third.length; $('#ck').textContent = cookies.length;
  const susp = info.third.filter(([d]) => KNOWN.test(d)).length;
  const lv = info.blocked + susp * 2 + info.third.length / 3;
  $('#lvl').innerHTML = lv < 4 ? '<span class="chip ok">Past</span>' : lv < 12 ? '<span class="chip warn">O\'rta</span>' : '<span class="chip bad">Yuqori</span>';
  $('#list').innerHTML = info.third.length ? info.third.map(([d, n]) => `<div class="item"><span class="grow small" style="word-break:break-all">${esc(d)}</span>${KNOWN.test(d) ? '<span class="chip warn">kuzatuvchi</span>' : ''}<span class="chip">${n}</span></div>`).join('')
    : '<div class="muted small">Sahifani yangilang — ro\'yxat yuklanish paytida yig\'iladi.</div>';
})();
$('#on').onchange = e => chrome.storage.local.set({ on: e.target.checked });
$('#allow').onclick = async () => {
  const { allow = [] } = await chrome.storage.local.get('allow');
  await chrome.storage.local.set({ allow: allow.includes(host) ? allow.filter(x => x !== host) : [...allow, host] });
  chrome.tabs.reload(tab.id); window.close();
};
$('#delck').onclick = async () => {
  const cs = await chrome.cookies.getAll({ url: tab.url });
  for (const c of cs) await chrome.cookies.remove({ url: (c.secure ? 'https://' : 'http://') + c.domain.replace(/^\./, '') + c.path, name: c.name, storeId: c.storeId });
  toast(cs.length + ' ta cookie o\'chirildi'); $('#ck').textContent = '0';
};
