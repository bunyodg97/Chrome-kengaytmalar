importScripts('ru.js', 'about-bg.js');
importScripts('core.js', 'scrapers.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let busy = Promise.resolve();

async function withTab(url, fn) {
  let tab;
  const wins = await chrome.windows.getAll({ windowTypes: ['normal'] });
  if (wins.length) tab = await chrome.tabs.create({ url, active: false, windowId: wins[0].id });
  else { const w = await chrome.windows.create({ url, state: 'minimized', focused: false }); tab = w.tabs[0]; }
  try {
    await new Promise(ok => { const t = setTimeout(ok, 25000); const l = (id, ch) => { if (id === tab.id && ch.status === 'complete') { clearTimeout(t); chrome.tabs.onUpdated.removeListener(l); ok(); } }; chrome.tabs.onUpdated.addListener(l); });
    return await fn(tab.id);
  } finally { chrome.tabs.remove(tab.id).catch(() => {}); }
}
async function fromShop(st, q) {
  return withTab(searchUrl(st, q), async id => {
    const [r] = await chrome.scripting.executeScript({ target: { tabId: id }, func: scrapeStore, args: [2, st.links, st.id] });
    return r?.result || [];
  });
}
async function fromOlx(q, st) {
  const items = [];
  try {
    for (let off = 0; off < 100; off += 50) {
      const r = await fetch(`https://www.olx.uz/api/v1/offers/?offset=${off}&limit=50&query=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('api ' + r.status);
      const j = await r.json(); const data = j.data || [];
      for (const o of data) {
        const pr = (o.params || []).find(x => x.key === 'price')?.value; if (!pr || !pr.value) continue;
        items.push({ src: 'olx', title: o.title, price: +pr.value, cur: /UYE|USD/i.test(pr.currency) ? 'USD' : 'UZS', url: o.url, neg: !!pr.negotiable,
          loc: o.location?.city?.name || '', top: !!o.promotion?.top_ad, img: o.photos?.[0]?.link?.replace('{width}', '200').replace('{height}', '200') || '', date: o.created_time || o.last_refresh_time });
      }
      if (data.length < 50) break;
    }
    if (items.length) return items;
  } catch { }
  // API ishlamasa — sahifadan o'qiymiz
  return withTab(searchUrl(st, q), async id => { await sleep(1500); const [r] = await chrome.scripting.executeScript({ target: { tabId: id }, func: scrapeOlxDom }); return r?.result || []; });
}
async function gather(p) {
  const rate = await usdRate(), stores = (await getStores()).filter(st => storeOn(p, st.id, st));
  // bir vaqtda ko'pi bilan 3 ta sayt ochiladi
  const res = {}, queue = [...stores];
  await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) { const st = queue.shift();
    try { res[st.id] = st.kind === 'olx' ? await fromOlx(p.query, st) : await fromShop(st, p.query); } catch (e) { res[st.id] = { err: e.message }; } } }));
  const errs = [], rawBy = {}, raw = [];
  for (const st of stores) { const r = res[st.id]; if (!Array.isArray(r)) { errs.push(`${st.name}: ${r?.err || 'javob yo\'q'}`); rawBy[st.id] = 0; continue; } rawBy[st.id] = r.length; if (!r.length) errs.push(`${st.name}: hech narsa o'qilmadi (sahifa tuzilishi o'zgargan bo'lishi mumkin)`); raw.push(...r); }
  const items = filterItems(raw, p, rate).sort((a, b) => a.uzs - b.uzs), trim = p.trim !== false;
  const by = {}; for (const st of stores) by[st.id] = stats(items.filter(i => i.src === st.id), p.myPrice, trim);
  return { t: Date.now(), raw: raw.length, rawBy, items, rate, errs, stats: stats(items, p.myPrice, trim), by, stores: stores.map(s => s.id) };
}
async function check(id, auto) {
  const run = async () => {
    const { products = [] } = await chrome.storage.local.get('products'); const p = products.find(x => x.id === id); if (!p) return null;
    await chrome.storage.session.set({ progress: { id, name: p.name } });
    const prevMin = p.last?.stats?.min;
    const res = await gather(p);
    const all = (await chrome.storage.local.get('products')).products || []; const q = all.find(x => x.id === id); if (!q) return null;
    q.last = res; q.history = [...(q.history || []), { t: res.t, n: res.stats.n, min: res.stats.min, med: res.stats.med, max: res.stats.max, my: q.myPrice }].slice(-200);
    await chrome.storage.local.set({ products: all });
    await chrome.storage.session.set({ progress: null });
    if (auto && q.myPrice && res.stats.n && res.stats.min < q.myPrice && res.stats.min !== prevMin)
      chrome.notifications.create('rn' + id + Date.now(), { type: 'basic', iconUrl: 'icons/128.png', title: `${q.name}: arzonroq raqobatchi bor`, message: `Eng arzon: ${som(res.stats.min)} (siz: ${som(q.myPrice)}). Sizdan arzon: ${res.stats.cheaper} ta.`, priority: 1 });
    return q;
  };
  const pr = busy.then(run); busy = pr.catch(() => {}); return pr;
}
async function checkAll(auto) {
  const { products = [] } = await chrome.storage.local.get('products');
  for (const p of products) { await check(p.id, auto).catch(() => {}); await sleep(2500); }
}
chrome.runtime.onMessage.addListener((m, s, reply) => {
  if (m.cmd === 'check') { check(m.id).then(reply).catch(e => reply({ error: e.message })); return true; }
  if (m.cmd === 'checkAll') { checkAll(false).then(() => reply(1)); return true; }
  if (m.cmd === 'testStore') { (async () => { const st = m.store; const r = st.kind === 'olx' ? await fromOlx(m.query, st) : await fromShop(st, m.query); reply({ n: r.length, sample: r.slice(0, 5) }); })().catch(e => reply({ error: e.message })); return true; }
  if (m.cmd === 'quick') { gather({ query: m.query, myPrice: m.price, strict: true }).then(reply).catch(e => reply({ error: e.message })); return true; }
  if (m.cmd === 'open') { (m.prefill ? chrome.storage.session.set({ prefill: m.prefill }) : Promise.resolve()).then(() => chrome.tabs.create({ url: 'app.html' + (m.hash || '') })); }
});
async function schedule() {
  const { every = 0 } = await chrome.storage.local.get('every');
  await chrome.alarms.clear('auto'); if (every) chrome.alarms.create('auto', { periodInMinutes: every * 60, delayInMinutes: 1 });
}
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'auto') checkAll(true); });
chrome.runtime.onInstalled.addListener(schedule);
chrome.storage.onChanged.addListener(c => { if (c.every) schedule(); });
chrome.notifications.onClicked.addListener(() => chrome.tabs.create({ url: 'app.html' }));
