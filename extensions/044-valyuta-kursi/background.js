importScripts('ru.js', 'about-bg.js');
async function load(force) {
  const o = await chrome.storage.local.get(['rates', 't']);
  if (!force && o.rates && Date.now() - o.t < 3 * 3600e3) return o.rates;
  try {
    const j = await (await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/')).json();
    const rates = {}; j.forEach(r => rates[r.Ccy] = { rate: parseFloat(r.Rate) / (parseFloat(r.Nominal) || 1), diff: parseFloat(r.Diff), name: r.CcyNm_UZ, date: r.Date });
    await chrome.storage.local.set({ rates, t: Date.now() });
    const u = rates.USD; chrome.action.setBadgeText({ text: u ? Math.round(u.rate / 10) / 100 + 'k' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' }); chrome.action.setTitle({ title: `1 $ = ${u.rate.toLocaleString('ru-RU')} so'm (${u.date})` });
    return rates;
  } catch { return o.rates || {}; }
}
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('r', { periodInMinutes: 180 }); load(true);
  chrome.contextMenus.create({ id: 'conv', title: "«%s» — so'mga o'girish", contexts: ['selection'] }); });
chrome.runtime.onStartup.addListener(() => load(true));
chrome.alarms.onAlarm.addListener(() => load(true));
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m.cmd === 'rates') { load(m.force).then(reply); return true; } });
chrome.contextMenus.onClicked.addListener((i, tab) => chrome.tabs.sendMessage(tab.id, { cmd: 'convert', text: i.selectionText }).catch(() => {}));
