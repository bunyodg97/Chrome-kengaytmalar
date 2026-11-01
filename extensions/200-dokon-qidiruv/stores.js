// Do'konlar ro'yxati. {q} — qidiruv so'zi. ok: true — manzil tekshirilgan.
// Manzil o'zgargan bo'lsa — Sozlamalarda tahrirlash mumkin.
self.DEFAULT_STORES = [
  { id: 'uzum', name: 'Uzum Market', url: 'https://uzum.uz/ru/search?query={q}', on: true, ok: true },
  { id: 'olx', name: 'OLX.uz', url: 'https://www.olx.uz/list/q-{q-}/', on: true, ok: true },
  { id: 'wb', name: 'Wildberries', url: 'https://www.wildberries.uz/catalog/0/search.aspx?search={q}', on: true },
  { id: 'ym', name: 'Yandex Market', url: 'https://market.yandex.uz/search?text={q}', on: true },
  { id: 'asaxiy', name: 'Asaxiy', url: 'https://asaxiy.uz/product?key={q}', on: true },
  { id: 'ali', name: 'AliExpress', url: 'https://www.aliexpress.com/wholesale?SearchText={q}', on: true },
  { id: 'ozon', name: 'Ozon', url: 'https://www.ozon.ru/search/?text={q}', on: false },
  { id: 'temu', name: 'Temu', url: 'https://www.temu.com/search_result.html?search_key={q}', on: false },
  { id: 'texnomart', name: 'Texnomart', url: 'https://texnomart.uz/ru/search?q={q}', on: false },
  { id: 'mediapark', name: 'Mediapark', url: 'https://mediapark.uz/search?q={q}', on: false },
  { id: 'olcha', name: 'Olcha', url: 'https://olcha.uz/ru/search?q={q}', on: false },
  { id: 'google', name: 'Google Shopping', url: 'https://www.google.com/search?tbm=shop&q={q}', on: false }
];

// {q} — oddiy kodlash, {q-} — bo'sh joylar "-" bilan (OLX uslubi)
self.buildUrl = (tpl, q) => tpl
  .replace(/\{q-\}/g, encodeURIComponent(q.trim().replace(/\s+/g, '-')))
  .replace(/\{q\}/g, encodeURIComponent(q.trim()));

self.getStores = async () => {
  const { stores } = await chrome.storage.sync.get('stores');
  return stores && stores.length ? stores : self.DEFAULT_STORES.map(s => ({ ...s }));
};

// Tanlangan do'konlarni bitta tab guruhida ochish
self.searchAll = async (q, ids) => {
  q = (q || '').trim();
  if (!q) return 0;
  const stores = (await self.getStores()).filter(s => ids ? ids.includes(s.id) : s.on);
  if (!stores.length) return 0;
  const { history = [] } = await chrome.storage.local.get('history');
  await chrome.storage.local.set({ history: [q, ...history.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, 8) });
  const win = await chrome.windows.getLastFocused().catch(() => null);
  const tabIds = [];
  for (const [i, s] of stores.entries()) {
    const t = await chrome.tabs.create({ url: self.buildUrl(s.url, q), active: i === 0, windowId: win?.id });
    tabIds.push(t.id);
  }
  try {
    const gid = await chrome.tabs.group({ tabIds, createProperties: win ? { windowId: win.id } : undefined });
    await chrome.tabGroups.update(gid, { title: `🔍 ${q.slice(0, 24)}`, color: 'purple' });
  } catch {}
  return stores.length;
};
