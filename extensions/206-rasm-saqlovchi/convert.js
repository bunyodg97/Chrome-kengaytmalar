// Rasmni chizib, boshqa formatga o'tkazish (DOM bor sahifalarda: offscreen, tahrir oynasi)
import { FORMATS } from './common.js';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    img.src = src;
  });
}

// SVG kabi o'lchamsiz rasmlar uchun ham o'lcham topamiz
export function naturalSize(img) {
  let w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) { w = 1024; h = 1024; }
  return { w, h };
}

/**
 * opts: { fmt, quality, bg, width, height, rotate (0/90/180/270), flipH, flipV }
 * qaytaradi: Blob
 */
export function render(img, opts) {
  const f = FORMATS[opts.fmt] || FORMATS.png;
  const nat = naturalSize(img);
  const w = Math.max(1, Math.round(opts.width || nat.w));
  const h = Math.max(1, Math.round(opts.height || nat.h));
  const rot = ((opts.rotate || 0) % 360 + 360) % 360;
  const side = rot === 90 || rot === 270;

  const c = document.createElement('canvas');
  c.width = side ? h : w;
  c.height = side ? w : h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  if (f.mime === 'image/jpeg') { g.fillStyle = opts.bg || '#ffffff'; g.fillRect(0, 0, c.width, c.height); }
  g.translate(c.width / 2, c.height / 2);
  g.rotate(rot * Math.PI / 180);
  g.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  g.drawImage(img, -w / 2, -h / 2, w, h);

  return new Promise((resolve, reject) =>
    c.toBlob(b => b ? resolve(b) : reject(new Error('Konvertatsiya xatosi')), f.mime, f.lossy ? (opts.quality ?? 0.92) : undefined));
}

export const blobToDataURL = blob => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result);
  fr.onerror = () => rej(fr.error);
  fr.readAsDataURL(blob);
});
