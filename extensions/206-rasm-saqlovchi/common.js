export const FORMATS = {
  jpg:  { mime: 'image/jpeg', ext: 'jpg',  name: 'JPG',  lossy: true },
  png:  { mime: 'image/png',  ext: 'png',  name: 'PNG',  lossy: false },
  webp: { mime: 'image/webp', ext: 'webp', name: 'WebP', lossy: true }
};

export const DEFAULTS = {
  quality: 0.92,        // JPG/WebP sifati
  bg: '#ffffff',        // JPG uchun shaffof joylar rangi
  folder: 'Rasmlar',    // Yuklamalar ichidagi papka ('' — to'g'ridan-to'g'ri)
  saveAs: false,        // har safar joyni so'rash
  minSize: 80,          // galereyada eng kichik o'lcham (px)
  zip: true             // ko'p rasmni ZIP qilib
};

export async function getSettings() {
  const { settings = {} } = await chrome.storage.sync.get('settings');
  return { ...DEFAULTS, ...settings };
}
export const saveSettings = s => chrome.storage.sync.set({ settings: s });

// URL dan fayl nomi: ".../IMG_2024-01.webp?x=1" → "IMG_2024-01"
export function baseName(src) {
  let name = '';
  try {
    const u = new URL(src);
    if (/^https?:$/.test(u.protocol)) name = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
  } catch {}
  name = name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|#%\x00-\x1f]+/g, '_').replace(/^[.\s_]+|[.\s_]+$/g, '').slice(0, 80);
  if (!name || name.length < 2) name = 'rasm-' + stamp();
  return name;
}
export function stamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
export function filePath(s, name) {
  const folder = (s.folder || '').replace(/[\\:*?"<>|]+/g, '').replace(/^\/+|\/+$/g, '');
  return folder ? `${folder}/${name}` : name;
}
export function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}
