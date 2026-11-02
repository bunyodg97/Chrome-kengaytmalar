import './ru.js';
import './about-bg.js';
import { FORMATS, getSettings, baseName, filePath, stamp } from './common.js';
import { makeZip } from './zip.js';

// ---------- Kontekst menyu ----------
function buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'root', title: 'Rasmni saqlash', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'jpg', parentId: 'root', title: 'JPG qilib saqlash', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'png', parentId: 'root', title: 'PNG qilib saqlash', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'webp', parentId: 'root', title: 'WebP qilib saqlash', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'sep', parentId: 'root', type: 'separator', contexts: ['image'] });
    chrome.contextMenus.create({ id: 'edit', parentId: 'root', title: "✏️ Tahrirlab saqlash (o'lcham, sifat, burish)…", contexts: ['image'] });
  });
}
chrome.runtime.onInstalled.addListener(buildMenus);
chrome.runtime.onStartup.addListener(buildMenus);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const src = info.srcUrl;
  if (!src) return;
  if (info.menuItemId === 'edit') {
    const id = crypto.randomUUID();
    await chrome.storage.session.set({ [`edit:${id}`]: { src, tabId: tab?.id } });
    chrome.tabs.create({ url: chrome.runtime.getURL(`edit.html#${id}`), index: tab ? tab.index + 1 : undefined });
    return;
  }
  if (FORMATS[info.menuItemId]) {
    try { await saveOne(src, info.menuItemId, tab?.id); }
    catch (e) { fail(e); }
  }
});

// ---------- Rasmni olish ----------
const blobToDataURL = blob => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result);
  fr.onerror = () => rej(fr.error);
  fr.readAsDataURL(blob);
});

// 1) To'g'ridan-to'g'ri yuklash; 2) bo'lmasa — sahifaning o'zi ichida (cookie va referer bilan)
async function fetchImage(src, tabId) {
  if (src.startsWith('data:')) return { dataUrl: src, type: src.slice(5, src.indexOf(';')), size: Math.round(src.length * 0.75) };
  if (!src.startsWith('blob:')) {
    try {
      const r = await fetch(src, { credentials: 'include' });
      if (r.ok) {
        const b = await r.blob();
        if (b.size > 0) return { dataUrl: await blobToDataURL(b), type: b.type, size: b.size };
      }
    } catch {}
  }
  if (tabId == null) throw new Error("Rasmni yuklab bo'lmadi");
  const [res] = await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: async (u) => {
      try {
        const r = await fetch(u, { credentials: 'include' });
        const b = await r.blob();
        return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok({ dataUrl: fr.result, type: b.type, size: b.size }); fr.readAsDataURL(b); });
      } catch (e) { return { error: String(e) }; }
    },
    args: [src]
  });
  if (!res?.result || res.result.error) throw new Error("Sayt rasmni yuklab olishga ruxsat bermadi");
  return res.result;
}

// ---------- Konvertatsiya (offscreen hujjatda) ----------
async function ensureOffscreen() {
  const has = (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;
  if (!has) await chrome.offscreen.createDocument({
    url: 'offscreen.html', reasons: ['BLOBS'], justification: 'Rasmni boshqa formatga o\'tkazish'
  });
}
async function convert(src, fmt, tabId, s) {
  const orig = await fetchImage(src, tabId);
  // Format bir xil bo'lsa — qayta siqmasdan aslini saqlaymiz (sifat yo'qolmaydi)
  if (orig.type === FORMATS[fmt].mime) return { dataUrl: orig.dataUrl, size: orig.size };
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({
    target: 'offscreen', type: 'convert', dataUrl: orig.dataUrl,
    opts: { fmt, quality: s.quality, bg: s.bg }
  });
  if (!res || res.error) throw new Error(res?.error || 'Konvertatsiya xatosi');
  return res;
}

async function saveOne(src, fmt, tabId) {
  const s = await getSettings();
  const out = await convert(src, fmt, tabId, s);
  await chrome.downloads.download({
    url: out.dataUrl,
    filename: filePath(s, `${baseName(src)}.${FORMATS[fmt].ext}`),
    saveAs: s.saveAs, conflictAction: 'uniquify'
  });
}

// ---------- Ko'p rasmni yuklash ----------
async function saveMany(items, fmt, tabId) {
  const s = await getSettings();
  const ext = FORMATS[fmt].ext;
  let done = 0, failed = 0;
  const progress = () => chrome.action.setBadgeText({ text: `${done + failed}/${items.length}` });
  await chrome.action.setBadgeBackgroundColor({ color: '#0e8ce9' });
  progress();

  const files = [];
  const used = new Set();
  for (const src of items) {
    try {
      const out = await convert(src, fmt, tabId, s);
      let name = baseName(src), n = 2;
      while (used.has(name)) name = `${baseName(src)}-${n++}`;
      used.add(name);
      if (s.zip && items.length > 1) {
        const data = new Uint8Array(await (await fetch(out.dataUrl)).arrayBuffer());
        files.push({ name: `${name}.${ext}`, data });
      } else {
        await chrome.downloads.download({ url: out.dataUrl, filename: filePath(s, `${name}.${ext}`), conflictAction: 'uniquify' });
      }
      done++;
    } catch { failed++; }
    progress();
  }

  if (files.length) {
    const zip = makeZip(files);
    const url = await blobToDataURL(new Blob([zip], { type: 'application/zip' }));
    let host = 'sahifa';
    try { host = new URL((await chrome.tabs.get(tabId)).url).hostname.replace(/^www\./, ''); } catch {}
    await chrome.downloads.download({ url, filename: filePath(s, `${host}-rasmlar-${stamp()}.zip`), saveAs: s.saveAs, conflictAction: 'uniquify' });
  }
  await chrome.action.setBadgeText({ text: '' });
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon128.png',
    title: `${done} ta rasm saqlandi`,
    message: failed ? `${failed} tasini yuklab bo'lmadi (sayt ruxsat bermadi).` : (files.length ? 'ZIP arxiv Yuklamalar papkasida.' : 'Rasmlar Yuklamalar papkasida.')
  });
}

function fail(e) {
  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: "Rasmni saqlab bo'lmadi", message: e.message || String(e) });
}

// ---------- Sahifalardan xabarlar ----------
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.target === 'offscreen') return;
  if (msg.type === 'fetch') {
    fetchImage(msg.src, msg.tabId).then(reply).catch(e => reply({ error: e.message }));
    return true;
  }
  if (msg.type === 'saveMany') {
    saveMany(msg.items, msg.fmt, msg.tabId).catch(fail);
    reply(true);
  }
});
