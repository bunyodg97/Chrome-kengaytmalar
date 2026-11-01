// Fon xizmati DOM ga ega emas — rasmni shu yashirin sahifa chizib, formatini o'zgartiradi
import { loadImage, render, blobToDataURL, naturalSize } from './convert.js';

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.target !== 'offscreen' || msg.type !== 'convert') return;
  (async () => {
    const img = await loadImage(msg.dataUrl);
    const blob = await render(img, msg.opts);
    const { w, h } = naturalSize(img);
    reply({ dataUrl: await blobToDataURL(blob), size: blob.size, w, h });
  })().catch(e => reply({ error: e.message }));
  return true;
});
